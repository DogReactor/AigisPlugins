-- download.lua library
-- v1.0
-- author: lzlis

local file = require("plugins\\DeyunGroup\\tools\\scripts\\lib\\file")
local curl = require("plugins\\DeyunGroup\\tools\\scripts\\lib\\curl")

local function getfile(path, filename)

  local local_dir = "plugins\\DeyunGroup\\tools\\Cache"
  if not file.dir_exists(local_dir) then
    file.make_dir(local_dir)
  end
  local local_spec = local_dir .. "\\" .. filename .. '.cache'
  curl.execute("--output", local_spec, "--compressed", path)

  local h = assert(io.open(local_spec, 'rb'))
  local text = assert(h:read('*a'))
  assert(h:close())
  return text
end


return {
  getfile = getfile
}
