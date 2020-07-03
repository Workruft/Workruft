let MSGPackLite = require('msgpack-lite');

//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class GameMap {
    constructor(sizeX, sizeZ, defaultY) {
        this.sizeX = sizeX;
        this.sizeZ = sizeZ;
        this.defaultY = defaultY;
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
                this.geometry.vertices.push(
                    new THREE.Vector3(x,            this.defaultY, z),
                    new THREE.Vector3(x + CellSize, this.defaultY, z),
                    new THREE.Vector3(x + CellSize, this.defaultY, z + CellSize),
                    new THREE.Vector3(x,            this.defaultY, z + CellSize)
                );
                this.geometry.faces.push(...column[z].faces.top);
                //Corners in UV coordinates:
                //   (0, 0)   Back  (1, 0)
                //          0-----1
                //    Left / Top / Right
                //        3-----2
                //(0, 1)  Front  (1, 1)
                //First face is corners (0, 3, 1).
                this.geometry.faceVertexUvs[0].push([
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.0, 1.0),
                    new THREE.Vector2(1.0, 0.0)
                ]);
                //Second face is corners (2, 1, 3).
                this.geometry.faceVertexUvs[0].push([
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

        this.updateCells({ lowX: this.minX, lowZ: this.minZ, highX: this.maxX, highZ: this.maxZ });

        this.mesh = new THREE.Mesh(this.geometry, MapMaterials);
        this.mesh.receiveShadow = true;
    }

    deconstruct() {
        DisposeThreeObject(this.geometry);
        //Don't dispose of this since it's a global reusable.
        //DisposeThreeObject(this.mesh.material);
    }

    getCell({ x, z }) {
        if (IsDefined(this.grid[x])) {
            return this.grid[x][z];
        } else {
            return undefined;
        }
    }

    getBackLeftHeight({ cell }) {
        return this.geometry.vertices[cell.vio].y;
    }

    getBackRightHeight({ cell }) {
        return this.geometry.vertices[cell.vio + 1].y;
    }

    getFrontRightHeight({ cell }) {
        return this.geometry.vertices[cell.vio + 2].y;
    }

    getFrontLeftHeight({ cell }) {
        return this.geometry.vertices[cell.vio + 3].y;
    }

    addBackLeftHeight({ cell, height }) {
        this.geometry.vertices[cell.vio].y += height;
    }

    addBackRightHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 1].y += height;
    }

    addFrontRightHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 2].y += height;
    }

    addFrontLeftHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 3].y += height;
    }

    addHeightToCell({ cell, height }) {
        this.addBackLeftHeight({ cell, height });
        this.addBackRightHeight({ cell, height });
        this.addFrontRightHeight({ cell, height });
        this.addFrontLeftHeight({ cell, height });
    }

    setBackLeftHeight({ cell, height }) {
        this.geometry.vertices[cell.vio].y = height;
    }

    setBackRightHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 1].y = height;
    }

    setFrontRightHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 2].y = height;
    }

    setFrontLeftHeight({ cell, height }) {
        this.geometry.vertices[cell.vio + 3].y = height;
    }

    setCellFlatHeight({ cell, height }) {
        this.setBackLeftHeight({ cell, height });
        this.setBackRightHeight({ cell, height });
        this.setFrontRightHeight({ cell, height });
        this.setFrontLeftHeight({ cell, height });
    }

    copyCellHeights({ copyToCell, copyFromCell }) {
        this.setBackLeftHeight({ cell: copyToCell, height: this.getBackLeftHeight({ cell: copyFromCell }) });
        this.setBackRightHeight({ cell: copyToCell, height: this.getBackRightHeight({ cell: copyFromCell }) });
        this.setFrontRightHeight({ cell: copyToCell, height: this.getFrontRightHeight({ cell: copyFromCell }) });
        this.setFrontLeftHeight({ cell: copyToCell, height: this.getFrontLeftHeight({ cell: copyFromCell }) });
    }

    getAverageHeight({ cell }) {
        return (this.geometry.vertices[cell.vio].y +
            this.geometry.vertices[cell.vio + 1].y +
            this.geometry.vertices[cell.vio + 2].y +
            this.geometry.vertices[cell.vio + 3].y)
            * 0.25;
    }

    getMinHeight({ cell }) {
        return Math.min(this.geometry.vertices[cell.vio].y,
            this.geometry.vertices[cell.vio + 1].y,
            this.geometry.vertices[cell.vio + 2].y,
            this.geometry.vertices[cell.vio + 3].y);
    }

    getMaxHeight({ cell }) {
        return Math.max(this.geometry.vertices[cell.vio].y,
            this.geometry.vertices[cell.vio + 1].y,
            this.geometry.vertices[cell.vio + 2].y,
            this.geometry.vertices[cell.vio + 3].y);
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

        this.geometry.elementsNeedUpdate = true;
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
        let faceIndex;
        for (let face of currentCell.faces[direction]) {
            faceIndex = this.geometry.faces.indexOf(face);
            this.geometry.faces.splice(faceIndex, 1);
            this.geometry.faceVertexUvs[0].splice(faceIndex, 1);
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
                newFace.materialIndex = 16;
                currentCell.faces[direction].push(newFace);
                this.geometry.faces.push(newFace);
                //See faceVertexUvs code above, when creating top Uvs.
                this.geometry.faceVertexUvs[0].push([
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.0, 1.0),
                    new THREE.Vector2(1.0, 0.0)
                ]);
            }
        }
    }

    getRandomPointOnMap() {
        return {
            x: Math.random() * (this.sizeX) + this.minX,
            z: Math.random() * (this.sizeZ) + this.minZ
        };
    }

    toArray() {
        let mapJSON = {};
        mapJSON.gameVersion = gameVersion;
        mapJSON.sizeX = this.sizeX;
        mapJSON.sizeZ = this.sizeZ;
        mapJSON.defaultY = this.defaultY;
        mapJSON.cellHeights = {};
        let currentCell;
        let currentHeights = [ mapJSON.defaultY, mapJSON.defaultY, mapJSON.defaultY, mapJSON.defaultY ];
        for (let x = this.minX; x <= this.maxX; x += CellSize) {
            for (let z = this.minZ; z <= this.maxZ; z += CellSize) {
                currentCell = this.getCell({ x, z });
                if (currentCell == null) {
                    continue;
                }
                currentHeights[0] = this.getBackLeftHeight({ cell: currentCell });
                currentHeights[1] = this.getBackRightHeight({ cell: currentCell });
                currentHeights[2] = this.getFrontRightHeight({ cell: currentCell });
                currentHeights[3] = this.getFrontLeftHeight({ cell: currentCell });
                if (currentHeights[0] == mapJSON.defaultY && currentHeights[1] == mapJSON.defaultY &&
                    currentHeights[2] == mapJSON.defaultY && currentHeights[3] == mapJSON.defaultY) {
                    continue;
                }
                if (currentHeights[0] == mapJSON.defaultY) {
                    currentHeights[0] = null;
                }
                if (currentHeights[1] == mapJSON.defaultY) {
                    currentHeights[1] = null;
                }
                if (currentHeights[2] == mapJSON.defaultY) {
                    currentHeights[2] = null;
                }
                if (currentHeights[3] == mapJSON.defaultY) {
                    currentHeights[3] = null;
                }
                mapJSON.cellHeights[[ x, z ]] = [...currentHeights];
            }
        }
        return MSGPackLite.encode(mapJSON);
    }

    static fromArray(mapArray) {
        let mapJSON = MSGPackLite.decode(mapArray);
        if (mapJSON == null) {
            throw 'Map is null!';
        }
        if (mapJSON.gameVersion == null) {
            throw 'Map version is null!';
        }
        //TODO: Validate most everything else here: sizeX, sizeZ, bounds of sizes, defaultY, etc...
        //
        if (JSON.stringify(mapJSON.gameVersion) != JSON.stringify(gameVersion)) {
            throw 'Mismatched game version! Map is v' + mapJSON.gameVersion.join('.')
                + ', but game is v' + gameVersion.join('.') + '!';
        }
        let gameMap = new GameMap(mapJSON.sizeX, mapJSON.sizeZ, mapJSON.defaultY);
        let currentCell;
        for (let [ xzArray, currentHeights ] of Object.entries(mapJSON.cellHeights)) {
            xzArray = JSON.parse('[' + xzArray + ']');
            if (!Array.isArray(xzArray) || xzArray.length != 2) {
                throw 'Invalid cell XZ array: ' + xzArray + ' (' + currentHeights + ')!';
            }
            currentCell = gameMap.getCell({ x: xzArray[0], z: xzArray[1] });
            if (currentCell == null) {
                throw 'Invalid cell XZ values: ' + xzArray + ' (' + currentHeights + ')!';
            }
            if (!Array.isArray(currentHeights) || currentHeights.length != 4) {
                throw 'Invalid cell heights array: ' + xzArray + ' (' + currentHeights + ')!';
            }
            //TODO: Validate cellHeights values here.
            //
            if (currentHeights[0] != null) {
                gameMap.setBackLeftHeight({ cell: currentCell, height: currentHeights[0] });
            }
            if (currentHeights[1] != null) {
                gameMap.setBackRightHeight({ cell: currentCell, height: currentHeights[1] });
            }
            if (currentHeights[2] != null) {
                gameMap.setFrontRightHeight({ cell: currentCell, height: currentHeights[2] });
            }
            if (currentHeights[3] != null) {
                gameMap.setFrontLeftHeight({ cell: currentCell, height: currentHeights[3] });
            }
        }
        gameMap.updateCells({ lowX: gameMap.minX, lowZ: gameMap.minZ, highX: gameMap.maxX, highZ: gameMap.maxZ });
        return gameMap;
    }
}

module.exports = GameMap;