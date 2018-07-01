import { calLevel } from './calculator'

class GrowthStage {
    public ID:String
    private MaxLevel:Array<Number>
    constructor(id:String, maxLevel:Array<Number>) {
        this.ID=id
        this.MaxLevel=maxLevel
    }
    getMaxLevel(rare:keyof Array<Object>) {
        return this.MaxLevel[rare]
    }
}

class RareStage {
    public ID:String
    public ExpMult:Number
    public AWGoldCost:Number
    public OrbCost:Number
    public MaxGrowth:Number
    constructor(id: String, expMult: number) {
        this.ID = id
        this.ExpMult = expMult
        if(expMult<1.2) {
            this.MaxGrowth=0
            this.AWGoldCost=0
        }
        else if(expMult<1.3){
            this.MaxGrowth=1
            this.AWGoldCost=0
        }
        else {
            this.AWGoldCost=20+(expMult-1.3)*50
            this.OrbCost=(expMult-1.2)*10
            this.MaxGrowth=3
        }
    }
}

const RareList = [
    new RareStage('铁',1),
    new RareStage('铜',1.1),
    new RareStage('银',1.2),
    new RareStage('金',1.3),
    new RareStage('白',1.4),
    new RareStage('黑',1.5),
    new RareStage('蓝',1.4)
]

const StageList = [
    new GrowthStage('CC前',[30,40,50,50,50,50,50]),
    new GrowthStage('CC后',[30,40,55,60,70,80,65]),
    new GrowthStage('第一觉醒',[30,40,55,80,90,99,85]),
    new GrowthStage('第二觉醒',[30,40,55,99,99,99,99])
]

class Profession {
    public Name:String
    public Stages:Array<Object>
    public AWOrbs:Array<Number>
    constructor(c:any) {
        this.Name=c.Name
        switch (c.MaxLevel) {
            case '50': this.Stages = StageList; break
            case '80': this.Stages = StageList.slice(1, c.Depth+1); break
            case '99': this.Stages = StageList.slice(1, 2); break
            default: break
        }
        this.AWOrbs.push(c.Data_ExtraAwakeOrb1,c.Data_ExtraAwakeOrb2)
    }
}

let ClassList = new Array()

let PlayerUnitData = new Array()
class Unit {
    public ID: Number
    public CardID:Number
    public Name: String
    public Class: Profession
    public Rare: RareStage
    public Stages: Array<GrowthStage>
    public Proficiency: Object
    public Favor:number
    public SkillLevel:Array<Number>
    constructor(rawData:RawData, u) {
        this.ID= u.UnitID
        this.Name=rawData.NameText[u.A1-1].Message
        this.CardID=u.A1
        let c = rawData.ClassData.find(e => e.ClassID == u.A2)
        
        this.Class=ClassList[c.First.Key]
        this.Rare=RareList[Math.min(rawData.UnitsData.Rare,6)]
        this.Stages=this.Class.Stages.slice(u.A3)
        this.Proficiency=calLevel(parseInt(u.A4),this.Rare.ExpMult)
        this.Favor=u.A5
        this.SkillLevel.push(u.A6,rawData.SkillList[rawData.UnitsData.ClassLV1SkillID].LevelMax)
    }
}

class RawData {
    public NameText: Array<Object>
    public UnitsData: Array<Object>
    public ClassData: Array<Object>
    public SkillList: Array<Object>
}
export function parseGameData(rawData:RawData): Array<Object> {
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
    rawData.ClassData.forEach(c=>{
        if(c.Pre == null) {
            let key = ClassList.push(new Profession(c)) - 1 
            Object.defineProperty(c, 'Key', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: key
            })
        }
        else if (c.ClassID % 10 != 1){
            let count = 0
            let k=c
            while (k.Pre!=null) {
                k=k.Pre
                count+=1
                k.Depth=Math.max(k.Depth,count)
            }
            c.First = k 
        }
    })


    let BarracksInfo = new Array();

    PlayerUnitData.forEach(u=>{
        if(u.UnitID!=0&&u.A2>99) {
            BarracksInfo.push(new Unit(rawData,u))
        }
    })
    return BarracksInfo
}