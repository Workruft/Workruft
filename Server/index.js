const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 1337 });

server.on('connection', function(socket) {
    socket.on('message', function(message) {
        console.log('message received: ' + message);
    });

    socket.send('ooh! well hey thurr!');
    console.log('connected!');
});