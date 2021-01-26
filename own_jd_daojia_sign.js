/*

 */
/*
京东到家签到自用
 */

const cheerio = require('cheerio');
const $ = new Env('京东到家');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
    cookie = '',
    message;
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0)
} else {
    let cookiesData = $.getdata('CookiesJD') || "[]";
    cookiesData = jsonParse(cookiesData);
    cookiesArr = cookiesData.map(item => item.cookie);
    cookiesArr.reverse();
    cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
    cookiesArr.reverse();
    cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}!(async() => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
        return;
    }
    let tryIds = []
    if (process.env.JD_DAOJIA_FRESH_BEANS_ACCOUNT) {
        tryIds = process.env.JD_DAOJIA_FRESH_BEANS_ACCOUNT.split(",");
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = '';
            message = '';
            await TotalBean();
            if (tryIds.length > 0 && tryIds.indexOf(`${$.index}`) == -1) {
                $.log(`【京东账号${$.index}】${$.nickName || $.UserName}配置为不签到，跳过`);
                continue;
            }
            console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { "open-url": "https://bean.m.jd.com/" });

                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                } else {
                    $.setdata('', `CookieJD${i ? i + 1 : ""}`); //cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
                }
                continue
            }
            await jdSign();
        }
    }
})()
.catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

function getNetworkConfig(url, headers, data, noParse) {
    let params = ""
    if (data) {
        params = []
        for (const key in data) {
            if (data[key] instanceof Object) {
                params.push(`${key}=${JSON.stringify(data[key])}`);
            } else {
                params.push(`${key}=${data[key]}`);
            }

        }
        params = "?" + params.join("&")
    }
    return new Promise(async resolve => {
        $.get({
            url: url + params,
            headers: Object.assign({
                "Cookie": cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
            }, headers)
        }, (err, resp, data) => {
            try {
                if (noParse) {
                    return resolve(data, resp);
                }
                return resolve(JSON.parse(data), resp);
            } catch {
                return resolve({});
            }

        });
    })
}


function sleep(min, max) {
    let delay = Math.floor(Math.random() * (max - min)) + min;
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue;
    }
}

let deviceId = ''
let maxGetNum = Number(process.env.JD_DAOJIA_FRESH_BEANS_MAX_NUM || 10000)

async function jdSign() {
    // 更新Cookie
    await getNetworkConfig(`https://daojia.jd.com/client?functionId=login/passport&body={%22returnLink%22:%20%22https://daojia.jd.com/html/index.html?channel=jdapp%23user%22}`, {
        Referer: "https://daojia.jd.com/html/index.html?channel=jdapp",
        Host: "daojia.jd.com"
    })
    deviceId = cookie.replace(";", "=").split("=")[1]



    // 签到
    let result = await getNetworkConfig("https://daojia.jd.com/client", {
        "referer": "https://daojia.jd.com/taroh5/h5dist/"
    }, {
        "functionId": "signin/userSigninNew",
        "city_id": "4",
        body: { "channel": "qiandao_baibaoxiang", "cityId": 4, "longitude": 106.51885 + Math.random() / 1000, "latitude": 29.63575 + Math.random() / 1000 },
        deviceId: deviceId
    })
    $.log(result.msg);



    // 获取今日已获得的仙豆数量
    let nextPage = true;
    let totalNum = 0;
    let pageNo = 1;
    let date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    do {
        result = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "memberPoints/userPointsDetail",
            body: { "pageSize": 100, "pageNo": pageNo },
            deviceId: deviceId
        })
        for (const evaluate of result.result.evaluateList) {
            let applyTime = new Date(evaluate.createTime).getTime()
            if ((applyTime - date) < 0) {
                nextPage = false;
            } else {
                totalNum += evaluate.points;
            }
        }
        pageNo++;
    } while (nextPage);

    $.log(`今日已获取鲜豆${totalNum},申请上限为${maxGetNum}`);
    if (totalNum >= maxGetNum) {
        $.log(`超过设定上限，退出任务${maxGetNum}`);
        return;
    }


    $.log("获取任务列表");
    result = await getNetworkConfig("https://daojia.jd.com/client", {
        "referer": "https://daojia.jd.com/taroh5/h5dist/"
    }, {
        functionId: "task/list",
        city_id: "4",
        body: { "modelId": "M10003", "plateCode": 3 },
        deviceId: deviceId
    })
    for (let j = 0; j < result.result.taskInfoList.length; j++) {
        const task = result.result.taskInfoList[j];
        let message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/received",
            "city_id": "4",
            body: { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 },
            "deviceId": deviceId
        })
        message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/finished",
            "city_id": "4",
            body: { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 },
            "deviceId": deviceId
        })
        message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/sendPrize",
            "city_id": "4",
            body: { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 },
            "deviceId": deviceId
        })
        $.log(`${task.taskTitle} 结果：${message.msg} 领取数量:${message.result && message.result.awardValue || 0}`);
    }


    $.log("获取任务列表2");
    result = await getNetworkConfig("https://daojia.jd.com/client", {
        "referer": "https://daojia.jd.com/taroh5/h5dist/"
    }, {
        functionId: "task/list",
        city_id: "4",
        body: { "modelId": "M10001", "plateCode": 3 },
        deviceId: deviceId
    })
    for (let j = 0; j < result.result.taskInfoList.length; j++) {
        const task = result.result.taskInfoList[j];
        let body = { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 }

        let message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/received",
            "city_id": "4",
            body: body,
            "deviceId": deviceId
        })
        if (task.browseTime > 0) {
            sleep(task.browseTime * 1000 + 1000, task.browseTime * 1000 + 3000);
        }

        message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/finished",
            "city_id": "4",
            body: { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 },
            "deviceId": deviceId
        })
        body = { "modelId": task.modelId, "taskId": task.taskId, "taskType": task.taskType, "plateCode": 3 }

        message = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "task/sendPrize",
            "city_id": "4",
            body: body,
            "deviceId": deviceId
        })

        $.log(`${task.taskTitle} 结果：${message.msg} 领取数量：${message.result && message.result.awardValue || 0}`);
        if (task.subList) {
            for (const tt of task.subList) {
                body.subNode = tt.node
                message = await getNetworkConfig("https://daojia.jd.com/client", {
                    "referer": "https://daojia.jd.com/taroh5/h5dist/"
                }, {
                    "functionId": "task/sendPrize",
                    "city_id": "4",
                    body: body,
                    "deviceId": deviceId
                })
                $.log(`${task.taskTitle} 结果：${message.msg} 领取数量：${message.result && message.result.awardValue || 0}`);
            }
        }
    }
    result = await getNetworkConfig("https://daojia.jd.com/client", {
        "referer": "https://daojia.jd.com/taroh5/h5dist/"
    }, {
        "functionId": "pointTask/logsWithTaskList",
        platCode: "H5",
        appName: "paidaojia",
        body: { "longitude": "106.51885", "latitude": "29.63575", "areaCode": "4", "source": "H5" },
        deviceId: deviceId
    })
    let maxNum = result.result.points
    totalNum = 0;
    pageNo = 1;
    date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    do {
        result = await getNetworkConfig("https://daojia.jd.com/client", {
            "referer": "https://daojia.jd.com/taroh5/h5dist/"
        }, {
            "functionId": "memberPoints/userPointsDetail",
            body: { "pageSize": 100, "pageNo": pageNo },
            deviceId: deviceId
        })
        for (const evaluate of result.result.evaluateList) {
            let applyTime = new Date(evaluate.createTime).getTime()
            if ((applyTime - date) < 0) {
                nextPage = false;
            } else {
                totalNum += evaluate.points;
            }
        }
        pageNo++;
    } while (nextPage);

    let log = `${$.nickName}申請完成，今日获取鲜豆${totalNum}\n账户剩余鲜豆${maxNum}\n`
    $.log(log);
    await notify.sendNotify(`${$.nickName} 京东到家签到`, log);

}


function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        $.nickName = data['base'].nickname;
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}


function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
            return [];
        }
    }
}
// prettier-ignore
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) { this.env = t }
        send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) }
        get(t) { return this.send.call(this.env, t) }
        post(t) { return this.send.call(this.env, t, "POST") }
    }
    return new class {
        constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) }
        isNode() { return "undefined" != typeof module && !!module.exports }
        isQuanX() { return "undefined" != typeof $task }
        isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon }
        isLoon() { return "undefined" != typeof $loon }
        toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } }
        toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try { s = JSON.parse(this.getdata(t)) } catch {}
            return s
        }
        setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } }
        getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r) return s;
            return r
        }
        lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) { e = "" }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }
        getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null }
        setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null }
        initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) }
        get(t, e = (() => {})) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => {!t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => {
                const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        cookie = s + ";" + cookie;
                        s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) { this.logErr(t) }
            }).then(t => {
                const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o)
            }, t => {
                const { message: s, response: i } = t;
                e(s, i, i && i.body)
            }))
        }
        post(t, e = (() => {})) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => {!t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) });
            else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => {
                const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                e(null, { status: s, statusCode: i, headers: r, body: o }, o)
            }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const { url: s, ...i } = t;
                this.got.post(s, i).then(t => {
                    const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                    e(null, { status: s, statusCode: i, headers: r, body: o }, o)
                }, t => {
                    const { message: s, response: i } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return { openUrl: e, mediaUrl: s }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return { "open-url": e, "media-url": s }
                    }
                    if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }
        log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }
        wait(t) { return new Promise(e => setTimeout(e, t)) }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}