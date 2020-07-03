let ColoredRectangle = require('../../../Helpers/ColoredRectangle');
let IHKeys = require('./IHKeys');
let IHGameMouse = require('./IHGameMouse');
let IHDocumentMouse = require('./IHDocumentMouse');
let IHTerrainButtons = require('./IHTerrainButtons');

Enums.create({
    name: 'TerrainEditingModes',
    items: [
        'DecreaseHeight', 'IncreaseHeight',
        'FlattenHeight', 'RaiseHeight',
        'LevelHeight', 'CloneHeight',
        'LongRamp', 'LatRamp'
    ]
});

class InputHandler {
    constructor({ workruft, inputBindings }) {
        this.workruft = workruft;
        this.inputBindings = inputBindings;

        BindToClass(IHKeys, this);
        BindToClass(IHGameMouse, this);
        BindToClass(IHDocumentMouse, this);
        BindToClass(IHTerrainButtons, this);

        this.keysDown = new Set();
        this.mouseButtonsDown = new Set();

        //Disable right click.
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        HTML.gameCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        HTML.gameCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        HTML.gameCanvas.addEventListener('wheel', this.onWheel.bind(this));
        HTML.gameCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        HTML.gameCanvas.addEventListener('mouseout', this.onMouseOut.bind(this));
        HTML.gameCanvas.addEventListener('mouseover', this.onMouseOver.bind(this));
        document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this));
        document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));
        document.addEventListener('wheel', this.onDocumentWheel.bind(this));
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));

        this.setupTerrainButtons();
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
        if (!RateLimitRecall({
            callingFunction: this.updateMapEditorMouseCells,
            minimumInterval: 1000.0 / 30.0,
            thisToBind: this,
            paramsToPass: { cellX, cellZ }
        })) {
            return;
        }
        this.clearEditorSquares();
        if (this.workruft.gameState != Enums.GameStates.MapEditing) {
            return;
        }
        switch (this.workruft.terrainEditingMode) {
            case Enums.TerrainEditingModes.LatRamp: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.editorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: cellX - iterationBounds.floorHalfLatSize,
                    z: cellZ,
                    sizeX: CellSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                this.editorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: cellX + iterationBounds.ceilHalfLatSize - CellSize,
                    z: cellZ,
                    sizeX: CellSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                break;
            }
            case Enums.TerrainEditingModes.LongRamp: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.editorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: cellX,
                    z: cellZ - iterationBounds.floorHalfLongSize,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: CellSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                this.editorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: cellX,
                    z: cellZ + iterationBounds.ceilHalfLongSize - CellSize,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: CellSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                break;
            }
            default: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.editorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: cellX,
                    z: cellZ,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                break;
            }
        }
    }

    get map() {
        return this.workruft.world.map;
    }
}

module.exports = InputHandler;