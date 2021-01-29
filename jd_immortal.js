Skip to content
Search or jump to…

Pull requests
Issues
Marketplace
Explore
 
@xiaoyanzi1991 
269569205
/
jd_scripts
1
19
Code
Issues
1
Pull requests
2
Actions
Projects
Wiki
Security
Insights
You’re making changes in a project you don’t have write access to. Submitting a change will write it to a new branch in your fork xiaoyanzi1991/jd_scripts-1, so you can send a pull request.
jd_scripts
/
jd_immortal.js
 

Tabs

8

No wrap
1
/*
2
京东神仙书院
3
活动时间:2021-1-20至2021-2-5
4
增加自动积分兑换京豆(条件默认为：至少700积分，1.4倍率)
5
暂不加入品牌会员，需要自行填写坐标，用于做逛身边好店任务
6
环境变量：JD_IMMORTAL_LATLON(经纬度)
7
示例：JD_IMMORTAL_LATLON={"lat":33.1, "lng":118.1}
8
boxjs IMMORTAL_LATLON
9
活动入口：京东APP我的-神仙书院
10
地址：https://h5.m.jd.com//babelDiy//Zeus//4XjemYYyPScjmGyjej78M6nsjZvj//index.html?babelChannel=ttt9
11
已支持IOS双京东账号,Node.js支持N个京东账号
12
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
13
============Quantumultx===============
14
[task_local]
15
#京东神仙书院
16
20 8 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal.js, tag=京东神仙书院, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true
17
​
18
================Loon==============
19
[Script]
20
cron "20 8 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal.js, tag=京东神仙书院
21
​
22
===============Surge=================
23
京东神仙书院 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal.js
24
​
25
============小火箭=========
26
京东神仙书院 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_immortal.js, cronexpr="20 8 * * *", timeout=3600, enable=true
27
 */
28
const $ = new Env('京东神仙书院');
29
​
30
const notify = $.isNode() ? require('./sendNotify') : '';
31
//Node.js用户请在jdCookie.js处填写京东ck;
32
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
33
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
34
const randomCount = $.isNode() ? 20 : 5;
35
let scoreToBeans = $.isNode()?(process.env.JD_IMMORTAL_SCORE || 700):$.getdata('scoreToBeans') || 700; //兑换多少数量的京豆（20或者1000），0表示不兑换，默认兑换20京豆，如需兑换把0改成20或者1000，或者'商品名称'(商品名称放到单引号内)即可
36
​
37
//IOS等用户直接用NobyDa的jd cookie
38
let cookiesArr = [], cookie = '', message;
39
if ($.isNode()) {
40
  Object.keys(jdCookieNode).forEach((item) => {
41
    cookiesArr.push(jdCookieNode[item])
42
  })
43
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
44
} else {
45
  let cookiesData = $.getdata('CookiesJD') || "[]";
@xiaoyanzi1991
Propose changes
Commit summary
Create jd_immortal.js
Optional extended description
Add an optional extended description…
  
 Waiting for your fork…
© 2021 GitHub, Inc.
Terms
Privacy
Security
Status
Docs
Contact GitHub
Pricing
API
Training
Blog
About
