class Workruft {
    constructor() {
        this.chat = new Chat(this.onChatEntry.bind(this));
        this.network = new Network(this.chat);
        this.world = new World(this.chat, this.onUpdate.bind(this));

        this.keysDown = {};

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        });
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onWheel.bind(this));
    }

    start() {
        this.onSetup();

        //Hand over control.
        this.world.graphicsLoop();
    }

    onSetup() {
        this.world.camera.position.set(0, 75, 10);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 10);

        //Game units etc.
        this.playerUnit = new GameUnit({
            gameModel: this.world.sheepModel,
            x: 0.0,
            y: 2.0,//this.world.map.getCell({ integerX: 0, integerZ: 0 }).getMaxHeight() + this.world.sheepModel.size,
            z: 0.0
        });
        this.playerUnit.addToGroup({ objectGroup: this.world.clickablePlayerObjects });

        //this.network.connect();
    }

    onUpdate(elapsedTimeMS) {
        if (!this.chat.isChatEntryBoxOpen()) {
            let cameraMoveAmount = Math.tan(Math.PI * 0.005) * this.world.camera.position.y;
            if (this.keysDown.w) {
                this.world.camera.position.z -= cameraMoveAmount;
            }
            if (this.keysDown.s) {
                this.world.camera.position.z += cameraMoveAmount;
            }
            if (this.keysDown.a) {
                this.world.camera.position.x -= cameraMoveAmount;
            }
            if (this.keysDown.d) {
                this.world.camera.position.x += cameraMoveAmount;
            }
            if (this.keysDown.q) {
                //this.world.camera.rotation.z += 0.01;
            }
            if (this.keysDown.e) {
                //this.world.camera.rotation.z -= 0.01;
            }
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
                case 'q':
                case 'e':
                    this.keysDown[event.key] = true;
                    break;
                case 'F5':
                    if (event.ctrlKey) {
                        //For Ctrl+F5, force a full page reload.
                        window.location.reload(true);
                    } else {
                        //Disable regular F5.
                        //event.preventDefault();
                    }
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
            case 'q':
            case 'e':
                this.keysDown[event.key] = false;
                break;
        }
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
    }

    onMouseDown(event) {
        switch (event.button) {
            case 0:
                //Left click.
                let canvasRect = this.world.canvas.getBoundingClientRect();
                let normalizedX = (event.clientX - canvasRect.left) / canvasRect.width * 2.0 - 1.0;
                let normalizedY = (event.clientY - canvasRect.top) / canvasRect.height * -2.0 + 1.0;
                let pickedObjectArray = this.world.pickObjects([ this.world.clickablePlayerObjects ], { x: normalizedX, y: normalizedY });
                if (pickedObjectArray.length > 0) {
                    let pickedGameObject = pickedObjectArray[0].object.userData;
                    if (pickedGameObject.isSelected) {
                        pickedGameObject.deselect({ world: this.world });
                    } else {
                        pickedGameObject.select({
                            world: this.world,
                            selectionModel: this.world.tinySelectionCircleModel
                        });
                    }
                }
                break;
            case 1:
                //Middle click.

                break;
            case 2:
                //Right click.

                break;
        }
    }

    onMouseMove(event) {

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