import { RareList, StageList, Unit, ResourceStore, GrowthStage} from './gameData.service'


function eatLittleBlessing(unit:Unit, GlobalExpMult:number) {
    let exp = 0
    switch (unit.Rare.Name) {
        case '银': exp = 3000; break
        case '金': exp = 18000; break
        case '白': exp = 19000; break
        case '黑': exp = 20000; break
        case '蓝': exp = 19000; break
        default: break
    }
    exp*=GlobalExpMult
    return exp
}
function eatPackage(unit:Unit, GlobalExpMult:number, kind = 'Bucket') {
    let exp = 0
    exp = kind == 'Bucket' ? 8000 : 40000
    exp*=GlobalExpMult
    return exp
}
function eatIridescence(unit:Unit, SkillTo=0) {
    let targetSkillLv=SkillTo<=unit.Skill.SkillLevel?unit.Skill.MaxSkillLevel:SkillTo
    let cost = 0
    const upSkillChance = {
        '3': [1, 0.25],
        '5': [1, 0.75, 0.5, 0.25],
        '10': [1, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25],
        '16': [1, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25]
    }
    if (unit.Skill.SkillLevel != targetSkillLv) {
        upSkillChance[unit.Skill.MaxSkillLevel].slice(unit.Skill.SkillLevel - 1, targetSkillLv).forEach(c => cost += 1 / c)
    }
    return cost
}

export class TrainPlan {
    public Lv: number
    public Stage: string
    public SkillTo: 0
    public LSpirits: 0
    public DarkBucket: 0
    public Cost = {
        Buckets: [],
        DarkBucket: [],
        LSpirits: [],
        Iridescence: 0,
        Orbs: { Kind: [], Num: 0 }
    }
    // 需要有一个不实际减少仓库物品的方案
    getPlan(unit: Unit, globalExpMult) {
        let resExp = unit.getExpRes({ Lv: this.Lv, Stage: this.Stage })
        let totalExp = resExp.reduce((accumulator, currentValue) => accumulator + currentValue)
        this.Cost.Buckets = new Array(resExp.length)
        this.Cost.Buckets.fill(0)
        this.Cost.LSpirits = new Array(resExp.length)
        this.Cost.LSpirits.fill(0)
        this.Cost.DarkBucket = new Array(resExp.length)
        this.Cost.DarkBucket.fill(0)

        // 吃黑桶
        let accum = 0
        for (let i in resExp) {
            let tempE = eatPackage(unit, globalExpMult, 'DarkBucket')
            while (accum < this.DarkBucket && resExp[i] > tempE) {
                resExp[i] -= tempE
                ++this.Cost.DarkBucket[i]
                ++accum
            }
        }

        // 吃小祝福
        accum = 0
        for (let i in resExp) {
            let tempE = eatLittleBlessing(unit, globalExpMult)
            while (accum < this.DarkBucket && resExp[i] > tempE) {
                resExp[i] -= tempE
                ++this.Cost.LSpirits[i]
                ++accum
            }
        }

        // 吃普通白桶
        for (let i in resExp) {
            let tempE = eatPackage(unit, globalExpMult)
            while (resExp[i] > tempE) {
                resExp[i] -= tempE
                ++this.Cost.Buckets[i]
            }
        }

        // 觉醒宝珠
        if (unit.Stages[0].ID == 'CC后' || unit.Stages[0].ID == '第一觉醒') {
            if (resExp.length > 1) {
                this.Cost.Orbs.Kind = [unit.Class.AWOrbs]
                this.Cost.Orbs.Num = unit.Rare.OrbCost * (resExp.length - 1)
            }
        }

        this.Cost.Iridescence = eatIridescence(unit, this.SkillTo)
    }

}