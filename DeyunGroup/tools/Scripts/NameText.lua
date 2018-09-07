local parse_al = require("scripts/lib/parse_al")
local output_al = require("scripts/lib/output_al")
local dl = require("scripts/lib/download")
local outPath = "..\\assets\\"
local outFilePath = outPath .. "NameText.atb\\ALTB_gdtx.txt"
local outFileEndPath = outPath .. "NameText"
local working = "working\\"
local url = ...
local text = dl.getfile(url)
local obj = parse_al.parse(text)
output_al.output(obj, outPath .. "NameText.atb\\", working)
print(outFilePath,outFileEndPath)
os.execute("cmd /c copy " .. outFilePath .. " " .. outFileEndPath)
os.execute("cmd /c rmdir /s/q " .. outPath .. "NameText.atb")
