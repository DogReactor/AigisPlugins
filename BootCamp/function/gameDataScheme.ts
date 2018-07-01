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
    constructor(cl:Array<Object>) {
        this.Name=cl[0].Name
        this.Stages=
    }
}


class Unit {
    ID:Number
    Class:Profession
}

export class GameData {
    public BarracksInfo: Array<Unit>
    constructor() {}
}