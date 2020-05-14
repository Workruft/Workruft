//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

let SquareGeometry = new THREE.PlaneBufferGeometry(CellSize, CellSize);

let TinySphereGeometry = new THREE.SphereBufferGeometry(HalfTinySize, 15, 15);
let SmallSphereGeometry = new THREE.SphereBufferGeometry(TinySize, 15, 15);
let TinyCubeGeometry = new THREE.BoxGeometry(TinySize, TinySize, TinySize);
let SmallCubeGeometry = new THREE.BoxGeometry(SmallSize, SmallSize, SmallSize);

function createCircleGeometry(radius) {
    let circleGeometry = new THREE.Geometry();
    for (let rotation = 0; rotation < Math.PI * 2.0; rotation += Math.PI * 0.01) {
        circleGeometry.vertices.push(
            new THREE.Vector3(radius * Math.cos(rotation), radius * Math.sin(rotation), 0.0));
    }
    circleGeometry.vertices.push(circleGeometry.vertices[0]);
    let circleLine = new MeshLine();
    circleLine.setGeometry(circleGeometry);
    //Parabolic width.
    //circleLine.setGeometry(circleGeometry, function(point) {
    //    return Math.pow(4 * point * (1 - point), 1);
    //});
    return circleLine.geometry;
}
let CircleGeometriesMap = new Map();
for (let halfXZSize of CommonUnitHalfSizes) {
    CircleGeometriesMap.set(halfXZSize, createCircleGeometry(SelectionExtraRadius + halfXZSize));
}

function DeconstructPrimitives() {
    DisposeThreeObject(TinySphereGeometry);
    DisposeThreeObject(SmallSphereGeometry);
    DisposeThreeObject(TinyCubeGeometry);
    DisposeThreeObject(SmallCubeGeometry);
    for (let circleGeometry of CircleGeometriesMap.keys()) {
        DisposeThreeObject(circleGeometry);
    }
    CircleGeometriesMap.clear();
}