let CellSize = 1.0;
let HalfCellSize = CellSize * 0.5;
let QuarterCellSize = HalfCellSize * 0.5;

let HalfTinySize = CellSize;
let TinySize = CellSize * 2.0;
let SmallSize = TinySize * 2.0;

let SelectionExtraRadius = QuarterCellSize;

let MapBottomY = 0.0;
let MapMinimumHeight = 0.0;

let MinCameraHeight = 3.0;
let MaxCameraHeight = 500.0;

let GrassColor = new THREE.Color('#0c4013');
let DirtColor = new THREE.Color('#2b3c1f');

let HalfPI = Math.PI * 0.5;

// Store all of the HTML DOM elements in the body of the page as an HTMLCollection.
// Any element with an ID can now simply be accessed by HTML.theID or HTML['theID'].
// This HTMLCollection can also be iterated through, via.: for (... of ...) { }.
// Note that this HTMLCollection is live/dynamic, it changes in sync with the DOM.
// If accessing HTML elements by class, use:
// Array.from(document.getElementsByClassName('className')).forEach(function (className) {
let HTML = document.body.getElementsByTagName('*');

//Make sure to delete it as well!
function DisposeThreeObject(disposeMe) {
    if (disposeMe == null) {
        return;
    }
    if (disposeMe.parent) {
        disposeMe.parent.remove(disposeMe);
    }
    if (disposeMe.dispose) {
        disposeMe.dispose();
    }
}

function IsUndefined(checkMe) {
    return typeof checkMe == 'undefined';
}

function IsDefined(checkMe) {
    return typeof checkMe !== 'undefined';
}

function AlignToCell(alignMe) {
    return Math.round(alignMe / CellSize) * CellSize;
}

function AlignToNextCell(alignMe) {
    return Math.round(alignMe / CellSize + 1.0) * CellSize;
}

function LimitDistance({ startX, startZ, endX, endZ, maxDistance }) {
    let limitedX;
    let limitedZ;
    let limitedDistance;
    let xDistance = endX - startX;
    let zDistance = endZ - startZ;
    let distance = Math.hypot(xDistance, zDistance);
    if (distance < maxDistance) {
        //Closer to the destination than the maximum distance.
        limitedX = currentOrder.data.x;
        limitedZ = currentOrder.data.z;
        limitedDistance = distance;
    } else {
        //Travel at the maximum distance.
        let manhattanDistance = Math.abs(xDistance) + Math.abs(zDistance);
        limitedX = startX + maxDistance * xDistance / manhattanDistance;
        limitedZ = startZ + maxDistance * zDistance / manhattanDistance;
        limitedDistance = maxDistance;
    }
    return { limitedX, limitedZ, limitedDistance };
}

function IntersectLineWithGrid({ startX, startY, endX, endY, cellCallback }) {
    let currentX = AlignToCell(start.x);
    let currentY = AlignToCell(start.y);
    let diffX = end.x - start.x;
    let diffY = end.y - start.y;
    let stepX = Math.sign(diffX);
    let stepY = Math.sign(diffY);

    //Straight distance to the first vertical grid boundary.
    let xOffset = end.x > start.x ?
        (AlignToNextCell(start.x) - start.x) :
        (start.x - currentX);
    //Straight distance to the first horizontal grid boundary.
    let yOffset = end.y > start.y ?
        (AlignToNextCell(start.y) - start.y) :
        (start.y - currentY);
    //Angle of ray/slope.
    let angle = Math.atan2(-diffY, diffX);
    //Note: These can be divide by 0's, but JS just yields Infinity! :)
    //How far to move along the ray to cross the first vertical grid cell boundary.
    let tMaxX = xOffset / Math.cos(angle);
    //How far to move along the ray to cross the first horizontal grid cell boundary.
    let tMaxY = yOffset / Math.sin(angle);
    //How far to move along the ray to move horizontally 1 grid cell.
    let tDeltaX = 1.0 / Math.cos(angle);
    //How far to move along the ray to move vertically 1 grid cell.
    let tDeltaY = 1.0 / Math.sin(angle);

    //Travel one grid cell at a time.
    let manhattanDistance = Math.abs(AlignToCell(end.x) - currentX) +
        Math.abs(AlignToCell(end.y) - currentY);
    for (let t = 0; t < manhattanDistance; ++t) {
        //Only move in either X or Y coordinates, not both.
        if (Math.abs(tMaxX) < Math.abs(tMaxY)) {
            tMaxX += tDeltaX;
            currentX += stepX;
        } else {
            tMaxY += tDeltaY;
            currentY += stepY;
        }
        cellCallback({ currentX, currentY });
    }
}