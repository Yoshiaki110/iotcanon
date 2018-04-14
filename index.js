var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
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
  setTimeout(postGDoc, 60000);
}
setTimeout(postGDoc, 1000);

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
