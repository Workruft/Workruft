let Order = require('../../../Helpers/Order');

module.exports = {
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

                                let halfEditingLongSize = this.workruft.editingLongSize * 0.5;
                                let halfEditingLatSize = this.workruft.editingLatSize * 0.5;
                                let floorHalfEditingLongSize = FloorToCell(halfEditingLongSize);
                                let ceilHalfEditingLongSize = CeilToCell(halfEditingLongSize);
                                let floorHalfEditingLatSize = FloorToCell(halfEditingLatSize);
                                let ceilHalfEditingLatSize = CeilToCell(halfEditingLatSize);
                                for (let xOffset = -floorHalfEditingLatSize; xOffset < ceilHalfEditingLatSize;
                                    xOffset += CellSize) {
                                    for (let zOffset = -floorHalfEditingLongSize; zOffset < ceilHalfEditingLongSize;
                                        zOffset += CellSize) {
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
                                    lowX: cellX - floorHalfEditingLatSize - CellSize,
                                    lowZ: cellZ - floorHalfEditingLongSize - CellSize,
                                    highX: cellX + floorHalfEditingLatSize + CellSize,
                                    highZ: cellZ + ceilHalfEditingLongSize + CellSize
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
    },

    onMouseUp(event) {
        this.mouseButtonsDown.delete(event.button);
    },

    onWheel(event) {
        let scrollDirection = Math.sign(event.deltaY);
        if (this.workruft.gameState == Enums.GameStates.MapEditing && event.ctrlKey) {
            if (scrollDirection < 0) {
                //Negative scroll: up/forward/in. Increase editing size.
                //Note: Increasing this is no problem, except that that's a lot of ColoredSquares to draw lol...
                this.workruft.editingLongSize = Math.min(32, this.workruft.editingLongSize + 1);
                this.workruft.editingLatSize = Math.min(32, this.workruft.editingLatSize + 1);
            } else if (scrollDirection > 0) {
                //Positive scroll: down/backward/out. Decrease editing size.
                this.workruft.editingLongSize = Math.max(1, this.workruft.editingLongSize - 1);
                this.workruft.editingLatSize = Math.max(1, this.workruft.editingLatSize - 1);
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
            this.workruft.updateStatusBox();
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
        event.stopPropagation();
        return false;
    },

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
    },

    onMouseOut(event) {
        if (event.relatedTarget == null) {
            return;
        }
        if (event.relatedTarget.classList == null || !event.relatedTarget.classList.contains('maintainCanvasMouse')) {
            let newEvent = new MouseEvent('mousemove', {
                clientX: window.innerWidth * 0.5,
                clientY: window.innerHeight * 0.5,
                screenX: window.screenX + window.innerWidth * 0.5,
                screenY: window.screenY + window.innerHeight * 0.5
            });
            HTML.gameCanvas.dispatchEvent(newEvent);
        }
    },

    onMouseOver(event) {

    }
};