
const fs = require ('fs')
const cp = require('child_process')

const dataDir = '.\\plugins\\DeyunGroup\\tools\\assets\\'
var mailBox = null
const ALTools = '.\\plugins\\DeyunGroup\\tools\\AL.bat'

class Cargo {
  constructor(){
    this.ClassInfos = []
    this.NameText = []
    this.UnitsInfos=[]
    this.BarracksInfos=[]
    this.isRequired = false
    this.DataReady={'ClassInfos':false,'NameText':false,'UnitsInfos':false,'BarracksInfos':false}
  }
  isReady() {
    if(Object.values(this.DataReady).every(e=>e)) {
      return true
    }
    else {
      return false
    }
  }

}
var cargo=new Cargo()

function run(pluginHelper) {
  mailBox = pluginHelper
  mailBox.onMessage((msg, sendResponse) => {
    switch (msg) {
      case 'Request raw data':
        if(cargo.isReady()){
          sendResponse(cargo)
        }
        else {
          sendResponse('Wait to ready')
          cargo.isRequired = true
        }
    }
  })
}

function donwloadAssets(key, attr) {
  let url = 'http://assets.millennium-war.net' + key[0]
  let ls = cp.spawn(ALTools, [attr, url], {})
  // ls.stderr.on('data', (data) => {
  //     console.log('stderr: ' + data);
  // })
  ls.on('exit', (code) => {
      if (code === 0) {
          fs.readFile(dataDir+attr, 'utf-8', (err, text) => {
              if (err) {
                  console.log(err)
              } 
              else {
                  text.trim()
                  let classes = text.split('\n')
                  let heads = classes.shift().trim().split(' ').filter(s => s != '')
                  classes.forEach((c) => {
                      c.trim()
                      let attrs = c.split(' ').filter(s => s != '')
                      for(let i=0;i<attrs.length-1;++i){
                        if(attrs[i][0]==='\"'&&attrs[i].substr(-1)!='\"')
                        {
                          let str=attrs[i+1]
                          attrs[i]+=' '+str
                          attrs.splice(i+1,1)
                          --i
                        }
                      }
                      let cl = {}
                      if(heads.length<attrs.length) {
                        for (let i in heads) {
                          if (attrs[i][0]=='\"') {
                              attrs[i] = attrs[i].slice(1, -1)
                              cl[heads[i]] = attrs[i]
                          } else {
                              cl[heads[i]] = parseInt(attrs[i])
                          }
                      }
                      cargo[attr].push(cl)
                      }

                  })
                  cargo.DataReady[attr]=true
              }
          })
      } else {
          console.log('Failed to decrypt ' + attr, ' ALTools exited with code ' + code);
      }
  })
}
function newGameResponse(event, data) {
  switch (event) {
    case 'allcards-info':

      fs.writeFile('cards',JSON.stringify(data),err=>{})
      let num = data['Ability'].length
      for (let i=0;i<num;++i){
        cargo.UnitsInfos[i]={}
      }
      Object.entries(data).forEach(attr=>{
        console.log(attr)
        cargo.UnitsInfos.forEach((u,index)=>{
          u[attr[0]]=attr[1][index]
        })
      })
      cargo.DataReady['UnitsInfos']=true
      break
    case 'allunits-info':
      cargo.BarracksInfos = data.filter(u=>{
        let classID = parseInt(u.A2)
        // 排除王子和圣灵
        if(( u.A2[0]=='9'&&classID != 9800 ) || classID<100) {
          return false
        }
        else {
          return true
        }
      })
      cargo.DataReady['BarracksInfos']=true
      break
    case 'file-list':
      let classInfoKey = Object.entries(data).find(e => { return e[1] === 'PlayerUnitTable.aar' })
      donwloadAssets(classInfoKey, 'ClassInfos')
      let nameInfoKey = Object.entries(data).find(e => { return e[1] === 'NameText.atb' })
      donwloadAssets(nameInfoKey, 'NameText')
      break
    default:break
  }
  if(cargo.isReady()&&cargo.isRequired){
    cargo.isRequired=false
    mailBox.sendMessage(cargo)
  }
}




module.exports = {
  run:run,
  newGameResponse:newGameResponse
}





