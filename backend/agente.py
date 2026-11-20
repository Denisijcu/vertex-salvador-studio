"""
agente.py — El bucle de agente de vertex-salvador-studio.

Un turno: el mensaje del usuario + el historial completo -> modelo -> (herramientas -> modelo)* -> respuesta.
Devuelve, además de la respuesta, lo que la interfaz necesita para que el usuario pueda comprobarla:
las herramientas usadas, los documentos consultados (panel de fuentes), las cifras sin respaldo y el veredicto
del Portero.
"""
from __future__ import annotations

import json
import re
import time

import httpx

import biblioteca
import config
import conversaciones
import lmstudio
from verificacion import cifras_sin_respaldo

# ── Llamadas a herramientas escritas en texto (formato nativo de Gemma 4) ─────────────────────────────
# Normalmente LM Studio las convierte en tool_calls estructurados. Si alguna vez llegan en el texto, se leen aquí.
RE_LLAMADA = re.compile(r"<\|tool_call\>call:([A-Za-z_]\w*)\{(.*?)\}<tool_call\|>", re.S)
COMILLA = '<|"|>'
RE_PENSAMIENTO = re.compile(r"<think>.*?</think>|<\|channel\>thought.*?<channel\|>", re.S)


def _argumentos_gemma(cuerpo: str) -> dict:
    """Lee 'clave:<|"|>texto<|"|>,otra:5' sin romperse con comas o dos puntos dentro del texto."""
    args, i, n = {}, 0, len(cuerpo)
    while i < n:
        while i < n and cuerpo[i] in " ,\n\t":
            i += 1
        j = cuerpo.find(":", i)
        if j == -1:
            break
        clave = cuerpo[i:j].strip()
        i = j + 1
        if cuerpo.startswith(COMILLA, i):
            fin = cuerpo.find(COMILLA, i + len(COMILLA))
            if fin == -1:
                fin = n
            args[clave] = cuerpo[i + len(COMILLA):fin]
            i = fin + len(COMILLA)
        else:
            fin = cuerpo.find(",", i)
            fin = n if fin == -1 else fin
            crudo = cuerpo[i:fin].strip()
            try:
                args[clave] = json.loads(crudo)
            except ValueError:
                args[clave] = crudo
            i = fin + 1
    return args


def llamadas_en_texto(texto: str) -> tuple[str, list[dict]]:
    llamadas = []
    for k, m in enumerate(RE_LLAMADA.finditer(texto or ""), 1):
        llamadas.append({"id": f"llamada_texto_{k}", "type": "function",
                         "function": {"name": m.group(1),
                                      "arguments": json.dumps(_argumentos_gemma(m.group(2)), ensure_ascii=False)}})
    return RE_LLAMADA.sub("", texto or "").strip(), llamadas


def limpiar(texto: str) -> str:
    texto = RE_PENSAMIENTO.sub("", texto or "")
    return texto.replace("<tool_response|>", "").replace("<|tool_response>", "").strip()


# ── Historial que se manda al modelo ──────────────────────────────────────────────────────────────────
def _para_modelo(mensajes: list[dict]) -> list[dict]:
    """El historial completo, pero los resultados de herramientas de turnos viejos se resumen para que la
    conversación quepa en el contexto. Los del turno actual y el anterior van enteros."""
    usuarios = [i for i, m in enumerate(mensajes) if m["role"] == "user"]
    corte = usuarios[-2] if len(usuarios) >= 2 else 0
    out = []
    for i, m in enumerate(mensajes):
        if m["role"] == "tool" and i < corte:
            out.append({**m, "content": json.dumps({"nota": "Resultado de un turno anterior, omitido para ahorrar "
                                                    "espacio. Si lo necesitas, vuelve a llamar a la herramienta."},
                                                   ensure_ascii=False)})
        else:
            out.append(m)
    return out


def _desborde(error) -> bool:
    t = str(error).lower()
    return "context" in t and ("exceed" in t or "length" in t or "size" in t)


def _veredicto(datos: dict) -> dict:
    v = datos.get("vsrt") or {}
    if (datos.get("choices") or [{}])[0].get("finish_reason") == "content_filter" or v.get("verdict") == "red":
        return {"veredicto": "rojo", "detalle": [f.get("message") for f in v.get("findings", [])][:3]}
    if v.get("output_verdict") == "red":
        return {"veredicto": "rojo_salida", "detalle": []}
    return {"veredicto": "verde", "detalle": []}


# ── Texto visible mientras se escribe ───────────────────────────────────────────────────────────────
MARCAS_OCULTAS = ("<think>", "<|channel>thought", "<|tool_call>")


def visible_parcial(crudo: str) -> str:
    """Lo que se puede enseñar de una respuesta a medio escribir: sin pensamiento cerrado, y cortando donde
    empieza un pensamiento sin cerrar, una llamada a herramienta en texto o el principio de una marca."""
    t = RE_PENSAMIENTO.sub("", crudo)
    cortes = [t.find(m) for m in MARCAS_OCULTAS if m in t]
    if cortes:
        t = t[:min(cortes)]
    for m in MARCAS_OCULTAS:                         # "<thi" al final: puede ser el inicio de una marca
        for k in range(len(m) - 1, 0, -1):
            if t.endswith(m[:k]):
                t = t[:-k]
                break
    return t.replace("<tool_response|>", "").replace("<|tool_response>", "").lstrip()


# ── Un turno ──────────────────────────────────────────────────────────────────────────────────────────
async def turno(conv: dict, mensaje: str) -> dict:
    """Versión sin streaming (la usan evaluar.py y /api/chat): consume los eventos y devuelve el último."""
    final = None
    async for ev in turno_eventos(conv, mensaje, streaming=False):
        if ev["tipo"] == "fin":
            final = ev["turno"]
    return final


async def turno_eventos(conv: dict, mensaje: str, streaming: bool = True):
    """Genera los eventos de un turno para la interfaz:
    estado · pensando · texto(delta) · reinicio · herramienta · herramienta_fin · fin(turno)."""
    t0 = time.time()
    traza, resultados, fuentes, avisos = [], [], {}, []
    nuevos: list[dict] = [{"role": "user", "content": mensaje}]
    sistema = {"role": "system", "content": biblioteca.instruccion_sistema()}
    herramientas = biblioteca.herramientas_openai()
    portero = {"veredicto": "sin_portero", "detalle": []}

    def cierre(texto, **kw):
        return {"tipo": "fin", "turno": _fin(conv, nuevos, texto, traza, fuentes, avisos, portero, t0, **kw)}

    async with httpx.AsyncClient() as client:
        modelo = await lmstudio.buscar_modelo(client)
        if not modelo.get("ok"):
            yield cierre(modelo["mensaje"], error=True)
            return
        if not modelo.get("cargado"):
            yield {"tipo": "estado", "texto": "Cargando el modelo en LM Studio (puede tardar un minuto)…"}
            carga = await lmstudio.cargar(client, modelo["clave"])
            if not carga["ok"]:
                yield cierre(carga["mensaje"], error=True)
                return
            modelo = await lmstudio.buscar_modelo(client)
        if modelo.get("contexto") and modelo["contexto"] < config.CONTEXTO_MINIMO:
            avisos.append(f"El modelo está cargado con un contexto de {modelo['contexto']} tokens; se necesitan "
                          f"{config.CONTEXTO_MINIMO}. Recárguelo en LM Studio con Context Length {config.CONTEXTO_MINIMO} "
                          "o pulse «Recargar modelo» en la vista Estado.")
        id_modelo = modelo.get("id") or modelo["clave"]
        por_portero = await lmstudio.portero_activo(client)
        if por_portero:
            portero = {"veredicto": "verde", "detalle": []}
        # Por el Portero no hay streaming: él revisa la respuesta entera antes de dejarla pasar.
        en_vivo = streaming and not por_portero

        for _ in range(config.MAX_VUELTAS_HERRAMIENTAS):
            yield {"tipo": "pensando"}
            enviar = [sistema, *_para_modelo(conv["mensajes"] + nuevos)]
            datos = None
            try:
                if en_vivo:
                    crudo, enviado = "", ""
                    async for clase, valor in lmstudio.chat_stream(client, id_modelo, enviar, herramientas):
                        if clase == "delta":
                            crudo += valor
                            vis = visible_parcial(crudo)
                            if vis.startswith(enviado) and len(vis) > len(enviado):
                                yield {"tipo": "texto", "delta": vis[len(enviado):]}
                                enviado = vis
                        else:
                            datos = valor
                else:
                    datos = await lmstudio.chat(client, id_modelo, enviar, herramientas, por_portero)
            except (httpx.HTTPError, RuntimeError) as exc:
                destino = "El Portero" if por_portero else "LM Studio"
                yield cierre(f"{destino} no respondió: {exc}", error=True)
                return
            if not datos or ("error" in datos and "choices" not in datos):
                err = (datos or {}).get("error", "respuesta vacía")
                texto = ("La conversación ya no cabe en la memoria del modelo. Abra una conversación nueva para "
                         "seguir." if _desborde(err) else f"Error del modelo: {str(err)[:300]}")
                yield cierre(texto, error=True)
                return
            if por_portero:
                v = _veredicto(datos)
                if v["veredicto"] != "verde":
                    portero = v
                if v["veredicto"] == "rojo":
                    texto = ("El Portero bloqueó este mensaje porque detectó un posible intento de manipular al "
                             "modelo (por ejemplo, instrucciones escondidas en un documento).")
                    yield cierre(texto, bloqueado=True)
                    return

            msg = datos["choices"][0]["message"]
            texto = limpiar(msg.get("content") or "")
            llamadas = msg.get("tool_calls") or []
            if not llamadas:
                texto, llamadas = llamadas_en_texto(texto)
            if not llamadas:
                if datos["choices"][0].get("finish_reason") == "length":
                    avisos.append("La respuesta se cortó por largo. Pídale al modelo que siga, o una versión más corta.")
                faltan = cifras_sin_respaldo(texto, resultados + [mensaje])   # lo que dijo el usuario no se marca
                nuevos.append({"role": "assistant", "content": texto})
                yield cierre(texto, cifras=faltan)
                return

            yield {"tipo": "reinicio"}               # el texto previo a una llamada no es la respuesta
            nuevos.append({"role": "assistant", "content": texto, "tool_calls": llamadas})
            for ll in llamadas:
                nombre = ll["function"]["name"]
                try:
                    args = json.loads(ll["function"].get("arguments") or "{}")
                except ValueError:
                    args = {}
                yield {"tipo": "herramienta", "herramienta": nombre, "argumentos": args}
                ts = time.time()
                resultado = biblioteca.ejecutar(nombre, args)
                resultados.append(resultado)
                docs = biblioteca.documentos_en_resultado(resultado)
                for d in docs:
                    if d.get("doc_id"):
                        fuentes.setdefault(d["doc_id"], d)
                paso = {"herramienta": nombre, "argumentos": args, "ms": int((time.time() - ts) * 1000),
                        "documentos": [d.get("doc_id") for d in docs if d.get("doc_id")]}
                traza.append(paso)
                yield {"tipo": "herramienta_fin", **paso}
                nuevos.append({"role": "tool", "tool_call_id": ll.get("id", ""), "name": nombre,
                               "content": resultado})

    texto = "Llegué al límite de consultas de este turno sin terminar la respuesta. Pídame que siga."
    nuevos.append({"role": "assistant", "content": texto})
    yield cierre(texto)


def _fin(conv, nuevos, texto, traza, fuentes, avisos, portero, t0, cifras=None, error=False, bloqueado=False):
    turno_ui = {"pregunta": nuevos[0]["content"], "respuesta": texto, "herramientas": traza,
                "fuentes": list(fuentes.values()), "cifras_sin_respaldo": cifras or [], "avisos": avisos,
                "portero": portero, "error": error, "bloqueado": bloqueado,
                "segundos": round(time.time() - t0, 1)}
    if not error and not bloqueado:
        conv["mensajes"].extend(nuevos)          # los errores no ensucian el historial que ve el modelo
    if conv.get("titulo") == "Conversación nueva":
        conv["titulo"] = nuevos[0]["content"][:80]
    conv.setdefault("turnos", []).append(turno_ui)
    conversaciones.guardar(conv)
    return {"conversacion_id": conv["id"], **turno_ui}
