let InputBindings = require('./InputBindings');
let InputHandler = require('./InputHandler/InputHandler');
let Chat = require('../../Helpers/Chat');
let World = require('../World');
let Network = require('../Network');
let GameUnit = require('../GameUnit');
let Order = require('../../Helpers/Order');

class Workruft {
    constructor() {
        this.gameState = Enums.GameStates.Playing;
        this.isPathTesting = false;
        this.updateStatusBox();

        this.inputBindings = new InputBindings();
        this.inputHandler = new InputHandler({ workruft: this, inputBindings: this.inputBindings });

        this.chat = new Chat(this.onChatEntry.bind(this));
        this.chat.print({ message: 'Workruft!' });
        this.chat.print({ message: 'Controls:' });
        this.chat.print({
            message: '  '+ this.inputBindings.MoveCameraUp + this.inputBindings.MoveCameraLeft +
                this.inputBindings.MoveCameraDown + this.inputBindings.MoveCameraRight + ': pan the camera'
        });
        this.chat.print({
            message: '  ' + this.inputBindings.ToggleChat + ': toggle chat'
        });
        this.chat.print({ message: '  Left click: select unit' });
        this.chat.print({ message: '  Right click: order unit' });
        this.chat.print({ message: '  Mouse scroll: zoom in/out' });
        this.chat.print({
            message: '  ' + this.inputBindings.ToggleMapEditor + ': toggle map editing mode'
        });
        this.chat.print({
            message: '  ' + this.inputBindings.TogglePathTesting + ': toggle map path testing'
        });
        this.world = new World(this.chat, this.onUpdate.bind(this));
        this.world.camera.position.set(0, 75, 10);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 10);
        this.world.graphicsLoop();
        this.network = new Network(this.chat);

        this.terrainEditingMode = Enums.TerrainEditingModes.IncreaseHeight;
        this.editingLatSize = 4;
        this.editingLongSize = 4;

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
            let randomPoint = this.world.map.getRandomPointOnMap();
            this.randoUnits.push(new GameUnit({
                workruft: this,
                gameModel: n > 5 ? this.world.sheepModel : this.world.wolfModel,
                x: this.playerUnit.position.x,
                z: this.playerUnit.position.x
            }));
            this.randoUnits[n].position.y = -100.0;
            this.randoUnits[n].addToGroup({ objectGroup: this.world.playerObjects });
        }
        setInterval(function() {
            if (!this.isPathTesting) {
                return;
            }
            this.playerUnit.clearColoredSquares();
            for (let n = 0; n < this.randoUnits.length; ++n) {
                let newOrderObject = {
                    order: new Order({
                        type: Enums.OrderTypes.Move,
                        data: this.world.map.getRandomPointOnMap()
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

    updateStatusBox() {
        HTML.statusBox.innerHTML = '';
        HTML.statusBox.innerHTML += 'Game Mode: ' + Enums.GameStates.items[this.gameState];
        if (this.isPathTesting) {
            HTML.statusBox.innerHTML += ' (Path Testing)';
        }
        if (this.gameState == Enums.GameStates.MapEditing) {
            HTML.statusBox.innerHTML +=  '<br/>Editing Mode: ' + Enums.TerrainEditingModes[this.terrainEditingMode];
            HTML.statusBox.innerHTML +=  '<br/>Editing Size: ' + this.editingLatSize + 'x' + this.editingLongSize;
        }
    }
}

module.exports = Workruft;