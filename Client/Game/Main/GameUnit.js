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

        this.pathFinder = new PathFinder({
            workruft: this.workruft,
            gameUnit: this
        });
        this.pathingTester = new PathingTester({
            workruft: this.workruft,
            gameModel: this.gameModel
        });
    }

    deconstruct() {
        this.deselect();
        delete this.pathFinder;
        delete this.pathingTester;
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

                    if (IsUndefined(currentOrder.data.path)) {
                        this.pathFinder.setStartPoint({ pointX: this.position.x, pointZ: this.position.z });
                        this.pathFinder.setEndPoint({ pointX: currentOrder.data.x, pointZ: currentOrder.data.z });
                        if (IsDefined(this.coloredSquares)) {
                            for (let coloredSquare of this.coloredSquares) {
                                coloredSquare.deconstruct();
                            }
                        }
                        this.coloredSquares = [];
                        currentOrder.data.path = this.pathFinder.findBestPath({ range: 0.1 });
                        for (let point of currentOrder.data.path) {
                            for (let xOffset = -this.gameModel.halfXZSize;
                                xOffset <= 0.0; xOffset += CellSize) {
                                for (let zOffset = -this.gameModel.halfXZSize;
                                    zOffset <= 0.0; zOffset += CellSize) {
                                    this.coloredSquares.push(new ColoredSquare({
                                        workruft: this.workruft,
                                        x: point.x + xOffset + HalfCellSize,
                                        z: point.z + zOffset + HalfCellSize,
                                        color: BlueColor,
                                        opacity: 0.5
                                    }));
                                }
                            }
                        }
                    }

                    let currentPathPoint = currentOrder.data.path[currentOrder.data.path.length - 1];
                    this.pathingTester.setEnds({
                        startX: this.position.x,
                        startZ: this.position.z,
                        endX: currentPathPoint.x,
                        endZ: currentPathPoint.z
                    });
                    this.pathingTester.limitDistance({ maxDistance: this.private.speed * deltaTimeMS });
                    this.pathingTester.updateTraversalAngleAndOffsets();
                    this.pathingTester.computePathingLines();
                    this.pathingTester.computeMinPathable();

                    //See if the unit's current movement step path is obstructed.
                    if (this.pathingTester.minPathable.distance == Infinity) {
                        //Unobstructed; gogogo, full speed.
                        this.position.x = this.pathingTester.endX;
                        this.position.z = this.pathingTester.endZ;
                        deltaTimeMS -= this.pathingTester.limitedDistance / this.private.speed;
                        //See if unit reached destination.
                        if (this.position.x == currentPathPoint.x && this.position.z == currentPathPoint.z) {
                            if (currentOrder.data.path.length > 1) {
                                //Path point complete.
                                currentOrder.data.path.splice(-1);
                            } else {
                                //Order complete.
                                this.private.orders.splice(0, 1);
                            }
                        }
                    } else {
                        //Obstructed; stop before the obstruction.
                        let newLimitedDistance = Math.max(0.0, this.pathingTester.minPathable.distance -
                            CellSize - this.gameModel.halfXZSize);
                        //See if the unit can even move at all.
                        if (newLimitedDistance > 0.0) {
                            //The unit can move some, just not all the way up to its speed potential.
                            //Figure out where that is and move.
                            this.pathingTester.limitDistance({ maxDistance: newLimitedDistance });
                            this.position.x = this.pathingTester.endX;
                            this.position.z = this.pathingTester.endZ;
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

    removeFromGroup({ objectGroup }) {
        objectGroup.remove(this.group);
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