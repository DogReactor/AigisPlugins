// const remote = require('electron').remote
// remote.getCurrentWebContents().openDevTools()
const { ItemList } = require('./item')
const rareColor = { 0: 'Iron', 1: 'Copper', 2: 'Silver', 3: 'Gold', 4: 'White', 5: 'Black', 7: 'Blue' }
class DropInfo {
    constructor(msg) {
        const record = msg.dropInfo
        this.Time = msg.time
        this.Items = record.DropInfos.map((item) => {
            let dropItem = {}
            dropItem.ItemID = item.Treasure
            if (cardList[dropItem.ItemID]) {
                let unit = cardList[dropItem.ItemID]
                dropItem.Name = unit.Name
                dropItem.DescHtml = '<div class = "dropitem ' + rareColor[unit.Rare] + '">' + dropItem.Name + '</div>'
            } else if (ItemList[dropItem.ItemID]) {
                dropItem.DescHtml = '<img class = "dropitem" src="' + ItemList[dropItem.ItemID] + '">'
                dropItem.Name = dropItem.DescHtml
            } else {
                dropItem.Name = '？？？'
                dropItem.DescHtml = '<div class = "dropitem">' + dropItem.Name + '</div>'
            }
            dropItem.Display = item.Num > 0 ? 'YES' : 'NO'
            dropItem.EnemyOrder = item.EnemyOrder
            dropItem.ProbMod = (item.Prob-100).toString()+' %'
            return dropItem
        })
        this.Summary = this.Items.filter(e => e.Display==='YES')
            .map(e => e.DescHtml)
            .reduce((accu, curr) => accu + curr)

    }
}

var cardList = {}
var mailBox = null
function run(pluginHelper) {
    mailBox = pluginHelper
    pluginHelper.sendMessage(
        'Request units info', (response) => {
            if (response === 'Wait to ready') { } else {

                response.NameText.forEach((nameMsg, index) => {
                    // 圣灵和桶使用另外的流程
                    if (response.UnitsList.InitClassID[index] >= 100) {
                        cardList[response.UnitsList.CardID[index]] = {
                            Name: nameMsg.Message,
                            Rare: response.UnitsList.Rare[index]
                        }
                    }
                })
                app.fullscreenLoading = false
            }
        })

    pluginHelper.sendMessage(
        'Request spoils', (response) => {
            app.dropHistory = response.map(e => new DropInfo(e)).reverse()
        })

    pluginHelper.onMessage(msg => {
        console.log(msg)
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
                app.dropHistory.unshift(new DropInfo(msg.data))
                break
            default: break
        }
    },response=>response('Ok'))
}

var app = new Vue({
    el: '#app',
    data() {
        return {
            fullscreenLoading: false,
            dropHistory: [],
        }
    }
})
module.exports = {
    run: run
}