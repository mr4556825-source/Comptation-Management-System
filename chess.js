document.addEventListener("DOMContentLoaded", async () => {
    const registrationForm = document.getElementById('playerRegistrationForm');
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.chess-tab-content');
    const toastContainer = document.querySelector('.toast-container');
    const playersTableBody = document.getElementById('playersTableBody');
    const matchesListContainer = document.querySelector('.match-list');
    const rankingTableBody = document.getElementById('rankingTableBody');

    // ... (دالة showToast هنا زي ما هي) ...
    function showToast(message, type = 'success') {
        const toastHtml = `<div class="toast align-items-center text-white bg-${type} border-0" role="alert" data-bs-delay="3000"><div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
        if (toastContainer) {
            toastContainer.insertAdjacentHTML('beforeend', toastHtml);
            const toastEl = toastContainer.lastElementChild;
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        }
    }


    // === منطق التبديل بين التابات (تم إصلاح الاستدعاء) ===
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            sections.forEach(sec => sec.classList.add('d-none'));
            tabs.forEach(t => t.classList.remove('active'));
            
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.remove('d-none');
                tab.classList.add('active');

                // === هنا بننادي على الدوال لما التاب يتغير ===
                if (targetId === 'players') loadPlayers(); 
                if (targetId === 'matches') loadMatches(); 
                if (targetId === 'ranking') loadLeaderboard(); // تم إصلاح الاستدعاء هنا
            }
        });
    });

    // === دالة جلب اللاعبين المسجلين ===
    async function loadPlayers() {
        if (!playersTableBody) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess');
            const players = await res.json();
            playersTableBody.innerHTML = players.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.userClass}</td>
                </tr>
            `).join('');
        } catch (err) {
            console.error("Error loading players list:", err);
            showToast("Error loading players list", "danger");
        }
    }

    // === دالة جلب المباريات ===
    async function loadMatches() {
        if (!matchesListContainer) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/matches');
            const matches = await res.json();
            
            matchesListContainer.innerHTML = matches.map(m => `
                <div class="match-item p-3 mb-3 bg-dark rounded border ${m.isFinished ? 'border-secondary' : 'border-primary'}">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-white">${m.player1}</span>
                        <span class="text-primary mx-2">VS</span>
                        <span class="fw-bold text-white">${m.player2}</span>
                    </div>
                    ${m.isFinished ? `<div class="text-center mt-2 text-warning">Winner: ${m.winner}</div>` : ''}
                </div>
            `).join('');
        } catch (err) {
            console.error("Failed to load matches:", err);
        }
    }

    // === دالة جلب الليدربورد بالترتيب الجديد ===
    async function loadLeaderboard() {
        if (!rankingTableBody) return; 

        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/leaderboard');
            const players = await res.json();
            
            rankingTableBody.innerHTML = players.map((p, index) => `
                <tr>
                    <td>${index + 1}</td> <!-- المركز -->
                    <td class="fw-bold">${p.player}</td> <!-- الاسم -->
                    <td>${p.played}</td> <!-- المباريات -->
                    <td class="text-success fw-bold">${p.won}</td> <!-- الفوز -->
                    <td class="text-danger fw-bold">${p.lost}</td> <!-- الخسارة -->
                </tr>
            `).join('');
            
        } catch (err) {
            console.error("Load leaderboard error:", err);
            showToast("Failed to sync player stats with server", "danger");
        }
    }


    // ... (بقية كود التسجيل زي ما هو سليم) ...
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('playerName').value.trim();
            const password = document.getElementById('playerPassword').value.trim();
            const userClass = document.getElementById('playerClass').value; 

            try {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/chess/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, password, userClass })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Registration failed");
                }

                showToast(data.message, "success");
                registrationForm.reset();
                loadPlayers(); 
            } catch (err) {
                console.error("Submit error:", err);
                showToast(err.message || "Server error. Please try again later.", "danger");
            }
        });
    }

    // التحميل المبدئي لأول تاب بس
    loadPlayers(); 
});
