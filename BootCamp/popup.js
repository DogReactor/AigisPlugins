// const remote = require('electron').remote
// remote.getCurrentWebContents().openDevTools()
const { stageInfos } = require('./js/scheme.js')
const { parseInfos } = require('./js/parser') 
const { formulatePlan, generateCountDesc } = require('./js/adviser.js')
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


var mailBox = null
function run(pluginHelper) {
  configFile = path.join(pluginHelper.plugin.realPath, 'config.json')
  let storedForm = []
  if(fs.existsSync(configFile))
  {
    storedForm=JSON.parse(fs.readFileSync(configFile))
  }
  mailBox = pluginHelper
  pluginHelper.sendMessage('Request raw data', (response) => {
    if (response === 'Wait to ready') {} else {
      console.log('Received data')
      console.log(response)
      parseInfos(response).then(result=>{
        scroll=result
        filters.classRange = scroll.classList.map(x=>x.Name)
        app.unitList= scroll.unitList.filter(u=>filters.passFilter(u))
        app.classList=scroll.classList
        storedForm.forEach(f=>{
          f.Unit = scroll.unitList.find(u=>u.UnitID===f.Unit.UnitID)
          app.submitCheckForm(f)
        })
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
    this.UnitName = u.Name
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
    this.Luck = 50
    this.ExpSpirit = true
    this.GlobalExpMult = 1
    this.IsExpUp = true
    this.IsSkillUp = false
    this.IsCostDown = false
  }
}

var app = new Vue({
  el: '#app',
  data() {
 
    return {
      fullscreenLoading: true,
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
      trainForm:[],
      activeNames:[],
      countDesc:''
    }
  },
  methods: {
    storeConfig() {
      console.log(configFile)
      let chkForms = this.trainForm.map(p=>p.CheckForm)
      fs.writeFile(configFile, JSON.stringify(chkForms), { flag: 'w', encoding: 'utf-8' }, err => {
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

    clearConfig() {
      this.trainForm.splice(0)
      if(fs.existsSync(configFile)){
        fs.unlink(configFile,(err)=>{
          if (err) {
            this.$notify.error({
              title: '清空保存的配置失败',
              message: err
            })
          } else {
            this.$notify({
              title: '清空保存的配置成功',
              type: 'success'
            });
          }
        })
      }
    },

    filterChange() {
      this.unitList=scroll.unitList.filter(u=>filters.passFilter(u))
    },

    addToPlan(unit) {
      this.unitCheckForm = new UnitCheckForm(unit)
      this.trainFormVisible = true
    },

    submitCheckForm(form) {
      if(form.Unit.IsOverLv||
          (form.StageAvaliable[0]===form.TargetPro.Stage&&form.TargetPro.Lv<=form.Unit.Lv)) {
          form.IsExpUp=false
        }
      
      if(form.TargetSkillLv>form.Unit.Skill.Level||form.ToggleSkillEvo) {
        form.IsSkillUp = true
      }

      if(form.TargetCost<form.Unit.Cost) {
        form.IsCostDown = true
      }

      if(form.IsExpUp||form.IsSkillUp||form.IsCostDown) {
        let i = this.trainForm.findIndex(f=>f.Unit.UnitID===form.Unit.UnitID)
        if(i!=-1) {
          this.deletePlan(i)
        }
        this.trainForm.push(formulatePlan(form))
        this.countDesc=generateCountDesc(this.trainForm)
        this.activeNames.push(form.Unit.Name)
        this.trainFormVisible = false
      }
      else {
        this.$message({
          message: form.Unit.Name + '没有育成的必要！',
          type: 'warning'
        });
      }
    },

    deletePlan(index){
      let i = this.activeNames.findIndex(n=>n===this.trainForm[index].UnitName)
      this.activeNames.splice(i,1)
      this.trainForm.splice(index,1)
      this.countDesc=generateCountDesc(this.trainForm)
      
    },
    editPlan(index){
      this.unitCheckForm = this.trainForm[index].CheckForm
      this.trainFormVisible = true
    }

  }
})


module.exports = {
  run:run
}