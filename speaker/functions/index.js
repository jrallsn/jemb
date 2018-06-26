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

// Import the Dialogflow module from the Actions on Google client library.
const {dialogflow} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// Import utils

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
    const ssml = `
        <speak>
            <audio src="https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg">Start</audio>
            Welcome to I X Feud!
        </speak>`;
    conv.ask(ssml);

    conv.ask("You ready dawg?");
});

app.intent('status_yes', (conv) => {
    conv.ask("starting game");
    // Game show music
    // Ask Player 1 name
    // Ask Player 2 name
    // Question One Intro
    // Generate Random question from list
    // Play waiting sound while polling
    // Ask Player 1
    // Record Response
    // Ask Player 2
    // Record Response
    // Show/Say points

});

app.intent('status_no', (conv) => {
    conv.close("fine, we can play without you");
});

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
