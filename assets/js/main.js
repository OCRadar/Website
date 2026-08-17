/* OCRadar — shared site behavior */
(() => {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Sticky header state ---------- */
    const header = document.querySelector(".site-header");
    if (header) {
        const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Mobile nav ---------- */
    const navToggle = document.querySelector(".nav-toggle");
    const siteNav = document.getElementById("siteNav");
    if (navToggle && siteNav) {
        navToggle.addEventListener("click", () => {
            const open = siteNav.classList.toggle("open");
            navToggle.setAttribute("aria-expanded", String(open));
        });
        document.addEventListener("click", (e) => {
            if (siteNav.classList.contains("open") &&
                !siteNav.contains(e.target) && !navToggle.contains(e.target)) {
                siteNav.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && siteNav.classList.contains("open")) {
                siteNav.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
                navToggle.focus();
            }
        });
    }

    /* ---------- Scroll reveal ---------- */
    const revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
        if (reducedMotion || !("IntersectionObserver" in window)) {
            revealEls.forEach((el) => el.classList.add("in"));
        } else {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in");
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
            revealEls.forEach((el) => io.observe(el));
        }
    }

    /* ---------- 3D logo stage ---------- */
    const stage3d = document.getElementById("hero3d");
    if (stage3d) {
        const viewer = stage3d.querySelector("spline-viewer");

        // Fade the viewer in (and the placeholder out) once its canvas is live.
        const markReady = () => stage3d.classList.add("spline-ready");
        if (viewer) {
            viewer.addEventListener("load-complete", markReady);
            // Fallback readiness probe: the component doesn't fire events in
            // every version, so watch for its rendered canvas instead.
            let tries = 0;
            const probe = setInterval(() => {
                tries += 1;
                const canvas = viewer.shadowRoot && viewer.shadowRoot.querySelector("canvas");
                if (canvas && canvas.width > 0) {
                    markReady();
                    clearInterval(probe);
                } else if (tries > 100) {
                    clearInterval(probe); // give up: placeholder logo stays visible
                }
            }, 150);
        }

        // Subtle pointer parallax on larger screens.
        if (!reducedMotion && window.matchMedia("(min-width: 961px)").matches) {
            const stage = stage3d.querySelector(".stage");
            if (stage) {
                window.addEventListener("pointermove", (e) => {
                    const x = e.clientX / window.innerWidth - 0.5;
                    const y = e.clientY / window.innerHeight - 0.5;
                    stage.style.setProperty("--rx", `${(x * 6).toFixed(2)}deg`);
                    stage.style.setProperty("--ry", `${(-y * 6).toFixed(2)}deg`);
                }, { passive: true });
            }
        }
    }

    /* ---------- Mockup carousel (About) ---------- */
    const carousel = document.getElementById("mockCarousel");
    if (carousel) {
        const img = carousel.querySelector(".car-img");
        const sources = JSON.parse(carousel.dataset.images);
        const dots = Array.from(carousel.querySelectorAll(".car-dot"));
        let index = 0;
        let busy = false;

        sources.forEach((src) => { new Image().src = src; });

        const setDots = () => dots.forEach((d, i) =>
            d.setAttribute("aria-current", String(i === index)));

        const OUT_MS = 300;
        const IN_MS = 320;

        const show = (next, dir) => {
            const target = (next + sources.length) % sources.length;
            if (busy || target === index) return;
            busy = true;
            index = target;
            setDots();

            if (reducedMotion) {
                img.src = sources[index];
                busy = false;
                return;
            }

            // Slide the current frame out, swap, then slide the new one in.
            img.style.transition = `transform ${OUT_MS}ms ease, opacity ${OUT_MS}ms ease`;
            img.style.opacity = "0";
            img.style.transform = `translateX(${dir * -28}px)`;

            setTimeout(() => {
                img.src = sources[index];
                img.style.transition = "none";
                img.style.transform = `translateX(${dir * 28}px)`;
                // Force a reflow so the jump to the far side isn't animated.
                void img.offsetWidth;
                img.style.transition = `transform ${IN_MS}ms ease, opacity ${IN_MS}ms ease`;
                img.style.opacity = "1";
                img.style.transform = "translateX(0)";
            }, OUT_MS);

            // Single deterministic release so a dropped frame can never wedge the guard.
            setTimeout(() => { busy = false; }, OUT_MS + IN_MS);
        };

        carousel.querySelector(".prev").addEventListener("click", () => show(index - 1, -1));
        carousel.querySelector(".next").addEventListener("click", () => show(index + 1, 1));
        dots.forEach((d, i) => d.addEventListener("click", () => show(i, i > index ? 1 : -1)));

        carousel.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") show(index - 1, -1);
            if (e.key === "ArrowRight") show(index + 1, 1);
        });

        // Touch swipe
        let startX = null;
        img.addEventListener("pointerdown", (e) => { startX = e.clientX; }, { passive: true });
        window.addEventListener("pointerup", (e) => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            startX = null;
            if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }, { passive: true });

        setDots();
    }

    /* ---------- Contact form (mailto compose) ---------- */
    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = form.email.value.trim();
            const message = form.message.value.trim();
            const subject = encodeURIComponent("OCRadar inquiry");
            const body = encodeURIComponent(`From: ${email}\n\n${message}`);
            window.location.href = `mailto:ocradar.contact@gmail.com?subject=${subject}&body=${body}`;
        });
    }
})();
