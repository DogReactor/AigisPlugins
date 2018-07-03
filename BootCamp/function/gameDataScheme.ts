import { RareStage, GrowthStage, Unit, ResourceStore, Profession } from './gameData.service'


let ClassList = new Array()




class ParsedGameData {
    public BarrackInfo: Array<Unit>
    public ResStore: ResourceStore
}
export function parseGameData(rawData: RawData, playerUnitData: Array<Object>, spiritStore: Array<Object>): ParsedGameData {
    rawData.ClassData.map(c => Object.defineProperty(c, 'Pre', {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
    }))
    rawData.ClassData.forEach(c => {
        Object.defineProperty(c, 'Depth', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: 0
        })
        if (c.JobChange != 0) {
            rawData.ClassData.find(e => e.ClassID == c.JobChange).Pre = c
        }
        if (c.AwakeType1 != 0) {
            rawData.ClassData.find(e => e.ClassID == c.AwakeType1).Pre = c
        }
        if (c.AwakeType2 != 0) {
            rawData.ClassData.find(e => e.ClassID == c.AwakeType2).Pre = c
        }
        if (c.ClassID % 10 == 1) {
            c.Pre = rawData.ClassData.find(e => e.ClassID == c.ClassID - 1)
            c.Depth = 0
        }
    })
    rawData.ClassData.forEach(c => {
        if (c.Pre == null) {
            let key = ClassList.push(new Profession(c)) - 1
            Object.defineProperty(c, 'Key', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: key
            })
        }
        else if (c.ClassID % 10 != 1) {
            let count = 0
            let k = c
            while (k.Pre != null) {
                k = k.Pre
                count += 1
                k.Depth = Math.max(k.Depth, count)
            }
            c.First = k
        }
    })


    let parsedGameData = new ParsedGameData
    playerUnitData.forEach(u => {
        if (u.UnitID != 0 && u.A2 > 99) {
            parsedGameData.BarrackInfo.push(new Unit(rawData, u))
        }
        if (u.A2 < 99) {
            if (1 <= u.A2 && u.A2 <= 6 || u.A2 == 12) {
                parsedGameData.ResStore.addRareSpirit(u.A2)
            }
            else if (u.A2 == 17) {
                parsedGameData.ResStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare)
            }
            else if (u.A2 == 32) {
                parsedGameData.ResStore.GlobalExpMult = 1.1
            }
            else {
                parsedGameData.ResStore.addOtherSpirit(u.A2)
            }
        }
    })

    spiritStore.forEach(s => {
        let id = rawData.UnitsData[s.CardID].InitClassID
        if (1 <= id && id <= 6 || id == 12) {
            parsedGameData.ResStore.addRareSpirit(id, s.Count)
        }
        else if (id == 17) {
            parsedGameData.ResStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare, s.Count)
        }
        else if (id == 32) {
            parsedGameData.ResStore.GlobalExpMult = 1.1
        }
        else {
            parsedGameData.ResStore.addOtherSpirit(id, s.Count)
        }
    })

    // TO DO 获取金钱、魔水、宝珠
    return parsedGameData
}