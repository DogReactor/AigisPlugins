local parse_al = require("plugins\\DeyunGroup\\tools\\scripts\\lib\\parse_al")
local output_al = require("plugins\\DeyunGroup\\tools\\scripts\\lib\\output_al")
local dl = require("plugins\\DeyunGroup\\tools\\scripts\\lib\\download")
local outPath = "plugins\\DeyunGroup\\tools\\assets\\"
local working = "plugins\\DeyunGroup\\tools\\working\\"
local outFilePath = outPath .. "NameText.atb\\ALTB_gdtx.txt"
local outFileEndPath = outPath .. "NameText"
local url = ...
local text = dl.getfile(url, 'NameText')
local obj = parse_al.parse(text)
output_al.output(obj, outPath .. "NameText.atb\\", working)
os.execute("cmd /c copy " .. outFilePath .. " " .. outFileEndPath)
os.execute("cmd /c rmdir /s/q " .. outPath .. "NameText.atb")
