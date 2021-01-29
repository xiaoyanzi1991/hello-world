/*
京东神仙书院答题
根据bing搜索结果答题，常识题可对，商品题不能保证胜率
活动时间:2021-1-27至2021-2-5
活动入口: 京东APP我的-神仙书院
活动地址：https://h5.m.jd.com//babelDiy//Zeus//4XjemYYyPScjmGyjej78M6nsjZvj//index.html?babelChannel=ttt9
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东神仙书院答题
20 * * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal_answer.js, tag=京东神仙书院答题, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "20 * * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal_answer.js,tag=京东神仙书院答题

===============Surge=================
京东神仙书院答题 = type=cron,cronexp="20 * * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal_answer.js

============小火箭=========
京东神仙书院答题 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal_answer.js, cronexpr="20 * * * *", timeout=3600, enable=true
 */
const $ = new Env('京东神仙书院答题');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  await requireTk()
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      $.stopAnswer = false;
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdImmortalAnswer()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdImmortalAnswer() {
  try {
    $.risk = false
    $.earn = 0
    await getHomeData()
    if ($.risk) return
    if ($.isNode()) {
      //一天答题上限是15次
      for (let i = 0; i < 15; i++) {
        $.log(`\n开始第 ${i + 1}次答题\n`);
        await getQuestions()
        await $.wait(2000)
        if ($.stopAnswer) break
      }
    } else {
      await getQuestions()
    }
    await showMsg()
  } catch (e) {
    $.logErr(e)
  }
}

function getHomeData(info = false) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('mcxhd_brandcity_homePage'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data['retCode'] === "200") {
            const {userCoinNum} = data.result
            if (info) {
              $.earn = userCoinNum - $.coin
            } else {
              console.log(`当前用户金币${userCoinNum}`)
            }
            $.coin = userCoinNum
          } else {
            $.risk = true
            console.log(`账号被风控，无法参与活动`)
            message += `账号被风控，无法参与活动\n`
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得${$.earn}积分`
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}

function getQuestions() {
  return new Promise((resolve) => {
    $.get(taskUrl('mcxhd_brandcity_getQuestions'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data['retCode'] === "200") {
            console.log(`答题开启成功`)
            let i = 0, questionList = []
            for (let vo of data.result.questionList) {
              $.question = vo
              let option = null, hasFound = false

              console.log(`去查询第${++i}题：【${vo.questionStem}】`)
              let ques = $.tk.filter(qo => qo.questionId === vo.questionId)

              if (ques.length) {
                ques = ques[0]
                let ans = JSON.parse(ques.correct)
                let opt = vo.options.filter(bo => bo.optionDesc === ans.optionDesc)
                if (opt.length) {
                  console.log(`在题库中找到题啦～`)
                  option = opt[0]
                  hasFound = true
                }
              }

              if (!option) {
                console.log(`在题库中未找到题`)
                let ans = -1
                for (let opt of vo.options) {
                  let str = vo.questionStem + opt.optionDesc
                  console.log(`去搜索${str}`)
                  let res = await bing(str)
                  if (res > ans) {
                    option = opt
                    ans = res
                  }
                  await $.wait(2 * 1000)
                }
                if (!option) {
                  option = vo.options[1]
                  console.log(`未找到答案，都选B【${option.optionDesc}】\n`)
                } else {
                  console.log(`选择搜索返回结果最多的一项【${option.optionDesc}】\n`)
                }
              }

              let b = {
                "questionToken": vo.questionToken,
                "optionId": option.optionId
              }
              $.option = option
              await answer(b)
              if (!hasFound) questionList.push($.question)
              if (i < data.result.questionList.length) {
                if (hasFound)
                  await $.wait(2 * 1000)
                else
                  await $.wait(5 * 1000)
              }
            }
            for (let vo of questionList) {
              $.question = vo
              await submitQues({
                ...$.question,
                options: JSON.stringify($.question.options),
                correct: JSON.stringify($.question.correct),
              })
            }
          } else if (data && data['retCode'] === '325') {
            console.log(`答题开启失败,${data['retMessage']}`);
            $.stopAnswer = true;//答题已到上限
          } else if (data && data['retCode'] === '326') {
            console.log(`答题开启失败,${data['retMessage']}`);
            $.stopAnswer = true;//答题已到上限
          } else {
            console.log(JSON.stringify(data))
            console.log(`答题开启失败`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function submitQues(question) {
  return new Promise(resolve => {
    $.post({
      'url': 'http://qa.turinglabs.net:8081/api/v1/question',
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(question),
    }, (err, resp, data) => {
      try {
        data = JSON.parse(data)
        if (data.status === 200) {
          console.log(`提交成功`)
        } else {
          console.log(`提交失败`)
        }
        resolve()
      } catch (e) {
        console.log(e)
      } finally {
        resolve()
      }
    })
  })
}

function answer(body = {}) {
  return new Promise((resolve) => {
    $.get(taskUrl('mcxhd_brandcity_answerQuestion', {"costTime": 1, ...body}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          // console.log(data)
          if (data && data['retCode'] === "200") {
            if (data.result.isCorrect) {
              console.log(`您选对啦！获得积分${data.result.score}，本次答题共计获得${data.result.totalScore}分`)
              $.earn += parseInt(data.result.score)
              $.question = {
                ...$.question,
                correct: $.option
              }
            } else {
              let correct = $.question.options.filter(vo => vo.optionId === data.result.correctOptionId)[0]
              console.log(`您选错啦～正确答案是：${correct.optionDesc}`)
              $.question = {
                ...$.question,
                correct: correct
              }
            }
            if (data.result.isLastQuestion) {
              console.log(`答题完成`)
            }
          } else {
            console.log(`答题失败`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function bing(str) {
  return new Promise(resolve => {
    $.ckjar = null;
    $.get({
      url: `https://www.bing.com/search?q=${str}`,
      headers: {
        'Connection': 'Keep-Alive',
        'Accept': 'text/html, application/xhtml+xml, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4371.0 Safari/537.36'
      }
    }, (err, resp, data) => {
      try {
        let num = parseInt(data.match(/="sb_count">(.*) 条结果<\/span>/)[1].split(',').join(''))
        console.log(`找到结果${num}个`)
        resolve(num)
      } catch (e) {
        console.log(e)
      } finally {
        resolve()
      }
    })
  })

}

function taskUrl(function_id, body = {}, function_id2) {
  body = {"token": 'jd17919499fb7031e5', ...body}
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&appid=publicUseApi&t=${new Date().getTime()}&sid=&uuid=&area=&networkType=wifi`,
    headers: {
      "Cookie": cookie,
      'Accept': "application/json, text/plain, */*",
      'Accept-Language': 'zh-cn',
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/babelDiy/Zeus/4XjemYYyPScjmGyjej78M6nsjZvj/index.html",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
}

function taskPostUrl(function_id, body = {}, function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  body = {...body, "token": 'jd17919499fb7031e5'}
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&appid=publicUseApi`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
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

function requireTk() {
  return new Promise(resolve => {
    $.get({
      url: `http://qn6l5d6wm.hn-bkt.clouddn.com/question.json?t=${new Date().getTime()}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4371.0 Safari/537.36'
      }
    }, (err, resp, data) => {
      try {
        $.tk = JSON.parse(data).RECORDS;
        if (!$.tk) $.tk = [{"questionId":"1901441674","questionIndex":"1","questionStem":"永乐宫位于山西哪个城市？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbNFBxCgQpCIXLkJ_WAKDLFdSw-A\",\"optionDesc\":\"运城市\"},{\"optionId\":\"Ks0Sx0BXjjgbNFBxCgQpChYv-iBINKeZnfm57Q\",\"optionDesc\":\"大同市\"},{\"optionId\":\"Ks0Sx0BXjjgbNFBxCgQpC0PrO6mXfvErnsQZkw\",\"optionDesc\":\"太原市\"}]","questionToken":"Ks0Sx0BXjjgbNFAjGUwyXaBp4FnRWXz9HV3vlG-r0AbqW0JofD5caaNEQRrh9w29L7dXXyJ1x5jxRzvj8WP7hQBiWb6eYw","correct":"{\"optionId\":\"Ks0Sx0BXjjgbNFBxCgQpCIXLkJ_WAKDLFdSw-A\",\"optionDesc\":\"运城市\"}","create_time":"27/1/2021 04:49:08","update_time":"27/1/2021 04:49:08","status":"1"},{"questionId":"1901441675","questionIndex":"2","questionStem":"永乐宫在什么时期进行了全面搬迁？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbNVBxCgQpCqVtOiEGdgT2rlgu\",\"optionDesc\":\"21世纪初\"},{\"optionId\":\"Ks0Sx0BXjjgbNVBxCgQpCJXg5g8cZbd_NrUF\",\"optionDesc\":\"20世纪五六十年代\"},{\"optionId\":\"Ks0Sx0BXjjgbNVBxCgQpC_dVlhsF1hkxDSRo\",\"optionDesc\":\"20世纪八九十年代\"}]","questionToken":"Ks0Sx0BXjjgbNVAgGUwyXWU5Z3N8SsLmAmlHnWPk8mu4qpLQ5BonaiQ48lq5_oPoCmxj6PygaxpHZfAQ8m0UnMkPoxHQpg","correct":"{\"optionId\":\"Ks0Sx0BXjjgbNVBxCgQpCJXg5g8cZbd_NrUF\",\"optionDesc\":\"20世纪五六十年代\"}","create_time":"27/1/2021 04:37:24","update_time":"27/1/2021 04:37:24","status":"1"},{"questionId":"1901441676","questionIndex":"1","questionStem":"永乐宫建筑群建造于哪个时期？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbNlBxCgQpCija4QWLFHMVZNeuuQ\",\"optionDesc\":\"明清时期\"},{\"optionId\":\"Ks0Sx0BXjjgbNlBxCgQpC-sybUji1HS_1mIxOg\",\"optionDesc\":\"隋唐时期\"},{\"optionId\":\"Ks0Sx0BXjjgbNlBxCgQpCERO6zuvt0b_lDV85g\",\"optionDesc\":\"宋元时期\"}]","questionToken":"Ks0Sx0BXjjgbNlAjGUwyXf6zlVwlZm9N0cMd1yq3R26R0FElCAVxswWUF7k6UqOKDARHvkc8js_CnGq7m9rw9Je3Ye7uwg","correct":"{\"optionId\":\"Ks0Sx0BXjjgbNlBxCgQpCERO6zuvt0b_lDV85g\",\"optionDesc\":\"宋元时期\"}","create_time":"27/1/2021 04:42:38","update_time":"27/1/2021 04:42:38","status":"1"},{"questionId":"1901441677","questionIndex":"2","questionStem":"永乐宫屋顶正脊两侧的怪兽叫？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbN1BxCgQpCLdI9W7sOrVFbyo2_w\",\"optionDesc\":\"鸱吻\"},{\"optionId\":\"Ks0Sx0BXjjgbN1BxCgQpC8bJ8XseaV3o3WvQZw\",\"optionDesc\":\"赑屃\"},{\"optionId\":\"Ks0Sx0BXjjgbN1BxCgQpCiTLo1O3Fskj9ysIVw\",\"optionDesc\":\"狮子\"}]","questionToken":"Ks0Sx0BXjjgbN1AgGUwyWtwFYOBcQhTDcAYij64yM9ULBJ-9xlCSyjOp-oPdSbAyrvbKYUBNbWNYjjmKIgNgO_yoJjPedg","correct":"{\"optionId\":\"Ks0Sx0BXjjgbN1BxCgQpCLdI9W7sOrVFbyo2_w\",\"optionDesc\":\"鸱吻\"}","create_time":"27/1/2021 04:35:45","update_time":"27/1/2021 04:35:45","status":"1"},{"questionId":"1901441678","questionIndex":"2","questionStem":"永乐宫鸱吻的原料是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbOFBxCgQpCLIiGL-i9xgxxciXKA\",\"optionDesc\":\"琉璃\"},{\"optionId\":\"Ks0Sx0BXjjgbOFBxCgQpChqA80NEftULPnc5pQ\",\"optionDesc\":\"木雕\"},{\"optionId\":\"Ks0Sx0BXjjgbOFBxCgQpCxZRsqUCnaaa1McPtg\",\"optionDesc\":\"金银\"}]","questionToken":"Ks0Sx0BXjjgbOFAgGUwyXaz-RSO4SdlUVwxRDJLcmSKPyxL2yVbqPuCvt5zrMdBYxvzzKQq5firE3VKN-dZIAgFMWXPBhA","correct":"{\"optionId\":\"Ks0Sx0BXjjgbOFBxCgQpCLIiGL-i9xgxxciXKA\",\"optionDesc\":\"琉璃\"}","create_time":"27/1/2021 04:47:23","update_time":"27/1/2021 04:47:23","status":"1"},{"questionId":"1901441679","questionIndex":"4","questionStem":"永乐宫建筑的布局是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgbOVBxCgQpC8_r_0V5j_2iit4\",\"optionDesc\":\"三点布局\"},{\"optionId\":\"Ks0Sx0BXjjgbOVBxCgQpCAtpkpOXFIsGw_Y\",\"optionDesc\":\"中轴线布局\"},{\"optionId\":\"Ks0Sx0BXjjgbOVBxCgQpCnZ3QHwZxxvqbvU\",\"optionDesc\":\"对角线布局\"}]","questionToken":"Ks0Sx0BXjjgbOVAmGUwyWsIJPvpXj3gmQ0NPuTKUw1XdjYI4-a5pl-7g5NfIGYSC54-XuwqBqBzyo4gBnd4MPW08Pslijw","correct":"{\"optionId\":\"Ks0Sx0BXjjgbOVBxCgQpCAtpkpOXFIsGw_Y\",\"optionDesc\":\"中轴线布局\"}","create_time":"27/1/2021 04:36:17","update_time":"27/1/2021 04:36:17","status":"1"},{"questionId":"1901441680","questionIndex":"3","questionStem":"永乐宫是哪个宗教的建筑？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUMFBxCgQpCI4ZdGOr_c5yUIGz\",\"optionDesc\":\"道教\"},{\"optionId\":\"Ks0Sx0BXjjgUMFBxCgQpCz5VlteegUfypA7G\",\"optionDesc\":\"伊斯兰教\"},{\"optionId\":\"Ks0Sx0BXjjgUMFBxCgQpCv1lnZxzG3Oo4vZQ\",\"optionDesc\":\"佛教\"}]","questionToken":"Ks0Sx0BXjjgUMFAhGUwyWpJF8tGtTyAO5wkdd-Zp9U1w9Jqp-uGaaEF3xWVhpwFeB9X71PBuyyLHdGb7g5QRTF6zHWrtPA","correct":"{\"optionId\":\"Ks0Sx0BXjjgUMFBxCgQpCI4ZdGOr_c5yUIGz\",\"optionDesc\":\"道教\"}","create_time":"27/1/2021 04:32:33","update_time":"27/1/2021 04:32:33","status":"1"},{"questionId":"1901441681","questionIndex":"1","questionStem":"永乐宫建筑群的主体材料是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUMVBxCgQpClAVHXDlx4iFjSPCEA\",\"optionDesc\":\"汉白玉\"},{\"optionId\":\"Ks0Sx0BXjjgUMVBxCgQpCHi92SbiZ_U5NcgBLQ\",\"optionDesc\":\"木材\"},{\"optionId\":\"Ks0Sx0BXjjgUMVBxCgQpC5aA9Mgq7qOWWmoGhw\",\"optionDesc\":\"砖石\"}]","questionToken":"Ks0Sx0BXjjgUMVAjGUwyXawYWL1UOIN8ssGn41zVx3hluW-X3pOIBdpbrzjitD5PIk3JLx7ZZIcjbZt2tp25xcD8iCB08w","correct":"{\"optionId\":\"Ks0Sx0BXjjgUMVBxCgQpCHi92SbiZ_U5NcgBLQ\",\"optionDesc\":\"木材\"}","create_time":"27/1/2021 04:35:24","update_time":"27/1/2021 04:35:24","status":"1"},{"questionId":"1901441682","questionIndex":"1","questionStem":"传说中鸱吻这种神兽的作用是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUMlBxCgQpCtQOT7Ynym3JenwCHg\",\"optionDesc\":\"驱邪降魔\"},{\"optionId\":\"Ks0Sx0BXjjgUMlBxCgQpCyXafCr2GQfX5EWkIA\",\"optionDesc\":\"祈求财富\"},{\"optionId\":\"Ks0Sx0BXjjgUMlBxCgQpCJCV-cfmdq-QbnYXMg\",\"optionDesc\":\"避免火灾\"}]","questionToken":"Ks0Sx0BXjjgUMlAjGUwyWkpGFycyA6X5Ne-gvXVHBiitX-9-0EoSwLz6Um379nm-O0pCejfo8Q8dweZInVBRxJN0_n128A","correct":"{\"optionId\":\"Ks0Sx0BXjjgUMlBxCgQpCJCV-cfmdq-QbnYXMg\",\"optionDesc\":\"避免火灾\"}","create_time":"27/1/2021 04:49:32","update_time":"27/1/2021 04:49:32","status":"1"},{"questionId":"1901441683","questionIndex":"5","questionStem":"永乐宫之所以被称作“宫”的原因是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUM1BxCgQpC5PXQ_FU1uT-F7ug\",\"optionDesc\":\"它曾是王爷的王府\"},{\"optionId\":\"Ks0Sx0BXjjgUM1BxCgQpCsW1fCbEDNld89Dz\",\"optionDesc\":\"它曾是古代皇帝的行宫\"},{\"optionId\":\"Ks0Sx0BXjjgUM1BxCgQpCDvrJSzFZ6zPwf9x\",\"optionDesc\":\"它是道教宫观\"}]","questionToken":"Ks0Sx0BXjjgUM1AnGUwyWhP15Oinw63LiAS_tKn3NvgNkLXqoBY2Z9fen4mTnJlrbPqQDJ6eCE-XmAgRCOOFf93N2Awntg","correct":"{\"optionId\":\"Ks0Sx0BXjjgUM1BxCgQpCDvrJSzFZ6zPwf9x\",\"optionDesc\":\"它是道教宫观\"}","create_time":"27/1/2021 04:41:42","update_time":"27/1/2021 04:41:42","status":"1"},{"questionId":"1901441684","questionIndex":"4","questionStem":"古代木构建筑，柱头上用于支撑屋顶的是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUNFBxCgQpCFCw5AV_jyrR5Wmslg\",\"optionDesc\":\"斗拱\"},{\"optionId\":\"Ks0Sx0BXjjgUNFBxCgQpC55a8SIabsqTCfxTzw\",\"optionDesc\":\"椽\"},{\"optionId\":\"Ks0Sx0BXjjgUNFBxCgQpCjr63fj7bbSxsnrqwg\",\"optionDesc\":\"藻井\"}]","questionToken":"Ks0Sx0BXjjgUNFAmGUwyXaPbN9OVIJKBsaNJdAO6l78DcVq9h0-t4xQT8aZB11TvDxyRkrKiBKtLHT1aZwQ6wY8cby-BGg","correct":"{\"optionId\":\"Ks0Sx0BXjjgUNFBxCgQpCFCw5AV_jyrR5Wmslg\",\"optionDesc\":\"斗拱\"}","create_time":"27/1/2021 04:36:42","update_time":"27/1/2021 04:36:42","status":"1"},{"questionId":"1901441685","questionIndex":"4","questionStem":"龙虎殿在永乐宫建筑群中原本的作用是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUNVBxCgQpC92ngKLgeY74q3Bf\",\"optionDesc\":\"主殿\"},{\"optionId\":\"Ks0Sx0BXjjgUNVBxCgQpCMGl3vSwkiQn4Dkr\",\"optionDesc\":\"宫门\"},{\"optionId\":\"Ks0Sx0BXjjgUNVBxCgQpCos9W0y6Lt8hAEfl\",\"optionDesc\":\"厨房\"}]","questionToken":"Ks0Sx0BXjjgUNVAmGUwyXSHjT4x5_6ZnXZVreHN12NE-fNfyF5D1paixW-6xlwFNirQlgSEasjwZMlZJNCzjEVoBcNLhvQ","correct":"{\"optionId\":\"Ks0Sx0BXjjgUNVBxCgQpCMGl3vSwkiQn4Dkr\",\"optionDesc\":\"宫门\"}","create_time":"27/1/2021 04:51:49","update_time":"27/1/2021 04:51:49","status":"1"},{"questionId":"1901441686","questionIndex":"1","questionStem":"永乐宫中，体积最大、规格最高的建筑是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUNlBxCgQpCKm_3kssuhNgRf4v\",\"optionDesc\":\"三清殿\"},{\"optionId\":\"Ks0Sx0BXjjgUNlBxCgQpChYDkQGDGcBVLDSs\",\"optionDesc\":\"龙虎殿\"},{\"optionId\":\"Ks0Sx0BXjjgUNlBxCgQpCyrEThF-MLRSMvcT\",\"optionDesc\":\"纯阳殿\"}]","questionToken":"Ks0Sx0BXjjgUNlAjGUwyXbsTxOqIEDJpD9S5F8jLsF9QME4eORP3ggmZL0d5050fhRc4Kl-9WrGM3kTBa6fL_fN3lWnJsw","correct":"{\"optionId\":\"Ks0Sx0BXjjgUNlBxCgQpCKm_3kssuhNgRf4v\",\"optionDesc\":\"三清殿\"}","create_time":"27/1/2021 04:48:19","update_time":"27/1/2021 04:48:19","status":"1"},{"questionId":"1901441687","questionIndex":"5","questionStem":"三清殿为了扩大空间，用的什么建造方法？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUN1BxCgQpCo67V4IahCuUkzxH\",\"optionDesc\":\"移柱造\"},{\"optionId\":\"Ks0Sx0BXjjgUN1BxCgQpCB9PGapzVSxFJt6z\",\"optionDesc\":\"减柱造\"},{\"optionId\":\"Ks0Sx0BXjjgUN1BxCgQpC_lvivPh3eq-b_G0\",\"optionDesc\":\"增柱造\"}]","questionToken":"Ks0Sx0BXjjgUN1AnGUwyXZ9d3yh3z5_p6Ify_GTATyJx3H7Qm_gwiqbEnCoXsz8XY7a9Eb8jJCdvnJLRonE76nRSIQbhqg","correct":"{\"optionId\":\"Ks0Sx0BXjjgUN1BxCgQpCB9PGapzVSxFJt6z\",\"optionDesc\":\"减柱造\"}","create_time":"27/1/2021 04:41:47","update_time":"27/1/2021 04:41:47","status":"1"},{"questionId":"1901441688","questionIndex":"3","questionStem":"建筑结构“藻井”位于建筑的什么位置？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUOFBxCgQpCkKRH5okhVEFYcPb\",\"optionDesc\":\"室内底部\"},{\"optionId\":\"Ks0Sx0BXjjgUOFBxCgQpCEO44t3eXweU7TIE\",\"optionDesc\":\"室内顶部\"},{\"optionId\":\"Ks0Sx0BXjjgUOFBxCgQpC5ajI6TUyh3n-HJU\",\"optionDesc\":\"室外顶部\"}]","questionToken":"Ks0Sx0BXjjgUOFAhGUwyWrUpYigmUBfN9MPhFu_H-yb8LQkx_v5b3V_ucIEnHHcn3GpvNAhJtnV6CFriw-KUAckvPRMZxg","correct":"{\"optionId\":\"Ks0Sx0BXjjgUOFBxCgQpCEO44t3eXweU7TIE\",\"optionDesc\":\"室内顶部\"}","create_time":"27/1/2021 04:37:36","update_time":"27/1/2021 04:37:36","status":"1"},{"questionId":"1901441689","questionIndex":"2","questionStem":"龙虎殿中原本侍奉的神像是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgUOVBxCgQpC40R7oirSHDkDK8cWw\",\"optionDesc\":\"哼哈二将\"},{\"optionId\":\"Ks0Sx0BXjjgUOVBxCgQpCj4Kp_T2MZoxVgqq4Q\",\"optionDesc\":\"四大天王\"},{\"optionId\":\"Ks0Sx0BXjjgUOVBxCgQpCFR5Cy2zO1xrvWj5-Q\",\"optionDesc\":\"青龙白虎\"}]","questionToken":"Ks0Sx0BXjjgUOVAgGUwyXQQsVXA1i3sJpvMrfjH6nnVHfgwXOuzHPoVBgbdweUFqJygSziWLuDv8rbeHzAdG3VfeYoTfqQ","correct":"{\"optionId\":\"Ks0Sx0BXjjgUOVBxCgQpCFR5Cy2zO1xrvWj5-Q\",\"optionDesc\":\"青龙白虎\"}","create_time":"27/1/2021 04:43:14","update_time":"27/1/2021 04:43:14","status":"1"},{"questionId":"1901441690","questionIndex":"4","questionStem":"龙虎殿中的壁画内容不包括？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVMFBxCgQpCFt6wNOO4WvdSY8I\",\"optionDesc\":\"哼哈二将\"},{\"optionId\":\"Ks0Sx0BXjjgVMFBxCgQpCtIP27bjXR6Xwiyn\",\"optionDesc\":\"天兵天将\"},{\"optionId\":\"Ks0Sx0BXjjgVMFBxCgQpC-cMUHyTpGgtDGhN\",\"optionDesc\":\"城隍土地\"}]","questionToken":"Ks0Sx0BXjjgVMFAmGUwyXcnM6lBhN3Sz9KQ6jhhGQTz2cVpbvLjYP-sNjmI6xO6ZlONAmdgVWkKoa7NKYM151Yh8IARYTg","correct":"{\"optionId\":\"Ks0Sx0BXjjgVMFBxCgQpCFt6wNOO4WvdSY8I\",\"optionDesc\":\"哼哈二将\"}","create_time":"27/1/2021 04:41:50","update_time":"27/1/2021 04:41:50","status":"1"},{"questionId":"1901441691","questionIndex":"5","questionStem":"木构建筑最害怕什么样的灾害？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVMVBxCgQpCEp8ApiXUjSO4EpeNw\",\"optionDesc\":\"火灾\"},{\"optionId\":\"Ks0Sx0BXjjgVMVBxCgQpC4VQzDQEy-B4-AIPeQ\",\"optionDesc\":\"风灾\"},{\"optionId\":\"Ks0Sx0BXjjgVMVBxCgQpCudlIaP1KccYjUAVoQ\",\"optionDesc\":\"水灾\"}]","questionToken":"Ks0Sx0BXjjgVMVAnGUwyXcJClSF2f46OS1mEysy-O2GF3lF4ObdY2mVFRpz5C_GVo4MaRr4u1GtBxWi3Rj7WBCaurLoWmw","correct":"{\"optionId\":\"Ks0Sx0BXjjgVMVBxCgQpCEp8ApiXUjSO4EpeNw\",\"optionDesc\":\"火灾\"}","create_time":"27/1/2021 04:41:26","update_time":"27/1/2021 04:41:26","status":"1"},{"questionId":"1901441692","questionIndex":"3","questionStem":"中国大部分元代木构建筑位于哪个省？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVMlBxCgQpCr6vxyu7JMzxAH0z\",\"optionDesc\":\"河南\"},{\"optionId\":\"Ks0Sx0BXjjgVMlBxCgQpCEzq_w29Tqd3Xfh8\",\"optionDesc\":\"山西\"},{\"optionId\":\"Ks0Sx0BXjjgVMlBxCgQpC_kIxEww4FOmTQSb\",\"optionDesc\":\"陕西\"}]","questionToken":"Ks0Sx0BXjjgVMlAhGUwyWlIm4Kgwnsm0vtupY_5EHnIsD7JScLPcHbNjjy7fBou30qYUvuHmxHzMA_JITVUW1BHUrQfytQ","correct":"{\"optionId\":\"Ks0Sx0BXjjgVMlBxCgQpCEzq_w29Tqd3Xfh8\",\"optionDesc\":\"山西\"}","create_time":"27/1/2021 04:49:51","update_time":"27/1/2021 04:49:51","status":"1"},{"questionId":"1901441693","questionIndex":"1","questionStem":"中国古代木构建筑屋顶的怪兽雕塑被统称为？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVM1BxCgQpCsNJStIdVl6bkg\",\"optionDesc\":\"走兽\"},{\"optionId\":\"Ks0Sx0BXjjgVM1BxCgQpCKUEXB45Jxhtyw\",\"optionDesc\":\"脊兽\"},{\"optionId\":\"Ks0Sx0BXjjgVM1BxCgQpCwu45oKBqC9JHQ\",\"optionDesc\":\"叫兽\"}]","questionToken":"Ks0Sx0BXjjgVM1AjGUwyXQ16mON0qeXIz0j6M6nyPsWd9NZVu427sLiH01d2naJyb-UyQaRTyVlezGak7Bu3IIYaPKzR5A","correct":"{\"optionId\":\"Ks0Sx0BXjjgVM1BxCgQpCKUEXB45Jxhtyw\",\"optionDesc\":\"脊兽\"}","create_time":"27/1/2021 04:48:50","update_time":"27/1/2021 04:48:50","status":"1"},{"questionId":"1901441694","questionIndex":"1","questionStem":"永乐宫三清殿屋顶琉璃瓦的主要颜色不包括？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVNFBxCgQpC0LNI8vPkLdOfMbK\",\"optionDesc\":\"黄色\"},{\"optionId\":\"Ks0Sx0BXjjgVNFBxCgQpCjL0JzrQiY64g5-0\",\"optionDesc\":\"蓝色\"},{\"optionId\":\"Ks0Sx0BXjjgVNFBxCgQpCHj_A7eZQrWeq69J\",\"optionDesc\":\"红色\"}]","questionToken":"Ks0Sx0BXjjgVNFAjGUwyXVKOvtJI_RYuidTWwxYRtZxS4RNdasLuntjuD4Qkp1VrZGTdwCPzQAuHWc2FM0SKmiIaNXcwug","correct":"{\"optionId\":\"Ks0Sx0BXjjgVNFBxCgQpCHj_A7eZQrWeq69J\",\"optionDesc\":\"红色\"}","create_time":"27/1/2021 04:37:38","update_time":"27/1/2021 04:37:38","status":"1"},{"questionId":"1901441695","questionIndex":"4","questionStem":"永乐宫中的“永乐”二字的来源是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVNVBxCgQpCg5NBh5BF2GXAC8\",\"optionDesc\":\"创建者名字\"},{\"optionId\":\"Ks0Sx0BXjjgVNVBxCgQpC2KxrlkHFMjNfHM\",\"optionDesc\":\"年号名\"},{\"optionId\":\"Ks0Sx0BXjjgVNVBxCgQpCGjUFDlvVNF9loY\",\"optionDesc\":\"当地地名\"}]","questionToken":"Ks0Sx0BXjjgVNVAmGUwyXegTx7Zd1Ytj9yP6T2FjXThcHc9jOuNW9fXAlBpKgkBmG0O3sw8xIm17goGpr6lez6Qn2rUUoA","correct":"{\"optionId\":\"Ks0Sx0BXjjgVNVBxCgQpCGjUFDlvVNF9loY\",\"optionDesc\":\"当地地名\"}","create_time":"27/1/2021 04:49:11","update_time":"27/1/2021 04:49:11","status":"1"},{"questionId":"1901441696","questionIndex":"2","questionStem":"永乐宫三清殿内的影壁不包括以下哪个功能？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVNlBxCgQpC152Awa2dH94e7t2\",\"optionDesc\":\"支撑屋顶\"},{\"optionId\":\"Ks0Sx0BXjjgVNlBxCgQpCHqNGH8ZTC8a5owD\",\"optionDesc\":\"隔断生活空间\"},{\"optionId\":\"Ks0Sx0BXjjgVNlBxCgQpClGZ-jPnnM8hJU_5\",\"optionDesc\":\"背衬三清像\"}]","questionToken":"Ks0Sx0BXjjgVNlAgGUwyWo8588OAsfDhyzwOYwbRho6AuU3wfZMpe6rHXKqUTMq4zpbLk-smQputBytcqUaB_HCzLOZiHw","correct":"{\"optionId\":\"Ks0Sx0BXjjgVNlBxCgQpCHqNGH8ZTC8a5owD\",\"optionDesc\":\"隔断生活空间\"}","create_time":"27/1/2021 04:48:49","update_time":"27/1/2021 04:48:49","status":"1"},{"questionId":"1901441697","questionIndex":"4","questionStem":"永乐宫搬迁的原因是？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVN1BxCgQpCku6_76yFi3OzGFj\",\"optionDesc\":\"地基面临塌方\"},{\"optionId\":\"Ks0Sx0BXjjgVN1BxCgQpCyPrw4LVPCe-tU_3\",\"optionDesc\":\"当地处于地震带\"},{\"optionId\":\"Ks0Sx0BXjjgVN1BxCgQpCHVShyQIGA32I-tm\",\"optionDesc\":\"修水库可能会淹没原址\"}]","questionToken":"Ks0Sx0BXjjgVN1AmGUwyWvpsU5IBFyAxxrGuqfclpsId5x4Gi2rR6JhMPQCgHlJV867Y8CIC5GdefFKVPxqiCfJkaiu21w","correct":"{\"optionId\":\"Ks0Sx0BXjjgVN1BxCgQpCHVShyQIGA32I-tm\",\"optionDesc\":\"修水库可能会淹没原址\"}","create_time":"27/1/2021 04:54:35","update_time":"27/1/2021 04:54:35","status":"1"},{"questionId":"1901441698","questionIndex":"1","questionStem":"以下哪个著名古代木构建筑不在山西？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVOFBxCgQpC8CkrZ3VZDPt5Jk\",\"optionDesc\":\"佛光寺大殿\"},{\"optionId\":\"Ks0Sx0BXjjgVOFBxCgQpCmUMHkxVnQwPLE0\",\"optionDesc\":\"南禅寺大殿\"},{\"optionId\":\"Ks0Sx0BXjjgVOFBxCgQpCPPqIQdQLc8pQLw\",\"optionDesc\":\"摩尼殿\"}]","questionToken":"Ks0Sx0BXjjgVOFAjGUwyWh2SZ_o6H6u2356tn2fUSVwHBtpyCsDmFXT3DVpCh3F6oayFfL-uRqcGsW5aCNnk9DvbGvByKA","correct":"{\"optionId\":\"Ks0Sx0BXjjgVOFBxCgQpCPPqIQdQLc8pQLw\",\"optionDesc\":\"摩尼殿\"}","create_time":"27/1/2021 04:36:49","update_time":"27/1/2021 04:36:49","status":"1"},{"questionId":"1901441699","questionIndex":"2","questionStem":"以下哪个山西著名古代建筑不属于元代建筑？","options":"[{\"optionId\":\"Ks0Sx0BXjjgVOVBxCgQpCqEcfjqCvDqg54a0\",\"optionDesc\":\"芮城永乐宫\"},{\"optionId\":\"Ks0Sx0BXjjgVOVBxCgQpCAVPA842_mqvQcnN\",\"optionDesc\":\"芮城广仁王庙\"},{\"optionId\":\"Ks0Sx0BXjjgVOVBxCgQpC-K88SK8bXy86aCi\",\"optionDesc\":\"洪洞广胜寺水神庙\"}]","questionToken":"Ks0Sx0BXjjgVOVAgGUwyXa21Vv7aiRCLkXg6gzZvmb9iSzQT8YsItL7RRnquYpCWmfdTOJQwM6YErRSVPP4k16KRX56Ocg","correct":"{\"optionId\":\"Ks0Sx0BXjjgVOVBxCgQpCAVPA842_mqvQcnN\",\"optionDesc\":\"芮城广仁王庙\"}","create_time":"27/1/2021 04:44:16","update_time":"27/1/2021 04:44:16","status":"1"},{"questionId":"1901441700","questionIndex":"5","questionStem":"以下哪个选项是永乐宫所在地曾用名？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvIuVncKsVPcqm23u0agRmLAhD\",\"optionDesc\":\"晋阳\"},{\"optionId\":\"Ks0Sx0BXjjmvIuVncKsVPOElfqWuay_w5zcO\",\"optionDesc\":\"长安\"},{\"optionId\":\"Ks0Sx0BXjjmvIuVncKsVPy44jSSLDkIjRL49\",\"optionDesc\":\"蒲州\"}]","questionToken":"Ks0Sx0BXjjmvIuUxY-MObbKS9LyRlkZXC758uhJEewZQza4YbEyvTVUVxrsZcnxxZwH8yXu8pcj593L50_b9pirJl7LXuA","correct":"{\"optionId\":\"Ks0Sx0BXjjmvIuVncKsVPy44jSSLDkIjRL49\",\"optionDesc\":\"蒲州\"}","create_time":"27/1/2021 04:40:03","update_time":"27/1/2021 04:40:03","status":"1"},{"questionId":"1901441701","questionIndex":"3","questionStem":"《朝元图》位于永乐宫的哪个建筑中？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvI-VncKsVPWaeu-7IZKwhej4\",\"optionDesc\":\"纯阳殿\"},{\"optionId\":\"Ks0Sx0BXjjmvI-VncKsVP4R-CriTieu-GEw\",\"optionDesc\":\"三清殿\"},{\"optionId\":\"Ks0Sx0BXjjmvI-VncKsVPDdflfwNOeXX9hw\",\"optionDesc\":\"重阳殿\"}]","questionToken":"Ks0Sx0BXjjmvI-U3Y-MOagzhoBHzGNLhwVN8K0s6LLCbs0y3KEwnmXgqQfYGsKCpgn83IQKAkZ6pLyDqjDTlDpLZGRrMRw","correct":"{\"optionId\":\"Ks0Sx0BXjjmvI-VncKsVP4R-CriTieu-GEw\",\"optionDesc\":\"三清殿\"}","create_time":"27/1/2021 04:44:59","update_time":"27/1/2021 04:44:59","status":"1"},{"questionId":"1901441702","questionIndex":"4","questionStem":"《朝元图》中有几位主神？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvIOVncKsVP1dXlbzP1UHqm59v\",\"optionDesc\":\"八位\"},{\"optionId\":\"Ks0Sx0BXjjmvIOVncKsVPcbCov9JryL8fLrF\",\"optionDesc\":\"三位\"},{\"optionId\":\"Ks0Sx0BXjjmvIOVncKsVPFff4XqToBBFD8zw\",\"optionDesc\":\"四位\"}]","questionToken":"Ks0Sx0BXjjmvIOUwY-MOakFYMNcL4DrtVblyr8WSBl--cn7ocqinpdal4tHRKMJ2dS0FR0kiQHMwhSgS-fYeqm8SO5QQ4w","correct":"{\"optionId\":\"Ks0Sx0BXjjmvIOVncKsVP1dXlbzP1UHqm59v\",\"optionDesc\":\"八位\"}","create_time":"27/1/2021 04:38:09","update_time":"27/1/2021 04:38:09","status":"1"},{"questionId":"1901441703","questionIndex":"3","questionStem":"《朝元图》中的神仙在做什么？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvIeVncKsVPbueQ8EL2hb4t2g\",\"optionDesc\":\"朝拜元朝统治者\"},{\"optionId\":\"Ks0Sx0BXjjmvIeVncKsVP6wI4VWvdo4hzXg\",\"optionDesc\":\"朝拜元始天尊\"},{\"optionId\":\"Ks0Sx0BXjjmvIeVncKsVPPDCQqaOpqGG5Ks\",\"optionDesc\":\"朝贺元旦\"}]","questionToken":"Ks0Sx0BXjjmvIeU3Y-MOaull00vMLH8_139kq5wfuyS7OJu5Fd92N5OnaPfBe4AZwb0dz5bQ3heWBRT_8_kki8UsFE57Gg","correct":"{\"optionId\":\"Ks0Sx0BXjjmvIeVncKsVP6wI4VWvdo4hzXg\",\"optionDesc\":\"朝拜元始天尊\"}","create_time":"27/1/2021 04:51:26","update_time":"27/1/2021 04:51:26","status":"1"},{"questionId":"1901441704","questionIndex":"3","questionStem":"《朝元图》中没有以下哪位神仙？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvJuVncKsVPKaDNXX6O4EUlyo\",\"optionDesc\":\"雷神\"},{\"optionId\":\"Ks0Sx0BXjjmvJuVncKsVP9J944sUhYEEe-g\",\"optionDesc\":\"齐天大圣\"},{\"optionId\":\"Ks0Sx0BXjjmvJuVncKsVPZ4gSdqWwI_2YT4\",\"optionDesc\":\"后土娘娘\"}]","questionToken":"Ks0Sx0BXjjmvJuU3Y-MOanEJl7eslG5yx4dg3o4E_MscpQW7PQiQqU8pcB3tUfv3-LaAk0XQA1RskSf_22cTkid1VpOEPA","correct":"{\"optionId\":\"Ks0Sx0BXjjmvJuVncKsVP9J944sUhYEEe-g\",\"optionDesc\":\"齐天大圣\"}","create_time":"27/1/2021 04:40:56","update_time":"27/1/2021 04:40:56","status":"1"},{"questionId":"1901441705","questionIndex":"1","questionStem":"《朝元图》中大约绘制了多少神仙？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvJ-VncKsVPHDIzMfdyfVLl-RF\",\"optionDesc\":\"800位\"},{\"optionId\":\"Ks0Sx0BXjjmvJ-VncKsVPX4HrvxnzDEF-YZO\",\"optionDesc\":\"100位\"},{\"optionId\":\"Ks0Sx0BXjjmvJ-VncKsVPy6ext_oi01koRcS\",\"optionDesc\":\"300位\"}]","questionToken":"Ks0Sx0BXjjmvJ-U1Y-MOaieU1nvHn75aFHSk7XA-OrwwJHb6lm94QI7TI3MgVYptREfGRRiNG2Wupb4VBZ8juqACbmG_pA","correct":"{\"optionId\":\"Ks0Sx0BXjjmvJ-VncKsVPy6ext_oi01koRcS\",\"optionDesc\":\"300位\"}","create_time":"27/1/2021 04:40:13","update_time":"27/1/2021 04:40:13","status":"1"},{"questionId":"1901441706","questionIndex":"1","questionStem":"传说中玉皇大帝与王母娘娘是什么关系？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvJOVncKsVP2ydvsHFzfnsRja9_A\",\"optionDesc\":\"同事关系\"},{\"optionId\":\"Ks0Sx0BXjjmvJOVncKsVPNhZZhCwsTQ6GV5bkg\",\"optionDesc\":\"兄妹关系\"},{\"optionId\":\"Ks0Sx0BXjjmvJOVncKsVPe883FpYFPuMwrjh8w\",\"optionDesc\":\"夫妻关系\"}]","questionToken":"Ks0Sx0BXjjmvJOU1Y-MObWO9JK2qFGiAR38tJJTPrFo7-cd_U2TTnugZ6l8OMjN4S_KiBeMvIqjMy5e5gamqqwiwgasQbQ","correct":"{\"optionId\":\"Ks0Sx0BXjjmvJOVncKsVP2ydvsHFzfnsRja9_A\",\"optionDesc\":\"同事关系\"}","create_time":"27/1/2021 04:51:29","update_time":"27/1/2021 04:51:29","status":"1"},{"questionId":"1901441707","questionIndex":"5","questionStem":"哪位天庭武将是“北方四圣”中的一员？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvJeVncKsVPG_oEFjHx1PXJD3C\",\"optionDesc\":\"卷帘大将\"},{\"optionId\":\"Ks0Sx0BXjjmvJeVncKsVPVBBTxL49FIAhErm\",\"optionDesc\":\"托塔天王\"},{\"optionId\":\"Ks0Sx0BXjjmvJeVncKsVP7aWhuwHYImI8Yhi\",\"optionDesc\":\"天蓬元帅\"}]","questionToken":"Ks0Sx0BXjjmvJeUxY-MObTYaTXY7IiFIWWzHdAv0LZH44w2YNBUM_pBLXfqUkKyudmCXSt_sE1pqdzPoUEzmu1ods5Y05Q","correct":"{\"optionId\":\"Ks0Sx0BXjjmvJeVncKsVP7aWhuwHYImI8Yhi\",\"optionDesc\":\"天蓬元帅\"}","create_time":"27/1/2021 04:43:54","update_time":"27/1/2021 04:43:54","status":"1"},{"questionId":"1901441708","questionIndex":"4","questionStem":"《朝元图》中哪个神仙有六只眼睛？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvKuVncKsVP4-nw4PtNKMsHlp3\",\"optionDesc\":\"仓颉\"},{\"optionId\":\"Ks0Sx0BXjjmvKuVncKsVPJDpHOdLv2cfBwQ9\",\"optionDesc\":\"紫光夫人\"},{\"optionId\":\"Ks0Sx0BXjjmvKuVncKsVPbJJZkBy3pJFptoz\",\"optionDesc\":\"孔子\"}]","questionToken":"Ks0Sx0BXjjmvKuUwY-MOasKwDIKi6F6ZgOH5dtJeOcsLpjvmPQyO7WQpkyAdFfcJXvVyZwKsymtGmJ8i7-OF-NaY1kcGCg","correct":"{\"optionId\":\"Ks0Sx0BXjjmvKuVncKsVP4-nw4PtNKMsHlp3\",\"optionDesc\":\"仓颉\"}","create_time":"27/1/2021 04:44:16","update_time":"27/1/2021 04:44:16","status":"1"},{"questionId":"1901441709","questionIndex":"1","questionStem":"《朝元图》中的财神是哪一位？","options":"[{\"optionId\":\"Ks0Sx0BXjjmvK-VncKsVPYRKc5S3RN6d4vzlZA\",\"optionDesc\":\"武财神关羽\"},{\"optionId\":\"Ks0Sx0BXjjmvK-VncKsVP75qR9gKnwmLmr0LDA\",\"optionDesc\":\"赵公明\"},{\"optionId\":\"Ks0Sx0BXjjmvK-VncKsVPMg-M_jgZIbIZYQGRQ\",\"optionDesc\":\"比干\"}]","questionToken":"Ks0Sx0BXjjmvK-U1Y-MOam062GXTq-n_3l5uUMFGXIrpmBWQ7lwR1IVf1KgLffmwHUfymyOD_3FXbUkDs4x6FpayMr2ACQ","correct":"{\"optionId\":\"Ks0Sx0BXjjmvK-VncKsVP75qR9gKnwmLmr0LDA\",\"optionDesc\":\"赵公明\"}","create_time":"27/1/2021 04:32:53","update_time":"27/1/2021 04:32:53","status":"1"},{"questionId":"1901441710","questionIndex":"3","questionStem":"传说中文昌帝君能够保佑什么？","options":"[{\"optionId\":\"Ks0Sx0BXjjmuIuVncKsVPfObyM8cfHzE7p5tuA\",\"optionDesc\":\"身体健康\"},{\"optionId\":\"Ks0Sx0BXjjmuIuVncKsVPwDx3KS2XnOOCm2rhg\",\"optionDesc\":\"功名利禄\"},{\"optionId\":\"Ks0Sx0BXjjmuIuVncKsVPDeMo62U1b0859pLDg\",\"optionDesc\":\"爱情婚姻\"}]","questionToken":"Ks0Sx0BXjjmuIuU3Y-MOahvFMpgUGD-HZhVnQw0nVghB3nmyUZ7vZHEzPGdpWwHtraj_xjQ7TwRILHgoHwUhrvjwojrCWg","correct":"{\"optionId\":\"Ks0Sx0BXjjmuIuVncKsVPwDx3KS2XnOOCm2rhg\",\"optionDesc\":\"功名利禄\"}","create_time":"27/1/2021 04:36:54","update_time":"27/1/2021 04:36:54","status":"1"},{"questionId":"1901441711","questionIndex":"3","questionStem":"哪个和太乙相关的神仙没有出现在朝元图中？","options":"[{\"optionId\":\"Ks0Sx0BXjjmuI-VncKsVP9FGjxJi6lSMAP9frQ\",\"optionDesc\":\"太乙真人\"},{\"optionId\":\"Ks0Sx0BXjjmuI-VncKsVPH3LLFcwcQb4dLhhfQ\",\"optionDesc\":\"太乙神\"},{\"optionId\":\"Ks0Sx0BXjjmuI-VncKsVPeu9YUZnlG-RRVi1-A\",\"optionDesc\":\"太乙救苦天尊\"}]","questionToken":"Ks0Sx0BXjjmuI-U3Y-MObXAc-NiXGbyfribzZ_0zpsaaoH-9TtsQjbbUvGRsgZ08MXpED7wx_1ZMpOmH7T6lx86_p3bF1A","correct":"{\"optionId\":\"Ks0Sx0BXjjmuI-VncKsVP9FGjxJi6lSMAP9frQ\",\"optionDesc\":\"太乙真人\"}","create_time":"27/1/2021 04:34:25","update_time":"27/1/2021 04:34:25","status":"1"},{"questionId":"1901441712","questionIndex":"5","questionStem":"福禄寿三星中长着硕大脑门的长者是？","options":"[{\"optionId\":\"Ks0Sx0BXjjmuIOVncKsVPY3Zwy9CA6qyCRuM\",\"optionDesc\":\"福星\"},{\"optionId\":\"Ks0Sx0BXjjmuIOVncKsVP0rrzA-eax904e_9\",\"optionDesc\":\"寿星\"},{\"optionId\":\"Ks0Sx0BXjjmuIOVncKsVPIBj5TGntSpDddnV\",\"optionDesc\":\"禄星\"}]","questionToken":"Ks0Sx0BXjjmuIOUxY-MObXikxUnE8jOhFQw_mgjTKmg0kOWMjxeOmg9IbR0fqdC5hQNti1hbBllyli68SCaiOkxhC5hxVQ","correct":"{\"optionId\":\"Ks0Sx0BXjjmuIOVncKsVP0rrzA-eax904e_9\",\"optionDesc\":\"寿星\"}","create_time":"27/1/2021 04:33:44","update_time":"27/1/2021 04:33:44","status":"1"},{"questionId":"1901441713","questionIndex":"3","questionStem":"以下哪个法器没有出现在《朝元图》壁画中？","options":"[{\"optionId\":\"Ks0Sx0BXjjmuIeVncKsVPxKmgYEj4pyfr80\",\"optionDesc\":\"轮盘\"},{\"optionId\":\"Ks0Sx0BXjjmuIeVncKsVPRI4URnfXhMB5OM\",\"optionDesc\":\"七宝炉\"},{\"optionId\":\"Ks0Sx0BXjjmuIeVncKsVPIk27JzT4s6rx-0\",\"optionDesc\":\"琵琶\"}]","questionToken":"Ks0Sx0BXjjmuIeU3Y-MOba3nZTwvt0PzFIUoxkInXnkx9-9ccPVVcoz-Vehrg2fXoBJKQfEvPFxTpa3UVZDyRmsY9lmwKw","correct":"{\"optionId\":\"Ks0Sx0BXjjmuIeVncKsVPxKmgYEj4pyfr80\",\"optionDesc\":\"轮盘\"}","create_time":"27/1/2021 04:51:12","update_time":"27/1/2021 04:51:12","status":"1"},{"questionId":"1901441714","questionIndex":"3","questionStem":"以下哪个神兽没有出现在《朝元图》壁画中？","options":"[{\"optionId\":\"Ks0Sx0BXjjmuJuVncKsVPUaeyg3nni-gQL6C\",\"optionDesc\":\"凤凰\"},{\"optionId\":\"Ks0Sx0BXjjmuJuVncKsVPxboESaPlnJx2HLl\",\"optionDesc\":\"麒麟\"},{\"optionId\":\"Ks0Sx0BXjjmuJuVncKsVPHvwSRMfCJ59QFgr\",\"optionDesc\":\"龙\"}]","questionToken":"Ks0Sx0BXjjmuJuU3Y-MObe8Eu8-2_2fAqTWgP6i6fsK4c9z73hVw8eSHl6oduHuJlLEFmlKetv2Dw-BMTra9jxjb-w-mdg","correct":"{\"optionId\":\"Ks0Sx0BXjjmuJuVncKsVPxboESaPlnJx2HLl\",\"optionDesc\":\"麒麟\"}","create_time":"27/1/2021 04:47:59","update_time":"27/1/2021 04:47:59","status":"1"},{"questionId":"190144171
