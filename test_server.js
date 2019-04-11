var express = require('express');
var app = express();

var server = require('./index.js');

app.get('/', function (req, res) {
  server.get(req, res);
});

app.listen(3000, function () {
  console.log('Testing server listening on port 3000!');
});
