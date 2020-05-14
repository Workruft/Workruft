class Network {
    constructor(chat) {
        this.chat = chat;
        this.chat.print({ message: 'Workruft!' });
    }

    connect() {
        this.disconnect();

        this.socket = new WebSocket('ws://localhost:1337');

        this.socket.onopen = function() {
            this.chat.print({ message: 'Connected to server!' });
            //this.socket.send(Date.now());
        }.bind(this);

        this.socket.onmessage = function(message) {
            this.chat.print({ message: 'Server message received: ' + message.data });
        }.bind(this);

        this.socket.onclose = function() {
            this.chat.print({ message: 'Disconnected from server!' });
        }.bind(this);

        this.socket.onerror = function() {
            this.chat.print({ message: 'Server connection error encountered!' });
        }.bind(this);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close(1001, "Bye bye now!");
            delete this.socket;
        }
    }

    deconstruct() {
        this.disconnect();
    }
}