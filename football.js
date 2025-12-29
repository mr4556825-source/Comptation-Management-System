document.addEventListener("DOMContentLoaded", async () => {
    const registrationForm = document.getElementById('playerRegistrationForm');
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.football-tab-content');
    const toastContainer = document.querySelector('.toast-container');
    const teamSelect = document.getElementById('playerClass');
    const leagueTableBody = document.querySelector('.league-table tbody'); // تم تعديل الاسم هنا عشان ميتعارضش

    fetch("/api/football/settings")
  .then(res => res.json())
  .then(settings => {
    if (!settings.registrationOpen) {
      document.getElementById("footballForm").style.display = "none";
      document.getElementById("closedMsg").style.display = "block";
    }
  });


    function showToast(message, type = 'success') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0"
                 role="alert" aria-live="assertive" aria-atomic="true"
                 data-bs-delay="3000">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button"
                        class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            sections.forEach(sec => sec.classList.add('d-none'));
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(targetId).classList.remove('d-none');
            tab.classList.add('active');
        });
    });

    let players = [];

    async function loadPlayers() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football');
            const players = await res.json();

            // نخفي كل فرق Teams & Formations افتراضياً
            ['A1','A2','A3','A4','A5','A6','A7','A8',
             'B1','B2','B3','B4','B5','B6','B7','B8',
             'C1','C2','C3','C4','C5','C6','C7','C8'].forEach(teamId => {
                const ul = document.getElementById(`team-${teamId}`);
                const teamDiv = ul ? ul.parentElement : null;
                if (ul) ul.innerHTML = '';
                if (teamDiv) teamDiv.style.display = 'none';
             });

            // حط اللاعبين في القوائم وفعل الفرق اللي فيها لاعبين
            const activeTeams = new Set();
            players.forEach(p => {
                const ul = document.getElementById(`team-${p.team}`);
                if (ul) {
                    const li = document.createElement('li');
                    li.textContent = p.name;
                    ul.appendChild(li);
                    activeTeams.add(p.team);

                    // خلي الـ teamDiv يظهر
                    const teamDiv = ul.parentElement;
                    if (teamDiv) teamDiv.style.display = 'block';
                }
            });

            // تحديث جدول الرانك
            activeTeams.forEach(team => {
                if (!leagueTableBody.querySelector(`[data-team="${team}"]`)) {
                    const tr = document.createElement('tr');
                    tr.dataset.team = team;
                    tr.innerHTML = `
                        <td>${leagueTableBody.children.length + 1}</td>
                        <td>${team}</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>`;
                    leagueTableBody.appendChild(tr);
                }
            });

        } catch (err) {
            showToast("Failed to load players from server", "danger");
        }
    }

    // === الفانكشن الجديدة للتحقق من حالة التسجيل ===
   // مكان checkRegistrationStatus()
async function checkRegistrationStatus() {
    try {
        const response = await fetch('/api/football/settings');
        const settings = await response.json(); // { registrationOpen: true/false }

        const submitBtn = document.getElementById('register-submit-btn');
        const closedAlert = document.getElementById('registration-closed-alert');

        if (!settings.registrationOpen) {
            submitBtn.classList.add('d-none');        // اخفاء الزر
            closedAlert.classList.remove('d-none');   // اظهار رسالة التسجيل مقفول
        } else {
            submitBtn.classList.remove('d-none');    // اظهار الزر
            closedAlert.classList.add('d-none');     // اخفاء رسالة المقفول
        }

    } catch (err) {
        console.warn("Cannot fetch registration settings", err);
    }
}

    await loadPlayers();
    await checkRegistrationStatus(); // استدعاء التحقق عند تحميل الصفحة

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('playerName').value.trim();
        const password = document.getElementById('playerPassword').value.trim();
        const team = document.getElementById('playerClass').value;

        if (!name || !password || !team) {
            showToast("Please fill all fields", "danger");
            return;
        }

        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, team })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Failed to register player", "danger");
                return;
            }

            showToast(data.message, "success");
            registrationForm.reset();
            await loadPlayers();

        } catch {
            showToast("Server error. Please try again.", "danger");
        }
    });
    async function loadMatches() {
    try {
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/matches'); // أو relative: '/api/football/matches'
        const matches = await res.json();
        const matchList = document.querySelector('.match-list');
        matchList.innerHTML = '';

        matches.forEach(m => {
            matchList.innerHTML += `
                <div class="match-item p-3 mb-3 bg-dark rounded border border-success">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-white">${m.home}</span>
                        <span class="text-success fs-5">${m.homeScore} VS ${m.awayScore}</span>
                        <span class="fw-bold text-white">${m.away}</span>
                    </div>
                </div>`;
        });
    } catch (err) {
        console.error("Failed to load matches", err);
    }
}
    await loadMatches();
});
async function loadLeaderboard() {
    const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/football/leaderboard');
    const teams = await res.json();
    const tbody = document.querySelector('.league-table tbody');
    tbody.innerHTML = '';

    teams.forEach((t, i) => {
        tbody.innerHTML += `
            <tr data-team="${t.team}">
                <td>${i+1}</td>
                <td>${t.team}</td>
                <td>${t.played}</td>
                <td>${t.won}</td>
                <td>${t.drawn}</td>
                <td>${t.lost}</td>
                <td>${t.goalsFor}</td>
                <td>${t.goalsAgainst}</td>
                <td>${t.goalsFor - t.goalsAgainst}</td>
                <td>${t.points}</td>
            </tr>
        `;
    });
}

// استدعاء عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    await loadLeaderboard();
});
