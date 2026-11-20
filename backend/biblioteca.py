"""
biblioteca.py — Las cuatro herramientas de vertex-salvador, llamadas en proceso.

No reimplementa nada: importa las funciones de vertex-salvador\\agente\\servidor_mcp.py, las mismas que usa el
servidor MCP y con las que se entrenó el modelo. El contrato (nombres y argumentos) sale de herramientas.json.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from functools import lru_cache

from config import VERTEX_SALVADOR_DIR


class BibliotecaNoEncontrada(RuntimeError):
    pass


@lru_cache(maxsize=1)
def servidor():
    ruta = VERTEX_SALVADOR_DIR / "agente" / "servidor_mcp.py"
    if not ruta.exists():
        raise BibliotecaNoEncontrada(
            f"No encuentro {ruta}. La carpeta 'vertex-salvador' tiene que estar al lado de 'vertex-salvador-studio' "
            "(o indicar su ruta con la variable VERTEX_SALVADOR_DIR).")
    spec = importlib.util.spec_from_file_location("vs_servidor_mcp", ruta)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["vs_servidor_mcp"] = mod
    spec.loader.exec_module(mod)
    return mod


@lru_cache(maxsize=1)
def herramientas_openai() -> list[dict]:
    """El contrato exacto de herramientas.json, en formato OpenAI (el que entiende LM Studio)."""
    datos = json.loads((VERTEX_SALVADOR_DIR / "herramientas.json").read_text(encoding="utf-8"))
    return datos["tools"]


@lru_cache(maxsize=1)
def instruccion_sistema() -> str:
    return (VERTEX_SALVADOR_DIR / "agente" / "SISTEMA.txt").read_text(encoding="utf-8").strip()


NOMBRES = ("buscar_documentos", "leer_documento", "consultar_cifras", "linea_tiempo")


def ejecutar(nombre: str, argumentos: dict) -> str:
    """Ejecuta una herramienta y devuelve su JSON (texto), igual que lo devolvería el servidor MCP."""
    s = servidor()
    a = argumentos if isinstance(argumentos, dict) else {}
    try:
        if nombre == "buscar_documentos":
            return s.h_buscar_documentos(str(a.get("consulta", "")), a.get("epoca") or None,
                                         a.get("coleccion") or "todas", int(a.get("max_resultados") or 5))
        if nombre == "leer_documento":
            return s.h_leer_documento(str(a.get("doc_id", "")), a.get("seccion") or None)
        if nombre == "consultar_cifras":
            return s.h_consultar_cifras(str(a.get("metrica", "")), a.get("desde") or None, a.get("hasta") or None)
        if nombre == "linea_tiempo":
            return s.h_linea_tiempo(a.get("epoca") or None, a.get("desde") or None, a.get("hasta") or None)
    except Exception as exc:  # noqa: BLE001 — un fallo de una herramienta no tumba la conversación
        return json.dumps({"error": f"{type(exc).__name__}: {exc}"}, ensure_ascii=False)
    return json.dumps({"error": f"Herramienta desconocida: {nombre}"}, ensure_ascii=False)


def documentos_en_resultado(texto: str) -> list[dict]:
    """Extrae los documentos (fragmentos, filas de cifras, eventos) que devolvió una herramienta, para el panel
    de fuentes de la interfaz."""
    try:
        d = json.loads(texto)
    except (ValueError, TypeError):
        return []
    items = []
    if isinstance(d.get("documento"), dict):
        items.append(d["documento"])
    for clave in ("resultados", "eventos"):
        items += [x for x in d.get(clave) or [] if isinstance(x, dict)]
    for fila in d.get("filas") or []:
        if isinstance(fila, dict):
            items.append({"doc_id": fila.get("doc_id"), "fuente": fila.get("fuente") or fila.get("atribucion"),
                          "texto": f"{fila.get('periodo')}: {fila.get('valor')} ({fila.get('atribucion')})",
                          "tipo": "cifra"})
    return [con_url(x) for x in items]


def con_url(doc: dict) -> dict:
    """Añade el enlace a la fuente original (el modelo no lo ve; la interfaz sí, para que el usuario lo abra)."""
    try:
        url = servidor().coleccion().docs.get(doc.get("doc_id") or "", {}).get("url")
    except Exception:  # noqa: BLE001
        url = None
    return {**doc, "url": url} if url else doc


def estado() -> dict:
    s = servidor()
    col = s.coleccion()
    publicos = col.publicos
    fuentes = {v.get("url") or v.get("fuente") for v in publicos.values()}
    return {"fragmentos": len(publicos), "fuentes": len(fuentes),
            "privados": len({k.split("#")[0] for k in (getattr(col, "privados", {}) or {})
                             if not k.startswith("PRIV:LEEME.txt")}),
            "fecha_corte": "2026-11-18"}
