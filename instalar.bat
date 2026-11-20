@echo off
REM ============================================================================
REM  instalar.bat - Prepara el backend de vertex-salvador-studio.
REM  Crea un entorno de Python propio (backend\.venv): no cambia el Python del
REM  sistema. Se puede ejecutar varias veces sin problema.
REM ============================================================================
setlocal
cd /d "%~dp0backend"

echo.
echo [1/4] Comprobando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: no encuentro Python. Instala Python 3.10 o superior desde https://www.python.org/downloads/
    echo y marca "Add python.exe to PATH". Luego vuelve a ejecutar este archivo.
    pause
    exit /b 1
)
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 (
    echo ERROR: hace falta Python 3.10 o superior.
    pause
    exit /b 1
)

echo.
echo [2/4] Comprobando la carpeta vertex-salvador al lado de esta...
if not exist "..\..\vertex-salvador\agente\servidor_mcp.py" (
    if "%VERTEX_SALVADOR_DIR%"=="" (
        echo ERROR: no encuentro la carpeta vertex-salvador junto a vertex-salvador-studio.
        echo Pon las dos carpetas lado a lado, o define la variable VERTEX_SALVADOR_DIR.
        pause
        exit /b 1
    )
)

echo.
echo [3/4] Creando el entorno e instalando dependencias...
if not exist ".venv\Scripts\python.exe" python -m venv .venv
".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt pytest
if errorlevel 1 (
    echo ERROR: no se pudieron instalar las dependencias. Revisa la conexion a internet.
    pause
    exit /b 1
)

echo.
echo [4/4] Pruebas del backend (sin LM Studio)...
".venv\Scripts\python.exe" -m pytest -q
if errorlevel 1 (
    echo ERROR: las pruebas fallaron. Copia lo que aparece arriba.
    pause
    exit /b 1
)
echo.
echo Listo. Para arrancar: iniciar.bat
pause
