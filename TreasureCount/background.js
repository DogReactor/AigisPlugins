const { ItemList } = require('./item')

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


var spoilsHistory = []
var mailBox = null

function run(pluginHelper) {
  mailBox = pluginHelper
  mailBox.onMessage((msg, sendResponse) => {
    switch (msg) {
      case 'Request units info':
        if (cargo.checkReady()) {
          sendResponse(cargo)
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

  pluginHelper.aigisGameDataService.subscribe('quest-start', (url, data) => {
    const date = new Date()
    const time = date.getHours()+':'+date.getMinutes()
    let getDropInterval = setInterval(() => {
      if (spoilsHistory.length !== pluginHelper.aigisStatisticsService.getStats('spoils').length) { 
        spoilsHistory.push({time:time, dropInfo:pluginHelper.aigisStatisticsService.getStats('spoils')[spoilsHistory.length]})
        pluginHelper.sendMessage({ title: 'updateSpoils', data: spoilsHistory[spoilsHistory.length - 1] }, (response) => { })
        clearInterval(getDropInterval)
      }
    },1000)
  })
  pluginHelper.aigisGameDataService.subscribe('allcards-info', (url, data) => {
    cargo.UnitsList = data
    cargo.DataReady.UnitsList = true
    cargo.checkReady(mailBox)
  })

  pluginHelper.aigisGameDataService.subscribe('NameText.atb', (url, data) => {
    cargo.NameText = data.Contents
    cargo.DataReady.NameText = true
    cargo.checkReady(mailBox)
  })
}


module.exports = {
  run: run
}
