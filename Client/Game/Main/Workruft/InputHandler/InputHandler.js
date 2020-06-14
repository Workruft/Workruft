let ColoredSquare = require('../../../Helpers/ColoredSquare');
let IHKeys = require('./IHKeys');
let IHGameMouse = require('./IHGameMouse');
let IHDocumentMouse = require('./IHDocumentMouse');

class InputHandler {
    constructor({ workruft, inputBindings }) {
        this.workruft = workruft;
        this.inputBindings = inputBindings;

        this.keysDown = new Set();
        this.mouseButtonsDown = new Set();

        BindToClass(IHKeys, this);
        BindToClass(IHGameMouse, this);
        BindToClass(IHDocumentMouse, this);

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
        let halfEditingSize = this.workruft.editingSize * 0.5;
        let floorHalfEditingSize = FloorToCell(halfEditingSize);
        let ceilHalfEditingSize = CeilToCell(halfEditingSize);
        for (let xOffset = -floorHalfEditingSize; xOffset < ceilHalfEditingSize; xOffset += CellSize) {
            for (let zOffset = -floorHalfEditingSize; zOffset < ceilHalfEditingSize; zOffset += CellSize) {
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