//This class is designed for maximum reusability.
class PathingTester {
    constructor({ map, gameModel }) {
        this.map = map;
        this.gameModel = gameModel;
        this.start = new XZPair({ x: 0.0, z: 0.0 });
        this.end = new XZPair({ x: 0.0, z: 0.0 });
    }

    setEnds({ startX, startZ, endX, endZ }) {
        this.start.x = startX;
        this.start.z = startZ;
        this.end.x = endX;
        this.end.z = endZ;
    }

    limitDistance({ maxDistance }) {
        this.maxDistance = maxDistance;
        this.xDistance = this.end.x - this.start.x;
        this.zDistance = this.end.z - this.start.z;
        this.euclidianDistance = Math.hypot(this.xDistance, this.zDistance);
        this.manhattanDistance = Math.abs(this.xDistance) + Math.abs(this.zDistance);
        if (this.euclidianDistance < this.maxDistance) {
            //Closer to the destination than the maximum distance.
            this.limitedEndX = this.end.x;
            this.limitedEndZ = this.end.z;
            this.limitedDistance = this.euclidianDistance;
        } else {
            //Travel at the maximum distance.
            this.limitedEndX = this.start.x + this.maxDistance * this.xDistance / this.manhattanDistance;
            this.limitedEndZ = this.start.z + this.maxDistance * this.zDistance / this.manhattanDistance;
            this.limitedDistance = this.maxDistance;
        }
    }
}