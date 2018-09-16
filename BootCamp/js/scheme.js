class RareStage {
    constructor(name, expMult) {
        this.Name = name
        this.ExpMult = expMult
        this.ID = Math.round((expMult-1)*10)
        this.Order = (expMult-1)*10

        if (expMult < 1.2) {
            this.MaxGrowth = 0
            this.AWGoldCost = 0
            this.OrbCost = 0
        }
        else if (expMult < 1.3) {
            this.MaxGrowth = 1
            this.AWGoldCost = 0
            this.OrbCost = 0
        }
        else {
            this.AWGoldCost = 20 + (this.ID - 3) * 5
            this.OrbCost = this.ID - 2
            this.MaxGrowth = 3
        }
        if(name==='蓝') {
            this.Order=3.5
            this.ID = 7
        }
    }
}

class GrowthStage {
    constructor(name, maxLevel) {
        this.Name = name
        this.MaxLevel = maxLevel
        this.IsResetLv = this.Name!='第二觉醒'
    }
}

const rareInfos = [
    new RareStage('铁', 1),
    new RareStage('铜', 1.1),
    new RareStage('银', 1.2),
    new RareStage('金', 1.3),
    new RareStage('白', 1.4),
    new RareStage('黑', 1.5),
    new RareStage('Unknown', 1),
    new RareStage('蓝', 1.4)
]

const stageInfos = [
    new GrowthStage('CC前', [30, 40, 50, 50, 50, 50, 0, 50]),
    new GrowthStage('CC后', [30, 40, 55, 60, 70, 80, 0, 65]),
    new GrowthStage('第一觉醒', [30, 40, 55, 80, 90, 99, 0, 85]),
    new GrowthStage('第二觉醒', [30, 40, 55, 99, 99, 99, 0, 99])
]



const expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];

const locationName = ["第一兵营", "第二兵营", "第三兵营"]

function calLv(exp,stage,rare) {
    //修正稀有度带来的经验值差异
    var baseExp=Math.round(exp / rareInfos[rare].ExpMult)
    //利用公式Exp=0.1793*Lv^2.877)猜一次等级
    var pLv=Math.min(Math.round(Math.pow(baseExp / 0.1793, 1 / 2.877)), 98)
    //与猜测等级附近的等级比较经验值，找出准确等级
    while ((expList[pLv] > baseExp || expList[pLv + 1] <= baseExp) && expList[99] > baseExp) {
      if (expList[pLv] > baseExp) {
        pLv = pLv - 1
      } else {
        pLv = pLv + 1
      }
    }
    pLv+=1

    let restExp=0

    if (pLv>=stageInfos[stage].MaxLevel[rare]){
        pLv=stageInfos[stage].MaxLevel[rare]
    }
    else {
        restExp = Math.round(expList[pLv] * rareInfos[rare].ExpMult - exp)
    }

    return [pLv,restExp]
}


module.exports = {
    stageInfos:stageInfos,
    rareInfos:rareInfos,
    expList:expList,
    locationName:locationName,
    calLv:calLv
}