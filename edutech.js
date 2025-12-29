document.addEventListener("DOMContentLoaded", async () => {
    const eduForm = document.getElementById('eduRegistrationForm');
    const tabs = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.edu-tab-content');
    const downloadBtn = document.getElementById('downloadBtn');

    if (downloadBtn) {
        downloadBtn.onclick = downloadCertificate;
    }

    // فحص الفائز أول ما الصفحة تفتح
    checkWinner();

    // ================== Tabs Logic ==================
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            const targetEl = document.getElementById(target);

            if (!targetEl) return;

            sections.forEach(s => s.classList.add('d-none'));
            tabs.forEach(t => t.classList.remove('active'));

            targetEl.classList.remove('d-none');
            tab.classList.add('active');

            if (target === 'participants') loadParticipants();
            if (target === 'winner') checkWinner();
        });
    });

    // ================== Register Project ==================
    if (eduForm) {
        eduForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('eduName').value.trim();
            const password = document.getElementById('eduPassword').value.trim();
            const userClass = document.getElementById('eduClass').value.trim();
            const projectDescription = document.getElementById('eduDesc').value.trim();
            const projectLink = document.getElementById('eduLink').value.trim();

            try {
                const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, password, userClass, projectDescription, projectLink })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    localStorage.setItem('username', name);
                    eduForm.reset();
                }
            } catch {
                alert("Server Error");
            }
        });
    }

    // ================== Load Participants ==================
    async function loadParticipants() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech');
            const participants = await res.json();

            const tbody = document.getElementById('participantsTableBody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (!participants.length) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="text-center text-secondary">
                            No competitors yet
                        </td>
                    </tr>`;
                return;
            }

            participants.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.userClass}</td>
                    </tr>
                `;
            });
        } catch (err) {
            console.error("Failed to load participants:", err);
        }
    }

    // ================== Winner Check ==================
    async function checkWinner() {
        try {
            const res = await fetch('https://final-backend-production-ae08.up.railway.app/api/edutech/winner');
            const winner = await res.json();

            if (!winner || !winner.name) return;

            const winnerInfo = document.getElementById('winnerInfo');
            if (winnerInfo) {
                winnerInfo.innerHTML = `
                    <h2 class="fw-bold text-success">${winner.name}</h2>
                    <p class="text-secondary">Class ${winner.userClass}</p>
                `;
            }

            const currentUser = localStorage.getItem('username');

            if (currentUser && currentUser.trim() === winner.name.trim()) {
                const certTab = document.getElementById('certTab');
                if (certTab) {
                    certTab.classList.remove('d-none');
                    document.getElementById('winnerCertName').innerText =
                        winner.name.toUpperCase();
                }
            }
        } catch (err) {
            console.error("Winner check error:", err);
        }
    }

    // ================== Download Certificate ==================
    async function downloadCertificate() {
        const certArea = document.getElementById('certArea');
        const winnerName = document.getElementById('winnerCertName').innerText;

        if (typeof html2canvas === 'undefined') {
            alert("Preparing certificate...");
            window.print();
            return;
        }

        try {
            const canvas = await html2canvas(certArea, {
                scale: 3,
                useCORS: true,
                backgroundColor: null
            });

            const link = document.createElement('a');
            link.download = `EDU_TECH_${winnerName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Certificate capture failed:", err);
            window.print();
        }
    }
});
