function sgn(x) {
    if(x>0){
        return 1
    }
    else if(x<0){
        return -1
    }
    else {
        return 0
    }
}

// 反误差函数求正态累积分布的反函数
function probit(p) {
    let z = 2*p-1
    const a= 8*(Math.PI-3)/(3*Math.PI*(4-Math.PI))
    const cons=2/(Math.PI*a)
    let v = Math.log(1-z*z)
    let ierf = sgn(z)*Math.sqrt(Math.sqrt(Math.pow(cons+v/2,2)-v/a)-(cons+v/2))
    return Math.SQRT2*ierf
}

// 误差函数求正态累积分布
function normalCumu(x) {
    let z = x*x/2
    if(x===-Infinity) {
        return 0
    }
    else if (x===Infinity) {
        return 1
    }
    const a= 8*(Math.PI-3)/(3*Math.PI*(4-Math.PI))
    let p = (4/Math.PI + a*z)/(1+a*z)*(-1*z)
    erf = sgn(x)*Math.sqrt(1-Math.exp(p))

    return 0.5+0.5*erf
}

function probCom(p1,p2) {
    let l1 = probit(p1)
    let l2 = probit(p2)
    let l = l1 + l2
    if (l1===Infinity&&l2===-Infinity) {
        l = 0
    }
    return normalCumu(l)
}
module.exports = {
    probCom:probCom
}