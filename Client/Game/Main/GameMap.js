//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class GameMap {
    constructor(sizeX, sizeZ) {
        this.sizeX = sizeX;
        this.sizeZ = sizeZ;
        let halfSizeX = this.sizeX * 0.5;
        let halfSizeZ = this.sizeZ * 0.5;
        this.minX = Math.ceil(-halfSizeX);
        this.minZ = Math.ceil(-halfSizeZ);
        this.maxX = Math.ceil(halfSizeX);
        this.maxZ = Math.ceil(halfSizeZ);

        this.generate();
    }

    generate() {
        this.grid = {};
        this.topGeometry = new THREE.Geometry();
        this.sideGeometry = new THREE.Geometry();

        //Vertex Index Offset.
        let vio;
        for (let x = this.minX; x <= this.maxX; x += CellSize) {
            let column = {};
            this.grid[x] = column;
            for (let z = this.minZ; z <= this.maxZ; z += CellSize) {
                vio = this.topGeometry.vertices.length;
                column[z] = {
                    x, z, vio,
                    //Faces must be in counter-clockwise direction to be facing outside.
                    //Each integer is merely referencing a corner vertex.
                    faces: {
                        top: [
                            new THREE.Face3(vio,     vio + 3, vio + 1),
                            new THREE.Face3(vio + 2, vio + 1, vio + 3)
                        ],
                        right: [],
                        front: []
                    },
                    neighbors: {
                        [Enums.CardinalDirections.back]: null,
                        [Enums.CardinalDirections.right]: null,
                        [Enums.CardinalDirections.front]: null,
                        [Enums.CardinalDirections.left]: null
                    },
                    rightTraversable: x != this.maxX,
                    frontTraversable: z != this.maxZ
                };
                //Corners:
                //        Back
                //      0-----1
                //Left / Top / Right
                //    3-----2
                //    Front
                this.topGeometry.vertices.push(
                    new THREE.Vector3(x,            MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                    new THREE.Vector3(x,            MapBottomY, z + CellSize)
                );
                this.sideGeometry.vertices.push(
                    new THREE.Vector3(x,            MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                    new THREE.Vector3(x,            MapBottomY, z + CellSize)
                );
                this.topGeometry.faces.push(...column[z].faces.top);
                //Corners in UV coordinates:
                //   (0, 0)   Back  (1, 0)
                //          0-----1
                //    Left / Top / Right
                //        3-----2
                //(0, 1)  Front  (1, 1)
                //First face is corners (0, 3, 1).
                this.topGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.0, 1.0),
                    new THREE.Vector2(1.0, 0.0)
                ]);
                //Second face is corners (2, 1, 3).
                this.topGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2(1.0, 1.0),
                    new THREE.Vector2(1.0, 0.0),
                    new THREE.Vector2(0.0, 1.0)
                ]);
            }
        }
        //Assign non-border neighbors.
        for (let x = this.minX; x <= this.maxX; x += CellSize) {
            let column = this.grid[x];
            for (let z = this.minZ; z <= this.maxZ; z += CellSize) {
                if (z != this.minZ) {
                    column[z].neighbors[Enums.CardinalDirections.back] = this.grid[x][z - CellSize];
                }
                if (x != this.maxX) {
                    column[z].neighbors[Enums.CardinalDirections.right] = this.grid[x + CellSize][z];
                }
                if (z != this.maxX) {
                    column[z].neighbors[Enums.CardinalDirections.front] = this.grid[x][z + CellSize];
                }
                if (x != this.minX) {
                    column[z].neighbors[Enums.CardinalDirections.left] = this.grid[x - CellSize][z];
                }
            }
        }

        this.updateCells({
            lowX: this.minX, lowZ: this.minZ, highX: this.maxX, highZ: this.maxZ
        });

        this.topMesh = new THREE.Mesh(
            this.topGeometry,
            GrassMaterials
        );
        this.topMesh.castShadow = true;
        this.topMesh.receiveShadow = true;
        this.sideMesh = new THREE.Mesh(
            this.sideGeometry,
            new THREE.MeshBasicMaterial({
                color: DirtColor,
                side: THREE.DoubleSide
            })
        );
        this.sideMesh.receiveShadow = true;
    }

    deconstruct() {
        DisposeThreeObject(this.topGeometry);
        DisposeThreeObject(this.sideGeometry);
        DisposeThreeObject(this.topMesh.material);
        DisposeThreeObject(this.sideMesh.material);
    }

    getCell({ x, z }) {
        if (IsDefined(this.grid[x])) {
            return this.grid[x][z];
        } else {
            return undefined;
        }
    }

    getBackLeftHeight({ cell }) {
        return this.topGeometry.vertices[cell.vio].y;
    }

    getBackRightHeight({ cell }) {
        return this.topGeometry.vertices[cell.vio + 1].y;
    }

    getFrontRightHeight({ cell }) {
        return this.topGeometry.vertices[cell.vio + 2].y;
    }

    getFrontLeftHeight({ cell }) {
        return this.topGeometry.vertices[cell.vio + 3].y;
    }

    addBackLeftHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio].y += height;
        this.sideGeometry.vertices[cell.vio].y += height;
    }

    addBackRightHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 1].y += height;
        this.sideGeometry.vertices[cell.vio + 1].y += height;
    }

    addFrontRightHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 2].y += height;
        this.sideGeometry.vertices[cell.vio + 2].y += height;
    }

    addFrontLeftHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 3].y += height;
        this.sideGeometry.vertices[cell.vio + 3].y += height;
    }

    addHeightToCell({ cell, height }) {
        this.addBackLeftHeight({ cell, height });
        this.addBackRightHeight({ cell, height });
        this.addFrontRightHeight({ cell, height });
        this.addFrontLeftHeight({ cell, height });
    }

    setBackLeftHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio].y = height;
        this.sideGeometry.vertices[cell.vio].y = height;
    }

    setBackRightHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 1].y = height;
        this.sideGeometry.vertices[cell.vio + 1].y = height;
    }

    setFrontRightHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 2].y = height;
        this.sideGeometry.vertices[cell.vio + 2].y = height;
    }

    setFrontLeftHeight({ cell, height }) {
        this.topGeometry.vertices[cell.vio + 3].y = height;
        this.sideGeometry.vertices[cell.vio + 3].y = height;
    }

    setCellFlatHeight({ cell, height }) {
        this.setBackLeftHeight({ cell, height });
        this.setBackRightHeight({ cell, height });
        this.setFrontRightHeight({ cell, height });
        this.setFrontLeftHeight({ cell, height });
    }

    //Remember to call updateCells()!
    getAverageHeight({ cell }) {
        return (this.topGeometry.vertices[cell.vio].y +
            this.topGeometry.vertices[cell.vio + 1].y +
            this.topGeometry.vertices[cell.vio + 2].y +
            this.topGeometry.vertices[cell.vio + 3].y)
            * 0.25;
    }

    isTraversible({ cell, direction }) {
        switch (direction) {
            case Enums.CardinalDirections.back:
                return this.isBackTraversable({ cell });
                break;
            case Enums.CardinalDirections.right:
                return this.isRightTraversable({ cell });
                break;
            case Enums.CardinalDirections.front:
                return this.isFrontTraversable({ cell });
                break;
            case Enums.CardinalDirections.left:
                return this.isLeftTraversable({ cell });
                break;
        }
        return false;
    }

    isBackTraversable({ cell }) {
        if (cell == null) {
            return false;
        } else {
            return this.isFrontTraversable({ cell: cell.neighbors[Enums.CardinalDirections.back] });
        }
    }

    isRightTraversable({ cell }) {
        if (cell == null) {
            return false;
        } else {
            return cell.rightTraversable;
        }
    }

    isFrontTraversable({ cell }) {
        if (cell == null) {
            return false;
        } else {
            return cell.frontTraversable;
        }
    }

    isLeftTraversable({ cell }) {
        if (cell == null) {
            return false;
        } else {
            return this.isRightTraversable({ cell: cell.neighbors[Enums.CardinalDirections.left] });
        }
    }

    //Make sure that these bounds wrap around (inclusively) all of the cells involved!
    //
    //Corners:
    //        Back
    //      0-----1
    //Left / Top / Right
    //    3-----2
    //    Front
    updateCells({ lowX, lowZ, highX, highZ }) {
        let currentCell;
        //Go through each side within the bounds.
        for (let x = lowX; x < highX; x += CellSize) {
            if (x < this.minX) {
                continue;
            }
            if (x > this.maxX) {
                continue;
            }
            for (let z = lowZ; z < highZ; z += CellSize) {
                if (z < this.minZ) {
                    continue;
                }
                if (z > this.maxZ) {
                    continue;
                }
                currentCell = this.getCell({ x, z });
                if (currentCell == null) {
                    continue;
                }
                //Right.
                if (x < highX) {
                    let otherCell = currentCell.neighbors[Enums.CardinalDirections.right];
                    if (otherCell != null) {
                        currentCell.rightTraversable =
                            this.getBackRightHeight({ cell: currentCell }) == this.getBackLeftHeight({ cell: otherCell }) &&
                            this.getFrontRightHeight({ cell: currentCell }) == this.getFrontLeftHeight({ cell: otherCell });
                        this.updateFaces({
                            currentCell, otherCell,
                            direction: 'right',
                            currentVertexA: 1, otherVertexA: 0,
                            currentVertexB: 2, otherVertexB: 3
                        });
                    }
                }
                //Front.
                if (z < highZ) {
                    let otherCell = currentCell.neighbors[Enums.CardinalDirections.front];
                    if (otherCell != null) {
                        currentCell.frontTraversable =
                            this.getFrontRightHeight({ cell: currentCell }) == this.getBackRightHeight({ cell: otherCell }) &&
                            this.getFrontLeftHeight({ cell: currentCell }) == this.getBackLeftHeight({ cell: otherCell });
                        this.updateFaces({
                            currentCell, otherCell,
                            direction: 'front',
                            currentVertexA: 2, otherVertexA: 1,
                            currentVertexB: 3, otherVertexB: 0
                        });
                    }
                }
            }
        }
        //Go through each side within and just beyond the bounds.
        for (let x = lowX - 1; x < highX + 1; x += CellSize) {
            if (x < this.minX) {
                continue;
            }
            if (x > this.maxX) {
                continue;
            }
            for (let z = lowZ - 1; z < highZ + 1; z += CellSize) {
                if (z < this.minZ) {
                    continue;
                }
                if (z > this.maxZ) {
                    continue;
                }
                currentCell = this.getCell({ x, z });
                if (currentCell == null) {
                    continue;
                }
                currentCell.faces.top[0].materialIndex =
                    (this.isBackTraversable({ cell: currentCell }) ? 0 : 4) |
                    (this.isRightTraversable({ cell: currentCell }) ? 0 : 2) |
                    (this.isFrontTraversable({ cell: currentCell }) ? 0 : 1) |
                    (this.isLeftTraversable({ cell: currentCell }) ? 0 : 8);
                currentCell.faces.top[1].materialIndex = currentCell.faces.top[0].materialIndex;
            }
        }

        this.topGeometry.elementsNeedUpdate = true;
        this.topGeometry.computeFaceNormals();
        this.sideGeometry.elementsNeedUpdate = true;
        this.sideGeometry.computeFaceNormals();
    }

    //Corners:
    //        Back
    //      0-----1
    //Left / Top / Right
    //    3-----2
    //    Front
    updateFaces({
        currentCell, otherCell,
        direction,
        currentVertexA, otherVertexA,
        currentVertexB, otherVertexB
    }) {
        currentCell.faces[direction] = [];
        for (let face of currentCell.faces[direction]) {
            this.sideGeometry.faces.splice(this.sideGeometry.faces.indexOf(face), 1);
        }
        let newFaces = [];
        //Each integer is merely referencing a corner vertex.
        if (this.topGeometry.vertices[currentCell.vio + currentVertexA].y > this.topGeometry.vertices[otherCell.vio + otherVertexA].y &&
            this.topGeometry.vertices[currentCell.vio + currentVertexB].y > this.topGeometry.vertices[otherCell.vio + otherVertexB].y) {
            //Current side > other side.
            newFaces.push(new THREE.Face3(
                currentCell.vio + currentVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexA));
            newFaces.push(new THREE.Face3(
                otherCell.vio + otherVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexB));
        } else if (this.topGeometry.vertices[currentCell.vio + currentVertexA].y < this.topGeometry.vertices[otherCell.vio + otherVertexA].y &&
            this.topGeometry.vertices[currentCell.vio + currentVertexB].y < this.topGeometry.vertices[otherCell.vio + otherVertexB].y) {
            //Current side < other side.
            newFaces.push(new THREE.Face3(
                currentCell.vio + currentVertexA, otherCell.vio + otherVertexA, currentCell.vio + currentVertexB));
            newFaces.push(new THREE.Face3(
                otherCell.vio + otherVertexA, otherCell.vio + otherVertexB, currentCell.vio + currentVertexB));
        } else {
            //Handle the corners individually.
            if (this.topGeometry.vertices[currentCell.vio + currentVertexA].y != this.topGeometry.vertices[otherCell.vio + otherVertexA].y) {
                if (this.topGeometry.vertices[currentCell.vio + currentVertexA].y > this.topGeometry.vertices[otherCell.vio + otherVertexA].y) {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexA));
                } else {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexA, otherCell.vio + otherVertexA, currentCell.vio + currentVertexB));
                }
            }
            if (this.topGeometry.vertices[currentCell.vio + currentVertexB].y != this.topGeometry.vertices[otherCell.vio + otherVertexB].y) {
                if (this.topGeometry.vertices[currentCell.vio + currentVertexB].y > this.topGeometry.vertices[otherCell.vio + otherVertexB].y) {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexB, otherCell.vio + otherVertexB, currentCell.vio + currentVertexA));
                } else {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexB, currentCell.vio + currentVertexA, otherCell.vio + otherVertexB));
                }
            }
        }
        if (newFaces.length > 0) {
            for (let newFace of newFaces) {
                newFace.color = DirtColor;
                currentCell.faces[direction].push(newFace);
                this.sideGeometry.faces.push(newFace);
            }
        }
    }

    getRandomPointOnMap() {
        return {
            x: Math.random() * (this.sizeX) + this.minX,
            z: Math.random() * (this.sizeZ) + this.minZ
        };
    }
}

module.exports = GameMap;