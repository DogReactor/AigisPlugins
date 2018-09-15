const remote = require('electron').remote
remote.getCurrentWebContents().openDevTools()
const { stageInfos } = require('./js/scheme.js')
const { parseInfos } = require('./js/parser') 
const { formulatePlan } = require('./js/adviser.js')
const fs = require ('fs')
const path = require ('path')


const rareName=["铁", "铜", "银", "金", "蓝", "白", "黑"]
const stageName= ["CC前", "CC后", "第一觉醒", "第二觉醒"]
const locationName = ["第一兵营", "第二兵营", "第三兵营"]

var configFile=''

var scroll = {
  unitList:[],
  classList:[],
  GlobalExpMult:1
}



function run(pluginHelper) {
  configFile = path.join(pluginHelper.plugin.realPath, 'config.json')

  pluginHelper.sendMessage('Request raw data', (response) => {
    if (response === 'Wait to ready') {} else {
      console.log('Received data')
      console.log(response)
      parseInfos(response).then(result=>{
        scroll=result
        app.classList=scroll.classList
        filters.classRange = scroll.classList.map(x=>x.Name)
        app.unitList= scroll.unitList.filter(u=>filters.passFilter(u))
      })

      app.fullscreenLoading=false
      
    }
  })

  pluginHelper.onMessage(response => {
    console.log('Received data')
    parseInfos(response).then(result=>{
      scroll=result
      filters.classRange = scroll.classList.map(x=>x.Name)
      app.unitList= scroll.unitList.filter(u=>filters.passFilter(u))
      app.classList=scroll.classList
    })

    app.fullscreenLoading=false
  })
}

var filters = {
  rare:["金", "蓝", "白", "黑"],
  stage:["CC前", "CC后", "第一觉醒"],
  location: ["第一兵营"],
  classRange:[],
  passFilter(u) {
    let pass = true
    pass = pass && this.rare.includes(u.Rare.Name)
    pass = pass && this.stage.includes(u.Stage)
    pass = pass && this.location.includes(u.Location)
    pass = pass && this.classRange.includes(u.Class.Name)
    return pass
  }
}

class UnitCheckForm {
  constructor(u) {

    this.Unit = u
    this.SkillEvoAvaliable = true
    this.SkillEvoText = '技能觉醒'
    if (u.Skill.ID===u.Skill.Evo[2]) {
      this.SkillEvoText = '回退技觉'
    }
    else if(u.Skill.Evo[2]===0){
      this.SkillEvoAvaliable = false
    }
    this.InitSkillLv=u.Skill.Level
    this.MaxSkillLv= u.Skill.MaxLv[1]
    
    this.StageAvaliable = stageName.slice(u.EvoNum,u.MaxGrowth + 1)
    this.UseSmallSpirits = false
    this.UseMaidSpirits = false
    this.UseBlackBucket = false
    this.UseBlessing = false
    this.ToggleSkillEvo = false
    this.TargetSkillLv = u.Skill.Level
    this.TargetPro = {Lv:stageInfos[u.EvoNum].MaxLevel[u.Rare.ID], Stage:u.Stage}
    this.InitCost = u.Cost
    this.MaxReduceCost=u.RemainCost
    this.TargetCost = u.Cost
    this.BucketPackCost = [1, 3]
    this.GlobalExpMult = scroll.GlobalExpMult
  }
}
var app = new Vue({
  el: '#app',
  data() {
 
    return {
      fullscreenLoading: false,
      helpVisible:false,
      classFormVisible:false,
      trainFormVisible:false,
      unitList:[],
      classList:scroll.classList,
      filters:filters,
      rareName:rareName,
      stageName:stageName,
      locationName:locationName,
      unitCheckForm:{
        TargetPro: {Lv:1, Stage:'CC前'}
      },
      expResource:['小祝福','']
    }
  },
  methods: {
    storeConfig() {
      console.log(configFile)
      fs.writeFile(configFile, JSON.stringify('Plan'), { flag: 'w', encoding: 'utf-8' }, err => {
        if (err) {
          this.$notify.error({
            title: '保存配置失败',
            message: err
          })
        } else {
          this.$notify({
            title: '保存配置成功',
            type: 'success'
          });
        }
      })
    },

    filterChange() {
      this.unitList=scroll.unitList.filter(u=>filters.passFilter(u))
    },

    addToPlan(unit) {
      this.unitCheckForm = new UnitCheckForm(unit)
      this.trainFormVisible = true
    },

    submitCheckForm() {

    }

  }
})


module.exports = {
  run:run
}