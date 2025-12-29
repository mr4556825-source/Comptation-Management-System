document.addEventListener("DOMContentLoaded", async () => {
    const registrationForm = document.getElementById('armRegistrationForm'); 
    const toastContainer = document.querySelector('.toast-container');
    const playersTableBody = document.getElementById('playersTableBody'); 

    function showToast(message, type = 'success') {
        const id = Date.now();
        const html = `
            <div id="t${id}" class="toast align-items-center text-white bg-${type} border-0" role="alert" data-bs-delay="3000">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        if (toastContainer) {
            toastContainer.insertAdjacentHTML('beforeend', html);
            const toast = new bootstrap.Toast(document.getElementById(`t${id}`));
            toast.show();
        }
    }

    // منطق التبديل بين التابات
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.arm-tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            const targetElement = document.getElementById(target);
            if (targetElement) {
                sections.forEach(s => s.classList.add('d-none'));
                tabs.forEach(t => t.classList.remove('active'));
                targetElement.classList.remove('d-none');
                tab.classList.add('active');
                
                if (target === 'ranking') loadLeaderboard();
                if (target === 'matches') loadMatches();
            }
        });
    });

    // === دالة تحميل جدول الترتيب (Load Leaderboard) ===
    async function loadLeaderboard() {
        try {
            const res = await fetch(`https://final-backend-production-ae08.up.railway.app/api/armwrestling/leaderboard?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            
            const players = await res.json();
            if (playersTableBody) {
                playersTableBody.innerHTML = '';
                
                players.forEach((p, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td> 
                        <td>${p.player}</td>
                        <td>${p.won + p.lost}</td>
                        <td class="text-success fw-bold">${p.won}</td>
                        <td class="text-danger fw-bold">${p.lost}</td>
                    `; 
                    playersTableBody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error("Load leaderboard error:", err);
            showToast("Failed to sync players stats with server", "danger");
        }
    }
    
    // === دالة تحميل المباريات لليوزر ===
    async function loadMatches() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/armwrestling/matches');
            const matches = await res.json();
            const matchList = document.querySelector('.match-list');
            
            if (!matchList) return; 
            matchList.innerHTML = '';

            if (matches.length === 0) {
                matchList.innerHTML = '<p class="text-center text-secondary">No matches scheduled yet.</p>';
                return;
            }

            matches.forEach(m => {
                matchList.innerHTML += `
                    <div class="match-item p-3 mb-3 bg-dark rounded border border-danger">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-white">${m.player1}</span>
                            <span class="text-danger mx-2">${m.isFinished ? 'VS' : 'VS'}</span>
                            <span class="fw-bold text-white">${m.player2}</span>
                        </div>
                        ${m.isFinished ? `<div class="text-center mt-2 text-warning">Winner: ${m.winner}</div>` : ''}
                    </div>`;
            });
        } catch (err) {
            console.error("Failed to load matches", err);
        }
    }


    // معالجة حدث التسجيل
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('playerName').value.trim();
            const password = document.getElementById('playerPassword').value.trim();
            
            // **الإصلاح هنا:** التأكد من قراءة قيمة userClass بشكل صحيح
            const classInput = document.getElementById('playerClass');
            const userClass = classInput ? classInput.value : "General"; 

            if (!name || !password) {
                showToast("Please fill all fields", "danger");
                return;
            }

            try {
                const res = await fetch("https://final-backend-production-ae08.up.railway.app/api/armwrestling/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, password, userClass }) 
                });
                
                const data = await res.json();
                
                if (!res.ok) { 
                    // لو فيه details جاية من السيرفر الجديد بتاعنا استخدمها
                    throw new Error(data.details || data.message || "Registration failed"); 
                }

                showToast(data.message, "success");
                registrationForm.reset();
                loadLeaderboard();
            } catch (err) { 
                console.error("Submit error:", err);
                showToast(err.message || "Server error. Please try again.", "danger"); 
            }
        });
    }

    // تحميل البيانات عند بداية تشغيل الصفحة
    loadLeaderboard();
    loadMatches();
});
