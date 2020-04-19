class Workruft {
    constructor() {
        this.chat = new Chat(this.onChatEntry.bind(this));
        this.network = new Network(this.chat);
        this.world = new World(this.chat, this.onUpdate.bind(this));

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    start() {
        this.onSetup();

        //Hand over control.
        this.world.graphicsLoop();
    }

    onSetup() {
        //this.network.connect();
    }

    onUpdate(elapsedTimeMS) {
        this.world.camera.position.set(
            75.0 * Math.cos(elapsedTimeMS * 0.0002),
            100,
            75.0 * Math.sin(elapsedTimeMS * 0.0002));
        this.world.camera.lookAt(
            50.0 * Math.cos(elapsedTimeMS * 0.0002),
            50,
            50.0 * Math.sin(elapsedTimeMS * 0.0002));
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                this.chat.toggleChatEntryBox();
                break;
            case 'Escape':
                this.chat.hideChatEntryBox();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'Tab':
                this.chat.focusChatEntryBoxIfOpen();
                break;
        }
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
    }
}