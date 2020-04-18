class Network {
    constructor(chat) {
        this.chat = chat;
        this.chat.print({ message: 'Workruft!' });
    }

    connect() {
        const socket = new WebSocket('ws://localhost:1337');

        socket.onopen = function() {
            this.chat.print({ message: 'Connected to server!' });
            //socket.send(Date.now());
        }.bind(this);

        socket.onmessage = function(message) {
            this.chat.print({ message: 'Server message received: ' + message.data });
        }.bind(this);

        socket.onclose = function() {
            this.chat.print({ message: 'Disconnected from server!' });
        }.bind(this);

        socket.onerror = function() {
            this.chat.print({ message: 'Server connection error encountered!' });
        }.bind(this);
    }
}