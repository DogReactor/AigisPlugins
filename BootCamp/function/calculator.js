"use strict";
exports.__esModule = true;
function eatLittleBlessing(unit, GlobalExpMult) {
    var exp = 0;
    switch (unit.Rare.Name) {
        case '银':
            exp = 3000;
            break;
        case '金':
            exp = 18000;
            break;
        case '白':
            exp = 19000;
            break;
        case '黑':
            exp = 20000;
            break;
        case '蓝':
            exp = 19000;
            break;
        default: break;
    }
    exp *= GlobalExpMult;
    return exp;
}
function eatPackage(unit, GlobalExpMult, kind) {
    if (kind === void 0) { kind = 'Bucket'; }
    var exp = 0;
    exp = kind == 'Bucket' ? 8000 : 40000;
    exp *= GlobalExpMult;
    return exp;
}
function eatIridescence(unit, SkillTo) {
    if (SkillTo === void 0) { SkillTo = 0; }
    var targetSkillLv = SkillTo <= unit.Skill.SkillLevel ? unit.Skill.MaxSkillLevel : SkillTo;
    var cost = 0;
    var upSkillChance = {
        '3': [1, 0.25],
        '5': [1, 0.75, 0.5, 0.25],
        '10': [1, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25],
        '16': [1, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25]
    };
    if (unit.Skill.SkillLevel != targetSkillLv) {
        upSkillChance[unit.Skill.MaxSkillLevel].slice(unit.Skill.SkillLevel - 1, targetSkillLv).forEach(function (c) { return cost += 1 / c; });
    }
    return cost;
}
var TrainPlan = /** @class */ (function () {
    function TrainPlan() {
        this.Cost = {
            Buckets: [],
            DarkBucket: [],
            LSpirits: [],
            Iridescence: 0,
            Orbs: { Kind: [], Num: 0 }
        };
    }
    // 需要有一个不实际减少仓库物品的方案
    TrainPlan.prototype.getPlan = function (unit, globalExpMult) {
        var resExp = unit.getExpRes({ Lv: this.Lv, Stage: this.Stage });
        var totalExp = resExp.reduce(function (accumulator, currentValue) { return accumulator + currentValue; });
        this.Cost.Buckets = new Array(resExp.length);
        this.Cost.Buckets.fill(0);
        this.Cost.LSpirits = new Array(resExp.length);
        this.Cost.LSpirits.fill(0);
        this.Cost.DarkBucket = new Array(resExp.length);
        this.Cost.DarkBucket.fill(0);
        // 吃黑桶
        var accum = 0;
        for (var i in resExp) {
            var tempE = eatPackage(unit, globalExpMult, 'DarkBucket');
            while (accum < this.DarkBucket && resExp[i] > tempE) {
                resExp[i] -= tempE;
                ++this.Cost.DarkBucket[i];
                ++accum;
            }
        }
        // 吃小祝福
        accum = 0;
        for (var i in resExp) {
            var tempE = eatLittleBlessing(unit, globalExpMult);
            while (accum < this.DarkBucket && resExp[i] > tempE) {
                resExp[i] -= tempE;
                ++this.Cost.LSpirits[i];
                ++accum;
            }
        }
        // 吃普通白桶
        for (var i in resExp) {
            var tempE = eatPackage(unit, globalExpMult);
            while (resExp[i] > tempE) {
                resExp[i] -= tempE;
                ++this.Cost.Buckets[i];
            }
        }
        // 觉醒宝珠
        if (unit.Stages[0].ID == 'CC后' || unit.Stages[0].ID == '第一觉醒') {
            if (resExp.length > 1) {
                this.Cost.Orbs.Kind = [unit.Class.AWOrbs];
                this.Cost.Orbs.Num = unit.Rare.OrbCost * (resExp.length - 1);
            }
        }
        this.Cost.Iridescence = eatIridescence(unit, this.SkillTo);
    };
    return TrainPlan;
}());
exports.TrainPlan = TrainPlan;
