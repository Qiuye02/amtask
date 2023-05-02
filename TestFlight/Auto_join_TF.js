/*************************************

项目名称：自动加入TF
脚本作者：DecoAri
引用链接：https://github.com/DecoAri/JavaScript/blob/main/Surge/TF_keys.js

**************************************

 Boxjs订阅链接：https://raw.githubusercontent.com/githubdulong/Script/master/boxjs.json

 使用方法: 订阅以上Boxjs链接，填写你要加入的TF的ID，（ID为链接 https://testflight.apple.com/join/LPQmtkUs 的join后的字符串（也就是此例子的“LPQmtkUs”）⚠️：支持无限个TF链接，每个链接需要用英文逗号“,”隔开（如： LPQmtkUs,Hgun65jg,8yhJgv）

 ⚠️提示：
 1: 除beta已满的其他情况才会通知，可自行看日志
 2: 报错1012是因为未执行使用方法的步骤2
 3: 已支持同时挤🚪，支持无限TF链接
 4: 获取tf信息的脚本与TestFlight账户管理模块冲突，使用的时候先关一下该模块

**************************************

[task_local]
# 自动加入TF(60分钟执行一次)
*/60 * * * ? https://raw.githubusercontent.com/chxm1023/Task/main/TestFlight/Auto_join_TF.js, tag=自动加入TF, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/testflight.png, enabled=true

[rewrite_local]
# 获取TF信息
^https?:\/\/testflight\.apple\.com\/v3\/accounts/.*\/apps$ url script-request-header https://raw.githubusercontent.com/chxm1023/Task/main/TestFlight/TF_keys.js
# APP_ID获取
^https?:\/\/testflight\.apple\.com\/join\/(.*) url script-request-header https://raw.githubusercontent.com/chxm1023/Task/main/TestFlight/TF_keys.js

[MITM]
hostname = testflight.apple.com

*************************************/


!(async () => {
ids = $persistentStore.read('APP_ID')
if (ids == '') {
  $notification.post('所有TF已加入完毕','请手动禁用该模块','')
} else {
  ids = ids.split(',')
  for await (const ID of ids) {
    await autoPost(ID)
  }
}
$done()
})();

function autoPost(ID) {
  let Key = $persistentStore.read('key')
  let testurl = 'https://testflight.apple.com/v3/accounts/' + Key + '/ru/'
  let header = {
    'X-Session-Id': `${$persistentStore.read('session_id')}`,
    'X-Session-Digest': `${$persistentStore.read('session_digest')}`,
    'X-Request-Id': `${$persistentStore.read('request_id')}`,
    'User-Agent': `${$persistentStore.read('tf_ua')}`,
  }
  return new Promise(function(resolve) {
    $httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
      if (error === null) {
        if (resp.status == 404) {
          ids = $persistentStore.read('APP_ID').split(',')
          ids = ids.filter(ids => ids !== ID)
          $persistentStore.write(ids.toString(),'APP_ID')
          console.log(ID + ' ' + '不存在该TF，已自动删除该APP_ID')
          $notification.post(ID, '不存在该TF', '已自动删除该APP_ID')
          resolve()
        } else {
          let jsonData = JSON.parse(data)
          if (jsonData.data == null) {
            console.log(ID + ' ' + jsonData.messages[0].message)
            resolve();
          } else if (jsonData.data.status == 'FULL') {
            console.log(jsonData.data.app.name + ' ' + ID + ' '+ jsonData.data.message)
            resolve();
          } else {
            $httpClient.post({url: testurl + ID + '/accept',headers: header}, function(error, resp, body) {
              let jsonBody = JSON.parse(body)
              $notification.post(jsonBody.data.name, 'TestFlight加入成功', '')
              console.log(jsonBody.data.name + ' TestFlight加入成功')
              ids = $persistentStore.read('APP_ID').split(',')
              ids = ids.filter(ids => ids !== ID)
              $persistentStore.write(ids.toString(),'APP_ID')
              resolve()
            });
          }
        }
      } else {
        if (error =='The request timed out.') {
          resolve();
        } else {
          $notification.post('自动加入TF', error,'')
          console.log(ID + ' ' + error)
          resolve();
        }
      }
    })
  })
}
