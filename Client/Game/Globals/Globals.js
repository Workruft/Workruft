window.PostProcessing = true;

window.PathTestingLeniency = 0.2;
window.PathFindingGreediness = 2.0;
window.PathFindingMaxPoints = 5000;
window.PathFindingMaxPointsWithoutImprovement = 1000;

window.CellSize = 1.0;
window.HalfCellSize = CellSize * 0.5;
window.QuarterCellSize = HalfCellSize * 0.5;
window.ThreeHalvesCellSize = CellSize * 1.5;
window.DoubleCellSize = CellSize * 2.0;
window.QuadrupleCellSize = DoubleCellSize * 2.0;

window.HalfTinySize = CellSize;
window.TinySize = DoubleCellSize;
window.SmallSize = TinySize * 2.0;
window.BigSize = SmallSize * 2.0;

window.SelectionExtraRadius = QuarterCellSize;

window.CommonUnitHalfSizes = [];
for (let halfXZSize = HalfTinySize; halfXZSize <= SmallSize; halfXZSize += HalfTinySize) {
    CommonUnitHalfSizes.push(halfXZSize);
}

window.MapBottomY = 0.0;
window.MapMinimumHeight = 0.0;

window.MinCameraHeight = 3.0;
window.MaxCameraHeight = 500.0;

window.MinEditingLatSize = 1;
window.MinEditingLongSize = 1;
window.MaxEditingLatSize = 64;
window.MaxEditingLongSize = 64;

window.GrassColor = new THREE.Color('#0c4013');
window.DirtColor = new THREE.Color('#1A1A0D');
window.RedColor = new THREE.Color('#A02000');
window.BlueColor = new THREE.Color('#001080');
window.LightGreenColor = new THREE.Color('#188026');
window.YellowColor = new THREE.Color('#FFFF00');
window.BlackColor = new THREE.Color('#000000');
window.DarkGrayColor = new THREE.Color('#080808');
window.WhiteColor = new THREE.Color('#FFFFFF');
window.ColoredMeshPhongMaterialsMap = new Map();

window.GridLinesMaterial = new THREE.LineBasicMaterial({
    color: BlueColor, transparent: true, opacity: 0.15
});
window.EditingVerticalLinesMaterial = new THREE.LineBasicMaterial({
    color: DarkGrayColor, transparent: true, opacity: 0.5
});
window.GridLinesSeparation = QuadrupleCellSize;
window.VerticalGridLinesSeparation = QuadrupleCellSize;
window.VerticalGridLinesHeight = CellSize * 25.0 + 0.01;

window.HalfPI = Math.PI * 0.5;
window.DoublePI = Math.PI * 2.0;

window.HasFlag = function({ borderFlags, testFlag }) {
    return !!(borderFlags & testFlag);
}

Enums.create({
    name: 'GameStates',
    items: [ 'Playing', 'MapEditing' ]
});

//Make sure to delete it as well!
window.DisposeThreeObject = function(disposeMe) {
    if (disposeMe == null) {
        return;
    }
    if (disposeMe.parent) {
        disposeMe.parent.remove(disposeMe);
    }
    if (disposeMe.dispose) {
        disposeMe.dispose();
    }
};

window.IsUndefined = function(checkMe) {
    return typeof checkMe == 'undefined';
};

window.IsDefined = function(checkMe) {
    return typeof checkMe !== 'undefined';
};

window.GenericRound = function(roundMe) {
    return Math.round(roundMe * 100000000.0) / 100000000.0;
};

//Must be a WeakMap to store the functions as keys by reference rather than having JS auto-convert them into strings...
window.OverExecutionGuard = new WeakMap();
//Call this from the specified calling function to rate limit how often the rest of
//the function gets executed at a specified minimum interval. Utilize the return value of this
//function to determine whether to continue execution of the specified calling function. The
//calling function will *not* be recalled at a later time if it cannot execute immediately.
//Note: Do not bind the callingFunction parameter passed to this function!
//Returns whether to continue on with the rest of the function (true) or return out of it immediately (false).
window.RateLimit = function({ callingFunction, minimumInterval }) {
    //Get the current ticks.
    let currentTicks = performance.now();

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
};

//Call this from the specified calling function to rate limit how often the rest of
//the function gets executed at a specified minimum interval. Utilize the return value of this
//function to determine whether to continue execution of the specified calling function. The
//calling function will be recalled at a later time if it cannot execute immediately.
//Note: Do not bind the callingFunction parameter passed to this function!
//Returns whether to continue on with the rest of the function (true) or return out of it immediately (false).
window.RateLimitRecall = function({ callingFunction, minimumInterval, thisToBind, paramsToPass }) {
    //Get the current ticks.
    let currentTicks = performance.now();

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

    //Update paramsToPass.
    currentGuard.paramsToPass = paramsToPass;

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
};

//Bind an object of functions to a particular class, as if the functions belonged to it.
//Call this in the class's constructor.
window.BindToClass = function(functionsObject, thisClass) {
    for (let [ functionKey, functionValue ] of Object.entries(functionsObject)) {
        thisClass[functionKey] = functionValue.bind(thisClass);
    }
};

window.LerpBorderWaveLine = function({ context, startX, startY, endX, endY, lineCount,
    waveFrequency, horizontalWaveAmplitude, verticalWaveAmplitude, waveRandomness
}) {
    context.beginPath();
    context.moveTo(startX, startY);
    let lerpInterval = 1.0 / lineCount;
    let oneMinus;
    for (let lerpRatio = 0.0; lerpRatio <= 1.0; lerpRatio += lerpInterval) {
        oneMinus = 1.0 - lerpRatio;
        context.lineTo(
            oneMinus * startX + lerpRatio * endX +
                Math.sin(waveFrequency * lerpRatio + Math.random() * waveRandomness) * verticalWaveAmplitude,
            oneMinus * startY + lerpRatio * endY +
                Math.sin(waveFrequency * lerpRatio + Math.random() * waveRandomness) * horizontalWaveAmplitude
        );
    }
    context.stroke();
};
window.CreateCanvasTexture = function({ width, height, color, borderColor, colorVariances, colorSubtractions,
    lineCount, lengthVariance, lengthAddition,
    borderLineWidth, waveFrequency, waveAmplitude, waveRandomness, borderFlags }) {
    let context = document.createElement('canvas').getContext('2d');
    context.canvas.width = width;
    context.canvas.height = height;
    context.fillStyle = '#' + color.getHexString();
    context.fillRect(0, 0, width, height);
    let imageData = context.getImageData(0, 0, width, height);
    let data = imageData.data;
    for (let lineIndex = 0; lineIndex < lineCount; ++lineIndex) {
        let x = Math.random() * width;
        let y = Math.random() * height;
        let direction = Math.random() * DoublePI;
        let length = Math.random() * lengthVariance + lengthAddition;
        let redDifference = Math.round(Math.random() * colorVariances.red - colorSubtractions.red);
        let greenDifference = Math.round(Math.random() * colorVariances.green - colorSubtractions.green);
        let blueDifference = Math.round(Math.random() * colorVariances.blue - colorSubtractions.blue);
        for (let pixelIndex = 0; pixelIndex < length; ++pixelIndex) {
            let currentX = Math.floor(x + Math.cos(direction) * pixelIndex);
            if (currentX < 0.0) {
                currentX += width;
            } else if (currentX >= width) {
                currentX -= width;
            }
            let currentY = Math.floor(y + Math.sin(direction) * pixelIndex);
            if (currentY < 0.0) {
                currentY += height;
            } else if (currentX >= height) {
                currentY -= height;
            }
            let currentOffset = currentY * width * 4 + currentX * 4;
            data[currentOffset] += redDifference;
            data[currentOffset + 1] += greenDifference;
            data[currentOffset + 2] += blueDifference;
        }
    }
    context.putImageData(imageData, 0, 0);
    context.strokeStyle = '#' + borderColor.getHexString();
    context.lineWidth = borderLineWidth;
    if (HasFlag({ borderFlags, testFlag: 1 })) {
        LerpBorderWaveLine({
            context, startX: 0.0, startY: 0.0,
            endX: width, endY: 0.0, lineCount: width,
            waveFrequency, horizontalWaveAmplitude: waveAmplitude, verticalWaveAmplitude: 0.0, waveRandomness
        });
    }
    if (HasFlag({ borderFlags, testFlag: 2 })) {
        LerpBorderWaveLine({
            context, startX: width, startY: 0.0,
            endX: width, endY: height, lineCount: height,
            waveFrequency, horizontalWaveAmplitude: 0.0, verticalWaveAmplitude: waveAmplitude, waveRandomness
        });
    }
    if (HasFlag({ borderFlags, testFlag: 4 })) {
        LerpBorderWaveLine({
            context, startX: width, startY: height,
            endX: 0.0, endY: height, lineCount: width,
            waveFrequency, horizontalWaveAmplitude: waveAmplitude, verticalWaveAmplitude: 0.0, waveRandomness
        });
    }
    if (HasFlag({ borderFlags, testFlag: 8 })) {
        LerpBorderWaveLine({
            context, startX: 0.0, startY: height,
            endX: 0.0, endY: 0.0, lineCount: height,
            waveFrequency, horizontalWaveAmplitude: 0.0, verticalWaveAmplitude: waveAmplitude, waveRandomness
        });
    }
    // document.body.prepend(context.canvas);
    let canvasTexture = new THREE.CanvasTexture(context.canvas);
    return canvasTexture;
};
window.MapMaterials = [];
{
    let grassBorderColor = GrassColor.clone().multiplyScalar(0.4);
    for (let borderFlags = 0; borderFlags < 16; ++borderFlags) {
        MapMaterials.push(new THREE.MeshPhongMaterial({
            map: CreateCanvasTexture({
                width: 256, height: 256,
                color: GrassColor,
                borderColor: grassBorderColor,
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
                lineCount: 5000, lengthVariance: 14.0, lengthAddition: 1.0, borderLineWidth: 40.0,
                waveFrequency: 100.0, waveAmplitude: 1.0, waveRandomness: 1.5, borderFlags
            }),
            shininess: 10
        }));
    }
    MapMaterials.push(new THREE.MeshBasicMaterial({
        color: DirtColor,
        side: THREE.DoubleSide
    }));
}