class GameUnit {
    constructor({ workruft, gameModel, x, z }) {
        this.workruft = workruft;
        this.gameModel = gameModel;
        this.group = new THREE.Group();
        this.position.set(x, 0.0, z);
        this.private = {
            mesh: gameModel.createNewMesh(),
            orders: [],
            speed: 50.0
        };
        this.private.mesh.position.y = this.gameModel.halfYSize;
        this.private.mesh.userData = this;
        this.autoSetHeight();
        this.group.add(this.private.mesh);

        this.isSelected = false;
    }

    destroy() {
        this.deselect();
        if (this.mesh != null) {
            delete this.mesh;
        }
    }

    issueReplacementOrder({ order }) {
        this.private.orders = [];
        this.issueAdditionalOrder({ order });
    }

    issueAdditionalOrder({ order }) {
        this.private.orders.push(order);
        this.workruft.objectsToUpdate.add(this);
    }

    update({ deltaTimeMS }) {
        let lastPositionX = this.position.x;
        let lastPositionZ = this.position.z;
        let updateComplete = false;
        while (this.private.orders.length > 0 && deltaTimeMS > 0) {
            let currentOrder = this.private.orders[0];
            switch (currentOrder.type) {
                case Enums.OrderTypes.Move:
                {
                    if (this.private.speed <= 0.0) {
                        this.private.orders.splice(0, 1);
                    }

                    //Determine current movement step endpoints and related calculations.
                    let maxDistance = this.private.speed * deltaTimeMS;
                    let {
                        limitedX: newX, limitedZ: newZ, limitedDistance,
                        fullXDistance, fullZDistance, fullManhattanDistance
                    } = LimitDistance({
                        startX: this.position.x,
                        startZ: this.position.z,
                        endX: currentOrder.data.x,
                        endZ: currentOrder.data.z,
                        maxDistance
                    });
                    let worldMap = this.workruft.world.map;
                    //Determine the minimum distance the unit can go towards the current movement step before reaching an
                    //obstruction in the path.
                    let minPathable = ComputeMinPathable({
                        startX: this.position.x,
                        startZ: this.position.z,
                        endX: newX,
                        endZ: newZ,
                        traversalAngle: Math.atan2(-fullZDistance, fullXDistance),
                        unitRadius: this.gameModel.halfXZSize,
                        numberOfExtraPathingLines: this.gameModel.numberOfExtraPathingLines,
                        worldMap
                    });

                    //See if the unit's current movement step path is obstructed.
                    if (minPathable.distance == Infinity) {
                        //Unobstructed; gogogo, full speed.
                        this.position.x = newX;
                        this.position.z = newZ;
                        deltaTimeMS -= limitedDistance / this.private.speed;
                        //See if unit reached destination.
                        if (this.position.x == currentOrder.data.x && this.position.z == currentOrder.data.z) {
                            //Order complete.
                            this.private.orders.splice(0, 1);
                        }
                    } else {
                        //Obstructed; stop before the obstruction.
                        let newLimitedDistance = Math.max(0.0, minPathable.distance - ThreeHalvesCellSize - this.gameModel.halfXZSize);
                        //See if the unit can even move at all.
                        if (newLimitedDistance > 0.0) {
                            //The unit can move some, just not all the way up to its speed potential.
                            //Figure out where that is and move.
                            let {
                                limitedX: newLimitedX, limitedZ: newLimitedZ
                            } = LimitDistance({
                                startX: this.position.x,
                                startZ: this.position.z,
                                endX: currentOrder.data.x,
                                endZ: currentOrder.data.z,
                                maxDistance: newLimitedDistance
                            });
                            this.position.x = newLimitedX;
                            this.position.z = newLimitedZ;
                        }
                        //Order cannot be completed, so cancel all orders (stop unit).
                        deltaTimeMS = -Infinity;
                        this.private.orders = [];
                    }
                    break;
                } //case Enums.OrderTypes.Move
                default:
                {
                    updateComplete = true;
                }
            }
            if (updateComplete) {
                break;
            }
        }
        //If the unit has moved any, update its height.
        if (this.position.x != lastPositionX || this.position.z != lastPositionZ) {
            this.autoSetHeight();
        }
        if (this.private.orders.length == 0) {
            this.workruft.objectsToUpdate.delete(this);
        }
    }

    addToGroup({ objectGroup }) {
        objectGroup.add(this.group);
    }

    select() {
        if (!this.isSelected) {
            this.private.selectionCircle =
                this.workruft.world.selectionCircleModelsMap.get(this.gameModel.halfXZSize).createNewMesh();
            this.private.selectionCircle.layers.set(1);
            this.private.selectionCircle.position.y = HalfCellSize;
            this.private.selectionCircle.rotation.x = -HalfPI;
            this.group.add(this.private.selectionCircle);
            this.workruft.selectedObjects.add(this);
            this.isSelected = true;
        }
    }

    deselect() {
        if (this.isSelected) {
            this.workruft.selectedObjects.delete(this);
            DisposeThreeObject(this.private.selectionCircle);
            delete this.private.selectionCircle;
            this.isSelected = false;
        }
    }

    //TODO: Should probably manage this more and make it private.
    get position() {
        return this.group.position;
    }

    autoSetHeight() {
        let cellX = AlignToCell(this.position.x);
        let cellZ = AlignToCell(this.position.z);
        this.position.y = this.workruft.world.map.getAverageHeight({
            cell: this.workruft.world.map.getCell({ x: cellX, z: cellZ })
        });
    }
}