@echo off
SET PATH=%~dp0tools\Utilities\Lua 5.3;%~dp0tools\Utilities\cURL\bin;%PATH%
SET SCRIPTSDIR=.\plugins\DeyunGroup\tools\Scripts\
SET LUAEXT=.lua
SET RUNSCRIPTS=%SCRIPTSDIR%%1%LUAEXT%
lua %RUNSCRIPTS% %2