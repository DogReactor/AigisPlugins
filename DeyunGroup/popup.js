const { parseInfos, lotteryMachine } = require('./js/function') 
const fs = require ('fs')
// const remote = require('electron').remote
// remote.getCurrentWebContents().openDevTools()

const hints = ["安娜你算计我！", "人类的赞歌就是德云的赞歌", "安姆安格瑞", "德云是千年的特色，不得不品尝",
"人类总要重复同样的错误", "異議あり!!", "所罗门哟，我又回来了", "我现在内心感到悲痛欲绝",
"意义不明的卡", "出现吧，我的灵魂！", "头脑稍微冷静一下吧", "快住手！这根本不会德云！",
"这虽然是游戏，但可不是闹着玩的", "但是我拒绝！我最喜欢做的一件事，就是对看上去能德云的队伍，说“不”！",
"我考虑了一下还是无法接受啊", "堕落！萌死他卡多", "已经没什么好害怕的了", "不也挺好吗？",
"只要能够德云我随便你搞", "所累哇多卡纳~"]

const configFile='.\\plugins\\DeyunGroup\\config'

var scroll = {
  unitList: [],
  classList: [],
  rareList: ["铁", "铜", "银", "金", "蓝", "白", "黑"],
  stage: ["CC前", "CC后", "第一觉醒", "第二觉醒"],
  location: ["第一兵营", "第二兵营", "第三兵营"]
}


var globalUnitRange = {
  allUnits: [],
  unitsExcluded: [],
  unitsAppointed: []
}

function updateFilters() {
  if (unitFilters.length === 0) {
    unitFilters.push(new Qualification())
  } 
  else {
    unitFilters.forEach(f => {
      f.limitOption.classCheck = scroll.classList.map(c => '随机')
      let checkState = f.unitRange.map(u => {
        return {
          ID: u.ID,
          check: u.cardCheck
        }
      })
      f.updateUnitRange()
      f.unitRange.forEach(u => {
        let state = '随机'
        let ui = checkState.findIndex(e => e.ID === u.ID)
        if (ui != -1) {
          if (checkState[ui].check) {
            state = checkState[ui].check
          }
        }
        u.cardCheck = state
        switch (state) {
          case '必选':
            if (globalUnitRange.unitsAppointed.findIndex(e => e.ID === u.ID) === -1) {
              globalUnitRange.unitsAppointed.push(u)
            }
            break
          case '移除':
            if (globalUnitRange.unitsExcluded.findIndex(e => e.ID === u.ID) === -1) {
              globalUnitRange.unitsExcluded.push(u)
            }
            break
          default:
            break
        }
      })
    })
  }
}
function run(pluginHelper) {
  fs.readFile(configFile, 'utf-8', (err, text) => {
    if(!err){
      rawFilters = JSON.parse(text)
      rawFilters.forEach(f=>{
        let q=new Qualification()
        //q.isChosen=f.isChosen
        q.limitOption=f.limitOption
        q.unitRange=f.unitRange
        unitFilters.push(q)
      })
    }
    
  })
  pluginHelper.sendMessage('Request raw data', (response) => {
    if (response === 'Wait to ready') {} else {
      console.log('Received data')
      let [m, n] = parseInfos(response)
      scroll.unitList = m
      globalUnitRange.allUnits = m
      scroll.classList = n
      updateFilters()
      
      //[scroll.unitList, scroll.classList]=parseInfos(response)
    }
  })

  pluginHelper.onMessage(data => {
    console.log('Received data')
    let [m, n] = parseInfos(data)
    scroll.unitList = m
    scroll.classList = n
    globalUnitRange.allUnits = m
    updateFilters()
  })
}






class Qualification {

  constructor() {
    this.isChosen = false
    this.limitOption = {
      isGlobal: true,
      ruleName: "王国招募书",
      num: {
        top: 15,
        lowest: 15
      },
      rare: ["金", "蓝", "白", "黑"],
      level: {
        top: 99,
        lowest: 1
      },
      location: ["第一兵营"],
      stage: ["CC后", "第一觉醒", "第二觉醒"],
      locked: true,
      classCheck: [],
      classExcluded: [],
      classAppointed: []
    }
    this.limitOption.classCheck = scroll.classList.map(c => '随机')
    this.updateUnitRange()
  }
  unitPassFilter(u) {
    if (this.limitOption.rare.includes(u.Rare) &&
      this.limitOption.stage.includes(u.Stage) &&
      this.limitOption.location.includes(u.Location) &&
      this.limitOption.level.top >= u.Lv && this.limitOption.level.lowest <= u.Lv &&
      this.limitOption.locked === u.Locked &&
      !this.limitOption.classExcluded.includes(u.Class)) {
      return true
    } else {
      return false
    }
  }
  updateUnitRange() {
    this.unitRange = scroll.unitList.filter(u => this.unitPassFilter(u))
  }
}

var unitFilters = new Array()





var app = new Vue({
  el: '#app',
  data() {
    var ValidateNum = (rule, value, callback) => {
      if (value.lowest > 15 || value.lowest < 0 || value.top > 15 || value.top < 0) {
        callback(new Error('人数上下限应在0~15之间'))
      } else if (value.lowest > value.top) {
        callback(new Error('人数上限应不小于人数下限'))
      } else {
        callback()
      }
    }
    var ValidateLevel = (rule, value, callback) => {
      if (value.lowest > 99 || value.lowest < 1 || value.top > 99 || value.top < 1) {
        callback(new Error('等级上下限应在1~99之间'))
      } else if (value.lowest > value.top) {
        callback(new Error('等级上限应不小于等级下限'))
      } else {
        callback()
      }
    }
    return {
      helpVisible: false,
      fullscreenLoading: true,
      drawButton: "抽 选",
      hasteam: false,
      hasErr: false,
      errAbstract: '',
      errInfo: '',
      scroll,
      unitFilters,
      filterIndex: 0,
      team: [],
      unitCheckList: [],
      unitCheckState: [],
      classCheckState: [],
      unitSortState:[],
      classSortState:[],
      limitFormVisible: false,
      cardsFormVisible: false,
      classFormVisible: false,
      limitFormId: 0,
      limitForm: {
        isGlobal: false,
        ruleName: "王国招募书",
        num: {
          top: 15,
          lowest: 15
        },
        rare: ["金", "蓝", "白", "黑"],
        level: {
          top: 99,
          lowest: 1
        },
        location: ["第一兵营"],
        stage: ["CC后", "第一觉醒", "第二觉醒"],
        locked: true,
        class: []
      },
      limitFormRules: {
        ruleName: [{
          required: true,
          message: '请输入规则名称',
          trigger: 'blur'
        }],
        num: [{
          validator: ValidateNum,
          trigger: 'blur'
        }],
        level: [{
          validator: ValidateLevel,
          trigger: 'blur'
        }],
        rare: [{
          type: 'array',
          required: true,
          message: '请至少选中一个稀有度',
          trigger: 'blur'
        }],
        location: [{
          type: 'array',
          required: true,
          message: '请至少选中一个兵营位置',
          trigger: 'blur'
        }],
        stage: [{
          type: 'array',
          required: true,
          message: '请至少选中一个育成阶段',
          trigger: 'blur'
        }]
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
      this.limitFormId = index
      this.limitFormVisible = true
    },
    copyLimit(index, table) {
      table.push(table[index])
    },

    cardChangeCheck(sortedIndex, table, change) {
      let index = table.findIndex(e=>e.ID===this.unitSortState[sortedIndex].ID)
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
          let i = globalUnitRange[state].findIndex(e => e.Name === table[index].Name)
          if (i > -1) {
            globalUnitRange[state].splice(i, 1)
          }
        }
        switch (change) {
          case '必选':
            if (globalUnitRange.unitsAppointed.findIndex(e => e.ID === table[index].ID) === -1) {
              globalUnitRange.unitsAppointed.push(table[index])
            }
            break
          case '移除':
            if (globalUnitRange.unitsExcluded.findIndex(e => e.ID === table[index].ID) === -1) {
              globalUnitRange.unitsExcluded.push(table[index])
            }
            break
          default:
            break
        }
        table[index].cardCheck=change
        Vue.set(this.unitCheckState,sortedIndex,change)
      }
    },
    resetCardOrder({ column, prop, order }){
      this.unitSortState=this.unitCheckList.map(e=>{return {ID:e.ID,Name:e.Name,Class:e.Class,Lv:e.Lv,Rare:e.Rare,cardCheck:e.cardCheck}})
      let generalSortMethod = (a,b)=>{
        if (a[prop] < b[prop] || (a[prop]==b[prop]&&a.ID<b.ID)) {
          return -1
        }
        if (a[prop] > b[prop] || (a[prop]==b[prop]&&a.ID>b.ID)) {
          return 1
        }
        return 0
      }
      if(prop==='Rare') {
        this.unitSortState.sort(this.rareSortMethod);
      }
      else {
        this.unitSortState.sort(generalSortMethod)
      }
      if(order==='descending') {
        this.unitSortState.reverse();
      }
      else if(order===null) {
        this.unitSortState=this.unitCheckList
      }
      this.unitSortState.forEach((u,i)=>{
        Vue.set(this.unitCheckState,i,u.cardCheck)
      })
    
    },
    resetClassOrder({ column, prop, order }) {
      if(this.classSortState.length===0) {
        this.classSortState=scroll.classList.map((e,i)=>{return { ID:e.ID,Name:e.Name,AttackMode:e.AttackMode}})
        this.classCheckState.forEach((s,i)=>this.classSortState[i].classCheck=s)
      }
      
      let generalSortMethod = (a,b)=>{
        if (a[prop] < b[prop] || (a[prop]==b[prop]&&a.ID<b.ID)) {
          return -1
        }
        if (a[prop] > b[prop] || (a[prop]==b[prop]&&a.ID>b.ID)) {
          return 1
        }
        return 0
      }

      if(order==='descending') {
        this.classSortState.sort(generalSortMethod).reverse();
      }
      else if(order==='ascending') {
        this.classSortState.sort(generalSortMethod)
      }
      this.classSortState.forEach((u,i)=>{
        Vue.set(this.classCheckState, i, u.classCheck)
      })
    },
    classChangeCheck(sortedindex, change) {
      let index = scroll.classList.findIndex(c=>c.ID===this.classSortState[sortedindex].ID)
      if (change != this.classCheckState[sortedindex]) {
        let state = 'default'
        switch (this.classCheckState[sortedindex]) {
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
          let i = unitFilters[this.filterIndex]['limitOption'][state].findIndex(e => e.Name === scroll.classList[index].Name)
          if (i > -1) {
            unitFilters[this.filterIndex]['limitOption'][state].splice(i, 1)
          }
        }

        switch (change) {
          case '必选':
            unitFilters[this.filterIndex].limitOption.classAppointed.push(scroll.classList[index])
            break
          case '移除':
            unitFilters[this.filterIndex].limitOption.classExcluded.push(scroll.classList[index])
            break
          default:
            break
        }
        Vue.set(this.classCheckState, sortedindex, change)
        if(this.classSortState.length>0) {
          this.classSortState[sortedindex].classCheck=change
        }
        unitFilters[this.filterIndex].updateUnitRange()
        return
      }
    },
    clearTable(table) {
      table.splice(0)
    },
    setUnitRange(index, unitFilters) {
      this.unitCheckList = unitFilters[index].unitRange
      if (!Object.keys(this.unitCheckList[0]).includes('cardCheck')) {
        this.unitCheckList.forEach(u => {
          u.cardCheck = '随机'
        })
      }
      this.unitCheckState = this.unitCheckList.map(x => x.cardCheck)
      this.cardsFormVisible = true
    },
    setClassRange(index, unitFilters) {
      this.filterIndex = index
      this.classCheckState = unitFilters[index].limitOption.classCheck
      this.classFormVisible = true
    },
    newLimitForm() {
      var newLimit = new Qualification()
      newLimit.limitOption.classCheck = scroll.classList.slice(0)
      newLimit.updateUnitRange()
      this.limitFormId = unitFilters.length
      unitFilters.push(newLimit)
      this.limitForm = unitFilters[this.limitFormId].limitOption
      this.limitFormVisible = true
    },
    submitLimitForm(form) {
      this.$refs["limitForm"].validate(valid => {
        if (valid) {
          unitFilters[this.limitFormId].limitOption = form
          unitFilters[this.limitFormId].updateUnitRange(form)
          this.limitFormVisible = false
        } else {
          return false
        }
      })
    },
    rareSortMethod(a, b) {
      let [i1, i2] = [scroll.rareList.findIndex(e => e === a.Rare), scroll.rareList.findIndex(e => e === b.Rare)]
      if (i1 < i2 || (i1==i2&&a.ID<b.ID)) {
        return -1
      }
      if (i1 > i2 || (i1==i2&&a.ID>b.ID)) {
        return 1
      }
      return 0
    },
    handleSelectAll(filters) {
      if(filters.length===0){
        filters.forEach(f => f.isChosen = false)
      }
      else {
        filters.forEach(f => f.isChosen = true)
      }
    },
    toggleFilterSelect(selected,row){
      row.isChosen=!row.isChosen
    },
    storeConfig() {
      fs.writeFile(configFile, JSON.stringify(unitFilters), err => {})
    },
    generateTeam(table) {
      actFilters = unitFilters.filter(f => f.isChosen)
      if (actFilters.length < 1) {
        this.errAbstract = '请至少勾选一个条件'
        this.hasErr = true
        return 
      }

      lotteryMachine(actFilters, globalUnitRange, (team, exceedNum, err) => {
        this.team = team
        this.errInfo = ''
        exceedNum.forEach((e, i) => {
          if (e > 0) {
            this.errInfo += '条件 {' + i + '}: 超出上限 ' + e + ' 个  |  '
          }
          if (e < 0) {
            this.errInfo += '条件 {' + i + '}: 低于下限 ' + Math.abs(e) + ' 个  |  '
          }
        })
        switch (err) {
          case 'not possible':
            this.errAbstract = '板凳深度不能找出满足要求的队伍：'
            this.hasErr = true
            break
          case 'failed partial limits':
            this.errAbstract = '满足局部条件失败'
            this.hasErr = true
            this.hasteam = true
            break
          case 'Ok':
            this.hasErr = false
            this.hasteam = true
            break
        }
      })
      if (this.hasteam) {
        this.drawButton = hints[Math.floor(Math.random() * Math.floor(hints.length))]
      }

    }
  }
})


module.exports = {
  run:run
}