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
                if (!this.tryUpdateMouseCell(event)) {
                    break;
                }
                alert(this.lastMouseCellX + ', ' + this.lastMouseCellZ + '\n' +
                    this.lastMouseCoordinates.x + ', ' + this.lastMouseCoordinates.z);
                break;
            }
            case this.inputBindings.OrderUnitButton: {
                if (!this.tryUpdateMouseCell(event)) {
                    break;
                }
                let clickedCell = this.map.getCell({ x: this.lastMouseCellX, z: this.lastMouseCellZ });
                if (clickedCell == null) {
                    break;
                }
                for (let selectedObject of this.workruft.world.selectedObjects) {
                    let newOrderObject = {
                        order: new Order({
                            type: Enums.OrderTypes.Move,
                            data: { x: this.lastMouseCoordinates.x, z: this.lastMouseCoordinates.z }
                        })
                    };
                    if (this.keysDown.has('Control')) {
                        selectedObject.issueAdditionalOrder(newOrderObject);
                    } else {
                        selectedObject.issueReplacementOrder(newOrderObject);
                    }
                }
                break;
            }
        }
    },

    onMouseDownMapEditing(event) {
        switch (event.button) {
            case this.inputBindings.TerrainActivityButton: {
                if (!this.tryUpdateMouseCell(event)) {
                    break;
                }
                let clickedCell = this.map.getCell({ x: this.lastMouseCellX, z: this.lastMouseCellZ });
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
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.map.addHeightToCell({
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
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                lowestHeight = Math.min(lowestHeight,
                                    this.map.getMinHeight({ cell: currentCell }));
                            }.bind(this)
                        );
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.map.setCellFlatHeight({
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
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                highestHeight = Math.max(highestHeight,
                                    this.map.getMaxHeight({ cell: currentCell }));
                            }.bind(this)
                        );
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.map.setCellFlatHeight({
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
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                ++cellCount;
                                totalAverageHeights +=
                                    this.map.getAverageHeight({ cell: currentCell });
                            }.bind(this)
                        );
                        totalAverageHeights /= Math.max(1.0, cellCount);
                        forEachObject = ForEachCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.map.setCellFlatHeight({
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
                                    currentCell = this.map.getCell({
                                        x: this.lastMouseCellX + forEachObject.xOffset,
                                        z: this.lastMouseCellZ + forEachObject.zOffset
                                    });
                                    if (currentCell == null) {
                                        return;
                                    }
                                    this.workruft.terrainEditingCells.push({
                                        x: currentCell.x, z: currentCell.z,
                                        heights: [
                                            this.map.getBackLeftHeight({ cell: currentCell }),
                                            this.map.getBackRightHeight({ cell: currentCell }),
                                            this.map.getFrontRightHeight({ cell: currentCell }),
                                            this.map.getFrontLeftHeight({ cell: currentCell })
                                        ]
                                    });
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
                            currentCell = this.map.getCell({
                                x: clickedCell.x + currentXOffset,
                                z: clickedCell.z + currentZOffset
                            });
                            if (currentCell == null) {
                                continue;
                            }
                            this.map.setBackLeftHeight({
                                cell: currentCell,
                                height: terrainEditingCell.heights[0]
                            });
                            this.map.setBackRightHeight({
                                cell: currentCell,
                                height: terrainEditingCell.heights[1]
                            });
                            this.map.setFrontRightHeight({
                                cell: currentCell,
                                height: terrainEditingCell.heights[2]
                            });
                            this.map.setFrontLeftHeight({
                                cell: currentCell,
                                height: terrainEditingCell.heights[3]
                            });
                        }
                        forEachObject = GetIterationBounds(
                            this.workruft.terrainEditingLatSize, this.workruft.terrainEditingLongSize);
                        break;
                    }
                    case Enums.TerrainEditingModes.LatRamp: {
                        this.workruft.terrainEditingCells = [];
                        this.workruft.terrainEditingCenterCell = clickedCell;
                        forEachObject = ForEachLatBorderCell(
                            this.workruft.editingLatSize, this.workruft.editingLongSize,
                            function(forEachObject) {
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.terrainEditingCells.push({
                                    x: currentCell.x, z: currentCell.z,
                                    heights: [
                                        this.map.getBackLeftHeight({ cell: currentCell }),
                                        this.map.getBackRightHeight({ cell: currentCell }),
                                        this.map.getFrontRightHeight({ cell: currentCell }),
                                        this.map.getFrontLeftHeight({ cell: currentCell })
                                    ]
                                });
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
                        let higherCell;
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
                                for (inBetweenX = lowerHighX; inBetweenX < higherCell.x; inBetweenX += CellSize) {
                                    inBetweenCell = this.map.getCell({
                                        x: inBetweenX,
                                        z: lowerCell.z
                                    });
                                    if (inBetweenCell == null) {
                                        continue;
                                    }
                                    beforeAfterRatio = (inBetweenX - lowerHighX) / (higherCell.x - lowerHighX);
                                    //Back left.
                                    this.map.setBackLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[1] +
                                            beforeAfterRatio * higherCell.heights[0]
                                    });
                                    //Front left.
                                    this.map.setFrontLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[2] +
                                            beforeAfterRatio * higherCell.heights[3]
                                    });
                                    beforeAfterRatio = (inBetweenX + CellSize - lowerHighX) /
                                        (higherCell.x - lowerHighX);
                                    //Back right.
                                    this.map.setBackRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[1] +
                                            beforeAfterRatio * higherCell.heights[0]
                                    });
                                    //Front right.
                                    this.map.setFrontRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[2] +
                                            beforeAfterRatio * higherCell.heights[3]
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
                                currentCell = this.map.getCell({
                                    x: this.lastMouseCellX + forEachObject.xOffset,
                                    z: this.lastMouseCellZ + forEachObject.zOffset
                                });
                                if (currentCell == null) {
                                    return;
                                }
                                this.workruft.terrainEditingCells.push({
                                    x: currentCell.x, z: currentCell.z,
                                    heights: [
                                        this.map.getBackLeftHeight({ cell: currentCell }),
                                        this.map.getBackRightHeight({ cell: currentCell }),
                                        this.map.getFrontRightHeight({ cell: currentCell }),
                                        this.map.getFrontLeftHeight({ cell: currentCell })
                                    ]
                                });
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
                        let higherCell;
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
                                for (inBetweenZ = lowerHighZ; inBetweenZ < higherCell.z; inBetweenZ += CellSize) {
                                    inBetweenCell = this.map.getCell({
                                        x: lowerCell.x,
                                        z: inBetweenZ
                                    });
                                    if (inBetweenCell == null) {
                                        continue;
                                    }
                                    beforeAfterRatio = (inBetweenZ - lowerHighZ) / (higherCell.z - lowerHighZ);
                                    //Back left.
                                    this.map.setBackLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[3] +
                                            beforeAfterRatio * higherCell.heights[0]
                                    });
                                    //Back right.
                                    this.map.setBackRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[2] +
                                            beforeAfterRatio * higherCell.heights[1]
                                    });
                                    beforeAfterRatio = (inBetweenZ + CellSize - lowerHighZ) /
                                        (higherCell.z - lowerHighZ);
                                    //Front left.
                                    this.map.setFrontLeftHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[3] +
                                            beforeAfterRatio * higherCell.heights[0]
                                    });
                                    //Front right.
                                    this.map.setFrontRightHeight({
                                        cell: inBetweenCell,
                                        height: (1.0 - beforeAfterRatio) * lowerCell.heights[2] +
                                            beforeAfterRatio * higherCell.heights[1]
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
                    this.map.updateCells({
                        lowX: this.lastMouseCellX - forEachObject.floorHalfLatSize - CellSize,
                        lowZ: this.lastMouseCellZ - forEachObject.floorHalfLongSize - CellSize,
                        highX: this.lastMouseCellX + forEachObject.ceilHalfLatSize + CellSize,
                        highZ: this.lastMouseCellZ + forEachObject.ceilHalfLongSize + CellSize
                    });
                }
                //The terrain was modified; need to make sure the map editor mouse cells are in the right spot
                //afterwards.
                this.tryUpdateMouseCell(event);
                this.updateMapEditorMouseCells();
                break;
            }
            case this.inputBindings.MiscellaneousButton: {
                if (!this.tryUpdateMouseCell(event)) {
                    break;
                }
                alert(this.lastMouseCellX + ', ' + this.lastMouseCellZ + '\n' +
                    this.lastMouseCoordinates.x + ', ' + this.lastMouseCoordinates.z);
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
                this.workruft.editingLatSize = Math.min(MaxEditingLatSize, this.workruft.editingLatSize + 1);
                this.workruft.editingLongSize = Math.min(MaxEditingLongSize, this.workruft.editingLongSize + 1);
            } else if (scrollDirection > 0) {
                //Positive scroll: down/backward/out. Decrease editing size.
                this.workruft.editingLatSize = Math.max(MinEditingLatSize, this.workruft.editingLatSize - 1);
                this.workruft.editingLongSize = Math.max(MinEditingLongSize, this.workruft.editingLongSize - 1);
            }
            //Reset terrain editing data.
            this.workruft.resetTerrainEditing();
            this.workruft.updateStatusBox();
            if (event.relatedTarget != null && (event.relatedTarget.classList == null ||
                !event.relatedTarget.classList.contains('maintainCanvasMouse'))) {
                this.tryUpdateMouseCell(event);
            }
            this.updateMapEditorMouseCells();
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
        if (!RateLimitRecall({
            callingFunction: this.onMouseMove,
            minimumInterval: 1000.0 / 30.0,
            thisToBind: this,
            paramsToPass: event
        })) {
            return;
        }
        if (this.isMouseOut && !event.isMouseOutEvent) {
            this.tryUpdateMouseCell(event);
            return;
        }
        switch (this.workruft.gameState) {
            // case Enums.GameStates.Playing: {
                // break;
            // }
            case Enums.GameStates.MapEditing: {
                //TODO: Click + hold + drag editing as well.
                if (!this.tryUpdateMouseCell(event)) {
                    break;
                }
                this.updateMapEditorMouseCells();
                break;
            }
            default: {
                //Make sure to always call this.
                this.tryUpdateMouseCell(event);
                break;
            }
        }
    },

    onMouseOut(event) {
        this.isMouseOut = true;
        let newEvent = new MouseEvent('mousemove', {
            clientX: window.innerWidth * 0.5,
            clientY: window.innerHeight * 0.5,
            screenX: window.screenX + window.innerWidth * 0.5,
            screenY: window.screenY + window.innerHeight * 0.5
        });
        newEvent.isMouseOutEvent = true;
        this.onMouseMove(newEvent);
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    onMouseOver(event) {
        this.isMouseOut = false;
        event.preventDefault();
        event.stopPropagation();
        return false;
    },

    tryUpdateMouseCell(event) {
        let pickedMapObjectArray = this.workruft.world.pickMap(
            this.workruft.world.getNormalizedCanvasMouse(event));
        if (pickedMapObjectArray.length == 0) {
            return false;
        }
        this.lastMouseCoordinates = pickedMapObjectArray[0].point;
        this.lastMouseCellX = AlignToCell(this.lastMouseCoordinates.x);
        this.lastMouseCellZ = AlignToCell(this.lastMouseCoordinates.z);
        return true;
    }
};