"""
app.py — Backend de vertex-salvador-studio (fase 1).

Cadena:  interfaz (Angular)  ->  ESTE backend (:8710)  ->  [Portero :8900]  ->  LM Studio (:1234)
                                      └──> herramientas de vertex-salvador, en proceso

Arrancar (desde la carpeta backend, con su entorno):
    .venv\\Scripts\\python.exe app.py
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import agente
import biblioteca
import config
import conversaciones
import lmstudio

app = FastAPI(title="vertex-salvador-studio", version="0.1.0")
# Solo la propia interfaz (y el servidor de desarrollo de Angular) pueden llamar a la API.
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:4200", f"http://localhost:{config.PUERTO}",
                                                  f"http://127.0.0.1:{config.PUERTO}"],
                   allow_methods=["*"], allow_headers=["*"])

EXT_PRIVADOS = {".txt", ".md", ".pdf", ".docx"}
MAX_BYTES_PRIVADO = 20 * 1024 * 1024


class Pregunta(BaseModel):
    mensaje: str = Field(min_length=1, max_length=4000)
    conversacion_id: str | None = None


# ── Estado ─────────────────────────────────────────────────────────────────────────────────────────────
@app.get("/api/estado")
async def estado():
    async with httpx.AsyncClient() as client:
        modelo = await lmstudio.buscar_modelo(client)
        portero = await lmstudio.portero_activo(client)
    try:
        bib = {"ok": True, **biblioteca.estado()}
    except Exception as exc:  # noqa: BLE001
        bib = {"ok": False, "mensaje": str(exc)}
    contexto_ok = bool(modelo.get("cargado")) and modelo.get("contexto", 0) >= config.CONTEXTO_MINIMO
    return {"lmstudio": modelo, "contexto_minimo": config.CONTEXTO_MINIMO, "contexto_ok": contexto_ok,
            "portero": portero, "biblioteca": bib, "listo": bool(modelo.get("ok") and bib["ok"])}


@app.post("/api/modelo/cargar")
async def cargar_modelo():
    async with httpx.AsyncClient() as client:
        modelo = await lmstudio.buscar_modelo(client)
        if not modelo.get("ok"):
            raise HTTPException(503, modelo["mensaje"])
        if modelo.get("cargado"):
            if modelo["contexto"] >= config.CONTEXTO_MINIMO:
                return {"ok": True, "mensaje": "El modelo ya estaba cargado con contexto suficiente."}
            # Cargado con poco contexto: se descarga esa instancia y se vuelve a cargar con 8192.
            await lmstudio.descargar(client, modelo["id"])
        r = await lmstudio.cargar(client, modelo["clave"])
        if not r["ok"]:
            raise HTTPException(502, r["mensaje"])
        return r


# ── Chat y conversaciones ──────────────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(p: Pregunta):
    conv = conversaciones.cargar(p.conversacion_id) if p.conversacion_id else None
    if p.conversacion_id and conv is None:
        raise HTTPException(404, "Esa conversación no existe")
    conv = conv or conversaciones.nueva(p.mensaje)
    return await agente.turno(conv, p.mensaje.strip())


@app.post("/api/chat/stream")
async def chat_stream(p: Pregunta):
    """Lo mismo que /api/chat, pero en vivo (Server-Sent Events): un evento JSON por línea «data:»."""
    conv = conversaciones.cargar(p.conversacion_id) if p.conversacion_id else None
    if p.conversacion_id and conv is None:
        raise HTTPException(404, "Esa conversación no existe")
    conv = conv or conversaciones.nueva(p.mensaje)

    async def eventos():
        yield _sse({"tipo": "conversacion", "conversacion_id": conv["id"]})
        async for ev in agente.turno_eventos(conv, p.mensaje.strip()):
            yield _sse(ev)

    return StreamingResponse(eventos(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


def _sse(ev: dict) -> str:
    return f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"


@app.get("/api/conversaciones")
def listar_conversaciones():
    return conversaciones.listar()


@app.get("/api/conversaciones/{cid}")
def ver_conversacion(cid: str):
    c = conversaciones.cargar(cid)
    if c is None:
        raise HTTPException(404, "Esa conversación no existe")
    return {"id": c["id"], "titulo": c["titulo"], "turnos": c.get("turnos", [])}


@app.delete("/api/conversaciones/{cid}")
def borrar_conversacion(cid: str):
    if not conversaciones.borrar(cid):
        raise HTTPException(404, "Esa conversación no existe")
    return {"ok": True}


# ── Biblioteca: épocas, línea de tiempo, cifras, documentos ────────────────────────────────────────────
def _json(texto: str):
    return json.loads(texto)


@app.get("/api/epocas")
def epocas():
    filas = []
    for linea in (config.VERTEX_SALVADOR_DIR / "EPOCAS.md").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\|\s*([PET]\d\d)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|", linea)   # X: notas internas
        if m:
            filas.append({"id": m.group(1), "nombre": m.group(2), "anios": m.group(3)})
    return filas


@app.get("/api/linea-tiempo")
def linea_tiempo(epoca: str | None = None, desde: str | None = None, hasta: str | None = None):
    return _json(biblioteca.ejecutar("linea_tiempo", {"epoca": epoca, "desde": desde, "hasta": hasta}))


@app.get("/api/cifras")
def cifras():
    return sorted(biblioteca.servidor().coleccion().cifras.keys())


@app.get("/api/cifras/{metrica}")
def cifra(metrica: str):
    return _json(biblioteca.ejecutar("consultar_cifras", {"metrica": metrica}))


@app.get("/api/documentos/{doc_id}")
def documento(doc_id: str):
    d = _json(biblioteca.ejecutar("leer_documento", {"doc_id": doc_id}))
    if not d.get("documento"):
        raise HTTPException(404, d.get("nota") or "No existe ese documento")
    return biblioteca.con_url(d["documento"])


# ── Mis documentos (privados) ──────────────────────────────────────────────────────────────────────────
def _carpeta_privados() -> Path:
    p = config.VERTEX_SALVADOR_DIR / "agente" / "docs_privados"
    p.mkdir(parents=True, exist_ok=True)
    return p


@app.get("/api/mis-documentos")
def mis_documentos():
    return [{"nombre": f.name, "bytes": f.stat().st_size} for f in sorted(_carpeta_privados().iterdir())
            if f.is_file() and f.suffix.lower() in EXT_PRIVADOS and f.name != "LEEME.txt"]


@app.post("/api/mis-documentos")
async def subir_documento(archivo: UploadFile = File(...)):
    nombre = Path(archivo.filename or "").name
    if not nombre or nombre == "LEEME.txt" or Path(nombre).suffix.lower() not in EXT_PRIVADOS:
        raise HTTPException(400, "Formatos admitidos: .txt, .md, .pdf, .docx")
    datos = await archivo.read(MAX_BYTES_PRIVADO + 1)
    if len(datos) > MAX_BYTES_PRIVADO:
        raise HTTPException(400, "El archivo pasa de 20 MB")
    (_carpeta_privados() / nombre).write_bytes(datos)
    return {"ok": True, "nombre": nombre}


@app.delete("/api/mis-documentos/{nombre}")
def borrar_documento(nombre: str):
    destino = _carpeta_privados() / Path(nombre).name
    if destino.name == "LEEME.txt" or not destino.is_file():
        raise HTTPException(404, "No existe ese documento")
    destino.unlink()
    return {"ok": True}


# ── Interfaz compilada (va al final: captura "/") ──────────────────────────────────────────────────────
INTERFAZ = config.STUDIO_DIR / "frontend" / "dist" / "browser"
if INTERFAZ.is_dir():
    app.mount("/", StaticFiles(directory=str(INTERFAZ), html=True), name="interfaz")


if __name__ == "__main__":
    import uvicorn
    print("\nvertex-salvador-studio — backend")
    print(f"  http://localhost:{config.PUERTO}" + ("" if INTERFAZ.is_dir() else "   (interfaz aún no compilada)"))
    print(f"  Biblioteca: {config.VERTEX_SALVADOR_DIR}")
    print(f"  LM Studio:  {config.LMSTUDIO_URL}   Portero: {config.PORTERO_URL} ({config.USAR_PORTERO})\n")
    if INTERFAZ.is_dir() and os.getenv("STUDIO_ABRIR", "si") != "no":
        import threading
        import webbrowser
        threading.Timer(2.0, lambda: webbrowser.open(f"http://localhost:{config.PUERTO}")).start()
    uvicorn.run(app, host="127.0.0.1", port=config.PUERTO)
