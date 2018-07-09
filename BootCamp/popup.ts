import { parseGameData, parseSpiritRepo, RawData, ParsedGameData } from './function/gameDataScheme'

class DataRepo {
    public NameText = []
    public UnitsData = []
    public ClassData = []
    public SkillList = []
    public PlayerUnitsData = []
    public SpiritRepo = []
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
        });
    })
    mailBox.onMessage((msg) => {
        dataRepo[msg.ID]=msg.Body
        if(msg.ID=='SpiritRepo') {
            gameData.ResStore=parseSpiritRepo(new RawData(dataRepo), dataRepo.SpiritRepo,gameData.ResStore)
        }
        else if(msg.ID=='PlayerUnitData') {
            parseGameData(new RawData(dataRepo), dataRepo.PlayerUnitsData).then(g=>gameData=g)
        }
    })
}