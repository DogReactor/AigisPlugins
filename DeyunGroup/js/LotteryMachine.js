
// const remote = require('electron').remote;
// remote.getCurrentWebContents().openDevTools();
function run(pluginHelper) {
  var request = new Object();
  request.sender = 'DeyunGroupWindow';
  request.body = 'Request Data';
  var referID = setInterval(function () {
    pluginHelper.sendMessage(request, (response) => {
      if (response.flag) {
        scroll.unitList = response.body.unitList;
        scroll.classList = response.body.classList;
        if (unitFilters.length == 0) {
          let f = new Object();
          f.__proto__ = Qualification;
          f.initUnitRange(f.limitOption);
          unitFilters.push(f);
          clearInterval(referID);
          app.fullscreenLoading = false;
        }
      }
    });
  }, 1000);
};



var scroll = {
  unitList: [],
  classList: [],
  rareList: ["铁", "铜", "银", "金", "蓝", "白", "黑"],
  stage: ["CC前", "CC后", "第一觉醒", "第二觉醒"],
  location: ["第一兵营", "第二兵营", "第三兵营"]
}

var Qualification = {
  limitOption: {
    isGlobal: true,
    ruleName: "王国招募书",
    num: { top: 15, lowest: 15 },
    rare: ["金", "蓝", "白", "黑"],
    level: { top: 99, lowest: 1 },
    location: ["第一兵营"],
    stage: ["CC后", "第一觉醒", "第二觉醒"],
    locked: true,
    classRange: []
  },
  classExclude: [],
  unitRange: [],
  initUnitRange: function (limits) {
    this.unitRange = scroll.unitList.filter(u => {
      if (limits.rare.includes(u.rare) &&
        limits.stage.includes(u.stage) &&
        limits.location.includes(u.location) &&
        limits.level.top >= u.level && limits.level.lowest <= u.level &&
        limits.locked === u.locked &&
        !limits.classRange.includes(u.class)) {
        return true;
      } else {
        return false;
      }
    });
  }
}
var unitExclude = new Array();
var unitAppointed = new Array();
var unitFilters = new Array();
// for(let i=0;i<5;++i)
// {
//   let f=new Object();
//   f.__proto__=Qualification;
//   unitFilters.push(f);
// }




var app = new Vue({
  el: '#app',
  data() {
    var ValidateNum = (rule, value, callback) => {
      if (value.lowest > 15 || value.lowest < 0 || value.top > 15 || value.top < 0) {
        callback(new Error('人数上下限应在0~15之间'));
      } else if (value.lowest > value.top) {
        callback(new Error('人数上限应不小于人数下限'));
      }
      else {
        callback();
      }
    };
    var ValidateLevel = (rule, value, callback) => {
      if (value.lowest > 99 || value.lowest < 1 || value.top > 99 || value.top < 1) {
        callback(new Error('等级上下限应在1~99之间'));
      } else if (value.lowest > value.top) {
        callback(new Error('等级上限应不小于等级下限'));
      }
      else {
        callback();
      }
    };
    return {
      fullscreenLoading: true,
      drawButton: "抽 选",
      hasteam: false,
      scroll,
      unitFilters,
      team: [],
      unitCheckList: [],
      limitFormVisible: false,
      cardsFormVisible: false,
      classLimitVisible: false,
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
      unitFilters[index].limitOption.isGlobal = !unitFilters[index].limitOption.isGlobal;
    },
    deleteLimit(index, table) {
      table.splice(index, 1);
    },
    editLimit(index, table) {
      this.limitForm = table[index].limitOption;
      this.limitFormId=index;
      this.limitFormVisible = true;
    },
    copyLimit(index, table) {
      table.push(table[index]);
    },
    cardPush(index, table) {
      unitAppointed.push(table[index]);
      var i = unitExclude.findIndex((u) => { return u.name == table[index].name });
      if (i > -1) { unitExclude.splice(i, 1); }
    },
    cardPop(index, table) {
      unitExclude.push(table[index]);
      var i = unitAppointed.findIndex((u) => { return u.name == table[index].name });
      if (i > -1) { unitAppointed.splice(i, 1); }
    },
    cardDefault(index, table) {
      var i = unitAppointed.findIndex((u) => { return u.name == table[index].name });
      if (i > -1) { unitAppointed.splice(i, 1); }
      i = unitExclude.findIndex((u) => { return u.name == table[index].name });
      if (i > -1) { unitExclude.splice(i, 1); }
    },
    clearTable(table) {
      table.splice(0, table.length);
    },
    setUnitRange(index, unitFilters) {
      this.unitCheckList = unitFilters[index].unitRange;
      this.unitCheckList.forEach(u => { u.cardCheck = '默认'; })
      this.cardsFormVisible = true;
    },
    newLimitForm() {
      var newLimit=new Object();
      newLimit.__proto__ = Qualification;
      newLimit.classRange = scroll.classList.slice();
      newLimit.initUnitRange(newLimit.limitOption);
      this.limitFormId=unitFilters.length;
      unitFilters.push(newLimit);
      this.limitForm = unitFilters[limitFormId].limitOption;
      this.limitFormVisible = true;
    },
    submitLimitForm(form) {
      this.$refs["limitForm"].validate(valid => {
        if (valid) {
          unitFilters[this.limitFormId].limitOption = form;
          unitFilters[this.limitFormId].initUnitRange(form);
          this.limitFormVisible = false;
        } else {
          return false;
        }
      });
    },

    generateTeam(table) {
      if (unitFilters.length < 1) {
        return false;
      }

      //对全局限制的池子求交集
      var pool = new Set(unitFilters[0].unitRange);
      for (let p = 0; p < unitFilters.length; ++p) {
        if (unitFilters[p].limitOption.isGlobal) {
          let a = new Set(unitFilters[p].unitRange);
          let b = pool;
          pool = new Set([...a].filter(e => b.has(e)));
        }
      }
      var globalMin = 0;
      var globalMax = 15;
      unitFilters.forEach(l => {
        globalMax = Math.min(globalMax, parseInt(l.limitOption.num.top));
        globalMin = Math.max(globalMin, parseInt(l.limitOption.num.lowest));
      });
      // //将非全局限制的池子约束为全局池子的子集
      // for (let p in unitFilters) {
      //   let subGroup=new Set();
      //   for (let u in p.unitRange) {
      //     if (pool.has(u)) {
      //       subGroup.add(u);
      //     }
      //   }
      //   p.unitRange=Array.from(subGroup);
      // }

      var exclude = new Set(unitExclude);
      var appointed = new Set(unitAppointed);
      pool = new Set([...pool].filter(e => !exclude.has(e)));
      pool = new Set([...pool].filter(e => !appointed.has(e)));
      pool = Array.from(pool);
      //随机重排备选池
      for (let i = pool.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      var candidates = new Array();
      candidates = candidates.concat(unitAppointed);

      var theNum = globalMin + Math.floor(Math.random() * (globalMax - globalMin));

      var iter = 0;
      while (candidates.length < theNum && iter < pool.length) {
        candidates.push(pool[iter]);
        ++iter;
      }

      this.team = candidates;
      this.hasteam = true;


      var hints = ["安娜你算计我！", "人类的赞歌就是德云的赞歌", "安姆安格瑞", "德云是千年的特色，不得不品尝",
        "人类总要重复同样的错误", "異議あり!!", "所罗门哟，我又回来了", "我现在内心感到悲痛欲绝",
        "意义不明的卡", "出现吧，我的灵魂！", "头脑稍微冷静一下吧", "快住手！这根本不会德云！",
        "这虽然是游戏，但可不是闹着玩的", "但是我拒绝！我最喜欢做的一件事，就是对看上去能德云的队伍，说“不”！",
        "我考虑了一下还是无法接受啊", "堕落！萌死他卡多", "已经没什么好害怕的了", "不也挺好吗？",
        "只要能够德云我随便你搞", "所累哇多卡纳~"];
      this.drawButton = hints[Math.floor(Math.random() * Math.floor(hints.length))];
    }
  }
})
