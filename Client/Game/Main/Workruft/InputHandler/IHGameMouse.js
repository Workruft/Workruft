let Order = require('../../../Helpers/Order');

module.exports = {
    onMouseDown(event) {
        this.mouseButtonsDown.add(event.button);
        switch (this.workruft.gameState) {
            case Enums.GameStates.Playing: {
                this.onMouseDownPlaying(event);
                break;
            }
            case Enums.GameStates.MapEditing: {
                this.onMouseDownMapEditing(event);
                break;
            }
        }
    },

    onMouseDownPlaying(event) {
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
    },

    onMouseDownMapEditing(event) {
        switch (event.button) {
            case this.inputBindings.TerrainActivityButton: {
                let pickedMapObjectArray = this.workruft.world.pickMap(
                    this.workruft.world.getNormalizedCanvasMouse(event));
                if (pickedMapObjectArray.length > 0) {
                    let clickCoordinates = pickedMapObjectArray[0].point;
                    let cellX = FloorToCell(clickCoordinates.x);
                    let cellZ = FloorToCell(clickCoordinates.z);
                    let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                    if (clickedCell != null) {
                        let forEachObject;
                        switch (this.workruft.terrainEditingMode) {
                            case Enums.TerrainEditingModes.DecreaseHeight:
                            case Enums.TerrainEditingModes.IncreaseHeight:
                                let raiseLowerOffset =
                                    (this.workruft.terrainEditingMode == Enums.TerrainEditingModes.IncreaseHeight ?
                                        CellSize : -CellSize);
                                let currentCell;
                                forEachObject = ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            this.workruft.world.map.addHeightToCell({
                                                cell: currentCell,
                                                height: raiseLowerOffset
                                            });
                                        }
                                    }.bind(this)
                                );
                                break;
                            case Enums.TerrainEditingModes.FlattenHeight:
                                let lowestHeight = Infinity;
                                ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            lowestHeight = Math.min(lowestHeight,
                                                this.workruft.world.map.getMinHeight({ cell: currentCell }));
                                        }
                                    }.bind(this)
                                );
                                forEachObject = ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            this.workruft.world.map.setCellFlatHeight({
                                                cell: currentCell,
                                                height: lowestHeight
                                            });
                                        }
                                    }.bind(this)
                                );
                                break;
                            case Enums.TerrainEditingModes.RaiseHeight:
                                let highestHeight = -Infinity;
                                ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            highestHeight = Math.max(highestHeight,
                                                this.workruft.world.map.getMaxHeight({ cell: currentCell }));
                                        }
                                    }.bind(this)
                                );
                                forEachObject = ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            this.workruft.world.map.setCellFlatHeight({
                                                cell: currentCell,
                                                height: highestHeight
                                            });
                                        }
                                    }.bind(this)
                                );
                                break;
                            case Enums.TerrainEditingModes.LevelHeight:
                                let totalAverageHeights = 0.0;
                                let cellCount = 0;
                                forEachObject = ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            ++cellCount;
                                            totalAverageHeights +=
                                                this.workruft.world.map.getAverageHeight({ cell: currentCell });
                                        }
                                    }.bind(this)
                                );
                                totalAverageHeights /= Math.max(1.0, cellCount);
                                forEachObject = ForEachCell(this.workruft, cellX, cellZ,
                                    this.workruft.editingLatSize, this.workruft.editingLongSize,
                                    function(forEachObject) {
                                        currentCell = this.workruft.world.map.getCell({
                                            x: cellX + forEachObject.xOffset,
                                            z: cellZ + forEachObject.zOffset
                                        });
                                        if (currentCell != null) {
                                            this.workruft.world.map.setCellFlatHeight({
                                                cell: currentCell,
                                                height: totalAverageHeights
                                            });
                                        }
                                    }.bind(this)
                                );
                                break;
                            case Enums.TerrainEditingModes.CloneHeight:

                                break;
                            case Enums.TerrainEditingModes.LongRamp:

                                break;
                            case Enums.TerrainEditingModes.LatRamp:

                                break;
                            default:
                                alert('Unhandled terrain editing mode button!');
                                break;
                        }
                        this.workruft.world.map.updateCells({
                            lowX: cellX - forEachObject.floorHalfLatSize - CellSize,
                            lowZ: cellZ - forEachObject.floorHalfLongSize - CellSize,
                            highX: cellX + forEachObject.ceilHalfLatSize + CellSize,
                            highZ: cellZ + forEachObject.ceilHalfLongSize + CellSize
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