document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-tab-content');
    const toggleRegBtn = document.getElementById("toggleRegistration");

    // === 1. منطق تبديل التابات ===
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                sections.forEach(sec => sec.classList.add('d-none'));
                tabs.forEach(t => t.classList.remove('active'));
                targetElement.classList.remove('d-none');
                tab.classList.add('active');

                // تحميل البيانات حسب التاب النشط
                if (targetId === 'manage-players') loadAdminPlayers();
                if (targetId === 'admin-matches') loadAdminMatches();
                if (targetId === 'admin-ranking') loadAdminLeaderboard();
            }
        });
    });

    // === 2. حركة زرار قفل وفتح التسجيل (Toggle) ===
    function updateRegButton(isOpen) {
        if (!toggleRegBtn) return;
        toggleRegBtn.innerText = isOpen ? "Close Registration 🔒" : "Open Registration 🔓";
        toggleRegBtn.className = isOpen ? "btn btn-warning w-100 py-3 fw-bold" : "btn btn-success w-100 py-3 fw-bold";
    }

    const checkInitialStatus = async () => {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/settings');
            const data = await res.json();
            updateRegButton(data.registrationOpen);
        } catch (err) { console.error("Failed to load settings"); }
    };

    if (toggleRegBtn) {
        checkInitialStatus();
        toggleRegBtn.onclick = async () => {
            try {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/toggle-registration', { method: 'PUT' });
                const data = await res.json();
                updateRegButton(data.registrationOpen);
                alert(data.registrationOpen ? "Chess Registration is now OPEN!" : "Chess Registration is now CLOSED!");
            } catch (err) { alert("Error toggling status"); }
        };
    }

    // === 3. إدارة اللاعبين (عرض وحذف) ===
    async function loadAdminPlayers() {
        const list = document.getElementById('admin-players-list');
        if (!list) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess');
            const players = await res.json();
            list.innerHTML = players.map(p => `
                <div class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center mb-2 border-primary">
                    <span><strong>${p.name}</strong> <small class="text-info ms-2">[${p.userClass || 'Ranked'}]</small></span>
                    <button class="btn btn-sm btn-danger" onclick="deletePlayer('${p._id}')">Remove</button>
                </div>
            `).join('');
        } catch (err) { console.error("Error loading players"); }
    }

    window.deletePlayer = async (id) => {
        if (confirm("Remove this Grandmaster from the tournament?")) {
            await fetch(`https://final-backend-production-ae08.up.railway.app/api/chess/delete/${id}`, { method: 'DELETE' });
            loadAdminPlayers();
            loadAdminLeaderboard();
        }
    };

    // === 4. التحكم في المباريات والقرعة ===
    async function loadAdminMatches() {
        const container = document.getElementById('admin-match-list');
        if (!container) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/matches');
            const matches = await res.json();

            container.innerHTML = matches.map(m => `
                <div class="match-item p-3 mb-3 border ${m.isFinished ? 'border-secondary opacity-50' : 'border-primary'} bg-dark rounded">
                    <p class="text-center text-info small mb-2">${m.isFinished ? 'Match Completed' : 'Select the Winner'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn ${m.winner === m.player1 ? 'btn-primary' : 'btn-outline-light'} btn-sm px-4"
                            ${m.isFinished ? 'disabled' : ''}
                            onclick="setWinner('${m._id}', '${m.player1}')">
                            ${m.player1}
                        </button>
                        <span class="text-white fw-bold">VS</span>
                        <button class="btn ${m.winner === m.player2 ? 'btn-primary' : 'btn-outline-light'} btn-sm px-4"
                            ${m.isFinished ? 'disabled' : ''}
                            onclick="setWinner('${m._id}', '${m.player2}')">
                            ${m.player2}
                        </button>
                    </div>
                    ${m.isFinished ? `<div class="text-center mt-2 text-warning fw-bold">Winner: ${m.winner}</div>` : ''}
                </div>
            `).join('');
        } catch (err) { console.error("Error loading matches"); }
    }

    // زرار توليد القرعة
    const btnRunDraw = document.getElementById('btnRunDraw');
    if (btnRunDraw) {
        btnRunDraw.onclick = async () => {
            if (confirm("This will RESET all current matches and leaderboard. Proceed?")) {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/generate-draw', { method: 'POST' });
                if (res.ok) {
                    alert("New Draw Generated!");
                    loadAdminMatches();
                } else {
                    const data = await res.json();
                    alert(data.message || "Error generating draw");
                }
            }
        };
    }

    // تسجيل الفائز
    window.setWinner = async (matchId, winnerName) => {
        if (!confirm(`Confirm ${winnerName} as the winner?`)) return;
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/update-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, winnerName })
        });
        if (res.ok) {
            loadAdminMatches();
            loadAdminLeaderboard();
        }
    };

    // === 5. الليدربورد (الترتيب) ===
    async function loadAdminLeaderboard() {
        const container = document.getElementById('admin-leaderboard-container');
        if (!container) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/leaderboard');
            const data = await res.json();
            container.innerHTML = `
                <table class="table table-dark table-hover text-center">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Grandmaster</th>
                            <th>Played</th>
                            <th>Wins</th>
                            <th>Losses</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((p, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td class="fw-bold text-primary">${p.player}</td>
                                <td>${p.played}</td>
                                <td class="text-success fw-bold">${p.won}</td>
                                <td class="text-danger fw-bold">${p.lost}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch (err) { console.error("Error loading leaderboard"); }
    }

    // تحميل مبدئي
    loadAdminPlayers();
    loadAdminMatches();
    loadAdminLeaderboard();
});
