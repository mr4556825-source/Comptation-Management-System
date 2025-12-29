document.addEventListener("DOMContentLoaded", () => {
    const regLink = document.getElementById("reg");
    const logLink = document.getElementById("log");
    const wraper = document.getElementById("wraper");
    const logoCont = document.getElementById("logo-container");
    const loginSection = document.getElementById("login");
    const registerSection = document.getElementById("newacc");

    // رسائل الأخطاء
    const loginP = document.getElementById("login-p");
    const loginPP = document.getElementById("login-pp");
    const newaccP = document.getElementById("newacc-p");
    const newaccPP = document.getElementById("newacc-pp");

    // Reset errors
    const clearErrors = () => {
        loginP.textContent = "";
        loginPP.textContent = "";
        newaccP.textContent = "";
        newaccPP.textContent = "";
    };

    // -------- Swap Forms --------
    regLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearErrors();

        if (window.innerWidth >= 768) {
            wraper.style.transform = "translateX(100%)";
            logoCont.style.transform = "translateX(-100%)";
        }

        loginSection.classList.add("d-none");
        registerSection.classList.remove("d-none");
    });

    logLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearErrors();

        if (window.innerWidth >= 768) {
            wraper.style.transform = "translateX(0%)";
            logoCont.style.transform = "translateX(0%)";
        }

        registerSection.classList.add("d-none");
        loginSection.classList.remove("d-none");
    });

  // ================= CONFIGURATION =================
// فك الكومنت عن اللينك اللي هتحتاجه
const API_URL = "https://final-backend-production-ae08.up.railway.app/api/users"; 
// const API_URL = "satisfied-happiness-production.up.railway.app";



// ================= REGISTER LOGIC =================
document.getElementById("newacc-btn").addEventListener("click", async (e) => {
    e.preventDefault();
    const name = document.getElementById("newacc-name").value.trim();
    const password = document.getElementById("newacc-password").value.trim();

    if (!name || !password) {
        newaccP.textContent = "All fields required!";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password })
        });
        const data = await res.json();

        if (res.ok) {
            newaccP.style.color = "green";
            newaccP.textContent = "Registered! Please Login.";
            // اختيارياً: ممكن تحوله للوجين تلقائياً هنا
        } else {
            newaccP.style.color = "red";
            newaccP.textContent = data.message;
        }
    } catch (err) {
        newaccP.textContent = "Server Error";
    }
});
// ================= LOGIN LOGIC =================
document.getElementById("login-btn").addEventListener("click", async (e) => {
    e.preventDefault();
    const name = document.getElementById("login-name").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!name || !password) {
        loginP.textContent = "Please enter name and password";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password })
        });
        const data = await res.json();

        if (res.ok) {
            // --- التعديل هنا لضمان عمل الشهادة ---
            localStorage.setItem("loggedInUser", data.name);
            localStorage.setItem("username", data.name); // ضفنا ده عشان كود EDU TECH
            localStorage.setItem("userRole", data.role);

            // 2. التوجيه (Redirect)
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                // Fallback
                window.location.href = (data.role === "admin") ? "admin.html" : "user.html";
            }
        } else {
            loginP.style.color = "red";
            loginP.textContent = data.message;
        }
    } catch (err) {
        loginP.textContent = "Server is not responding";
    }
});

});
