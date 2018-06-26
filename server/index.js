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

const questions = require('./questions.json');

console.log(JSON.stringify(questions));

var submissions = {};

var gameStateObject = {
    state: GameStates.IDLE,
    remainingTime: 0,
    prompt: '',
    currentQuestionNumber: 0
};

app.get('/hello', (req, res) => res.send('Hello World!'));

app.get('/state', (req, res) => res.send(JSON.stringify(gameStateObject)));

app.listen(restPort, () => console.log('JEMB and the Holograms listening on port 4000!'));

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

function updateClientGroup (updateObject, clientArray) {
    var updateText = JSON.stringify(updateObject);
    console.log('sending: %s', updateText);
    for (var i = 0; i < clientArray.length; i++) {
        var socket = clientArray[i].socket;
        if (socket.readyState !== 1) {
            clientArray.splice(i, 1);
            i--;
            continue;
        }
        updateOneClient(socket, updateText);
    }
}

function updateAllSurveySubjects (updateObject) {
    console.log('sending to survey subjects');
    updateClientGroup(updateObject, activeSurveySubjects);
}

function updateAllPlayers (updateObject) {
    console.log('sending to players');
    updateClientGroup(updateObject, activePlayers);
}

function updateMasterDisplays (updateObject) {
    console.log('sending to master displays');
    updateClientGroup(updateObject, activeMasterDisplays);
}

function updateAllClients (updateObject) {
    updateAllPlayers(updateObject);
    updateMasterDisplays(updateObject);
    updateAllSurveySubjects(updateObject);
}

function submit (responseText) {
    if (gameStateObject.currentQuestionNumber === 0) {
        return;
    }
    if (gameStateObject.state !== GameStates.COLLECTING_SUBMISSIONS) {
        return;
    }
    if (typeof responseText !== 'string') {
        return;
    }

    let qNum = gameStateObject.currentQuestionNumber;

    answer = responseText.toLowerCase();
    answer = answer.replace(/\s/g, '');
    
    submissions[currentQuestionNumber] = submissions[currentQuestionNumber] || {};
    submissions[currentQuestionNumber][answer] = submissions[currentQuestionNumber][answer] || 0;
    submissions[currentQuestionNumber][answer]++;
}

function getTotalSubmissionsForQuestion (questionNum) {
    if (!submissions.hasOwnProperty(questionNum)) {
        return 0;
    }

    var total = 0;

    var subs = submissions[questionNum];

    for (var ans in subs) {
        if (!subs.hasOwnProperty(ans)) {
            continue;
        }

        total += subs[ans];
    }

    return total;
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
