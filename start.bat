@echo off
setlocal
title Resume Builder
cd /d "%~dp0"

echo.
echo   Resume Builder
echo   Starting the web app and API...
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1"
if errorlevel 1 (
  echo.
  echo Startup failed. Review the message above and the files in the logs folder.
  echo.
  pause
  exit /b 1
)

echo.
echo Resume Builder is ready. This window can be closed.
timeout /t 3 /nobreak >nul
endlocal
