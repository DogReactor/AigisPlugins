import { calLevel } from './calculator'

class GrowthStage {
    public ID: string
    private MaxLevel: Array<number>
    constructor(id: string, maxLevel: Array<number>) {
        this.ID = id
        this.MaxLevel = maxLevel
    }
    getMaxLevel(rare: keyof Array<Object>) {
        return this.MaxLevel[rare]
    }
}

class RareStage {
    public ID: string
    public ExpMult: number
    public AWGoldCost: number
    public OrbCost: number
    public MaxGrowth: number
    constructor(id: string, expMult: number) {
        this.ID = id
        this.ExpMult = expMult
        if (expMult < 1.2) {
            this.MaxGrowth = 0
            this.AWGoldCost = 0
        }
        else if (expMult < 1.3) {
            this.MaxGrowth = 1
            this.AWGoldCost = 0
        }
        else {
            this.AWGoldCost = 20 + (expMult - 1.3) * 50
            this.OrbCost = (expMult - 1.2) * 10
            this.MaxGrowth = 3
        }
    }
}

const RareList = [
    new RareStage('铁', 1),
    new RareStage('铜', 1.1),
    new RareStage('银', 1.2),
    new RareStage('金', 1.3),
    new RareStage('白', 1.4),
    new RareStage('黑', 1.5),
    new RareStage('蓝', 1.4)
]

const StageList = [
    new GrowthStage('CC前', [30, 40, 50, 50, 50, 50, 50]),
    new GrowthStage('CC后', [30, 40, 55, 60, 70, 80, 65]),
    new GrowthStage('第一觉醒', [30, 40, 55, 80, 90, 99, 85]),
    new GrowthStage('第二觉醒', [30, 40, 55, 99, 99, 99, 99])
]

class Profession {
    public Name: string
    public Stages: Array<Object>
    public AWOrbs: Array<number>
    constructor(c: any) {
        this.Name = c.Name
        switch (c.MaxLevel) {
            case '50': this.Stages = StageList; break
            case '80': this.Stages = StageList.slice(1, c.Depth + 1); break
            case '99': this.Stages = StageList.slice(1, 2); break
            default: break
        }
        this.AWOrbs.push(c.Data_ExtraAwakeOrb1, c.Data_ExtraAwakeOrb2)
    }
}

let ClassList = new Array()



class Unit {
    public ID: number
    public CardID: number
    public Name: string
    public Class: Profession
    public Rare: RareStage
    public Stages: Array<GrowthStage>
    public Proficiency: Object
    public Favor: number
    public SkillLevel: Array<number>
    constructor(rawData: RawData, u) {
        this.ID = u.UnitID
        this.Name = rawData.NameText[u.A1 - 1].Message
        this.CardID = u.A1
        let c = rawData.ClassData.find(e => e.ClassID == u.A2)

        this.Class = ClassList[c.First.Key]
        this.Rare = RareList[Math.min(rawData.UnitsData.Rare, 6)]
        this.Stages = this.Class.Stages.slice(u.A3)
        this.Proficiency = calLevel(parseInt(u.A4), this.Rare.ExpMult)
        this.Favor = u.A5
        this.SkillLevel.push(u.A6, rawData.SkillList[rawData.UnitsData.ClassLV1SkillID].LevelMax)
    }
}



let GlobalExpMult=1

class ResourceStore {
    public RareSpirit={
        '铁':0,
        '铜':0,
        '银':0,
        '金':0,
        '白':0,
        '黑':0,
        '王':0
    }
    public Gold = 0
    public Bucket = 0
    public DarkBucket=0
    public LittleBlessing={// TO DO 35的小祝福是什么？
        '银':0,
        '金':0,
        '白':0,
        '黑':0,
        '蓝':0
    }
    public Iridescence = 0
    public AWSpirit = 0
    public AW2Spirit = 0
    public SkillAWSpirit = 0
    public MagicCrystal=0
    public Orb = null // TO DO 写出珠子
    addOtherSpirit(classID, num=0) {
        let kindMap = new Map([[7, 'Iridescence'], [10, 'Bucket'],[11,'AWSpirit'],[14,'SkillAWSpirit'],[30,'AW2Spirit'],[36,'DarkBucket']])
        if(kindMap.get(classID)!=undefined) {
            this[kindMap.get(classID)] += num|1
        }
    }
    addRareSpirit(classID, num=0) {
        let rareMap = new Map([[1, '铁'], [2, '铜'], [3, '银'], [4, '金'], [5, '白'], [6, '黑'], [12, '王']])
        this.RareSpirit[rareMap.get(classID)] += num|1
    }
    addLittleSpirit(rare, num=0) {
        let rareMap = new Map([[2, '银'], [3, '金'], [4, '白'], [5, '黑'], [7, '蓝']])
        this.LittleBlessing[rareMap.get(rare)] += num|1
    }
    eatLittleBlessing(rare: RareStage) {
        let exp = 0
        if (this.LittleBlessing[rare.ID] > 0) {
            this.LittleBlessing[rare.ID] -= 1
        }
        switch (rare.ID) {
            case '银': exp = 3000; break
            case '金': exp = 18000; break
            case '白': exp = 19000; break
            case '黑': exp = 20000; break
            case '蓝': exp = 19000; break
            default: break
        }
        return exp
    }
    eatPackage(rare: RareStage) {
        let exp = 0
        if (this.RareSpirit[rare.ID] >= 3 && this.Bucket > 0) {
            this.LittleBlessing[rare.ID] -= 3
            this.Bucket -= 1
            exp = 8000
        }
        return exp
    }
    eatRainBow(skillLv: number, maxSkillLv: number) {
        let suc = false
        let cost = 0
        let upSkillChance = {
            '3': [1, 0.25],
            '5': [1, 0.75, 0.5, 0.25],
            '10': [1, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25],
            '16': [1, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25]
        }
        if (skillLv != maxSkillLv) {
            upSkillChance[maxSkillLv].slice(skillLv - 1, maxSkillLv).forEach(c => cost += 1 / c)
            if (this.Iridescence >= cost) {
                this.Iridescence -= cost
                suc = true
            }
        }
        else {
            suc = true
        }
        return suc
    }
}

class RawData {
    public NameText: Array<Object>
    public UnitsData: Array<Object>
    public ClassData: Array<Object>
    public SkillList: Array<Object>
}

export function parseGameData(rawData: RawData, playerUnitData:Array<Object>, spiritStore:Array<Object>): Array<Object> {
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


    let barracksInfo = new Array()
    let resourceStore=new ResourceStore
    playerUnitData.forEach(u => {
        if (u.UnitID != 0 && u.A2 > 99) {
            barracksInfo.push(new Unit(rawData, u))
        }
        if (u.A2<99) {
            if(1<=u.A2&&u.A2<=6||u.A2==12) {
                resourceStore.addRareSpirit(u.A2)
            }
            else if (u.A2==17) {
                resourceStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare)
            }
            else if (u.A2==32) {
                GlobalExpMult=1.1
            }
            else {
                resourceStore.addOtherSpirit(u.A2)
            }
        }
    })

    spiritStore.forEach(s=>{
        let id =rawData.UnitsData[s.CardID].InitClassID
        if(1<=id&&id<=6||id==12) {
            resourceStore.addRareSpirit(id,s.Count)
        }
        else if (id==17) {
            resourceStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare,s.Count)
        }
        else if (id==32) {
            GlobalExpMult=1.1
        }
        else {
            resourceStore.addOtherSpirit(id,s.Count)
        }
    })

    // TO DO 获取金钱、魔水、宝珠
    return [barracksInfo,resourceStore]
}