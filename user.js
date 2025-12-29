document.addEventListener("DOMContentLoaded", () => {
    // === 1. التحقق من تسجيل الدخول وعرض الاسم ===
    const usernameElement = document.getElementById("username-user");
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (loggedInUser) {
        usernameElement.textContent = loggedInUser;
    } else {
        // لو مفيش مستخدم مسجل يرجعه لصفحة اللوجين فوراً
        window.location.href = "index.html";
    }

    // === 2. منطق التنقل بين السكاشن (SPA) ===
    const navLinks = document.querySelectorAll(".nav-links li");
    const sections = document.querySelectorAll(".content-section");

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            const target = link.getAttribute("data-target");

            // أ. تحديث شكل اللينك النشط
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            // ب. إخفاء كل السكاشن وإظهار المختار
            sections.forEach(section => {
                section.classList.add("d-none");
                section.style.opacity = "0"; // للأنيميشن
            });

            const activeSection = document.getElementById(target);
            if (activeSection) {
                activeSection.classList.remove("d-none");
                
                // أنيميشن ظهور ناعم لعام 2025
                setTimeout(() => {
                    activeSection.style.transition = "opacity 0.5s ease-in-out";
                    activeSection.style.opacity = "1";
                }, 50);
            }
        });
    });

    // === 3. منطق تسجيل الخروج ===
    const logoutBtn = document.getElementById("logout-user-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            // حذف البيانات من الـ LocalStorage
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("userRole"); 

            // التوجيه لصفحة تسجيل الدخول
            window.location.href = "index.html";
        });
    }
});
