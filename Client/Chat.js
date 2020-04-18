class Chat {
    static init() {
        Chat.chatBox = document.getElementById('chatBox');
    }

    static clear() {
        while (Chat.chatBox.firstChild) {
            Chat.chatBox.firstChild.remove();
        }
    }

    static print({ message }) {
        let chatSpan = document.createElement('span');
        chatSpan.classList = [ 'chatMessage' ];
        chatSpan.innerHTML = message;
        Chat.chatBox.prepend(chatSpan);
    }
}
Chat.init();