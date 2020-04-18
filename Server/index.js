const WebSocket = require('ws');
require('../Common/statusCodes');

let serverPort = 1337;
let messageOfTheDay = 'Why, hello, and welcome to my crap server!';

let serverAddress;
const server = new WebSocket.Server({ port: serverPort, clientTracking: true }, function() {
    //On server listening.
    serverAddress = server.address();
    console.log('Server ready and listening! ' + JSON.stringify(serverAddress));
    console.log();
}).on('connection', function(socket, request) {
    //On client connected.
    console.log('Client connected! Headers: ' + JSON.stringify(request.headers));

    socket.on('message', function(message) {
        //On client message received.
        console.log('Client message received: ' + message);
    }).on('close', function(code) {
        //On client disconnected.
        console.log('Client disconnected! ' + code + ' (' + getStatusCodeString(code) + ')');
    }).on('error', function(error) {
        //On client error.
        console.log('Client Error encountered: ' + error.name + ': ' + error.message);
    });

    socket.send(JSON.stringify({
        MotD: messageOfTheDay
    }), function() {
        console.log('I writed data!');
    });
}).on('close', function() {
    //On server shutdown.
    console.log('Server shutdown!');
}).on('error', function(error) {
    //On server error.
    console.log('Server Error encountered: ' + error.name + ': ' + error.message);
});

//Nice:
//socket.close(4000);

//Mean:
//socket.terminate();