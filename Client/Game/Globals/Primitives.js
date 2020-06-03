//Directions:
//  -Z    /\+Y
//-X  +X  ||
//  +Z    \/-Y

window.SquareGeometry = new THREE.PlaneBufferGeometry(CellSize, CellSize);

window.TinySphereGeometry = new THREE.SphereBufferGeometry(HalfTinySize, 15, 15);
window.SmallSphereGeometry = new THREE.SphereBufferGeometry(TinySize, 15, 15);
window.TinyCubeGeometry = new THREE.BoxGeometry(TinySize, TinySize, TinySize);
window.SmallCubeGeometry = new THREE.BoxGeometry(SmallSize, SmallSize, SmallSize);

window.CircleGeometriesMap = new Map();
{
    function createCircleGeometry(radius) {
        let circleGeometry = new THREE.Geometry();
        for (let rotation = 0; rotation < Math.PI * 2.0; rotation += Math.PI * 0.01) {
            circleGeometry.vertices.push(
                new THREE.Vector3(radius * Math.cos(rotation), radius * Math.sin(rotation), 0.0));
        }
        circleGeometry.vertices.push(circleGeometry.vertices[0]);
        let circleLine = new MeshLine.MeshLine();
        circleLine.setGeometry(circleGeometry);
        //Parabolic width.
        //circleLine.setGeometry(circleGeometry, function(point) {
        //    return Math.pow(4 * point * (1 - point), 1);
        //});
        return circleLine.geometry;
    }
    for (let halfXZSize of CommonUnitHalfSizes) {
        CircleGeometriesMap.set(halfXZSize, createCircleGeometry(SelectionExtraRadius + halfXZSize));
    }
}

window.DeconstructPrimitives = function() {
    DisposeThreeObject(TinySphereGeometry);
    DisposeThreeObject(SmallSphereGeometry);
    DisposeThreeObject(TinyCubeGeometry);
    DisposeThreeObject(SmallCubeGeometry);
    for (let circleGeometry of CircleGeometriesMap.keys()) {
        DisposeThreeObject(circleGeometry);
    }
    CircleGeometriesMap.clear();
};