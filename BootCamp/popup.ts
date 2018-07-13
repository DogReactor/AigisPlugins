import Vue from 'vue'
import ElementUI from 'element-ui'

import { parseGameData, parseSpiritRepo, RawData, ParsedGameData } from './function/gameDataScheme'
import { TrainPlan } from './function/calculator'
class DataRepo {
    public NameText = []
    public UnitsData = []
    public ClassData = []
    public SkillList = []
    public PlayerUnitsData = []
    public SpiritRepo = []
    public PlayerInfo : Object
    public Orbs = []
}


let mailBox = null
let dataRepo = new DataRepo
let gameData=new ParsedGameData
export function run(pluginHelper) {
    mailBox = pluginHelper
    mailBox.sendResponse('Request raw data', (response)=>{
        response.forEach(e => {
            dataRepo[e.ID]=e.Body
            parseGameData(new RawData(dataRepo), dataRepo.PlayerUnitsData).then(g=>gameData=g)
            parseSpiritRepo(new RawData(dataRepo), dataRepo.SpiritRepo,gameData.ResStore)
        });
    })
    mailBox.onMessage((msg) => {
        dataRepo[msg.ID]=msg.Body
        switch(msg.ID){
            case 'SpiritRepo':
                gameData.ResStore=parseSpiritRepo(new RawData(dataRepo), dataRepo.SpiritRepo,gameData.ResStore)
                break
            case 'PlayerUnitData':
                parseGameData(new RawData(dataRepo), dataRepo.PlayerUnitsData).then(g=>gameData=g)
        }
    })
}

let planList:Array<TrainPlan>

Vue.use(ElementUI)

const table=Vue.extend({
    data:{
        Barrack:gameData.BarrackInfo,
        Store:gameData.ResStore,
        planList:planList
    }
})