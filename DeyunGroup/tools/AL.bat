@echo off
SET PATH=%~dp0Utilities\Lua 5.3;%~dp0Utilities\cURL\bin;%PATH%
SET RUNSCRIPTS=.\Scripts\getfile.lua
cd /d %3
lua %RUNSCRIPTS% %1 %2