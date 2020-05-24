class InputHandler {
    constructor({ workruft, inputBindings }) {
        this.workruft = workruft;
        this.inputBindings = inputBindings;

        this.keysDown = new Set();
        this.mouseButtonsDown = new Set();

        this.editingSize = 2;

        //Disable right click.
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('wheel', this.onWheel.bind(this));
    }

    onKeyDown(event) {
        this.keysDown.add(event.key);
        if (!event.repeat) {
            switch (event.key) {
                case this.inputBindings.ToggleChat: {
                    this.workruft.chat.toggleChatEntry();
                    break;
                }
                case this.inputBindings.CancelChat: {
                    this.workruft.chat.cancelChatEntry();
                    break;
                }
                case 'F5': {
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

            if (!this.workruft.chat.isChatting) {
                switch (event.key) {
                    case this.inputBindings.ToggleMapEditor: {
                        if (this.workruft.gameState == Enums.GameStates.Playing) {
                            this.workruft.world.deselectAll();
                            HTML.statusBox.innerHTML = 'Map Editor mode';
                            this.workruft.gameState = Enums.GameStates.MapEditing;
                        } else if (this.workruft.gameState == Enums.GameStates.MapEditing) {
                            HTML.statusBox.innerHTML = '';
                            this.workruft.gameState = Enums.GameStates.Playing;
                            this.clearEditorSquares();
                        }
                        break;
                    }
                    case this.inputBindings.RotateCameraClockwise: {
                        //TODO: Screws with camera movement; also, repositioning will need to handle zoom.
                        // this.workruft.world.camera.rotation.z -= HalfPI;
                        break;
                    }
                    case this.inputBindings.RotateCameraCounterclockwise: {
                        //TODO: Screws with camera movement; also, repositioning will need to handle zoom.
                        // this.workruft.world.camera.rotation.z += HalfPI;
                        break;
                    }
                }
            }
        }
        //Disable scrolling of the page with the arrow keys.
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight': {
                event.preventDefault();
                return false;
            }
        }
    }

    onKeyUp(event) {
        this.keysDown.delete(event.key);
        // switch (event.key) {
        // }
    }

    onMouseDown(event) {
        this.mouseButtonsDown.add(event.button);
        switch (this.workruft.gameState) {
            case Enums.GameStates.Playing: {
                switch (event.button) {
                    case this.inputBindings.SelectUnitButton: {
                        let pickedObjectArray = this.workruft.world.pickObjects([ this.workruft.world.playerObjects ],
                            this.workruft.world.getNormalizedCanvasMouse(event));
                        if (pickedObjectArray.length > 0) {
                            let pickedGameObject = pickedObjectArray[0].object.userData;
                            if (pickedGameObject.isSelected) {
                                pickedGameObject.deselect();
                            } else {
                                pickedGameObject.select();
                            }
                        } else {
                            for (let selectedObject of this.workruft.world.selectedObjects) {
                                selectedObject.deselect();
                            }
                            this.workruft.world.selectedObjects.clear();
                        }
                        break;
                    }
                    case this.inputBindings.MiscellaneousButton: {
                        let pickedMapObjectArray = this.workruft.world.pickMap(
                            this.workruft.world.getNormalizedCanvasMouse(event));
                        if (pickedMapObjectArray.length > 0) {
                            let clickCoordinates = pickedMapObjectArray[0].point;
                            let cellX = FloorToCell(clickCoordinates.x);
                            let cellZ = FloorToCell(clickCoordinates.z);
                            alert(clickCoordinates.x + ', ' + clickCoordinates.z + '\n' + cellX + ', ' + cellZ);
                        }
                        break;
                    }
                    case this.inputBindings.OrderUnitButton: {
                        let pickedMapObjectArray = this.workruft.world.pickMap(
                            this.workruft.world.getNormalizedCanvasMouse(event));
                        if (pickedMapObjectArray.length > 0) {
                            let clickCoordinates = pickedMapObjectArray[0].point;
                            let cellX = FloorToCell(clickCoordinates.x);
                            let cellZ = FloorToCell(clickCoordinates.z);
                            let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                            if (clickedCell != null) {
                                for (let selectedObject of this.workruft.world.selectedObjects) {
                                    let newOrderObject = {
                                        order: new Order({
                                            type: Enums.OrderTypes.Move,
                                            data: { x: clickCoordinates.x, z: clickCoordinates.z }
                                        })
                                    };
                                    if (this.keysDown.has('Control')) {
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
                break;
            } //case Enums.GameStates.Playing
            case Enums.GameStates.MapEditing: {
                switch (event.button) {
                    case this.inputBindings.RaiseTerrainButton:
                    case this.inputBindings.LowerTerrainButton: {
                        let pickedMapObjectArray = this.workruft.world.pickMap(
                            this.workruft.world.getNormalizedCanvasMouse(event));
                        if (pickedMapObjectArray.length > 0) {
                            let clickCoordinates = pickedMapObjectArray[0].point;
                            let cellX = FloorToCell(clickCoordinates.x);
                            let cellZ = FloorToCell(clickCoordinates.z);
                            let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                            if (clickedCell != null) {
                                let raiseLowerOffset =
                                    (event.button == this.inputBindings.RaiseTerrainButton ? CellSize : -CellSize);
                                let halfEditingSize = this.editingSize * 0.5;
                                let floorHalfEditingSize = FloorToCell(halfEditingSize);
                                let ceilHalfEditingSize = CeilToCell(halfEditingSize);
                                for (let xOffset = -floorHalfEditingSize;
                                    xOffset < ceilHalfEditingSize; xOffset += CellSize) {
                                    for (let zOffset = -floorHalfEditingSize;
                                        zOffset < ceilHalfEditingSize; zOffset += CellSize) {
                                        let currentCell = this.workruft.world.map.getCell({
                                            x: cellX + xOffset,
                                            z: cellZ + zOffset
                                        });
                                        if (currentCell != null) {
                                            this.workruft.world.map.addHeightToCell({
                                                cell: currentCell,
                                                height: raiseLowerOffset
                                            });
                                        }
                                    }
                                }
                                this.workruft.world.map.updateCells({
                                    lowX: cellX - floorHalfEditingSize - CellSize,
                                    lowZ: cellZ - floorHalfEditingSize - CellSize,
                                    highX: cellX + ceilHalfEditingSize + CellSize,
                                    highZ: cellZ + ceilHalfEditingSize + CellSize
                                });
                                this.updateMapEditorMouseCells({ cellX, cellZ });
                            }
                        }
                        break;
                    }
                    case this.inputBindings.MiscellaneousButton: {
                        let pickedMapObjectArray = this.workruft.world.pickMap(
                            this.workruft.world.getNormalizedCanvasMouse(event));
                        if (pickedMapObjectArray.length > 0) {
                            let clickCoordinates = pickedMapObjectArray[0].point;
                            let cellX = FloorToCell(clickCoordinates.x);
                            let cellZ = FloorToCell(clickCoordinates.z);
                            alert(clickCoordinates.x + ', ' + clickCoordinates.z + '\n' + cellX + ', ' + cellZ);
                        }
                        break;
                    }
                }
                break;
            } //case Enums.GameStates.MapEditing
        }
    }

    onMouseMove(event) {
        switch (this.workruft.gameState) {
            // case Enums.GameStates.Playing: {
                // break;
            // }
            case Enums.GameStates.MapEditing: {
                //TODO: Rate-limit this function.
                //TODO: Click + hold + drag editing as well.
                let pickedMapObjectArray = this.workruft.world.pickMap(
                    this.workruft.world.getNormalizedCanvasMouse(event));
                if (pickedMapObjectArray.length > 0) {
                    let clickCoordinates = pickedMapObjectArray[0].point;
                    let cellX = FloorToCell(clickCoordinates.x);
                    let cellZ = FloorToCell(clickCoordinates.z);
                    let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                    if (clickedCell != null) {
                        this.updateMapEditorMouseCells({ cellX, cellZ });
                    }
                }
                break;
            }
        }
    }

    onMouseUp(event) {
        this.mouseButtonsDown.delete(event.button);
    }

    onWheel(event) {
        let scrollDirection = Math.sign(event.deltaY);
        if (this.workruft.gameState == Enums.GameStates.MapEditing && event.ctrlKey) {
            if (scrollDirection < 0) {
                //Negative scroll: up/forward/in. Decrease editing size.
                --this.editingSize;
                if (this.editingSize < 1) {
                    this.editingSize = 1;
                }
            } else if (scrollDirection > 0) {
                //Positive scroll: down/backward/out. Increase editing size.
                ++this.editingSize;
                if (this.editingSize > 16) {
                    this.editingSize = 16;
                }
            }
            let pickedMapObjectArray = this.workruft.world.pickMap(
                this.workruft.world.getNormalizedCanvasMouse(event));
            if (pickedMapObjectArray.length > 0) {
                let clickCoordinates = pickedMapObjectArray[0].point;
                let cellX = FloorToCell(clickCoordinates.x);
                let cellZ = FloorToCell(clickCoordinates.z);
                let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                if (clickedCell != null) {
                    this.updateMapEditorMouseCells({ cellX, cellZ });
                }
            }
        } else {
            if (scrollDirection < 0) {
                //Negative scroll: up/forward/in. Zoom in.
                this.workruft.world.camera.position.y = Math.max(MinCameraHeight,
                    this.workruft.world.camera.position.y * (10.0 / 11.0));
            } else if (scrollDirection > 0) {
                //Positive scroll: down/backward/out. Zoom out.
                this.workruft.world.camera.position.y = Math.min(MaxCameraHeight,
                    this.workruft.world.camera.position.y * 1.1);
            }
        }

        //Disable mouse scrolling of the page.
        event.preventDefault();
    }

    clearEditorSquares() {
        if (IsDefined(this.editorSquares)) {
            for (let editorSquare of this.editorSquares) {
                editorSquare.deconstruct();
            }
        }
        this.editorSquares = [];
    }

    updateMapEditorMouseCells({ cellX, cellZ }) {
        this.clearEditorSquares();
        let halfEditingSize = this.editingSize * 0.5;
        let floorHalfEditingSize = FloorToCell(halfEditingSize);
        let ceilHalfEditingSize = CeilToCell(halfEditingSize);
        for (let xOffset = -floorHalfEditingSize; xOffset < ceilHalfEditingSize; xOffset += CellSize) {
            for (let zOffset = -floorHalfEditingSize; zOffset < ceilHalfEditingSize; zOffset += CellSize) {
                this.editorSquares.push(new ColoredSquare({
                    workruft: this.workruft,
                    x: cellX + xOffset + HalfCellSize,
                    z: cellZ + zOffset + HalfCellSize,
                    color: BlueColor
                }));
            }
        }
    }
}