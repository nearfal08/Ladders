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
var mysql = require('mysql');
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
app.use("/public", express.static(__dirname + "/public"));
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
        var connection = dbConnection();
        connection.connect(); 
        getRankings(connection, function(players) { 
            connection.end();   
//            var arrayPlayers = Object.keys(players).map(function (key) {
//              return players[key];
//            });
//            arrayPlayers.sort(function(a, b){
//                var keyA = new Date(a.leaguePoints),
//                    keyB = new Date(b.leaguePoints);
//                // Compare the 2 dates
//                if(keyA > keyB) return -1;
//                if(keyA < keyB) return 1;
//                return 0;
//            });  
            console.log(players);
            
            client.emit('challenger_players', players);
            client.broadcast.emit('challenger_players', players);
             
        }); 
        // databaseLogTest(function(result) {
        //     client.emit('saved_name', result.name); 
        // }); 
    });
    
    // NEEDS UPDATED. TIMER IS NOT CONSISTANT
    setInterval(function() {
        var connection = dbConnection();
        connection.connect(); 
        getRankings(connection, function(players) {   

            connection.end(); 
//            var arrayPlayers = Object.keys(players.entries).map(function (key) {
//              return players.entries[key];
//            });
//            arrayPlayers.sort(function(a, b){
//                var keyA = new Date(a.leaguePoints),
//                    keyB = new Date(b.leaguePoints);
//                // Compare the 2 dates
//                if(keyA > keyB) return -1;
//                if(keyA < keyB) return 1;
//                return 0;
//            });
            console.log(players);
            
            client.emit('challenger_players', players);
            client.broadcast.emit('challenger_players', players);
             
        });
    }, 30000); //time is in ms
});

// Tell server to listen on port ****.
server.listen(4200);

function dbConnection() { 
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ladder'
    }); 
 
    return connection;
}

function updateRankings(arrayPlayers) { 
    // pull from api
    //getApiRankings(function(players) {
//            var arrayPlayers = Object.keys(players.entries).map(function (key) {
//              return players.entries[key];
//            });
//            arrayPlayers.sort(function(a, b){
//                var keyA = new Date(a.leaguePoints),
//                    keyB = new Date(b.leaguePoints);
//                // Compare the 2 dates
//                if(keyA > keyB) return -1;
//                if(keyA < keyB) return 1;
//                return 0;
//            });
//    var connection = dbConnection();
//    connection.connect();
    
//    wipeRankings(connection);
//    storeRankings(connection, arrayPlayers);
//
//    connection.end();
    //})
 
 
}

function wipeRankings(connection) {
    // Delete live rankings
    connection.query('DELETE FROM lol_live_standings', [], function (error, results, fields) {
        if (error) throw error;
        console.log('Result: ', results);
    });  
}

function storeRankings(connection, rankings) { 
    for (var i = 0, len = rankings.length; i < len; i++) { 
        var player = {
            rank: i + 1,
            name: rankings[i].playerOrTeamName,
            points: rankings[i].leaguePoints, 
            wins: rankings[i].wins,  
            losses: rankings[i].losses
        };
        connection.query('INSERT INTO lol_live_standings SET ?', player, function (error, results, fields) {
            if (error) throw error;
            console.log('Result: ', results);
        });  
    }
 
}

function getRankings(connection, callback) {  
    var rankings;
    
    connection.query("SELECT * FROM lol_live_standings ORDER BY rank ASC", function (err, result, fields) {
        if (err) throw err;
        rankings = result; 
        callback(rankings)
    });  
}

function getApiRankings(callback) {  
    var url = 'https://na1.api.riotgames.com/lol/league/v3/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=RGAPI-5d6fd823-8d80-4089-a08d-5529c3755d2c',
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
 
