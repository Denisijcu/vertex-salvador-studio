"""
lmstudio.py — Conexión con LM Studio (y con el Portero, si está levantado).

- Encuentra el modelo de vertex-salvador entre los de LM Studio y comprueba su contexto cargado.
- Si no está cargado, lo carga con el contexto mínimo (8192) usando la API REST de LM Studio.
- Manda las peticiones de chat al Portero si responde; si no, directo a LM Studio.
"""
from __future__ import annotations

import json as _json
import time

import httpx

import config


async def _get(client: httpx.AsyncClient, url: str):
    try:
        r = await client.get(url, timeout=4)
        return r.json() if r.status_code == 200 else None
    except (httpx.HTTPError, ValueError):
        return None


async def portero_activo(client: httpx.AsyncClient) -> bool:
    if config.USAR_PORTERO == "no":
        return False
    return bool(await _get(client, f"{config.PORTERO_URL}/health"))


async def buscar_modelo(client: httpx.AsyncClient) -> dict:
    """Devuelve {'ok', 'clave', 'cargado', 'contexto', 'mensaje'} del modelo vertex-salvador en LM Studio."""
    datos = await _get(client, f"{config.LMSTUDIO_URL}/api/v1/models")
    if datos is None:
        if await _get(client, f"{config.LMSTUDIO_URL}/v1/models") is None:
            return {"ok": False, "lmstudio": False, "mensaje":
                    "LM Studio no responde. Ábralo y active el servidor local (Developer → Start Server, puerto 1234)."}
        return {"ok": False, "lmstudio": True, "mensaje":
                "Esta versión de LM Studio no tiene la API REST /api/v1. Actualice LM Studio."}
    buscado = config.MODELO_BUSCADO.lower()
    candidatos = [m for m in datos.get("models", [])
                  if m.get("type", "llm") == "llm" and buscado in (m.get("key") or "").lower()]
    if not candidatos:
        return {"ok": False, "lmstudio": True, "mensaje":
                f"No encuentro el modelo '{config.MODELO_BUSCADO}' en LM Studio. Descárguelo y colóquelo en la "
                "carpeta de modelos (ver la guía, sección 3.2)."}
    m = candidatos[0]
    instancias = m.get("loaded_instances") or []
    if not instancias:
        return {"ok": True, "lmstudio": True, "clave": m["key"], "cargado": False, "contexto": 0,
                "maximo": m.get("max_context_length")}
    inst = instancias[0]
    ctx = int((inst.get("config") or {}).get("context_length") or 0)
    return {"ok": True, "lmstudio": True, "clave": m["key"], "id": inst.get("id") or m["key"], "cargado": True,
            "contexto": ctx, "maximo": m.get("max_context_length")}


async def cargar(client: httpx.AsyncClient, clave: str) -> dict:
    """Carga el modelo con el contexto mínimo. Tarda lo que tarde LM Studio en cargarlo (segundos o un minuto)."""
    try:
        r = await client.post(f"{config.LMSTUDIO_URL}/api/v1/models/load",
                              json={"model": clave, "context_length": config.CONTEXTO_MINIMO,
                                    "echo_load_config": True}, timeout=300)
        datos = r.json()
    except (httpx.HTTPError, ValueError) as exc:
        return {"ok": False, "mensaje": f"No pude cargar el modelo: {exc}"}
    if r.status_code != 200:
        return {"ok": False, "mensaje": f"LM Studio no cargó el modelo ({r.status_code}): {str(datos)[:200]}"}
    return {"ok": True, "id": datos.get("instance_id") or clave, "segundos": datos.get("load_time_seconds"),
            "config": datos.get("load_config")}


async def descargar(client: httpx.AsyncClient, instancia: str) -> bool:
    try:
        r = await client.post(f"{config.LMSTUDIO_URL}/api/v1/models/unload", json={"instance_id": instancia}, timeout=60)
        return r.status_code == 200
    except httpx.HTTPError:
        return False


async def chat(client: httpx.AsyncClient, modelo: str, mensajes: list[dict], herramientas: list[dict] | None,
               por_portero: bool) -> dict:
    base = config.PORTERO_URL if por_portero else config.LMSTUDIO_URL
    payload = {"model": modelo, "messages": mensajes, "temperature": config.TEMPERATURA,
               "repeat_penalty": config.PENALIZACION_REPETICION, "max_tokens": config.MAX_TOKENS_RESPUESTA,
               "stream": False}
    if herramientas:
        payload["tools"] = herramientas
    t0 = time.time()
    r = await client.post(f"{base}/v1/chat/completions", json=payload, timeout=300)
    try:
        datos = r.json()
    except ValueError:
        raise RuntimeError(f"{'El Portero' if por_portero else 'LM Studio'} respondió {r.status_code} sin JSON")
    datos["_ms"] = int((time.time() - t0) * 1000)
    return datos


async def chat_stream(client: httpx.AsyncClient, modelo: str, mensajes: list[dict], herramientas: list[dict] | None):
    """Igual que chat(), pero directo a LM Studio con stream=True. Va soltando ("delta", texto) y al final
    ("fin", datos) con el mismo formato que devuelve chat(): choices[0].message con content y tool_calls."""
    payload = {"model": modelo, "messages": mensajes, "temperature": config.TEMPERATURA,
               "repeat_penalty": config.PENALIZACION_REPETICION, "max_tokens": config.MAX_TOKENS_RESPUESTA,
               "stream": True}
    if herramientas:
        payload["tools"] = herramientas
    contenido, llamadas, fin = [], {}, None
    async with client.stream("POST", f"{config.LMSTUDIO_URL}/v1/chat/completions", json=payload,
                             timeout=httpx.Timeout(300, read=300)) as r:
        if r.status_code != 200:
            cuerpo = (await r.aread()).decode("utf-8", "replace")
            try:
                datos = _json.loads(cuerpo)
            except ValueError:
                datos = {"error": cuerpo[:300] or f"HTTP {r.status_code}"}
            yield "fin", datos if "error" in datos else {"error": datos}
            return
        async for linea in r.aiter_lines():
            if not linea.startswith("data:"):
                continue
            dato = linea[5:].strip()
            if dato == "[DONE]":
                break
            try:
                trozo = _json.loads(dato)
            except ValueError:
                continue
            if "error" in trozo:
                yield "fin", {"error": trozo["error"]}
                return
            for ch in trozo.get("choices") or []:
                d = ch.get("delta") or {}
                if d.get("content"):
                    contenido.append(d["content"])
                    yield "delta", d["content"]
                for tc in d.get("tool_calls") or []:
                    k = tc.get("index", len(llamadas))
                    acc = llamadas.setdefault(k, {"id": "", "type": "function",
                                                  "function": {"name": "", "arguments": ""}})
                    acc["id"] = tc.get("id") or acc["id"]
                    f = tc.get("function") or {}
                    acc["function"]["name"] += f.get("name") or ""
                    acc["function"]["arguments"] += f.get("arguments") or ""
                if ch.get("finish_reason"):
                    fin = ch["finish_reason"]
    msg = {"role": "assistant", "content": "".join(contenido)}
    if llamadas:
        msg["tool_calls"] = [llamadas[k] for k in sorted(llamadas)]
    yield "fin", {"choices": [{"index": 0, "message": msg, "finish_reason": fin}]}
