const WebSocket = require('ws');
const publicIP = require('public-ip');
require('../Common/Globals');
const GetStatusCodeString = require('../Common/StatusCodes');

let serverPort = 1337;
let messageOfTheDay = 'Hallo thar!';

let serverAddress;
const server = new WebSocket.Server({ port: serverPort, clientTracking: true }, function() {
    //On server listening.
    serverAddress = server.address();
    console.log('Server ready and listening! ' + JSON.stringify(serverAddress));
    console.log('Gettin yo IP...');
    //publicIP.v6()
    publicIP.v4().then(function(yoIP) {
        console.log('Yo IP address is: ' + yoIP);
        console.log();
    });
});

server.on('connection', function(socket, request) {
    //On client connected.
    let clientAddress = request.connection.remoteAddress;
    console.log();
    console.log('Client connected! Address: ' + clientAddress + ' Headers: ' + JSON.stringify(request.headers));

    socket.on('message', function(message) {
        //On client message received.
        console.log('Client message received! Address: ' + clientAddress + ' Message: ' + message);
    }).on('close', function(code) {
        //On client disconnected.
        console.log();
        console.log('Client disconnected! Address: ' + clientAddress + ' Code: ' + code + ' (' + GetStatusCodeString(code) + ')');
    }).on('error', function(error) {
        //On client error.
        console.log('Client error encountered! Address: ' + clientAddress + ' Error: ' + error.name + ': ' + error.message);
    });

    socket.send(JSON.stringify({
        MotD: messageOfTheDay
    }), function() {
        console.log('I writed data!');
    });
});

server.on('close', function() {
    //On server shutdown.
    console.log('Server shutdown!');
});

server.on('error', function(error) {
    //On server error.
    console.log('Server error encountered: ' + error.name + ': ' + error.message);
});

//Nice:
//socket.close(4000);

//Mean:
//socket.terminate();