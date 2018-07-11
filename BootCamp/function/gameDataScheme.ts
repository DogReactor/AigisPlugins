import { RareList, StageList, RareStage, GrowthStage, Unit, ResourceStore, Profession } from './gameData.service'




export class RawData {
    public NameText: Array<Object>
    public UnitsData: Array<Object>
    public ClassData: Array<Object>
    public SkillList: Array<Object>
    public PlayerInfo : Object
    public Orbs: []
    constructor(dataRepo) {
        this.NameText=dataRepo.NameText
        this.UnitsData=dataRepo.UnitsData
        this.ClassData=dataRepo.ClassData
        this.SkillList=dataRepo.SkillList
        this.PlayerInfo=dataRepo.PlayerInfo
        this.Orbs=dataRepo.Orbs
    }
}



export class ParsedGameData {
    public BarrackInfo: Array<Unit>
    public ResStore: ResourceStore

}

class ClassTreeNode {
    public Pre = null
    public Past = [null, null]
    public Info = null

    // Info和Classkeys只对根节点有意义，分别存储树的高度和这棵树上所有职业的ID
    public Height = 99
    public ClassKeys = []

    constructor(cl: any) {
        this.Info = cl
    }
}

// 解析一个职业，输入为该职业的根节点
function parseClassData(classInfo: ClassTreeNode): Profession {
    let theClass = new Profession
    theClass.Name = classInfo.Info.Name
    switch (classInfo.Info.MaxLevel) {
        // 根职业最大等级为50，则有CC，最终职阶为职业树高度
        case '50': theClass.Stages = StageList.slice(0, classInfo.Height); break
        // 根职业最大等级为80，为特殊觉醒，最终职阶为职业树高度+1
        case '80': theClass.Stages = StageList.slice(1, classInfo.Height + 1); break
        // 跟职业最大等级为99，为王子和皇帝（token和圣灵等不计），视为已CC
        case '99': theClass.Stages = StageList.slice(1, 2); break
        default: break
    }
    theClass.AWOrbs.push(classInfo.Info.Data_ExtraAwakeOrb1, classInfo.Info.Data_ExtraAwakeOrb2)
    theClass.ClassKeys = classInfo.ClassKeys
    return theClass
}


type ClassForest = Array<ClassTreeNode>
function createClassTree(classData): ClassForest {
    let classForest: ClassForest

    classData.forEach(cl => {
        classForest.push(new ClassTreeNode(cl))
    });

    // 建立树上各节点间的关系
    classForest.forEach(c => {
        // CC、觉醒、二觉一分支阶段置于本节点左子节点
        if (c.Info.JobChange != 0) {
            let child = classForest.find(e => e.Info.Info.ClassID == c.Info.JobChange)
            child.Pre = c
            c.Past[0] = child
        }
        if (c.Info.AwakeType1 != 0) {
            let child = classForest.find(e => e.Info.ClassID == c.Info.AwakeType1)
            child.Pre = c
            c.Past[0] = child
        }
        // 二觉二分支和铜铁职阶置于本节点右子节点，这样树上的所有右子节点均为叶节点
        if (c.Info.AwakeType2 != 0) {
            let child = classForest.find(e => e.Info.ClassID == c.Info.AwakeType2)
            child.Pre = c
            c.Past[1] = child
        }
        if (c.Info.ClassID % 10 == 1) {
            let parent = classForest.find(e => e.Info.ClassID == c.Info.ClassID - 1)
            c.Pre = parent
            parent.Past[1] = c
        }
    })

    // 在每棵职业树的根节点存储本节点所有职业ID，并计算职业树高度
    classForest.forEach(c => {
        if (c.Pre == null) {
            let k = c
            let height = 0
            // 非递归地遍历职业树
            let stack = []
            while (k != null || stack.length != 0) {
                while (k != null) {
                    c.ClassKeys.push(k.Info.ClassID)
                    height += 1
                    stack.push(k)
                    k = k.Past[0]
                }
                // 第一轮遍历左子节点后即已得到该职业树高度，因此高度仅更新一次
                c.Height = Math.min(height, c.Height)
                if (stack != [0]) {
                    k = stack.pop()
                    k = k.Past[1]
                }
            }
        }

    })
    // 数组中只保留根节点
    let classTree = classForest.filter(c => c.Pre == null)
    return classTree
}
function parseUnitData(rawData: RawData, u, classData): Unit {
    let theUnit = new Unit
    theUnit.ID = u.UnitID
    theUnit.Name = rawData.NameText[u.A1 - 1].Message
    theUnit.CardID = u.A1

    theUnit.Class = classData.find(e => e.ClassKeys.findIndex(u.A2) != -1)
    theUnit.Rare.ID=Math.min(rawData.UnitsData.Rare, 6)
    theUnit.Rare = RareList[theUnit.Rare.ID]
    
    theUnit.Stages = theUnit.Class.Stages.slice(u.A3, theUnit.Rare.MaxGrowth + 1)
    theUnit.setExp(parseInt(u.A4))
    theUnit.Favor = u.A5
    theUnit.Skill = { SkillLevel: u.A6, MaxSkillLevel: rawData.SkillList[rawData.UnitsData.ClassLV1SkillID].LevelMax }

    return theUnit
}

function parseOrbs(Orbs) {
   const  orbsIndex=[
    23,52,54,73,77,
    2,5,22,25,76,
    0,3,56,59,72,
    1,7,27,30,58,
    21,26,28,53,55,
    33,35,36,78,85,
    29,37,84,86,87]
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    let orbsStore=[]
    Orbs.forEach(e => {
        for(let i=0;i<4;++i) {
            let n=e&0xFF
            e=e>>8
            orbsStore.push(n)
        }
    });
    let orbsNum=[]
    orbsIndex.forEach(i=>{
        orbsNum.push(orbsStore[i])
    })

    return orbsNum
}
export async function parseGameData(rawData: RawData, playerUnitData: Array<Object>) {

    await new Promise(resolve=>{
        if(rawData.NameText.length*rawData.ClassData.length*rawData.SkillList.length*rawData.UnitsData.length*playerUnitData.length!=0) {
            return resolve('Ok')
        }
    })
    let classTree = createClassTree(rawData.ClassData)
    let classData = []
    classTree.forEach(c => {
        classData.push(parseClassData(c))
    })


    let parsedGameData = new ParsedGameData
    playerUnitData.forEach(u => {
        if (u.UnitID != 0 && u.A2 > 99) {
            parsedGameData.BarrackInfo.push(parseUnitData(rawData, u, classData))
        }
        // 更新兵营中的圣灵等
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

    // TO DO 获取金钱、魔水、宝珠
    if (rawData.PlayerInfo != undefined) {
        parsedGameData.ResStore.Gold = rawData.PlayerInfo.A1
        parsedGameData.ResStore.MagicCrystal = rawData.PlayerInfo.AE

    }

    if (rawData.Orbs.length > 0) {
        parsedGameData.ResStore.Orb = parseOrbs(rawData.Orbs)
    }

    return parsedGameData
}

export function parseSpiritRepo(rawData:RawData, spiritStore: Array<Object>, resStore:ResourceStore){
        // 更新仓库中的圣灵等， 需要另写一个函数
        spiritStore.forEach(s => {
            let id = rawData.UnitsData[s.CardID].InitClassID
            if (1 <= id && id <= 6 || id == 12) {
                resStore.addRareSpirit(id, s.Count)
            }
            else if (id == 17) {
                resStore.addLittleSpirit(rawData.UnitsData[u.A1].Rare, s.Count)
            }
            else if (id == 32) {
                resStore.GlobalExpMult = 1.1
            }
            else {
                resStore.addOtherSpirit(id, s.Count)
            }
        })

        return resStore
}