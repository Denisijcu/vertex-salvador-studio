"""LM Studio de mentira para las pruebas: responde como el real (API REST y chat con herramientas)."""
import json

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI()
ESTADO = {"cargado": False, "contexto": 0, "modo": "estructurado"}


@app.get("/api/v1/models")
def modelos():
    inst = [{"id": "vertex-salvador-gguf", "config": {"context_length": ESTADO["contexto"]}}] if ESTADO["cargado"] else []
    return {"models": [{"type": "llm", "key": "otro-modelo", "loaded_instances": []},
                       {"type": "llm", "key": "denisijcu/vertex-salvador-gguf", "loaded_instances": inst,
                        "max_context_length": 131072}]}


@app.get("/v1/models")
def modelos_openai():
    return {"data": [{"id": "denisijcu/vertex-salvador-gguf"}]}


@app.post("/api/v1/models/load")
async def cargar(req: Request):
    b = await req.json()
    ESTADO.update(cargado=True, contexto=b.get("context_length", 4096))
    return {"type": "llm", "instance_id": "vertex-salvador-gguf", "load_time_seconds": 1.0, "status": "loaded"}


@app.post("/api/v1/models/unload")
async def descargar(req: Request):
    ESTADO.update(cargado=False, contexto=0)
    return {"instance_id": (await req.json())["instance_id"]}


@app.post("/v1/chat/completions")
async def chat(req: Request):
    b = await req.json()
    r = await _chat(b)
    return _en_trozos(r) if b.get("stream") else r


def _en_trozos(r):
    """Convierte una respuesta completa en el streaming SSE de LM Studio, en trozos de 5 caracteres."""
    ch = r["choices"][0]
    msg = ch["message"]

    def gen():
        texto = msg.get("content") or ""
        for i in range(0, len(texto), 5):
            yield "data: " + json.dumps({"choices": [{"index": 0, "delta": {"content": texto[i:i + 5]}}]}) + "\n\n"
        for k, tc in enumerate(msg.get("tool_calls") or []):
            a = tc["function"]["arguments"]
            yield "data: " + json.dumps({"choices": [{"index": 0, "delta": {"tool_calls": [
                {"index": k, "id": tc["id"], "type": "function",
                 "function": {"name": tc["function"]["name"], "arguments": a[:7]}}]}}]}) + "\n\n"
            yield "data: " + json.dumps({"choices": [{"index": 0, "delta": {"tool_calls": [
                {"index": k, "function": {"arguments": a[7:]}}]}}]}) + "\n\n"
        yield "data: " + json.dumps({"choices": [{"index": 0, "delta": {}, "finish_reason": ch["finish_reason"]}]}) + "\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")


async def _chat(b):
    assert b["messages"][0]["role"] == "system" and b.get("tools"), "falta sistema o herramientas"
    ultimo = b["messages"][-1]
    if ultimo["role"] == "user":
        if "largo" in ultimo["content"].lower():
            return {"choices": [{"index": 0, "message": {"role": "assistant", "content": "Una respuesta que se cor"},
                                 "finish_reason": "length"}]}
        if "hola" in ultimo["content"].lower():
            return _resp({"role": "assistant", "content": "¡Hola! ¿En qué le ayudo?"})
        args = {"consulta": ultimo["content"], "epoca": "E10"}
        if ESTADO["modo"] == "texto":
            return _resp({"role": "assistant", "content":
                          '<|tool_call>call:buscar_documentos{consulta:<|"|>CECOT, capacidad: presos<|"|>,epoca:<|"|>E10<|"|>,max_resultados:3}<tool_call|>'})
        return _resp({"role": "assistant", "content": "", "tool_calls": [
            {"id": "c1", "type": "function", "function": {"name": "buscar_documentos", "arguments": json.dumps(args)}}]})
    # Tras la herramienta: usa una cifra real del resultado y se inventa otra (99.999)
    resultado = ultimo["content"]
    real = "40.000" if "40.000" in resultado else "2022"
    return _resp({"role": "assistant", "content": f"Según los documentos, la cifra es {real}. Además hubo 99.999 casos."})


def _resp(msg):
    return {"choices": [{"index": 0, "message": msg, "finish_reason": "stop"}]}
