var totalTime = 0,
    remainingTime = 0,
    timerIntervalId;

var ws = new WebSocket("wss://ws.seawall.horse/");
  
ws.onclose = function(event) {
  console.log('ws: closed socket');
};
//ws.onmessage = function(evt) { onMessage(evt) };
ws.onerror = function(event) {
  console.log('ws: error');
  $("#poll").hide();

};

ws.onopen = function(event) {
  console.log('ws: opened socket');
};

$("#thanks").hide();
$("#poll").show();

// function onOpen(evt) {
//   /* var message = {
//     action: 'joinSurveySubject'
//   }
//   */
//   var message = {
//     state: 'ask',
//     remainingTime: 5,
//     prompt: 'What do you put on your feet?'
//   };
//   ws.send(JSON.stringify(message));
// }

ws.onmessage = function(event){
  console.log(JSON.stringify(event.data));
  var data = JSON.parse(event.data);
  if (data.prompt) {
    var html = '';
    html = '<p>' + data.prompt + '</p>';
    document.getElementById('question').innerHTML = html;
  }
  console.log('html: ' + html);
  startTimer(10);
};

function joinGame() {
  ws.send(JSON.stringify({
    action: 'joinSurveySubject'
  }));
}

function startTimer(numSeconds) {
  totalTime = numSeconds;
  if (timerIntervalId) {
      clearInterval(timerIntervalId);
  }
  var timerDiv = document.getElementById('countdown');
  var seconds = Number(numSeconds);
  timerDiv.innerHTML = seconds;
  timerDiv.style.display = "";
  timerIntervalId = setInterval(function() {
          seconds--;
          remainingTime = seconds;
          document.getElementById('remainingTime').style.width = remainingTime / totalTime * 100 + "%";
          timerDiv.innerHTML = seconds;
          if(seconds === 0){
              clearInterval(timerIntervalId);
          }
      }, 1000);
}

function hideTimer() {
  var timerDiv = document.getElementById('countdown');
  clearInterval(timerIntervalId);
  timerDiv.style.display = "none";
}

function sendMessage() {
  
  if( ! $('.ui.form').form('is valid', 'answer')) {
    console.log('invalid!!!');
    $('.ui.form').form('valiate field', 'answer');
    return;
  }
  
  $("#poll").hide();
  $("#thanks").show();
  console.log('sendMessage!!!!');
  
}

function another() {
  $("#poll").show();
  $("#thanks").hide();
  console.log('another!!!!');
}