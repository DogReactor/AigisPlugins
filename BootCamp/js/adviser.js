const { expList, locationName, stageInfos, rareInfos, calLv } = require('./scheme')
const { probCom } = require('./math')
const expRes = {
    BucketPackNum: {
        Name: '白桶套餐',
        Exp: [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000],
        getCost(cost,num,mode=[1,3]) {
            cost.BucketCost+=mode[0]*num
            cost.SpiritsCost+=mode[1]*num
        }
    },
    BlackBucketNum: {
        Name: '黑桶套餐',
        Exp: [40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000],
        getCost(cost,num,mode=[1,3]) {
            cost.BlackBucketCost+=mode[0]*num
            cost.SpiritsCost+=mode[1]*num
        }
    },
    LittleSpiritsNum: {
        Name: '小祝福',
        Exp: [0, 0, 4000, 18000, 19000, 20000, 0, 190000],
        getCost(cost,num, mode = [1,3]) {
            cost.LittleSpiritsCost+=num
        }
    },
    Blessing: {
        Name: '大祝福',
        Exp: [150000, 150000, 150000, 150000, 150000, 150000, 0, 150000],
        getCost(cost,num, mode = [1,3]) {
            cost.BlessingCost+=num
        }
    },
    MaidSpiritsNum: {
        Name: '女仆圣灵',
        Exp: [10000, 10000, 10000, 10000, 10000, 10000, 0, 10000],
        getCost(cost,num, mode = [1,3]) {
            cost.MaidSpiritsCost+=num
        }
    },
}

const costResDesc = {
    BucketCost:{
        getName(info) {
            return '白桶'
        }
    },
    GoldCost:{
        getName(info) {
            return '金'
        }
    },
    SpiritsCost : {
        getName(info) {
            return '觉醒圣灵'
        }
    },
    AWSpiritsCost : {
        getName(info) {
            return '觉醒圣灵'
        }
    },
    AW2SpiritsCost:0,
    LittleSpiritsCost:0,
    MaidSpiritsCost:0,
    BlessingCost:0
}
class Plan {
    constructor(unit) {
        this.UnitID = unit.ID
        this.UnitName = unit.Name
        this.ExpTrace = []
        this.ExpTraceNode = []
        this.Desc = []
        this.Cost={
            Bucket:0,
            Spirits:0,
            Gold:0,
            Orbs: 0,
            AWSpirits: 0,
            AW2Spirits:0,
            LittleSpirits:0,
            MaidSpirits:0,
            Blessing:0,
            Iridescence:0,
            SkillEvoSpirit:0,
            Kizuna:0
        }
        this.ExpPackNum = {
            BucketPackNum:[],
            BlackBucketNum:[],
            LittleSpiritsNum:[],
            Blessing:[],
            MaidSpiritsNum:[]
        }
        this.Orbs = []
        this.Cost = 0
        this.IridescenceCost = 0
        this.Cost = 0
        this.ExpUp=false
        this.SkillUp=false
        this.CostDown=false
    }
}

function calExpUp(plan, checkForm) {
    let unit = checkForm.Unit
    plan.ExpTrace = unit.getResExp(checkForm.TargetPro)
    plan.ExpTrace.forEach((expRes, i) => {
        plan.ExpPackNum.keys().forEach(k=>{
            plan.ExpPackNum[k][i]=0
        })
        let choosedRes=BucketPackNum
        let exp = expRes
        let energy = expRes[choosedRes].Exp[unit.Rare.ID]*checkForm.GlobalExpMult
        plan.ExpPackNum[choosedRes][i] = Math.floor(exp/energy)
        expRes[choosedRes].getCost(plan.Cost, plan.ExpPackNum[choosedRes][i],[checkForm.BucketPackCost[0], checkForm.BucketPackCost[1]])

        exp -= plan.ExpPackNum[choosedRes][i] * energy
        if(i===0) {
            exp += unit.Exp
            
        }
        let [lv, nextp] = calLv(exp, unit.EvoNum+i, unit.Rare.ID)
        plan.ExpTraceNode[i]={Lv:lv, NextExp:nextp}
    });
    

    for (let i = 1; i < plan.ExpTrace.length; ++i) {
        if(unit.EvoNum+i===1) {
            plan.Cost.SpiritsCost+=1
        }
        if (unit.EvoNum + i >= 2) {
            plan.Cost.OrbsCost += unit.Rare.OrbCost
            plan.Cost.GoldCost += unit.Rare.AWGoldCost
            if(unit.EvoNum + i === 2) {
                plan.AWSpiritsCost += 1
            }
            else if(unit.EvoNum + i === 3) {
                plan.AW2SpiritsCost += 1
            }
        }
    }


    plan.CostDesc.push('白桶消耗：'+plan.BucketCost+'    '+)
    if(AWCostDesc!='') {
        plan.CostDesc
    }
    let descs= []
    
    plan.ExpTraceDesc=descs.join('=> ')
    plan.ExpUp=true
}


function calSkillUp(plan, checkForm) {
    let unit = checkForm.Unit
    if(checkForm.ToggleSkillEvo) {
        plan.SkillEvoSpiritCost+=1
        plan.GoldCost += unit.Rare.AWGoldCost
        plan.OrbsCost = unit.Class.Orbs.map((o,i)=> plan.OrbsCost[i] + unit.Rare.OrbCost)
    }
    const upSkillChance = {
        '3': [1, 0.25],
        '5': [1, 0.75, 0.5, 0.25],
        '10': [1, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25],
        '16': [1, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25]
    }
    let actChance = upSkillChance[checkForm.MaxSkillLv].map(p=>probCom(p,checkForm.Luck/100))
    actChance.slice(checkForm.InitSkillLv - 1,checkForm.TargetSkillLv).forEach(c=>plan.IridescenceCost+=1/c)
    plan.CostDesc.push('期望虹圣灵消耗：'+plan.IridescenceCost.toString())
    plan.SkillUp=true
}

function calCostReduce(plan, checkForm) {
    let unit = checkForm.Unit
    const costReduceChance = [1,0.5,0.25,0.25,0.25,0.25]
    let actChance = costReduceChance.map(p=>probCom(p,checkForm.Luck/100))
    actChance.slice(unit.ReducedCost,checkForm.InitCost+unit.ReducedCost-checkForm.TargetCost).forEach(c=>plan.KizunaCost+=1/c)
    plan.CostDesc.push('期望绊消耗：'+plan.KizunaCost.toString())
    plan.CostDown = true
}
function generateDesc(plan) {

    let desc=[]
    plan.ExpTraceNode.forEach((n,i)=>{
        let stage = stageInfos[unit.EvoNum+i].Name
        let node = n.Lv.toString()+'['+n.NextExp.toString()+']'
        let res=[]
        plan.ExpPackNum.keys().forEach((k,i)=>{
            if(plan.ExpPackNum[k][i]>0) {
                res.push(expRes[k].Name+'×'+plan.ExpPackNum[k][i].toString())
            }
        })
       desc.push(stage+': '+node+' + ('+res.join(' | ')+') ')
    })
    plan.Desc.push(desc.join(' => '))



}

function formulatePlan(checkForm) {
    let plan = new Plan(checkForm.Unit)
    if(checkForm.IsExpUp) {
        calExpUp(plan,checkForm)
    }
    if(checkForm.IsSkillUp) {
        calSkillUp(plan,checkForm)
    }
    if(checkForm.IsCostDown) {
        calCostReduce(plan, checkForm)
    }
    generateDesc(plan)
    return plan
    
}

module.exports = {
    formulatePlan:formulatePlan,
}