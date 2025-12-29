document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-tab-content');
    const adminDrawResultsContainer = document.getElementById('admin-draw-results');
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
                
                // تحديث البيانات عند التبديل للتابات
                if (targetId === 'manage-warriors') loadAdminPlayers();
                if (targetId === 'admin-draw-section') loadMatchesForAdmin();
                if (targetId === 'admin-leaderboard-section') loadLeaderboard();
            }
        });
    });

    // === 2. حركة الزرار (التعديل المطلوب) ===
    function updateRegButton(isOpen) {
        if (!toggleRegBtn) return;
        // تغيير النص والألوان بناءً على حالة التسجيل
        toggleRegBtn.innerText = isOpen ? "Close Registration 🔒" : "Open Registration 🔓";
        toggleRegBtn.className = isOpen ? "btn btn-warning w-100 mb-3 fw-bold" : "btn btn-success w-100 mb-3 fw-bold";
    }

    // جلب الحالة المبدئية عند فتح الصفحة
    const checkInitialRegStatus = async () => {
        try {
            const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/handball/settings");
            const data = await res.json();
            updateRegButton(data.registrationOpen);
        } catch (err) { console.error("Settings load failed"); }
    };

    if (toggleRegBtn) {
        checkInitialRegStatus(); // تفعيل الحالة أول ما الصفحة تفتح
        
        toggleRegBtn.onclick = async () => {
            try {
                const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/handball/toggle-registration", {
                    method: "PUT"
                });
                const data = await res.json();
                updateRegButton(data.registrationOpen);
                alert(data.registrationOpen ? "Registration OPENED! 🔓" : "Registration CLOSED! 🔒");
            } catch (err) {
                console.error(err);
                alert("Error toggling registration");
            }
        };
    }

    // === 3. تحميل وحذف اللاعبين ===
    async function loadAdminPlayers() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/handball');
            const players = await res.json();
            const listContainer = document.getElementById('admin-players-list');
            if (!listContainer) return;

            listContainer.innerHTML = players.map(p => `
                <div class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center mb-2 border-secondary">
                    <div>
                        <strong class="text-success">${p.name}</strong> 
                        <span class="ms-3 badge bg-secondary">${p.team}</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deletePlayer('${p._id}')">Remove</button>
                </div>
            `).join('');
        } catch (err) {
            console.error("Failed to load players", err);
        }
    }

    window.deletePlayer = async (playerId) => {
        if (confirm("Are you sure you want to remove this player?")) {
            try {
                const res = await fetch(`https://final-backend-production-ae08.up.railway.app/api/handball/delete/${playerId}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    alert("Player removed successfully");
                    loadAdminPlayers();
                }
            } catch (err) { console.error("Server error", err); }
        }
    };

    // === 4. توليد القرعة ===
    const btnRunDraw = document.getElementById('btnRunDraw');
    if (btnRunDraw) {
        btnRunDraw.addEventListener('click', async () => {
            if (!confirm("This will reset all points. Continue?")) return;
            try {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/handball/generate-draw', { method: 'POST' });
                if (res.ok) {
                    alert("Draw generated successfully!");
                    loadMatchesForAdmin();
                    loadLeaderboard();
                }
            } catch (err) { alert("Error during draw generation"); }
        });
    }

    // === 5. تحميل الماتشات وإدخال النتائج ===
    async function loadMatchesForAdmin() {
        if (!adminDrawResultsContainer) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/handball/matches');
            const matches = await res.json();
            adminDrawResultsContainer.innerHTML = matches.map(m => `
                <div id="match-${m._id}" class="p-3 mb-2 bg-dark border ${m.isFinished ? 'border-secondary opacity-75' : 'border-warning'} rounded">
                    <div class="row align-items-center text-white g-2 text-center">
                        <div class="col-4 fw-bold">${m.home}</div>
                        <div class="col-4 d-flex gap-1">
                            <input type="number" id="h-${m._id}" class="form-control text-center" value="${m.homeScore}">
                            <input type="number" id="a-${m._id}" class="form-control text-center" value="${m.awayScore}">
                        </div>
                        <div class="col-4 fw-bold">${m.away}</div>
                    </div>
                    <button class="btn btn-sm ${m.isFinished ? 'btn-outline-secondary' : 'btn-warning'} w-100 mt-2 fw-bold" 
                            onclick="updateScore('${m._id}')">
                        ${m.isFinished ? 'Update Score' : 'Save Score'}
                    </button>
                </div>
            `).join('');
        } catch (err) { console.error("Failed to load admin matches", err); }
    }

    window.updateScore = async (id) => {
        const homeScore = document.getElementById(`h-${id}`).value;
        const awayScore = document.getElementById(`a-${id}`).value;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/handball/update-score', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ matchId: id, homeScore, awayScore })
            });
            if (res.ok) {
                alert("Score updated!");
                loadMatchesForAdmin();
                loadLeaderboard();
            }
        } catch (err) { console.error(err); }
    };

    // === 6. الترتيب (Leaderboard) ===
    async function loadLeaderboard() {
        const container = document.getElementById('league-rank'); 
        if (!container) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/handball/leaderboard');
            const teams = await res.json();
            
            if (teams.length > 0) {
                container.innerHTML = `
                    <table class="table table-dark table-striped mt-3 text-center">
                        <thead>
                            <tr><th>Rank</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
                        </thead>
                        <tbody>
                            ${teams.map((t, i) => `
                                <tr>
                                    <td>${i+1}</td>
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
            }
        } catch (err) { console.error(err); }
    }

    // التشغيل المبدئي
    loadAdminPlayers();
    loadMatchesForAdmin();
    loadLeaderboard();
});
