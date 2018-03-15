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
  host: "localhost",
  localAddress: "138.68.16.176",
  socketPath: "/var/run/mysqld/mysqld.sock",
  user: "mobileUser",
  password: process.env.mysqlPW,
  database: "libraryManager"
});

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

app.get('/api/getBooks', (req, res) => {
  var sql = "SELECT * FROM `books` ORDER BY bookTitle"
  con.query(sql, (err, result, fields) => {
    if (err) throw err;
    res.send(result)
  });
});

app.get('/api/getBooks/:bookNumbers', (req, res) => {
  let bookNumbers = req.params.bookNumbers;
  bookNumbers = bookNumbers.split("_");
  res.send(bookNumbers.map((bookNumber) => {
    var sql = "SELECT bookTitle, authorFName, authorLName FROM `books` WHERE bookID = '" + bookNumber + "' ORDER BY bookTitle"
    con.query(sql, (err, result, fields) => {
      if (err) throw err;
      console.log(result);
      return result;
    });
  }))
});

app.get('/api/getUser/:userId', (req, res) => {
  let userId = req.params.userId;
  let sql = "SELECT memberLName, password FROM members WHERE memberID = " + userId
  con.query(sql, (err, result, fields) => {
    if (err) {
      throw err;
    }
    res.send(result);
  })
})

app.get('/api/checkoutBook/:userId/:bookId', (req, res) => {
  let userId = req.params.userId;
  let bookId = req.params.bookId;
  let todayDate = new Date();
  let rentalDate = todayDate.getFullYear() + "-" + (todayDate.getMonth() + 1) + "-" + todayDate.getDate();
  let dueDate = new Date(Date.now() + 12096e5);
  dueDate = dueDate.getFullYear() + "-" + (dueDate.getMonth() + 1) + "-" + dueDate.getDate();

  let sql = "INSERT INTO rentals (memberID, bookID, rentalDate, dueDate, returned) VALUES ('" + userId + "', '" + bookId + "', '" + rentalDate + "', '" + dueDate + "', 'F')"
  con.query(sql, (err, result) => {
    if (err) {
      console.log("Error Inserting new rental");
      throw err;
    }
    let sql2 = "UPDATE books SET available = 'F' WHERE bookID = " + bookId
    con.query(sql2, (err, result) => {
      if (err) {
        console.log("Error Updating Book");
        throw err;
      }
      res.send(result)
    })
  })
})

app.get('/api/reserveBook/:userId/:bookId', (req, res) => {
  let userId = req.params.userId;
  let bookId = req.params.bookId;
  let todayDate = new Date();
  let rentalDate = todayDate.getFullYear() + "-" + (todayDate.getMonth() + 1) + "-" + todayDate.getDate();
  let dueDate = new Date(Date.now() + 12096e5);
  dueDate = dueDate.getFullYear() + "-" + (dueDate.getMonth() + 1) + "-" + dueDate.getDate();

  let sql = "INSERT INTO reservations (memberID, bookID, active) VALUES ('" + userId + "', '" + bookId + "', 'T')"
  con.query(sql, (err, result) => {
    if (err) {
      console.log("Error Inserting new rental");
      throw err;
    }
    res.send(result)

  })
})

app.get('/api/userInformation/:userId', (req, res) => {
  let userId = req.params.userId;
  let userInfo = {}

  let sql = "SELECT memberFName FROM members WHERE memberID = " + userId
  con.query(sql, (err, result, fields) => {
    if (err) {
      console.log("Error getting user's name");
      throw err;
    }
    userInfo.name = result[0].memberFName
    sql = "SELECT bookID, dueDate FROM rentals WHERE memberID = " + userId + " AND returned = 'F'"
    con.query(sql, (err, result, fields) => {
      userInfo.books = result;
      sql = "SELECT bookID FROM reservations WHERE memberID = " + userId + " AND active = 'T'"
      con.query(sql, (err, result, fields) => {
        userInfo.reservations = result;
        res.send(userInfo);
      })
    })

    // userInfo.name = result

  })
})

app.listen(PORT, ()=> {
  console.log('Server listening on port:' + PORT);
})
