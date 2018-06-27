/* jshint esversion:6 */

const WebSocket = require('ws');
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json({
    type: '*/*'
}));

const wsPort = 3000;
const restPort = 4000;

const wss = new WebSocket.Server({ port: wsPort });

const submissionTimeLimit = 20000;
const resultsDisplayTime = 10000; // time to display results in ms

const GameStates = {
    IDLE: 'IDLE',
    COLLECTING_SUBMISSIONS: 'COLLECTING_SUBMISSIONS',
    SHOWING_RESULT: 'SHOWING_RESULT',
    GETTING_ANSWERS: 'GETTING_ANSWERS'
};

const questions = require('./questions.json');

var lastQuestion = -1;
var lastButOneQuestion = -1;

console.log(JSON.stringify(questions));
console.log(questions.length);

var submissions = {};

const defaultGameState = {
    state: GameStates.IDLE,
    remainingTime: 0,
    prompt: '',
    currentQuestionNumber: -1,
    timerStarted: 0
};

var gameStateObject = deepClone(defaultGameState);

app.get('/hello', (req, res) => res.send('Hello World!'));

app.get('/state', (req, res) => res.json(gameStateObject));

app.get('/question', (req, res) => {
console.log('QUESTION');

    if (gameStateObject.state !== GameStates.IDLE) {
        res.json(gameStateObject);
        console.log('--not idle, sendnig ' + JSON.stringify(gameStateObject));
        return;
    }

    var questionNum = -1;

    // Don't use either of the last two questions
    do {
        questionNum = Math.floor(Math.random() * questions.length);
    } while (questionNum === lastQuestion || questionNum === lastButOneQuestion);

    submissions[questionNum] = submissions[questionNum] || {};

    lastButOneQuestion = lastQuestion;
    lastQuestion = questionNum;

    gameStateObject.state = GameStates.COLLECTING_SUBMISSIONS;
    gameStateObject.remainingTime = submissionTimeLimit;
    gameStateObject.prompt = questions[questionNum];
    gameStateObject.currentQuestionNumber = questionNum;
    gameStateObject.timerStarted = Date.now();

    updateAllClients(gameStateObject);
console.log('--was idle, sendnig ' + JSON.stringify(gameStateObject));
    res.json(gameStateObject);

    setTimeout(function(){
        gameStateObject.state = GameStates.GETTING_ANSWERS;
        gameStateObject.remainingTime = 0;

        updateAllClients(gameStateObject);
    }, submissionTimeLimit);
});

app.post('/answer', (req, res) => {
    var result = {
        submittedAnswer: '',
        numMatching: 0,
        totalResponses: 0,
        percent: -1,
        rank: -1
    };

    var ans = req.body.answer;

    result.submittedAnswer = ans;
    result.numMatching = submissions[gameStateObject.currentQuestionNumber][ans] || 0;
    result.totalResponses = getTotalSubmissionsForQuestion(gameStateObject.currentQuestionNumber);
    if (result.totalResponses > 0) {
        result.percent = 100.0 * result.numMatching / result.totalResponses;
    }
    if (result.numMatching > 0) {
        result.rank = getRank(getSortedSubmissions(gameStateObject.currentQuestionNumber), ans);
    }

    // include game state in result
    for (var stateMember in gameStateObject) {
        if (!gameStateObject.hasOwnProperty(stateMember)) {
            continue;
        }

        result[stateMember] = gameStateObject[stateMember];
    }

    updateMasterDisplays(result);

    res.json(result);
});

app.post('/showresults', (req, res) => {
    gameStateObject.state = GameStates.SHOWING_RESULT;

    result = deepClone(gameStateObject);

    result.submissions = getSortedSubmissions(gameStateObject.currentQuestionNumber);//allSubmissions;

    updateMasterDisplays(result);
});

app.post('/reset', (req, res) => {
    gameStateObject = deepClone(defaultGameState);

    updateAllClients(gameStateObject);

    res.json({});
});

app.listen(restPort, () => console.log('JEMB and the Holograms listening on port 4000!'));

function deepClone (whatever) {
    return JSON.parse(JSON.stringify(whatever));
}

function generateId() {
	len = 4;
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var uid = '';
    for (var i = 0; i < len; i++) {
        uid += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }

    return uid;
}

function getSortedSubmissions(questionNum) {
    var allSubmissions = [];
    for (var answer in submissions[questionNum]) {
        if (!submissions[questionNum].hasOwnProperty(answer)) {
            continue;
        }

        var count = submissions[questionNum][answer];

        allSubmissions.push({
            answer: answer,
            count: count
        });
    }

    allSubmissions.sort(function(a, b) {
        return b.count - a.count;
    });

    return allSubmissions;
}

function getRank(sortedSubmissions, answer) {
    var rank = -1;

    for (var i = 0; i < sortedSubmissions.length; i++) {
        if (sortedSubmissions[i].answer === answer) {
            rank = i + 1;
            break;
        }
    }

    return rank;
}

function updateTimeRemaining() {
    if (gameStateObject.state !== GameStates.COLLECTING_SUBMISSIONS) {
        return;
    }

    gameStateObject.remainingTime = submissionTimeLimit - (Date.now() - gameStateObject.timerStarted);
}

var activeSurveySubjects = [];
var activePlayers = [];
var activeMasterDisplays = [];

function updateOneClient (socket, updateText) {
    updateTimeRemaining();

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
    if (gameStateObject.currentQuestionNumber === -1) {
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
    
    submissions[qNum] = submissions[qNum] || {};
    submissions[qNum][answer] = submissions[qNum][answer] || 0;
    submissions[qNum][answer]++;
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
            case 'submit':
                submit(data.message);
                break;
        }

  	});

  	//ws.send('something');
});

wss.on('error', function(error){
    console.log(error);
});
