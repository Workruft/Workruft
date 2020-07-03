class Chat {
    constructor(onChatEntry) {
        this.onChatEntry = onChatEntry;
        this.isChatting = false;

        this.chatBox = HTML.chatBox;
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
        this.chatEntryBox = HTML.chatEntryBox;
        this.chatEntryBox.value = '';
        this.chatEntryBox.addEventListener('focusout', function() {
            this.cancelChatEntry();
        }.bind(this));
    }

    clear() {
        while (this.chatBox.firstChild) {
            this.chatBox.firstChild.remove();
        }
    }

    print({ message }) {
        let chatPre = document.createElement('pre');
        chatPre.classList.add('chatMessage'); //'maintainCanvasMouse'
        chatPre.innerHTML = message;
        this.chatBox.prepend(chatPre);
    }

    toggleChatEntry() {
        if (this.isChatting) {
            //Stop chatting.
            if (this.chatEntryBox.value.length > 0) {
                //If text was entered, handle chat entry.
                this.onChatEntry(this.chatEntryBox.value);
            }
            this.cancelChatEntry();
        } else {
            //Start chatting.
            this.chatEntryBox.style.display = 'block';
            this.chatEntryBox.focus();
            this.isChatting = true;
        }
    }

    cancelChatEntry() {
        this.chatEntryBox.style.display = 'none';
        this.chatEntryBox.value = '';
        this.isChatting = false;
    }
}

module.exports = Chat;