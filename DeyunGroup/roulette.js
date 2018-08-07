var classList = new Array();
var unitList = new Array();
var dataReady = false;

function calLv(exp,rare) {
  //经验值表
  var expList = [0,32,65,100,135,172,211,250,291,333,418,506,598,693,791,893,998,1106,1218,1333,1503,1679,1862,2052,2249,2452,2662,2879,3103,3333,3616,3910,4215,4531,4859,5198,5548,5910,6282,6667,7232,7819,8429,9062,9718,10395,11096,11819,12565,13333,14181,15062,15977,16927,17910,18927,19977,21062,22181,23333,24463,25638,26859,28124,29435,30791,32192,33638,35130,36667,38079,39548,41073,42655,44294,45989,47740,49548,51412,53333,55311,57367,59503,61718,64011,66384,68836,71367,73977,76667,78644,80701,82836,85051,87345,89718,92169,94701,97311,97311];
  //修正稀有度带来的经验值差异
  var expMut = rare * 0.1 + 1;
  //蓝宝石单位经验倍率为1.4
  if (expMut == 1.7) { expMut = 1.4; }
  var baseExp = Math.round(exp / expMut);
  //利用公式Exp=0.1793*Lv^2.877)猜一次等级
  var pLv = Math.min(Math.round(Math.pow(baseExp / 0.1793, 1 / 2.877)), 98);
  //与猜测等级附近的等级比较经验值，找出准确等级
  while ((expList[pLv] > baseExp || expList[pLv + 1] <= baseExp) && expList[99] > baseExp) {
    if (expList[pLv] > baseExp) {
      pLv = pLv - 1;
    } else {
      pLv = pLv + 1;
    }
  }
  return pLv + 1;
}

function findStage(classInfo, classID) {
  var maxLevel=parseInt(classInfo.find((c) => { return c.ClassID == classID }).MaxLevel);
  switch (maxLevel) {
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
function initInfos(classInfo, nameInfo, unitsInfo, barracksInfo) {
  classList = classInfo.filter(c => {
    c.classID % 100 == 0;
  });

  var rareList=["铁","铜","银","金","白","黑","未定","蓝"];
  var stage=["CC前","CC后","第一觉醒","第二觉醒"];
  var location=["第一兵营","第二兵营","第三兵营"];


  barracksInfo.forEach(ub => {
    var u = new Object();
    var id = ub.A1 - 1;
    if (id != 0 && unitsInfo.InitClassID[id] >= 100) {
      u.name = nameInfo[id];
      u.class = classInfo.find((c) => {
        return c.ClassID == 100 * parseInt(unitsInfo.InitClassID[id] / 100);
      }).Name;

      u.stage = stage[findStage(classInfo, ub.A2)];

      u.rare = rareList[unitsInfo.Rare[id]];
      u.level = calLv(ub.A4, unitsInfo.Rare[id]);
      u.location = location[parseInt(ub.AE / 16)];// 兵营位置
      u.locked = (ub.AE % 16 - 1 == 0) ? false : true;
      unitList.push(u);
    }
  });
  classInfo.forEach(cb => {
    if (cb.ClassID % 100 == 0) {
      classList.push(cb.Name);
    }
  });
  dataReady = true;
}

var run = function (pluginHelper) {
  pluginHelper.onMessage((msg, sendResponse) => {
    if (msg.sender == 'DeyunGroupWindow') {
      if (msg.body == 'Request Data' && dataReady) {
        var response = new Object();
        response.body = new Object();
        response.body.classList = classList;
        response.body.unitList = unitList;
        response.flag = true;
        sendResponse(response);
      }
      else {
        var response = new Object();
        response.sender = 'DeyunGroupBack';
        response.body = 'No data available';
        response.flag = false;
        sendResponse(response);
      }
    }
  });
}
var gameData = function (event, data) {
  if (event == 'allcards-info') {
    gameData.unitsInfo = data;
    ++gameData.state;
  }
  if (event == 'allunits-info') {
    gameData.barracksInfo = data;
    ++gameData.state;
  }
  if (2 == gameData.state) {
    gameData.state = 0;
    initInfos(gameData.baseData.classInfo, gameData.baseData.nameInfo, gameData.unitsInfo, gameData.barracksInfo);
  }
};
gameData.unitsInfo = new Object();
gameData.barracksInfo = new Array();
gameData.baseData = require("./data.js").data;
gameData.state = 0;

module.exports = {
  run: run,
  newGameResponse: gameData
}