import { calculator } from "./function/calculator"
import { GameData } from "./function/gameDataScheme"
// Background script of BootCamp
class RawData {
    public NameText = []
    public UnitsData = []
    public ClassData = []
    public SkillList = []
    public PlayerUnitsData = []
    constructor() {
        // TO DO 获取职业、名字表、技能信息
    }


    isSuffcient() {
        const dataPromise = new Promise((resolve) => {
            if (Object.values(this).every((data) => { return data.length > 0 })) {
                return resolve('Ok')
            }
        })
        return dataPromise
    }
}



async function parseData(rawData:RawData):Promise<GameData> {
    let gameData=new GameData;
    await rawData.isSuffcient()

    return gameData
}

export function run(pluginHelper) {
    pluginHelper.onMessage((msg, sendResponse) => {
        if(msg.sender = "BootCamp") {

        }
    });
}

export function newGameResponse(event, data) {
    if(this.rawData==undefined) {
        this.rawData = new RawData
    }
    
    switch (event) {
        case 'allcards-info':
            this.rawData.UnitsData = data
            break
        case 'allunits-info':
            this.rawData.PlayerUnitsData = data
            break
        default: break
    }

    
};