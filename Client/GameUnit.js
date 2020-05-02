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
                    //Start with the outermost points.
                    let pathingLines = [
                        {
                            currentX: this.position.x + this.gameModel.halfXZSize * Math.cos(minusAngle),
                            currentZ: this.position.z - this.gameModel.halfXZSize * Math.sin(minusAngle),
                            finalX: newX + this.gameModel.halfXZSize * Math.cos(minusAngle),
                            finalZ: newZ - this.gameModel.halfXZSize * Math.sin(minusAngle)
                        },
                        {
                            currentX: this.position.x + this.gameModel.halfXZSize * Math.cos(plusAngle),
                            currentZ: this.position.z - this.gameModel.halfXZSize * Math.sin(plusAngle),
                            finalX: newX + this.gameModel.halfXZSize * Math.cos(plusAngle),
                            finalZ: newZ - this.gameModel.halfXZSize * Math.sin(plusAngle)
                        }
                    ];
                    //Add any inner points.
                    if (this.gameModel.numberOfExtraPathingLines > 0) {
                        let angleInterval = Math.PI / (this.gameModel.numberOfExtraPathingLines + 1.0);
                        let currentAngleOffset;
                        for (let extraPathingLineNum = 1; extraPathingLineNum <= this.gameModel.numberOfExtraPathingLines; ++extraPathingLineNum) {
                            currentAngleOffset = extraPathingLineNum * angleInterval;
                            pathingLines.push({
                                currentX: this.position.x + this.gameModel.halfXZSize * Math.cos(minusAngle + currentAngleOffset),
                                currentZ: this.position.z - this.gameModel.halfXZSize * Math.sin(minusAngle + currentAngleOffset),
                                finalX: newX + this.gameModel.halfXZSize * Math.cos(minusAngle + currentAngleOffset),
                                finalZ: newZ - this.gameModel.halfXZSize * Math.sin(minusAngle + currentAngleOffset)
                            });
                        }
                    }
                    //Check every cell that each of the lines intersects with, to see how many cells away from the unit are pathable.
                    let minPathable = {
                        cellCount: Infinity,
                        pathingLine: null,
                        lastCell: null
                    };
                    let currentCellsPathable;
                    let currentCell;
                    let worldMap = workruft.world.map;
                    for (let pathingLine of pathingLines) {
                        currentCellsPathable = 0;
                        currentCell = worldMap.getCell({
                            x: AlignToCell(pathingLine.currentX),
                            z: AlignToCell(pathingLine.currentZ)
                        });
                        currentCell.faces.top[0].color = BlueColor;
                        currentCell.faces.top[1].color = BlueColor;
                        if (!IntersectLineWithGrid({
                            startX: pathingLine.currentX, startZ: pathingLine.currentZ,
                            endX: pathingLine.finalX, endZ: pathingLine.finalZ,
                            cellCallback: function({ direction }) {
                                if (worldMap.isTraversible({ cell: currentCell, direction })) {
                                    currentCell = currentCell.neighbors[direction];
                                    currentCell.faces.top[0].color = BlueColor;
                                    currentCell.faces.top[1].color = BlueColor;
                                    ++currentCellsPathable;
                                    return true;
                                } else {
                                    currentCell.neighbors[direction].faces.top[0].color = RedColor;
                                    currentCell.neighbors[direction].faces.top[1].color = RedColor;
                                    return false;
                                }
                            }
                        })) {
                            if (currentCellsPathable < minPathable.cellCount) {
                                minPathable.cellCount = currentCellsPathable;
                                minPathable.pathingLine = pathingLine;
                                minPathable.lastCell = currentCell;
                            }
                        }
                    }
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
                        let {
                            limitedDistance: newLimitedDistance
                        } = LimitDistance({
                            startX: FloorToCell(minPathable.pathingLine.currentX),
                            startZ: FloorToCell(minPathable.pathingLine.currentZ),
                            endX: minPathable.lastCell.x,
                            endZ: minPathable.lastCell.z,
                            maxDistance
                        });
                        newLimitedDistance = Math.max(0.0, newLimitedDistance - this.gameModel.xzSize);
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