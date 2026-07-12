(function () {
    // رابط السيرفر الموحد المشفر والآمن
    const API_BASE_URL = "https://c6e230aa-2288-4e21-aa21-91d5b1c79976-00-14cdwdyu5mipe.janeway.replit.dev/api";

    document.getElementById("year").textContent = new Date().getFullYear();

    // ---- إدارة الجلسات (التوكن المشفر) ----
    function getSession() {
        try {
            return JSON.parse(localStorage.getItem("elking_session") || "null");
        } catch (e) {
            return null;
        }
    }

    function setSession(session) {
        localStorage.setItem("elking_session", JSON.stringify(session));
        renderAuthStatus();
    }

    function clearSession() {
        localStorage.removeItem("elking_session");
        renderAuthStatus();
    }

    function renderAuthStatus() {
        const session = getSession();
        const pill = document.getElementById("session-pill");
        const pillText = document.getElementById("session-pill-text");
        
        if (session && session.token) {
            pillText.textContent = `مرحبًا: ${escapeHtml(session.phone)}`;
            pill.classList.add("visible");
            // تحويل المستخدم للوحة التحكم تلقائياً لو مسجل دخول
            revealDashboard(session.phone, session.balance || 0);
        } else {
            pill.classList.remove("visible");
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ---- سحب الباقات الحية من التليجرام وعرضها في الموقع ----
    async function loadPackages() {
        const grid = document.querySelector(".telecom-grid");
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();

            if (!data || data.length === 0) {
                return; // لو مفيش باقات سيب التصميم الافتراضي الشيك شغال
            }

            // تحديث الكروت بناءً على البيانات القادمة من ريبليت والذكاء الاصطناعي
            grid.innerHTML = data.map(pkg => {
                let logoImg = "we.png";
                if(pkg.company.toLowerCase() === "vodafone") logoImg = "vodafone.png";
                if(pkg.company.toLowerCase() === "orange") logoImg = "orange.png";
                if(pkg.company.toLowerCase() === "etisalat") logoImg = "etisalat.png";

                return `
                    <div class="telecom-card">
                        <div class="telecom-logo">
                            <img src="assets/logos/${logoImg}" alt="شعار ${pkg.company}" onerror="this.src='https://placehold.co/240x240/ffffff/0b1220?text=${pkg.company}'" />
                        </div>
                        <div class="telecom-name">${escapeHtml(pkg.company)}</div>
                        <div class="telecom-desc">${escapeHtml(pkg.name)}</div>
                        <div class="telecom-tag">${escapeHtml(pkg.price)} جنيه</div>
                    </div>
                `;
            }).join("");
        } catch (e) {
            console.log("جاري استخدام العرض الافتراضي للباقات.");
        }
    }

    // ---- إنشاء الحساب (Register) ----
    document.getElementById("register-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById("register-alert");
        alertBox.classList.remove("visible");

        const phone = document.getElementById("register-phone").value.trim();
        const password = document.getElementById("register-password").value;

        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                alertBox.textContent = data.message || "حدث خطأ أثناء إنشاء الحساب.";
                alertBox.className = "form-alert error visible";
                return;
            }

            setSession({ token: data.token, phone: data.user.phone, balance: data.user.balance });
            alertBox.textContent = "✅ تم إنشاء الحساب بنجاح!";
            alertBox.className = "form-alert success visible";
            
            setTimeout(() => {
                revealDashboard(data.user.phone, data.user.balance);
            }, 700);
        } catch (err) {
            alertBox.textContent = "تعذر الاتصال بالسيرفر. حاول مجدداً.";
            alertBox.className = "form-alert error visible";
        }
    });

    // ---- تسجيل الدخول (Login) ----
    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById("login-alert");
        alertBox.classList.remove("visible");

        const phone = document.getElementById("login-phone").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                alertBox.textContent = data.message || "رقم الهاتف أو كلمة المرور غير صحيحة.";
                alertBox.className = "form-alert error visible";
                return;
            }

            setSession({ token: data.token, phone: data.user.phone, balance: data.user.balance });
            revealDashboard(data.user.phone, data.user.balance);
        } catch (err) {
            alertBox.textContent = "تعذر الاتصال بالسيرفر. حاول مجدداً.";
            alertBox.className = "form-alert error visible";
        }
    });

    function revealDashboard(phone, balance) {
        document.getElementById("auth-section").classList.add("hidden-fade");
        const dash = document.getElementById("dashboard-section");
        dash.style.display = "block";
        requestAnimationFrame(() => dash.classList.add("revealed"));
        document.getElementById("dash-phone-display").textContent = "رقم الحساب: " + phone;
        
        // إظهار الرصيد الفعلي القادم من السيرفر في كارت معلومات الحساب
        const infoGrid = document.querySelector(".info-grid");
        if (!document.getElementById("user-balance-card")) {
            const balanceCard = document.createElement("div");
            balanceCard.className = "info-card";
            balanceCard.id = "user-balance-card";
            balanceCard.innerHTML = `
                <h4 style="color: var(--gold-400)">💰 رصيدك الحالي</h4>
                <p style="font-size: 20px; font-weight: bold; color: #fff;">${balance} جنيه مِصري</p>
            `;
            infoGrid.insertBefore(balanceCard, infoGrid.firstChild);
        }
    }

    window.handleLogout = function() {
        clearSession();
        document.getElementById("dashboard-section").classList.remove("revealed");
        setTimeout(() => {
            document.getElementById("dashboard-section").style.display = "none";
            document.getElementById("auth-section").classList.remove("hidden-fade");
            document.getElementById("login-form").reset();
            document.getElementById("register-form").reset();
            window.switchTab("login");
        }, 350);
    }

    // تشغيل الفحص الأولي للبيانات
    renderAuthStatus();
    loadPackages();
})();
