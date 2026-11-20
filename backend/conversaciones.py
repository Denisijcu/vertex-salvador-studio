"""
conversaciones.py — Historial completo en disco, con las llamadas a herramientas y sus resultados.

Lección de Vertex-Agent: si el frontend reenvía solo role/content, el modelo pierde de vista que buscó y empieza a
fingir búsquedas. Aquí el backend guarda la conversación entera y el frontend solo manda el mensaje nuevo.
"""
from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path

from config import CONVERSACIONES_DIR

RE_ID = re.compile(r"[a-f0-9]{12}")


def _ruta(cid: str) -> Path:
    if not RE_ID.fullmatch(cid or ""):
        raise ValueError("id de conversación inválido")
    return CONVERSACIONES_DIR / f"{cid}.json"


def nueva(titulo: str = "") -> dict:
    CONVERSACIONES_DIR.mkdir(parents=True, exist_ok=True)
    c = {"id": uuid.uuid4().hex[:12], "titulo": titulo[:80] or "Conversación nueva", "creada": time.time(),
         "actualizada": time.time(), "mensajes": [], "turnos": []}
    guardar(c)
    return c


def cargar(cid: str) -> dict | None:
    try:
        return json.loads(_ruta(cid).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def guardar(c: dict) -> None:
    CONVERSACIONES_DIR.mkdir(parents=True, exist_ok=True)
    c["actualizada"] = time.time()
    tmp = _ruta(c["id"]).with_suffix(".tmp")
    tmp.write_text(json.dumps(c, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(_ruta(c["id"]))


def listar() -> list[dict]:
    if not CONVERSACIONES_DIR.exists():
        return []
    out = []
    for p in CONVERSACIONES_DIR.glob("*.json"):
        try:
            c = json.loads(p.read_text(encoding="utf-8"))
            out.append({"id": c["id"], "titulo": c["titulo"], "actualizada": c["actualizada"],
                        "turnos": len(c.get("turnos", []))})
        except (OSError, ValueError, KeyError):
            continue
    return sorted(out, key=lambda x: x["actualizada"], reverse=True)


def borrar(cid: str) -> bool:
    try:
        _ruta(cid).unlink()
        return True
    except (OSError, ValueError):
        return False
