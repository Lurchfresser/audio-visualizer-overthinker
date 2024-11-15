const container = document.querySelector('#container') as HTMLDivElement;
const canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const checkBox = document.getElementById('fakeVolume') as HTMLInputElement;

checkBox.addEventListener('change', () => {
    if (checkBox.checked) {
        // @ts-ignore
        //fakeAudioElement.destination = audioElement.destination;
        // fakeAudioElement.destination = fakeAnalyser.destination;
    } else {
        // @ts-ignore
        // fakeAudioElement.destination = fakeAudioCtx.destination;
        //fakeAudioElement.destination = fakeAnalyser.destination;
    }
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drawCtx = canvas.getContext('2d') as CanvasRenderingContext2D;





const audioElement : HTMLAudioElement = document.querySelector('#audio') as HTMLAudioElement;


let fakeAudioElement = document.getElementById('fakeAudio') as HTMLAudioElement;
let fakeAudioCtx = new AudioContext();

let fakeAudioSource = fakeAudioCtx.createMediaElementSource(fakeAudioElement);
let fakeAnalyser = fakeAudioCtx.createAnalyser();
//TODO: Try different values
fakeAnalyser.fftSize = 256;


fakeAudioSource.connect(fakeAnalyser);


fakeAudioElement.addEventListener('play', () => {
   animate();
});

audioElement.addEventListener('play', () => {
    fakeAudioElement.play();
});
audioElement.addEventListener('pause', () => {
    fakeAudioElement.pause();
});
//! is useful if u want to switch the time for debugging
// audioElement.addEventListener('timeupdate', () => {
//     fakeAudioElement.currentTime = audioElement.currentTime;
// });

const bufferLength = fakeAnalyser.frequencyBinCount;

function animate() {
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = canvas.width / bufferLength;
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (fakeAudioElement.paused) {
        return;
    }
    fakeAnalyser.getByteFrequencyData(dataArray);
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
