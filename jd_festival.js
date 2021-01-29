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
jd_festival.js
 

Tabs

8

No wrap
1
/*
2
京东手机年终奖
3
活动时间：2021年1月26日～2021年2月8日
4
更新地址：https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_festival.js
5
活动入口：https://shopping-festival.m.jd.com
6
已支持IOS双京东账号, Node.js支持N个京东账号
7
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
8
============Quantumultx===============
9
[task_local]
10
#京东手机年终奖
11
15 0 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_festival.js, tag=京东手机年终奖, img-url=https://raw.githubusercontent.com/yogayyy/Scripts/master/Icon/shylocks/jd_festival2.jpg, enabled=true
12
​
13
================Loon==============
14
[Script]
15
cron "15 0 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_festival.js, tag=京东手机年终奖
16
​
17
===============Surge=================
18
京东手机年终奖 = type=cron,cronexp="15 0 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_festival.js
19
​
20
============小火箭=========
21
京东手机年终奖 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_festival.js, cronexpr="15 0 * * *", timeout=3600, enable=true
22
 */
23
const $ = new Env('京东手机年终奖');
24
​
25
const notify = $.isNode() ? require('./sendNotify') : '';
26
//Node.js用户请在jdCookie.js处填写京东ck;
27
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
28
//IOS等用户直接用NobyDa的jd cookie
29
let cookiesArr = [], cookie = '', message;
30
const randomCount = $.isNode() ? 20 : 5;
31
​
32
const inviteCodes = [
33
  `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
34
    `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
35
          `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
36
            `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
37
                  `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
38
                    `5ae9a7ec-e7dc-43cb-b058-229667efb2d5@dc6e06ea-9c14-47c0-87e2-1e1b87a8418a@0d982cea-0401-49b2-8f43-b2bc92e307a1@0d982cea-0401-49b2-8f43-b2bc92e307a1@c091132cd-c98c-4837-a90f-5a6079905cdd@e91899b6-2108-4af1-bf8e-1d62032f732d`,
39
                        ];
40
​
41
if ($.isNode()) {
42
  Object.keys(jdCookieNode).forEach((item) => {
43
    cookiesArr.push(jdCookieNode[item])
44
  })
45
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
@xiaoyanzi1991
Propose changes
Commit summary
Create jd_festival.js
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
