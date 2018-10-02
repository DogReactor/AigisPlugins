const items = [
    1001,
    1002,
    1003,
    1004,
    1005,
    1006,
    1007,
    1008,
    133,
    136,
    2001,
    2002,
    2003,
    2004,
    234,
    250,
    270,
    290,
    3001,
    3002,
    3003,
    303,
    320,
    333,
    334,
    335,
    383,
    384,
    397,
    4001,
    4002,
    4003,
    4004,
    4005,
    4006,
    4007,
    4008,
    4009,
    4010,
    4011,
    4012,
    4013,
    4014,
    4015,
    4016,
    4017,
    4018,
    4019,
    4020,
    4021,
    4022,
    4023,
    4024,
    4025,
    4026,
    4027,
    4028,
    4029,
    4030,
    4031,
    4032,
    4033,
    4034,
    4035,
    433,
    459,
    491,
    5001,
    5002,
    5003,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    77
]

class Hunter {
    constructor(prob, target) {
        this.ProbMod = prob
        this.PreyFlag = target
    }
}
var treasureHunter = {
    referenceData: {
        UnitsList: null,
        BarrackInfo: null,
        ClassInfo: null,
        AbilityConfig: null,
        AbilityList: null
    },
    registered:false,
    Hunter: {
        57: new Hunter(0, (obj) => obj >= 1001 && obj <= 1004),
        58: new Hunter(0, (obj) => obj >= 1005 && obj <= 1008),
        59: new Hunter(0, (obj) => obj >= 2001 && obj <= 2010),
        60: new Hunter(0, (obj) => obj == 77 || obj == 133 || obj == 250 || obj == 320),
        61: new Hunter(0, (obj) => [54, 55, 56, 57, 58, 59, 60, 136, 234, 290, 303, 333, 334, 335, 383, 384, 397, 433, 459, 491].indexOf(obj) != -1),
        79: new Hunter(0, (obj) => this.referenceData.UnitsList.Rare[obj - 1] == 2),
        80: new Hunter(0, (obj) => obj >= 1000)
    },
    LoadRawData(label, data) {
        if(label === 'AbilityConfig') {
            let i = 0
            let configId = 0
            this.referenceData.AbilityConfig = []
            data.forEach(c=>{
                if(c._ConfigID!=0){
                    configId = c._ConfigID
                    this.referenceData.AbilityConfig[configId] = []
                }
                this.referenceData.AbilityConfig[configId].push(
                    {
                        _InfluenceType:c._InfluenceType,
                        _Param1:c._Param1
                    }
                )
            })
            console.log(label,this.referenceData.AbilityConfig)
        } else {
            console.log(label, data)
            this.referenceData[label] = data
        }
        if (Object.values(this.referenceData).every(e => e !== null)) {
            this.registerHunter()
        }
    },
    registerHunter() {
        this.referenceData.BarrackInfo.forEach((unit,index) => {
            this.checkIfHunter(unit)
        });
        this.registered = true
    },
    checkIfHunter(unit) {
        let i = unit.A1 - 1
        let AbilityId = this.referenceData.UnitsList.Ability[i]
        let classObj = this.referenceData.ClassInfo.find(cl => cl.ClassID === unit.A2)
        if (classObj.MaxLevel < 99) {
            AbilityId = this.referenceData.UnitsList.Ability_Default[i]
        }
        if (AbilityId < this.referenceData.AbilityList.length) {
            let configId = this.referenceData.AbilityList[AbilityId]._ConfigID
            if(configId!=0){
                this.referenceData.AbilityConfig[configId].forEach(c=>{
                    if (c._InfluenceType!=80&&this.Hunter.hasOwnProperty(c._InfluenceType)) {
                        this.Hunter[c._InfluenceType].ProbMod = Math.max(this.Hunter[c._InfluenceType].ProbMod, c._Param1)
                    }
                })
            } 
        }
    },
    updateHunter(operation, unit){
        switch(operation) {
            case 'unit-evo':
            let member = this.BarrackInfo.find(u=>u.A7===unit.A7)
            member.A2=unit.A2
            this.checkIfHunter(member)
            break
            case 'new-unit':
            this.BarrackInfo.push(unit)
            this.checkIfHunter(unit)
            break
            case 'del-unit':
            break
            default:break
        }
    },
    async ModTeamProb(team) {
        if(team&&this.registered) {
            team.forEach(u=>{
                let teammate = this.referenceData.BarrackInfo.find(e=>e.A7===u.A7)
                let configId = this.referenceData.ClassInfo.find(cl => cl.ClassID === teammate.A2).ClassAbility1
                console.log(configId,teammat)
                if(configId>0&&configId<this.referenceData.AbilityConfig.length) {
                    this.referenceData.AbilityConfig[configId].forEach(c=>{
                        if (this.Hunter.hasOwnProperty(c._InfluenceType)) {
                            this.Hunter[c._InfluenceType].ProbMod = Math.max(this.Hunter[c._InfluenceType].ProbMod, c._Param1)
                        }
                    })
                } 
            })
            return Promise.resolve('Ok')   
        } else {
            return Promise.reject('Haven\'t got team or registered')
        }     
    },
    async RemarkProb(dropInfo) {

    }
}

module.exports = {
    ItemList: new Set(items),
    treasureHunter: treasureHunter
}