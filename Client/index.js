const socket = new WebSocket('ws://localhost:1337');

socket.onopen = function() {
    alert('connected!');
    socket.send(Date.now());
};

socket.onclose = function() {
    alert('disconnected!');
};

socket.onmessage = function(message) {
    alert('message received: ' + message.data + ', ' + message.origin + ', ' + message.lastEventId + ', ' + message.source + ', ' + message.ports);
};