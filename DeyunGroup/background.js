
var mailBox = null


class Cargo {
  constructor() {
    this.ClassInfos = []
    this.NameText = []
    this.UnitsInfos = []
    this.BarracksInfos = []
    this.isRequired = false
    this.DataReady = {
      ClassInfos: false,
      NameText: false,
      UnitsInfos: false,
      BarracksInfos: false
    }
  }
  checkReady(post) {
    let flag = Object.values(this.DataReady).every(e => e)
    if (flag && this.isRequired) {
        post.sendMessage(this)
        this.isRequired = false
    }
    return flag
  }
}


var cargo = new Cargo()



function run(pluginHelper) {
  mailBox = pluginHelper
  mailBox.onMessage((msg, sendResponse) => {
    switch (msg) {
      case 'Request raw data':
        if (cargo.checkReady()) {
          sendResponse(cargo)
        } else {
          sendResponse('Wait to ready')
          cargo.isRequired = true
        }
        break
      case 'Request without promise':
          sendResponse(cargo)
          break
      default:break
    }
  })

  pluginHelper.aigisGameDataService.subscribe('allcards-info',(url,data)=>{
    let num = data['Ability'].length
      for (let i=0;i<num;++i){
        cargo.UnitsInfos[i]={}
      }
      Object.entries(data).forEach(attr=>{
        cargo.UnitsInfos.forEach((u,index)=>{
          u[attr[0]]=attr[1][index]
        })
      })
    cargo.DataReady.UnitsInfos = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe('allunits-info',(url,data)=>{
    cargo.BarracksInfos = data
    cargo.DataReady.BarracksInfos = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe('NameText.atb',(url,data)=>{
    cargo.NameText = data.Contents
    cargo.DataReady.NameText = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe('PlayerUnitTable.aar',(url,data)=>{
    cargo.ClassInfos = data.Files[1].Content.Contents
    cargo.DataReady.ClassInfos = true
    cargo.checkReady(mailBox)
  })
}






module.exports = {
  run: run
}
