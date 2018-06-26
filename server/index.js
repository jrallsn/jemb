/* jshint esversion:6 */

const WebSocket = require('ws');
const express = require('express');
const app = express();

const wsPort = 3000;
const restPort = 4000;

const wss = new WebSocket.Server({ port: wsPort });

const submissionTimeLimit = 20000;
const resultsDisplayTime = 10000; // time to display results in ms

const GameStates = {
    IDLE: 'IDLE',
    COLLECTING_SUBMISSIONS: 'COLLECTING_SUBMISSIONS',
};

const Questions = {
    ONE: 'What is your favourite colour?',
    TWO: 'What is your favourite one-digit prime number?'
};

var submissions = {};

var gameStateObject = {
    state: GameStates.IDLE,
    remainingTime: 0,
    prompt: ''
};

app.get('/hello', (req, res) => res.send('Hello World!'));

app.get('/state', (req, res) => res.send(JSON.stringify(gameStateObject)));

app.listen(restPort, () => console.log('Example app listening on port 4000!'));

function generateId() {
	len = 4;
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var uid = '';
    for (var i = 0; i < len; i++) {
        uid += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }

    return uid;
}

var activeSurveySubjects = [];
var activePlayers = [];
var activeMasterDisplays = [];

function updateOneClient (socket, updateText) {
    socket.send(updateText, function(err){
        if(err){
            console.error(err);
        }
    });
}

function updateAllSurveySubjects (updateObject) {
    var updateText = JSON.stringify(updateObject);
    console.log('sending (survey subjects): %s', updateText);
    for (var i = 0; i < activeSurveySubjects.length; i++) {
        updateOneClient(activeSurveySubjects[i].socket, updateText);
    }
}

function updateAllPlayers (updateObject) {
    var updateText = JSON.stringify(updateObject);
    console.log('sending (players): %s', updateText);
    for (var i = 0; i < activePlayers.length; i++){
        updateOneClient(activePlayers[i].socket, updateText);

    }
}

function updateMasterDisplays (updateObject) {
    var updateText = JSON.stringify(updateObject);
    console.log('sending (masters): %s', updateText);
    for (var i = 0; i < activeMasterDisplays.length; i++){
        updateOneClient(activeMasterDisplays[i].socket, updateText);

    }
}

function updateAllClients (updateObject) {
    updateAllPlayers(updateObject);
    updateMasterDisplays(updateObject);
    updateAllSurveySubjects(updateObject);
}

wss.on('connection', function connection(ws) {

	///var roomId = generateId();
	var type;

	function initRoom(teamName){
  		var roomId =  generateId();

  		activeRooms[roomId] = {
            teamName: teamName,
            masterSocket: ws,
            state: GameStates.WAITING_FOR_PLAYERS,
            players: []
        };

  		ws.send(JSON.stringify({
  			info: 'roomCreated',
  			roomId: roomId,
            state: activeRooms[roomId].state
  		}));
  	}

    function joinGameGeneric(clientArray, socket) {
        clientArray.push({
            socket: socket
        });

        updateOneClient(ws, JSON.stringify(gameStateObject));
    }

  	function joinGameSurveySubject() {
  		joinGameGeneric(activeSurveySubjects, ws);
  	}

    function joinGameMasterDisplay() {
        joinGameGeneric(activeMasterDisplays, ws);
    }

    function joinGamePlayer() {
        joinGameGeneric(activePlayers, ws);
    }

  	function testMsg(content){
        updateAllClients({message: content});
 	}

	ws.on('message', function incoming(message) {
    	console.log('received: %s', message);
        var data;
        try{
    	    data = JSON.parse(message);
        } catch (e) {
            console.error(e);
            return;
        }
    	var action = data.action;

        switch (action) {
            case 'joinMasterDisplay':
                joinGameMasterDisplay();
                break;
            case 'joinPlayer':
                joinGamePlayer();
                break;
            case 'joinSurveySubject':
                joinGameSurveySubject();
                break;
            case 'testMsg':
                testMsg(data.message);
                break;
            
        }

  	});

  	//ws.send('something');
});
