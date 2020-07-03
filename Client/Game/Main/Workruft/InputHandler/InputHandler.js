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
        this.lastMouseCoordinates = new THREE.Vector3();
        this.lastMouseCellX = 0.0;
        this.lastMouseCellZ = 0.0;
        this.isMouseOut = false;

        this.mapEditorSquares = [];
        this.mapEditorDrawVerticalLines = false;
        this.mapEditorVerticalLines = [];

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
        document.addEventListener('mouseout', this.onDocumentMouseOut.bind(this));
        document.addEventListener('mouseover', this.onDocumentMouseOver.bind(this));

        this.setupTerrainButtons();
    }

    clearMapEditorHelpers() {
        for (let editorSquare of this.mapEditorSquares) {
            editorSquare.deconstruct();
        }
        this.mapEditorSquares = [];
        for (let verticalLine of this.mapEditorVerticalLines) {
            this.workruft.world.scene.remove(verticalLine);
        }
        this.mapEditorVerticalLines = [];
    }

    updateMapEditorMouseCells() {
        if (!RateLimitRecall({
            callingFunction: this.updateMapEditorMouseCells,
            minimumInterval: 1000.0 / 30.0,
            thisToBind: this
        })) {
            return;
        }
        this.clearMapEditorHelpers();
        if (this.workruft.gameState != Enums.GameStates.MapEditing) {
            return;
        }
        switch (this.workruft.terrainEditingMode) {
            case Enums.TerrainEditingModes.LatRamp: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.mapEditorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: this.lastMouseCellX - iterationBounds.floorHalfLatSize,
                    z: this.lastMouseCellZ,
                    sizeX: CellSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                this.mapEditorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: this.lastMouseCellX + iterationBounds.ceilHalfLatSize - CellSize,
                    z: this.lastMouseCellZ,
                    sizeX: CellSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                if (this.mapEditorDrawVerticalLines) {
                    let longIncrement = Math.max(CellSize, this.workruft.editingLongSize);
                    for (let z = this.lastMouseCellZ - iterationBounds.floorHalfLongSize;
                        z <= this.lastMouseCellZ + iterationBounds.ceilHalfLongSize;
                        z += longIncrement) {
                        for (let x = this.lastMouseCellX - iterationBounds.floorHalfLatSize;
                            x <= this.lastMouseCellX - iterationBounds.floorHalfLatSize + CellSize;
                            x += CellSize) {
                            this.mapEditorVerticalLines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(x, MapBottomY, z),
                                new THREE.Vector3(x, VerticalGridLinesHeight, z)
                            ]), EditingVerticalLinesMaterial));
                        }
                        for (let x = this.lastMouseCellX + iterationBounds.ceilHalfLatSize - CellSize;
                            x <= this.lastMouseCellX + iterationBounds.ceilHalfLatSize;
                            x += CellSize) {
                            this.mapEditorVerticalLines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(x, MapBottomY, z),
                                new THREE.Vector3(x, VerticalGridLinesHeight, z)
                            ]), EditingVerticalLinesMaterial));
                        }
                    }
                }
                break;
            }
            case Enums.TerrainEditingModes.LongRamp: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.mapEditorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: this.lastMouseCellX,
                    z: this.lastMouseCellZ - iterationBounds.floorHalfLongSize,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: CellSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                this.mapEditorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: this.lastMouseCellX,
                    z: this.lastMouseCellZ + iterationBounds.ceilHalfLongSize - CellSize,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: CellSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                if (this.mapEditorDrawVerticalLines) {
                    let latIncrement = Math.max(CellSize, this.workruft.editingLatSize);
                    for (let x = this.lastMouseCellX - iterationBounds.floorHalfLatSize;
                        x <= this.lastMouseCellX + iterationBounds.ceilHalfLatSize;
                        x += latIncrement) {
                        for (let z = this.lastMouseCellZ - iterationBounds.floorHalfLongSize;
                            z <= this.lastMouseCellZ - iterationBounds.floorHalfLongSize + CellSize;
                            z += CellSize) {
                            this.mapEditorVerticalLines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(x, MapBottomY, z),
                                new THREE.Vector3(x, VerticalGridLinesHeight, z)
                            ]), EditingVerticalLinesMaterial));
                        }
                        for (let z = this.lastMouseCellZ + iterationBounds.ceilHalfLongSize - CellSize;
                            z <= this.lastMouseCellZ + iterationBounds.ceilHalfLongSize;
                            z += CellSize) {
                            this.mapEditorVerticalLines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(x, MapBottomY, z),
                                new THREE.Vector3(x, VerticalGridLinesHeight, z)
                            ]), EditingVerticalLinesMaterial));
                        }
                    }
                }
                break;
            }
            default: {
                let iterationBounds = GetIterationBounds(this.workruft.editingLatSize, this.workruft.editingLongSize);
                this.mapEditorSquares.push(new ColoredRectangle({
                    workruft: this.workruft,
                    x: this.lastMouseCellX,
                    z: this.lastMouseCellZ,
                    sizeX: this.workruft.editingLatSize,
                    sizeZ: this.workruft.editingLongSize,
                    color: DarkGrayColor,
                    opacity: 0.5
                }));
                if (this.mapEditorDrawVerticalLines) {
                    let latIncrement = Math.max(CellSize, this.workruft.editingLatSize);
                    let longIncrement = Math.max(CellSize, this.workruft.editingLongSize);
                    for (let x = this.lastMouseCellX - iterationBounds.floorHalfLatSize;
                        x <= this.lastMouseCellX + iterationBounds.ceilHalfLatSize;
                        x += latIncrement) {
                        for (let z = this.lastMouseCellZ - iterationBounds.floorHalfLongSize;
                            z <= this.lastMouseCellZ + iterationBounds.ceilHalfLongSize;
                            z += longIncrement) {
                            this.mapEditorVerticalLines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                                new THREE.Vector3(x, MapBottomY, z),
                                new THREE.Vector3(x, VerticalGridLinesHeight, z)
                            ]), EditingVerticalLinesMaterial));
                        }
                    }
                }
                break;
            }
        }
        for (let verticalLine of this.mapEditorVerticalLines) {
            this.workruft.world.scene.add(verticalLine);
        }
    }

    get map() {
        return this.workruft.world.map;
    }
}

module.exports = InputHandler;