var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('port', (process.env.PORT || 5000));


app.post('/', function(request, response) {
  console.log('post');
//  console.log(request);
  console.log(request.body);
  response.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
