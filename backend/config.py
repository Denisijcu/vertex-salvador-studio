"""
config.py — Configuración del backend de vertex-salvador-studio.

Todo tiene un valor por defecto que funciona si las carpetas van lado a lado:
    <carpeta>\\vertex-salvador          (el modelo: biblioteca, herramientas, instrucción de sistema)
    <carpeta>\\vertex-salvador-studio   (esta aplicación)
Cualquier valor se puede cambiar con una variable de entorno.
"""
from __future__ import annotations

import os
from pathlib import Path

STUDIO_DIR = Path(__file__).resolve().parent.parent
VERTEX_SALVADOR_DIR = Path(os.getenv("VERTEX_SALVADOR_DIR", STUDIO_DIR.parent / "vertex-salvador")).resolve()
DATOS_USUARIO = Path(os.getenv("STUDIO_DATOS", STUDIO_DIR / "datos_usuario")).resolve()
CONVERSACIONES_DIR = DATOS_USUARIO / "conversaciones"

LMSTUDIO_URL = os.getenv("LMSTUDIO_URL", "http://localhost:1234").rstrip("/")
# Si el Portero está levantado, el chat pasa por él; si no, va directo a LM Studio.
PORTERO_URL = os.getenv("PORTERO_URL", "http://localhost:8900").rstrip("/")
USAR_PORTERO = os.getenv("USAR_PORTERO", "auto").lower()        # auto | si | no

MODELO_BUSCADO = os.getenv("MODELO", "vertex-salvador")         # se busca por nombre entre los de LM Studio
CONTEXTO_MINIMO = int(os.getenv("CONTEXTO_MINIMO", "8192"))
TEMPERATURA = 0.3
PENALIZACION_REPETICION = 1.05
MAX_VUELTAS_HERRAMIENTAS = int(os.getenv("MAX_VUELTAS_HERRAMIENTAS", "6"))
MAX_TOKENS_RESPUESTA = int(os.getenv("MAX_TOKENS_RESPUESTA", "3000"))
PUERTO = int(os.getenv("STUDIO_PUERTO", "8710"))
