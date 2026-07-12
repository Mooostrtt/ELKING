(function () {
    // الرابط الفعلي والشغال 100% من واقع الصورة الأخيرة لريبليت
    const API_BASE_URL = "https://c6e230aa-2288-4e21-aa21-91d5b1c79976-00-14cdwdyu5mipe.janeway.replit.dev/api";

    document.getElementById("year").textContent = new Date().getFullYear();

    // تشغيل وإخفاء كلمة السر (العين)
    window.togglePassword = function(id) {
        const input = document.getElementById(id);
        if (input.type === "password") {
            input.type = "text";
        } else {
            input.type = "password";
        }
    };

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem("elking_session") || "null");
        } catch (e) { return null; }
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
            revealDashboard(session.phone, session.balance || 0);
        } else {
            pill.classList.remove("visible");
        }
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function switchTab(tab) {
        const loginTab = document.getElementById("tab-login");
        const registerTab = document.getElementById("tab-register");
        const loginForm = document.getElementById("login-form");
        const registerForm = document.getElementById("register-form");

        if (tab === "login") {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        } else {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
        }
        hideAlert("login-alert");
        hideAlert("register-alert");
    }

    function showFieldError(inputId, errorId) {
        document.getElementById(inputId).classList.add("invalid");
        document.getElementById(errorId).classList.add("visible");
    }

    function clearFieldError(inputId, errorId) {
        document.getElementById(inputId).classList.remove("invalid");
        document.getElementById(errorId).classList.remove("visible");
    }

    function showAlert(alertId, message, type) {
        const el = document.getElementById(alertId);
        el.textContent = message;
        el.classList.remove("error", "success");
        el.classList.add(type, "visible");
    }

    function hideAlert(alertId) {
        const el = document.getElementById(alertId);
        if (el) { el.classList.remove("visible"); el.textContent = ""; }
    }

    async function loadPackages() {
        const grid = document.querySelector(".telecom-grid");
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();
            if (!data || data.length === 0) return;

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
        } catch (e) { console.log("عرض افتراضي للباقات."); }
    }

    // إنشاء الحساب المريح والسريع
    document.getElementById("register-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById("register-alert");
        alertBox.classList.remove("visible");

        const phone = document.getElementById("register-phone").value.trim();
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-password-confirm").value;

        clearFieldError("register-phone", "register-phone-error");
        clearFieldError("register-password", "register-password-error");
        clearFieldError("register-password-confirm", "register-password-confirm-error");

        let hasError = false;
        if (!/^01\d{9}$/.test(phone)) { showFieldError("register-phone", "register-phone-error"); hasError = true; }
        
        // الشروط المريحة للزبون: كلمة المرور لا تقل عن 4 خانات
        if (password.length < 4 || password === "123456") { 
            showFieldError("register-password", "register-password-error"); 
            hasError = true; 
        }
        if (password !== confirmPassword) { 
            showFieldError("register-password-confirm", "register-password-confirm-error"); 
            hasError = true; 
        }

        if (hasError) return;

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
            setTimeout(() => { revealDashboard(data.user.phone, data.user.balance); }, 700);
        } catch (err) {
            alertBox.textContent = "تعذر الاتصال بالسيرفر. يرجى التأكد من تشغيل Replit.";
            alertBox.className = "form-alert error visible";
        }
    });

    // تسجيل الدخول
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
            alertBox.textContent = "تعذر الاتصال بالسيرفر. يرجى التأكد من تشغيل Replit.";
            alertBox.className = "form-alert error visible";
        }
    });

    function revealDashboard(phone, balance) {
        document.getElementById("auth-section").classList.add("hidden-fade");
        const dash = document.getElementById("dashboard-section");
        dash.style.display = "block";
        requestAnimationFrame(() => dash.classList.add("revealed"));
        document.getElementById("dash-phone-display").textContent = "رقم الحساب: " + phone;
        
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
        } else {
            document.querySelector("#user-balance-card p").textContent = `${balance} جنيه مِصري`;
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

    window.switchTab = switchTab;
    renderAuthStatus();
    loadPackages();
})();

