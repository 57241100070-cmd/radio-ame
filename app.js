// AME TV - APP.JS 7
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 40
        ? 'rgba(26,16,37,0.95)'
        : 'rgba(26,16,37,0.7)';
});

// --- Smooth scroll nav links ---
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// --- Follow button ---
const btnFollow = document.getElementById('btnFollow');
let followed = false;
btnFollow.addEventListener('click', () => {
    followed = !followed;
    btnFollow.innerHTML = followed
        ? '<span class="btn-icon">♥</span> Siguiendo'
        : '<span class="btn-icon">♡</span> Seguir';
    btnFollow.style.background = followed ? 'var(--pink-deep)' : 'transparent';
    btnFollow.style.color = followed ? '#fff' : 'var(--pink)';

    if (followed) {
        const count = parseInt(document.getElementById('followCount').textContent);
        document.getElementById('followCount').textContent = count + 1;
        showToast('💖 ¡Ahora sigues a AME TV!');
    }
});

// --- Scroll to player ---
document.getElementById('btnWatch').addEventListener('click', () => {
    document.getElementById('stream').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnNotify').addEventListener('click', () => {
    showToast('¡Te notificaremos cuando empiece el stream!');
});

// --- Viewer count simulation ---
let viewers = 0;
let targetViewers = Math.floor(Math.random() * 300) + 50;

function animateViewers() {
    const diff = targetViewers - viewers;
    if (Math.abs(diff) > 1) {
        viewers += Math.ceil(diff * 0.05);
        document.getElementById('viewerCount').textContent = viewers;
        setTimeout(animateViewers, 50);
    } else {
        viewers = targetViewers;
        document.getElementById('viewerCount').textContent = viewers;
    }
}
setTimeout(animateViewers, 600);

// Occasionally update viewer count
setInterval(() => {
    targetViewers += Math.floor(Math.random() * 20) - 8;
    targetViewers = Math.max(10, Math.min(999, targetViewers));
    animateViewers();
}, 5000);

// --- Volume control ---
const volSlider = document.getElementById('volSlider');
const volNum = document.getElementById('volNum');
volSlider.addEventListener('input', () => {
    volNum.textContent = volSlider.value + '%';
    const video = document.getElementById('liveVideo');
    if (video) video.volume = volSlider.value / 100;
});

// --- Timer ---
let timerStart = null;
let timerInterval = null;

function startTimer() {
    timerStart = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        document.getElementById('pbTime').textContent = `${h}:${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('pbTime').textContent = '00:00:00';
}

// --- Play button ---
let isPlaying = false;
const pbPlay = document.getElementById('pbPlay');
pbPlay.addEventListener('click', () => {
    isPlaying = !isPlaying;
    pbPlay.textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
        startTimer();
        showToast('▶ Reproduciendo stream...');
    } else {
        stopTimer();
    }
});

// --- DJ / Streamer login ---
const btnDj = document.getElementById('btnDj');
const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const loginForm = document.getElementById('loginForm');
const djPanel = document.getElementById('djPanel');
const btnLogout = document.getElementById('btnLogout');

btnDj.addEventListener('click', () => loginModal.classList.remove('hidden'));
modalClose.addEventListener('click', () => loginModal.classList.add('hidden'));
modalBackdrop.addEventListener('click', () => loginModal.classList.add('hidden'));

loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if ((user === 'admin' || user === 'ame') && pass === 'ame2025') {
        loginModal.classList.add('hidden');
        djPanel.classList.remove('hidden');
        document.querySelector('.dj-panel').scrollIntoView({ behavior: 'smooth' });
        showToast('🎮 ¡Bienvenida al panel, streamer!');
    } else {
        showToast('❌ Usuario o contraseña incorrectos', 'error');
        document.getElementById('password').value = '';
    }
});

btnLogout.addEventListener('click', () => {
    djPanel.classList.add('hidden');
    showToast('¡Hasta pronto!');
});

// --- Update stream info ---
document.getElementById('btnUpdateInfo').addEventListener('click', () => {
    const title = document.getElementById('streamTitle').value || 'Lo Mejor del Momento';
    const game  = document.getElementById('streamGame').value  || 'Gaming Time';
    document.getElementById('pbTitle').textContent = title;
    document.getElementById('pbDj').textContent = `con AME • ${game}`;
    showToast('✅ ¡Info actualizada!');
});

// --- Toast notifications ---
function showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? 'rgba(232,84,84,0.9)' : 'rgba(247,168,196,0.95)'};
        color: ${type === 'error' ? '#fff' : '#1a1025'};
        padding: 12px 24px; border-radius: 50px;
        font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.95rem;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 999; white-space: nowrap;
        animation: toastIn 0.3s cubic-bezier(.34,1.56,.64,1) both;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes toastOut { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(10px)} }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease both';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Expose showToast globally
window.showToast = showToast;
