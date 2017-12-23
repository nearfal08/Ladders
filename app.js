// Require and start express, socket IO, and server.
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
// Helmet is a collection of security modules.
var helmet = require('helmet');
// League api wrapper
var riotApi = require("riot-api-nodejs");
const https = require("https"); 
// set the view engine to ejs
app.set('view engine', 'ejs');
// fake posts to simulate a database
const posts = [
  {
    id: 1,
    author: 'John',
    title: 'Templating with EJS',
    body: 'Blog post number 1'
  },
  {
    id: 2,
    author: 'Drake',
    title: 'Express: Starting from the Bottom',
    body: 'Blog post number 2'
  },
  {
    id: 3,
    author: 'Emma',
    title: 'Streams',
    body: 'Blog post number 3'
  },
  {
    id: 4,
    author: 'Cody',
    title: 'Events',
    body: 'Blog post number 4'
  }
]

// Use modules
app.use(express.static(__dirname + '/node_modules'));
app.use(helmet())

// Route the http request to the index file.
app.get('/', function (req, res, next) {
    //res.sendFile(__dirname + '/public/index.html');
    res.render('home', { posts: posts })
});

// When a client connects, log a message.
io.on('connection', function (client) {
    console.log('Client connected...');

    // When we recieve "join", emit "message" back to the client for them to do something with.
    client.on('join', function (data) {
        console.log(data);
        // This is where the real time alerts come in!!!
        //client.emit('messages', 'Hello from server');
    });

    // When we recieve "messages" from the client, broadcast the data. 
    // Broadcast sends to all clients.
    client.on('get_challenger', function (data) {
        //client.emit('broad', data);
        //client.broadcast.emit('broad', data);
        getChallengers(function(players) { 
            var arrayPlayers = Object.keys(players.entries).map(function (key) {
              return players.entries[key];
            });
            arrayPlayers.sort(function(a, b){
                var keyA = new Date(a.leaguePoints),
                    keyB = new Date(b.leaguePoints);
                // Compare the 2 dates
                if(keyA > keyB) return -1;
                if(keyA < keyB) return 1;
                return 0;
            });
            client.emit('challenger_players', arrayPlayers);
            client.broadcast.emit('challenger_players', arrayPlayers);
             
        }); 
        // databaseLogTest(function(result) {
        //     client.emit('saved_name', result.name); 
        // }); 
    });
    
    // NEEDS UPDATED. TIMER IS NOT CONSISTANT
    setInterval(function() {
        getChallengers(function(players) { 
            var arrayPlayers = Object.keys(players.entries).map(function (key) {
              return players.entries[key];
            });
            arrayPlayers.sort(function(a, b){
                var keyA = new Date(a.leaguePoints),
                    keyB = new Date(b.leaguePoints);
                // Compare the 2 dates
                if(keyA > keyB) return -1;
                if(keyA < keyB) return 1;
                return 0;
            });
            client.emit('challenger_players', arrayPlayers);
            client.broadcast.emit('challenger_players', arrayPlayers);
             
        });
    }, 30000); //time is in ms
});

// Tell server to listen on port ****.
server.listen(4200);

function databaseLogTest(callback) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ladder'
    });

    connection.connect()

    //    connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
    //      if (err) throw err
    //
    //      console.log('The solution is: ', rows[0].solution)
    //    })
    // Insert data
    var post = {
        name: 'Weston Walker'
    };
    connection.query('INSERT INTO node_test SET ?', post, function (error, results, fields) {
        if (error) throw error;
        console.log('Result: ', results);
    });

    connection.end()
    callback(post);
} 

function getChallengers(callback) {  
    var url = 'https://na1.api.riotgames.com/lol/league/v3/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=RGAPI-ba38d44e-2817-4646-b0c7-668989931337',
        result = null;
    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);
        console.log(body); 
        callback(body);
      });
    }); 
} 
 
