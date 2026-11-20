"""
Pruebas del backend sin LM Studio real. Desde la carpeta backend:
    .venv\\Scripts\\python.exe -m pytest -q
Levanta un LM Studio de mentira en el puerto 1299 y usa la biblioteca real de ..\\..\\vertex-salvador.
"""
import os
import socket
import threading
import time

import pytest

os.environ["LMSTUDIO_URL"] = "http://127.0.0.1:1299"
os.environ["USAR_PORTERO"] = "no"

import uvicorn  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from tests import lmstudio_falso  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def lm_falso(tmp_path_factory):
    os.environ["STUDIO_DATOS"] = str(tmp_path_factory.mktemp("datos"))
    srv = uvicorn.Server(uvicorn.Config(lmstudio_falso.app, host="127.0.0.1", port=1299, log_level="error"))
    threading.Thread(target=srv.run, daemon=True).start()
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", 1299), 0.2).close()
            break
        except OSError:
            time.sleep(0.1)
    yield
    srv.should_exit = True


@pytest.fixture()
def cliente():
    import importlib
    import config
    importlib.reload(config)
    import conversaciones
    importlib.reload(conversaciones)
    import agente
    importlib.reload(agente)
    import app as modulo
    importlib.reload(modulo)
    return TestClient(modulo.app)


def test_estado_antes_de_cargar(cliente):
    lmstudio_falso.ESTADO.update(cargado=False, contexto=0)
    e = cliente.get("/api/estado").json()
    assert e["lmstudio"]["ok"] and not e["lmstudio"]["cargado"] and not e["contexto_ok"]
    assert e["biblioteca"]["fragmentos"] == 133


def test_chat_carga_el_modelo_con_8192_y_usa_herramientas(cliente):
    lmstudio_falso.ESTADO.update(cargado=False, contexto=0, modo="estructurado")
    r = cliente.post("/api/chat", json={"mensaje": "¿Qué es el CECOT?"}).json()
    assert lmstudio_falso.ESTADO["contexto"] == 8192
    assert r["herramientas"][0]["herramienta"] == "buscar_documentos"
    assert any(f["doc_id"] == "FR-E11-001" for f in r["fuentes"])   # época equivocada, documento correcto
    assert "40.000" in r["respuesta"]
    assert r["cifras_sin_respaldo"] == ["99.999"]                    # la inventada se marca, la real no
    assert not r["avisos"]


def test_historial_completo_y_segundo_turno(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=8192, modo="estructurado")
    r1 = cliente.post("/api/chat", json={"mensaje": "¿Qué es el CECOT?"}).json()
    cid = r1["conversacion_id"]
    r2 = cliente.post("/api/chat", json={"mensaje": "hola", "conversacion_id": cid}).json()
    assert r2["respuesta"].startswith("¡Hola!") and not r2["herramientas"]
    import conversaciones
    c = conversaciones.cargar(cid)
    roles = [m["role"] for m in c["mensajes"]]
    assert roles == ["user", "assistant", "tool", "assistant", "user", "assistant"]   # con la llamada y el resultado
    assert c["mensajes"][1]["tool_calls"]
    assert len(cliente.get(f"/api/conversaciones/{cid}").json()["turnos"]) == 2


def test_llamada_escrita_en_texto_formato_gemma(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=8192, modo="texto")
    r = cliente.post("/api/chat", json={"mensaje": "capacidad del CECOT"}).json()
    h = r["herramientas"][0]
    assert h["herramienta"] == "buscar_documentos"
    assert h["argumentos"] == {"consulta": "CECOT, capacidad: presos", "epoca": "E10", "max_resultados": 3}
    assert "<|tool_call>" not in r["respuesta"]


def test_aviso_si_el_contexto_es_pequeno(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=2048, modo="estructurado")
    r = cliente.post("/api/chat", json={"mensaje": "¿Qué es el CECOT?"}).json()
    assert r["avisos"] and "2048" in r["avisos"][0]


def test_biblioteca_endpoints(cliente):
    ep = cliente.get("/api/epocas").json()
    assert len(ep) == 24 and not any(e["id"].startswith("X") for e in ep)
    assert any(e["id"] == "E15" for e in ep)
    assert "despliegue_haiti" in cliente.get("/api/cifras").json()
    assert cliente.get("/api/cifras/elecciones_presidenciales").json()["total"] == 4
    assert cliente.get("/api/linea-tiempo", params={"epoca": "E15"}).json()["total"] == 23
    d = cliente.get("/api/documentos/FR-E15-022").json()
    assert d["doc_id"] == "FR-E15-022" and d["url"].startswith("http")
    assert cliente.get("/api/documentos/NO-EXISTE").status_code == 404


def test_conversacion_inexistente_y_id_invalido(cliente):
    assert cliente.post("/api/chat", json={"mensaje": "x", "conversacion_id": "aaaaaaaaaaaa"}).status_code == 404
    assert cliente.get("/api/conversaciones/../../etc").status_code == 404


def test_verificacion_de_cifras():
    from verificacion import cifras_sin_respaldo
    fuentes = ['{"texto": "hubo 6.657 homicidios y el 84,65 % en 2024"}']
    assert cifras_sin_respaldo("Fueron 6.657 (6,657 en inglés), 84,65 %, en 2024; y 4 casos", fuentes) == []
    assert cifras_sin_respaldo("Fueron 7.000 en 2023", fuentes) == ["7.000", "2023"]


def test_decadas_y_cifras_del_usuario_no_se_marcan():
    from verificacion import cifras_sin_respaldo
    assert cifras_sin_respaldo("A partir de los años 70 hubo protestas; en 2015 hubo 99 casos", ["2015"]) == ["99"]


def test_aviso_si_la_respuesta_se_corta(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=8192, modo="estructurado")
    r = cliente.post("/api/chat", json={"mensaje": "algo largo"}).json()
    assert any("cortó" in a for a in r["avisos"])


def _eventos(cliente, cuerpo):
    import json as j
    with cliente.stream("POST", "/api/chat/stream", json=cuerpo) as r:
        return [j.loads(l[5:]) for l in r.iter_lines() if l.startswith("data:")]


def test_streaming_en_orden(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=8192, modo="estructurado")
    ev = _eventos(cliente, {"mensaje": "¿Qué es el CECOT?"})
    tipos = [e["tipo"] for e in ev]
    assert tipos[0] == "conversacion" and tipos[-1] == "fin"
    assert tipos.index("herramienta") < tipos.index("herramienta_fin") < tipos.index("texto")
    texto = "".join(e["delta"] for e in ev if e["tipo"] == "texto")
    assert texto == ev[-1]["turno"]["respuesta"]                      # lo que se vio es lo que quedó
    assert ev[-1]["turno"]["herramientas"][0]["argumentos"]["consulta"] == "¿Qué es el CECOT?"
    assert ev[-1]["turno"]["cifras_sin_respaldo"] == ["99.999"]


def test_streaming_no_ensena_la_llamada_en_texto(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=8192, modo="texto")
    ev = _eventos(cliente, {"mensaje": "capacidad del CECOT"})
    assert not any("<|" in e.get("delta", "") for e in ev)
    assert ev[-1]["turno"]["herramientas"][0]["argumentos"]["max_resultados"] == 3


def test_visible_parcial():
    from agente import visible_parcial
    assert visible_parcial("Hola <thi") == "Hola "
    assert visible_parcial("<think>dudas</think>Respuesta") == "Respuesta"
    assert visible_parcial("<think>todavía pensando") == ""
    assert visible_parcial('Busco. <|tool_call>call:x{') == "Busco. "


def test_recargar_con_poco_contexto(cliente):
    lmstudio_falso.ESTADO.update(cargado=True, contexto=2048)
    assert cliente.post("/api/modelo/cargar").json()["ok"]
    assert lmstudio_falso.ESTADO["contexto"] == 8192


def test_mis_documentos(cliente, tmp_path, monkeypatch):
    import app as modulo
    (tmp_path / "LEEME.txt").write_text("léeme")
    monkeypatch.setattr(modulo, "_carpeta_privados", lambda: tmp_path)   # no toca la carpeta real
    r = cliente.post("/api/mis-documentos", files={"archivo": ("acta.md", "# Acta\nReunión del comité.".encode())})
    assert r.json()["nombre"] == "acta.md"
    nombres = [a["nombre"] for a in cliente.get("/api/mis-documentos").json()]
    assert "acta.md" in nombres and "LEEME.txt" not in nombres
    assert cliente.post("/api/mis-documentos", files={"archivo": ("x.exe", b"MZ")}).status_code == 400
    assert cliente.delete("/api/mis-documentos/acta.md").json()["ok"]
    assert cliente.delete("/api/mis-documentos/LEEME.txt").status_code == 404
