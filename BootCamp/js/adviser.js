const { expList, locationName, stageInfos, rareInfos, calLv } = require('./scheme')
class Plan {
    constructor() {
        this.ExpTrace = []
        this.ExpTraceNode = []
        this.BucketCost = []
        this.GoldCost = 0
        this.Orbs = []
        this.OrbsCost = []
        this.AWSpiritsCost = 0
        this.AW2SpiritsCost = 0
        this.SpiritsCost = 0
        this.IsExpUp = true
        this.IsSkillUp = false
        this.IsCostDown = false
    }
}

function calculateExpUp(plan, unit, checkForm) {
    if (unit.IsOverLv) {
        Plan.IsExpUp = false
        return
    }

    plan.ExpTrace = unit.getResExp(checkForm.TargetPro)
    plan.ExpTrace.forEach((expRes, i) => {
        let exp = expRes
        let energy = 8000*checkForm.GlobalExpMult
        plan.BucketCost[i] = Math.floor(exp/energy) * checkForm.BucketPackCost[0]
        plan.SpiritsCost += Math.floor(exp/energy) * checkForm.BucketPackCost[1]
        exp = exp - plan.BucketCost[i] * energy
        if(i===0) {
            exp += unit.Exp
        }
        let [lv, nextp] = calLv(exp, unit.EvoNum+i, unit.Rare.ID)
        plan.ExpTraceNode[i]={Lv:lv, NextExp:nextp}
    });
    
    for (let i = 1; i < plan.ExpTrace.length; ++i) {
        if (unit.EvoNum + i >= 2) {
            plan.OrbsCost = unit.Class.Orbs.map(o=>  unit.Rare.OrbCost)
            plan.GoldCost += unit.Rare.AWGoldCost
            if(unit.EvoNum + i === 2) {
                plan.AWSpiritsCost += 1
            }
            else if(unit.EvoNum + i === 3) {
                plan.AW2SpiritsCost += 1
            }
        }
    }
}

// TO DO 减C 加技计算

function formulatePlan(unit, checkForm) {
    let plan = new Plan()
    calculateExpUp(plan, unit ,checkForm)
}

module.exports = {
    formulatePlan:formulatePlan,
}