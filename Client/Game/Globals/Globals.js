let PathTestingLeniency = 0.2;
let PathFindingGreediness = 2.0;
let PathFindingMaxPoints = 5000;
let PathFindingMaxPointsWithoutImprovement = 1000;

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
let LightGreenColor = new THREE.Color('#188026');
let YellowColor = new THREE.Color('#FFFF00');
let BlackColor = new THREE.Color('#000000');
let ColoredMeshPhongMaterialsMap = new Map();

let HalfPI = Math.PI * 0.5;
let DoublePI = Math.PI * 2.0;

function HasFlag({ borderFlags, testFlag }) {
    return !!(borderFlags & testFlag);
}

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

//Must be a WeakMap to store the functions as keys by reference rather than having JS auto-convert them into strings...
let OverExecutionGuard = new WeakMap();
//Call this from the specified calling function to rate limit how often the rest of
//the function gets executed at a specified minimum interval. Utilize the return value of this
//function to determine whether to continue execution of the specified calling function. The
//calling function will *not* be recalled at a later time if it cannot execute immediately.
//Note: Do not bind the callingFunction parameter passed to this function!
//Returns whether to continue on with the rest of the function (true) or return out of it immediately (false).
function RateLimit({ callingFunction, minimumInterval }) {
    //Get the current ticks.
    let currentTicks = performance.now;

    //Get or create the current over execution guard object.
    let currentGuard;
    if (OverExecutionGuard.has(callingFunction)) {
        currentGuard = OverExecutionGuard.get(callingFunction);
    } else {
        //Go ahead and call the function now, since this is the first time.
        currentGuard = {
            lastTicks: currentTicks
        };
        OverExecutionGuard.set(callingFunction, currentGuard);
    }

    //Check to ensure that the minimum interval has passed since the last execution time.
    if (currentGuard.lastTicks + minimumInterval <= currentTicks) {
        currentGuard.lastTicks = currentTicks;
        return true;
    }

    return false;
}

//Call this from the specified calling function to rate limit how often the rest of
//the function gets executed at a specified minimum interval. Utilize the return value of this
//function to determine whether to continue execution of the specified calling function. The
//calling function will be recalled at a later time if it cannot execute immediately.
//Note: Do not bind the callingFunction parameter passed to this function!
//Returns whether to continue on with the rest of the function (true) or return out of it immediately (false).
function RateLimitRecall({ callingFunction, minimumInterval, thisToBind, paramsToPass }) {
    //Get the current ticks.
    let currentTicks = performance.now;

    //Get or create the current over execution guard object.
    let currentGuard;
    if (OverExecutionGuard.has(callingFunction)) {
        currentGuard = OverExecutionGuard.get(callingFunction);
    } else {
        //Go ahead and call the function now, since this is the first time.
        currentGuard = {
            isCallingNow: true,
            lastTicks: currentTicks,
            alreadyHasTimeout: false
        };
        OverExecutionGuard.set(callingFunction, currentGuard);
    }

    //Avoid recursion: if the function is being called from a RateLimitRecall timeout, go ahead and
    //let it execute.
    if (currentGuard.isCallingNow) {
        currentGuard.isCallingNow = false;
        currentGuard.lastTicks = currentTicks;
        return true;
    }

    //Check to ensure that the minimum interval has passed since the last execution time.
    if (currentGuard.lastTicks + minimumInterval <= currentTicks) {
        currentGuard.lastTicks = currentTicks;
        return true;
    }

    //See if a timeout has already been created.
    if (currentGuard.alreadyHasTimeout) {
        //Do nothing. When the timeout expires, it will call the function.
        return false;
    }

    //The function is not currently being called, the minimum interval has not passed since the
    //last execution time, and a timeout for the next call has not already been created.
    //Therefore, create a timeout.
    currentGuard.alreadyHasTimeout = true;
    //eslint-disable-next-line no-shadow
    setTimeout(function (currentGuard, callingFunction, thisToBind, paramsToPass) {
        //There's no longer a timeout, and the function is being called now, so don't rate limit
        //it this time.
        currentGuard.alreadyHasTimeout = false;
        currentGuard.isCallingNow = true;
        callingFunction.call(thisToBind, paramsToPass);
    }.bind(this, currentGuard, callingFunction, thisToBind, paramsToPass),
    currentGuard.lastTicks + minimumInterval - currentTicks);
}

function LerpBorderWaveLine({ context, startX, startY, endX, endY, lineCount,
    horizontalWaveFrequency, horizontalWaveAmplitude, verticalWaveFrequency, verticalWaveAmplitude
}) {
    context.beginPath();
    context.moveTo(startX, startY);
    let lerpInterval = 1.0 / lineCount;
    let oneMinus;
    for (let lerpRatio = 0.0; lerpRatio <= 1.0; lerpRatio += lerpInterval) {
        oneMinus = 1.0 - lerpRatio;
        context.lineTo(
            oneMinus * startX + lerpRatio * endX +
                Math.sin(verticalWaveFrequency * lerpRatio + Math.random() * 5.0) * verticalWaveAmplitude,
            oneMinus * startY + lerpRatio * endY +
                Math.sin(horizontalWaveFrequency * lerpRatio + Math.random() * 5.0) * horizontalWaveAmplitude
        );
    }
    context.stroke();
}
function CreateCanvasTexture({ width, height, color, colorVariances, colorSubtractions,
    lineCount, lengthVariance, lengthAddition, borderFlags }) {
    let context = document.createElement('canvas').getContext('2d');
    context.canvas.width = width;
    context.canvas.height = height;
    context.fillStyle = color;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    let imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    let data = imageData.data;
    for (let lineIndex = 0; lineIndex < lineCount; ++lineIndex) {
        let x = Math.random() * context.canvas.width;
        let y = Math.random() * context.canvas.height;
        let direction = Math.random() * DoublePI;
        let length = Math.random() * lengthVariance + lengthAddition;
        let redDifference = Math.round(Math.random() * colorVariances.red - colorSubtractions.red);
        let greenDifference = Math.round(Math.random() * colorVariances.green - colorSubtractions.green);
        let blueDifference = Math.round(Math.random() * colorVariances.blue - colorSubtractions.blue);
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
    let clipPath = new Path2D();
    let clipSize = 4;
    let doubleClipSize = clipSize * 2.0;
    clipPath.rect(clipSize, clipSize, context.canvas.width - doubleClipSize, context.canvas.height - doubleClipSize);
    context.clip(clipPath);
    context.strokeStyle = '#' + GrassColor.clone().multiplyScalar(0.5).getHexString();
    let lineWidth = 10.0;
    context.lineWidth = lineWidth;
    let waveAmplitude = 1.0;
    let waveFrequency = 100.0;
    if (HasFlag({ borderFlags, testFlag: 1 })) {
        LerpBorderWaveLine({
            context, startX: 0.0, startY: 0.0,
            endX: width, endY: 0.0, lineCount: width,
            horizontalWaveFrequency: waveFrequency, horizontalWaveAmplitude: waveAmplitude,
            verticalWaveFrequency: waveFrequency, verticalWaveAmplitude: 0.0
        });
    }
    if (HasFlag({ borderFlags, testFlag: 2 })) {
        LerpBorderWaveLine({
            context, startX: width, startY: 0.0,
            endX: width, endY: height, lineCount: height,
            horizontalWaveFrequency: waveFrequency, horizontalWaveAmplitude: 0.0,
            verticalWaveFrequency: waveFrequency, verticalWaveAmplitude: waveAmplitude
        });
    }
    if (HasFlag({ borderFlags, testFlag: 4 })) {
        LerpBorderWaveLine({
            context, startX: width, startY: height,
            endX: 0.0, endY: height, lineCount: width,
            horizontalWaveFrequency: waveFrequency, horizontalWaveAmplitude: waveAmplitude,
            verticalWaveFrequency: waveFrequency, verticalWaveAmplitude: 0.0
        });
    }
    if (HasFlag({ borderFlags, testFlag: 8 })) {
        LerpBorderWaveLine({
            context, startX: 0.0, startY: height,
            endX: 0.0, endY: 0.0, lineCount: height,
            horizontalWaveFrequency: waveFrequency, horizontalWaveAmplitude: 0.0,
            verticalWaveFrequency: waveFrequency, verticalWaveAmplitude: waveAmplitude
        });
    }
    // document.body.prepend(context.canvas);
    let canvasTexture = new THREE.CanvasTexture(context.canvas);
    canvasTexture.wrapS = canvasTexture.wrapT = THREE.RepeatWrapping;
    return canvasTexture;
}
let GrassMaterials = [];
for (let borderFlags = 0; borderFlags < 16; ++borderFlags) {
    GrassMaterials.push(new THREE.MeshPhongMaterial({
        map: CreateCanvasTexture({
            width: 256, height: 256, color: '#' + GrassColor.getHexString(),
            colorVariances: {
                red: 5.0,
                green: 15.0,
                blue: 5.0,
            },
            colorSubtractions: {
                red: 2.5,
                green: 7.5,
                blue: 2.5
            },
            lineCount: 5000, lengthVariance: 14.0, lengthAddition: 1.0, borderFlags
        }),
        shininess: 10
    }));
}