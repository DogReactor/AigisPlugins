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
            this.AWGoldCost = (20 + (this.ID - 3) * 5)*10000
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


const orbsInfo = {
    "110":{Index:0,Time:3,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/1.png\"> </div>"},"210":{Index:1,Time:4,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/2.png\"> </div>"},"310":{Index:2,Time:2,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/3.png\"> </div>"},"410":{Index:3,Time:3,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/4.png\"> </div>"},"610":{Index:5,Time:2,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/5.png\"> </div>"},"810":{Index:7,Time:4,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/6.png\"> </div>"},"1010":{Index:21,Time:5,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/7.png\"> </div>"},"1110":{Index:22,Time:2,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/8.png\"> </div>"},"1210":{Index:23,Time:1,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/9.png\"> </div>"},"1410":{Index:25,Time:2,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/10.png\"> </div>"},"1510":{Index:26,Time:5,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/11.png\"> </div>"},"1610":{Index:27,Time:4,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/12.png\"> </div>"},"1710":{Index:28,Time:5,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/13.png\"> </div>"},"1810":{Index:29,Time:7,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/14.png\"> </div>"},"1910":{Index:30,Time:4,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/15.png\"> </div>"},"2210":{Index:33,Time:6,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/16.png\"> </div>"},"2410":{Index:35,Time:6,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/17.png\"> </div>"},"2510":{Index:36,Time:6,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/18.png\"> </div>"},"2610":{Index:37,Time:7,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/19.png\"> </div>"},"10010":{Index:52,Time:1,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/20.png\"> </div>"},"10110":{Index:53,Time:5,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/21.png\"> </div>"},"10210":{Index:54,Time:1,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/22.png\"> </div>"},"10310":{Index:55,Time:5,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/23.png\"> </div>"},"10410":{Index:56,Time:3,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/24.png\"> </div>"},"10610":{Index:58,Time:4,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/25.png\"> </div>"},"10710":{Index:59,Time:3,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/26.png\"> </div>"},"10810":{Index:72,Time:3,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/27.png\"> </div>"},"10910":{Index:73,Time:1,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/28.png\"> </div>"},"11210":{Index:76,Time:2,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/29.png\"> </div>"},"11310":{Index:77,Time:1,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/30.png\"> </div>"},"11410":{Index:78,Time:6,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/31.png\"> </div>"},"12010":{Index:84,Time:7,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/32.png\"> </div>"},"12110":{Index:85,Time:6,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/33.png\"> </div>"},"12210":{Index:86,Time:7,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/34.png\"> </div>"},"12310":{Index:87,Time:7,ImgHtml:"<div class=\"classIcon\"> <img src=\"img/35.png\"> </div>"},
    getClass(index) {
        this.keys().forEach(e => {
            if(this[e].Index===index) {
                return e
            }
        });
    },
    getClassByTime(time) {
        let day=[]
        this.keys().forEach(e => {
            if(this[e].Time===time) {
                day.push(e)
            }
        });
        return day
    }
}

module.exports = {
    stageInfos:stageInfos,
    rareInfos:rareInfos,
    orbsInfo:orbsInfo,
    expList:expList,
    locationName:locationName,
    calLv:calLv
}