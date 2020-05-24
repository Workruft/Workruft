class Workruft {
    constructor() {
        this.gameState = Enums.GameStates.Playing;

        this.inputBindings = new InputBindings();
        this.inputHandler = new InputHandler({ workruft: this, inputBindings: this.inputBindings });

        this.chat = new Chat(this.onChatEntry.bind(this));
        this.chat.print({ message: 'Workruft!' });
        this.chat.print({ message: 'Press \'m\' to toggle map editing mode.' });
        this.world = new World(this.chat, this.onUpdate.bind(this));
        this.world.camera.position.set(0, 75, 10);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 10);
        this.world.graphicsLoop();
        this.network = new Network(this.chat);

        this.objectsToUpdate = new Set();

        //Game units etc.
        this.playerUnit = new GameUnit({
            workruft: this,
            gameModel: this.world.sheepModel,
            // gameModel: this.world.wolfModel,
            x: HalfCellSize,
            z: HalfCellSize
        });
        this.playerUnit.addToGroup({ objectGroup: this.world.playerObjects });

        this.randoUnits = [];
        for (let n = 0; n < 10; ++n) {
            this.randoUnits.push(new GameUnit({
                workruft: this,
                gameModel: n > 5 ? this.world.sheepModel : this.world.wolfModel,
                x: HalfCellSize,
                z: HalfCellSize
            }));
            this.randoUnits[n].addToGroup({ objectGroup: this.world.playerObjects });
        }
        setInterval(function() {
            if (this.gameState != Enums.GameStates.Playing) {
                return;
            }
            for (let n = 0; n < this.randoUnits.length; ++n) {
                let newOrderObject = {
                    order: new Order({
                        type: Enums.OrderTypes.Move,
                        data: {
                            x: Math.random() * (this.world.map.maxX - this.world.map.minX) + this.world.map.minX,
                            z: Math.random() * (this.world.map.maxZ - this.world.map.minZ) + this.world.map.minZ
                        }
                    })
                };
                this.randoUnits[n].issueReplacementOrder(newOrderObject);
            }
        }.bind(this), 4000);

        //this.network.connect();

        setInterval(this.onUpdate.bind(this), 30);
    }

    deconstruct() {
        this.world.deconstruct();
        this.network.deconstruct();
        //TODO: Units! Here or in World.
    }

    onUpdate() {
        let deltaTimeMS = this.world.clock.getDelta();
        for (let objectToUpdate of this.objectsToUpdate) {
            objectToUpdate.update({ deltaTimeMS });
        }

        if (!this.chat.isChatting) {
            let cameraMoveAmount = Math.tan(Math.PI * 0.01) * this.world.camera.position.y;
            if (this.inputHandler.keysDown.has(this.inputBindings.MoveCameraUp)) {
                this.world.camera.position.z -= cameraMoveAmount;
            }
            if (this.inputHandler.keysDown.has(this.inputBindings.MoveCameraDown)) {
                this.world.camera.position.z += cameraMoveAmount;
            }
            if (this.inputHandler.keysDown.has(this.inputBindings.MoveCameraLeft)) {
                this.world.camera.position.x -= cameraMoveAmount;
            }
            if (this.inputHandler.keysDown.has(this.inputBindings.MoveCameraRight)) {
                this.world.camera.position.x += cameraMoveAmount;
            }
        }
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
    }
}