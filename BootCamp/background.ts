
// Background script of BootCamp
class RawData {
    ID:String
    Body:Array<Object>
    constructor(id:String) {
        this.ID = id
        this.Body=new Array()
    }
}

class Cargo {
    public NameText = new RawData('NameText')
    public UnitsData = new RawData('UnitsData')
    public ClassData = new RawData('ClassData')
    public SkillList = new RawData('SkillList')
    public PlayerUnitsData = new RawData('PlayerUnitsData')
    constructor() {
        // TO DO 获取职业、名字表、技能信息
    }
}

let cargo = new Cargo
let mailBox = null

export function run(pluginHelper) {
    mailBox = pluginHelper
    mailBox.onMessage((msg,sendResponse) => {
        switch (msg) {
            case 'Request raw data':
                sendResponse(Object.values(cargo).filter(e => e.Body.length > 0))
        }
    })
}

export function newGameResponse(event, data) {
    switch (event) {
        case 'allcards-info':
            cargo.UnitsData.Body = data
            mailBox.sendMessage(Array.of(cargo.UnitsData))
            break
        case 'allunits-info':
            cargo.PlayerUnitsData.Body = data
            mailBox.sendMessage(Array.of(cargo.PlayerUnitsData))
            break
        default: break
    }

    
};