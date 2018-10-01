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
            cost.Blessing+=num
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
    BlackBucket:{
        getName(info) {
            return '黑桶'
        }
    },
    Spirits : {
        getName(info) {
            return info.Rare.Name+'圣灵'
        }
    },
    Gold:{
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
    constructor(checkform) {
        this.UnitID = checkform.Unit.UnitID
        this.UnitName = checkform.Unit.Name
        this.Unit=checkform.Unit
        this.CheckForm=checkform
        this.ExpTrace = []
        this.ExpTraceNode = []
        this.DescHtml = ''
        this.Cost={
            Bucket:0,
            BlackBucket:0,
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
    const resAvaliable=[
        ['UseBlessing','Blessing'],
        ['UseBlackBucket','BlackBucketNum'],
        ['UseSmallSpirits','LittleSpiritsNum'],
        ['UseMaidSpirits' ,'MaidSpiritsNum'],
        ['IsExpUp', 'BucketPackNum']]
    if(checkForm.ExpSpirit) {
        checkForm.GlobalExpMult = 1.1
    }
    plan.ExpTrace.forEach((expR, i) => {
        Object.keys(plan.ExpPackNum).forEach(k=>{
            plan.ExpPackNum[k][i]=0
        })
        let exp = expR
        for(let r in resAvaliable) {
            if(checkForm[resAvaliable[r][0]])
            {
                let choosedRes=resAvaliable[r][1]
                let energy = expRes[choosedRes].Exp[unit.Rare.ID]*checkForm.GlobalExpMult
                if(exp >= plan.ExpPackNum[choosedRes][i] * energy) {
                    plan.ExpPackNum[choosedRes][i] = Math.floor(exp/energy)
                    expRes[choosedRes].getCost(plan.Cost, plan.ExpPackNum[choosedRes][i],checkForm.BucketPackCost)
                    exp -= plan.ExpPackNum[choosedRes][i] * energy
                }
                
            }
            if(exp<=0) {
                exp=Math.max(exp,0)
                break
            }

        }
          
        if(i===0) {
            exp += unit.Exp
        }
        let [lv, nextp] = calLv(exp, unit.EvoNum+i, unit.Rare.ID)
        plan.ExpTraceNode[i]={Lv:lv, NextExp:nextp}
    });
    
    let targetDepth = stageInfos.findIndex(s=>s.Name===checkForm.TargetPro.Stage)
    for (let i = 1; unit.EvoNum+i<=targetDepth; ++i) {
        if(unit.EvoNum+i===1) {
            plan.Cost.Spirits+=1
        }
        if (unit.EvoNum + i >= 2) {
            plan.Cost.Orbs += unit.Rare.OrbCost
            plan.Cost.Gold += unit.Rare.AWGoldCost
            if(unit.EvoNum + i === 2) {
                plan.Cost.AWSpirits += 1
            }
            else if(unit.EvoNum + i === 3) {
                plan.Cost.AW2Spirits += 1
            }
        }
    }

}


function calSkillUp(plan, checkForm) {
    let unit = checkForm.Unit
    if(checkForm.ToggleSkillEvo) {
        plan.Cost.SkillEvoSpirit+=1
        plan.Cost.Gold += unit.Rare.AWGoldCost
        plan.Cost.Orbs += unit.Rare.OrbCost
        checkForm.TargetSkillLv=unit.Skill.MaxLv[1]
    }
    const upSkillChance = {
        '3': [1, 0.25],
        '5': [1, 0.75, 0.5, 0.25],
        '10': [1, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25],
        '16': [1, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25]
    }
    let actChance = upSkillChance[checkForm.MaxSkillLv].map(p=>probCom(p,checkForm.Luck/100))
    if(checkForm.TargetSkillLv!=checkForm.InitSkillLv) {
        actChance.slice(checkForm.InitSkillLv - 1,checkForm.TargetSkillLv).forEach(c=>plan.Cost.Iridescence+=1/c)
    }
    
}

function calCostReduce(plan, checkForm) {
    let unit = checkForm.Unit
    const costReduceChance = [1,0.5,0.25,0.25,0.25,0.25]
    let actChance = costReduceChance.map(p=>probCom(p,checkForm.Luck/100))
    actChance.slice(unit.ReducedCost,checkForm.InitCost+unit.ReducedCost-checkForm.TargetCost).forEach(c=>plan.Cost.Kizuna+=1/c)
}
function generateDesc(plan) {

    let desc=[]
    let partDesc=[]
    plan.ExpTraceNode.forEach((n,i)=>{
        let stage = stageInfos[plan.Unit.EvoNum+i].Name
        let node = 'Lv' + n.Lv.toString()+'['+n.NextExp.toString()+']'
        let res=[]
        Object.keys(plan.ExpPackNum).forEach((k,j)=>{
            if(plan.ExpPackNum[k][i]>0) {
                res.push(expRes[k].Name+'×'+plan.ExpPackNum[k][i].toString())
            }
        })
        let descRes=''
        if(res.length>0) {
            descRes=' + ('+res.join(' | ')+') '
        }
        partDesc.push(stage+': '+node+descRes)
    })
    desc.push(partDesc.join(' => '))

    partDesc=[]
    Object.keys(plan.Cost).forEach(k=>{
        if(plan.Cost[k]>0) {
            partDesc.push(costResDesc[k].getName(plan.Unit)+" × "+Math.round(plan.Cost[k]).toString())
        }
    })
    desc.push(partDesc.join(',  '))

    plan.DescHtml=desc.join('</div><div>')


}

function formulatePlan(checkForm) {
    let plan = new Plan(checkForm)
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

function generateCountDesc(trainForm) {
    let countCost = {}
    trainForm.forEach(plan=>{
        Object.keys(plan.Cost).forEach(k=>{
            if(plan.Cost[k]>0){
                let res = costResDesc[k].getName(plan.Unit)
                if(!countCost[k]) {
                    countCost[k]={}
                }
                if(k=='Orbs'&&res.includes('><img')){
                    let resArr=res.split('><')
                    resArr[0]+='>'
                    resArr[1] ='<'+resArr[1]
                    resArr.forEach(r=>{
                        if(!countCost[k][r]) {
                            countCost[k][r]=0
                        }
                        countCost[k][r]+=plan.Cost[k]
                    })
                }
                else {
                    if(!countCost[k][res]) {
                        countCost[k][res]=0
                    }
                    countCost[k][res]+=plan.Cost[k]
                }
                
            }
        })
    })

    let descArr=[]
    Object.keys(countCost).forEach(k=>{
        let descByKeys=[]
        Object.keys(countCost[k]).forEach(l=>{
            descByKeys.push(l+' × '+Math.round(countCost[k][l]).toString())
        })
        descArr.push(descByKeys.join(' | '))
    })
    let desc=descArr.join('</div><div>')
    return desc

}

module.exports = {
    formulatePlan:formulatePlan,
    generateCountDesc:generateCountDesc
}