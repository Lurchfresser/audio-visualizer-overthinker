const container = document.querySelector('#container') as HTMLDivElement;
const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const voicecheckBox = document.getElementById('voicecheckBox') as HTMLInputElement;
const intrumentalcheckBox = document.getElementById('instrumentalcheckBox') as HTMLInputElement;

const fullAudioElement: HTMLAudioElement = document.querySelector('#full') as HTMLAudioElement;
const voiceAudioElement = document.getElementById('voice') as HTMLAudioElement;
const instrumentalAudioElement: HTMLAudioElement = document.querySelector('#instrumental') as HTMLAudioElement;


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// ---- dev setup ----
const starttime = 0;
fullAudioElement.currentTime = starttime;
voiceAudioElement.currentTime = starttime;
instrumentalAudioElement.currentTime = starttime;



fullAudioElement.play();
instrumentalAudioElement.play();
voiceAudioElement.play();
//instrumentalAudioElement.play();
// ---- dev setup ----




// ---- full audio setup ----
let fullAudioCtx = new AudioContext();
let fullAudioSource = fullAudioCtx.createMediaElementSource(fullAudioElement);
let fullLeftAnalyser = fullAudioCtx.createAnalyser();
let fullRightAnalyser = fullAudioCtx.createAnalyser();
let fullChannelSplitter = fullAudioCtx.createChannelSplitter(2);

fullAudioSource.connect(fullAudioCtx.destination);
fullAudioSource.connect(fullChannelSplitter);

fullChannelSplitter.connect(fullLeftAnalyser, 0);
fullChannelSplitter.connect(fullRightAnalyser, 1);




// ---- voice setup ----
let voiceAudioCtx = new AudioContext(
    {
        //TODO: check if this is useful
        //"latencyHint": "interactive",
    }
);
let voiceAudioSource = voiceAudioCtx.createMediaElementSource(voiceAudioElement);
let voiceAnalyser = voiceAudioCtx.createAnalyser();

let isVoicePlaying: boolean = true;
voiceAudioSource.connect(voiceAudioCtx.destination);

voiceAudioSource.connect(voiceAnalyser);



// ---- instrumental setup ----
let instrumentalAudioCtx = new AudioContext();
let instrumentalAudioSource = instrumentalAudioCtx.createMediaElementSource(instrumentalAudioElement);
let instrumentalAnalyserForBars: AnalyserNode = instrumentalAudioCtx.createAnalyser();
let instrumentalAnalyserForOscilloscope: AnalyserNode = instrumentalAudioCtx.createAnalyser();
let instrumentalAnalyserForRings: AnalyserNode = instrumentalAudioCtx.createAnalyser();

let isInstrumentalPlaying: boolean = true;
instrumentalAudioSource.connect(instrumentalAudioCtx.destination);

instrumentalAudioSource.connect(instrumentalAnalyserForBars);
instrumentalAudioSource.connect(instrumentalAnalyserForOscilloscope);
instrumentalAudioSource.connect(instrumentalAnalyserForRings);








// ---- set params ----
instrumentalAnalyserForBars.maxDecibels = -10;
instrumentalAnalyserForBars.minDecibels = -70;


instrumentalAnalyserForBars.fftSize = 128;
instrumentalAnalyserForBars.smoothingTimeConstant = 0.85;



instrumentalAnalyserForOscilloscope.fftSize = 2048;
instrumentalAnalyserForOscilloscope.smoothingTimeConstant = 0.8;


voiceAnalyser.fftSize = 64;


const drawCtx = canvas.getContext('2d') as CanvasRenderingContext2D;

let oscilloscopeNoise = 0;
function animate() {
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);


    const voiceDataArray = new Uint8Array(voiceAnalyser.frequencyBinCount);
    const instrumentalDataArray = new Uint8Array(instrumentalAnalyserForBars.frequencyBinCount);
    voiceAnalyser.getByteFrequencyData(voiceDataArray);
    instrumentalAnalyserForBars.getByteFrequencyData(instrumentalDataArray);
    //!order is important
    if (!instrumentalAudioElement.paused) {
        //animateColorBars(instrumentalDataArray);
        let oscilloscopeDataArray = new Uint8Array(instrumentalAnalyserForBars.fftSize);
        instrumentalAnalyserForOscilloscope.getByteTimeDomainData(oscilloscopeDataArray);
        animateOscilloscope(oscilloscopeDataArray);
        let ringsDataArray = new Uint8Array(instrumentalAnalyserForRings.fftSize);
        instrumentalAnalyserForRings.getByteFrequencyData(ringsDataArray);
        animateColorCircles(ringsDataArray);
        let spectralFlatnessArray = new Float32Array(instrumentalAnalyserForRings.fftSize);
        instrumentalAnalyserForRings.getFloatFrequencyData(spectralFlatnessArray);
        let spectralFlatness = calculateSpectralFlatness(spectralFlatnessArray);
        //console.log(spectralFlatness);
    }
    if (!voiceAudioElement.paused) {
        animateVoice(voiceDataArray);
    }
    if (!fullAudioElement.paused) {
        //animateLeftRigthDifference(fullLeftAnalyser, fullRightAnalyser);
    }
    requestAnimationFrame(animate);
}


function animateOscilloscope(dataArray: Uint8Array) {
    drawCtx.save();
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    drawCtx.translate(0, 0);

    const bufferLength = dataArray.length;

    drawCtx.lineWidth = 2;
    drawCtx.strokeStyle = "rgb(0, 0, 0)";

    const sliceWidth = WIDTH / bufferLength;
    let x = 0;

    drawCtx.strokeStyle = 'white';
    drawCtx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
            drawCtx.moveTo(x, y);
        } else {
            drawCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    drawCtx.lineTo(WIDTH, HEIGHT / 2);
    drawCtx.stroke();
    drawCtx.restore();
}

function animateVoice(voiceDataArray: Uint8Array) {
    const bufferLength = voiceDataArray.length;
    const barWidth = canvas.width / bufferLength / 2;
    let middleX = canvas.width / 2;
    let middleY = canvas.height * 1 / 3;
    let jiDistance = 10;
    drawCtx.save();
    drawCtx.translate(canvas.width / 2, canvas.height / 2);
    drawCtx.scale(0.18, 0.2);
    for (let j = jiDistance; j < bufferLength; j++) {
        let i = j - jiDistance
        let barHeight;
        barHeight = voiceDataArray[i];
        barHeight -= 100;
        drawCtx.strokeStyle = `white`;
        drawCtx.lineWidth = barWidth; // Set the thickness of the lines
        drawCtx.lineCap = 'round'; // Set the line cap to round


        if (barHeight < 30) {
            continue;
        }
        drawCtx.beginPath();
        drawCtx.moveTo(- barWidth * i * 1.4, + barHeight / 2);
        drawCtx.lineTo(- barWidth * i * 1.4, - barHeight / 2);
        drawCtx.stroke();

        drawCtx.beginPath();
        drawCtx.moveTo(+ barWidth * i * 1.4, + barHeight / 2);
        drawCtx.lineTo(+ barWidth * i * 1.4, - barHeight / 2);
        drawCtx.stroke();
    }
    drawCtx.restore();
}


instrumentalAnalyserForRings.maxDecibels = -10;
instrumentalAnalyserForRings.minDecibels = -70;

instrumentalAnalyserForRings.fftSize = 32;
instrumentalAnalyserForRings.smoothingTimeConstant = 0.9;
const smoothedArray = new Uint8Array(instrumentalAnalyserForRings.fftSize);
const startDegreesLastUpdate = new Array(instrumentalAnalyserForRings.fftSize).fill(0);
let timeLastUpdate = new Date().getTime();

//measured
const maxWeightedValue = 1128.6000000000001;
const maxWeightedSum = 7947.000000000001;
let minY = 125.5;

function animateColorCircles(dataArray: Uint8Array) {
    let x = 0;
    const bufferLength = dataArray.length;
    const barWidth = canvas.width / bufferLength;
    let weightedBarArray = new Uint8Array(bufferLength);
    let weightedSum = 0;
    let currentTime = new Date().getTime();
    for (let i = 0; i < bufferLength; i++) {
        //! if this changes, also remeasure maxWeightedValue
        let weightedBarHeight = dataArray[i] * i * 0.9;
        weightedBarArray[i] = weightedBarHeight;

        weightedSum += weightedBarHeight;

        // if (weightedBarHeight < 30) {
        //     smoothedArray[i] = 0;
        // }
        //  else
        const barrierValue = 70;
        const vanishingValue = 0;
        if (weightedBarHeight > barrierValue && smoothedArray[i] < weightedBarHeight) {
            smoothedArray[i] = Math.min(weightedBarHeight, 10 + smoothedArray[i]);
        } else {
            let newValue = smoothedArray[i] - 3;
            if (newValue > vanishingValue) {
                smoothedArray[i] = Math.max(0, newValue);
            } else {
                smoothedArray[i] = 0;
            }
        }
    }        //fill the middle circle black
    drawCtx.fillStyle = 'black';
    drawCtx.beginPath();
    drawCtx.arc(canvas.width / 2, canvas.height / 2, minY, 0, 2 * Math.PI);
    drawCtx.fill();

    drawCtx.save();
    drawCtx.translate(canvas.width / 2, canvas.height / 2);
    for (let i = bufferLength - 1; i >= 0; i--) {
        let barHeight = smoothedArray[i] / 2;
        if (barHeight < 1) {
            continue;
        }
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;
        drawCtx.fillStyle = `rgb(${r},${g},${b})`;
        drawCtx.strokeStyle = `rgb(${r},${g},${b})`;
        drawCtx.lineCap = 'round';

        drawCtx.lineWidth = 3;
        if (i > 6) {
            drawCircle(0, 0, weightedBarArray[i] / 10 + 100 + i * 25 + 50);
        }

        const strokeWidth = map(barHeight, 0, 300, 3, 40);
        drawCtx.lineWidth = strokeWidth;

        for (let degree = 0; degree < 360; degree += 15) {
            let direction = ((i % 2 == 0) ? -1 : 1);
            let timeInfluence = map((barHeight ^ 3), 0, maxWeightedValue, 0, (currentTime - timeLastUpdate) / 40);
            startDegreesLastUpdate[i] = ((timeInfluence * direction) + startDegreesLastUpdate[i]) % 360;
            if (timeInfluence < 0) {
                console.log(timeInfluence);
            }
            let radiant = degreeToRadiant(startDegreesLastUpdate[i] + degree);
            drawCtx.save();
            drawCtx.rotate(radiant);
            drawCtx.beginPath();
            console.log(minY);
            drawCtx.moveTo(0, barHeight / 10 + 100 + i * 25);
            drawCtx.lineTo(100 * direction, barHeight / 10 + 100 + i * 13);

            drawCtx.stroke();


            drawCtx.restore();
        }
        //drawCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
    timeLastUpdate = currentTime;
    drawCtx.restore();
}


function animateColorBars(dataArray: Uint8Array) {
    let x = 0;
    const bufferLength = dataArray.length;
    const barWidth = canvas.width / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] * i * 0.2;
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;
        drawCtx.fillStyle = `rgb(${r},${g},${b})`;
        drawCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}

fullLeftAnalyser.fftSize = 1024;
fullRightAnalyser.fftSize = 1024;


let stereoCircleDrawElements: StereoCircleDrawElement[] = [];
let differenceAvverage = 0;

function animateLeftRigthDifference(leftNode: AnalyserNode, rightNode: AnalyserNode) {
    let leftDataArray = new Uint8Array(leftNode.frequencyBinCount);
    let rightDataArray = new Uint8Array(rightNode.frequencyBinCount);

    leftNode.getByteFrequencyData(leftDataArray);
    rightNode.getByteFrequencyData(rightDataArray);

    let difference = getVolumeDifference(leftDataArray, rightDataArray);
    if (Math.abs(difference) > 500) {

        drawCtx.fillStyle = 'white';
        drawCtx.strokeStyle = 'white';


        let middleYX = canvas.width / 2;
        let middleYY = canvas.height / 2;

        drawCtx.fillRect(middleYX, 10, difference / 15, 150);

    }



    // ---  circles ---
    if (Math.abs(difference) > 100) {
        stereoCircleDrawElements.push(new StereoCircleDrawElement(difference > 0));
    }
    for (let i = 0; i < stereoCircleDrawElements.length; i++) {
        if (stereoCircleDrawElements[i].draw()) {
            stereoCircleDrawElements.splice(i, 1);
            i--;
        }
    }
}




/// ---- util functions ----


function getVolume(dataArray: Uint8Array) {
    let volume = 0;
    for (let i = 0; i < dataArray.length; i++) {
        volume += dataArray[i];
    }
    return volume / dataArray.length;
}

function getVolumeDifference(dataArray1: Uint8Array, dataArray2: Uint8Array) {
    if (dataArray1.length !== dataArray2.length) {
        throw new Error('dataArray1 and dataArray2 must have the same length');
    }
    let difference = 0;
    for (let i = 0; i < dataArray1.length; i++) {
        difference -= dataArray1[i];
        difference += dataArray2[i];
    }
    return difference;
}



/// ---- event listeners ----

voiceAudioElement.addEventListener('play', () => {
    animate();
});
instrumentalAudioElement.addEventListener('play', () => {
    animate();
});

fullAudioElement.addEventListener('play', () => {
    animate();
    // voiceAudioElement.play();
    // instrumentalAudioElement.play();
});
fullAudioElement.addEventListener('pause', () => {
    voiceAudioElement.pause();
    instrumentalAudioElement.pause();

});
//! is useful if u want to switch the time for debugging
fullAudioElement.addEventListener('timeupdate', () => {
    //    voiceAudioElement.currentTime = fullAudioElement.currentTime;
    //     instrumentalAudioElement.currentTime = fullAudioElement.currentTime;
});

voicecheckBox.addEventListener('change', () => toggleAudio());

intrumentalcheckBox.addEventListener('change', () => toggleAudio());

function toggleAudio() {
    if (intrumentalcheckBox.checked && !isInstrumentalPlaying) {
        isInstrumentalPlaying = true;
        instrumentalAudioSource.connect(instrumentalAudioCtx.destination);
    } else if (!intrumentalcheckBox.checked && isInstrumentalPlaying) {
        isInstrumentalPlaying = false;
        instrumentalAudioSource.disconnect(instrumentalAudioCtx.destination);
    }
    if (voicecheckBox.checked && !isVoicePlaying) {
        isVoicePlaying = true;
        voiceAudioSource.connect(voiceAudioCtx.destination);
    } else if (!voicecheckBox.checked && isVoicePlaying) {
        isVoicePlaying = false;
        voiceAudioSource.disconnect(voiceAudioCtx.destination);
    }
}

toggleAudio();



class StereoCircleDrawElement {
    private isLeft: boolean;

    private isFading: boolean = false;
    private isDone: boolean = false;

    private size: number = 0;
    constructor(isLeft: boolean) {
        this.isLeft = isLeft;
    }
    draw(): boolean {
        if (this.isFading) {
            this.size -= 20;
        } else {
            this.size += 20;
        }
        this.isFading = this.size > 100;
        this.isDone = this.size < 0;
        if (this.isDone) {
            return true;
        }

        let middleY = canvas.height / 2;
        drawCtx.beginPath();
        drawCtx.arc(this.isLeft ? 0 : canvas.width, middleY, this.size, 0, 2 * Math.PI);
        drawCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Set the fill color with 50% opacity
        drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Set the fill color with 50% opacity
        drawCtx.fill(); // Fill the circle
        drawCtx.stroke(); // Optionally, you can still stroke the circle outline
        return false;
    }
}


// ---- util functions ----

function map(value: number, min1: number, max1: number, min2: number, max2: number) {
    return Math.min(max2, Math.max(min2, min2 + (value - min1) * (max2 - min2) / (max1 - min1)));
}


function drawCircle(x: number, y: number, radius: number) {
    drawCtx.beginPath();
    drawCtx.arc(x, y, radius, 0, 2 * Math.PI);
    drawCtx.stroke();
}

function degreeToRadiant(degree: number) {
    return degree * Math.PI / 180;
}


function calculateSpectralFlatness(frequencyData: Float32Array): number {
    // Step 1: Filter out -Infinity values and convert dB to linear scale
    const linearMagnitudes: number[] = [];
    for (let i = 0; i < frequencyData.length; i++) {
        const dbValue = frequencyData[i];
        if (dbValue > -Infinity) {
            // Convert dB to linear scale
            linearMagnitudes.push(Math.pow(10, dbValue / 10));
        }
    }

    // Step 2: Calculate geometric mean
    let product = 1;
    const n = linearMagnitudes.length;
    for (let i = 0; i < n; i++) {
        product *= linearMagnitudes[i];
    }
    const geometricMean = Math.pow(product, 1 / n);

    // Step 3: Calculate arithmetic mean
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += linearMagnitudes[i];
    }
    const arithmeticMean = sum / n;

    // Step 4: Calculate spectral flatness as the ratio of geometric mean to arithmetic mean
    return geometricMean / arithmeticMean;
}
