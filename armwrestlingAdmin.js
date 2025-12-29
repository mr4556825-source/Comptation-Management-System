document.addEventListener("DOMContentLoaded", async () => {
    const regStatusBtn = document.getElementById("regStatusBtn"); // تم التوحيد مع HTML
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-tab-content');

    // === Tab Switching ===
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            sections.forEach(sec => sec.classList.add('d-none'));
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(targetId).classList.remove('d-none');
            tab.classList.add('active');
            
            if (targetId === 'manage-warriors') loadAdminPlayers();
            if (targetId === 'admin-matches') loadAdminMatches();
            if (targetId === 'admin-ranking') loadAdminLeaderboard();
        });
    });

    // === Registration Toggle ===
    function updateRegBtn(isOpen) {
        if (!regStatusBtn) return;
        regStatusBtn.innerText = isOpen ? "Close Registration 🔒" : "Open Registration 🔓";
        regStatusBtn.className = isOpen ? "btn btn-warning w-100 py-3 fw-bold" : "btn btn-success w-100 py-3 fw-bold";
    }

    async function checkStatus() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/settings');
            const data = await res.json();
            updateRegBtn(data.registrationOpen);
        } catch (e) { console.error("Settings load failed"); }
    }
    checkStatus();

    if (regStatusBtn) {
        regStatusBtn.onclick = async () => {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/toggle-registration', { method: 'PUT' });
            const data = await res.json();
            updateRegBtn(data.registrationOpen);
            alert(data.registrationOpen ? "Arena is Open for Warriors!" : "Arena is Closed!");
        };
    }

    // === Players Logic ===
    async function loadAdminPlayers() {
        const list = document.getElementById('admin-players-list');
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling');
        const players = await res.json();
        list.innerHTML = players.map(p => `
            <div class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center mb-2 border-danger">
                <span><strong>${p.name}</strong> <small class="text-danger ms-2">[${p.userClass || 'Open'}]</small></span>
                <button class="btn btn-sm btn-danger" onclick="deletePlayer('${p._id}')">Ban</button>
            </div>
        `).join('');
    }

    window.deletePlayer = async (id) => {
        if (confirm("Remove Warrior?")) {
            await fetch(`https://final-backend-production-ae08.up.railway.app/api/armwrestling/delete/${id}`, { method: 'DELETE' });
            loadAdminPlayers();
        }
    };

    // === Match Logic ===
    async function loadAdminMatches() {
        const container = document.getElementById('admin-match-list');
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/matches');
        const matches = await res.json();
        container.innerHTML = matches.map(m => `
            <div class="match-item p-3 mb-3 border ${m.isFinished ? 'border-secondary opacity-50' : 'border-danger'} bg-dark rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn ${m.winner === m.player1 ? 'btn-danger' : 'btn-outline-light'} btn-sm px-4"
                        ${m.isFinished ? 'disabled' : ''} onclick="setWinner('${m._id}', '${m.player1}')">${m.player1}</button>
                    <span class="text-danger fw-bold">VS</span>
                    <button class="btn ${m.winner === m.player2 ? 'btn-danger' : 'btn-outline-light'} btn-sm px-4"
                        ${m.isFinished ? 'disabled' : ''} onclick="setWinner('${m._id}', '${m.player2}')">${m.player2}</button>
                </div>
            </div>
        `).join('');
    }

    window.setWinner = async (matchId, winnerName) => {
        await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/update-score', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, winnerName })
        });
        loadAdminMatches();
        loadAdminLeaderboard();
    }

    // === Draw Logic ===
    document.getElementById('btnRunDraw').onclick = async () => {
        if (confirm("Reset current progress and run new draw?")) {
            await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/generate-draw', { method: 'POST' });
            loadAdminMatches();
            loadAdminLeaderboard();
        }
    };

    // === Leaderboard Logic ===
    async function loadAdminLeaderboard() {
        const container = document.getElementById('admin-leaderboard-container');
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/leaderboard');
        const data = await res.json();
        container.innerHTML = `<table class="table table-dark text-center">
            <thead><tr><th>Rank</th><th>Warrior</th><th>Played</th><th>Won</th><th>Lost</th></tr></thead>
            <tbody>${data.map((p, i) => `
                <tr>
                    <td>${i+1}</td>
                    <td class="text-danger fw-bold">${p.player}</td>
                    <td>${p.played}</td>
                    <td class="text-success fw-bold">${p.won}</td>
                    <td class="text-secondary">${p.lost}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    }

    // Initial load
    loadAdminPlayers();
});
