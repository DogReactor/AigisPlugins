const fs = require('fs')

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

const name_zh = {
    "ソルジャー": "士兵",
    "ヘビーアーマー": "盾",
    "ワルキューレ": "骑兵",
    "ローグ": "盗贼",
    "プリンセス": "公主",
    "バンデット": "山贼",
    "ヴァンパイアプリンセス": "吸血公主",
    "イモータルプリンセス": "不死公主",
    "中級竜兵": "龙兵",
    "サムライ": "武士",
    "ペガサスライダー": "天马",
    "ダークファイター": "暗黑骑士",
    "アベンジャー": "复仇",
    "モンク": "拳师",
    "エンジェル": "天使",
    "くぐつ使い": "机甲",
    "セーラー": "水兵",
    "神官戦士": "奶盾",
    "メイジアーマー": "魔盾",
    "ドラゴンライダー": "龙骑",
    "ボウライダー": "弓骑",
    "メイド": "女仆",
    "ヴァンパイアロード": "吸血鬼",
    "ソードマスター": "剑圣",
    "ロイヤルガード": "皇卫",
    "ダークストーカー": "追踪者",
    "戦の聖霊": "战圣灵",
    "ねんどろいどプリンセス": "黏土公主",
    "ぬらりひょん": "滑头鬼",
    "重装砲兵": "炮盾",
    "インペリアルナイト": "帝国骑士",
    "イビルプリンセス": "邪恶公主",
    "鍛冶職人": "铁匠",
    "グラディエーター": "角斗士",
    "モンスターブレイカー": "怪物猎人",
    "キョンシー": "僵尸",
    "グランドナイト": "大骑士",
    "グリフィンライダー": "狮鹫骑士",
    "サッパー": "工兵",
    "アーチャー": "弓",
    "メイジ": "火球",
    "ヒーラー": "奶",
    "ウィッチ": "冰",
    "パイレーツ": "海贼",
    "ドラゴンシャーマン": "龙巫女",
    "ヴァンパイアハンター": "弩",
    "シャーマン": "巫女",
    "ビショップ": "司祭",
    "サモナー": "召唤",
    "ダンサー": "舞娘",
    "ネクロマンサー": "死灵法师",
    "クロノウィッチ": "时魔女",
    "ドルイド": "德鲁伊",
    "アルケミスト": "炼金",
    "レンジャー": "游侠",
    "シーフ": "作死贼",
    "呪術使い": "咒术",
    "ダークプリースト": "暗牧",
    "エンチャンター": "附魔",
    "マーチャント": "商人",
    "フェンリルシャーマン": "狼巫女",
    "モンスタースレイヤー": "狙击",
    "デモンサモナー": "恶召",
    "エレメンタラー": "元素使",
    "アコライト": "猫又"
}

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
    "110":{"Index":0,"Time":3,"ImgHtml":"<img class=\"classIcon\" src=\"img/1.png\">"},"210":{"Index":1,"Time":4,"ImgHtml":"<img class=\"classIcon\" src=\"img/2.png\">"},"310":{"Index":2,"Time":2,"ImgHtml":"<img class=\"classIcon\" src=\"img/3.png\">"},"410":{"Index":3,"Time":3,"ImgHtml":"<img class=\"classIcon\" src=\"img/4.png\">"},"610":{"Index":5,"Time":2,"ImgHtml":"<img class=\"classIcon\" src=\"img/5.png\">"},"810":{"Index":7,"Time":4,"ImgHtml":"<img class=\"classIcon\" src=\"img/6.png\">"},"1010":{"Index":21,"Time":5,"ImgHtml":"<img class=\"classIcon\" src=\"img/7.png\">"},"1110":{"Index":22,"Time":2,"ImgHtml":"<img class=\"classIcon\" src=\"img/8.png\">"},"1210":{"Index":23,"Time":1,"ImgHtml":"<img class=\"classIcon\" src=\"img/9.png\">"},"1410":{"Index":25,"Time":2,"ImgHtml":"<img class=\"classIcon\" src=\"img/10.png\">"},"1510":{"Index":26,"Time":5,"ImgHtml":"<img class=\"classIcon\" src=\"img/11.png\">"},"1610":{"Index":27,"Time":4,"ImgHtml":"<img class=\"classIcon\" src=\"img/12.png\">"},"1710":{"Index":28,"Time":5,"ImgHtml":"<img class=\"classIcon\" src=\"img/13.png\">"},"1810":{"Index":29,"Time":7,"ImgHtml":"<img class=\"classIcon\" src=\"img/14.png\">"},"1910":{"Index":30,"Time":4,"ImgHtml":"<img class=\"classIcon\" src=\"img/15.png\">"},"2210":{"Index":33,"Time":6,"ImgHtml":"<img class=\"classIcon\" src=\"img/16.png\">"},"2410":{"Index":35,"Time":6,"ImgHtml":"<img class=\"classIcon\" src=\"img/17.png\">"},"2510":{"Index":36,"Time":6,"ImgHtml":"<img class=\"classIcon\" src=\"img/18.png\">"},"2610":{"Index":37,"Time":7,"ImgHtml":"<img class=\"classIcon\" src=\"img/19.png\">"},"10010":{"Index":52,"Time":1,"ImgHtml":"<img class=\"classIcon\" src=\"img/20.png\">"},"10110":{"Index":53,"Time":5,"ImgHtml":"<img class=\"classIcon\" src=\"img/21.png\">"},"10210":{"Index":54,"Time":1,"ImgHtml":"<img class=\"classIcon\" src=\"img/22.png\">"},"10310":{"Index":55,"Time":5,"ImgHtml":"<img class=\"classIcon\" src=\"img/23.png\">"},"10410":{"Index":56,"Time":3,"ImgHtml":"<img class=\"classIcon\" src=\"img/24.png\">"},"10610":{"Index":58,"Time":4,"ImgHtml":"<img class=\"classIcon\" src=\"img/25.png\">"},"10710":{"Index":59,"Time":3,"ImgHtml":"<img class=\"classIcon\" src=\"img/26.png\">"},"10810":{"Index":72,"Time":3,"ImgHtml":"<img class=\"classIcon\" src=\"img/27.png\">"},"10910":{"Index":73,"Time":1,"ImgHtml":"<img class=\"classIcon\" src=\"img/28.png\">"},"11210":{"Index":76,"Time":2,"ImgHtml":"<img class=\"classIcon\" src=\"img/29.png\">"},"11310":{"Index":77,"Time":1,"ImgHtml":"<img class=\"classIcon\" src=\"img/30.png\">"},"11410":{"Index":78,"Time":6,"ImgHtml":"<img class=\"classIcon\" src=\"img/31.png\">"},"12010":{"Index":84,"Time":7,"ImgHtml":"<img class=\"classIcon\" src=\"img/32.png\">"},"12110":{"Index":85,"Time":6,"ImgHtml":"<img class=\"classIcon\" src=\"img/33.png\">"},"12210":{"Index":86,"Time":7,"ImgHtml":"<img class=\"classIcon\" src=\"img/34.png\">"},"12310":{"Index":87,"Time":7,"ImgHtml":"<img class=\"classIcon\" src=\"img/35.png\">"},
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

function translateName(arr) {

    arr.forEach(e=>{
        if(name_zh[e.Name]){
            e.Name=name_zh[e.Name]
            
        }
        
    })
}
module.exports = {
    stageInfos:stageInfos,
    rareInfos:rareInfos,
    orbsInfo:orbsInfo,
    expList:expList,
    locationName:locationName,
    calLv:calLv,
    translateName:translateName
}