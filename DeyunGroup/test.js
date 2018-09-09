const fs=require('fs')
const cp=require('child_process')
const ALTools = '.\\tools\\AL.bat'
function donwloadAssets(key, attr) {
    let url = 'http://assets.millennium-war.net' + key[0]
    console.log(url)
    let ls = cp.spawn(ALTools, [attr, url], {})
    ls.stderr.on('data', (data) => {
        console.log('stderr: ' + data);
    })
    ls.on('exit', (code) => {
        if (code === 0) {
            console.log('Decrypt ' + attr + ' successed');
            fs.readFile('.\\tools\\assets\\'+attr, 'utf-8', (err, text) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(text)
                    let classes = text.split('\n')
                    let heads = classes.shift().split(' ').filter(s => s != '')
                    classes.forEach((c) => {
                        let attrs = c.split(' ').filter(s => s != '')
                        let cl = {}
                        for (let i in heads) {
                            if (attrs[i].startsWith('\"')) {
                                attrs[i] = attrs[i].substr(1, -1)
                                cl[heads[i]] = attrs[i]
                            } else {
                                cl[heads[i]] = parseInt(attrs[i])
                            }
                        }
                        cargo[attr].push(cl)
                    })
                    cargo.DataReady[attr]=true
                }
            })
        } else {
            console.log('Failed to decrypt ' + attr, ' ALTools exited with code ' + code);
        }
    })
  }

donwloadAssets(['http://assets.millennium-war.net/ce85a0f095d27719274dba591dbe4c131b392bcd/dabe89a5d75061b51a49fef912d1f00f','NameText.aar'],'NameText')
