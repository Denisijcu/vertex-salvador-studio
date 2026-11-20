@echo off
REM vertex-salvador-studio - arranca el backend en http://localhost:8710
REM Requisitos: haber ejecutado instalar.bat y tener LM Studio abierto con el servidor local encendido.
setlocal
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    echo Primero ejecuta instalar.bat
    pause
    exit /b 1
)
".venv\Scripts\python.exe" app.py
pause
