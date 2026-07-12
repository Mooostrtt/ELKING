(function () {
    // Public API base URL — the Replit "API Server" artifact, the only
    // publicly reachable service in this project. CORS is enabled there,
    // so this GitHub Pages site can call it directly.
    const API_BASE_URL = "https://c6e230aa-2288-4e21-aa21-91d5b1c79976-00-14cdwdyu5mipe.janeway.replit.dev/api";

    document.getElementById("year").textContent = new Date().getFullYear();

    const tabs = document.querySelectorAll("nav.tabs button");
    const views = document.querySelectorAll(".view");

    function showView(name) {
        tabs.forEach(b => b.classList.toggle("active", b.dataset.view === name));
        views.forEach(v => v.classList.toggle("active", v.id === "view-" + name));
        if (name === "profile") renderProfile();
    }

    tabs.forEach(btn => {
        btn.addEventListener("click", () => showView(btn.dataset.view));
    });

    // ---- Password visibility toggle (eye icon) ----
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                btn.textContent = "🙈";
            } else {
                input.type = "password";
                btn.textContent = "👁️";
            }
        });
    });

    // ---- Session helpers (server-issued token, not raw passwords) ----
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
        const box = document.getElementById("authStatus");
        if (session && session.token) {
            box.innerHTML = `<span>👋 مرحبًا، ${escapeHtml(session.name || session.phone)}</span>`;
            const btn = document.createElement("button");
            btn.textContent = "تسجيل الخروج";
            btn.addEventListener("click", () => {
                clearSession();
                showView("home");
            });
            box.appendChild(btn);
        } else {
            box.innerHTML = "";
        }
    }

    function renderProfile() {
        const session = getSession();
        const box = document.getElementById("profileBox");
        if (session && session.token) {
            box.innerHTML = `
                <div class="name">${escapeHtml(session.name || "—")}</div>
                <p>📱 ${escapeHtml(session.phone)}</p>
                <p>💰 الرصيد الحالي: ${escapeHtml(String(session.balance ?? 0))} جنيه</p>
                <p class="empty-note">تم تسجيل الدخول بنجاح عبر الخادم.</p>
            `;
        } else {
            box.innerHTML = `<p class="empty-note">يرجى تسجيل الدخول لعرض بيانات حسابك.</p>`;
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ---- Live packages from the server (reflects Telegram admin edits) ----
    async function loadPackages() {
        const grid = document.getElementById("companyGrid");
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();

            document.getElementById("walletNumber").textContent = data.walletNumber || "—";

            if (!data.companies || data.companies.length === 0) {
                grid.innerHTML = `<p class="empty-note">لا توجد باقات متاحة حاليًا.</p>`;
                return;
            }

            grid.innerHTML = data.companies.map(c => {
                const items = c.items.length
                    ? c.items.map(p => `<li>${escapeHtml(p.text)}</li>`).join("")
                    : `<li class="empty-note">لا توجد باقات مضافة حاليًا</li>`;
                return `
                    <div class="company-card">
                        <h3>${escapeHtml(c.company)}</h3>
                        <ul>${items}</ul>
                    </div>
                `;
            }).join("");
        } catch (e) {
            grid.innerHTML = `<p class="empty-note">تعذر تحميل الباقات حاليًا. حاول تحديث الصفحة.</p>`;
        }
    }

    // ---- Register ----
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const messageBox = document.getElementById("registerMessage");
        messageBox.textContent = "";
        messageBox.className = "form-message";

        const payload = {
            name: form.name.value.trim(),
            phone: form.phone.value.trim(),
            password: form.password.value
        };

        if (payload.password.length < 4) {
            messageBox.textContent = "كلمة المرور يجب ألا تقل عن 4 أحرف.";
            messageBox.classList.add("error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                messageBox.textContent = data.message || "حدث خطأ أثناء إنشاء الحساب.";
                messageBox.classList.add("error");
                return;
            }

            setSession({ token: data.token, phone: data.user.phone, name: data.user.name, balance: data.user.balance });
            messageBox.textContent = "✅ تم إنشاء الحساب بنجاح!";
            messageBox.classList.add("success");
            form.reset();
            showView("profile");
        } catch (err) {
            messageBox.textContent = "تعذر الاتصال بالخادم. حاول مرة أخرى.";
            messageBox.classList.add("error");
        }
    });

    // ---- Login ----
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const messageBox = document.getElementById("loginMessage");
        messageBox.textContent = "";
        messageBox.className = "form-message";

        const payload = {
            phone: form.phone.value.trim(),
            password: form.password.value
        };

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                messageBox.textContent = data.message || "رقم الهاتف أو كلمة المرور غير صحيحة.";
                messageBox.classList.add("error");
                return;
            }

            setSession({ token: data.token, phone: data.user.phone, name: data.user.name, balance: data.user.balance });
            messageBox.textContent = "✅ تم تسجيل الدخول بنجاح!";
            messageBox.classList.add("success");
            form.reset();
            showView("profile");
        } catch (err) {
            messageBox.textContent = "تعذر الاتصال بالخادم. حاول مرة أخرى.";
            messageBox.classList.add("error");
        }
    });

    renderAuthStatus();
    loadPackages();
})();
