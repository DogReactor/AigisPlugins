const ipcRenderer= require('electron').ipcRenderer;
const remote = require('electron').remote;
remote.getCurrentWebContents().openDevTools();
const path = require('path');
/*-------------试验性质-------------*/
var expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];
var rareInfo=[
    {expMut:1,ccCost:0,maxLevel:[30]},
    {expMut:1.1,ccCost:0,maxLevel:[40]},
    {expMut:1.2,ccCost:0,maxLevel:[50,55]},
    {expMut:1.3,ccCost:20,maxLevel:[50,60,80,99]},
    {expMut:1.4,ccCost:25,maxLevel:[50,70,90,99]},
    {expMut:1.5,ccCost:30,maxLevel:[50,80,99,99]},
    {expMut:1.4,ccCost:25,maxLevel:[50,65,85,99]},
];
var combMut=1;
var stageName=['CC前','CC后','第一觉醒','第二觉醒'];
var unitsList = new Array();
var expMut=1;
var classInfo=new  Array();
var unitsInfo=new  Array();
var unitInfo=new Object();
function calStage(classID) {
  
  
  switch (classInfo['C'+classID].MaxLevel) {
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
function Unit(unitObj) {
  
  this.cardID = parseInt(unitObj.A1);
  this.name=unitsInfo['U'+this.cardID].Name;
  this.rare=Math.min(unitsInfo['U'+this.cardID].Rare,6);
  this.classID = Math.floor(unitObj.A2);
  this.classStage=calStage(this.classID);
  this.affection = parseInt(unitObj.A5);
  this.skillID = parseInt(unitObj.AD);
  
  this.exp=parseInt(unitObj.A4);
  [this.Lv,this.nextExp]=calLv(this.exp,this.classStage,this.rare);
  this.unitID=parseInt(unitObj.A1);

  this.cost=unitsInfo['U'+this.unitID].CostModValue+classInfo['C'+this.classID].Cost+parseInt(unitObj.AA);
this.remainCost=unitsInfo['U'+this.unitID].CostDecValue+parseInt(unitObj.AA)||'MIN';
  this.skillLv=parseInt(unitObj.A6);
  function updateCom (id,exp,costRedc,skillLv) {
      this.exp=exp;
      [this.Lv,this.nextExp]=calLv(this.exp,this.classStage,this.rare);
      this.unitID=id;
      this.cost=unitsInfo[this.unitID].CostModValue+classInfo['C'+this.classID].Cost+costRedc;
  this.remainCost=unitsInfo[this.unitID].CostDecValue+costRedc||'MIN';
  // this.skillLv = skillLv;
  // this.skillMaxLv=SkillInfo[this.skillID].LevelMax==this.skillLv? 'MAX':SkillInfo[this.skillID].LevelMax;
  }

  function updateCC (classID) {
      this.exp=0;
      this.classStage+=1;
      [this.Lv,this.nextExp]=calLv(this.exp,this.classStage,this.rare);
      this.cost+=classInfo['C'+classID].Cost-this.classID;
      this.classID=classID;
  }
}
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
  var nextExp='MAX';
  if (pLv+1!=rareInfo[rare].maxLevel[stage]){
      nextExp = Math.round(expList[pLv + 1] * rareInfo[rare].expMut) - exp;
  }
  return [pLv+1,nextExp]
}
function raisePlan(targetStg, targetLv, unit, bSkillAw) {
  this.targetStg = targetStg;
  this.targetStgName=stageName[targetStg];
  this.targetLv = targetLv;
  this.unit=unitsList.find(function(u){
    return u.unitID==unit.unitID
  });
  this.bSkillAw=bSkillAw;
  this.restExp=new Array;
  this.bucketNum=new Array();
  this.feedExp=new Array();
  this.startPoint=new Array();
  
  this.updatePlan=function(){
    for (let i = Math.min(2, this.unit.classStage),j=0; i <= Math.min(2, this.targetStg); ++i,++j) {
      this.restExp[j]= Math.round(expList[rareInfo[this.unit.rare].maxLevel[i] - 1] * rareInfo[this.unit.rare].expMut);
      var nowExp=0;
      if(j==0) {
        nowExp = this.unit.exp;
      }
      this.restExp[j]-=nowExp;
      if(i== Math.min(2, this.targetStg)){
        this.restExp[j]+=Math.round((expList[this.targetLv - 1] -
        expList[rareInfo[this.unit.rare].maxLevel[this.targetStg] - 1])*rareInfo[this.unit.rare].expMut);
      }
      this.restExp[j]=Math.max(this.restExp[j],0);
      this.bucketNum[j]=Math.floor(this.restExp[j]/(8000*combMut));
      this.feedExp[j]=this.restExp[j]-this.bucketNum[j]*8000*combMut;
      this.startPoint[j]=calLv(this.feedExp[j]+nowExp,i,this.unit.rare);
    }
    this.ccGoldCost=0;
    if(this.unit.rare>2&&this.targetStg>1) {
        this.ccGoldCost=(this.targetStg-Math.max(1,this.unit.classStage))*rareInfo[this.unit.rare].ccCost;
    }
    if(this.bSkillAw){this.ccGoldCost+=rareInfo[this.unit.rare].ccCost;}
  }
  this.updatePlan();
}
var planList=new Array();
$.getJSON("./js/class.json",(obj)=>{
    classInfo=obj;
});
$.getJSON("./js/unit.json",(obj)=>{
    unitsInfo=obj;
});
// $.getJSON("./js/ul.json",(obj)=>{
//     for(i in obj.ul){
//     unitsList.push(obj.ul[i]);}
// });
/*-------------试验性质-------------*/
var rareShow=[false,false,false,true,true,true,true,true];
$('thead th.digit').data('sortBy', function(th, td, tablesort) {
	return parseInt(td.text());
});
var isReachable=[true,true,true,true];
$(document).ready(() => {

  $("table").tablesort();

  $("button.rareChoose").click(function() {
    var r = $(this).attr("rare");
    $(this).toggleClass("active");
    $(this).blur();
    Vue.set(rareShow, r, !rareShow[r]);
  });

  $('.ui.modal').modal({blurring:true});
  $('.ui.modal').modal('setting', 'transition', 'vertical flip');

  $(".calendar.icon").click(function() {
    $.extend(true,unitInfo,unitsList[$(this).attr("pUnit")]);
    for (i in stageName) {
      isReachable[i]=!rareInfo[unitInfo.rare].maxLevel[i]||i<unitInfo.classStage?false:true;
    }
    document.getElementById("setLv").value="";
    vUnitSelected.$forceUpdate();
    vChooseStage.$forceUpdate();
    $('.ui.modal').modal('show');
  });

  $("#addToPlan").click(function() {
    var targetStg = parseInt($("#chooseStage")
        .children()
        .val());
    var targetLv = parseInt($("#setLv").val() || rareInfo[unitInfo.rare].maxLevel[targetStg]);
    if (targetStg<=unitInfo.classStage&&targetLv<=unitInfo.Lv){return}
    if (planList.find(function(p) {
        return p.unit.unitID == unitInfo.unitID;
      })) {
      let i = planList.findIndex(function(p){
        return p.unit.unitID == unitInfo.unitID;
      });
      Vue.set(planList, i, new raisePlan(targetStg, targetLv, unitInfo, false));
    } else {
      planList.push(new raisePlan(targetStg, targetLv, unitInfo, false));
    }

  });
  $('#planL')
  .on('click','.message .close', function() {
    let plid=$(this)
      .closest('.message')
      .attr('plid')
    ;
    planList.splice(plid,1);
  });
});
var vUnitTable=new Vue({
  el:'#unitsTable',
  data:{unitsList,rareShow,stageName}
});
var vUnitSelected=new Vue({
  el:'#unitSelectedInfo',
  data:{unitInfo}
});
var vChooseStage = new Vue({
el: "#chooseStage",
data: { stageName,isReachable }
});
var vPlanList = new Vue({
  el: "#planL",
  data: { planList,stageName }
  });
ipcRenderer.on('allunits-info', (event, obj, tabId) => {
  console.log('Get all units');
    for (i in obj) {
        var checkClass=Math.floor(parseInt(obj[i].A2)/100);
        if (checkClass!=99&&checkClass!=0){
            unitsList.push(new Unit(obj[i]));
        }
        else if(parseInt(obj[i].A2)==32){expMut=1.1;}
    }
});
ipcRenderer.on('response-packages', (event, args) => {
  var obj=args[0];
  for (i in obj) {
      var checkClass=Math.floor(parseInt(obj[i].A2)/100);
      if (checkClass!=99&&checkClass!=0&&obj[i].A1<570&&classInfo["C"+obj[i].A2]){
          unitsList.push(new Unit(obj[i]));
      }
      else if(parseInt(obj[i].A2)==32){expMut=1.1;}
  }
})
ipcRenderer.send('response-packages','allunits-info');
ipcRenderer.on('unit-sell', (event, obj, tabId) => {
  console.log('Get sold');
    console.log(obj);
});
ipcRenderer.on('merge-unit', (event, obj, tabId) => {
    console.log('mu');
});
/*尚需监听事件：抽卡（白卷，名声，etc），合成继承，引退 */




