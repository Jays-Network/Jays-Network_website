document.addEventListener('DOMContentLoaded', () => {
    
    /* --- 1. BOOT SEQUENCE --- */
    const bootScreen = document.getElementById('boot-screen');
    const progressBar = document.getElementById('progress-fill');
    const loaderText = document.getElementById('loader-text');
    const hexStream = document.getElementById('hex-stream');
    const mainInterface = document.getElementById('main-interface');
    const header = document.querySelector('.profile-header');

    if (bootScreen) {
        setInterval(() => { let hex = ''; for(let i=0; i<8; i++) hex += '0x' + Math.floor(Math.random()*255).toString(16).toUpperCase() + ' '; if(hexStream) hexStream.innerText = hex; }, 100);

        let progress = 0;
        const loadInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1; if(progress > 100) progress = 100;
            if(progressBar) progressBar.style.width = progress + '%';
            if(loaderText) {
                if(progress < 30) loaderText.innerText = "INITIALIZING KERNEL...";
                else if(progress < 60) loaderText.innerText = "LOADING SECURE MODULES...";
                else if(progress < 90) loaderText.innerText = "ESTABLISHING UPLINK...";
                else loaderText.innerText = "ACCESS GRANTED.";
            }

            if (progress >= 100) {
                clearInterval(loadInterval);
                setTimeout(() => {
                    bootScreen.style.opacity = '0';
                    setTimeout(() => { 
                        bootScreen.style.display = 'none';
                        if(mainInterface) mainInterface.style.opacity = '1';
                        if(header) header.classList.add('scroll-visible');
                        initScrollObserver();
                    }, 500);
                }, 800);
            }
        }, 30);
    }

    /* --- 2. LIVE 2-WAY NETWORK MAP --- */
    const canvas = document.getElementById('network-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        const resizeCanvas = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
        window.addEventListener('resize', resizeCanvas); resizeCanvas();

        const origin = { x: 0.55, y: 0.65 }; // South Africa
        const targets = [ { x: 0.25, y: 0.35 }, { x: 0.48, y: 0.25 }, { x: 0.75, y: 0.35 }, { x: 0.85, y: 0.75 }, { x: 0.30, y: 0.70 } ];

        class Packet {
            constructor() { this.reset(); }
            reset() {
                const randomNode = targets[Math.floor(Math.random() * targets.length)];
                // 50% Inbound / 50% Outbound Logic
                const isOutbound = Math.random() > 0.5;
                if (isOutbound) { this.start = origin; this.end = randomNode; } else { this.start = randomNode; this.end = origin; }
                this.progress = 0; this.speed = 0.005 + Math.random() * 0.01; this.color = Math.random() > 0.5 ? '#00f2ff' : '#7000ff';
            }
            update() { this.progress += this.speed; if (this.progress >= 1) this.reset(); }
            draw() {
                const startX = width * this.start.x; const startY = height * this.start.y;
                const endX = width * this.end.x; const endY = height * this.end.y;
                const cpX = (startX + endX) / 2; const cpY = startY - 100; const t = this.progress;
                const currentX = (1-t)*(1-t)*startX + 2*(1-t)*t*cpX + t*t*endX; const currentY = (1-t)*(1-t)*startY + 2*(1-t)*t*cpY + t*t*endY;
                ctx.beginPath(); ctx.arc(currentX, currentY, 2, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
                const tailT = Math.max(0, t - 0.1); const tailX = (1-tailT)*(1-tailT)*startX + 2*(1-tailT)*tailT*cpX + tailT*tailT*endX; const tailY = (1-tailT)*(1-tailT)*startY + 2*(1-tailT)*tailT*cpY + tailT*tailT*endY;
                ctx.beginPath(); ctx.moveTo(currentX, currentY); ctx.lineTo(tailX, tailY); ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.stroke();
                if (this.progress > 0.95) { ctx.beginPath(); ctx.arc(endX, endY, (this.progress - 0.95) * 100, 0, Math.PI * 2); ctx.strokeStyle = `rgba(0, 242, 255, ${1 - (this.progress - 0.95) * 20})`; ctx.stroke(); }
            }
        }
        const packets = Array.from({ length: 20 }, () => new Packet());
        function animateNetwork() {
            ctx.clearRect(0, 0, width, height);
            const oX = width * origin.x; const oY = height * origin.y;
            // Draw SA Pulse
            ctx.beginPath(); ctx.arc(oX, oY, 5, 0, Math.PI * 2); ctx.fillStyle = '#00f2ff'; ctx.fill();
            packets.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animateNetwork);
        }
        animateNetwork();
    }

    /* --- 3. SCROLL OBSERVER --- */
    const initScrollObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-visible');
                    // Browser
                    if(entry.target.id === 'browser-window' && !entry.target.dataset.triggered) {
                        entry.target.dataset.triggered = "true";
                        setTimeout(() => { 
                            const l = document.getElementById('browser-loader'); if(l) l.style.display = 'none';
                            const c = document.getElementById('browser-content-container'); if(c) c.classList.add('fade-in-content');
                        }, 2500);
                    }
                    // Terminal
                    if(entry.target.id === 'terminal-window' && !entry.target.dataset.triggered) {
                        entry.target.dataset.triggered = "true";
                        if(typeof initTerminal === 'function') initTerminal();
                    }
                }
            });
        }, { threshold: 0.2 });
        
        const ids = ['browser-window', 'terminal-window', 'projects-grid'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) observer.observe(el);
        });
    };

    /* --- 4. TERMINAL LOGIC --- */
    const terminalBox = document.getElementById('terminal-content');
    if (terminalBox) {
        const username = 'Jays-Network'; const delay = ms => new Promise(res => setTimeout(res, ms));
        function addLine(text, type = 'cmd') {
            const existingCursor = document.querySelector('.cursor'); if(existingCursor) existingCursor.remove();
            const div = document.createElement('div'); div.className = type === 'cmd' ? 'cmd-line' : 'output-line'; div.innerHTML = text; terminalBox.appendChild(div);
            const newCursor = document.createElement('span'); newCursor.className = 'cursor'; terminalBox.appendChild(newCursor); terminalBox.scrollTop = terminalBox.scrollHeight;
        }

        window.initTerminal = async function() {
            await delay(500); 
            addLine(`Jullian@Status-Terminal:~$ ./fetch_metrics.sh --target ${username}`, 'cmd');
            await delay(800); addLine(`> Initializing API handshake...`, 'output');
            try {
                const userRes = await fetch(`https://api.github.com/users/${username}`); const userData = await userRes.json();
                const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`); const reposData = await reposRes.json();
                const totalStars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);
                await delay(600); addLine(`> <span class="success">Connection Established [200 OK]</span>`, 'output');
                await delay(1000); addLine(`> <strong>GITHUB_METRICS_V1.0</strong>`, 'output');
                addLine(`> USERNAME   : <span class="highlight-stat">${userData.login}</span>`, 'output'); await delay(200);
                addLine(`> REPOS (PUB): <span class="highlight-stat">${userData.public_repos}</span>`, 'output'); await delay(200);
                addLine(`> STARS      : <span class="highlight-stat">${totalStars}</span>`, 'output'); await delay(200);
                addLine(`> FOLLOWERS  : <span class="highlight-stat">${userData.followers}</span>`, 'output'); await delay(200);
                addLine(`> STATUS     : <span class="success">ONLINE</span>`, 'output'); await delay(500);
                addLine(`Jullian@Status-Terminal:~$ <span class="success">Done.</span>`, 'cmd');
            } catch (error) { addLine(`> <span class="warning">Error: Could not reach GitHub.</span>`, 'output'); }
        }
    }
});