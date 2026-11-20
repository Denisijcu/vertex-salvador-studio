"""
verificacion.py — Comprueba en vivo que las cifras de una respuesta salen de lo que devolvieron las herramientas.

Es la misma regla que valida los datos de entrenamiento (vertex-salvador\\validar.py): todo número de la respuesta
tiene que aparecer en las fuentes consultadas. Si no aparece, la interfaz lo marca para que el usuario lo compruebe.
No corrige ni borra nada de la respuesta.
"""
from __future__ import annotations

import re

RE_NUMERO = re.compile(r"\d[\d.,]*\d|\d")


def canonico(s: str) -> str:
    s = s.strip(".,")
    if re.fullmatch(r"\d{1,3}([.,]\d{3})+", s):        # 6.657 / 6,657 -> 6657
        return re.sub(r"[.,]", "", s)
    return s.replace(",", ".")                          # 84,65 -> 84.65


def numeros(texto: str) -> set[str]:
    return {canonico(n) for n in RE_NUMERO.findall(texto or "")}


def cifras_sin_respaldo(respuesta: str, resultados_herramientas: list[str]) -> list[str]:
    """Números de la respuesta (de dos o más cifras) que no aparecen en ningún resultado de herramienta."""
    respaldo = set()
    for r in resultados_herramientas:
        respaldo |= numeros(r)
    faltan = []
    for m in RE_NUMERO.finditer(respuesta or ""):
        n = m.group()
        antes = (respuesta[max(0, m.start() - 10):m.start()]).lower()
        if re.search(r"(años|los|las décadas de|década de)\s*$", antes) and re.fullmatch(r"[1-9]0", n):
            continue                                    # "los años 70": una década, no una cifra
        c = canonico(n)
        if len(c.replace(".", "")) < 2:                 # 1-9: días, listas, "las 4 herramientas"
            continue
        if c not in respaldo and n.strip(".,") not in faltan:
            faltan.append(n.strip(".,"))
    return faltan
