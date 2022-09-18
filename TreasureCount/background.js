const fs = require('fs')
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
      post.sendMessage({
        title: 'UnitsInfo',
        data: this
      })
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
        sendResponse({
          title: 'UnitsInfo',
          data: cargo
        })
        break
      case 'Request spoils':
        sendResponse(spoilsHistory)
        break
      case 'SendAgain':
        const rec = spoilsHistory[0]
        pluginHelper.aigisStatisticsService.sendRecord({
          type: 'spoils',
          record: rec.dropInfo
        })
        break
    }
  })

  pluginHelper.aigisStatisticsService.subscribe('spoils', (rec) => {
    const date = new Date()
    fs.writeFile("spoils.json", JSON.stringify(rec), (e)=>{
      if (e) {
        console.log(e)
      }
    })
    console.log('recived in back!', rec)
    const time = date.getHours() + ':' + date.getMinutes()
    const record = {
      time: time,
      dropInfo: rec.record.DropInfos,
      name: rec.name
    };
    console.log(record)
    spoilsHistory.push(record)
    pluginHelper.sendMessage({
      title: 'updateSpoils',
      data: record
    }, (response) => {})
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