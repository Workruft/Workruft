class Chat {
    constructor(onChatEntry) {
        this.onChatEntry = onChatEntry;

        this.chatBox = HTML.chatBox;
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
        this.chatEntryBox = HTML.chatEntryBox;
        this.chatEntryBox.value = '';
        this.chatEntryBox.addEventListener('focusout', this.onChatEntryFocusOut.bind(this));
    }

    clear() {
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
    }

    print({ message }) {
        let chatPre = document.createElement('pre');
        chatPre.classList = [ 'chatMessage' ];
        chatPre.innerHTML = message;
        this.chatBox.prepend(chatPre);
    }

    toggleChatEntryBox() {
        if (this.chatEntryBox.style.display == 'none') {
            this.chatEntryBox.style.display = 'block';
            this.chatEntryBox.focus();
        } else {
            if (this.chatEntryBox.value.length > 0) {
                this.onChatEntry(this.chatEntryBox.value);
            }
            this.hideChatEntryBox();
        }
    }

    hideChatEntryBox() {
        this.chatEntryBox.style.display = 'none';
        this.chatEntryBox.value = '';
    }

    focusChatEntryBoxIfOpen() {
        if (this.chatEntryBox.style.display != 'none') {
            this.chatEntryBox.focus();
        }
    }

    onChatEntryFocusOut() {
        this.hideChatEntryBox();
    }
}