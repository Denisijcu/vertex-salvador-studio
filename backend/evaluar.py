"""
evaluar.py — Pasa las 10 preguntas de vertex-salvador\\eval\\prueba_bases.jsonl por el backend completo,
contra el LM Studio real, y escribe un informe para leerlo con calma.

Requisitos: LM Studio abierto con el servidor local encendido y el modelo vertex-salvador descargado.
Desde la carpeta backend:
    .venv\\Scripts\\python.exe evaluar.py
Resultado: ..\\reportes\\evaluacion_<fecha>.md
"""
import asyncio
import json
import time
from datetime import datetime

import agente
import config
import conversaciones


async def main():
    preguntas = [json.loads(l) for l in
                 (config.VERTEX_SALVADOR_DIR / "eval" / "prueba_bases.jsonl").read_text(encoding="utf-8").splitlines()
                 if l.strip()]
    salida = config.STUDIO_DIR / "reportes"
    salida.mkdir(exist_ok=True)
    informe = salida / f"evaluacion_{datetime.now():%Y-%m-%d_%H%M}.md"
    lineas = [f"# Evaluación de vertex-salvador — {datetime.now():%d/%m/%Y %H:%M}", "",
              "Cada pregunta en una conversación nueva. Leer la columna «qué mirar» de cada una.", ""]
    for i, p in enumerate(preguntas, 1):
        print(f"[{i}/{len(preguntas)}] {p['id']}: {p['pregunta'][:70]}…", flush=True)
        conv = conversaciones.nueva(f"[evaluación] {p['id']}")
        r = await agente.turno(conv, p["pregunta"])
        herr = ", ".join(f"{h['herramienta']}({json.dumps(h['argumentos'], ensure_ascii=False)})"
                         for h in r["herramientas"]) or "ninguna"
        lineas += [f"## {p['id']} · {p['bloque']}", "", f"**Pregunta:** {p['pregunta']}", "",
                   f"**Qué mirar:** {p['que_mirar']}", "", f"**Herramientas:** {herr}", "",
                   f"**Fuentes consultadas:** {', '.join(f['doc_id'] for f in r['fuentes']) or 'ninguna'}", "",
                   f"**Cifras sin respaldo en las fuentes:** {', '.join(r['cifras_sin_respaldo']) or 'ninguna'}", "",
                   f"**Tiempo:** {r['segundos']} s" + ("  ·  **ERROR**" if r["error"] else ""), "",
                   *(f"> ⚠️ {a}" for a in r["avisos"]), "", "**Respuesta:**", "", r["respuesta"], "", "---", ""]
        informe.write_text("\n".join(lineas), encoding="utf-8")
    print(f"\nInforme: {informe}")


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(main())
    print(f"Total: {time.time() - t0:.0f} s")
