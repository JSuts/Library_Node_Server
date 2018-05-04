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
const bodyParser = require('body-parser');


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

var twitterCredentials = {
  oauth_token: "",
  oauth_token_secret: "",
  access_token: "",
  access_token_secret: "",
  twitter_id: ""
}


app.use(bodyParser.urlencoded());

app.use(bodyParser.json());



app.get('/api/getCredentials', (req, res) => {
    oauth.getOAuthRequestToken((error, oauth_token, oauth_token_secret, results) => { // JAS - 1.25.18 - method of oauth that will give us a request token and request secret
      if (error) {
        console.log(error);
        res.send('Authentication Failed... Error: ' + error); // JAS - 1.25.18 - giving the user a failed response
      } else {
        twitterCredentials.oauth_token = oauth_token;
        twitterCredentials.oauth_token_secret = oauth_token_secret;
        res.redirect(config.authorization_url + '?oauth_token=' + oauth_token); // JAS - 1.25.18 - redirecting the user to the authorization_url with the oauth_token
      } // JAS - 1.26.18 - end of else no errors
    }); // JAS - 1.25.18 - end of getOAuthRequestToken method
  });


  app.get('/api/request_token', (req, res) => {
    if (!(twitterCredentials.oauth_token && twitterCredentials.oauth_token_secret && req.query.oauth_verifier)) { // JAS - 1.26.18 - checking credentials... if any ONE of those are missing, invalid request
      // return callback('Request does not have all required keys.');
      res.send('Request does not have all required keys.')
    }
    oauth.getOAuthAccessToken(twitterCredentials.oauth_token, twitterCredentials.oauth_token_secret, req.query.oauth_verifier, (errors, oauth_access_token, access_token_secret, results) => {
      if (errors) {
        // return callback(errors);
        res.send(errors)
      }
    var url = "https://api.twitter.com/1.1/account/verify_credentials.json"; // JAS - 1.30.18 - twitter's verify_credentials url
    oauth.get(url, oauth_access_token, access_token_secret, (error, data) => { // JAS - 1.30.18 - http get request to the twitter url to verify the user's credentials
      if (error) { // JAS - 1.30.18 - failure
        console.log("Error from authenticator.authenticate: " + error);
        res.send(error)
        // return callback(error); // JAS - 1.30.18 - returning the error to the callback function from where it was called from
      } else { // JAS - 1.30.18 - success
        data = JSON.parse(data); // JAS - 1.30.18 - parsing the data returned into JSON format in the data variable
        // console.log("JSON Data from authenticator.authenticate: "); // JAS - 1.30.18 - logging the data returned.
        // console.log(data);
        /* JAS - 1.30.18 - storing values in the twitterCredentials JSON variable  */
        twitterCredentials.access_token = oauth_access_token;
        twitterCredentials.access_token_secret = access_token_secret;
        twitterCredentials.twitter_id = data.id_str;
        res.send(twitterCredentials)
        // callback(false); // JAS - 1.30.18 - ends current authenticate function by calling the callback function from the index page
      }
    }); // JAS - 1.30.18 - end of GET verify_credentials request
  }); // JAS - 1.30.18 - end of getOAuthAccessToken function
}) // JAS - 1.26.18 - end of authenticate function)


app.post('/api/getCurrentUser/:userId', (req, res) => {
  let url = "https://api.twitter.com/1.1/users/lookup.json?id=" + req.params.userId
  let access_token = req.body.access_token;
  let oauth_access_token_secret = req.body.oauth_access_token_secret;
  // let body = {
  //   req.params.userId
  // }
    oauth.get.call(oauth, url, access_token, oauth_access_token_secret, (err, data) => {
      if (err) {
        res.send(err)
      } else {
        console.log(data);
        res.send(data)
      }
    }); // JAS - 2.1.18 - Taking oauth object, url, access_token, oauth_access_token_secret, and callback function
  // oauth.post.call(oauth, "https://api.twitter.com/1.1/users/lookup.json", access_token, oauth_access_token_secret, body, callback);
})

app.get('/api/help', (req, res) => {
  let url = "https://api.twitter.com/1.1/users/lookup.json?user_id=784241744409788416"
  let access_token_secret = "784241744409788416-Uo1qAJTRRpLLFdjUaRXYbtfYYTgHyF2"
  let access_token = "j6F8QsZXB0xNvGpK8UCiAXMgD3qgmTTrArVhmKCxDD1Ra";
  oauth.get.call(oauth, url, access_token, oauth_access_token_secret, (err, data) => {
    if (err) {
      res.send(err)
    } else {
      console.log(data);
      res.send(data)
    }
  }); // JAS - 2.1.18 - Taking oauth object, url, access_token, oauth_access_token_secret, and callback function

})




// app.get('/api/getCredentials', (req, res) => {
//   oauth.getOAuthRequestToken((err, oauth_token, oauth_token_secret, results) => {
//     if (err) {
//       console.log(err);
//       res.send('Authentication failed');
//     } else {
//       res.send({
//         oauth_token: oauth_token,
//         oauth_token_secret: oauth_token_secret,
//         redirectTo: config.authorization_url + '?oauth_token=' + oauth_token
//       })
//     }
//   })
// })
//
// app.get('/api/request_token', (req, res) => {
//   // console.log(req);
//   res.send("Yes hello")
// })








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
