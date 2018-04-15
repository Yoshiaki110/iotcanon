var setting = require('./setting.js');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var TWILIO_CALL_URL = setting.TWILIO_CALL_URL;
var TWILIO_CALL_BODY = setting.TWILIO_CALL_BODY;

var app = express();
var values = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('port', (process.env.PORT || 5000));


app.post('/test', function(req, res) {
  console.log('<>POST /test');
  console.log(req.body);
  res.sendStatus(200);
});
app.get('/api/setting', function(req, res) {
  console.log('<>GET /api/setting');
//  console.log(req);
  var id = req.url.split('?')[1];
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  res.header('Content-Type', 'application/json; charset=utf-8');
  //res.sendStatus(200);
  res.send(json);
});
app.post('/api/setting', function(req, res) {
  console.log('<>POST /api/setting');
//  console.log(req.body);
  res.sendStatus(200);
  fs.writeFile(req.body.id + '.json', JSON.stringify(req.body, null, '  '));
  console.log(req.body.id + '.json');
});
app.post('/api/webiot', function(req, res) {
  console.log('<>POST /api/webiot');
  var key = req.body.id;
  var obj = {"id": key, "temp": 0, "hum": 0, "pres": 0};
  if (typeof(values[key]) != "undefined") {
    obj = values[key]
  }
  switch (req.body.datatype) {
  case 'temp':
    obj.temp = req.body.value;
    break;
  case 'hum':
    obj.hum = req.body.value;
    break;
  case 'pres':
    obj.pres = req.body.value;
    break;
  }
  values[key] = obj;
  console.log(req.body.id + ' = ' + req.body.value);
  res.sendStatus(200);
});
app.post('/api/move', function(req, res) {
  console.log('<>POST /api/move');
  var id = req.body.id;
  var json = JSON.parse(fs.readFileSync(id + '.json', 'utf8'));
  res.sendStatus(200);
  if (json.enable && json.phone != '') {
    var date = new Date();
    var hour = date.getHours();
    var dayOfWeek = date.getDay();
    var call = false;
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
    if (call) {
      twilio(json.phone);
    }
  }
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

function postGDoc() {
  for (key in values) {
//    console.log('key:' + key + ' value:' + values[key]);
    console.log(key);
    console.log(values[key]);
    var options = {
      uri: "https://script.google.com/macros/s/AKfycbz7IbdIPHUeF2pu_CYT8QQgV5yesTTrjejHbNdvUEC9LWU7jiQ/exec",
      headers: {
        "Content-type": "application/json",
      },
      json: values[key]
    };
    request.post(options, function(error, response, body){});
  }
  setTimeout(postGDoc, 60*60*1000);
}

function twilio(phone) {
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
setTimeout(postGDoc, 2*60*1000);

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
