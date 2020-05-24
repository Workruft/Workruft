let PathTestingLeniency = 0.2;
let PathFindingGreediness = 2.0;
let PathFindingMaxPoints = 5000;
let PathFindingMaxPointsWithoutImprovement = 500;

let CellSize = 1.0;
let HalfCellSize = CellSize * 0.5;
let QuarterCellSize = HalfCellSize * 0.5;
let ThreeHalvesCellSize = CellSize * 1.5;
let DoubleCellSize = CellSize * 2.0;

let HalfTinySize = CellSize;
let TinySize = DoubleCellSize;
let SmallSize = TinySize * 2.0;
let BigSize = SmallSize * 2.0;

let SelectionExtraRadius = QuarterCellSize;

let CommonUnitHalfSizes = [];
for (let halfXZSize = HalfTinySize; halfXZSize <= SmallSize; halfXZSize += HalfTinySize) {
    CommonUnitHalfSizes.push(halfXZSize);
}

let MapBottomY = 0.0;
let MapMinimumHeight = 0.0;

let MinCameraHeight = 3.0;
let MaxCameraHeight = 500.0;

let GrassColor = new THREE.Color('#0c4013');
let DirtColor = new THREE.Color('#2b3c1f');
let RedColor = new THREE.Color('#A02000');
let BlueColor = new THREE.Color('#001080');
let YellowColor = new THREE.Color('#FFFF00');
let BlackColor = new THREE.Color('#000000');
let ColoredMeshPhongMaterialsMap = new Map();

let HalfPI = Math.PI * 0.5;
let DoublePI = Math.PI * 2.0;

Enums.create({
    name: 'GameStates',
    items: [ 'Playing', 'MapEditing' ]
});

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

function GenericRound(roundMe) {
    return Math.round(roundMe * 100000000.0) / 100000000.0;
}

let context = document.createElement('canvas').getContext('2d');
context.canvas.width = 256;
context.canvas.height = 256;
let grassColorHex = '#0c4013';
let grassColorRed = parseInt(grassColorHex.substr(1, 2), 16);
let grassColorGreen = parseInt(grassColorHex.substr(3, 2), 16);
let grassColorBlue = parseInt(grassColorHex.substr(5, 2), 16);
context.fillStyle = grassColorHex;
context.fillRect(0, 0, context.canvas.width, context.canvas.height);
let imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
let data = imageData.data;
let grassColorVariance = 10.0;
let grassColorSubtraction = grassColorVariance * 0.5;
for (let bladeIndex = 0; bladeIndex < 10000; ++bladeIndex) {
    let x = Math.random() * context.canvas.width;
    let y = Math.random() * context.canvas.height;
    let direction = Math.random() * DoublePI;
    let length = Math.random() * 14.0 + 1.0;
    let redDifference = Math.round(Math.random() * grassColorVariance - grassColorSubtraction);
    let greenDifference = Math.round(Math.random() * grassColorVariance - grassColorSubtraction);
    let blueDifference = Math.round(Math.random() * grassColorVariance - grassColorSubtraction);
    for (let pixelIndex = 0; pixelIndex < length; ++pixelIndex) {
        let currentX = Math.floor(x + Math.cos(direction) * pixelIndex);
        if (currentX < 0.0) {
            currentX += context.canvas.width;
        } else if (currentX >= context.canvas.width) {
            currentX -= context.canvas.width;
        }
        let currentY = Math.floor(y + Math.sin(direction) * pixelIndex);
        if (currentY < 0.0) {
            currentY += context.canvas.height;
        } else if (currentX >= context.canvas.height) {
            currentY -= context.canvas.height;
        }
        let currentOffset = currentY * context.canvas.width * 4 + currentX * 4;
        data[currentOffset] += redDifference;
        data[currentOffset + 1] += greenDifference;
        data[currentOffset + 2] += blueDifference;
    }
}
context.putImageData(imageData, 0, 0);
// document.body.prepend(context.canvas);
let GrassTexture = new THREE.CanvasTexture(context.canvas);
GrassTexture.repeat.set(1.0, 1.0);
GrassTexture.wrapS = GrassTexture.wrapT = THREE.RepeatWrapping;