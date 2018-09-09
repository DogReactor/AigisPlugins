const { parseInfos} = require('./js/function') 
const remote = require('electron').remote
remote.getCurrentWebContents().openDevTools()

const hints = ["安娜你算计我！", "人类的赞歌就是德云的赞歌", "安姆安格瑞", "德云是千年的特色，不得不品尝",
"人类总要重复同样的错误", "異議あり!!", "所罗门哟，我又回来了", "我现在内心感到悲痛欲绝",
"意义不明的卡", "出现吧，我的灵魂！", "头脑稍微冷静一下吧", "快住手！这根本不会德云！",
"这虽然是游戏，但可不是闹着玩的", "但是我拒绝！我最喜欢做的一件事，就是对看上去能德云的队伍，说“不”！",
"我考虑了一下还是无法接受啊", "堕落！萌死他卡多", "已经没什么好害怕的了", "不也挺好吗？",
"只要能够德云我随便你搞", "所累哇多卡纳~"]


var scroll = {
  unitList: [],
  classList: [],
  rareList: ["铁", "铜", "银", "金", "蓝", "白", "黑"],
  stage: ["CC前", "CC后", "第一觉醒", "第二觉醒"],
  location: ["第一兵营", "第二兵营", "第三兵营"]
}


function run(pluginHelper) {
    pluginHelper.sendMessage('Request raw data', (response) => {
      if(response==='Wait to ready'){}
      else {
        console.log('Received data')
        let [m,n]=parseInfos(response)
        scroll.unitList = m
        scroll.classList = n
        //[scroll.unitList, scroll.classList]=parseInfos(response)
      }
    })
    //pluginHelper.onMessage(data)
}




class Qualification {

  constructor(){
    this.limitOption={
      isGlobal: true,
      ruleName: "王国招募书",
      num: { top: 15, lowest: 15 },
      rare: ["金", "蓝", "白", "黑"],
      level: { top: 99, lowest: 1 },
      location: ["第一兵营"],
      stage: ["CC后", "第一觉醒", "第二觉醒"],
      locked: true,
      classRange: [],
      classExcluded: [],
      classAppointed:[],
    }
    this.unitRange= []

  }
  initUnitRange (limits) {
    this.unitRange = scroll.unitList.filter(u => {
      if (limits.rare.includes(u.Rare) &&
          limits.stage.includes(u.Stage) &&
          limits.location.includes(u.Location) &&
          limits.level.top >= u.Lv && limits.level.lowest <= u.Lv &&
          limits.locked === u.Locked &&
          limits.classRange.includes(u.Class)) {
        return true
      } else {
        return false
      }
    })
  }
}

var globalUnitRange = {
  unitsExcluded:[],
  unitsAppointed:[]
}

var unitFilters = new Array()
// for(let i=0;i<5;++i)
// {
//   let f=new Object()
//   f.__proto__=Qualification
//   unitFilters.push(f)
// }




var app = new Vue({
  el: '#app',
  data() {
    var ValidateNum = (rule, value, callback) => {
      if (value.lowest > 15 || value.lowest < 0 || value.top > 15 || value.top < 0) {
        callback(new Error('人数上下限应在0~15之间'))
      } else if (value.lowest > value.top) {
        callback(new Error('人数上限应不小于人数下限'))
      }
      else {
        callback()
      }
    }
    var ValidateLevel = (rule, value, callback) => {
      if (value.lowest > 99 || value.lowest < 1 || value.top > 99 || value.top < 1) {
        callback(new Error('等级上下限应在1~99之间'))
      } else if (value.lowest > value.top) {
        callback(new Error('等级上限应不小于等级下限'))
      }
      else {
        callback()
      }
    }
    return {
      fullscreenLoading: true,
      drawButton: "抽 选",
      hasteam: false,
      scroll,
      unitFilters,
      team: [],
      unitCheckList: [],
      classCheckList: [],
      limitFormVisible: false,
      cardsFormVisible: false,
      classFormVisible: false,
      limitFormId:0,
      limitForm: {
        isGlobal: false,
        ruleName: "王国招募书",
        num: { top: 15, lowest: 15 },
        rare: ["金", "蓝", "白", "黑"],
        level: { top: 99, lowest: 1 },
        location: ["第一兵营"],
        stage: ["CC后", "第一觉醒", "第二觉醒"],
        locked: true,
        class: []
      },
      limitFormRules: {
        ruleName: [
          { required: true, message: '请输入规则名称', trigger: 'blur' }
        ],
        num: [
          { validator: ValidateNum, trigger: 'blur' }
        ],
        level: [
          { validator: ValidateLevel, trigger: 'blur' }
        ],
        rare: [
          { type: 'array', required: true, message: '请至少选中一个稀有度', trigger: 'blur' }
        ],
        location: [
          { type: 'array', required: true, message: '请至少选中一个兵营位置', trigger: 'blur' }
        ],
        stage: [
          { type: 'array', required: true, message: '请至少选中一个育成阶段', trigger: 'blur' }
        ]
      },
    }
  },
  methods: {
    toggleAsGlobal(index, unitFilters) {
      unitFilters[index].limitOption.isGlobal = !unitFilters[index].limitOption.isGlobal
    },
    deleteLimit(index, table) {
      table.splice(index, 1)
    },
    editLimit(index, table) {
      this.limitForm = table[index].limitOption
      this.limitFormId=index
      this.limitFormVisible = true
    },
    copyLimit(index, table) {
      table.push(table[index])
    },

    cardChangeCheck(index, table, change) {
      if (change != table[index].cardCheck) {
        let state = 'default'
        switch (table[index].cardCheck) {
          case '必选':
            state = 'unitsAppointed'
            break
          case '移除':
            state = 'unitsExcluded'
            break
          default:
            break
        }
        if (state != 'default') {
          let i = globalUnitRange[state].findIndex(e => e.Name === cl.Name)
          if (i > -1) {
            globalUnitRange[state].splice(i, 1)
          }
        }
        switch (change) {
          case '必选':
            globalUnitRange.unitsAppointed.push(table[index])
            break
          case '移除':
            globalUnitRange.unitsExcluded.push(table[index])
            break
          default:
            break
        }
      }
    },
    classChangeCheck(index, table, change) {
      if (change != table[index].classCheck) {
        let limitI = table[index].limitIndex
        let state = 'default'
        switch (table[index].classCheck) {
          case '必选':
            state = 'classAppointed'
            break
          case '移除':
            state = 'classExcluded'
            break
          default:
            break
        }
        if (state != 'default') {
          let i = unitFilters[limitI][state].findIndex(e => e.Name === cl.Name)
          if (i > -1) {
            unitFilters[limitI][state].splice(i, 1)
          }
        }

        switch (change) {
          case '必选':
            unitFilters[limitI].classAppointed.push(table[index])
            break
          case '移除':
            unitFilters[limitI].classExcluded.push(table[index])
            break
          default:
            break
        }
      }
    },
    clearTable(table) {
      table.splice(0, table.length)
    },
    setUnitRange(index, unitFilters) {
      this.unitCheckList = unitFilters[index].unitRange
      this.unitCheckList.forEach(u => { u.cardCheck = '默认' })
      this.cardsFormVisible = true
    },
    setClassRange(index, unitFilters) {
      this.classCheckList=unitFilters[index].limitOption.classRange
      this.classCheckList.forEach(u => {
        u.classCheck = '默认'
        u.limitIndex = index
      })
      this.classFormVisible = true
    },
    newLimitForm() {
      var newLimit=new Qualification()
      newLimit.limitOption.classRange = scroll.classList.slice(0,scroll.classList.length)
      newLimit.initUnitRange(newLimit.limitOption)
      this.limitFormId=unitFilters.length
      unitFilters.push(newLimit)
      this.limitForm = unitFilters[this.limitFormId].limitOption
      this.limitFormVisible = true
    },
    submitLimitForm(form) {
      this.$refs["limitForm"].validate(valid => {
        if (valid) {
          unitFilters[this.limitFormId].limitOption = form
          unitFilters[this.limitFormId].initUnitRange(form)
          this.limitFormVisible = false
        } else {
          return false
        }
      })
    },

    generateTeam(table) {
      if (unitFilters.length < 1) {
        return false
      }

      //对全局限制的池子求交集
      var pool = new Set(unitFilters[0].unitRange)
      for (let p = 0; p < unitFilters.length; ++p) {
        if (unitFilters[p].limitOption.isGlobal) {
          let a = new Set(unitFilters[p].unitRange)
          let b = pool
          pool = new Set([...a].filter(e => b.has(e)))
        }
      }
      var globalMin = 0
      var globalMax = 15
      unitFilters.forEach(l => {
        globalMax = Math.min(globalMax, parseInt(l.limitOption.num.top))
        globalMin = Math.max(globalMin, parseInt(l.limitOption.num.lowest))
      })
      // //将非全局限制的池子约束为全局池子的子集
      // for (let p in unitFilters) {
      //   let subGroup=new Set()
      //   for (let u in p.unitRange) {
      //     if (pool.has(u)) {
      //       subGroup.add(u)
      //     }
      //   }
      //   p.unitRange=Array.from(subGroup)
      // }

      var exclude = new Set(globalUnitRange.unitsExcluded)
      var appointed = new Set(globalUnitRange.unitsAppointed)
      pool = new Set([...pool].filter(e => !exclude.has(e)))
      pool = new Set([...pool].filter(e => !appointed.has(e)))
      pool = Array.from(pool)
      //随机重排备选池
      for (let i = pool.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1))
        [pool[i], pool[j]] = [pool[j], pool[i]]
      }
      var candidates = new Array()
      candidates = candidates.concat(globalUnitRange.unitsAppointed)

      var theNum = globalMin + Math.floor(Math.random() * (globalMax - globalMin))

      let iter = 0
      while (candidates.length < theNum && iter < pool.length) {
        candidates.push(pool[iter])
        ++iter
      }

      this.team = candidates
      this.hasteam = true


      this.drawButton = hints[Math.floor(Math.random() * Math.floor(hints.length))]
    }
  }
})

module.exports = {
  run:run
}