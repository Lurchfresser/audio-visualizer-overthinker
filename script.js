"use strict";
const container = document.querySelector('#container');
const canvas = document.getElementById('canvas');
const voicecheckBox = document.getElementById('voicecheckBox');
const intrumentalcheckBox = document.getElementById('instrumentalcheckBox');
const voiceAudioElement = document.getElementById('voice');
const fullAudioElement = document.querySelector('#full');
const instrumentalAudioElement = document.querySelector('#instrumental');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// ---- dev setup ----
// const starttime = 120;
// fullAudioElement.currentTime = starttime;
// voiceAudioElement.currentTime = starttime;
// fullAudioElement.play();
// voiceAudioElement.play();
//instrumentalAudioElement.play();
// ---- dev setup ----
// ---- voice setup ----
let voiceAudioCtx = new AudioContext();
let voiceAudioSource = voiceAudioCtx.createMediaElementSource(voiceAudioElement);
voiceAudioSource.connect(voiceAudioCtx.destination);
let voiceAnalyser = voiceAudioCtx.createAnalyser();
voiceAnalyser.fftSize = 64;
voiceAudioSource.connect(voiceAnalyser);
// ---- instrumental setup ----
let instrumentalAudioCtx = new AudioContext();
let instrumentalAudioSource = instrumentalAudioCtx.createMediaElementSource(instrumentalAudioElement);
instrumentalAudioSource.connect(instrumentalAudioCtx.destination);
let instrumentalAnalyser = instrumentalAudioCtx.createAnalyser();
instrumentalAnalyser.fftSize = 256;
instrumentalAudioSource.connect(instrumentalAnalyser);
const drawCtx = canvas.getContext('2d');
function animate() {
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    const voiceDataArray = new Uint8Array(voiceAnalyser.frequencyBinCount);
    const instrumentalDataArray = new Uint8Array(instrumentalAnalyser.frequencyBinCount);
    voiceAnalyser.getByteFrequencyData(voiceDataArray);
    instrumentalAnalyser.getByteFrequencyData(instrumentalDataArray);
    if (!voiceAudioElement.paused) {
        animateVoice(voiceDataArray);
    }
    if (!instrumentalAudioElement.paused) {
        animateColorBars(instrumentalDataArray);
        let oscilloscopeDataArray = new Uint8Array(instrumentalAnalyser.fftSize);
        instrumentalAnalyser.getByteTimeDomainData(oscilloscopeDataArray);
        drawOscilloscope(oscilloscopeDataArray);
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
        let barHeight;
        barHeight = dataArray[i];
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;
        drawCtx.fillStyle = `rgb(${r},${g},${b})`;
        drawCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth;
    }
}
voiceAudioElement.addEventListener('play', () => {
    animate();
});
instrumentalAudioElement.addEventListener('play', () => {
    animate();
});
fullAudioElement.addEventListener('play', () => {
    voiceAudioElement.play();
    instrumentalAudioElement.play();
});
fullAudioElement.addEventListener('pause', () => {
    voiceAudioElement.pause();
    instrumentalAudioElement.pause();
});
//! is useful if u want to switch the time for debugging
// audioElement.addEventListener('timeupdate', () => {
//    voiceAudioElement.currentTime = audioElement.currentTime;
// });
voicecheckBox.addEventListener('change', () => toggleAudio());
intrumentalcheckBox.addEventListener('change', () => toggleAudio());
function toggleAudio() {
    if (intrumentalcheckBox.checked) {
        instrumentalAudioSource.connect(instrumentalAudioCtx.destination);
    }
    else {
        instrumentalAudioSource.disconnect(instrumentalAudioCtx.destination);
    }
    if (voicecheckBox.checked) {
        voiceAudioSource.connect(voiceAudioCtx.destination);
    }
    else {
        voiceAudioSource.disconnect(voiceAudioCtx.destination);
    }
}
