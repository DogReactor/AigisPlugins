import { RareStage, GrowthStage, Unit, ResourceStore, Profession } from './gameData.service'


const RareList = [
    new RareStage('铁', 1),
    new RareStage('铜', 1.1),
    new RareStage('银', 1.2),
    new RareStage('金', 1.3),
    new RareStage('白', 1.4),
    new RareStage('黑', 1.5),
    new RareStage('蓝', 1.4)
]

const StageList = [
    new GrowthStage('CC前', [30, 40, 50, 50, 50, 50, 50]),
    new GrowthStage('CC后', [30, 40, 55, 60, 70, 80, 65]),
    new GrowthStage('第一觉醒', [30, 40, 55, 80, 90, 99, 85]),
    new GrowthStage('第二觉醒', [30, 40, 55, 99, 99, 99, 99])
]

class RawData {
    public NameText: Array<Object>
    public UnitsData: Array<Object>
    public ClassData: Array<Object>
    public SkillList: Array<Object>
}

let ClassList = new Array()




export class ParsedGameData {
    public BarrackInfo: Array<Unit>
    public ResStore: ResourceStore

}

function parseClassData(classInfo):Profession {
    let theClass=new Profession
    theClass.Name = classInfo.Name
    switch (classInfo.MaxLevel) {
        case '50': theClass.Stages = StageList; break
        case '80': theClass.Stages = StageList.slice(1, classInfo.Depth + 1); break
        case '99': theClass.Stages = StageList.slice(1, 2); break
        default: break
    }
    theClass.AWOrbs.push(classInfo.Data_ExtraAwakeOrb1, classInfo.Data_ExtraAwakeOrb2)
    return theClass
}

class ClassTreeNode {
    public Pre=null
    public Past=[]
    public First=null
    public Info=null
    public Depth=0
    constructor(cl:any) {
        this.Info=cl
    }
}
type ClassTree = Array<ClassTreeNode> 
function createClassTree(classData):ClassTree{
    let classTree:ClassTree

    classData.forEach(cl => {
        classTree.push(new ClassTreeNode(cl))
    });

    classTree.forEach(c => {
        if (c.Info.JobChange != 0) {
            let child=classTree.find(e => e.Info.Info.ClassID == c.Info.JobChange)
            child.Pre=c
            c.Past.push(child)
        }
        if (c.Info.AwakeType1 != 0) {
            let child=classTree.find(e => e.Info.ClassID == c.Info.AwakeType1)
            child.Pre = c
            c.Past.push(child)
        }
        if (c.Info.AwakeType2 != 0) {
            let child=classTree.find(e => e.Info.ClassID == c.Info.AwakeType2)
            child.Pre = c
            c.Past.push(child)
        }
        if (c.Info.ClassID % 10 == 1) {
            let parent=classTree.find(e => e.Info.ClassID == c.Info.ClassID - 1)
            c.Pre = parent
            parent.Past.push(c)
        }
    })
    classTree.forEach(c => {
        if (c.Pre != null) {
            let k = c
            while (k.Pre != null) {
                k = k.Pre
            }
            c.First = k
        }
        else {
            let depth=0
            c.Depth=depth
            let k=c
            //树的高度搜索
            while(k.Past.length!=0) {
                depth+=1
                k=k.Past
                k.Depth=depth
            }
        }
        
    })
    return classTree
}
function parseUnitData(rawData: RawData,u):Unit {
    let theUnit=new Unit
    theUnit.ID = u.UnitID
    theUnit.Name = rawData.NameText[u.A1 - 1].Message
    theUnit.CardID = u.A1
    let c = classData.find(e => e.ClassID == u.A2)

    theUnit.Class = c.First// 可以不用key
    theUnit.Rare = RareList[Math.min(rawData.UnitsData.Rare, 6)]
    theUnit.Stages = theUnit.Class.Stages.slice(u.A3)
    theUnit.expUp(parseInt(u.A4))
    theUnit.Favor = u.A5
    theUnit.Skill={SkillLevel :u.A6, MaxSkillLevel :rawData.SkillList[rawData.UnitsData.ClassLV1SkillID].LevelMax}

    return theUnit
}
export function parseGameData(rawData: RawData, playerUnitData: Array<Object>, spiritStore: Array<Object>) {



    let parsedGameData = new ParsedGameData
    playerUnitData.forEach(u => {
        if (u.UnitID != 0 && u.A2 > 99) {
            parsedGameData.BarrackInfo.push(new Unit(rawData, u))
        }
        if (u.A2 < 99) {
            if (1 <= u.A2 && u.A2 <= 6 || u.A2 == 12) {
                parsedGameData.ResStore.addRareSpirit(u.A2)
            }
            else if (u.A2 == 17) {
                parsedGameData.ResStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare)
            }
            else if (u.A2 == 32) {
                parsedGameData.ResStore.GlobalExpMult = 1.1
            }
            else {
                parsedGameData.ResStore.addOtherSpirit(u.A2)
            }
        }
    })

    spiritStore.forEach(s => {
        let id = rawData.UnitsData[s.CardID].InitClassID
        if (1 <= id && id <= 6 || id == 12) {
            parsedGameData.ResStore.addRareSpirit(id, s.Count)
        }
        else if (id == 17) {
            parsedGameData.ResStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare, s.Count)
        }
        else if (id == 32) {
            parsedGameData.ResStore.GlobalExpMult = 1.1
        }
        else {
            parsedGameData.ResStore.addOtherSpirit(id, s.Count)
        }
    })

    // TO DO 获取金钱、魔水、宝珠
}