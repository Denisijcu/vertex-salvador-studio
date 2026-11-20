# vertex-salvador-studio — Arquitectura y plan

**Estado:** propuesta para aprobar (19 de noviembre de 2026). No hay código todavía.

## 1. Objetivo

Una aplicación de escritorio local (se abre en el navegador) para usar **vertex-salvador** sin configurar nada a mano.
Hoy, para usar el modelo hay que pegar un bloque en `mcp.json`, cargar el modelo con contexto 8192, pegar la
instrucción de sistema y apagar Thinking. Si alguien se salta un paso, el modelo funciona mal (pasó con el contexto de
2048). El Studio trae todo eso fijo: se abre y se pregunta.

Lo que añade sobre LM Studio:
1. **Panel de fuentes** en cada respuesta: los fragmentos que consultó el modelo, con su fuente y su enlace.
2. **Verificación de cifras**: cada número de la respuesta se compara con lo que devolvieron las herramientas; si
   uno no aparece en las fuentes consultadas, se marca. Es la misma regla de `validar.py`, aplicada en vivo.
3. **El Portero** delante del modelo, para los documentos propios (un documento puede traer instrucciones escondidas).
4. Vistas propias del tema: Línea de tiempo, Cifras y Mis documentos.

## 2. Cadena

```
Angular 22 + Material 3  ──►  Backend FastAPI (:8710)  ──►  [Portero V-SRT :8900]  ──►  LM Studio (:1234)
     (navegador)                    │                         (opcional)              modelo vertex-salvador
                                    └──► herramientas de vertex-salvador (en proceso, sin MCP)
```

- **Las herramientas se llaman en proceso**: el backend importa las funciones de
  `vertex-salvador\agente\servidor_mcp.py` (`h_buscar_documentos`, `h_leer_documento`, `h_consultar_cifras`,
  `h_linea_tiempo`). Son las mismas, ya probadas, sin `mcp.json` ni procesos aparte. La biblioteca se lee de la
  carpeta del repo `vertex-salvador`, que va al lado (`..\vertex-salvador`, o la variable `VERTEX_SALVADOR_DIR`).
- **El contrato de herramientas** es `vertex-salvador\herramientas.json`, el mismo con el que se entrenó el modelo.
- **La instrucción de sistema** es `vertex-salvador\agente\SISTEMA.txt`. La interfaz no permite cambiarla.

## 3. Lo que se aprende de Vertex-Agent (y se evita aquí)

| Problema en Vertex-Agent | Solución en el Studio |
|---|---|
| El frontend reenvía solo `role/content`: el historial pierde las llamadas a herramientas y el modelo acaba fingiendo búsquedas | **El backend guarda la conversación completa**, con llamadas y resultados. El frontend solo manda el mensaje nuevo y el id de la conversación |
| Contexto desbordado sin aviso claro | Al arrancar se comprueba el contexto cargado del modelo; si es menor de 8192, la interfaz lo dice y explica cómo arreglarlo. Si una conversación no cabe, se avisa y se ofrece empezar otra |
| Rutas fijas (`F:\…`) en el código | Todo relativo a la carpeta del proyecto o por variables de entorno con valor por defecto |
| Respuestas cortadas por límite de pasos | Tope de 6 vueltas de herramientas (el modelo usa 1 o 2 por pregunta); si se alcanza, se dice |

## 4. Backend (FastAPI, Python 3.10+)

| Endpoint | Qué hace |
|---|---|
| `GET /api/estado` | LM Studio responde, modelo encontrado y cargado, contexto, Portero activo, biblioteca (fragmentos, fuentes, fecha de corte) |
| `POST /api/chat` | `{conversacion_id, mensaje}` → bucle de agente → respuesta + fuentes consultadas + cifras no verificadas + veredicto del Portero |
| `GET/DELETE /api/conversaciones[/id]` | Historial guardado en disco (`datos_usuario/conversaciones/`) |
| `GET /api/epocas`, `GET /api/linea-tiempo` | Para la vista Línea de tiempo |
| `GET /api/cifras`, `GET /api/cifras/{metrica}` | Para la vista Cifras |
| `GET /api/documentos/{doc_id}` | Un fragmento completo con su fuente (para el panel de fuentes) |
| `GET/POST/DELETE /api/mis-documentos` | Subir, listar y borrar documentos privados (`.txt`, `.md`, `.pdf`, `.docx`) |

Parámetros fijos del modelo: temperatura 0,3, penalización 1.05, sin razonamiento previo. Se localiza el modelo por
nombre (`vertex-salvador`) entre los que expone LM Studio.

**Por comprobar en la fase 1** (no lo doy por hecho): si la API de LM Studio permite desde el backend cargar el modelo
con contexto 8192 y desactivar Thinking. Si no lo permite, el Studio lo detecta y lo indica en pantalla con el paso
exacto.

## 5. Frontend (Angular 22 + Angular Material, Material 3)

- Componentes standalone, signals, sin Tailwind. Tema Material 3 con modo claro y oscuro.
- Paleta inspirada en azul y blanco, tipografía propia. **Sin escudo, logos ni nada que parezca una aplicación del
  gobierno salvadoreño**: la marca es vertex-salvador / Vertex Coders.
- Español por defecto; los textos de la interfaz en un solo archivo, para poder añadir inglés.

| Vista | Contenido |
|---|---|
| **Chat** | Conversación; debajo de cada respuesta, chips de herramientas usadas; panel lateral **Fuentes** con los fragmentos (fuente, enlace, tipo: hecho / atribuido / postura); aviso si una cifra no está en las fuentes; historial de conversaciones |
| **Línea de tiempo** | Las 25 épocas y ejes, navegables; cada hecho con su fuente |
| **Cifras** | Cada métrica en tabla (y gráfico donde aplique) con la atribución de cada fila |
| **Mis documentos** | Subir y quitar documentos privados; aviso de que nunca salen de la computadora |
| **Estado** | Semáforo de LM Studio, modelo, contexto, Portero y biblioteca, con instrucciones si algo falla |
| **Guía** y **Acerca de** | La guía de uso y la descripción del proyecto, con la regla de neutralidad y la fecha de corte |

## 6. El Portero

- Va **delante del modelo** como en Vertex-Agent: revisa el mensaje del usuario y todo resultado de herramienta
  (incluidos los documentos privados), y la respuesta del modelo a la salida.
- Prueba hecha hoy: las reglas heurísticas del Portero (`InputSanitizer`) contra toda la biblioteca, las tablas de
  cifras y las líneas de tiempo: **142 textos, 0 falsas alarmas**.
- El juez LLM del Portero necesita un segundo modelo cargado. Propuesta: modo **solo reglas** por defecto (no consume
  memoria) y juez opcional.
- **Decisión pendiente (licencia):** el README del Portero dice *Internal Proprietary — Vertex Coders LLC*. Si el Studio
  se publica en GitHub, hay que decidir si el Portero va dentro (código visible), va compilado, o se entrega aparte.

## 7. Arranque e instalación

- `iniciar.bat`: comprueba LM Studio y el modelo, levanta Portero (si está) y backend, y abre el navegador.
- `instalar.bat`: entorno `.venv` propio (no toca el Python del sistema) y dependencias.
- **La interfaz se entrega ya compilada** (`frontend\dist`) en las versiones publicadas: quien la use no necesita
  Node.js. Node solo hace falta para desarrollar.

## 8. Fases

Cada fase termina con algo que se puede probar y una entrada en la bitácora.

| Fase | Entrega | Cómo se comprueba |
|---|---|---|
| 1. Backend | Bucle de agente con las herramientas en proceso, historial completo, verificación de cifras, `/api/estado` | Pruebas `pytest` + las 10 preguntas de `eval\prueba_bases.jsonl` contra LM Studio, sin interfaz |
| 2. Interfaz base | Proyecto Angular 22 + Material 3, tema, navegación, vista Chat con panel de fuentes | Se conversa de punta a punta desde el navegador |
| 3. Vistas | Línea de tiempo, Cifras, Mis documentos, Estado | Cada vista contra el backend real |
| 4. Portero | Portero delante del modelo, veredicto visible en la interfaz, registro | Pruebas con documentos con instrucciones escondidas; la biblioteca no debe dar falsas alarmas |
| 5. Entrega | `instalar.bat`, `iniciar.bat`, interfaz compilada, guía, README, `.gitignore` | Instalación en limpio siguiendo solo la guía |

## 9. Decisiones que necesito de Denis

1. **Portero:** ¿va dentro del Studio, compilado o aparte? (sección 6).
2. **Ubicación de la biblioteca:** ¿el Studio lee la carpeta `vertex-salvador` que va a su lado (propuesta) o se copia
   la biblioteca dentro del Studio (más simple de instalar, pero dos copias que mantener)?
3. **Puerto:** 8710 (para no chocar con Vertex-Agent en 8700).

## Decisiones tomadas (19/11/2026)

- Portero: opcional y fuera del repositorio público (licencia propietaria). Si responde en :8900 se usa; si no, directo a LM Studio.
- Biblioteca: carpeta vertex-salvador al lado de esta, o variable VERTEX_SALVADOR_DIR.
- Puerto: 8710.
