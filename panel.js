// ===== AME TV - PANEL.JS (WebRTC Real con PeerJS) =====

const btnStart  = document.getElementById('btnStartBroadcast');
const btnStop   = document.getElementById('btnStopBroadcast');
const bdStatus  = document.getElementById('broadcastStatus');
const bdDot     = bdStatus.querySelector('.bd-dot');
const btnMic    = document.getElementById('btnMic');
const micLevel  = document.getElementById('micLevel');

let micStream    = null;
let screenStream = null;
let micActive    = false;
let audioCtx     = null;
let analyser     = null;
let micAnimFrame = null;
let isLive       = false;
let peer         = null;
let activeConns  = new Set();
let liveStream   = null;
let audioCtxMixer = null; // Para mezclar audios
let micStreamForBroadcast = null; // Guardar referencia del mic

// ─── INICIAR STREAM ───────────────────────────────────────────────────────────
btnStart.addEventListener('click', async () => {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                frameRate: 30,
                cursor: "always"
            },
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100
            }
        });
    } catch (err) {
        showToast('⚠️ Necesitas permitir compartir pantalla para streamear', 'error');
        return;
    }

    // Capturar micrófono separado
    micStreamForBroadcast = null;
    try {
        micStreamForBroadcast = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            } 
        });
        startMicVisualizer(micStreamForBroadcast);
        micActive = true;
        btnMic.textContent = '🔴 Micrófono Activo';
        btnMic.style.background = 'linear-gradient(135deg, #e85454, #c43a3a)';
    } catch (err) {
        showToast('⚠️ Sin micrófono, solo video y audio del sistema', 'error');
    }

    // Crear stream con video
    liveStream = new MediaStream();
    screenStream.getVideoTracks().forEach(t => liveStream.addTrack(t));
    
    // Mezclar audio usando Web Audio API
    const hasSystemAudio = screenStream.getAudioTracks().length > 0;
    const hasMicAudio = micStreamForBroadcast && micStreamForBroadcast.getAudioTracks().length > 0;
    
    if (hasSystemAudio || hasMicAudio) {
        try {
            audioCtxMixer = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioCtxMixer.createMediaStreamDestination();
            
            // Conectar audio del sistema
            if (hasSystemAudio) {
                const systemAudio = new MediaStream(screenStream.getAudioTracks());
                const systemSource = audioCtxMixer.createMediaStreamSource(systemAudio);
                const systemGain = audioCtxMixer.createGain();
                systemGain.gain.value = 1.0; // Volumen normal para audio del sistema
                systemSource.connect(systemGain);
                systemGain.connect(destination);
            }
            
            // Conectar micrófono
            if (hasMicAudio) {
                const micSource = audioCtxMixer.createMediaStreamSource(micStreamForBroadcast);
                const micGain = audioCtxMixer.createGain();
                micGain.gain.value = 1.2; // Poco más de volumen para el mic
                micSource.connect(micGain);
                micGain.connect(destination);
            }
            
            // Agregar el audio mezclado al stream final
            destination.stream.getAudioTracks().forEach(track => {
                liveStream.addTrack(track);
            });
            
            showToast('🎵 Audio mezclado correctamente!');
        } catch (err) {
            console.error('Error mezclando audio:', err);
            // Fallback: agregar tracks directamente sin mezclar
            if (hasSystemAudio) screenStream.getAudioTracks().forEach(t => liveStream.addTrack(t));
            if (hasMicAudio) micStreamForBroadcast.getAudioTracks().forEach(t => liveStream.addTrack(t));
            showToast('⚠️ Audio sin mezclar, usando fallback');
        }
    } else {
        showToast('⚠️ No hay audio capturado - solo video', 'error');
    }

    const video = document.getElementById('liveVideo');
    video.srcObject = liveStream;
    video.muted = false; // Permitir escuchar el audio localmente
    video.volume = 0.3; // Volumen bajo para evitar feedback
    video.play().catch(() => {});
    video.classList.remove('hidden');
    document.getElementById('playerOffline').classList.add('hidden');
    document.getElementById('playerOverlay').classList.remove('hidden');

    const hostId = generateHostId();
    peer = new Peer(hostId, { debug: 0 });

    peer.on('open', (id) => {
        isLive = true;
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        bdDot.classList.remove('offline');
        bdDot.classList.add('online');
        bdStatus.querySelector('span:last-child').textContent = 'En el aire 🔴';

        document.getElementById('streamIdGroup').style.display = 'block';
        document.getElementById('streamIdDisplay').value = id;

        showToast('🔴 ¡Stream iniciado! Comparte tu ID con los viewers 🎉');
        document.getElementById('pbPlay').textContent = '⏸';
    });

    peer.on('call', (call) => {
        call.answer(liveStream);
        activeConns.add(call);
        call.on('close', () => { activeConns.delete(call); updateViewerCount(activeConns.size); });
        call.on('error', () => { activeConns.delete(call); updateViewerCount(activeConns.size); });
        updateViewerCount(activeConns.size);
        showToast('👁️ Nuevo viewer conectado (' + activeConns.size + ' en vivo)');
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            peer.destroy();
            peer = new Peer(generateHostId() + '_' + Date.now().toString(36).slice(-4), { debug: 0 });
        } else {
            showToast('❌ Error: ' + err.message, 'error');
        }
    });

    screenStream.getVideoTracks()[0]?.addEventListener('ended', stopBroadcast);
});

btnStop.addEventListener('click', stopBroadcast);

function stopBroadcast() {
    isLive = false;
    activeConns.forEach(call => call.close());
    activeConns.clear();
    if (peer) { peer.destroy(); peer = null; }
    if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
    if (screenStream) { screenStream.getTracks().forEach(t => t.stop()); screenStream = null; }
    if (micStreamForBroadcast) { micStreamForBroadcast.getTracks().forEach(t => t.stop()); micStreamForBroadcast = null; }
    if (audioCtxMixer) { audioCtxMixer.close(); audioCtxMixer = null; }
    stopMicVisualizer();
    micActive = false;
    btnMic.textContent = '🎤 Activar Micrófono';
    btnMic.style.background = '';

    btnStop.classList.add('hidden');
    btnStart.classList.remove('hidden');
    bdDot.classList.remove('online');
    bdDot.classList.add('offline');
    bdStatus.querySelector('span:last-child').textContent = 'Fuera del aire';
    document.getElementById('streamIdGroup').style.display = 'none';
    document.getElementById('playerOverlay').classList.add('hidden');
    document.getElementById('playerOffline').classList.remove('hidden');

    const video = document.getElementById('liveVideo');
    video.srcObject = null;
    video.classList.add('hidden');
    document.getElementById('pbPlay').textContent = '▶';
    updateViewerCount(0);
    showToast('⏹ Stream detenido');
}

document.getElementById('btnCopyId')?.addEventListener('click', () => {
    const id = document.getElementById('streamIdDisplay').value;
    navigator.clipboard.writeText(id).then(() => {
        showToast('📋 ID copiado al portapapeles');
    }).catch(() => {
        document.getElementById('streamIdDisplay').select();
        document.execCommand('copy');
        showToast('📋 ID copiado!');
    });
});

btnMic.addEventListener('click', async () => {
    if (micActive) {
        stopMicBtn();
    } else {
        await startMicBtn();
    }
});

async function startMicBtn() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micActive = true;
        btnMic.textContent = '🔴 Micrófono Activo';
        btnMic.style.background = 'linear-gradient(135deg, #e85454, #c43a3a)';
        startMicVisualizer(stream);
        if (window.showToast) showToast('🎤 Micrófono activado');
    } catch (err) {
        if (window.showToast) showToast('❌ Sin acceso al micrófono. Revisa los permisos.', 'error');
    }
}

function stopMicBtn() {
    micActive = false;
    btnMic.textContent = '🎤 Activar Micrófono';
    btnMic.style.background = '';
    stopMicVisualizer();
    if (window.showToast) showToast('🎤 Micrófono desactivado');
}

function startMicVisualizer(stream) {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const src = audioCtx.createMediaStreamSource(stream);
        src.connect(analyser);
        animateMic();
    } catch(e) {}
}

function stopMicVisualizer() {
    cancelAnimationFrame(micAnimFrame);
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    analyser = null;
    micLevel.style.width = '0%';
}

function animateMic() {
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    micLevel.style.width = Math.min(100, avg * 1.6) + '%';
    micAnimFrame = requestAnimationFrame(animateMic);
}

function generateHostId() {
    const base = window.location.hostname.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'ametv';
    return 'ametv-' + base;
}

function updateViewerCount(count) {
    const el = document.getElementById('viewerCount');
    if (el) el.textContent = count;
}
