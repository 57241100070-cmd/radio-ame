// ===== AME TV - CHAT.JS =====

const chatMessages = document.getElementById('chatMessages');
const chatInput   = document.getElementById('chatInput');
const chatSend    = document.getElementById('chatSend');
const chatOnline  = document.getElementById('chatOnline');

const CHAT_COLORS = [
    '#f7a8c4', '#c9b8f0', '#b8f0e6', '#ffd6b3',
    '#b8dbf0', '#f0b8d4', '#e8c4f0', '#b8f0c4',
];

const USERNAMES = [
    'sakura_gamer', 'neko_play', 'kawaii_pro', 'luna_stream',
    'pixel_mochi', 'pastel_gamer', 'yuki_live', 'hana_chan',
    'chibi_queen', 'ami_star', 'miku_plays', 'rose_gamer',
];

const AUTO_MESSAGES = [
    '🎮 ¡Hola AME! que cute stream uwu',
    '💖 ¡Te adoro streamer!',
    '🌸 Primera vez aquí, qué bonita la página',
    '✨ omg me encanta el diseño!!!',
    '🔥 Go go go!!',
    '🎮 ¿Qué juego viene hoy?',
    '💯 STREAM HYPE!!!',
    '🌸 hola hola~~',
    '😍 el chat más kawaii que he visto jajaja',
    '🎮 gg ez',
    '💖 te sigo desde hace mucho ame!!',
    '✨ que vibras tan bonitas',
    '🌸 AME TV es lo mejor uwu',
    '🎮 streamea Minecraft pleeease',
    '💖 q linda la pagina mana!!',
    '✨ hyyyyyype',
    '🔥 llegué tardeeee noooo',
    '😍 me encantan las burbujas del fondo jaja',
];

let onlineCount = 0;
let targetOnline = Math.floor(Math.random() * 150) + 30;

function updateOnlineCount(count) {
    onlineCount = count;
    chatOnline.textContent = count + ' online';
}
updateOnlineCount(Math.floor(Math.random() * 50) + 10);
setTimeout(() => {
    let c = parseInt(chatOnline.textContent);
    const interval = setInterval(() => {
        c = Math.min(c + Math.ceil(Math.random() * 8), targetOnline);
        updateOnlineCount(c);
        if (c >= targetOnline) clearInterval(interval);
    }, 200);
}, 1000);

setInterval(() => {
    const delta = Math.floor(Math.random() * 14) - 5;
    onlineCount = Math.max(5, onlineCount + delta);
    updateOnlineCount(onlineCount);
}, 8000);

// --- Render a chat message ---
function addMessage(username, text, color) {
    const msg = document.createElement('div');
    msg.classList.add('chat-msg');

    // Avatar letter
    const initials = username.slice(0, 2).toUpperCase();
    const avatar = document.createElement('div');
    avatar.classList.add('chat-avatar');
    avatar.style.background = color;
    avatar.textContent = initials;

    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble');

    const name = document.createElement('div');
    name.classList.add('chat-name');
    name.style.color = color;
    name.textContent = username;

    const msgText = document.createElement('div');
    msgText.classList.add('chat-text');
    msgText.textContent = text;

    bubble.appendChild(name);
    bubble.appendChild(msgText);
    msg.appendChild(avatar);
    msg.appendChild(bubble);

    chatMessages.appendChild(msg);

    // Auto scroll
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Remove old messages if too many
    while (chatMessages.children.length > 60) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

// --- Send user message ---
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage('Tú', text, 'var(--pink-deep)');
    chatInput.value = '';
    chatInput.focus();
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});

// --- Emotes ---
document.querySelectorAll('.emote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        chatInput.value += btn.dataset.emote;
        chatInput.focus();
    });
});

// --- Simulate auto messages ---
function simulateChat() {
    const user  = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
    const msg   = AUTO_MESSAGES[Math.floor(Math.random() * AUTO_MESSAGES.length)];
    const color = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
    addMessage(user, msg, color);
}

// Initial burst of messages
setTimeout(() => {
    for (let i = 0; i < 5; i++) {
        setTimeout(simulateChat, i * 400);
    }
}, 1000);

// Periodic messages
setInterval(() => {
    if (Math.random() > 0.3) simulateChat();
}, 3000 + Math.random() * 2000);
