# Bitácora — vertex-salvador-studio

## 1. 19/11/2026 — Fase 1: backend

**Qué se hizo**
- Backend FastAPI en `backend/` (puerto 8710): `config`, `biblioteca` (las 4 herramientas de vertex-salvador
  importadas en proceso, sin copiarlas), `lmstudio` (busca el modelo, lo carga con contexto 8192, Portero opcional),
  `agente` (bucle de herramientas, hasta 6 vueltas, entiende también el formato de texto de Gemma),
  `verificacion` (marca cifras de la respuesta que no salen de las fuentes), `conversaciones` (historial completo en
  `datos_usuario/`), `app` (endpoints de ARQUITECTURA.md).
- Pruebas: `tests/` con un LM Studio de mentira. 8 pruebas, pasan con Python 3.13 (nube) y 3.10 (copia de las
  carpetas reales del PC).
- `evaluar.py`: pasa las 10 preguntas de `vertex-salvador\eval\prueba_bases.jsonl` por el backend contra el
  LM Studio real y deja un informe en `reportes/`.
- `instalar.bat` (entorno propio en `backend\.venv`, no toca el Python del sistema) e `iniciar.bat`.

**Decisiones tomadas por defecto (pendientes de confirmar con Denis)**
- Portero: opcional; si responde en :8900 el chat pasa por él. No se incluye en este repo (licencia propietaria).
- Biblioteca: carpeta `vertex-salvador` al lado de esta, o variable `VERTEX_SALVADOR_DIR`.
- Puerto 8710.

**Hallazgos en vertex-salvador v1 (no se tocaron; decidir si van en una v1.1)**
- El buscador devuelve 0 resultados si la consulta es la pregunta entera y larga (regla de cobertura del 40 %):
  falla con 5 de las 10 preguntas de evaluación escritas tal cual. El modelo normalmente resume la consulta, así que
  hay que verlo en `evaluar.py` con el modelo real antes de cambiar nada.
- `EPOCAS` en `servidor_mcp.py` llega hasta E14: si el modelo pide E15 (Haití) la época se descarta y no recibe el
  aumento del 50 %. Los resultados siguen saliendo. Arreglo de una línea: `range(1, 16)`.

**Siguiente**: fase 2, interfaz Angular 22 + Material 3.

## 2. 19/11/2026 — Primera evaluación con el modelo real (10 preguntas, 763 s)

Informe: `reportes/evaluacion_2026-11-19_0825.md`.

**Bien:** H03 (inglés, neutral), A02 (Cristosal atribuido y versión del gobierno), A03 (separa 2012 de lo actual),
F01 (82 homicidios en 2025 con su fuente; es la cifra oficial de cierre de año), T01 (llamó a `linea_tiempo`),
T02 (saludo sin herramientas), H02 (no encontró nada y no inventó).

**Arreglado en el Studio (fase 1):**
- T01 se cortó a media frase: el tope era 1500 tokens. Ahora 3000, y si el modelo se corta igual sale un aviso.
- Falsos positivos en «cifras sin respaldo»: «los años 70» y el «2015» que puso el propio usuario. Las décadas y los
  números de la pregunta ya no se marcan. 10 pruebas pasan.

**Del modelo (material para una v1.1 del dataset, no se toca ahora):**
- F01 se inventó una fecha («29 de noviembre de 2025»); la verificación la marcó bien.
- F02 dice que septiembre de 2026 es «el futuro». Debería decir solo que no tiene ese documento.
- A01 atribuye al gobierno una frase que no está en las fuentes («las pandillas han sido neutralizadas») y repite
  la cifra de 62.000 detenidos dos veces.
- H01 es larga y natural pero casi sin apoyo en fuentes: buscó en P01 y rellenó con conocimiento general.
- Elige mal la época a menudo (P01, E04, E15). Como la época es una preferencia y no un filtro, no rompe nada.

**Velocidad:** entre 10 y 155 s por respuesta. En la fase 2 la interfaz tiene que mostrar la respuesta mientras se
escribe (streaming) y qué herramienta está usando en cada momento.

## 3. 19/11/2026 — Fase 2: interfaz Angular 22 + Material 3

**Decisión (Denis: «como tú quieras»)**: el Portero queda opcional y fuera del repositorio público por su licencia
propietaria. Si responde en :8900 se usa; si no, el chat va directo a LM Studio.

**Backend**
- `/api/chat/stream` (Server-Sent Events): eventos `conversacion`, `estado`, `pensando`, `herramienta`,
  `herramienta_fin`, `texto`, `reinicio`, `fin`. El texto en vivo esconde el pensamiento y las llamadas escritas
  en formato Gemma. Por el Portero no hay streaming (revisa la respuesta entera).
- Las fuentes llevan su enlace original (el modelo no lo ve; la interfaz sí).
- «Recargar el modelo»: si está cargado con poco contexto, descarga esa instancia y la vuelve a cargar con 8192.
- Mis documentos: acepta .pdf y .docx (se añadieron pypdf y python-docx); LEEME.txt no aparece ni se puede borrar.
- Línea de tiempo: no muestra la fila X01 (nota interna de EPOCAS.md).
- 15 pruebas pasan.

**Interfaz** (`frontend/`, compilada en `frontend/dist`, el backend la sirve en :8710)
- Preguntar: lista de conversaciones, hilo, panel de fuentes. Se ve qué busca el modelo, la respuesta se escribe
  en vivo, botón Detener. Las cifras sin respaldo salen resaltadas en ámbar dentro de la respuesta.
- Línea de tiempo (por épocas y por temas, o por años), Cifras, Mis documentos, Estado, Guía, Acerca de.
- Paleta: tinta azul sobre papel frío, cobalto, jade y ámbar. Tipos: Source Serif 4 para leer, IBM Plex Sans para
  la interfaz. Fuentes e iconos van dentro (funciona sin internet). Sin símbolos oficiales.
- Probado con Playwright contra un LM Studio simulado: bienvenida, respuesta en vivo, fuentes, documento,
  línea de tiempo, cifras, estado, móvil y LM Studio apagado. Sin errores de consola.

**Fallo mío corregido durante la prueba**: al empezar una conversación nueva la página navegaba a `/chat/<id>` y
eso la recreaba, perdiendo la respuesta en curso. Ahora solo cambia la dirección.

**Para revisar con Denis**
- T04 en EPOCAS.md se llama «… → expansión cubana → …». En la interfaz aparece tal cual en «Por temas». Si se
  quiere un nombre más neutro, se cambia en EPOCAS.md (vertex-salvador).
- vertex-salvador v1 indexa `docs_privados\LEEME.txt` como documento privado: una búsqueda en «privada» puede
  devolverlo. Arreglo en v1.1: saltar LEEME.txt al indexar.
