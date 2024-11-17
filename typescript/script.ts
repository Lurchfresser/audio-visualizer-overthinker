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
const starttime = 60;
fullAudioElement.currentTime = starttime;
voiceAudioElement.currentTime = starttime;
instrumentalAudioElement.currentTime = starttime;



//fullAudioElement.play();
instrumentalAudioElement.play();

// voiceAudioElement.play();
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

instrumentalAnalyserForRings.fftSize = 32;
instrumentalAnalyserForRings.smoothingTimeConstant = 0.85;


instrumentalAnalyserForOscilloscope.fftSize = 2048;
instrumentalAnalyserForOscilloscope.smoothingTimeConstant = 0.99;


voiceAnalyser.fftSize = 64;


const drawCtx = canvas.getContext('2d') as CanvasRenderingContext2D;


function animate() {
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);


    const voiceDataArray = new Uint8Array(voiceAnalyser.frequencyBinCount);
    const instrumentalDataArray = new Uint8Array(instrumentalAnalyserForBars.frequencyBinCount);
    voiceAnalyser.getByteFrequencyData(voiceDataArray);
    instrumentalAnalyserForBars.getByteFrequencyData(instrumentalDataArray);
    if (!voiceAudioElement.paused) {
        animateVoice(voiceDataArray);
    }
    if (!instrumentalAudioElement.paused) {
        animateColorBars(instrumentalDataArray);
        let oscilloscopeDataArray = new Uint8Array(instrumentalAnalyserForBars.fftSize);
        instrumentalAnalyserForOscilloscope.getByteTimeDomainData(oscilloscopeDataArray);
        drawOscilloscope(oscilloscopeDataArray);
        let ringsDataArray = new Uint8Array(instrumentalAnalyserForRings.fftSize);
        instrumentalAnalyserForRings.getByteFrequencyData(ringsDataArray);
        animateColorCircles(ringsDataArray);
    }
    if (!fullAudioElement.paused) {
        animateLeftRigthDifference(fullLeftAnalyser, fullRightAnalyser);
    }
    requestAnimationFrame(animate);
}


function drawOscilloscope(dataArray: Uint8Array) {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

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
}

function animateVoice(voiceDataArray: Uint8Array) {
    const bufferLength = voiceDataArray.length;
    const barWidth = canvas.width / bufferLength / 2;
    let middleX = canvas.width / 2;
    let middleY = canvas.height * 1 / 3;

    let jiDistance = 10;
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
        drawCtx.moveTo(middleX - barWidth * i * 1.4, middleY + barHeight / 2);
        drawCtx.lineTo(middleX - barWidth * i * 1.4, middleY - barHeight / 2);
        drawCtx.stroke();

        drawCtx.beginPath();
        drawCtx.moveTo(middleX + barWidth * i * 1.4, middleY + barHeight / 2);
        drawCtx.lineTo(middleX + barWidth * i * 1.4, middleY - barHeight / 2);
        drawCtx.stroke();
    }
}

function animateColorCircles(dataArray: Uint8Array) {
    let x = 0;
    const bufferLength = dataArray.length;
    const barWidth = canvas.width / bufferLength;
    let weightedBarArray = new Uint8Array(bufferLength);
    let weightedSum = 0;
    for (let i = 0; i < bufferLength; i++) {
        let weightedBarHeight = dataArray[i] * i * 0.7;
        weightedBarArray[i] = weightedBarHeight;
        weightedSum += weightedBarHeight;
    }



    for (let i = 0; i < bufferLength; i++) {
        let barHeight = weightedBarArray[i];
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;
        drawCtx.fillStyle = `rgb(${r},${g},${b})`;
        const numberOfBars = Math.log(i + 1) * 1;
        for (let degree = 0; degree < 360; degree+=20) {
            drawCtx.save();
            drawCtx.translate(canvas.height / 2, canvas.width / 2);
            drawCtx.rotate(degree * Math.PI / 180 * new Date().getMilliseconds() / 500);
            drawCtx.fillRect(150, 0, 10, barHeight);
            drawCtx.restore();
        }
        //drawCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
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
    console.log(isInstrumentalPlaying);
    if (intrumentalcheckBox.checked && !isInstrumentalPlaying) {
        isInstrumentalPlaying = true;
        instrumentalAudioSource.connect(instrumentalAudioCtx.destination);
    } else if (!intrumentalcheckBox.checked && isInstrumentalPlaying) {
        isInstrumentalPlaying = false;
        instrumentalAudioSource.disconnect(instrumentalAudioCtx.destination);
    }
    console.log(isInstrumentalPlaying);
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