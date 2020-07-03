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
                if (pickedMapObjectArray.length == 0) {
                    break;
                }
                let clickCoordinates = pickedMapObjectArray[0].point;
                let cellX = FloorToCell(clickCoordinates.x);
                let cellZ = FloorToCell(clickCoordinates.z);
                let clickedCell = this.workruft.world.map.getCell({ x: cellX, z: cellZ });
                if (clickedCell == null) {
                    break;
                }
                let forEachObject = null;
                switch (this.workruft.terrainEditingMode) {
                    case Enums.TerrainEditingModes.DecreaseHeight:
                    case Enums.TerrainEditingModes.IncreaseHeight: {
                        let raiseLowerOffset =
                            (this.workruft.terrainEditingMode == Enums.TerrainEditingModes.IncreaseHeight ?
                                CellSize : -CellSize);
                        let currentCell;
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.world.map.addHeightToCell({
                                    cell: currentCell,
                                    height: raiseLowerOffset
                                });
                            }.bind(this)
                        );
                        break;
                    }
                    case Enums.TerrainEditingModes.FlattenHeight: {
                        let lowestHeight = Infinity;
                        ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                lowestHeight = Math.min(lowestHeight,
                                    this.workruft.world.map.getMinHeight({ cell: currentCell }));
                            }.bind(this)
                        );
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.world.map.setCellFlatHeight({
                                    cell: currentCell,
                                    height: lowestHeight
                                });
                            }.bind(this)
                        );
                        break;
                    }
                    case Enums.TerrainEditingModes.RaiseHeight: {
                        let highestHeight = -Infinity;
                        ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                highestHeight = Math.max(highestHeight,
                                    this.workruft.world.map.getMaxHeight({ cell: currentCell }));
                            }.bind(this)
                        );
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.world.map.setCellFlatHeight({
                                    cell: currentCell,
                                    height: highestHeight
                                });
                            }.bind(this)
                        );
                        break;
                    }
                    case Enums.TerrainEditingModes.LevelHeight: {
                        let totalAverageHeights = 0.0;
                        let cellCount = 0;
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                ++cellCount;
                                totalAverageHeights +=
                                    this.workruft.world.map.getAverageHeight({ cell: currentCell });
                            }.bind(this)
                        );
                        totalAverageHeights /= Math.max(1.0, cellCount);
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.world.map.setCellFlatHeight({
                                    cell: currentCell,
                                    height: totalAverageHeights
                                });
                            }.bind(this)
                        );
                        break;
                    }
                    case Enums.TerrainEditingModes.CloneHeight: {
                        if (event.ctrlKey) {
                            //Set template.
                            this.workruft.terrainEditingCells = [];
                            this.workruft.terrainEditingCenterCell = clickedCell;
                            forEachObject = ForEachCell(
                                this.workruft.editingLatSize, this.workruft.editingLongSize,
                                function(forEachObject) {
                                    currentCell = this.workruft.world.map.getCell({
                                        x: cellX + forEachObject.xOffset,
                                        z: cellZ + forEachObject.zOffset
                                    });
                                    if (currentCell == null) {
                                        return;
                                    }
                                    this.workruft.terrainEditingCells.push(currentCell);
                                }.bind(this)
                            );
                            this.workruft.terrainEditingLatSize = this.workruft.editingLatSize;
                            this.workruft.terrainEditingLongSize = this.workruft.editingLongSize;
                            this.workruft.updateStatusBox();
                            break;
                        } else if (this.workruft.terrainEditingCells.length == 0) {
                            break;
                        }
                        //Clone to.
                        let currentXOffset;
                        let currentZOffset;
                        for (let terrainEditingCell of this.workruft.terrainEditingCells) {
                            currentXOffset = terrainEditingCell.x - this.workruft.terrainEditingCenterCell.x;
                            currentZOffset = terrainEditingCell.z - this.workruft.terrainEditingCenterCell.z;
                            currentCell = this.workruft.world.map.getCell({
                                x: clickedCell.x + currentXOffset,
                                z: clickedCell.z + currentZOffset
                            });
                            if (currentCell == null) {
                                continue;
                            }
                            this.workruft.world.map.copyCellHeights({
                                copyToCell: currentCell,
                                copyFromCell: terrainEditingCell
                            });
                        }
                        forEachObject = CreateCellForEachObject(
                            this.workruft.terrainEditingLatSize, this.workruft.terrainEditingLongSize);
                        break;
                    }
                    case Enums.TerrainEditingModes.LatRamp: {
                        this.workruft.terrainEditingCells = [];
                        this.workruft.terrainEditingCenterCell = clickedCell;
                        forEachObject = ForEachLatBorderCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.terrainEditingCells.push(currentCell);
                            }.bind(this)
                        );
                        if (this.workruft.terrainEditingCells.length == 0) {
                            break;
                        }
                        //Latitudinal ramp.
                        let lowerIndex;
                        let higherIndex;
                        let inBetweenX;
                        let lowerCell;
                        let lowerBackHeight;
                        let lowerFrontHeight;
                        let higherCell;
                        let higherBackHeight;
                        let higherFrontHeight;
                        let inBetweenCell;
                        let lowerHighX;
                        let beforeAfterRatio;
                        let terrainEditingCellsLength = this.workruft.terrainEditingCells.length;
                        //Find every pair and create a LERPed latitudinal ramp in between them.
                        for (lowerIndex = 0; lowerIndex < terrainEditingCellsLength; lowerIndex = higherIndex + 1) {
                            lowerCell = this.workruft.terrainEditingCells[lowerIndex];
                            if (lowerCell == null) {
                                continue;
                            }
                            for (higherIndex = lowerIndex + 1; higherIndex < terrainEditingCellsLength; ++higherIndex) {
                                higherCell = this.workruft.terrainEditingCells[higherIndex];
                                if (higherCell == null || lowerCell.z != higherCell.z || lowerCell.x >= higherCell.x) {
                                    continue;
                                }
                                lowerHighX = lowerCell.x + CellSize;
                                lowerBackHeight = this.workruft.world.map.getBackRightHeight({ cell: lowerCell });
                                lowerFrontHeight = this.workruft.world.map.getFrontRightHeight({ cell: lowerCell });
                                higherBackHeight = this.workruft.world.map.getBackLeftHeight({ cell: higherCell });
                                higherFrontHeight = this.workruft.world.map.getFrontLeftHeight({ cell: higherCell });
                                for (inBetweenX = lowerHighX; inBetweenX < higherCell.x; inBetweenX += CellSize) {
                                    inBetweenCell = this.workruft.world.map.getCell({
                                        x: inBetweenX,
                                        z: lowerCell.z
                                    });
                                    if (inBetweenCell == null) {
                                        continue;
                                    }
                                    beforeAfterRatio = (inBetweenX - lowerHighX) / (higherCell.x - lowerHighX);
                                    //Back left.
                                    this.workruft.world.map.setBackLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerBackHeight +
                                            beforeAfterRatio * higherBackHeight
                                    });
                                    //Front left.
                                    this.workruft.world.map.setFrontLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerFrontHeight +
                                            beforeAfterRatio * higherFrontHeight
                                    });
                                    beforeAfterRatio = (inBetweenX + CellSize - lowerHighX) /
                                        (higherCell.x - lowerHighX);
                                    //Back right.
                                    this.workruft.world.map.setBackRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerBackHeight +
                                            beforeAfterRatio * higherBackHeight
                                    });
                                    //Front right.
                                    this.workruft.world.map.setFrontRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerFrontHeight +
                                            beforeAfterRatio * higherFrontHeight
                                    });
                                }
                                //Onto the next pair.
                                break;
                            }
                        }
                        //Reset terrain editing data.
                        this.workruft.resetTerrainEditing();
                        break;
                    }
                    case Enums.TerrainEditingModes.LongRamp: {
                        this.workruft.terrainEditingCells = [];
                        this.workruft.terrainEditingCenterCell = clickedCell;
                        forEachObject = ForEachLongBorderCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.workruft.world.map.getCell({
                                    x: cellX + forEachObject.xOffset,
                                    z: cellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.terrainEditingCells.push(currentCell);
                            }.bind(this)
                        );
                        if (this.workruft.terrainEditingCells.length == 0) {
                            break;
                        }
                        //Longitudinal ramp.
                        let lowerIndex;
                        let higherIndex;
                        let inBetweenZ;
                        let lowerCell;
                        let lowerLeftHeight;
                        let lowerRightHeight;
                        let higherCell;
                        let higherLeftHeight;
                        let higherRightHeight;
                        let inBetweenCell;
                        let lowerHighZ;
                        let beforeAfterRatio;
                        let terrainEditingCellsLength = this.workruft.terrainEditingCells.length;
                        //Find every pair and create a LERPed longitudinal ramp in between them.
                        for (lowerIndex = 0; lowerIndex < terrainEditingCellsLength; lowerIndex = higherIndex + 1) {
                            lowerCell = this.workruft.terrainEditingCells[lowerIndex];
                            if (lowerCell == null) {
                                continue;
                            }
                            for (higherIndex = lowerIndex + 1; higherIndex < terrainEditingCellsLength; ++higherIndex) {
                                higherCell = this.workruft.terrainEditingCells[higherIndex];
                                if (higherCell == null || lowerCell.x != higherCell.x || lowerCell.z >= higherCell.z) {
                                    continue;
                                }
                                lowerHighZ = lowerCell.z + CellSize;
                                lowerLeftHeight = this.workruft.world.map.getFrontLeftHeight({ cell: lowerCell });
                                lowerRightHeight = this.workruft.world.map.getFrontRightHeight({ cell: lowerCell });
                                higherLeftHeight = this.workruft.world.map.getBackLeftHeight({ cell: higherCell });
                                higherRightHeight = this.workruft.world.map.getBackRightHeight({ cell: higherCell });
                                for (inBetweenZ = lowerHighZ; inBetweenZ < higherCell.z; inBetweenZ += CellSize) {
                                    inBetweenCell = this.workruft.world.map.getCell({
                                        x: lowerCell.x,
                                        z: inBetweenZ
                                    });
                                    if (inBetweenCell == null) {
                                        continue;
                                    }
                                    beforeAfterRatio = (inBetweenZ - lowerHighZ) / (higherCell.z - lowerHighZ);
                                    //Back left.
                                    this.workruft.world.map.setBackLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerLeftHeight +
                                            beforeAfterRatio * higherLeftHeight
                                    });
                                    //Back right.
                                    this.workruft.world.map.setBackRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerRightHeight +
                                            beforeAfterRatio * higherRightHeight
                                    });
                                    beforeAfterRatio = (inBetweenZ + CellSize - lowerHighZ) /
                                        (higherCell.z - lowerHighZ);
                                    //Front left.
                                    this.workruft.world.map.setFrontLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerLeftHeight +
                                            beforeAfterRatio * higherLeftHeight
                                    });
                                    //Front right.
                                    this.workruft.world.map.setFrontRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerRightHeight +
                                            beforeAfterRatio * higherRightHeight
                                    });
                                }
                                //Onto the next pair.
                                break;
                            }
                        }
                        //Reset terrain editing data.
                        this.workruft.resetTerrainEditing();
                        break;
                    }
                    default: {
                        alert('Unhandled terrain editing mode button!');
                        break;
                    }
                }
                if (forEachObject != null) {
                    this.workruft.world.map.updateCells({
                        lowX: cellX - forEachObject.floorHalfLatSize - CellSize,
                        lowZ: cellZ - forEachObject.floorHalfLongSize - CellSize,
                        highX: cellX + forEachObject.ceilHalfLatSize + CellSize,
                        highZ: cellZ + forEachObject.ceilHalfLongSize + CellSize
                    });
                }
                this.updateMapEditorMouseCells({ cellX, cellZ });
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
            //Reset terrain editing data.
            this.workruft.resetTerrainEditing();
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