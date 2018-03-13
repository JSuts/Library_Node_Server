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
  socketPath: "/var/run/mysqld/mysqld.sock",
  user: "mobileUser",
  password: process.env.mysqlPW,
  database: "libraryManager"
});
// host: "localhost",
// port: "3306",

con.connect(function(err) {
  if (err) {
    console.log("Couldn't connect to databse... Error: ");
    throw err
  }
  console.log("Connected!");
});

app.get('/api/start', (req, res) => {
  console.log("Request called");
  res.send("Hello");
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
