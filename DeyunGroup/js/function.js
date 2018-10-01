var expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];

var rareInfo=[
    {expMut:1,ccCost:0,maxLevel:[30,30,30,30]},
    {expMut:1.1,ccCost:0,maxLevel:[40,40,40,40]},
    {expMut:1.2,ccCost:0,maxLevel:[50,55,55,55]},
    {expMut:1.3,ccCost:20,maxLevel:[50,60,80,99]},
    {expMut:1.4,ccCost:25,maxLevel:[50,70,90,99]},
    {expMut:1.5,ccCost:30,maxLevel:[50,80,99,99]},
    {},
    {expMut:1.4,ccCost:25,maxLevel:[50,65,85,99]},
];
const stageName=['CC前','CC后','第一觉醒','第二觉醒']
const rareName = ["铁", "铜", "银", "金", "白", "黑", "UnKnown" , "蓝"]
const locationName = ["第一兵营", "第二兵营", "第三兵营"]

function calLv(exp,stage,rare) {
    //修正稀有度带来的经验值差异
    var baseExp=Math.round(exp / rareInfo[rare].expMut);
    //利用公式Exp=0.1793*Lv^2.877)猜一次等级
    var pLv=Math.min(Math.round(Math.pow(baseExp / 0.1793, 1 / 2.877)), 98);
    //与猜测等级附近的等级比较经验值，找出准确等级
    while ((expList[pLv] > baseExp || expList[pLv + 1] <= baseExp) && expList[99] > baseExp) {
      if (expList[pLv] > baseExp) {
        pLv = pLv - 1;
      } else {
        pLv = pLv + 1;
      }
    }
    pLv+=1
    if (pLv>rareInfo[rare].maxLevel[stage]){
        pLv=rareInfo[rare].maxLevel[stage]
    }
    return pLv
}

class Unit {
    constructor(){
        this.ID = 1;
        this.Name = '';
        this.RealName = '';
        this.Class = '';
        this.Stage = '';
        this.Rare = '';
        this.Lv = 1;
        this.Cost = 1;
        this.Location = '';
        this.Locked = false;
    }
}

class ClassNode {
    constructor(c, loc) {
        this.ID = c.ClassID
        this.Name = c.Name
        this.Root = c.MaxLevel
        this.Pre= loc
        this.Index=loc
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
            // console.log(typeof(c.ClassID),typeof(c.AwakeType1))
            // console.log(c.ClassID,c.AwakeType1)
            let AW1I = ClassInfos.findIndex(e=> e.ClassID === c.AwakeType1)
            classTree[AW1I].Pre= index
            classTree[AW1I].Depth += 1
        }
        if(c.AwakeType2!=0){
            let AW2I = ClassInfos.findIndex(e=> e.ClassID === c.AwakeType2)
            classTree[AW2I].Pre= index
            classTree[AW2I].Depth += 1
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
        // 铜铁职阶个位为1
        if (c.ID%10===1) {
            c.Root = classTree.findIndex(p=>p.ID ===c.ID-1)
        }
    })

    return classTree
}

// 解析所需的信息
function parseInfos(rawData){
    let unitsList = []
    let classList = []
    let classTree = parseClassTree(rawData.ClassInfos)

    // 收集所持单位的所有职业
    let distinctClassCollect = new Set()
    // 分析兵营
    rawData.BarracksInfos.forEach(unitObj => {
        let unit = new Unit()
        let cardObj = rawData.UnitsInfos.find(u=>u.CardID==unitObj.A1)
        let classObj = rawData.ClassInfos.find(c=>c.ClassID==unitObj.A2)
        let clnode = classTree.find(c=>c.ID == unitObj.A2)
        unit.ID=parseInt(unitObj.A1)
        unit.Name = rawData.NameText[unit.ID-1].Message
        unit.RealName = rawData.NameText[unit.ID-1].RealName
        
        unit.Class = classTree[clnode.Root].Name
        distinctClassCollect.add(classTree[clnode.Root])
        unit.Stage = stageName[clnode.Depth]
        unit.Rare = rareName[parseInt(cardObj.Rare)]
        unit.Lv= calLv(parseInt(unitObj.A4),clnode.Depth,parseInt(cardObj.Rare))
        unit.Cost = parseInt(cardObj.CostModValue)+classObj.Cost+parseInt(unitObj.AA)
        unit.Location = locationName[Math.floor(parseInt(unitObj.AE)/16)]
        if(parseInt(unitObj.AE)%16!=1) {
            unit.Locked=true
        }
        unitsList.push(unit)
    });

    
    distinctClassCollect.forEach(c=>{
        classList.push({
            ID:c.ID,
            Name: c.Name,
            AttackMode: c.AttackMode
        })
    })
    return [unitsList,classList]
}

const errNotPossible = 'not possible'
const errFailQualified = 'failed partial limits'
const errOK='Ok'
// 抽选机
function lotteryMachine(unitFilters, globalUnitRange, callback){
    //对全局限制的池子求交集
    let pool = new Set(globalUnitRange.allUnits)
    for (let p = 0; p < unitFilters.length; ++p) {
      if (unitFilters[p].limitOption.isGlobal) {
        let a = new Set(unitFilters[p].unitRange)
        let b = pool
        pool = new Set([...a].filter(e => b.has(e)))
      }
    }
    let globalMin = 0
    let globalMax = 15
    unitFilters.forEach(l => {
        if(l.limitOption.isGlobal){
            globalMax = Math.min(globalMax, parseInt(l.limitOption.num.top))
            globalMin = Math.max(globalMin, parseInt(l.limitOption.num.lowest))
        }
    })
    // 从抽选池中划去排除和钦定的单位
    let exclude = new Set(globalUnitRange.unitsExcluded)
    let appointed = new Set(globalUnitRange.unitsAppointed)
    pool = new Set([...pool].filter(e => !exclude.has(e)))
    pool = new Set([...pool].filter(e => !appointed.has(e)))
    pool = Array.from(pool)

    //随机重排备选池
    for (let i = pool.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))
      // 如果用解tuple的形式交换值可能会无效，FAK JS
      let tmp = pool[i]
      pool[i] = pool[j]
      pool[j] = tmp
    }
    let candidates = new Array()
    candidates = candidates.concat(globalUnitRange.unitsAppointed)
  
    // 判断整个备选池是否有足够的单位来满足所有条件
    let exceedNum=passFilters(unitFilters, pool.concat(globalUnitRange.unitsAppointed))
    for(let i in exceedNum) {
        if(exceedNum[i]<0) {
            callback(candidate, exceedNum,  errNotPossible)
            return 
        }
    }

    let theNum = globalMin + Math.floor(Math.random() * (globalMax - globalMin))

    let rNum = 0 // 从池子中抽选的数量
    while (candidates.length < theNum && rNum < pool.length) {
      candidates.push(pool[rNum])
      ++rNum
    }
    console.log('theNum:',candidates.length)
    let altStart = pool.length - rNum
    let partialFilters=unitFilters.filter(f=>!f.limitOption.isGlobal)

    let bestGrades = 0 // grades是不满足局部条件的偏差绝对值总和

    // 只有一个局部条件时可以偷个懒
    if(partialFilters.length>0) {
        [exceedNum,bestGrades]=passFilters(partialFilters, candidates)
        if(exceedNum[0]>0) {
            pool=pool.filter(u=>!partialFilters[0].unitPassFilter(u))
            for(let i=candidates.length -1;i>=0 && exceedNum[0]>0;--i) {
                if(partialFilters[0].unitPassFilter(candidates[i])) {
                    candidates.splice(i,1)
                    --exceedNum[0]
                }
            }
            candidates=candidates.concat(pool.slice(0, bestGrades))
        }
        else if (exceedNum[0]<0) {
            bestGrades=Math.abs(bestGrades)
            pool=pool.filter(u=>partialFilters[0].unitPassFilter(u))
            for(let i=candidates.length -1;i>=0 && exceedNum[0]<0;--i) {
                if(!partialFilters[0].unitPassFilter(candidates[i])) {
                    candidates.splice(i,1)
                    ++exceedNum[0]
                }
            }
            candidates=candidates.concat(pool.slice(0, bestGrades))
        }
        bestGrades=exceedNum[0]
    }
    else if(partialFilters.length>1) {
        [exceedNum,bestGrades]=passFilters(partialFilters, candidates)
        let breakTimes = 1000 // 尝试次数
        let times = 0
        let altPool = pool.filter(u=>!candidates.includes(u))
        let featUnits = candidates.map(u=>u.ID)
        console.log(times,bestGrades)
        // 贪心算法尝试匹配局部条件
        while(bestGrades>0&&times<breakTimes){
            altPool.push(candidates.pop())
            candidates.splice(altStart,0,altPool.shift())
            // 如果待定队伍回归了初始待定队伍则认为尝试失败
            if(matchTeam(featUnits,candidates)){
                break
            }
            [exceedNum,nowGrades] = passFilters(partialFilters, candidates)
            bestGrades=Math.min(bestGrades,nowGrades)
            times+=1
        }
    }


    
    let err=bestGrades>0?errFailQualified:errOK
    callback(candidates, exceedNum,  err)
  
  }
function matchTeam(featUnits, candidates){
    for(let i in featUnits){
        if(featUnits[i]!=candidates[i].ID){
            return false
        }
    }
    return true
}
function passFilters(filters, team) {
    let exceedNum=filters.map(f=>0)
    let filterQualified = filters.map(f=>0)
    team.forEach(u=>{
        filters.forEach((f,i)=>{
            if(f.unitPassFilter(u)){
                filterQualified[i]+=1
            }
        })
    })
    filters.forEach((f,i)=>{
        if(filterQualified[i]<f.limitOption.num.lowest){
            exceedNum[i]=filterQualified[i]-f.limitOption.num.lowest
        }
        else if(filterQualified[i]>f.limitOption.num.top){
            exceedNum[i]=filterQualified[i]-f.limitOption.num.top
        }
        else {
            exceedNum[i]=0
        }
    })
    let grades = exceedNum.reduce((accumulator, currentValue) => Math.abs(accumulator) + Math.abs(currentValue))
    return [exceedNum,grades]
}
module.exports = {
    parseInfos:parseInfos,
    lotteryMachine:lotteryMachine
}