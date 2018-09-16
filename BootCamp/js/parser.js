const { expList, locationName, stageInfos, rareInfos, calLv } = require('./scheme')



class Unit {
    constructor(){
        this.UnitID = 1
        this.CardID = 1
        this.Name = ''
        this.RealName = ''
        this.Class = ''
        this.Stage = ''
        this.Rare = ''
        this.Lv = 1
        this.Exp = 0
        this.NextExp = 0
        this.Affection = 0
        this.Skill = {}
        this.Cost = 1
        this.Location = ''
        this.MaxGrowth = 0
    }

    getResExp(targetPro) {
        let resExp = []
        let maxLvID = this.Rare.ID
        let faceEnd = false
        for(let i = this.EvoNum;i<=this.MaxGrowth;++i){
            let s= stageInfos[i]
            let startExp = 0
            let endExp = Math.round(expList[s.MaxLevel[maxLvID]-1] * this.Rare.ExpMult)
            if(s.Name===this.Stage) {
                startExp = this.Exp
            }
            if(s.Name===targetPro.Stage) {
                endExp =Math.round(expList[targetPro.Lv - 1] * this.Rare.ExpMult)
                faceEnd = true
            }
            let exp = endExp - startExp
            if(exp>0) {
                resExp.push(exp)
            }
            if(exp < 0 || faceEnd===true) {
                break
            }
        }
        if(this.Stage!='第二觉醒'&&targetPro.Stage==='第二觉醒') {
            resExp.pop()
        }
        return resExp
    }


}

class ClassNode {
    constructor(c, loc) {
        this.ID = c.ClassID
        this.Name = c.Name
        this.Root = c.MaxLevel
        this.Pre= loc
        this.Index=loc
        this.Orbs=[]
        if(c.Data_ExtraAwakeOrb1!=0) {
            this.Orbs.push(c.Data_ExtraAwakeOrb1)
        }
        if(c.Data_ExtraAwakeOrb!=0) {
            this.Orbs.push(c.Data_ExtraAwakeOrb2)
        }
        this.MaxGrowth = 0
        if(c.AtkArea>40) {
            this.AttackMode='远程'
        }
        else {
            this.AttackMode='近战'
        }
        switch(c.MaxLevel){
            case 50:this.Depth = 0;break
            case 80:this.Depth = 1;break
            case 99:this.Depth = 2;break
            default: this.Depth = 0;break
        }
        // 皇帝视为已CC未觉醒
        if(this.ID===9800){
            this.Depth = 1
        }
    }
}

// 解析职业树，以计算单位所处的育成阶段，并将每个单位的职业设置为初始职业
function parseClassTree(ClassInfos){
    let classTree = []
    
    // 初始化职业树
    ClassInfos.forEach(c=>{
        let loc = classTree.length
        classTree.push(new ClassNode(c, loc))
    })
    // 将职业树的子节点连上父节点
    ClassInfos.forEach((c,index)=>{
        if(c.JobChange!=0){
            let CCI = ClassInfos.findIndex(e=> e.ClassID === c.JobChange)
            classTree[CCI].Pre= index
        }
        if(c.AwakeType1!=0){
            let AW1I = ClassInfos.findIndex(e=> e.ClassID === c.AwakeType1)
            classTree[AW1I].Pre= index
            classTree[AW1I].Depth = 3
        }
        if(c.AwakeType2!=0){
            let AW2I = ClassInfos.findIndex(e=> e.ClassID === c.AwakeType2)
            classTree[AW2I].Pre= index
            classTree[AW2I].Depth = 3
        }
    })

    // 计算每个职业的根职业节点
    classTree.forEach(c => {
        c.Root = c.Pre
        if (c.Root != c.Index) {
            while (classTree[c.Root].Pre != classTree[c.Root].Index) {
                c.Root = classTree[c.Root].Pre
            }
        }
        classTree[c.Root].MaxGrowth = Math.max(classTree[c.Root].MaxGrowth, c.Depth)
        // 铜铁职阶个位为1
        if (c.ID%10===1) {
            c.Root = classTree.findIndex(p=>p.ID ===c.ID-1)
        }

        if(c.Depth=== 1) {
            if(classTree[c.Root].Depth===0&&c.Orbs[0]===0&&c.Orbs[1]===0) {
                // 基本职业
                classTree[c.Root].Orbs[0]=c.ID
            }
            else {
                classTree[c.Root].Orbs=c.Orbs
            }
        }
    })

    return new Promise(resolve => resolve(classTree))
}

function parseUnits(rawData, classTree) {
    let unitsList = []
    barracks = rawData.BarracksInfos.filter(u=>{
        return u.A1>=100 && parseInt(u.AE)%16!=1
    })

    barracks.forEach(unitObj => {
        let unit = new Unit()
        let cardObj = rawData.UnitsInfos.find(u=>u.CardID==unitObj.A1)
        let classObj = rawData.ClassInfos.find(c=>c.ClassID==unitObj.A2)
        let clnode = classTree.find(c=>c.ID == unitObj.A2)
        unit.UnitID = parseInt(unitObj.UnitID)
        unit.CardID=parseInt(unitObj.A1)
        unit.Name = rawData.NameText[unit.CardID-1].Message
        unit.RealName = rawData.NameText[unit.CardID-1].RealName
        unit.Class = classTree[clnode.Root]
        unit.Stage = stageInfos[clnode.Depth].Name
        unit.EvoNum = clnode.Depth
        unit.Rare = rareInfos[parseInt(cardObj.Rare)]
        unit.MaxGrowth = Math.min(unit.Rare.MaxGrowth, unit.Class.MaxGrowth)
        unit.Exp = parseInt(unitObj.A4)
        let [lv,nexp]  = calLv(parseInt(unitObj.A4),clnode.Depth,parseInt(cardObj.Rare))
        unit.Lv= lv
        unit.NextExp=nexp
        if(unit.EvoNum===unit.MaxGrowth&&unit.Lv===stageInfos[unit.MaxGrowth].MaxLevel[unit.Rare.ID]) {
            unit.IsOverLv = true
        }
        else {
            unit.IsOverLv = false
        }
        unit.Affection = parseInt(unitObj.A5)
        unit.Skill = { 
            Level: parseInt(unitObj.A6), 
            ID: parseInt(unitObj.AD),
            Evo:[
                parseInt(cardObj.ClassLV0SkillID),
                parseInt(cardObj.ClassLV1SkillID),
                parseInt(cardObj.EvoSkillID)
            ],
            MaxLv:[
                parseInt(rawData.SkillList[cardObj.ClassLV0SkillID].LevelMax),
                parseInt(rawData.SkillList[cardObj.ClassLV1SkillID].LevelMax),
                parseInt(rawData.SkillList[cardObj.EvoSkillID].LevelMax)
            ]
        }
        unit.ReducedCost = parseInt(unitObj.AA)*(-1)
        unit.RemainCost = parseInt(cardObj.CostDecValue)-unit.ReducedCost
        unit.Cost = parseInt(cardObj.CostModValue)+classObj.Cost+parseInt(unitObj.AA)
        unit.Location = locationName[Math.floor(parseInt(unitObj.AE)/16)]

        
        unit.LvString = unit.Lv.toString()+'['+(unit.NextExp===0?'MAX':unit.NextExp.toString())+']'
        let skillMaxLvI = unit.Skill.Evo.findIndex(e=>e===unit.Skill.ID)
        unit.SkillString = unit.Skill.Level.toString() +'/'+ unit.Skill.MaxLv[skillMaxLvI].toString()
        unit.CostString = unit.Cost.toString()+'(+'+(unit.RemainCost===0?'MIN':unit.RemainCost) +')'
        unitsList.push(unit)
    });
    return unitsList
}

function parseOrbs(Orbs) {
    // const  orbsIndex=[
    //  23,52,54,73,77,
    //  2,5,22,25,76,
    //  0,3,56,59,72,
    //  1,7,27,30,58,
    //  21,26,28,53,55,
    //  33,35,36,78,85,
    //  29,37,84,86,87]
    //  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    //  let orbsStore=[]
    //  Orbs.forEach(e => {
    //      for(let i=0;i<4;++i) {
    //          let n=e&0xFF
    //          e=e>>8
    //          orbsStore.push(n)
    //      }
    //  });
    //  let orbsNum=[]
    //  orbsIndex.forEach(i=>{
    //      orbsNum.push(orbsStore[i])
    //  })
 
    //  return orbsNum
 }

function parseRes(rawData) {

    let resRepo={}
    resRepo.Orbs=parseOrbs(rawData.Orbs)
    return resRepo
}
// 解析所需的信息
async function parseInfos(rawData){
    let scroll = {
        unitList:[],
        classList: [],
        resRepo: [],
    }

    let classTree = await parseClassTree(rawData.ClassInfos)
    
    // 分析兵营
    scroll.unitList = parseUnits(rawData, classTree)
    
    // 收集所有职业
    let distinctClassCollect = new Set()
    scroll.unitList.forEach(u=>{
        distinctClassCollect.add(u.Class)
    })
    distinctClassCollect.forEach(c=>{
        scroll.classList.push({
            AttackMode:c.AttackMode,
            Name:c.Name,
            ClassID:c.ID,
            Orbs:c.Orbs,
            InitEvo:c.Depth
        })
    })
    scroll.resRepo = parseRes(rawData)

    return scroll
}

module.exports = {
    parseInfos:parseInfos
}