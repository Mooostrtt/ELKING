(function () {
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

    // إخفاء الـ Tabs وإظهارها بناءً على تسجيل الدخول لمنع اللخبطة
    function fixNavigationUI(isLoggedIn) {
        const loginBtn = document.getElementById("tab-btn-login");
        const registerBtn = document.getElementById("tab-btn-register");
        if (isLoggedIn) {
            if(loginBtn) loginBtn.classList.add("hidden-tab");
            if(registerBtn) registerBtn.classList.add("hidden-tab");
        } else {
            if(loginBtn) loginBtn.classList.remove("hidden-tab");
            if(registerBtn) registerBtn.classList.remove("hidden-tab");
        }
    }

    // زرار العين للباسورد
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === "password") {
                input.type = "text"; btn.textContent = "🙈";
            } else {
                input.type = "password"; btn.textContent = "👁️";
            }
        });
    });

    function getSession() {
        try { return JSON.parse(localStorage.getItem("elking_session") || "null"); } catch (e) { return null; }
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
                fixNavigationUI(false);
                showView("home");
            });
            box.appendChild(btn);
            fixNavigationUI(true);
        } else {
            box.innerHTML = "";
            fixNavigationUI(false);
        }
    }

    function renderProfile() {
        const session = getSession();
        const box = document.getElementById("profileBox");
        if (session && session.token) {
            box.innerHTML = `
                <div class="name">👑 ${escapeHtml(session.name || "—")}</div>
                <p>📱 رقم حسابك: ${escapeHtml(session.phone)}</p>
                <p style="color:var(--success)">🔒 حسابك نشط ومربوط بالبوت الآمن</p>
            `;
        } else {
            box.innerHTML = `<p class="empty-note">يرجى تسجيل الدخول لعرض بيانات حسابك.</p>`;
        }
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // تحميل الباقات وتحويل الضغطة لفتح الـ Modal
    async function loadPackages() {
        const grid = document.getElementById("companyGrid");
        try {
            const res = await fetch(`${API_BASE_URL}/packages`);
            const data = await res.json();

            if (!data.companies || data.companies.length === 0) {
                grid.innerHTML = `<p class="empty-note">لا توجد باقات متاحة حاليًا.</p>`;
                return;
            }

            grid.innerHTML = data.companies.map(c => {
                const items = c.items.length
                    ? c.items.map(p => `<li class="pkg-item-click" data-company="${c.company}" data-pkgname="${p.text}">${escapeHtml(p.text)}</li>`).join("")
                    : `<li class="empty-note">لا توجد باقات حالياً</li>`;
                return `
                    <div class="company-card">
                        <h3>⚡ ${escapeHtml(c.company)}</h3>
                        <ul>${items}</ul>
                    </div>
                `;
            }).join("");

            // تفعيل فتح الصندوق عند الضغط على أي باقة
            document.querySelectorAll(".pkg-item-click").forEach(li => {
                li.addEventListener("click", () => {
                    const session = getSession();
                    if (!session || !session.token) {
                        alert("يرجى تسجيل الدخول أو إنشاء حساب أولاً لطلب شحن الباقة!");
                        showView("login");
                        return;
                    }
                    openOrderModal(li.dataset.company, li.dataset.pkgname);
                });
            });

        } catch (e) {
            grid.innerHTML = `<p class="empty-note">تعذر تحميل الباقات. تأكد من تشغيل السيرفر.</p>`;
        }
    }

    // فتح صندوق طلب الباقة
    const modal = document.getElementById("orderModal");
    function openOrderModal(company, pkgName) {
        document.getElementById("modalPackageTitle").textContent = `طلب شحن: ${pkgName} (${company})`;
        document.getElementById("orderPackageName").value = pkgName;
        document.getElementById("orderCompany").value = company;
        document.getElementById("orderMessage").textContent = "";
        modal.classList.add("open");
    }

    document.getElementById("closeModalBtn").addEventListener("click", () => modal.classList.remove("open"));

    // إرسال الطلب بالإسكرين شوت إلى السيرفر (والسيرفر يبعتها للتليجرام)
    document.getElementById("orderForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const session = getSession();
        const msgBox = document.getElementById("orderMessage");
        msgBox.textContent = "جارِ إرسال طلبك وصورة التحويل...";
        msgBox.style.color = "var(--gold)";

        const company = document.getElementById("orderCompany").value;
        const packageName = document.getElementById("orderPackageName").value;
        const targetPhone = document.getElementById("orderTargetPhone").value.trim();
        const screenshotFile = document.getElementById("orderScreenshot").files[0];

        // إرسال البيانات كـ FormData لرفع الصورة
        const formData = new FormData();
        formData.append("company", company);
        formData.append("packageName", packageName);
        formData.append("targetPhone", targetPhone);
        formData.append("userPhone", session.phone);
        formData.append("userName", session.name || "زبون");
        formData.append("screenshot", screenshotFile);

        try {
            const res = await fetch(`${API_BASE_URL}/submit-order`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${session.token}` },
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.success) {
                msgBox.textContent = "✅ تم إرسال طلبك بنجاح للبوت وجارِ التنفيذ!";
                msgBox.style.color = "var(--success)";
                setTimeout(() => { modal.classList.remove("open"); document.getElementById("orderForm").reset(); }, 2000);
            } else {
                msgBox.textContent = data.message || "حدث خطأ أثناء إرسال الطلب.";
                msgBox.style.color = "var(--error)";
            }
        } catch (err) {
            msgBox.textContent = "❌ فشل الاتصال بالسيرفر. حاول مرة أخرى.";
            msgBox.style.color = "var(--error)";
        }
    });

    // نموذج التسجيل والدخول المعتاد
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const msg = document.getElementById("registerMessage");
        msg.textContent = ""; msg.className = "form-message";

        const payload = { name: form.name.value.trim(), phone: form.phone.value.trim(), password: form.password.value };
        try {
            const res = await fetch(`${API_BASE_URL}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok || !data.success) { msg.textContent = data.message || "خطأ في التسجيل."; msg.classList.add("error"); return; }

            setSession({ token: data.token, phone: data.user.phone, name: data.user.name });
            msg.textContent = "✅ تم إنشاء الحساب بنجاح!"; msg.classList.add("success");
            form.reset(); showView("home");
        } catch (err) { msg.textContent = "تعذر الاتصال بالسيرفر."; msg.classList.add("error"); }
    });

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const msg = document.getElementById("loginMessage");
        msg.textContent = ""; msg.className = "form-message";

        const payload = { phone: form.phone.value.trim(), password: form.password.value };
        try {
            const res = await fetch(`${API_BASE_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok || !data.success) { msg.textContent = data.message || "بيانات غير صحيحة."; msg.classList.add("error"); return; }

            setSession({ token: data.token, phone: data.user.phone, name: data.user.name });
            msg.textContent = "✅ تم الدخول بنجاح!"; msg.classList.add("success");
            form.reset(); showView("home");
        } catch (err) { msg.textContent = "تعذر الاتصال بالسيرفر."; msg.classList.add("error"); }
    });

    renderAuthStatus();
    loadPackages();
})();

