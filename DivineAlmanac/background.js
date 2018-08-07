const BrowserWindow = require('electron').remote.BrowserWindow
const path = require('path')
let eventsList = [
    {
        Title:'逛社区',
        PositiveDesc:'大佬们说话真好听，超喜欢在这里的',
        NegativeDesc:'啊怎么这么多海豹！'
    },
    {
        Title:'抽卡',
        PositiveDesc:'Aigis女神保佑，一单三十黑',
        NegativeDesc:'金银rush，保底全是复制人，邪神你算计我！'
    },
    {
        Title:'推主线',
        PositiveDesc:'闭着眼睛过图就是这个感觉吧',
        NegativeDesc:'一代德云巨匠在今天诞生了'
    },
    {
        Title:'看寝室',
        PositiveDesc:'这剧情好赞……我恋爱了',
        NegativeDesc:'形神枯槁，肾命垂危'
    },
    {
        Title:'刷曜日',
        PositiveDesc:'把把满掉，今天是加强版育成周',
        NegativeDesc:'空气，空气，空气……'
    },
    {
        Title:'刷复刻',
        PositiveDesc:'一日上千刻水，绿帝我来啦',
        NegativeDesc:'12体 = 9刻水，刻水好贵啊……'
    },
    {
        Title:'打魔神',
        PositiveDesc:'怎么感觉我只下个王子都能打Lv15',
        NegativeDesc:'卡老毕LV1了……'
    },
    {
        Title:'打大讨伐',
        PositiveDesc:'开局下完单位就可以挂机500了',
        NegativeDesc:'还没打满100个队伍就全惨死了'
    },
    {
        Title:'育成单位',
        PositiveDesc:'一技一虹，一绊一C',
        NegativeDesc:'4升5吃了99个虹'
    },
    {
        Title:'推活动图',
        PositiveDesc:'这图也能德云的主播是人间之屑',
        NegativeDesc:'一天过去还卡在初级图'
    },
    {
        Title:'抽白券',
        PositiveDesc:'白券和黑券有什么区别吗？',
        NegativeDesc:'3000虹惨变300虹'
    }
]


// SeedRandom, by aaaaaaaaaaaa
// https://stackoverflow.com/a/22313621
function SeedRandom(state1,state2){
    var mod1=4294967087
    var mul1=65539
    var mod2=4294965887
    var mul2=65537
    if(typeof state1!="number"){
        state1=+new Date()
    }
    if(typeof state2!="number"){
        state2=state1
    }
    state1=state1%(mod1-1)+1
    state2=state2%(mod2-1)+1
    function random(limit){
        state1=(state1*mul1)%mod1
        state2=(state2*mul2)%mod2
        if(state1<limit && state2<limit && state1<mod1%limit && state2<mod2%limit){
            return random(limit)
        }
        return (state1+state2)%limit
    }
    return random
}

let pros = []
let cons = []

function run(pluginHelper) {
    let date = new Date()
    let seed = date.getFullYear()*10000+date.getMonth()*100+date.getDay()
    let generator=SeedRandom(seed)

    let defaultNum = 3
    // 生成的事项数量
    let prosLength = defaultNum
    let consLength = defaultNum

    // 特殊规则
    // 当前日期为1时不宜去社区被晒黑券
    if (date.getDate() == '1'){
        cons.push(eventsList[0])
        eventsList.splice(0,1)
        consLength -= 1
    }

    // 黄道吉日与诸事不宜，仅当特殊规则均不起作用时生效，概率均为一个黑
    if (prosLength == defaultNum && consLength == defaultNum) {
        let p = generator(100)
        if (p<3) {
            pros.push({Title:"黄道吉日 诸事皆宜", PositiveDesc:"Aigis女神护佑着你"})
            prosLength = 0
            consLength = 0
        }
        else if (p>96) {
            cons.push({Title:"日时相冲 诸事不宜", NegativeDesc:"忏悔你犯下的罪孽吧！史莱姆！"})
            prosLength = 0
            consLength = 0
        }
    }

    // 随机生成剩余部分
    for (let i = 0;i<prosLength;++i){
        let p = generator(eventsList.length)
        pros.push(eventsList[p])
        eventsList.splice(p,1)
    }
    for (let i = 0;i<consLength;++i){
        let p = generator(eventsList.length)
        cons.push(eventsList[p])
        eventsList.splice(p,1)
    }

    // 每日当且仅当第一次启动AP时自动弹出黄历窗口
    recordedDate = window.localStorage.getItem('recordedDate')
    //recordedDate = ''
    if (date.toLocaleDateString() != recordedDate){
        window.localStorage.setItem('recordedDate', date.toLocaleDateString())
        let win = new BrowserWindow({ width: 400, height: 320})
        win.on('closed', function () { win = null })
        winpath = path.join('file://', __dirname,'/almanac.html')
        win.loadURL(winpath)//指定渲染的页面
        win.once('ready-to-show', () => {
            win.show()
            
        })
    }

    pluginHelper.onMessage((msg, sendResponse) => {
        let re = {Pros:pros, Cons:cons}
        sendResponse(re)
    });
}


module.exports = {run: run}