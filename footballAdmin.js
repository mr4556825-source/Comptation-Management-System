document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-tab-content');
    const regStatusBtn = document.getElementById("toggleRegistration"); // تأكد أن الـ ID في الـ HTML هو toggleRegistration

    // === 1. منطق تبديل التابات ===
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            if (document.getElementById(targetId)) {
                sections.forEach(sec => sec.classList.add('d-none'));
                tabs.forEach(t => t.classList.remove('active'));
                document.getElementById(targetId).classList.remove('d-none');
                tab.classList.add('active');

                // تحميل البيانات بناءً على التاب
                if (targetId === 'manage-warriors') loadAdminPlayers();
                if (targetId === 'admin-draw-section') loadMatchesForAdmin();
                if (targetId === 'admin-leaderboard-section') loadLeaderboard();
            }
        });
    });

    // === 2. حركة زرار قفل وفتح التسجيل (التعديل اللي طلبته) ===
    function updateRegButton(isOpen) {
        if (!regStatusBtn) return;
        regStatusBtn.innerText = isOpen ? "Close Registration 🔒" : "Open Registration 🔓";
        regStatusBtn.className = isOpen ? "btn btn-warning w-100 mb-3 fw-bold" : "btn btn-success w-100 mb-3 fw-bold";
    }

    const checkInitialRegStatus = async () => {
        try {
            const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/football/settings");
            const data = await res.json();
            updateRegButton(data.registrationOpen);
        } catch (err) { console.error("Settings load failed"); }
    };

    if (regStatusBtn) {
        checkInitialRegStatus();
        regStatusBtn.onclick = async () => {
            try {
                const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/football/toggle-registration", { method: "PUT" });
                const data = await res.json();
                updateRegButton(data.registrationOpen);
                alert(data.registrationOpen ? "Registration OPENED! 🔓" : "Registration CLOSED! 🔒");
            } catch (err) { alert("Error toggling registration"); }
        };
    }

    // === 3. تحميل وحذف اللاعبين ===
    async function loadAdminPlayers() {
        const listContainer = document.getElementById('admin-players-list');
        if (!listContainer) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football');
            const players = await res.json();
            listContainer.innerHTML = players.map(p => `
                <div class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center mb-2 border-secondary">
                    <div>
                        <strong class="text-success">${p.name}</strong> 
                        <span class="ms-3 badge bg-secondary">${p.team}</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deletePlayer('${p._id}')">Remove</button>
                </div>
            `).join('');
        } catch (err) { console.error("Failed to load players", err); }
    }

    window.deletePlayer = async (playerId) => {
        if (confirm("Are you sure you want to remove this player?")) {
            const res = await fetch(`https://final-backend-production-ae08.up.railway.app/api/football/delete/${playerId}`, { method: 'DELETE' });
            if (res.ok) { alert("Player removed!"); loadAdminPlayers(); }
        }
    };

    // === 4. القرعة وإدخال النتائج ===
    const drawContainer = document.getElementById('admin-draw-results');
    
    async function loadMatchesForAdmin() {
        if (!drawContainer) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/matches');
            const matches = await res.json();
            drawContainer.innerHTML = matches.map(m => `
                <div class="p-3 mb-2 bg-dark border ${m.isFinished ? 'border-secondary opacity-75' : 'border-warning'} rounded">
                    <div class="row align-items-center text-white g-2 text-center">
                        <div class="col-4 fw-bold">${m.home}</div>
                        <div class="col-4 d-flex gap-1">
                            <input type="number" id="h-${m._id}" class="form-control text-center" value="${m.homeScore}">
                            <input type="number" id="a-${m._id}" class="form-control text-center" value="${m.awayScore}">
                        </div>
                        <div class="col-4 fw-bold">${m.away}</div>
                    </div>
                    <button class="btn btn-sm ${m.isFinished ? 'btn-outline-secondary' : 'btn-warning'} w-100 mt-2" 
                            onclick="updateScore('${m._id}')">
                        ${m.isFinished ? 'Update Score' : 'Save Score'}
                    </button>
                </div>
            `).join('');
        } catch (err) { console.error("Failed to load matches", err); }
    }

    window.updateScore = async (id) => {
        const homeScore = document.getElementById(`h-${id}`).value;
        const awayScore = document.getElementById(`a-${id}`).value;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/update-score', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ matchId: id, homeScore, awayScore })
            });
            if (res.ok) { alert("Score updated!"); loadMatchesForAdmin(); }
        } catch (err) { alert("Server error"); }
    };

    const btnRunDraw = document.getElementById('btnRunDraw');
    if (btnRunDraw) {
        btnRunDraw.onclick = async () => {
            if (confirm("Reset everything and generate new draw?")) {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/generate-draw', { method: 'POST' });
                if (res.ok) { alert("New Draw Created!"); loadMatchesForAdmin(); }
            }
        };
    }

    // === 5. الليدربورد (الترتيب) ===
    async function loadLeaderboard() {
        const container = document.getElementById('league-rank');
        if (!container) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/leaderboard');
            const teams = await res.json();
            container.innerHTML = `
                <table class="table table-dark table-striped mt-3 text-center">
                    <thead>
                        <tr>
                            <th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map((t, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td class="fw-bold">${t.team}</td>
                                <td>${t.played}</td>
                                <td>${t.won}</td>
                                <td>${t.drawn}</td>
                                <td>${t.lost}</td>
                                <td>${t.goalsFor}</td>
                                <td>${t.goalsAgainst}</td>
                                <td class="${t.goalsFor - t.goalsAgainst >= 0 ? 'text-success' : 'text-danger'}">
                                    ${t.goalsFor - t.goalsAgainst}
                                </td>
                                <td class="text-warning fw-bold">${t.points}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        } catch (err) { console.error("Leaderboard error", err); }
    }

    // التحميل المبدئي
    loadAdminPlayers();
    loadMatchesForAdmin();
    loadLeaderboard();
});
