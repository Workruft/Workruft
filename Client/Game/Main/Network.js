class Network {
    constructor(chat) {
        this.chat = chat;
    }

    connect(ipAddress) {
        this.disconnect();

        this.socket = new WebSocket('ws://' + ipAddress + ':1337');

        this.socket.onopen = function() {
            this.chat.print({ message: 'Connected to server! (' + ipAddress + ')' });
            //this.socket.send(Date.now());
        }.bind(this);

        this.socket.onmessage = function(message) {
            this.chat.print({ message: 'Server message received: ' + message.data });
        }.bind(this);

        this.socket.onclose = function() {
            this.chat.print({ message: 'Disconnected from server! (' + ipAddress + ')' });
        }.bind(this);

        this.socket.onerror = function() {
            this.chat.print({ message: 'Server connection error encountered!' });
        }.bind(this);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close(1000);
            delete this.socket;
        }
    }

    deconstruct() {
        this.disconnect();
    }
}

module.exports = Network;