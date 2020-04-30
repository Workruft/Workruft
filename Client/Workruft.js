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
            event.stopPropagation();
            return false;
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

    deconstruct() {
        this.world.deconstruct();
        this.network.deconstruct();
    }

    onSetup() {
        this.selectedObjects = new Set();
        this.objectsToUpdate = new Set();

        this.world.camera.position.set(0, 75, 10);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 10);

        //Game units etc.
        this.playerUnit = new GameUnit({
            workruft: this,
            gameModel: this.world.sheepModel,
            x: 0.0,
            z: 0.0
        });
        this.playerUnit.addToGroup({ objectGroup: this.world.playerObjects });

        //this.network.connect();
    }

    onUpdate() {
        let deltaTimeMS = this.world.clock.getDelta();
        for (let objectToUpdate of this.objectsToUpdate) {
            objectToUpdate.update({ workruft: this, deltaTimeMS });
        }

        if (!this.chat.isChatEntryBoxOpen()) {
            let cameraMoveAmount = Math.tan(Math.PI * 0.01) * this.world.camera.position.y;
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
                case 'Control': case 'w': case 'a': case 's': case 'd': case 'q': case 'e':
                    this.keysDown[event.key] = true;
                    break;
                case 'F5':
                    if (event.ctrlKey) {
                        //For Ctrl+F5, force a full page reload.
                        DestroyAll();
                        window.location.reload(true);
                    } else {
                        //Disable regular F5.
                        event.preventDefault();
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
            case 'Control': case 'w': case 'a': case 's': case 'd': case 'q': case 'e':
                this.keysDown[event.key] = false;
                break;
        }
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
    }

    getNormalizedCanvasMouse(event) {
        let canvasRect = this.world.canvas.getBoundingClientRect();
        let normalizedX = (event.clientX - canvasRect.left) / canvasRect.width * 2.0 - 1.0;
        let normalizedY = (event.clientY - canvasRect.top) / canvasRect.height * -2.0 + 1.0;
        return { x: normalizedX, y: normalizedY };
    }

    onMouseDown(event) {
        switch (event.button) {
            case 0:
            {
                //Left click.
                let pickedObjectArray = this.world.pickObjects([ this.world.playerObjects ],
                    this.getNormalizedCanvasMouse(event));
                if (pickedObjectArray.length > 0) {
                    let pickedGameObject = pickedObjectArray[0].object.userData;
                    if (pickedGameObject.isSelected) {
                        pickedGameObject.deselect({ workruft: this });
                    } else {
                        pickedGameObject.select({
                            workruft: this,
                            selectionModel: this.world.tinySelectionCircleModel
                        });
                    }
                } else {
                    for (let selectedObject of this.selectedObjects) {
                        selectedObject.deselect({ workruft: this });
                    }
                    this.selectedObjects.clear();
                }
                break;
            }
            case 1:
            {
                //Middle click.
                // let pickedMapObjectArray = this.world.pickMap(this.getNormalizedCanvasMouse(event));
                // if (pickedMapObjectArray.length > 0) {
                //     let clickCoordinates = pickedMapObjectArray[0].point;
                //     let cellX = AlignToCell(clickCoordinates.x);
                //     let cellZ = AlignToCell(clickCoordinates.z);
                //     let clickedCell = this.world.map.getCell({ x: cellX, z: cellZ });
                //     alert(JSON.stringify(clickedCell.rightTraversable) + " + " + JSON.stringify(clickedCell.frontTraversable));
                // }
                // break;
            }
            case 2:
            {
                //Right click.
                let pickedMapObjectArray = this.world.pickMap(this.getNormalizedCanvasMouse(event));
                if (pickedMapObjectArray.length > 0) {
                    let clickCoordinates = pickedMapObjectArray[0].point;
                    let cellX = AlignToCell(clickCoordinates.x);
                    let cellZ = AlignToCell(clickCoordinates.z);
                    let clickedCell = this.world.map.getCell({ x: cellX, z: cellZ });
                    if (clickedCell) {
                        for (let selectedObject of this.selectedObjects) {
                            let newOrderObject = {
                                workruft: this,
                                order: new Order({
                                    type: Enums.OrderTypes.Move,
                                    data: { x: clickCoordinates.x, z: clickCoordinates.z }
                                })
                            };
                            if (this.keysDown.Control) {
                                selectedObject.issueAdditionalOrder(newOrderObject);
                            } else {
                                selectedObject.issueReplacementOrder(newOrderObject);
                            }
                        }
                    }
                }
                break;
            }
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