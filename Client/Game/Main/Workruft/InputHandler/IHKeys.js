module.exports = {
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
                        event.stopPropagation();
                        return false;
                    }
                    break;
                }
            }

            if (!this.workruft.chat.isChatting) {
                switch (event.key) {
                    case this.inputBindings.ToggleMapEditor: {
                        if (this.workruft.gameState == Enums.GameStates.Playing) {
                            this.workruft.world.deselectAll();
                            this.workruft.gameState = Enums.GameStates.MapEditing;
                        } else if (this.workruft.gameState == Enums.GameStates.MapEditing) {
                            this.clearEditorSquares();
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
                                this.workruft.randoUnits[n].position.x = this.workruft.playerUnit.position.x +
                                    this.workruft.playerUnit.gameModel.xzSize;
                                this.workruft.randoUnits[n].position.z = this.workruft.playerUnit.position.z +
                                    this.workruft.playerUnit.gameModel.xzSize;
                                this.workruft.randoUnits[n].autoSetHeight();
                            }
                        } else {
                            for (let n = 0; n < this.workruft.randoUnits.length; ++n) {
                                this.workruft.randoUnits[n].cancelAllOrders();
                                this.workruft.randoUnits[n].clearColoredSquares();
                                this.workruft.randoUnits[n].position.y = -100.0;
                            }
                            this.workruft.playerUnit.clearColoredSquares();
                        }
                        this.workruft.updateStatusBox();
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
        this.keysDown.delete(event.key);
        // switch (event.key) {
        // }
    }
};