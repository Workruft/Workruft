let GrassColor = new THREE.Color('#0c4013');
let DirtColor = new THREE.Color('#2b3c1f');

//Each cell is a cube with top corner shearing.
//(Its top corners can have different heights.)
class Cell {
    constructor(x, z, heights, vio) {
        this.x = x;
        this.z = z;
        this.heights = heights;
        //Vertex Index Offset.
        this.vio = vio;
        this.createVertices();
        this.createFaces();
    }

    //Corners:
    //    Top
    //  6----7
    // /|   /|
    //2----3 | Right
    //| |  | |
    //| 4--|-5
    //|/   |/ Right
    //0----1
    //Front
    createVertices() {
        //Heights: [ 2, 3, 7, 6 ]
        //In order from 0-7:
        this.vertices = [
            new THREE.Vector3(this.x,            MapBottomY,                         this.z + CellSize),
            new THREE.Vector3(this.x + CellSize, MapBottomY,                         this.z + CellSize),
            new THREE.Vector3(this.x,            MapMinimumHeight + this.heights[0], this.z + CellSize),
            new THREE.Vector3(this.x + CellSize, MapMinimumHeight + this.heights[1], this.z + CellSize),
            new THREE.Vector3(this.x,            MapBottomY,                         this.z),
            new THREE.Vector3(this.x + CellSize, MapBottomY,                         this.z),
            new THREE.Vector3(this.x,            MapMinimumHeight + this.heights[3], this.z),
            new THREE.Vector3(this.x + CellSize, MapMinimumHeight + this.heights[2], this.z)
        ];
    }

    //Faces. Must be in counter-clockwise direction to be facing outside.
    //Each integer is merely referencing a corner vertex.
    createFaces() {
        //Vertex Index Offset.
        let vio = this.vio;
        this.faces = [
            //Front.
            new THREE.Face3(vio + 0, vio + 3, vio + 2),
            new THREE.Face3(vio + 0, vio + 1, vio + 3),
            //Right.
            new THREE.Face3(vio + 1, vio + 7, vio + 3),
            new THREE.Face3(vio + 1, vio + 5, vio + 7),
            //Back.
            new THREE.Face3(vio + 5, vio + 6, vio + 7),
            new THREE.Face3(vio + 5, vio + 4, vio + 6),
            //Left.
            new THREE.Face3(vio + 4, vio + 2, vio + 6),
            new THREE.Face3(vio + 4, vio + 0, vio + 2),
            //Bottom.
            new THREE.Face3(vio + 4, vio + 1, vio + 0),
            new THREE.Face3(vio + 4, vio + 5, vio + 1),
            //Top.
            new THREE.Face3(vio + 2, vio + 7, vio + 6),
            new THREE.Face3(vio + 2, vio + 3, vio + 7),
        ];
        for (let faceIndex = 0; faceIndex < 10; ++faceIndex) {
            this.faces[faceIndex].color = DirtColor;
        }
        this.faces[10].color = GrassColor;
        this.faces[11].color = GrassColor;
    }

    getMaxHeight() {
        return Math.max(this.vertices[2].y, this.vertices[3].y, this.vertices[7].y, this.vertices[6].y);
    }
}