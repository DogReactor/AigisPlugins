const remote = require('electron').remote
remote.getCurrentWebContents().openDevTools()
const { ItemList} = require('./item')
const path = require('path')

class DropTerm {
    QuestID = 0;
    Treasure=[];
    constructor(dropInfo) {
        this.QuestID = dropInfo.ID
        let item = {}
    }

    getTermDesc(id) {
        
    }
}


var cardList = []
var dropHistory = []

var mailBox = null
function run(pluginHelper) {
    mailBox = pluginHelper
    pluginHelper.sendMessage(
        'Request raw data', (response) => {
            if (response === 'Wait to ready') {} else {
                response.NameText.forEach((nameMsg, index) => {
                    // 圣灵和桶使用另外的流程
                    if (response.UnitList.InitClassID[index] >= 100) {
                        cardList[response.UnitList.CardID[index]] = {
                            Name: nameMsg.Message,
                            Rare: response.UnitList.Rare[index]
                        }
                    }
                })
            }
        })

    pluginHelper.onMessage(msg => {
        switch (msg.title) {
            case 'UnitsInfo':
                msg.data.NameText.forEach((nameMsg, index) => {
                    // 圣灵和桶使用另外的流程
                    if (msg.data.UnitList.InitClassID[index] >= 100) {
                        cardList[msg.data.UnitList.CardID[index]] = {
                            Name: nameMsg.Message,
                            Rare: msg.data.UnitList.Rare[index]
                        }
                    }
                })
                break
            case 'updateSpoils':

        }


    })
}
module.exports = {
    run: run
}