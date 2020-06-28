let ColoredSquare = require('../../../Helpers/ColoredSquare');
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
        if (!RateLimit({
            callingFunction: this.updateMapEditorMouseCells,
            minimumInterval: 1000.0 / 30.0
        })) {
            return;
        }
        this.clearEditorSquares();
        let halfEditingLongSize = this.workruft.editingLongSize * 0.5;
        let halfEditingLatSize = this.workruft.editingLatSize * 0.5;
        let floorHalfEditingLongSize = FloorToCell(halfEditingLongSize);
        let ceilHalfEditingLongSize = CeilToCell(halfEditingLongSize);
        let floorHalfEditingLatSize = FloorToCell(halfEditingLatSize);
        let ceilHalfEditingLatSize = CeilToCell(halfEditingLatSize);
        for (let xOffset = -floorHalfEditingLatSize; xOffset < ceilHalfEditingLatSize; xOffset += CellSize) {
            for (let zOffset = -floorHalfEditingLongSize; zOffset < ceilHalfEditingLongSize; zOffset += CellSize) {
                this.editorSquares.push(new ColoredSquare({
                    workruft: this.workruft,
                    x: cellX + xOffset + HalfCellSize,
                    z: cellZ + zOffset + HalfCellSize,
                    color: BlackColor
                }));
            }
        }
    }
}

module.exports = InputHandler;