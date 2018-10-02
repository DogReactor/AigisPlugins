const { ItemList, treasureHunter } = require('./item')

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
      post.sendMessage({ title: 'UnitsInfo', data: this })
      this.isRequired = false
    }
    return flag
  }
}

var library = {
  QuestsList: {},
  MapsInfo: {}
}
var spoilsHistory = []
var mailBox = null

var batman = null

function run(pluginHelper) {
  mailBox = pluginHelper
  mailBox.onMessage((msg, sendResponse) => {
    switch (msg) {
      case 'Request units info':
        if (cargo.checkReady()) {
          sendResponse({ title: 'UnitsInfo', data: cargo })
        } else {
          sendResponse('Wait to ready')
          cargo.isRequired = true
        }
        break
      case 'Request without promise':
        sendResponse({ title: 'UnitsInfo', data: cargo })
        break
      case 'Request spoils':
        sendResponse(spoilsHistory)
        break
      default:
        break
    }
  })


  subscribeDataChunk(pluginHelper)
  subscribeUnitChangeEvent(pluginHelper)

  pluginHelper.aigisGameDataService.subscribe('quest-start', (data, url) => {
    console.log('quest-req', data)
    batman = data.BL
  }, true)
  pluginHelper.aigisGameDataService.subscribe('quest-start', (data, url) => {
    console.log('quest-response', data)
    Promise.all([parseSpoils(data), treasureHunter.ModTeamProb(batman)])
      .then(([dropInfo, sucMsg]) => {
        console.log(dropInfo, sucMsg)
        spoilsHistory.push(dropInfo)
        mailBox.sendMessage({ title: 'updateSpoils', data: dropInfo })
        return treasureHunter.RemarkProb(dropInfo)
      }, rej => { throw rej })
      .then(record => sendRecord(record)).catch(err => console.log(err))
  })
}

function subscribeDataChunk(pluginHelper) {
  pluginHelper.aigisGameDataService.subscribe('allcards-info', (data, url) => {
    cargo.UnitsList = data
    treasureHunter.LoadRawData('UnitsList', data)
    cargo.DataReady.UnitsList = true
    cargo.checkReady(mailBox)
  })
  pluginHelper.aigisGameDataService.subscribe('allunits-info', (data, url) => {
    treasureHunter.LoadRawData('BarrackInfo', data)
  })
  pluginHelper.aigisGameDataService.subscribe('AbilityConfig.atb', (data, url) => {
    treasureHunter.LoadRawData('AbilityConfig', data.Contents)
  })
  pluginHelper.aigisGameDataService.subscribe('AbilityList.atb', (data, url) => {
    treasureHunter.LoadRawData('AbilityList', data.Contents)
  })
  pluginHelper.aigisGameDataService.subscribe('PlayerUnitTable.aar', (data, url) => {
    treasureHunter.LoadRawData('ClassInfo', data.Files[1].Content.Contents)
  })
  pluginHelper.aigisGameDataService.subscribe('all-quest-info', (data, url) => {
    console.log('quest', data)
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
    })
}
function subscribeUnitChangeEvent(pluginHelper) {
  pluginHelper.aigisGameDataService.subscribe('new-gacha-result', (data, url) => {
    treasureHunter.updateHunter('new-unit', data.PPU)
  })
  pluginHelper.aigisGameDataService.subscribe('white-guarantee-gacha', (data, url) => {
    treasureHunter.updateHunter('new-unit', data.PPU)
  })
  pluginHelper.aigisGameDataService.subscribe('fame-gacha-result', (data, url) => {
    treasureHunter.updateHunter('new-unit', data.PPU)
  })

  pluginHelper.aigisGameDataService.subscribe('cc', (data, url) => {
    treasureHunter.updateHunter('unit-evo', data.PPU)
  })
  pluginHelper.aigisGameDataService.subscribe('aw1', (data, url) => {
    treasureHunter.updateHunter('unit-evo', data.PPU)
  })
  pluginHelper.aigisGameDataService.subscribe('aw2', (data, url) => {
    treasureHunter.updateHunter('unit-evo', data.PPU)
  })
  pluginHelper.aigisGameDataService.subscribe('unit-sell', (data, url) => {
    console.log(data)
    treasureHunter.updateHunter('del-unit', data.PPU)
  }, true)
}
function sendRecord(record) { }
async function parseSpoils(data) {
  let index = library.QuestsList.QuestID.findIndex(q => q == data.QR.QuestID)
  let mapKey = 'Map' + library.QuestsList.MapNo[index] + '.aar'
  let entryKey = 'Entry' + library.QuestsList.EntryNo[index].toString().padStart(2, '0') + '.atb'

  let mapInfo = library.MapsInfo[mapKey][entryKey]
  let dropInfo = []
  mapInfo.forEach((e, i) => {
    if (e.PrizeCardID > 0) {
      dropInfo.push({ Treasure: e.PrizeCardID, ID: library.QuestsList.QuestID[index], Order: i })
    }
  })

  for (let i in dropInfo.length) {
    dropInfo[i].Num = data.LOTTERY.Result[i]
    let treasureKey = 'Treasure' + dropInfo[i].Treasure
    dropInfo[i].Treasure = library.QuestsList[treasureKey][index]
  }
  return Promise.resolve(dropInfo)
}


module.exports = {
  run: run
}
