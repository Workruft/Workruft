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
let RedColor = new THREE.Color('red');
let BlueColor = new THREE.Color('blue');

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

function FloorToCell(alignMe) {
    return Math.floor(alignMe / CellSize) * CellSize;
}

function FloorToNextCell(alignMe) {
    return Math.floor(alignMe / CellSize + 1.0) * CellSize;
}

function LimitDistance({ startX, startZ, endX, endZ, maxDistance }) {
    let limitedX;
    let limitedZ;
    let limitedDistance;
    let fullXDistance = endX - startX;
    let fullZDistance = endZ - startZ;
    let distance = Math.hypot(fullXDistance, fullZDistance);
    let fullManhattanDistance = Math.abs(fullXDistance) + Math.abs(fullZDistance);
    if (distance < maxDistance) {
        //Closer to the destination than the maximum distance.
        limitedX = endX;
        limitedZ = endZ;
        limitedDistance = distance;
    } else {
        //Travel at the maximum distance.
        limitedX = startX + maxDistance * fullXDistance / fullManhattanDistance;
        limitedZ = startZ + maxDistance * fullZDistance / fullManhattanDistance;
        limitedDistance = maxDistance;
    }
    return { limitedX, limitedZ, limitedDistance, fullXDistance, fullZDistance, fullManhattanDistance };
}

//Starts at the first cell past the starting cell towards the end position if any.
//Calls the provided cellCallback function, passing the direction of the cell from
//the previous cell. Every cell traveled is guaranteed to be in one of the 4
//cardinal directions from the previous cell.
function IntersectLineWithGrid({ startX, startZ, endX, endZ, cellCallback }) {
    let cellX = FloorToCell(startX);
    let cellZ = FloorToCell(startZ);
    let diffX = endX - startX;
    let diffZ = endZ - startZ;
    let xDirection = (Math.sign(diffX) >= 0 ? 'right' : 'left');
    let yDirection = (Math.sign(diffZ) >= 0 ? 'front' : 'back');

    //Straight distance to the first vertical grid boundary.
    let xOffset = endX > startX ?
        (FloorToNextCell(startX) - startX) :
        (startX - cellX);
    //Straight distance to the first horizontal grid boundary.
    let yOffset = endZ > startZ ?
        (FloorToNextCell(startZ) - startZ) :
        (startZ - cellZ);
    //Angle of ray/slope.
    let angle = Math.atan2(-diffZ, diffX);
    //Note: These can be divide by 0's, but JS just yields Infinity! :)
    //How far to move along the ray to cross the first vertical grid cell boundary.
    let tMaxX = xOffset / Math.cos(angle);
    //How far to move along the ray to cross the first horizontal grid cell boundary.
    let tMaxZ = yOffset / Math.sin(angle);
    //How far to move along the ray to move horizontally 1 grid cell.
    let tDeltaX = 1.0 / Math.cos(angle);
    //How far to move along the ray to move vertically 1 grid cell.
    let tDeltaZ = 1.0 / Math.sin(angle);

    //Travel one grid cell at a time.
    let manhattanDistance = Math.abs(FloorToCell(endX) - cellX) +
        Math.abs(FloorToCell(endZ) - cellZ);
    for (let t = 0; t < manhattanDistance; ++t) {
        //Only move in either X or Z coordinates, not both.
        if (Math.abs(tMaxX) < Math.abs(tMaxZ)) {
            tMaxX += tDeltaX;
            if (!cellCallback({ direction: xDirection })) {
                return false;
            }
        } else {
            tMaxZ += tDeltaZ;
            if (!cellCallback({ direction: yDirection })) {
                return false;
            }
        }
    }
    return true;
}