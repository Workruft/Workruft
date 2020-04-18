class Chat {
    constructor() {
        this.chatBox = document.getElementById('chatBox');
    }

    clear() {
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
    }

    print({ message }) {
        let chatSpan = document.createElement('span');
        chatSpan.classList = [ 'chatMessage' ];
        chatSpan.innerHTML = message;
        this.chatBox.prepend(chatSpan);
    }
}