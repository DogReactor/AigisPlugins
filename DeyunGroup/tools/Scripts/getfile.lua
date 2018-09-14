local file, url = ...
local parse_al = require("scripts\\lib\\parse_al")
local output_al = require("scripts\\lib\\output_al")
local dl = require("scripts\\lib\\download")
local outPath = "assets\\"
local working = "working\\"

fileNames = {ClassInfos="PlayerUnitTable.aar",NameText="NameText.atb"}
filePath = {ClassInfos="\\002_ClassData.atb\\ALTB_cldt.txt",NameText="\\ALTB_gdtx.txt"}
local outFilePath = outPath .. fileNames[file] .. filePath[file]
local outFileEndPath = outPath .. file
local text = dl.getfile(url, file)
local obj = parse_al.parse(text)
output_al.output(obj, outPath ..fileNames[file].. "\\", working)

os.execute("cmd /c copy " .. outFilePath .. " " .. outFileEndPath)
os.execute("cmd /c rmdir /s/q " .. outPath .. fileNames[file])
