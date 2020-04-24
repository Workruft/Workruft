//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class Map {
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

        //Vertex Index Offset.
        let vio;
        for (let x = this.minX; x <= this.maxX; x += CellSize) {
            let column = {};
            this.grid[x] = column;
            for (let z = this.minZ; z <= this.maxZ; z += CellSize) {
                vio = this.geometry.vertices.length;
                column[z] = {
                    vio,
                    //Faces must be in counter-clockwise direction to be facing outside.
                    //Each integer is merely referencing a corner vertex.
                    faces: {
                        top: [
                            new THREE.Face3(vio,     vio + 3, vio + 1),
                            new THREE.Face3(vio + 2, vio + 1, vio + 3)
                        ]
                    }
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
                    new THREE.Vector3(x - HalfCellSize, MapBottomY, z - HalfCellSize),
                    new THREE.Vector3(x + HalfCellSize, MapBottomY, z - HalfCellSize),
                    new THREE.Vector3(x + HalfCellSize, MapBottomY, z + HalfCellSize),
                    new THREE.Vector3(x - HalfCellSize, MapBottomY, z + HalfCellSize)
                );
                this.geometry.faces.push(...column[z].faces.top);
            }
        }

        //For lighting.
        this.geometry.computeFaceNormals();

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

    //Corners:
    //        Back
    //      0-----1
    //Left / Top / Right
    //    3-----2
    //    Front
    updateCliffs({ lowX, lowZ, highX, highZ }) {
        let currentCell;
        //Go through each side within the bounds.
        for (let x = lowX; x < highX; x += CellSize) {
            for (let z = lowZ; z < highZ; z += CellSize) {
                currentCell = this.getCell({ x, z });
                //Right.
                if (x < highX) {
                    this.updateFaces({
                        currentCell, otherX: x + 1, otherZ: z,
                        direction: 'right',
                        currentVertexA: 1, otherVertexA: 0,
                        currentVertexB: 2, otherVertexB: 3
                    });
                }
                //Front.
                if (z < highZ) {
                    this.updateFaces({
                        currentCell, otherX: x, otherZ: z + 1,
                        direction: 'front',
                        currentVertexA: 2, otherVertexA: 1,
                        currentVertexB: 3, otherVertexB: 0
                    });
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
        currentCell, otherX, otherZ,
        direction,
        currentVertexA, otherVertexA,
        currentVertexB, otherVertexB
    }) {
        let otherCell = this.getCell({ x: otherX, z: otherZ });
        if (IsUndefined(otherCell)) {
            return;
        }
        if (IsDefined(currentCell.faces[direction])) {
            for (let face of currentCell.faces[direction]) {
                this.geometry.faces.splice(this.geometry.faces.indexOf(face), 1);
            }
            delete currentCell.faces[direction];
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
            currentCell.faces[direction] = [];
            for (let newFace of newFaces) {
                newFace.color = DirtColor;
                currentCell.faces[direction].push(newFace);
                this.geometry.faces.push(newFace);
            }
        }
    }
}