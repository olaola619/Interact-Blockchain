@echo off
cd /d "%~dp0"
mode con: cols=150 lines=60
node main.js
pause