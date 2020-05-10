//A single pathing line for path testing.
//This class is designed to promote reusability.
class PathingLine {
    constructor({ startX, startZ, endX, endZ }) {
        this.startX = startX;
        this.startZ = startZ;
        this.endX = endX;
        this.endZ = endZ;
        this.innerDirections = [];

        // game.world.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(this.startX, 0.01, this.startZ),
        //     new THREE.Vector3(this.endX, 0.01, this.endZ)
        // ]), new THREE.LineBasicMaterial({ color: 'orange' })));
    }

    //Starts at the first cell past the starting cell towards the end position if any.
    //Every cell traveled is guaranteed to be in one of the 4 cardinal directions from
    //the previous cell (or null after already reached last cell).
    setupTesting({ map }) {
        let cellX = FloorToCell(this.startX);
        let cellZ = FloorToCell(this.startZ);
        let diffX = this.endX - this.startX;
        let diffZ = this.endZ - this.startZ;
        //Straight distance to the first vertical grid boundary.
        let xOffset = this.endX > this.startX ?
            (CeilToCell(this.startX) - this.startX) :
            (this.startX - cellX);
        //Straight distance to the first horizontal grid boundary.
        let yOffset = this.endZ > this.startZ ?
            (CeilToCell(this.startZ) - this.startZ) :
            (this.startZ - cellZ);
        //Angle of ray/slope.
        let angle = Math.atan2(-diffZ, diffX);

        this.xDirection = (diffX >= 0.0 ?
            Enums.CardinalDirections.right : Enums.CardinalDirections.left);
        this.yDirection = (diffZ >= 0.0 ?
            Enums.CardinalDirections.front : Enums.CardinalDirections.back);
        //Note: These can be divide by 0's, but JS just yields Infinity! :)
        //How far to move along the ray to cross the first vertical grid cell boundary.
        this.tMaxX = xOffset / Math.cos(angle);
        //How far to move along the ray to cross the first horizontal grid cell boundary.
        this.tMaxZ = yOffset / Math.sin(angle);
        //How far to move along the ray to move horizontally 1 grid cell.
        this.tDeltaX = CellSize / Math.cos(angle);
        //How far to move along the ray to move vertically 1 grid cell.
        this.tDeltaZ = CellSize / Math.sin(angle);

        //Travel one grid cell at a time.
        this.manhattanDistance = Math.abs(FloorToCell(this.endX) - cellX) +
            Math.abs(FloorToCell(this.endZ) - cellZ);

        this.currentCell = map.getCell({ x: cellX, z: cellZ });
        this.currentDistance = Infinity;
        this.traveledCells = 0;
    }
    testNextCell() {
        if (this.traveledCells >= this.manhattanDistance) {
            return null;
        }
        ++this.traveledCells;
        //Only move in either X or Z coordinates, not both.
        if (Math.abs(this.tMaxX) < Math.abs(this.tMaxZ)) {
            this.tMaxX += this.tDeltaX;
            return this.xDirection;
        } else {
            this.tMaxZ += this.tDeltaZ;
            return this.yDirection;
        }
    }
}