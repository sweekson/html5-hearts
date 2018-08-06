const path = require('path');
const express = require('express');

const app = express();
const env = process.env.NODE_ENV || 'development';
const dev = env === 'development';
const port = process.env.PORT || 5300;

app.use(express.static(path.resolve(__dirname, './public')));

app.listen(port, function (err) {
  console.log('Listening on port: ' + port);
});
