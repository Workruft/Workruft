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

                    //Create path-testing lines. The first two lines start and end at the outermost points of the circle
                    //parallel to the slope of the unit's trajectory. The inner lines, if any, start and end at evenly
                    //distributed angles between the outermost lines, on the circle's perimeter, on the side closest to
                    //the other circle.
                    let movementAngle = Math.atan2(-fullZDistance, fullXDistance);
                    let minusAngle = movementAngle - HalfPI;
                    let plusAngle = movementAngle + HalfPI;
                    let unitRadius = this.gameModel.halfXZSize;
                    //Start with the outermost points.
                    let pathingLines = new Set([
                        {
                            currentX: this.position.x + unitRadius * Math.cos(minusAngle),
                            currentZ: this.position.z - unitRadius * Math.sin(minusAngle),
                            finalX: newX + unitRadius * Math.cos(minusAngle),
                            finalZ: newZ - unitRadius * Math.sin(minusAngle),
                            isInner: false,
                            intersection: {
                                currentCellsPathable: 0,
                                currentCell: null,
                                generator: null,
                                intersectionResult: null
                            }
                        },
                        {
                            currentX: this.position.x + unitRadius * Math.cos(plusAngle),
                            currentZ: this.position.z - unitRadius * Math.sin(plusAngle),
                            finalX: newX + unitRadius * Math.cos(plusAngle),
                            finalZ: newZ - unitRadius * Math.sin(plusAngle),
                            isInner: false,
                            intersection: {
                                currentCellsPathable: 0,
                                currentCell: null,
                                generator: null,
                                intersectionResult: null
                            }
                        }
                    ]);
                    //Add any inner points.
                    if (this.gameModel.numberOfExtraPathingLines > 0) {
                        let angleInterval = Math.PI / (this.gameModel.numberOfExtraPathingLines + 1.0);
                        let currentAngleOffset;
                        for (let extraPathingLineNum = 1; extraPathingLineNum <= this.gameModel.numberOfExtraPathingLines; ++extraPathingLineNum) {
                            currentAngleOffset = extraPathingLineNum * angleInterval;
                            pathingLines.add({
                                currentX: this.position.x + unitRadius * Math.cos(minusAngle + currentAngleOffset),
                                currentZ: this.position.z - unitRadius * Math.sin(minusAngle + currentAngleOffset),
                                finalX: newX + unitRadius * Math.cos(minusAngle + currentAngleOffset),
                                finalZ: newZ - unitRadius * Math.sin(minusAngle + currentAngleOffset),
                                isInner: true,
                                intersection: {
                                    currentCellsPathable: 0,
                                    currentCell: null,
                                    generator: null,
                                    intersectionResult: null
                                }
                            });
                        }
                    }
                    //Check every cell that each of the lines intersects with, to see how many cells away from the unit are pathable.
                    let minPathable = {
                        cellCount: Infinity,
                        pathingLine: null,
                        lastCell: null
                    };
                    let worldMap = workruft.world.map;
                    for (let pathingLine of pathingLines) {
                        pathingLine.intersection.currentCell = worldMap.getCell({
                            x: FloorToCell(pathingLine.currentX),
                            z: FloorToCell(pathingLine.currentZ)
                        });
                        pathingLine.intersection.generator = IntersectLineWithGrid({
                            startX: pathingLine.currentX, startZ: pathingLine.currentZ,
                            endX: pathingLine.finalX, endZ: pathingLine.finalZ
                        });
                    }
                    let direction;
                    let isCellTraversible;
                    let isObstructed = false;
                    let pathingLinesToDelete = new Set();
                    //Check one pathing line at a time, one cell at a time, in sync.
                    do {
                        for (let pathingLine of pathingLines) {
                            pathingLine.intersection.intersectionResult = pathingLine.intersection.generator.next();
                            if (pathingLine.intersection.intersectionResult.done) {
                                pathingLinesToDelete.add(pathingLine);
                                continue;
                            }
                            direction = pathingLine.intersection.intersectionResult.value;
                            if (pathingLine.isInner) {
                                isCellTraversible =
                                    worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction: 'back' }) &&
                                    worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction: 'right' }) &&
                                    worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction: 'front' }) &&
                                    worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction: 'left' });
                            } else {
                                isCellTraversible = worldMap.isTraversible({ cell: pathingLine.intersection.currentCell, direction });
                            }
                            if (isCellTraversible) {
                                //Still pathable.
                                pathingLine.intersection.currentCell = pathingLine.intersection.currentCell.neighbors[direction];
                                pathingLine.intersection.currentCell.faces.top[0].color = BlueColor;
                                pathingLine.intersection.currentCell.faces.top[1].color = BlueColor;
                                ++pathingLine.intersection.currentCellsPathable;
                            } else {
                                //Obstruction found!
                                pathingLine.intersection.currentCell.neighbors[direction].faces.top[0].color = RedColor;
                                pathingLine.intersection.currentCell.neighbors[direction].faces.top[1].color = RedColor;
                                if (pathingLine.intersection.currentCellsPathable < minPathable.cellCount) {
                                    minPathable.cellCount = pathingLine.intersection.currentCellsPathable;
                                    minPathable.pathingLine = pathingLine;
                                    minPathable.lastCell = pathingLine.intersection.currentCell;
                                }
                                isObstructed = true;
                                break;
                            }
                        }
                        if (isObstructed) {
                            break;
                        }
                        for (let pathingLine of pathingLinesToDelete) {
                            pathingLines.delete(pathingLine);
                        }
                        pathingLinesToDelete.clear();
                    } while (pathingLines.size > 0);
                    worldMap.geometry.elementsNeedUpdate = true;

                    let distanceTraveled;
                    if (minPathable.cellCount == Infinity) {
                        this.position.x = newX;
                        this.position.z = newZ;
                        distanceTraveled = limitedDistance;
                        if (this.position.x == currentOrder.data.x && this.position.z == currentOrder.data.z) {
                            //Order complete!
                            this.private.orders.splice(0, 1);
                        }
                    } else {
                        let newLimitedDistance = Math.hypot(
                            minPathable.lastCell.x - minPathable.pathingLine.currentX,
                            minPathable.lastCell.z - minPathable.pathingLine.currentZ);
                        newLimitedDistance = Math.max(0.0, newLimitedDistance -
                            (minPathable.pathingLine.isInner ? this.gameModel.xzSize : this.gameModel.xzSize * 1.5));
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
                        distanceTraveled = newLimitedDistance;
                        //Order cannot be completed, so cancel all orders!
                        deltaTimeMS = -Infinity;
                        this.private.orders = [];
                    }
                    deltaTimeMS -= distanceTraveled / this.private.speed;

                    this.autoSetHeight({ workruft });
                    updated = true;
                    break;
                default:
                    updated = true;
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