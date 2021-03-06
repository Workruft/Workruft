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

        this.inputBindings = new InputBindings();
        this.inputHandler = new InputHandler({ workruft: this, inputBindings: this.inputBindings });

        this.chat = new Chat(this.onChatEntry.bind(this));
        this.chat.print({ message: 'Workruft!' });
        this.chat.print({ message: 'Controls:' });
        this.chat.print({
            message: '  ' + this.inputBindings.MoveCameraUp + this.inputBindings.MoveCameraLeft +
                this.inputBindings.MoveCameraDown + this.inputBindings.MoveCameraRight + ': pan the camera'
        });
        this.chat.print({ message: '  ' + this.inputBindings.ToggleChat + ': toggle chat' });
        this.chat.print({ message: '  Left click: select unit' });
        this.chat.print({ message: '  Right click: order unit' });
        this.chat.print({ message: '  Middle click: alert coordinates of mouse' });
        this.chat.print({ message: '  Mouse scroll: zoom in/out' });
        this.chat.print({ message: '  Ctrl/Shift + Mouse scroll: change map editing size' });
        this.chat.print({ message: '  ' + this.inputBindings.ToggleMapEditor + ': toggle map editing mode' });
        this.chat.print({ message: '  Shift + ' + this.inputBindings.NewMap + ': create a new map' });
        this.chat.print({ message: '  ' + this.inputBindings.ToggleGridLines + ': toggle grid lines' });
        this.chat.print({
            message: '  ' + this.inputBindings.ToggleVerticalGridLines + ': toggle vertical grid lines'
        });
        this.chat.print({
            message: '  ' + this.inputBindings.ToggleEditorVerticalLines + ': toggle map editor vertical lines'
        });
        this.chat.print({ message: '  ' + this.inputBindings.TogglePathTesting + ': toggle map path testing' });
        this.chat.print({ message: 'Use -c <IP address here> to connect to a server.' });
        this.chat.print({ message: 'Use -d to disconnect from any connected server.' });

        this.world = new World();
        this.setDefaultCamera();
        this.world.graphicsLoop();
        this.network = new Network(this.chat);

        this.terrainEditingMode = Enums.TerrainEditingModes.IncreaseHeight;
        this.resetTerrainEditing();
        this.editingLatSize = 4;
        this.editingLongSize = 4;

        this.isDrawingGrid = false;
        this.gridLines = [];
        this.isDrawingVerticalGrid = false;
        this.verticalGridLines = [];

        this.objectsToUpdate = new Set();

        //Game units etc.
        this.playerUnit = new GameUnit({
            workruft: this,
            gameModel: this.world.sheepModel,
            // gameModel: this.world.wolfModel,
            x: -CellSize,
            z: -CellSize
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
            this.playerUnit.clearColoredRectangles();
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

        setInterval(this.onUpdate.bind(this), 30);
        this.updateStatusBox();
    }

    deconstruct() {
        this.world.deconstruct();
        this.network.deconstruct();
        //TODO: Units! Here or in World.
    }

    setDefaultCamera() {
        this.world.camera.position.set(0, 75, 10);
        this.world.camera.lookAt(0, 0, this.world.camera.position.z - 10);
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

    resetTerrainEditing() {
        this.terrainEditingCells = [];
        this.terrainEditingCenterCell = null;
        this.terrainEditingLatSize = 0;
        this.terrainEditingLongSize = 0;
    }

    onChatEntry(text) {
        this.chat.print({ message: 'You: ' + text });
        let trimText = text.trim();
        if (trimText == '-c') {
            this.network.connect('localhost');
        } else if (trimText.substring(0, 3) == '-c ') {
            this.network.connect(trimText.substring(3));
        } else if (trimText == '-d') {
            this.network.disconnect();
        }
    }

    updateStatusBox() {
        HTML.statusBox.innerHTML = '';
        HTML.statusBox.innerHTML += 'Game Mode: ' + Enums.GameStates.items[this.gameState];
        if (this.isPathTesting) {
            HTML.statusBox.innerHTML += ' (Path Testing)';
        }
        HTML.statusBox.innerHTML +=  '<br/>Map Size: ' + this.world.map.sizeX + 'x' + this.world.map.sizeZ;
        if (this.gameState == Enums.GameStates.MapEditing) {
            HTML.statusBox.innerHTML +=  '<br/>Editing Mode: ' + Enums.TerrainEditingModes[this.terrainEditingMode];
            HTML.statusBox.innerHTML +=  '<br/>Editing Size: ' + this.editingLatSize + 'x' + this.editingLongSize;
            HTML.statusBox.innerHTML +=  '<br/>Has Cloning Data: ' +
                (this.terrainEditingCells.length > 0 ? 'yes (' + this.terrainEditingLatSize + ', ' +
                this.terrainEditingLongSize + ')' : 'no');
        }
    }
}

module.exports = Workruft;