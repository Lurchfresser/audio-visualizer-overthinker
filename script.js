"use strict";
const container = document.querySelector('#container');
const canvas = document.getElementById('canvas');
const voicecheckBox = document.getElementById('voicecheckBox');
const intrumentalcheckBox = document.getElementById('instrumentalcheckBox');
const fullAudioElement = document.querySelector('#full');
const voiceAudioElement = document.getElementById('voice');
const instrumentalAudioElement = document.querySelector('#instrumental');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// ---- dev setup ----
// const starttime = 120;
// fullAudioElement.currentTime = starttime;
// voiceAudioElement.currentTime = starttime;
fullAudioElement.play();
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
let voiceAudioCtx = new AudioContext({
//TODO: check if this is useful
//"latencyHint": "interactive",
});
let voiceAudioSource = voiceAudioCtx.createMediaElementSource(voiceAudioElement);
let voiceAnalyser = voiceAudioCtx.createAnalyser();
let isVoicePlaying = true;
voiceAudioSource.connect(voiceAudioCtx.destination);
voiceAudioSource.connect(voiceAnalyser);
// ---- instrumental setup ----
let instrumentalAudioCtx = new AudioContext();
let instrumentalAudioSource = instrumentalAudioCtx.createMediaElementSource(instrumentalAudioElement);
let instrumentalAnalyserForBars = instrumentalAudioCtx.createAnalyser();
let instrumentalAnalyserForOscilloscope = instrumentalAudioCtx.createAnalyser();
let isInstrumentalPlaying = true;
instrumentalAudioSource.connect(instrumentalAudioCtx.destination);
instrumentalAudioSource.connect(instrumentalAnalyserForBars);
instrumentalAudioSource.connect(instrumentalAnalyserForOscilloscope);
// ---- set params ----
instrumentalAnalyserForBars.maxDecibels = -10;
instrumentalAnalyserForBars.minDecibels = -70;
instrumentalAnalyserForBars.fftSize = 128;
instrumentalAnalyserForBars.smoothingTimeConstant = 0.85;
instrumentalAnalyserForOscilloscope.fftSize = 2048;
instrumentalAnalyserForOscilloscope.smoothingTimeConstant = 0.99;
fullLeftAnalyser.fftSize = 32;
fullRightAnalyser.fftSize = 32;
voiceAnalyser.fftSize = 64;
const drawCtx = canvas.getContext('2d');
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
        animateLeftRigthDifference(fullLeftAnalyser, fullRightAnalyser);
    }
    requestAnimationFrame(animate);
}
function drawOscilloscope(dataArray) {
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
        }
        else {
            drawCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    drawCtx.lineTo(WIDTH, HEIGHT / 2);
    drawCtx.stroke();
}
function animateVoice(voiceDataArray) {
    const bufferLength = voiceDataArray.length;
    const barWidth = canvas.width / bufferLength / 2;
    let middleX = canvas.width / 2;
    let middleY = canvas.height * 1 / 3;
    let jiDistance = 10;
    for (let j = jiDistance; j < bufferLength; j++) {
        let i = j - jiDistance;
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
function animateColorBars(dataArray) {
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
function animateLeftRigthDifference(leftNode, rightNode) {
    let leftDataArray = new Uint8Array(leftNode.frequencyBinCount);
    let rightDataArray = new Uint8Array(rightNode.frequencyBinCount);
    leftNode.getByteFrequencyData(leftDataArray);
    rightNode.getByteFrequencyData(rightDataArray);
    let difference = getVolumeDifference(leftDataArray, rightDataArray);
    drawCtx.fillStyle = 'white';
    drawCtx.strokeStyle = 'white';
    let middleYX = canvas.width / 2;
    let middleYY = canvas.height / 2;
    drawCtx.fillRect(middleYX, 10, difference, 150);
    drawCtx.rect(middleYX - difference, middleYY - 50, difference * 2, 100);
}
/// ---- util functions ----
function getVolume(dataArray) {
    let volume = 0;
    for (let i = 0; i < dataArray.length; i++) {
        volume += dataArray[i];
    }
    return volume / dataArray.length;
}
function getVolumeDifference(dataArray1, dataArray2) {
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
    voiceAudioElement.play();
    instrumentalAudioElement.play();
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
    }
    else if (!intrumentalcheckBox.checked && isInstrumentalPlaying) {
        isInstrumentalPlaying = false;
        instrumentalAudioSource.disconnect(instrumentalAudioCtx.destination);
    }
    console.log(isInstrumentalPlaying);
    if (voicecheckBox.checked && !isVoicePlaying) {
        isVoicePlaying = true;
        voiceAudioSource.connect(voiceAudioCtx.destination);
    }
    else if (!voicecheckBox.checked && isVoicePlaying) {
        isVoicePlaying = false;
        voiceAudioSource.disconnect(voiceAudioCtx.destination);
    }
}
toggleAudio();
