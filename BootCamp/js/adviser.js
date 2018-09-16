const { expList, locationName, stageInfos, rareInfos, calLv, orbsInfo } = require('./scheme')
const { probCom } = require('./math')
const expRes = {
    BucketPackNum: {
        Name: '白桶套餐',
        Exp: [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000],
        getCost(cost,num,mode=[1,3]) {
            cost.Bucket+=mode[0]*num
            cost.Spirits+=mode[1]*num
        }
    },
    BlackBucketNum: {
        Name: '黑桶套餐',
        Exp: [40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000],
        getCost(cost,num,mode=[1,3]) {
            cost.BlackBucket+=mode[0]*num
            cost.Spirits+=mode[1]*num
        }
    },
    LittleSpiritsNum: {
        Name: '小祝福',
        Exp: [0, 0, 4000, 18000, 19000, 20000, 0, 190000],
        getCost(cost,num, mode = [1,3]) {
            cost.LittleSpirits+=num
        }
    },
    Blessing: {
        Name: '大祝福',
        Exp: [150000, 150000, 150000, 150000, 150000, 150000, 0, 150000],
        getCost(cost,num, mode = [1,3]) {
            cost.Blessing=num
        }
    },
    MaidSpiritsNum: {
        Name: '女仆圣灵',
        Exp: [10000, 10000, 10000, 10000, 10000, 10000, 0, 10000],
        getCost(cost,num, mode = [1,3]) {
            cost.MaidSpirits+=num
        }
    },
}

const costResDesc = {
    Bucket:{
        getName(info) {
            return '白桶'
        }
    },
    Spirits : {
        getName(info) {
            return info.Rare.Name+'圣灵'
        }
    },
    Gol:{
        getName(info) {
            return '金'
        }
    },
    Orbs: {
        getName(info) {
            let deschtml=''
            info.Class.Orbs.forEach(c=>{deschtml+=orbsInfo[c].ImgHtml})
            return deschtml
        }
    },
    AWSpirits : {
        getName(info) {
            return '觉醒圣灵'
        }
    },
    AW2Spirits:{
        getName(info) {
            return '闇圣灵'
        }
    },
    LittleSpirits:{
        getName(info) {
            return '小'+info.Rare.Name+'祝福'
        }
    },
    MaidSpirits:{
        getName(info) {
            return '女仆圣灵'
        }
    },
    Blessing:{
        getName(info) {
            return '大祝福'
        }
    },
    Iridescence:{
        getName(info) {
            return '虹圣灵'
        }
    },
    SkillEvoSpirit:{
        getName(info) {
            return '技觉圣灵'
        }
    },
    Kizuna:{
        getName(info) {
            return '绊圣灵'
        }
    },
}
class Plan {
    constructor(unit) {
        this.UnitID = unit.ID
        this.UnitName = unit.Name
        this.Unit=unit
        this.ExpTrace = []
        this.ExpTraceNode = []
        this.DescHtml = ''
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
        this.ExpUp=false
        this.SkillUp=false
        this.CostDown=false
    }
}

function calExpUp(plan, checkForm) {
    let unit = checkForm.Unit
    plan.ExpTrace = unit.getResExp(checkForm.TargetPro)
    plan.ExpTrace.forEach((expR, i) => {
        Object.keys(plan.ExpPackNum).forEach(k=>{
            plan.ExpPackNum[k][i]=0
        })
        let choosedRes='BucketPackNum'
        let exp = expR
        let energy = expRes[choosedRes].Exp[unit.Rare.ID]*checkForm.GlobalExpMult
        
        plan.ExpPackNum[choosedRes][i] = Math.floor(exp/energy)
        console.log(plan.ExpPackNum[choosedRes][i],exp,energy)
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
    plan.SkillUp=true
}

function calCostReduce(plan, checkForm) {
    let unit = checkForm.Unit
    const costReduceChance = [1,0.5,0.25,0.25,0.25,0.25]
    let actChance = costReduceChance.map(p=>probCom(p,checkForm.Luck/100))
    actChance.slice(unit.ReducedCost,checkForm.InitCost+unit.ReducedCost-checkForm.TargetCost).forEach(c=>plan.KizunaCost+=1/c)
    plan.CostDown = true
}
function generateDesc(plan) {

    let desc=[]
    let partDesc=[]
    plan.ExpTraceNode.forEach((n,i)=>{
        let stage = stageInfos[plan.Unit.EvoNum+i].Name
        let node = n.Lv.toString()+'['+n.NextExp.toString()+']'
        let res=[]
        Object.keys(plan.ExpPackNum).forEach((k,i)=>{
            if(plan.ExpPackNum[k][i]>0) {
                res.push(expRes[k].Name+'×'+plan.ExpPackNum[k][i].toString())
            }
        })
        partDesc.push(stage+': '+node+' + ('+res.join(' | ')+') ')
    })
    desc.push(partDesc.join(' => '))

    partDesc=[]
    Object.keys(plan.Cost).forEach(k=>{
        if(plan.Cost[k]>0) {
            console.log(k)
            partDesc.push(costResDesc[k].getName(plan.Unit)+": "+plan.Cost[k].toString())
        }
    })
    desc.push(partDesc.join(',  '))

    plan.DescHtml=desc.join('</div><div>')
    plan.DescHtml.padStart(5,'<div>')
    plan.DescHtml.padEnd(6,'</div>')


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