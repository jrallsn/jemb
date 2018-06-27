var totalTime = 0,
    remainingTime = 0,
    timerIntervalId;
function startTimer(numSeconds) {
    totalTime = numSeconds;
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
    }
    var timerDiv = document.getElementById('countdown');
    var seconds = Number(numSeconds);
    timerDiv.innerHTML = 'Time left: ' + seconds;
    timerDiv.style.display = "";
    timerIntervalId = setInterval(function() {
            seconds--;
            remainingTime = seconds;
            document.getElementById('remainingTime').style.width = remainingTime / totalTime * 100 + "%";
            timerDiv.innerHTML = 'Time left: ' + seconds;
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

var ws = new WebSocket("wss://echo.websocket.org");
  
ws.onopen = function(evt) { onOpen(evt) };
ws.onclose = function(evt) { onClose(evt) };
ws.onmessage = function(evt) { onMessage(evt) };
ws.onerror = function(evt) { onError(evt) };

ws.onopen = function(event) {
  console.log('opened socket');
  onOpen(event);
};

function onOpen(evt) {
  /* var message = {
    action: 'joinSurveySubject'
  }
  */
  var message = {
    state: 'ask',
    remainingTime: 5,
    prompt: 'What do you put on your feet?'
  };
  ws.send(JSON.stringify(message));
}

ws.onmessage = function(event){
  console.log(JSON.stringify(event.data));
  var data = JSON.parse(event.data);
  if (data.prompt) {
    var html = '';
    html = '<p>' + data.prompt + '</p>';
    document.getElementById('question').innerHTML = html;
  }
  startTimer(10);
};