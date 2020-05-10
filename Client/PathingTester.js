//This class is designed for maximum reusability.
class PathingTester {
    constructor({ map, gameModel }) {
        this.map = map;
        this.gameModel = gameModel;
        this.startX = 0.0;
        this.startZ = 0.0;
        this.endX = 0.0;
        this.endZ = 0.0;
    }

    setEnds({ startX, startZ, endX, endZ }) {
        this.startX = startX;
        this.startZ = startZ;
        this.endX = endX;
        this.endZ = endZ;
    }

    limitDistance({ maxDistance }) {
        this.maxDistance = maxDistance;
        this.xDistance = this.endX - this.startX;
        this.zDistance = this.endZ - this.startZ;
        this.euclidianDistance = Math.hypot(this.xDistance, this.zDistance);
        this.manhattanDistance = Math.abs(this.xDistance) + Math.abs(this.zDistance);
        if (this.euclidianDistance < this.maxDistance) {
            //Closer to the destination than the maximum distance.
            this.limitedEndX = this.endX;
            this.limitedEndZ = this.endZ;
            this.limitedDistance = this.euclidianDistance;
        } else {
            //Travel at the maximum distance.
            this.limitedEndX = this.startX + this.maxDistance * this.xDistance / this.manhattanDistance;
            this.limitedEndZ = this.startZ + this.maxDistance * this.zDistance / this.manhattanDistance;
            this.limitedDistance = this.maxDistance;
        }
    }
}