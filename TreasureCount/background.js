var cargo = {
  UnitsList: {},
  NameText: [],
  DataReady: {
    UnitsList: false,
    NameText: false
  },
  isRequired: false,
  checkReady(post) {
    let flag = Object.values(this.DataReady).every(e => e)
    if (flag && this.isRequired) {
      post.sendMessage({title:'UnitsInfo',data:this})
      this.isRequired = false
    }
    return flag
  }
}

var library = {
  QuestsList:{},
  MapsInfo:{}
}

var spoilsHistory = []
var mailBox = null
function run(pluginHelper) {
  mailBox = pluginHelper
  mailBox.onMessage((msg, sendResponse) => {
    switch (msg) {
      case 'Request units info':
        if (cargo.checkReady()) {
          sendResponse({title:'UnitsInfo',data:cargo})
        } else {
          sendResponse('Wait to ready')
          cargo.isRequired = true
        }
        break
      case 'Request without promise':
        sendResponse({title:'UnitsInfo',data:cargo})
        break
      case 'Request spoils':
        sendResponse(spoilsHistory)
        break
      default:
        break
    }
  })

  pluginHelper.aigisGameDataService.subscribe('allcards-info', (data, url) => {
    cargo.UnitsList = data
    cargo.DataReady.UnitsList = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe('all-quest-info', (data, url) => {
    console.log(data)
    library.QuestsList = data
  })
  pluginHelper.aigisGameDataService.subscribe('NameText.atb', (data, url) => {
    cargo.NameText = data.Contents
    cargo.DataReady.NameText = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe(
    file => file.includes('Map') && file.includes('.aar'),
    (data, url) => {
      if (!library.MapsInfo[data.Label]) {
        library.MapsInfo[data.Label] = {}
      }
      data.Data.Files.forEach(e => {
        if (e.Name != 'MapPng.atx') {
          library.MapsInfo[data.Label][e.Name] = e.Content.Contents
        }
      })
      console.log(library.MapsInfo)
    })

  pluginHelper.aigisGameDataService.subscribe('quest-start', (data, url) => {
    let thisDrop = parseSpoils(data)
    spoilsHistory.push(thisDrop)
    mailBox.sendMessage({title:'updateSpoils', data:thisDrop})
  })

}

function parseSpoils(data) {
  let index = library.QuestsList.QuestID.findIndex(q=>q==data.QR.QuestID)
  let mapKey = 'Map' + library.QuestsList.MapNo[index] + '.aar'
  let entryKey = 'Entry' + library.QuestsList.EntryNo[index].toString().padStart(2,'0') + '.atb'

  let mapInfo = library.MapsInfo[mapKey][entryKey]
  let dropInfo = []
  mapInfo.forEach((e,i)=>{
    if(e.PrizeCardID>0) {
      dropInfo.push({Treasure:e.PrizeCardID, ID:library.QuestsList.QuestID[index], Order:i, Num:0})
    }
  })
  for (let i in dropInfo.length) {
    dropInfo[i].Num += data.LOTTERY.Result[i]
    let treasureKey = 'Treasure' + dropInfo[i].Treasure
    dropInfo[i].Treasure = library.QuestsList[treasureKey][index]
  }
  console.log(dropInfo)

  return dropInfo

}


module.exports = {
  run: run
}
