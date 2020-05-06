class GameUnit {
    constructor({ workruft, gameModel, x, z }) {
        this.gameModel = gameModel;
        this.group = new THREE.Group();
        this.position.set(x, 0.0, z);
        this.private = {
            mesh: gameModel.createNewMesh(),
            orders: [],
            speed: 50.0
        };
        this.private.mesh.geometry.computeBoundingBox();
        this.private.mesh.position.y = this.gameModel.halfYSize;
        this.private.mesh.userData = this;
        this.autoSetHeight({ workruft });
        this.group.add(this.private.mesh);

        this.isSelected = false;
    }

    destroy() {
        this.deselect();
        if (this.mesh != null) {
            DisposeThreeObject(this.mesh);
            delete this.mesh;
        }
    }

    issueReplacementOrder({ workruft, order }) {
        this.private.orders = [];
        this.issueAdditionalOrder({ workruft, order });
    }

    issueAdditionalOrder({ workruft, order }) {
        this.private.orders.push(order);
        workruft.objectsToUpdate.add(this);
    }

    update({ workruft, deltaTimeMS }) {
        let updated = false;
        while (this.private.orders.length > 0 && deltaTimeMS > 0) {
            let currentOrder = this.private.orders[0];
            switch (currentOrder.type) {
                case Enums.OrderTypes.Move:
                {
                    if (this.private.speed <= 0.0) {
                        this.private.orders.splice(0, 1);
                    }

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
                    let pathingLines = ComputePathTestingLines({
                        startX: this.position.x,
                        startZ: this.position.z,
                        endX: newX,
                        endZ: newZ,
                        traversalAngle: Math.atan2(-fullZDistance, fullXDistance),
                        unitRadius: this.gameModel.halfXZSize,
                        numberOfExtraPathingLines: this.gameModel.numberOfExtraPathingLines
                    });
                    //Check every cell that each of the lines intersects with, to see how many cells away from the unit are pathable.
                    let minPathable = {
                        cellCount: Infinity,
                        pathingLine: null,
                        obstructedCell: null
                    };
                    let worldMap = workruft.world.map;
                    for (let pathingLine of pathingLines) {
                        pathingLine.intersection.currentCell = worldMap.getCell({
                            x: FloorToCell(pathingLine.startX),
                            z: FloorToCell(pathingLine.startZ)
                        });
                        pathingLine.intersection.generator = IntersectLineWithGrid({
                            startX: pathingLine.startX, startZ: pathingLine.startZ,
                            endX: pathingLine.finalX, endZ: pathingLine.finalZ
                        });
                    }
                    let direction;
                    let isCellTraversible;
                    let pathingLinesToDelete = new Set();
                    //Check one pathing line at a time, one cell at a time, in sync.
                    do {
                        for (let pathingLine of pathingLines) {
                            pathingLine.intersection.intersectionResult = pathingLine.intersection.generator.next();
                            if (pathingLine.intersection.intersectionResult.done || pathingLine.intersection.isObstructed) {
                                pathingLinesToDelete.add(pathingLine);
                                continue;
                            }
                            direction = pathingLine.intersection.intersectionResult.value;
                            if (pathingLine.isInner) {
                                isCellTraversible =
                                    worldMap.isTraversible({
                                        cell: pathingLine.intersection.currentCell,
                                        direction: Enums.CardinalDirections.back
                                    }) &&
                                    worldMap.isTraversible({
                                        cell: pathingLine.intersection.currentCell,
                                        direction: Enums.CardinalDirections.right
                                    }) &&
                                    worldMap.isTraversible({
                                        cell: pathingLine.intersection.currentCell,
                                        direction: Enums.CardinalDirections.front
                                    }) &&
                                    worldMap.isTraversible({
                                        cell: pathingLine.intersection.currentCell,
                                        direction: Enums.CardinalDirections.left
                                    });
                            } else {
                                isCellTraversible = worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction });
                            }
                            if (isCellTraversible) {
                                //Still pathable.
                                pathingLine.intersection.currentCell = pathingLine.intersection.currentCell.neighbors[direction];
                                ++pathingLine.intersection.currentCellsPathable;
                            } else {
                                //Obstruction found!
                                if (pathingLine.intersection.currentCellsPathable < minPathable.cellCount) {
                                    minPathable.cellCount = pathingLine.intersection.currentCellsPathable;
                                    minPathable.pathingLine = pathingLine;
                                    minPathable.obstructedCell = pathingLine.intersection.currentCell.neighbors[direction];
                                }
                                pathingLine.intersection.isObstructed = true;
                                break;
                            }
                        }
                        for (let pathingLine of pathingLinesToDelete) {
                            pathingLines.delete(pathingLine);
                        }
                        pathingLinesToDelete.clear();
                    } while (pathingLines.size > 0);

                    if (minPathable.cellCount == Infinity) {
                        this.position.x = newX;
                        this.position.z = newZ;
                        deltaTimeMS -= limitedDistance / this.private.speed;
                        if (this.position.x == currentOrder.data.x && this.position.z == currentOrder.data.z) {
                            //Order complete!
                            this.private.orders.splice(0, 1);
                        }
                    } else {
                        let newLimitedDistance = Math.hypot(
                            minPathable.obstructedCell.x - minPathable.pathingLine.startX,
                            minPathable.obstructedCell.z - minPathable.pathingLine.startZ);
                        newLimitedDistance = Math.max(0.0, newLimitedDistance - ThreeHalvesCellSize - this.gameModel.halfXZSize);
                        if (newLimitedDistance > 0.0) {
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
                        //Order cannot be completed, so cancel all orders!
                        deltaTimeMS = -Infinity;
                        this.private.orders = [];
                    }

                    this.autoSetHeight({ workruft });
                    updated = true;
                    break;
                }
                default:
                {
                    updated = true;
                }
            }
            if (updated) {
                break;
            }
        }
        if (this.private.orders.length == 0) {
            workruft.objectsToUpdate.delete(this);
        }
    }

    addToGroup({ objectGroup }) {
        objectGroup.add(this.group);
    }

    select({ workruft, selectionModel }) {
        if (!this.isSelected) {
            this.private.selectionCircle = selectionModel.createNewMesh();
            this.private.selectionCircle.layers.set(1);
            this.private.selectionCircle.position.y = 0.5;
            this.private.selectionCircle.rotation.x = HalfPI;
            this.group.add(this.private.selectionCircle);
            workruft.selectedObjects.add(this);
            this.isSelected = true;
        }
    }

    deselect({ workruft }) {
        if (this.isSelected) {
            workruft.selectedObjects.delete(this);
            DisposeThreeObject(this.private.selectionCircle);
            delete this.private.selectionCircle;
            this.isSelected = false;
        }
    }

    //TODO: Should probably manage this more and make it private.
    get position() {
        return this.group.position;
    }

    autoSetHeight({ workruft }) {
        let cellX = AlignToCell(this.position.x);
        let cellZ = AlignToCell(this.position.z);
        this.position.y = workruft.world.map.getAverageHeight({
            cell: workruft.world.map.getCell({ x: cellX, z: cellZ })
        });
    }
}