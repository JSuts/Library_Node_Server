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
const OAuth = require('oauth').OAuth;
const config = require('../config.json');

var admin = require("firebase-admin");

var serviceAccount = require("../ogilvie-library-firebase-adminsdk-n7no1-0054e6cc40.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ogilvie-library.firebaseio.com"
});

var db = admin.firestore();

// Database Collection References
var arCol = db.collection('activeRentals');
var prCol = db.collection('previousRentals');
var usrCol = db.collection('users');
var bkCol = db.collection('books');


var oauth = new OAuth( // JAS - 1.24.18 - constructor function to build an OAuth object from data in config file... requires 7 properties
  config.request_token_url,
  config.access_token_url,
  config.consumer_key,
  config.consumer_secret,
  config.oauth_version,
  config.oauth_callback,
  config.oauth_signature
);

app.get('/api/getCredentials', (req, res) => {
  oauth.getOAuthRequestToken((err, oauth_token, oauth_token_secret, results) => {
    if (err) {
      console.log(err);
      res.send('Authentication failed');
    } else {
      res.send({
        oauth_token: oauth_token,
        oauth_token_secret: oauth_token_secret,
        redirectTo: config.authorization_url + '?oauth_token=' + oauth_token
      })
    }
  })
})








app.get('/api/start', (req, res) => {
  console.log("Request called");
  res.send("Hello");
});

//
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
  let sql = "SELECT bookTitle, authorFName, authorLName FROM `books` WHERE bookID = '"
  bookNumbers.forEach((bookNumber, i) => {
    if (i == bookNumbers.length - 1) {
      sql += bookNumber + "' ORDER BY bookTitle"
      con.query(sql, (err, result, fields) => {
        if (err) throw err;
        // result = JSON.stringify(result);
        console.log(result);
        res.send(result)
      });
    } else {
     sql += bookNumber + "' OR bookID = '"
   }
  })
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



function queryRentals() {
clearInterval(calcDatesInterval)
  arCol.get()
  .then((snapshot) => {
    console.log("New Data");
    function calculateDueDates() {
      console.log("Testing");
      var curTime = new Date();
      snapshot.forEach((doc) => {
        let bookRef = doc.data().bookId;
        let userRef = doc.data().userId;
        let dueDate = doc.data().dueDate;
        let dif = (dueDate - curTime)
        dueDate = dueDate.toString()
        dueDate = dueDate.substring(0, dueDate.lastIndexOf(":"));

        if (dif < (-2500)) {
          return;
        }
        console.log(dif);

        // if book is due within one week
        if (dif <= (week + 2500) && dif >= (week - 2500)) {
          console.log("NOTIFICATION: 1 WEEK");

          getUserInformation(userRef, bookRef)
          .then((response) => {
            let body = "Your book, " + response.bookTitle + ", is due in one week on " + dueDate

            sendNotification(response.token, body);
          })
          .catch((response) => {
            console.log(response);
          })
        }

        // if book is due within one day
        if (dif <= (day + 2500) && dif >= (day - 2500)) {
          console.log("NOTIFICATION: 1 DAY");
          getUserInformation(userRef, bookRef)
          .then((response) => {
            let body = "Your book, " + response.bookTitle + ", is due in one day on " + dueDate

            sendNotification(response.token, body);
          })
          .catch((response) => {
            console.log(response);
          })
        }

        // if book is due within one hour
        if (dif <= (hour + 2500) && dif >= (hour - 2500)) {
          console.log("NOTIFICATION: 1 HOUR");
          getUserInformation(userRef, bookRef)
          .then((response) => {
            let body = "Your book, " + response.bookTitle + ", is due in one hour on " + dueDate

            sendNotification(response.token, body);
          })
          .catch((response) => {
            console.log(response);
          })
        }

        //if  book is due right now
        if (dif <= 2500 && dif >= (-2500)) {
          console.log("NOTIFICATION: DUE NOW");
          getUserInformation(userRef, bookRef)
          .then((response) => {
            let body = "Your book, " + response.bookTitle + ", is due right now. Please return it."

            sendNotification(response.token, body);
          })
          .catch((response) => {
            console.log(response);
          })
        }

      }) // end of forEach
    } // end of calculateDueDates function
    calcDatesInterval = setInterval(calculateDueDates, 5000);
    calculateDueDates(); // to execute the query wihout initial delay
  })
  // TODO: change to 24 hours
  setTimeout(queryRentals, 15000); // timeout for 20 seconds
}
// queryRentals(); // to execute the query without initial delay




app.listen(PORT, ()=> {
  console.log('Server listening on port:' + PORT);
})
