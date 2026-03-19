const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const title = document.getElementById('title');
const playlistElement = document.getElementById('playlist');
const cover = document.getElementById('cover');
const bgOverlay = document.getElementById('bg-overlay');
const fileUpload = document.getElementById('file-upload');
const backwardBtn = document.getElementById('backward');
const forwardBtn = document.getElementById('forward');

const libWindow = document.getElementById('library-window');
const openLibBtn = document.getElementById('toggle-lib-btn');
const closeLibBtn = document.getElementById('close-lib');

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/461/461238.png";
let songIndex = 0;
let songs = [
 { name: 'pal pal', url: 'songs/Afusic - Pal Pal (Official Music Video) Prod. _AliSoomroMusic(MP3_160K).mp3', cover: '' },
 { name: 'company', url: 'songs/EMIWAY_-_COMPANY_(OFFICIAL_MUSIC_VIDEO)(256k).mp3', cover: '' },
 { name: 'Die With A Smile', url: 'songs/Lady Gaga_ Bruno Mars - Die With A Smile (Official Music Video)(MP3_160K).mp3', cover: '' },
 { name: 'Tu Hai Kahan', url: 'songs/Tu Hai Kahan by AUR _ تو ہے کہاں (Official Music Video)(MP3_160K).mp3', cover: '' },
 { name: 'Yeh Raaten Yeh Mausam ', url: 'songs/Y2mate.lol - Yeh Raaten Yeh Mausam - Cover Song _ JalRaj _ Asha Bhosle _ Kishore Kumar _ Ravi.mp3', cover: '' }
];

let audioCtx, analyser, source, canvas, ctx, dataArray;

if(openLibBtn) {
    openLibBtn.addEventListener('click', () => libWindow.classList.add('active'));
}
if(closeLibBtn) {
    closeLibBtn.addEventListener('click', () => libWindow.classList.remove('active'));
}

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    canvas = document.getElementById('visualizer');
    ctx = canvas.getContext('2d');
    renderFrame();
}

function renderFrame() {
    requestAnimationFrame(renderFrame);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.5;
        ctx.fillStyle = `rgba(212, 175, 55, ${dataArray[i] / 255})`;
        ctx.fillRect(x, (canvas.height / 2) - (barHeight / 2), barWidth - 2, barHeight);
        x += barWidth;

        if (i === 10) { 
            const scale = 1 + (dataArray[i] / 255) * 0.12;
            const vinyl = document.getElementById('vinyl');
            if(vinyl) vinyl.style.transform = `scale(${scale})`;
        }
    }
}

function loadSong(index) {
    const song = songs[index];
    title.innerText = song.name;
    audio.src = song.url;
    const img = song.cover || DEFAULT_LOGO;
    cover.src = img;
    
    if(bgOverlay) {
        bgOverlay.style.backgroundImage = `url(${img})`;
    }
    
    document.querySelectorAll('#playlist li').forEach((li, i) => {
        li.classList.toggle('active', i === index);
    });

    if(window.innerWidth < 768) libWindow.classList.remove('active');
}

backwardBtn.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
});

forwardBtn.addEventListener('click', () => {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});

function togglePlay() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (audio.paused) {
        audio.play().then(() => {
            playBtn.innerHTML = '||';
            document.getElementById('vinyl').classList.add('playing');
        }).catch(e => console.error("Playback Error:", e));
    } else {
        audio.pause();
        playBtn.innerHTML = '▶'; 
        document.getElementById('vinyl').classList.remove('playing');
    }
}

playBtn.addEventListener('click', togglePlay);

nextBtn.addEventListener('click', () => {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songIndex);
    if (!audio.paused) audio.play(); 
});

prevBtn.addEventListener('click', () => {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    loadSong(songIndex);
    if (!audio.paused) audio.play();
});

audio.addEventListener('timeupdate', () => {
    if(audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        document.getElementById('currTime').innerText = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    document.getElementById('durTime').innerText = formatTime(audio.duration);
});

progressContainer.addEventListener('click', (e) => {
    audio.currentTime = (e.offsetX / progressContainer.clientWidth) * audio.duration;
});

function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    jsmediatags.read(file, {
        onSuccess: (tag) => {
            let img = DEFAULT_LOGO;
            if (tag.tags.picture) {
                const { data, format } = tag.tags.picture;
                let base64 = btoa(String.fromCharCode(...data));
                img = `data:${format};base64,${base64}`;
            }
            addSongToLibrary(tag.tags.title || file.name.split('.')[0], url, img);
        },
        onError: () => addSongToLibrary(file.name.split('.')[0], url, DEFAULT_LOGO)
    });
});

function addSongToLibrary(name, url, img) {
    const newSong = { name, url, cover: img };
    songs.push(newSong);
    const index = songs.length - 1;
    const li = document.createElement('li');
    li.innerText = name;
    li.onclick = () => { 
        songIndex = index; 
        loadSong(index); 
        if(audio.paused) togglePlay();
        else audio.play();
    };
    playlistElement.appendChild(li);
    
    songIndex = index;
    loadSong(index);
}

function init() {
    playlistElement.innerHTML = ''; 
    songs.forEach((song, i) => {
        const li = document.createElement('li');
        li.innerText = song.name;
        li.onclick = () => { 
            songIndex = i; 
            loadSong(i); 
            if(audio.paused) togglePlay();
            else audio.play();
        };
        playlistElement.appendChild(li);
    });
    loadSong(0);
}

init();