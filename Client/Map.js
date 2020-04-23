//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

class Map {
    constructor(sizeX, sizeZ) {
        this.sizeX = sizeX;
        this.sizeZ = sizeZ;
        this.halfSizeX = this.sizeX * 0.5;
        this.halfSizeZ = this.sizeZ * 0.5;

        this.generate();
    }

    generate() {
        this.grid = {};
        this.geometry = new THREE.Geometry();

        //Vertex Index Offset.
        let vio;
        for (let x = -this.halfSizeX; x <= this.halfSizeX; x += CellSize) {
            let column = {};
            this.grid[x] = column;
            for (let z = -this.halfSizeZ; z <= this.halfSizeZ; z += CellSize) {
                vio = this.geometry.vertices.length;
                column[z] = {
                    //Corners:
                    //        Back
                    //      0-----1
                    //Left / Top / Right
                    //    3-----2
                    //    Front
                    vertices: [
                        new THREE.Vector3(x,            MapBottomY, z),
                        new THREE.Vector3(x + CellSize, MapBottomY, z),
                        new THREE.Vector3(x + CellSize, MapBottomY, z + CellSize),
                        new THREE.Vector3(x,            MapBottomY, z + CellSize),
                    ],
                    //Faces must be in counter-clockwise direction to be facing outside.
                    //Each integer is merely referencing a corner vertex.
                    faces: [
                        //Top.
                        new THREE.Face3(vio,     vio + 3, vio + 1),
                        new THREE.Face3(vio + 2, vio + 1, vio + 3)
                    ]
                };
                column[z].faces[0].color = GrassColor;
                column[z].faces[1].color = GrassColor;
                this.geometry.vertices.push(...column[z].vertices);
                this.geometry.faces.push(...column[z].faces);
            }
        }

        //For lighting.
        this.geometry.computeFaceNormals();

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors }));
    }

    getCell({ integerX, integerZ }) {
        return this.grid[integerX][integerZ];
    }
}