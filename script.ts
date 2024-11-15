const container = document.querySelector('#container') as HTMLDivElement;
const canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const checkBox = document.getElementById('fakeVolume') as HTMLInputElement;

checkBox.addEventListener('change', () => {
    if (checkBox.checked) {
        voiceAudioSource.connect(voiceAudioCtx.destination);
    } else {
        voiceAudioSource.disconnect(voiceAudioCtx.destination);
    }
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drawCtx = canvas.getContext('2d') as CanvasRenderingContext2D;





const audioElement : HTMLAudioElement = document.querySelector('#full') as HTMLAudioElement;


let voiceAudioElement = document.getElementById('voice') as HTMLAudioElement;
let voiceAudioCtx = new AudioContext();

let voiceAudioSource = voiceAudioCtx.createMediaElementSource(voiceAudioElement);
voiceAudioSource.connect(voiceAudioCtx.destination);
let voiceAnalyser = voiceAudioCtx.createAnalyser();
//TODO: Try different values
voiceAnalyser.fftSize = 256;


voiceAudioSource.connect(voiceAnalyser);


voiceAudioElement.addEventListener('play', () => {
   animate();
});

audioElement.addEventListener('play', () => {
    voiceAudioElement.play();
});
audioElement.addEventListener('pause', () => {
    voiceAudioElement.pause();
});
//! is useful if u want to switch the time for debugging
// audioElement.addEventListener('timeupdate', () => {
//     voiceAudioElement.currentTime = audioElement.currentTime;
// });

const bufferLength = voiceAnalyser.frequencyBinCount;

function animate() {
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = canvas.width / bufferLength;
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (voiceAudioElement.paused) {
        return;
    }
    voiceAnalyser.getByteFrequencyData(dataArray);
    let x = 0;
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
    requestAnimationFrame(animate);

}
