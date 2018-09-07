import { ipcRenderer } from 'electron'
import * as fs from 'fs'
import * as cp from 'child_process'
const dataDir = './assets';
var mailBox = null
const ALTools = './tools/AL.bat'

class Cargo {
  ClassInfos = []
  NameText = []
  UnitsInfos=[]
  BarracksInfos=[]
  isRequired = false
  isReady() {
    if(this.ClassInfosPath.length>0 && this.UnitsInfos.length > 0 && this.BarracksInfos.length>0 && this.NameText.length>0) {
      return true
    }
    else {
      return false
    }
  }

}
var cargo=new Cargo()

export function run(pluginHelper) {
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
  console.log(classInfosPath)
  let ls = cp.spawn(ALTools, [attr,classInfosPath], {})
  ls.stderr.on('data', (data) => {
    console.log('stderr: ' + data);
  })
  ls.on('exit', (code) => {
    if (code === 0) {
      console.log('Decrypt ' + attr + ' successed');
      fs.readFile(attr, (err,text)=>{
        if(err) {
          Console.log(err)
        }
        else{
          let classes = text.split('\n')
          let heads = classes.shift().split(' ').filter(s=>s!='')
          classes.forEach((c)=>{
            let attrs = c.split(' ').filter(s=>s!='')
            let cl = {}
            for(let i in heads){
              if(attrs[i].startsWith('\"')){
                attrs[i]=attrs[i].substr(1,-1)
                cl[heads[i]] = attrs[i]
              }
              else {
                cl[heads[i]]=parseInt(attrs[i])
              }
            }
            cargo[attr].push(cl)
          })
        }
      })
    }
    else {
      console.log('Failed to decrypt ' + attr, ' ALTools exited with code ' + code);
    }
  })
}

ipcRenderer.on('fileList', (event, obj, tabId) => {
  let classInfoKey = Object.entries(obj).find(e => { return e[1] === 'PlayerUnitTable.aar' })
  donwloadAssets(classInfoKey, 'ClassInfos')
  let nameInfoKey = Object.entries(obj).find(e => { return e[1] === 'NameText.atb' })
  donwloadAssets(nameInfoKey, 'NameText')
})

export function newGameResponse(event, data) {
  switch (event) {
    case 'allcards-info':
      cargo.UnitsInfos = data
      break
    case 'allunits-info':
      cargo.BarracksInfos = data.filter(u=>{
        let classID = parseInt(u.A2)
        // 排除王子和圣灵
        if(( u.A2.startsWith('9')&&classID != 9800 ) || classID<100) {
          return false
        }
        else {
          return true
        }
      })
      break
  }
  if(cargo.isReady()&&cargo.isRequired){
    cargo.isRequired=false
    mailBox.sendMessage(cargo)
  }
}


function initInfos(classInfo, nameInfo, unitsInfo, barracksInfo) {
  classList = classInfo.filter(c => {
    c.classID % 100 == 0;
  });





