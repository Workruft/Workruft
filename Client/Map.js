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
        let heightVariance = 4.0;
        for (let x = -this.halfSizeX; x <= this.halfSizeX; x += CellSize * 2) {
            let column1 = {};
            let column2 = {};
            this.grid[x] = column1;
            this.grid[x + 1] = column2;
            for (let z = -this.halfSizeZ; z <= this.halfSizeZ; z += CellSize * 2) {
                let type = Math.random();
                let heights;
                if (type >= 0.9) {
                    let height = Math.round(Math.random() * heightVariance * 0.25) * 4.0;
                    heights = [ height, height, height, height ];
                } else if (type >= 0.8) {
                    let height1 = Math.round(Math.random() * heightVariance * 0.25) * 4.0;
                    let height2 = height1 + (1.0 * Math.sign(Math.random() - 0.5));
                    if (type >= 0.875) {
                        heights = [ height1, height1, height2, height2 ];
                    } else if (type >= 0.85) {
                        heights = [ height2, height1, height1, height2 ];
                    } else if (type >= 0.825) {
                        heights = [ height2, height2, height1, height1 ];
                    } else {
                        heights = [ height1, height2, height2, height1 ];
                    }
                } else {
                    let height = heightVariance * 0.5;
                    heights = [ height, height, height, height ];
                }

                column1[z] = new Cell(x, z, [
                    (heights[0] + heights[3]) * 0.5, (heights[1] + heights[3]) * 0.5, (heights[2] + heights[3]) * 0.5, heights[3]
                ], vio);
                this.geometry.vertices.push(...column1[z].vertices);
                this.geometry.faces.push(...column1[z].faces);
                vio += column1[z].vertices.length;

                column1[z + 1] = new Cell(x, z + 1, [
                    heights[0], (heights[1] + heights[0]) * 0.5, (heights[2] + heights[0]) * 0.5, (heights[3] + heights[0]) * 0.5
                ], vio);
                this.geometry.vertices.push(...column1[z + 1].vertices);
                this.geometry.faces.push(...column1[z + 1].faces);
                vio += column1[z + 1].vertices.length;

                column2[z] = new Cell(x + 1, z, [
                    (heights[0] + heights[2]) * 0.5, (heights[1] + heights[2]) * 0.5, heights[2], (heights[3] + heights[2]) * 0.5
                ], vio);
                this.geometry.vertices.push(...column2[z].vertices);
                this.geometry.faces.push(...column2[z].faces);
                vio += column2[z].vertices.length;

                column2[z + 1] = new Cell(x + 1, z + 1, [
                    (heights[0] + heights[1]) * 0.5, heights[1], (heights[2] + heights[1]) * 0.5, (heights[3] + heights[1]) * 0.5
                ], vio);
                this.geometry.vertices.push(...column2[z + 1].vertices);
                this.geometry.faces.push(...column2[z + 1].faces);
                vio += column2[z + 1].vertices.length;
            }
        }

        //For lighting.
        this.geometry.computeFaceNormals();

        this.mesh = new THREE.Mesh(
            this.geometry,
            new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors }));
    }
}