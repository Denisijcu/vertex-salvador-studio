# vertex-salvador studio

Interfaz de escritorio para **vertex-salvador**, el modelo local sobre la historia reciente de El Salvador y la
campaña contra las pandillas. Funciona entera en la computadora: las preguntas no salen a internet.

Cada respuesta enseña de qué documentos sale y marca las cifras que no aparecen en ellos.

| Vista | Para qué |
|---|---|
| Preguntar | Chat en vivo: se ve qué busca el modelo, la respuesta mientras se escribe y sus fuentes |
| Línea de tiempo | Los hechos de la biblioteca por época, tema o rango de años |
| Cifras | Cada número con quién lo da |
| Mis documentos | Documentos propios que el modelo puede consultar (no salen de la computadora) |
| Estado | LM Studio, modelo, memoria, Portero y biblioteca |

## Requisitos

- Windows 10/11 con [LM Studio](https://lmstudio.ai) 0.4 o superior y el modelo
  [vertex-salvador-GGUF](https://huggingface.co/Denisijcu/vertex-salvador-GGUF) descargado.
- Python 3.10 o superior.
- La carpeta [vertex-salvador](https://github.com/Denisijcu/vertex-salvador) **al lado** de esta:

```
<carpeta>\vertex-salvador
<carpeta>\vertex-salvador-studio
```

No hace falta Node: la interfaz ya va compilada en `frontend\dist`.

## Instalar y arrancar

```
cd <carpeta>\vertex-salvador-studio
instalar.bat
iniciar.bat
```

`instalar.bat` crea un entorno propio en `backend\.venv` (no toca el Python del sistema) y pasa las pruebas.
`iniciar.bat` arranca en http://localhost:8710 y abre el navegador. LM Studio tiene que estar abierto con el
servidor local encendido; el modelo se carga solo, con 8192 de contexto, en la primera pregunta.

## Cómo está hecho

```
Angular 22 + Material 3  ->  FastAPI :8710  ->  [Portero :8900, opcional]  ->  LM Studio :1234
                                  └─> herramientas de vertex-salvador (importadas, no copiadas)
```

- `backend/` — FastAPI. `agente.py` es el bucle de herramientas; `verificacion.py` comprueba las cifras;
  `/api/chat/stream` manda la respuesta en vivo (Server-Sent Events).
- `frontend/` — Angular 22 con Angular Material (Material 3). Sin Tailwind.
- **Portero**: si el Portero de Vertex Coders responde en el puerto 8900, cada pregunta y respuesta pasa por él
  (sin streaming: revisa la respuesta entera). No se incluye en este repositorio.

## Desarrollo

```
cd <carpeta>\vertex-salvador-studio\backend
.venv\Scripts\python.exe -m pytest -q          # pruebas, con un LM Studio de mentira
.venv\Scripts\python.exe evaluar.py            # 10 preguntas contra el LM Studio real -> reportes\

cd <carpeta>\vertex-salvador-studio\frontend
npm ci
npx ng serve                                   # http://localhost:4200, con el backend arrancado
npx ng build                                   # vuelve a generar frontend\dist
```

## Licencia

Apache 2.0. Desarrollado por Denis Sánchez Leyva, Vertex Coders LLC. No es una herramienta oficial ni habla en
nombre de ningún gobierno, partido u organización.
