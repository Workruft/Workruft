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
        let vio = 0;
        let heightVariance = 1.0;
        for (let x = -this.halfSizeX; x <= this.halfSizeX; x += CellSize) {
            let column = {};
            this.grid[x] = column;
            for (let z = -this.halfSizeZ; z <= this.halfSizeZ; z += CellSize) {
                let type = Math.random();
                let heights;
                if (type >= 0.9) {
                    let height = Math.round(Math.random() * heightVariance);
                    heights = [ height, height, height, height ];
                } else if (type >= 0.5) {
                    let height1 = Math.round(Math.random() * heightVariance);
                    let height2 = height1 - 1.0;
                    if (type >= 0.8) {
                        heights = [ height1, height1, height2, height2 ];
                    } else if (type >= 0.7) {
                        heights = [ height2, height1, height1, height2 ];
                    } else if (type >= 0.6) {
                        heights = [ height2, height2, height1, height1 ];
                    } else {
                        heights = [ height1, height2, height2, height1 ];
                    }
                } else {
                    let height = heightVariance * 0.5;
                    heights = [ height, height, height, height ];
                }
                column[z] = new Cell(x, z, heights, vio);
                this.geometry.vertices.push(...column[z].vertices);
                this.geometry.faces.push(...column[z].faces);
                vio += column[z].vertices.length;
            }
        }

        //For lighting.
        this.geometry.computeFaceNormals();

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors }));
    }
}