document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-tab-content');
    const toggleRegBtn = document.getElementById("toggleRegistration");

    // === 1. تنقل التابات ===
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            const targetEl = document.getElementById(target);
            if (targetEl) {
                sections.forEach(s => s.classList.add('d-none'));
                tabs.forEach(t => t.classList.remove('active'));
                targetEl.classList.remove('d-none');
                tab.classList.add('active');

                if (target === 'manage-projects') loadProjects();
                if (target === 'winner-status') loadCurrentWinner();
            }
        });
    });

    // === 2. قفل وفتح التسجيل (تم الإصلاح هنا) ===
    async function updateRegBtnUI() {
        if (!toggleRegBtn) return; // حماية لو الزرار مش موجود
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/settings');
            const data = await res.json();
            
            const isOpen = data.registrationOpen;
            toggleRegBtn.innerText = isOpen ? "Close Registration Portal 🔒" : "Open Registration Portal 🔓";
            // استخدام الستايل الأحمر الغامق اللي طلبته
            toggleRegBtn.className = isOpen ? "btn btn-outline-danger w-100 py-3 fw-bold" : "btn btn-success w-100 py-3 fw-bold";
            
            // إضافة ستايل إضافي للأحمر الغامق
            if(isOpen) {
                toggleRegBtn.style.borderColor = "#4a0000";
                toggleRegBtn.style.color = "#8b0000";
            } else {
                toggleRegBtn.style.borderColor = "";
                toggleRegBtn.style.color = "";
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    }

    // جلب الحالة عند التحميل
    updateRegBtnUI();

    if (toggleRegBtn) {
        toggleRegBtn.onclick = async () => {
            try {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/toggle-registration', { 
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    await updateRegBtnUI(); // تحديث فوري
                }
            } catch (err) {
                alert("Server Connection Error");
            }
        };
    }

    // === 3. تحميل المشاريع واختيار الفائز ===
    async function loadProjects() {
        const container = document.getElementById('admin-projects-list');
        if (!container) return;
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech');
            const projects = await res.json();

            container.innerHTML = projects.map(p => `
                <div class="project-card p-3 mb-3 border border-secondary rounded bg-black">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h4 class="text-danger mb-1">${p.name} <span class="badge bg-secondary fs-6">${p.userClass}</span></h4>
                            <p class="text-white mb-2">${p.projectDescription}</p>
                            ${p.projectLink ? `<a href="${p.projectLink}" target="_blank" class="btn btn-sm btn-outline-info">View Project Link</a>` : ''}
                        </div>
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-warning btn-sm fw-bold" onclick="setWinner('${p._id}')">🏆 Set Winner</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteProject('${p._id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (err) { console.error(err); }
    }

    // === 4. تعيين الفائز ===
    window.setWinner = async (id) => {
        if (!confirm("Declare this participant as the winner?")) return;
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/set-winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) {
            alert("Winner Crowned! Certificate generated.");
            loadProjects();
        }
    };

    // === 5. حذف مشارك ===
    window.deleteProject = async (id) => {
        if (!confirm("Delete submission?")) return;
        await fetch(`https://final-backend-production-ae08.up.railway.app
/api/edutech/delete/${id}`, { method: 'DELETE' });
        loadProjects();
    };

    // === 6. عرض الفائز الحالي ===
    async function loadCurrentWinner() {
        const container = document.getElementById('currentWinnerDisplay');
        if (!container) return;
        const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/winner');
        const winner = await res.json();
        if (winner) {
            container.innerHTML = `
                <h1 class="text-warning display-4 fw-bold">${winner.name}</h1>
                <p class="text-white fs-5">Class: ${winner.userClass}</p>
                <p class="text-danger italic fs-6">"${winner.projectDescription}"</p>
            `;
        }
    }
});
