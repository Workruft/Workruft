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
        this.geometry = new THREE.Geometry();

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
                vio = this.geometry.vertices.length;
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
                this.geometry.vertices.push(
                    new THREE.Vector3(x, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z),
                    new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                    new THREE.Vector3(x, MapBottomY, z + CellSize)
                );
                this.geometry.faces.push(...column[z].faces.top);
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

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));
        this.mesh.receiveShadow = true;
    }

    deconstruct() {
        DisposeThreeObject(this.geometry);
        DisposeThreeObject(this.mesh.material);
    }

    getCell({ x, z }) {
        if (IsDefined(this.grid[x])) {
            return this.grid[x][z];
        } else {
            return undefined;
        }
    }

    getBackLeftVertex({ cell }) {
        return this.geometry.vertices[cell.vio];
    }

    getBackRightVertex({ cell }) {
        return this.geometry.vertices[cell.vio + 1];
    }

    getFrontRightVertex({ cell }) {
        return this.geometry.vertices[cell.vio + 2];
    }

    getFrontLeftVertex({ cell }) {
        return this.geometry.vertices[cell.vio + 3];
    }

    getAverageHeight({ cell }) {
        return (this.geometry.vertices[cell.vio].y +
            this.geometry.vertices[cell.vio + 1].y +
            this.geometry.vertices[cell.vio + 2].y +
            this.geometry.vertices[cell.vio + 3].y)
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
                            this.getBackRightVertex({ cell: currentCell }).y == this.getBackLeftVertex({ cell: otherCell }).y &&
                            this.getFrontRightVertex({ cell: currentCell }).y == this.getFrontLeftVertex({ cell: otherCell }).y;
                        if (!currentCell.rightTraversable) {
                            currentCell.faces.top[0].color = RedColor;
                            currentCell.faces.top[1].color = RedColor;
                            currentCell.neighbors[Enums.CardinalDirections.right].faces.top[0].color = RedColor;
                            currentCell.neighbors[Enums.CardinalDirections.right].faces.top[1].color = RedColor;
                        }
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
                            this.getFrontRightVertex({ cell: currentCell }).y == this.getBackRightVertex({ cell: otherCell }).y &&
                            this.getFrontLeftVertex({ cell: currentCell }).y == this.getBackLeftVertex({ cell: otherCell }).y;
                        if (!currentCell.frontTraversable) {
                            currentCell.faces.top[0].color = RedColor;
                            currentCell.faces.top[1].color = RedColor;
                            currentCell.neighbors[Enums.CardinalDirections.front].faces.top[0].color = RedColor;
                            currentCell.neighbors[Enums.CardinalDirections.front].faces.top[1].color = RedColor;
                        }
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

        //For lighting.
        this.geometry.computeFaceNormals();
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
            this.geometry.faces.splice(this.geometry.faces.indexOf(face), 1);
        }
        let newFaces = [];
        //Each integer is merely referencing a corner vertex.
        if (this.geometry.vertices[currentCell.vio + currentVertexA].y > this.geometry.vertices[otherCell.vio + otherVertexA].y &&
            this.geometry.vertices[currentCell.vio + currentVertexB].y > this.geometry.vertices[otherCell.vio + otherVertexB].y) {
            //Current side > other side.
            newFaces.push(new THREE.Face3(
                currentCell.vio + currentVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexA));
            newFaces.push(new THREE.Face3(
                otherCell.vio + otherVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexB));
        } else if (this.geometry.vertices[currentCell.vio + currentVertexA].y < this.geometry.vertices[otherCell.vio + otherVertexA].y &&
            this.geometry.vertices[currentCell.vio + currentVertexB].y < this.geometry.vertices[otherCell.vio + otherVertexB].y) {
            //Current side < other side.
            newFaces.push(new THREE.Face3(
                currentCell.vio + currentVertexA, otherCell.vio + otherVertexA, currentCell.vio + currentVertexB));
            newFaces.push(new THREE.Face3(
                otherCell.vio + otherVertexA, otherCell.vio + otherVertexB, currentCell.vio + currentVertexB));
        } else {
            //Handle the corners individually.
            if (this.geometry.vertices[currentCell.vio + currentVertexA].y != this.geometry.vertices[otherCell.vio + otherVertexA].y) {
                if (this.geometry.vertices[currentCell.vio + currentVertexA].y > this.geometry.vertices[otherCell.vio + otherVertexA].y) {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexA, currentCell.vio + currentVertexB, otherCell.vio + otherVertexA));
                } else {
                    newFaces.push(new THREE.Face3(
                        currentCell.vio + currentVertexA, otherCell.vio + otherVertexA, currentCell.vio + currentVertexB));
                }
            }
            if (this.geometry.vertices[currentCell.vio + currentVertexB].y != this.geometry.vertices[otherCell.vio + otherVertexB].y) {
                if (this.geometry.vertices[currentCell.vio + currentVertexB].y > this.geometry.vertices[otherCell.vio + otherVertexB].y) {
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
                this.geometry.faces.push(newFace);
            }
        }
    }
}