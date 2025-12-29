document.addEventListener("DOMContentLoaded", async () => {
    const registrationForm = document.getElementById('volleyballRegistrationForm'); 
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.volleyball-tab-content');
    const toastContainer = document.querySelector('.toast-container');
    const teamSelect = document.getElementById('playerClass');
    const allTeams = [
        'A1','A2','A3','A4','A5','A6','A7','A8',
        'B1','B2','B3','B4','B5','B6','B7','B8',
        'C1','C2','C3','C4','C5','C6','C7','C8'
    ];

    // === دوال مساعدة (Toast, LoadPlayers, LoadMatches, LoadLeaderboard) ===

    // Toast function
    function showToast(message, type = 'success') {
        const id = Date.now();
        const html = `
            <div id="t${id}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        if (toastContainer) {
            toastContainer.insertAdjacentHTML('beforeend', html);
            new bootstrap.Toast(document.getElementById(`t${id}`)).show();
        }
    }

    // تحميل اللاعبين المسجلين في كروت الفرق
    async function loadPlayers() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/volleyball');
            const players = await res.json();
            allTeams.forEach(id => {
                const ul = document.getElementById(`team-${id}`);
                if (ul) { ul.innerHTML = ''; ul.parentElement.style.display = 'none'; }
            });
            players.forEach(p => {
                const ul = document.getElementById(`team-${p.team}`);
                if (ul) {
                    const li = document.createElement('li');
                    li.textContent = p.name;
                    ul.appendChild(li);
                    ul.parentElement.style.display = 'block';
                }
            });
        } catch { showToast("Failed to sync players with server", "danger"); }
    }

    // تحميل القرعة (المباريات)
    async function loadMatches() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/volleyball/matches');
            const matches = await res.json();
            const matchList = document.querySelector('.match-list');
            if (!matchList) return; 
            matchList.innerHTML = '';
            if (matches.length === 0) {
                matchList.innerHTML = '<p class="text-center text-secondary">No matches generated yet.</p>';
                return;
            }
            matches.forEach(m => {
                matchList.innerHTML += `
                    <div class="match-item p-3 mb-3 bg-dark rounded border border-primary">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-white">${m.home}</span>
                            <span class="text-primary fs-5">
                                ${m.isFinished ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                            </span>
                            <span class="fw-bold text-white">${m.away}</span>
                        </div>
                    </div>`;
            });
        } catch (err) { console.error("Failed to load volleyball matches", err); }
    }

    // تحميل جدول الترتيب (ليدربورد)
    async function loadLeaderboard() {
        const tbody = document.getElementById('leaderboard-tbody'); 
        if (!tbody) return; 
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/volleyball/leaderboard');
            const teams = await res.json();
            tbody.innerHTML = ''; 
            teams.forEach((t, i) => {
                const goalDifference = t.goalsFor - t.goalsAgainst; 
                tbody.innerHTML += `
                    <tr data-team="${t.team}">
                        <td>${i + 1}</td>
                        <td>${t.team}</td>
                        <td>${t.played}</td>
                        <td>${t.won}</td>
                        <td>${t.drawn}</td>
                        <td>${t.lost}</td>
                        <td>${t.goalsFor}</td>
                        <td>${t.goalsAgainst}</td>
                        <td>${goalDifference}</td>
                        <td>${t.points}</td>
                    </tr>`;
            });
        } catch (err) { console.error("Failed to load volleyball leaderboard", err); }
    }
    
    // === نهاية تعريف الدوال المساعدة ===


    // ملء السيلكت بكل الفرق
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="" selected disabled>Select your class</option>';
        allTeams.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.textContent = t;
            teamSelect.appendChild(option);
        });
    }

    // Tabs navigation (الآن الدوال loadMatches و loadLeaderboard معرفة وجاهزة للاستخدام هنا)
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            const targetElement = document.getElementById(target);
            if (targetElement) {
                sections.forEach(s => s.classList.add('d-none'));
                tabs.forEach(t => t.classList.remove('active'));
                targetElement.classList.remove('d-none');
                tab.classList.add('active');
                
                if (target === 'draw-results-section') loadMatches();
                if (target === 'leaderboard-section') loadLeaderboard();
            }
        });
    });


    // فورم التسجيل
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('playerName').value.trim();
            const password = document.getElementById('playerPassword').value.trim();
            const team = document.getElementById('playerClass').value;

            if (!name || !password || !team) return showToast("Fill all fields", "danger");
            try {
                const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/volleyball/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, password, team })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                showToast(data.message, "success");
                registrationForm.reset();
                await loadPlayers();
            } catch (err) {
                showToast(err.message, "danger");
            }
        });
    }

    // التنفيذ الأولي عند تحميل الصفحة
    await loadPlayers();
    await loadLeaderboard(); 
    await loadMatches();
});
