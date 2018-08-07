"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var gameData_service_1 = require("./gameData.service");
var RawData = /** @class */ (function () {
    function RawData(dataRepo) {
        this.NameText = dataRepo.NameText;
        this.UnitsData = dataRepo.UnitsData;
        this.ClassData = dataRepo.ClassData;
        this.SkillList = dataRepo.SkillList;
        this.PlayerInfo = dataRepo.PlayerInfo;
        this.Orbs = dataRepo.Orbs;
    }
    return RawData;
}());
exports.RawData = RawData;
var ParsedGameData = /** @class */ (function () {
    function ParsedGameData() {
    }
    return ParsedGameData;
}());
exports.ParsedGameData = ParsedGameData;
var ClassTreeNode = /** @class */ (function () {
    function ClassTreeNode(cl) {
        this.Pre = null;
        this.Past = [null, null];
        this.Info = null;
        // Info和Classkeys只对根节点有意义，分别存储树的高度和这棵树上所有职业的ID
        this.Height = 99;
        this.ClassKeys = [];
        this.Info = cl;
    }
    return ClassTreeNode;
}());
// 解析一个职业，输入为该职业的根节点
function parseClassData(classInfo) {
    var theClass = new gameData_service_1.Profession;
    theClass.Name = classInfo.Info.Name;
    switch (classInfo.Info.MaxLevel) {
        // 根职业最大等级为50，则有CC，最终职阶为职业树高度
        case '50':
            theClass.Stages = gameData_service_1.StageList.slice(0, classInfo.Height);
            break;
        // 根职业最大等级为80，为特殊觉醒，最终职阶为职业树高度+1
        case '80':
            theClass.Stages = gameData_service_1.StageList.slice(1, classInfo.Height + 1);
            break;
        // 跟职业最大等级为99，为王子和皇帝（token和圣灵等不计），视为已CC
        case '99':
            theClass.Stages = gameData_service_1.StageList.slice(1, 2);
            break;
        default: break;
    }
    // 非递归地遍历职业树以找到觉醒珠子
    var stack = [];
    var k = classInfo;
    while (k != null || stack.length != 0) {
        if (k.Info.Name == 'ヘビーアーマー') {
            k.Info.AWOrbs.push(1);
        }
        while (k != null) {
            if (k.Info.Data_ExtraAwakeOrb1 != 0) {
                theClass.AWOrbs.push(k.Info.Data_ExtraAwakeOrb1 % 100 - 1);
                if (k.Info.Data_ExtraAwakeOrb2 != 0) {
                    theClass.AWOrbs.push(k.Info.Data_ExtraAwakeOrb2 % 100 - 1);
                }
                k = null;
                stack = [];
                break;
            }
            stack.push(k);
            k = k.Past[0];
        }
        if (stack != [0]) {
            k = stack.pop();
            k = k.Past[1];
        }
    }
    theClass.ClassKeys = classInfo.ClassKeys;
    return theClass;
}
function createClassTree(classData) {
    var classForest;
    classData.forEach(function (cl) {
        classForest.push(new ClassTreeNode(cl));
    });
    // 建立树上各节点间的关系
    classForest.forEach(function (c) {
        // CC、觉醒、二觉一分支阶段置于本节点左子节点
        if (c.Info.JobChange != 0) {
            var child = classForest.find(function (e) { return e.Info.Info.ClassID == c.Info.JobChange; });
            child.Pre = c;
            c.Past[0] = child;
        }
        if (c.Info.AwakeType1 != 0) {
            var child = classForest.find(function (e) { return e.Info.ClassID == c.Info.AwakeType1; });
            child.Pre = c;
            c.Past[0] = child;
        }
        // 二觉二分支和铜铁职阶置于本节点右子节点，这样树上的所有右子节点均为叶节点
        if (c.Info.AwakeType2 != 0) {
            var child = classForest.find(function (e) { return e.Info.ClassID == c.Info.AwakeType2; });
            child.Pre = c;
            c.Past[1] = child;
        }
        if (c.Info.ClassID % 10 == 1) {
            var parent_1 = classForest.find(function (e) { return e.Info.ClassID == c.Info.ClassID - 1; });
            c.Pre = parent_1;
            parent_1.Past[1] = c;
        }
    });
    // 在每棵职业树的根节点存储本节点所有职业ID，并计算职业树高度
    classForest.forEach(function (c) {
        if (c.Pre == null) {
            var k = c;
            var height = 0;
            // 非递归地遍历职业树
            var stack = [];
            while (k != null || stack.length != 0) {
                while (k != null) {
                    c.ClassKeys.push(k.Info.ClassID);
                    height += 1;
                    stack.push(k);
                    k = k.Past[0];
                }
                // 第一轮遍历左子节点后即已得到该职业树高度，因此高度仅更新一次
                c.Height = Math.min(height, c.Height);
                if (stack != [0]) {
                    k = stack.pop();
                    k = k.Past[1];
                }
            }
        }
    });
    // 数组中只保留根节点
    var classTree = classForest.filter(function (c) { return c.Pre == null; });
    return classTree;
}
function parseUnitData(rawData, u, classData) {
    var theUnit = new gameData_service_1.Unit;
    theUnit.ID = u.UnitID;
    theUnit.Name = rawData.NameText[u.A1 - 1].Message;
    theUnit.CardID = u.A1;
    theUnit.Class = classData.find(function (e) { return e.ClassKeys.findIndex(u.A2) != -1; });
    theUnit.Rare.ID = Math.min(rawData.UnitsData.Rare, 6);
    theUnit.Rare = gameData_service_1.RareList[theUnit.Rare.ID];
    theUnit.Stages = theUnit.Class.Stages.slice(u.A3, theUnit.Rare.MaxGrowth + 1);
    theUnit.setExp(parseInt(u.A4));
    theUnit.Favor = u.A5;
    theUnit.Skill = { SkillLevel: u.A6, MaxSkillLevel: rawData.SkillList[rawData.UnitsData.ClassLV1SkillID].LevelMax };
    return theUnit;
}
function parseOrbs(Orbs) {
    var orbsIndex = [
        23, 52, 54, 73, 77,
        2, 5, 22, 25, 76,
        0, 3, 56, 59, 72,
        1, 7, 27, 30, 58,
        21, 26, 28, 53, 55,
        33, 35, 36, 78, 85,
        29, 37, 84, 86, 87
    ];
    var days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var orbsStore = [];
    Orbs.forEach(function (e) {
        for (var i = 0; i < 4; ++i) {
            var n = e & 0xFF;
            e = e >> 8;
            orbsStore.push(n);
        }
    });
    var orbsNum = [];
    orbsIndex.forEach(function (i) {
        orbsNum.push(orbsStore[i]);
    });
    return orbsNum;
}
function parseGameData(rawData, playerUnitData) {
    return __awaiter(this, void 0, void 0, function () {
        var classTree, classData, parsedGameData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        if (rawData.NameText.length * rawData.ClassData.length * rawData.SkillList.length * rawData.UnitsData.length * playerUnitData.length != 0) {
                            return resolve('Ok');
                        }
                    })];
                case 1:
                    _a.sent();
                    classTree = createClassTree(rawData.ClassData);
                    classData = [];
                    classTree.forEach(function (c) {
                        classData.push(parseClassData(c));
                    });
                    parsedGameData = new ParsedGameData;
                    playerUnitData.forEach(function (u) {
                        if (u.UnitID != 0 && u.A2 > 99) {
                            parsedGameData.BarrackInfo.push(parseUnitData(rawData, u, classData));
                        }
                        // 更新兵营中的圣灵等
                        if (u.A2 < 99) {
                            if (1 <= u.A2 && u.A2 <= 6 || u.A2 == 12) {
                                parsedGameData.ResStore.addRareSpirit(u.A2);
                            }
                            else if (u.A2 == 17) {
                                parsedGameData.ResStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare);
                            }
                            else if (u.A2 == 32) {
                                parsedGameData.ResStore.GlobalExpMult = 1.1;
                            }
                            else {
                                parsedGameData.ResStore.addOtherSpirit(u.A2);
                            }
                        }
                    });
                    // TO DO 获取金钱、魔水、宝珠
                    if (rawData.PlayerInfo != undefined) {
                        parsedGameData.ResStore.Gold = rawData.PlayerInfo.A1;
                        parsedGameData.ResStore.MagicCrystal = rawData.PlayerInfo.AE;
                    }
                    if (rawData.Orbs.length > 0) {
                        parsedGameData.ResStore.Orb = parseOrbs(rawData.Orbs);
                    }
                    return [2 /*return*/, parsedGameData];
            }
        });
    });
}
exports.parseGameData = parseGameData;
function parseSpiritRepo(rawData, spiritStore, resStore) {
    // 更新仓库中的圣灵等， 需要另写一个函数
    spiritStore.forEach(function (s) {
        var id = rawData.UnitsData[s.CardID].InitClassID;
        if (1 <= id && id <= 6 || id == 12) {
            resStore.addRareSpirit(id, s.Count);
        }
        else if (id == 17) {
            resStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare, s.Count);
        }
        else if (id == 32) {
            resStore.GlobalExpMult = 1.1;
        }
        else {
            resStore.addOtherSpirit(id, s.Count);
        }
    });
    return resStore;
}
exports.parseSpiritRepo = parseSpiritRepo;
