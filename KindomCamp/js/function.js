var expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];

var rareInfo=[
    {expMut:1,ccCost:0,maxLevel:[30,30,30,30]},
    {expMut:1.1,ccCost:0,maxLevel:[40,40,40,40]},
    {expMut:1.2,ccCost:0,maxLevel:[50,55,55,55]},
    {expMut:1.3,ccCost:20,maxLevel:[50,60,80,99]},
    {expMut:1.4,ccCost:25,maxLevel:[50,70,90,99]},
    {expMut:1.5,ccCost:30,maxLevel:[50,80,99,99]},
    {expMut:1.4,ccCost:25,maxLevel:[50,65,85,99]},
];
var combMut=1;
var stageName=['CC前','CC后','第一觉醒','第二觉醒'];
var UnitsList=new Array();
var UnitInfo;
var ClassInfo;
var SkillInfo;
var KindomRepo=new Object();
function Unit(unitObj) {

    this.cardID = parseInt(unitObj.A1);
    this.name=UnitInfo[this.cardID].Name;
    this.rare=Math.min(UnitInfo[this.cardID].Rare,6);
    this.classID = Math.floor(unitObj.A2);
    this.classStage=calStage(this.classID);
    this.affection = parseInt(unitObj.A5);
    this.skillID = parseInt(unitObj.AD);
    this.updateCom(parseInt(unitObj.UnitID),parseInt(unitObj.A4),parseInt(unitObj.AA),parseInt(unitObj.A6));

    function updateCom (id,exp,costRedc,skillLv) {
        this.exp=exp;
        [this.Lv,this.nextExp]=calLv(this.exp,this.classStage,this.rare);
        this.unitID=id;
        this.cost=UnitInfo[this.unitID].CostModValue+ClassInfo[this.classID].Cost+costRedc;
    this.remainCost=UnitInfo[this.unitID].CostDecValue+costRedc||'MIN';
    this.skillLv = skillLv;
    this.skillMaxLv=SkillInfo[this.skillID].LevelMax==this.skillLv? 'MAX':SkillInfo[this.skillID].LevelMax;
    }

    function updateCC (classID) {
        this.exp=0;
        this.classStage+=1;
        [this.Lv,this.nextExp]=calLv(this.exp,this.classStage,this.rare);
        this.cost+=ClassInfo[classID].Cost-this.classID;
        this.classID=classID;
    }
}
function calLv(exp,stage,rare) {
    //修正稀有度带来的经验值差异
    var baseExp=Math.round(exp / rareInfo[rare].expMut);
    //利用公式Exp=0.1793*Lv^2.877)猜一次等级
    var pLv=Math.min(Math.round(Math.pow(baseexp / 0.1793, 1 / 2.877)), 98);
    //与猜测等级附近的等级比较经验值，找出准确等级
    while ((expList[pLv] > exp || expList[pLv + 1] <= exp) && expList[99] > exp) {
      if (expList[pLv] > exp) {
        pLv = pLv - 1;
      } else {
        pLv = pLv + 1;
      }
    }
    var nextExp='MAX';
    if (pLv+1!=rareInfo[rare].maxLevel[stage]){
        nextExp = Math.round(expList[pLv + 1] * rareInfo[rare].expMut) - exp;
    }
    return [pLv+1,nextExp]
}
function calStage(classID) {
  switch (ClassInfo[classID].MaxLevel) {
    case 50:
      return 0;
    case 80:
      return 1;
    case 99:
      if (classID % 100 == 70 || classID % 100 == 80) {
        return 3;
      } else if (classID == 9800) {
        return 1;
      } else {
        return 2;
      }
  }
}

function raisePlan(targetStg, targetLv, unit, bSkillAw) {
  this.targetStg = stageName[targetStg];
  this.targetLv = targetLv;
  this.restExp =
    expList[targetLv - 1] -
    expList[rareInfo[unit.rare].maxLevel[targetStg] - 1];

  for (let i = Math.min(2, unit.classStage); i <= Math.min(2, targetStg); ++i) {
    this.restExp += expList[rareInfo[unit.rare].maxLevel[i] - 1];
  }
  this.restExp = Math.round(this.restExp * rareInfo[unit.rare].expMut) - unit.exp;
  this.bucketNum=Math.floor(this.restExp/(8000*combMut));
  this.feedExp=this.restExp-this.bucketNum*8000*combMut;
  this.ccGoldCost=0;
  if(this.rare>2&&targetStg>1) {
      this.ccGoldCost=(targetStg-Math.max(1,unit.classStage))*rareInfo[unit.rare].ccCost;
  }
  if(bSkillAw){this.ccGoldCost+=rareInfo[unit.rare].ccCost;}
}
var Operations={
    setRefData:function(RefData){
        UnitInfo=RefData.UnitData;
        for(const i in UnitInfo){
            UnitInfo[i].Name=RefData.NameText[i];
        }
        ClassInfo=RefData.ClassData;
        SkillInfo=RefData.SkillData;
        KindomRepo.gold=RefData.StatusData.A1;
        KindomRepo.magicCrystal=RefData.StatusData.AE;
    },
    getUnitList:function(rawList) {
        for (const i in rawList) {
            //排除圣灵和王子
            if (rawList[i].A2>99&&rawList[i].A8) {
                unitsList.push(new  Unit(rawList[i]));
            }
        }
        return unitsList;
    },
    setTarget:function(targetStg,targetLv,unit) {

    }
};
module.exports=Operations;