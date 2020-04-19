class Workruft {
    constructor() {
        this.chat = new Chat(this.onChatEntry.bind(this));
        this.network = new Network(this.chat);
        this.world = new World(this.chat, this.onUpdate.bind(this));

        this.keysDown = {};

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onWheel.bind(this));
    }

    start() {
        this.onSetup();

        //Hand over control.
        this.world.graphicsLoop();
    }

    onSetup() {
        this.world.camera.position.set(0, 100, 0);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 1);
        //this.network.connect();
    }

    onUpdate(elapsedTimeMS) {
        // this.world.camera.position.set(
        //     75.0 * Math.cos(elapsedTimeMS * 0.0002),
        //     100,
        //     75.0 * Math.sin(elapsedTimeMS * 0.0002));
        // this.world.camera.lookAt(
        //     50.0 * Math.cos(elapsedTimeMS * 0.0002),
        //     50,
        //     50.0 * Math.sin(elapsedTimeMS * 0.0002));
        if (this.keysDown.w) {
            this.world.camera.position.z -= 1.0;
        }
        if (this.keysDown.s) {
            this.world.camera.position.z += 1.0;
        }
        if (this.keysDown.a) {
            this.world.camera.position.x -= 1.0;
        }
        if (this.keysDown.d) {
            this.world.camera.position.x += 1.0;
        }
    }

    onKeyDown(event) {
        if (!event.repeat) {
            switch (event.key) {
                case 'Enter':
                    this.chat.toggleChatEntryBox();
                    break;
                case 'Escape':
                    this.chat.hideChatEntryBox();
                    break;
                case 'w':
                case 'a':
                case 's':
                case 'd':
                    this.keysDown[event.key] = true;
                    break;
            }
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'Tab':
                this.chat.focusChatEntryBoxIfOpen();
                break;
            case 'w':
            case 'a':
            case 's':
            case 'd':
                this.keysDown[event.key] = false;
                break;
        }
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
    }

    onClick(event) {

    }

    onMouseDown(event) {

    }

    onMouseUp(event) {

    }

    onWheel(event) {
        //Negative is up/forward/in.
        let scrollDirection = Math.sign(event.deltaY);
        if (scrollDirection < 0) {
            //Up/forward/in.
            this.world.camera.position.y = Math.max(MinCameraHeight,
                this.world.camera.position.y * (10.0 / 11.0));
        } else if (scrollDirection > 0) {
            //Down/backward/out.
            this.world.camera.position.y = Math.min(MaxCameraHeight,
                this.world.camera.position.y * 1.1);
        }
    }
}