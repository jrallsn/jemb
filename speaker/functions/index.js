// Copyright 2018, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

let fetch = require('node-fetch');
// var request = require('request');

// Import the Dialogflow module from the Actions on Google client library.
const {dialogflow} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

const asyncTask = () => new Promise(
  resolve => setTimeout(resolve, 1000)
);

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', conv => {
//     const ssml = `
//         <speak>
//   <par>
//     <media xml:id="intro" soundLevel="5dB" fadeOutDur="2.0s">
//             <audio src="https://upload.wikimedia.org/wikipedia/commons/1/14/Happy_Happy_Game_Show_%28ISRC_USUAN1600006%29.mp3" clipEnd="8.0s">Intro</audio>
//             Welcome to I X Feud!
//     </media>
//   </par>
// </speak>`;
    //conv.ask(ssml);
    //conv.ask("You ready dawg?");
    return getQuestion().then((question) => {
        conv.ask("me");
    });
    conv.ask("Let's go");
});

// If user answers yes then ask for Player 1 name
app.intent('status_yes', (conv) => {
    conv.ask("Alright let's go!");
    // Ask Player 1 name
    conv.ask("Player 1, what's your name?");
    // Game show music

    // Question One Intro
    // Generate Random question from list
    // Play waiting sound while polling
    // Ask Player 1
    // Record Response
    // Ask Player 2
    // Record Response
    // Show/Say points
});

// Save player 1 name and ask for player 2 name
app.intent('player1_name', (conv, {name}) => {
    conv.user.storage.player1 = name;
    conv.user.storage.score1 = 0;

    var confirmName = "Alright " + conv.user.storage.player1 + ". Get ready!";
    conv.ask(confirmName);
    conv.ask("Player 2, what's your name?");
});

function getQuestion() {
    // return new Promise(resolve => {
    //      fetch('https://api.seawall.horse/question',
    //       {
    //           method: 'GET',
    //           data: ''
    //       })
    //       .then(function(response){ return response.json(); })
    //       .then(function(data){
    //         if(data){
    //             if(data.prompt){
    //                  resolve(data.prompt);
    //             }
    //             else{
    //                 resolve("No prompt");
    //             }
    //         }
    //         else{
    //             resolve("No data");
    //         }
    //       });
    //   });
    //return new Promise(resolve => {resolve("Hello")});
  /*  return new Promise(resolve => {
        console.log("Hi");
        var req = new XMLHttpRequest();
        req.open('GET', 'http://api.seawall.horse/question', true);
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status === 200) {
                resolve(req.responseText);
            }
        };
        req.send();
    });*/
    return fetch('https://api.seawall.horse/question')
    .then(() => {return 'oh my god please work';});
}

// Save player 2 name
app.intent('player2_name', (conv, {name}) => {
    conv.user.storage.player2 = name;
    conv.user.storage.score2 = 0;

    var confirmName = "Alright " + conv.user.storage.player2 + ". Get ready!";
    conv.ask(confirmName);

    // Game show music
    const ssml = `<speak>
      <par>
        <media xml:id="intro" soundLevel="5dB" fadeOutDur="2.0s">
          <audio src="https://upload.wikimedia.org/wikipedia/commons/1/14/Happy_Happy_Game_Show_%28ISRC_USUAN1600006%29.mp3" clipEnd="5.0s">
            <desc>Game intro</desc>
          </audio>
            Welcome to another game of I X Feud! Here's a rundown of how this will go: Audience, you will have 20 seconds to input your one word answer to the question on your phones. Then each player will get the chance to guess what the most popular answer was. Points will be calculated based on how many audience members chose the same answer. After 3 rounds, the person with the most points will receive...
        </media>
        <media xml:id="drums" begin="intro.end" soundLevel="5dB" fadeOutDur="1.0s">
          <audio src="https://actions.google.com/sounds/v1/cartoon/drum_roll.ogg" clipBegin="18.0s" clipEnd="20.0s"></audio>
        </media>
        <media xml:id="pride" begin="drums.end" soundLevel="5dB">
            <speak>Nothing! The Earth still spins</speak>
        </media>
      </par>
    </speak>`;

    //conv.ask(ssml);
    conv.ask("Audience, get ready for question 1!");

    // send('GET', 'https://api.seawall.horse/question', undefined, function (err, data) {
    //   if (err) return console.log(err);

    //   conv.ask(data);
    // })
});



// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
