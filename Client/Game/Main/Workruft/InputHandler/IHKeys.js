let GameMap = require('../../GameMap');

module.exports = {
    onKeyDown(event) {
        let upperKey = event.key.toUpperCase();
        this.keysDown.add(upperKey);
        if (!event.repeat) {
            switch (upperKey) {
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
                        event.stopPropagation();
                        return false;
                    }
                    break;
                }
            }

            if (!this.workruft.chat.isChatting) {
                switch (upperKey) {
                    case this.inputBindings.ToggleMapEditor: {
                        if (this.workruft.gameState == Enums.GameStates.Playing) {
                            this.workruft.world.deselectAll();
                            HTML.mapEditToolPanel.hidden = false;
                            this.workruft.gameState = Enums.GameStates.MapEditing;
                        } else if (this.workruft.gameState == Enums.GameStates.MapEditing) {
                            this.clearEditorSquares();
                            HTML.mapEditToolPanel.hidden = true;
                            this.workruft.gameState = Enums.GameStates.Playing;
                        }
                        this.workruft.updateStatusBox();
                        break;
                    }
                    case this.inputBindings.TogglePathTesting: {
                        this.workruft.isPathTesting = !this.workruft.isPathTesting;
                        if (this.workruft.isPathTesting) {
                            for (let n = 0; n < this.workruft.randoUnits.length; ++n) {
                                this.workruft.randoUnits[n].cancelAllOrders();
                                this.workruft.randoUnits[n].position.x = this.workruft.playerUnit.position.x;
                                this.workruft.randoUnits[n].position.z = this.workruft.playerUnit.position.z;
                                this.workruft.randoUnits[n].autoSetHeight();
                            }
                        } else {
                            for (let n = 0; n < this.workruft.randoUnits.length; ++n) {
                                this.workruft.randoUnits[n].cancelAllOrders();
                                this.workruft.randoUnits[n].clearColoredRectangles();
                                this.workruft.randoUnits[n].position.y = -100.0;
                            }
                            this.workruft.playerUnit.clearColoredRectangles();
                        }
                        this.workruft.updateStatusBox();
                        break;
                    }
                    case this.inputBindings.NewMap: {
                        if (!event.shiftKey) {
                            break;
                        }
                        let newWidth = this.map.sizeX;
                        do {
                            newWidth = window.prompt('New map width (integer, 20-250):', newWidth);
                            if (newWidth == null) {
                                break;
                            }
                            newWidth = Math.floor(newWidth);
                            if (!Number.isInteger(newWidth) || newWidth < 20 || newWidth > 250) {
                                alert('Invalid width!');
                                continue;
                            }
                            break;
                        } while (true);
                        if (!newWidth) {
                            break;
                        }
                        let newHeight = this.map.sizeZ;
                        do {
                            newHeight = window.prompt('New map height (integer, 20-250):', newHeight);
                            if (newHeight == null) {
                                break;
                            }
                            newHeight = Math.floor(newHeight);
                            if (!Number.isInteger(newHeight) || newHeight < 20 || newHeight > 250) {
                                alert('Invalid height!');
                                continue;
                            }
                            break;
                        } while (true);
                        if (!newHeight) {
                            break;
                        }
                        if (!window.confirm(
                            'Warning: This will destroy your current map! Are you sure you want to proceed?')) {
                            break;
                        }
                        this.workruft.world.changeMap(
                            new GameMap(newWidth, newHeight, MapBottomY));
                        this.workruft.setDefaultCamera();
                        break;
                    }
                    case this.inputBindings.ToggleGridLines: {
                        this.isDrawingGrid = !this.isDrawingGrid;
                        if (this.isDrawingGrid) {
                            //Add grid lines.
                            let newGridLine;
                            for (let x = this.map.gridMinX; x <= this.map.gridMaxX; x += GridLinesSeparation) {
                                newGridLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                    new THREE.Vector3(x, 0.01, this.map.gridMinZ),
                                    new THREE.Vector3(x, 0.01, this.map.gridMaxZ)
                                ]), GridLinesMaterial);
                                this.workruft.gridLines.push(newGridLine);
                                this.workruft.world.scene.add(newGridLine);
                            }
                            for (let z = this.map.gridMinZ; z <= this.map.gridMaxZ; z += GridLinesSeparation) {
                                newGridLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                    new THREE.Vector3(this.map.gridMinX, 0.01, z),
                                    new THREE.Vector3(this.map.gridMaxX, 0.01, z)
                                ]), GridLinesMaterial);
                                this.workruft.gridLines.push(newGridLine);
                                this.workruft.world.scene.add(newGridLine);
                            }
                        } else {
                            //Remove grid lines.
                            for (let gridLine of this.workruft.gridLines) {
                                this.workruft.world.scene.remove(gridLine);
                            }
                            this.workruft.gridLines = [];
                        }
                        break;
                    }
                    case this.inputBindings.ToggleVerticalGridLines: {
                        this.isDrawingVerticalGrid = !this.isDrawingVerticalGrid;
                        if (this.isDrawingVerticalGrid) {
                            //Add vertical grid lines.
                            let newVerticalGridLine;
                            for (let x = this.map.gridMinX; x <= this.map.gridMaxX; x += VerticalGridLinesSeparation) {
                                for (let z = this.map.gridMinZ; z <= this.map.gridMaxZ;
                                    z += VerticalGridLinesSeparation) {
                                    newVerticalGridLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                        new THREE.Vector3(x, MapBottomY, z),
                                        new THREE.Vector3(x, VerticalGridLinesHeight, z)
                                    ]), GridLinesMaterial);
                                    this.workruft.verticalGridLines.push(newVerticalGridLine);
                                    this.workruft.world.scene.add(newVerticalGridLine);
                                }
                            }
                        } else {
                            //Remove vertical grid lines.
                            for (let verticalGridLine of this.workruft.verticalGridLines) {
                                this.workruft.world.scene.remove(verticalGridLine);
                            }
                            this.workruft.verticalGridLines = [];
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
                event.stopPropagation();
                return false;
            }
        }
    },

    onKeyUp(event) {
        let upperKey = event.key.toUpperCase();
        this.keysDown.delete(upperKey);
        // switch (upperKey) {
        // }
    }
};