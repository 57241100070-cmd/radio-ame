// ===== AME TV - VIEWER.JS =====
// Los viewers se conectan al stream de la streamer via PeerJS/WebRTC

let viewerPeer = null;
let viewerCall = null;
let viewerConnected = false;

// ID del host: mismo algoritmo que panel.js
function getHostId() {
    const base = window.location.hostname.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'ametv';
    return 'ametv-' + base;
}

// Intentar conectarse al stream automáticamente al cargar
function tryConnectViewer() {
    if (viewerConnected) return;

    // Solo conectar si el panel de streamer NO está abierto (es viewer, no streamer)
    if (!document.getElementById('djPanel') || document.getElementById('djPanel').classList.contains('hidden')) {
        connectToStream(getHostId());
    }
}

function connectToStream(hostId) {
    if (viewerPeer) { viewerPeer.destroy(); viewerPeer = null; }

    viewerPeer = new Peer(undefined, { debug: 0 });

    viewerPeer.on('open', () => {
        const call = viewerPeer.call(hostId, new MediaStream(), {
            constraints: { offerToReceiveAudio: true, offerToReceiveVideo: true }
        });

        if (!call) return;
        viewerCall = call;

        call.on('stream', (remoteStream) => {
            viewerConnected = true;
            const video = document.getElementById('liveVideo');
            if (video) {
                video.srcObject = remoteStream;
                video.muted = false;
                video.volume = (document.getElementById('volSlider')?.value || 80) / 100;
                video.play().catch(() => {
                    // Navegador bloquea autoplay con sonido, reproducir muted y luego pedir click
                    video.muted = true;
                    video.play().then(() => {
                        showUnmuteButton();
                    });
                });
                video.classList.remove('hidden');
                document.getElementById('playerOffline').classList.add('hidden');
                document.getElementById('playerOverlay').classList.remove('hidden');
            }

            // Ocultar "offline", mostrar stream real
            document.getElementById('pbPlay').textContent = '⏸';
        });

        call.on('close', () => {
            viewerConnected = false;
            disconnectViewer();
        });

        call.on('error', () => {
            viewerConnected = false;
        });
    });

    viewerPeer.on('error', () => {
        // Streamer offline — no hacer nada, quedarse en modo offline
    });
}

function disconnectViewer() {
    const video = document.getElementById('liveVideo');
    if (video) { video.srcObject = null; video.classList.add('hidden'); }
    document.getElementById('playerOffline').classList.remove('hidden');
    document.getElementById('playerOverlay').classList.add('hidden');
    document.getElementById('pbPlay').textContent = '▶';
}

function showUnmuteButton() {
    const existing = document.getElementById('unmuteBtn');
    if (existing) return;

    const btn = document.createElement('button');
    btn.id = 'unmuteBtn';
    btn.textContent = '🔊 Toca para activar sonido';
    btn.style.cssText = `
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        background:rgba(247,168,196,0.9); color:#1a1025;
        border:none; padding:14px 28px; border-radius:50px;
        font-family:'Nunito',sans-serif; font-weight:900; font-size:1rem;
        cursor:pointer; z-index:20;
        box-shadow:0 8px 30px rgba(0,0,0,0.3);
    `;
    btn.addEventListener('click', () => {
        const video = document.getElementById('liveVideo');
        if (video) { video.muted = false; video.volume = (document.getElementById('volSlider')?.value || 80) / 100; }
        btn.remove();
    });
    document.getElementById('videoPlayer')?.appendChild(btn);
}

// Conectar al cargar (con retry cada 15s si streamer está offline)
setTimeout(tryConnectViewer, 2000);
setInterval(() => {
    if (!viewerConnected && document.getElementById('djPanel')?.classList.contains('hidden')) {
        tryConnectViewer();
    }
}, 15000);

// Play button del player también conecta
document.getElementById('pbPlay')?.addEventListener('click', () => {
    if (!viewerConnected) {
        connectToStream(getHostId());
        showToast('📡 Conectando al stream...');
    }
});
