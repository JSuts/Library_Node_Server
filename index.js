/*
  Mobile Library Application Project

  Author: Jake Sutter
  Date: 2.6.18

  File: index.js
  Purpose: Holds main server functionality
*/
const express = require('express');
const app = express();
const PORT = 8081;
const mysql = require('mysql');



var con = mysql.createConnection({
  host: "10.138.20.168",
  user: "mobileUser",
  password: "MobileApp",
  database: "libraryManager"
});
// port: "3306",
// socketPath: "/var/run/mysqld/mysqld.sock",

con.connect(function(err) {
  if (err) {
    console.log("Couldn't connect to databse... Error: ");
    throw err
  }
  console.log("Connected!");
});

app.get('/getBooks', (req, res) => {
  var sql = "SELECT * FROM `books` ORDER BY bookTitle"
  con.query(sql, (err, result, fields) => {
    if (err) throw err;
    console.log("A Response was sent.");
    res.send(result)
  });
});

// app.get('/getUser/:userName', (req, res) => {
//   var sql = "SELECT * FROM "
// })

app.listen(PORT, ()=> {
  console.log('Server listening on port:' + PORT);
})
