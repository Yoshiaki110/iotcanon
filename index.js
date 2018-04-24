var setting = require('./setting.js');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var TWILIO_CALL_URL = setting.TWILIO_CALL_URL;
var LINE_TOKEN = setting.LINE_TOKEN;
var LINE_ID = setting.LINE_ID;

var app = express();
var values = [];
var calls = [];
var lineCalls = [];
var lastMinutes = 100;     // 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('port', (process.env.PORT || 5000));

// テスト用
app.post('/test', function(req, res) {
  console.log('<>POST /test');
  console.log(req.body);
  res.sendStatus(200);
});

// 設定ファイルの読み込み
app.get('/api/setting', function(req, res) {
  console.log('<>GET /api/setting');
//  console.log(req);
  var id = req.url.split('?')[1];
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  res.header('Content-Type', 'application/json; charset=utf-8');
  //res.sendStatus(200);
  res.send(json);
});
// 設定ファイルの書き込み
app.post('/api/setting', function(req, res) {
  console.log('<>POST /api/setting');
//  console.log(req.body);
  res.sendStatus(200);
  fs.writeFile(req.body.id + '.json', JSON.stringify(req.body, null, '  '));
  console.log(req.body.id + '.json');
});

// Webiotからのデータを保管
app.post('/api/webiot', function(req, res) {
  console.log('<>POST /api/webiot');
  var key = req.body.id;
  var obj = {"id": key, "temp": 0, "hum": 0, "pres": 0};
  if (typeof(values[key]) != "undefined") {
    obj = values[key]
  }
  switch (req.body.datatype) {
  case 'temperature':
    obj.temp = req.body.value;
    break;
  case 'humidity':
    obj.hum = req.body.value;
    break;
  case 'pressure':
    obj.pres = req.body.value;
    break;
  }
  values[key] = obj;
  console.log(req.body.id + ' = ' + req.body.value);
  res.sendStatus(200);
});
// 人感センサのイベント
app.post('/api/move', function(req, res) {
  console.log('<>POST /api/move');
  var id = req.body.id;
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  res.sendStatus(200);
  var now = new Date(Date.now() + 9*60*60*1000);    // カッコ悪いけど
  var hour = now.getUTCHours();                     // UTCで動いているのをJSTにしてる
  var dayOfWeek = now.getDay();
  var call = false;
  console.log(' dayOfWeek:' + dayOfWeek + ' hour:' + hour);
  switch (dayOfWeek) {
  case 0:
    call = json.sun[hour];
    break;
  case 1:
    call = json.mon[hour];
    break;
  case 2:
    call = json.tue[hour];
    break;
  case 3:
    call = json.wed[hour];
    break;
  case 4:
    call = json.thu[hour];
    break;
  case 5:
    call = json.fri[hour];
    break;
  case 6:
    call = json.sat[hour];
    break;
  }
  console.log(' call:' + call);
  console.log(' enable:' + json.enable + ' phone:' + json.phone);
  if (call && json.enable && json.phone != '') {
    twilio(json.phone);
  }
  if (call && json.lineid != '') {
    line(id, LINE_ID);
    line(id, json.lineid);
  }
});
// LINEからのイベント
app.post('/api/line', function(req, res) {
  console.log('<>POST /api/line');
  console.log(req.body);
  for (var i = 0; i < req.body.events.length; i++) {
//    console.log(req.body.events[0].type);
    if (req.body.events[i].type === 'message') {
      console.log('  ' + req.body.events[i].source.userId + ' ' + req.body.events[i].replyToken + ' ' + req.body.events[i].message.text);
      var id = req.body.events[i].message.text;
      if (id == 'BPCM01' || id == 'BPCM02' || id == 'BPCM03') {
        var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
        json.lineid = req.body.events[i].source.userId;
        fs.writeFile(id + '.json', JSON.stringify(json, null, '  '));
        var msg = '登録完了\n異常があったらお知らせするね';
        lineReply(req.body.events[i].replyToken, msg);
      } else {
        var msg = '人感センサーのIDが違うよ。\n「BPCM99」のような６桁の英数字を送信してね';
        lineReply(req.body.events[i].replyToken, msg);
      }
    }
  }
  res.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

// １時間に１回Googleシートに書き込み
function loop() {
  var now = new Date(Date.now() + 9*60*60*1000);
  var hour = now.getUTCHours();
  var minutes = now.getMinutes();
//  var minutes = now.getSeconds();     // 秒ごと(DEBUG)
  console.log("<>loop " + hour + ':' + lastMinutes + " > " + minutes);
  if (lastMinutes > minutes && minutes == 0) {	// 毎時0分に
    console.log("  0 minute!!");
    for (key in values) {
      console.log(values[key]);
      if (values[key].temp == 0 && values[key].hum == 0 && values[key].pres == 0) {
        console.log("  " + key + " no data");
        continue;
      }
      console.log("  " + key + " send data");
      var options = {
        uri: "https://script.google.com/macros/s/AKfycbz7IbdIPHUeF2pu_CYT8QQgV5yesTTrjejHbNdvUEC9LWU7jiQ/exec",
        headers: {
          "Content-type": "application/json",
        },
        json: values[key]
      };
      request.post(options, function(error, response, body){});
      values[key] = {"id": key, "temp": 0, "hum": 0, "pres": 0};
    }
  }
  lastMinutes = minutes;
  setTimeout(loop, 55*1000);	// 約１分ごと
//  setTimeout(loop, 900);     // 約１秒ごと(DEBUG)
}

// 指定の番号にtwolioを使って電話する
function twilio(phone) {
  var now = Date.now();
  if (typeof(calls[phone]) != "undefined") {
    var past = now - calls[phone];
    if (past < 3*60*1000) {        // ３分以内は再電話しない
      console.log("  now:" + now + " last:" + calls[phone] + " past:" + past + " no call");
      return;
    }
    console.log("  now:" + now + " last:" + calls[phone] + " past:" + past + " call");
  }
  calls[phone] = now;
  var headers = {
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  var body = 'NumberToCall=%2B81' + phone.substr( 1);
  console.log(body);
  var url = TWILIO_CALL_URL;
  request({
    url: url,
    method: 'POST',
    headers: headers,
    body: body,
    json: false
  });
}

// LINEする通知
function line(id, lineid) {
  var now = Date.now();
  if (typeof(lineCalls[lineid]) != "undefined") {
    var past = now - lineCalls[lineid];
    if (past < 3*60*1000) {        // ３分以内は再電話しない
      console.log("  now:" + now + " last:" + lineCalls[lineid] + " past:" + past + " no call");
      return;
    }
    console.log("  now:" + now + " last:" + lineCalls[lineid] + " past:" + past + " call");
  }
  lineCalls[lineid] = now;

  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + LINE_TOKEN
  }
  var body = {
    'to': lineid,
    'messages': [{
      'type': 'text',
      'text': 'オフィスに侵入者発見\n' + id
    }]
  }
  var url = 'https://api.line.me/v2/bot/message/push';
  request({
    url: url,
    method: 'POST',
    headers: headers,
    body: body,
    json: true
  });
}
function lineReply(replyToken, msg) {
      var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_TOKEN
      }
      var body = {
        'replyToken': replyToken,
        'messages': [{
          'type': 'text',
          'text': msg
        }]
      }
      var url = 'https://api.line.me/v2/bot/message/reply';
      request({
        url: url,
        method: 'POST',
        headers: headers,
        body: body,
        json: true
      });

}

setTimeout(loop, 1000);

/*
{
  "id" : "XXXX",
  "sensor" : {
    "temp" : 12,
    "hum" : 34,
    "pres" : 56,
  }
}
*/