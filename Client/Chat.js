class Chat {
    constructor(onChatEntry) {
        this.onChatEntry = onChatEntry;

        this.chatBox = HTML.chatBox;
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
        this.chatEntryBox = HTML.chatEntryBox;
        this.chatEntryBox.value = '';
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

    toggleChatEntryBox() {
        if (this.chatEntryBox.style.display == 'none') {
            this.chatEntryBox.style.display = 'block';
            this.chatEntryBox.focus();
        } else {
            if (this.chatEntryBox.value.length > 0) {
                this.onChatEntry(this.chatEntryBox.value);
            }
            this.chatEntryBox.style.display = 'none';
            this.chatEntryBox.value = '';
        }
    }
}