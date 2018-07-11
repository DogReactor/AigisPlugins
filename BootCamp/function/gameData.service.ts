
//经验值表
let expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];






export class GrowthStage {
    public ID: string
    public MaxLevel: Array<number>
    constructor(id: string, maxLevel: Array<number>) {
        this.ID = id
        this.MaxLevel = maxLevel
    }
}

export class RareStage {
    public Name: string
    public ID:number
    public ExpMult: number
    public AWGoldCost: number
    public OrbCost: number
    public MaxGrowth: number
    constructor(name: string, expMult: number) {
        this.Name = name
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
export const RareList = [
    new RareStage('铁', 1),
    new RareStage('铜', 1.1),
    new RareStage('银', 1.2),
    new RareStage('金', 1.3),
    new RareStage('白', 1.4),
    new RareStage('黑', 1.5),
    new RareStage('蓝', 1.4)
]

export const StageList = [
    new GrowthStage('CC前', [30, 40, 50, 50, 50, 50, 50]),
    new GrowthStage('CC后', [30, 40, 55, 60, 70, 80, 65]),
    new GrowthStage('第一觉醒', [30, 40, 55, 80, 90, 99, 85]),
    new GrowthStage('第二觉醒', [30, 40, 55, 99, 99, 99, 99])
]

export class Profession {
    public Name: string
    public Stages: Array<GrowthStage>
    public AWOrbs: Array<number>
    public ClassKeys:Array<number>
}


export class Unit {
    public ID: number
    public CardID: number
    public Name: string
    public Class: Profession
    public Rare: RareStage
    public Stages: Array<GrowthStage>
    public Proficiency = {
        Lv: 0,
        NextExp: 0,
        TotalExp: 0
    }
    public Favor: number
    public Skill = {SkillLevel : 0, MaxSkillLevel : 0}

    setExp(exp:number) {
        this.Proficiency.TotalExp+=exp;
        let baseExp = Math.round(this.Proficiency.TotalExp / this.Rare.ExpMult);
        //利用公式Exp=0.1793*Lv^2.877)猜一次等级
        let pLv = Math.min(Math.round(Math.pow(baseExp / 0.1793, 1 / 2.877)), 98);
        //与猜测等级附近的等级比较经验值，找出准确等级
        while ((expList[pLv] > baseExp || expList[pLv + 1] <= baseExp) && expList[99] > baseExp) {
            if (expList[pLv] > baseExp) {
                pLv = pLv - 1;
            } else {
                pLv = pLv + 1;
            }
        }
        this.Proficiency.Lv=pLv + 1
        this.Proficiency.NextExp = Math.round(this.Proficiency.TotalExp - expList[pLv] * this.Rare.ExpMult)
    }
    getExpRes(targetPro) {
        let expRes=[]
        if(this.Stages[0].ID!=targetPro.Stage){
            let i = 1
            expRes.push(expList[this.Stages[0].MaxLevel[this.Rare.ID]-1]-expList[this.Proficiency.Lv-1]-this.Proficiency.NextExp)
            while(this.Stages[i]!=targetPro.Stage) {
                expRes.push(expList[this.Stages[i].MaxLevel[this.Rare.ID]-1])
                ++i
            }
            expRes.push(expList[targetPro.Lv-1])
        }
        else {
            expRes.push(expList[targetPro.Lv-1]-expList[this.Proficiency.Lv-1]-this.Proficiency.NextExp)
        }
        expRes.map(e=>e*this.Rare.ExpMult)
        return expRes
    }
    expUp(expDiff:number) {
        let exp=this.Proficiency.TotalExp+expDiff
        let expStage=expList.slice(0,this.Stages[0].MaxLevel[this.Rare.ID]+1)
        
    }

}


export class ResourceStore {
    public RareSpirit = {
        '铁': 0,
        '铜': 0,
        '银': 0,
        '金': 0,
        '白': 0,
        '黑': 0,
        '王': 0
    }
    public Gold = 0
    public Bucket = 0
    public DarkBucket = 0
    public LittleBlessing = {// TO DO 35的小祝福是什么？
        '银': 0,
        '金': 0,
        '白': 0,
        '黑': 0,
        '蓝': 0
    }
    public Iridescence = 0
    public AWSpirit = 0
    public AW2Spirit = 0
    public SkillAWSpirit = 0
    public MagicCrystal = 0
    public Orb = null // TO DO 写出珠子
    public GlobalExpMult = 1
    addOtherSpirit(classID, num = 0) {
        let kindMap = new Map([[7, 'Iridescence'], [10, 'Bucket'], [11, 'AWSpirit'], [14, 'SkillAWSpirit'], [30, 'AW2Spirit'], [36, 'DarkBucket']])
        if (kindMap.get(classID) != undefined) {
            this[kindMap.get(classID)] += num | 1
        }
    }
    addRareSpirit(classID, num = 0) {
        let rareMap = new Map([[1, '铁'], [2, '铜'], [3, '银'], [4, '金'], [5, '白'], [6, '黑'], [12, '王']])
        this.RareSpirit[rareMap.get(classID)] += num | 1
    }
    addLittleSpirit(rare, num = 0) {
        let rareMap = new Map([[2, '银'], [3, '金'], [4, '白'], [5, '黑'], [7, '蓝']])
        this.LittleBlessing[rareMap.get(rare)] += num | 1
    }
}