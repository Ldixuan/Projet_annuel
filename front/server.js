const express = require('express');
 
const app = express();
 
app.use(express.static('./dist'));
 
app.get('/', function (req, res) {
  res.render('dist/index.html');
});
 
app.listen(process.env.PORT || 8080);
 
console.log(`Running on port ${process.env.PORT || 8080}`)