// ===== BUBBLES BACKGROUND =====
(function() {
    const container = document.getElementById('bgBubbles');
    const COLORS = [
        'rgba(247,168,196,0.18)',
        'rgba(201,184,240,0.15)',
        'rgba(184,240,230,0.12)',
        'rgba(255,214,179,0.13)',
        'rgba(184,219,240,0.12)',
    ];

    function createBubble() {
        const el = document.createElement('div');
        el.classList.add('bubble');

        const size = Math.random() * 60 + 20;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const left = Math.random() * 100;
        const duration = Math.random() * 12 + 8;
        const delay = Math.random() * 10;

        el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            bottom: -80px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;

        container.appendChild(el);

        setTimeout(() => el.remove(), (duration + delay) * 1000);
    }

    // Create initial batch
    for (let i = 0; i < 20; i++) createBubble();
    setInterval(createBubble, 800);
})();
