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

        //Create border cell placeholder.
        this.borderCell = {
            rightTraversable: false,
            frontTraversable: false
        };

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
                        [Enums.CardinalDirections.back]: this.borderCell,
                        [Enums.CardinalDirections.right]: this.borderCell,
                        [Enums.CardinalDirections.front]: this.borderCell,
                        [Enums.CardinalDirections.left]: this.borderCell
                    },
                    rightTraversable: x != this.maxX,
                    frontTraversable: z != this.maxZ
                };
                column[z].faces.top[0].color = GrassColor;
                column[z].faces.top[1].color = GrassColor;
                //Corners:
                //        Back
                //      0-----1
                //Left / Top / Right
                //    3-----2
                //    Front
                this.topGeometry.vertices.push(
                    new THREE.Vector3(x, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                    new THREE.Vector3(x, MapBottomY, z + CellSize)
                );
                this.sideGeometry.vertices.push(
                    new THREE.Vector3(x, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                    new THREE.Vector3(x, MapBottomY, z + CellSize)
                );
                this.topGeometry.faces.push(...column[z].faces.top);
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
            new THREE.MeshPhongMaterial({
                map: GrassTexture,
                // side: THREE.DoubleSide,
                shininess: 10
            })
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
        return this.isFrontTraversable({ cell: cell.neighbors[Enums.CardinalDirections.back] });
    }

    isRightTraversable({ cell }) {
        return cell.rightTraversable;
    }

    isFrontTraversable({ cell }) {
        return cell.frontTraversable;
    }

    isLeftTraversable({ cell }) {
        return this.isRightTraversable({ cell: cell.neighbors[Enums.CardinalDirections.left] });
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
            for (let z = lowZ; z < highZ; z += CellSize) {
                currentCell = this.getCell({ x, z });
                //Right.
                if (x < highX) {
                    let otherCell = currentCell.neighbors[Enums.CardinalDirections.right];
                    if (IsDefined(otherCell)) {
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
                    if (IsDefined(otherCell)) {
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

        //TODO: This is extraordinarily slow! Update individually as needed!
        this.topGeometry.faceVertexUvs[0] = [];
        this.topGeometry.faces.forEach(function(face) {
            let components = ['x', 'y', 'z'].sort(function(a, b) {
                return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
            });

            let v1 = this.topGeometry.vertices[face.a];
            let v2 = this.topGeometry.vertices[face.b];
            let v3 = this.topGeometry.vertices[face.c];

            this.topGeometry.faceVertexUvs[0].push([
                new THREE.Vector2(v1[components[0]], v1[components[1]]),
                new THREE.Vector2(v2[components[0]], v2[components[1]]),
                new THREE.Vector2(v3[components[0]], v3[components[1]])
            ]);
        }.bind(this));
        this.topGeometry.verticesNeedUpdate = true;
        this.topGeometry.elementsNeedUpdate = true;
        this.topGeometry.uvsNeedUpdate = true;
        this.topGeometry.computeFaceNormals();
        // this.sideGeometry.faceVertexUvs[0] = [];
        // this.sideGeometry.faces.forEach(function(face) {
        //     let components = ['x', 'y', 'z'].sort(function(a, b) {
        //         return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
        //     });

        //     let v1 = this.sideGeometry.vertices[face.a];
        //     let v2 = this.sideGeometry.vertices[face.b];
        //     let v3 = this.sideGeometry.vertices[face.c];

        //     this.sideGeometry.faceVertexUvs[0].push([
        //         new THREE.Vector2(v1[components[0]], v1[components[1]]),
        //         new THREE.Vector2(v2[components[0]], v2[components[1]]),
        //         new THREE.Vector2(v3[components[0]], v3[components[1]])
        //     ]);
        // }.bind(this));
        this.sideGeometry.verticesNeedUpdate = true;
        this.sideGeometry.elementsNeedUpdate = true;
        // this.sideGeometry.uvsNeedUpdate = true;
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
}