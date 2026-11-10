/* OCRadar */
(() => {
    "use strict";

    const stillPreferred = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Mobile menu */
    const tog = document.querySelector(".tog");
    const links = document.getElementById("links");
    if (tog && links) {
        // On a phone the menu is a full sheet, so the page behind it is
        // held still while it is open.
        const set = (open) => {
            links.classList.toggle("open", open);
            document.documentElement.classList.toggle("menu-open", open);
            tog.setAttribute("aria-expanded", String(open));
            tog.setAttribute("aria-label", open ? "Close menu" : "Menu");
        };
        const shut = () => set(false);
        tog.addEventListener("click", () => set(!links.classList.contains("open")));
        links.addEventListener("click", (e) => {
            if (e.target.closest("a")) shut();
        });
        document.addEventListener("click", (e) => {
            if (links.classList.contains("open") &&
                !links.contains(e.target) && !tog.contains(e.target)) shut();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && links.classList.contains("open")) {
                shut();
                tog.focus();
            }
        });
    }

    /* Enter-on-scroll */
    const ups = document.querySelectorAll(".up");
    if (ups.length) {
        if (stillPreferred || !("IntersectionObserver" in window)) {
            ups.forEach((el) => el.classList.add("seen"));
        } else {
            const io = new IntersectionObserver((rows) => {
                rows.forEach((row) => {
                    if (row.isIntersecting) {
                        row.target.classList.add("seen");
                        io.unobserve(row.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
            ups.forEach((el) => io.observe(el));
        }
    }

    /* 3D mark */
    const mark = document.getElementById("mark");
    if (mark) {
        const viewer = mark.querySelector("spline-viewer");
        if (viewer) {
            const live = () => mark.classList.add("live");
            viewer.addEventListener("load-complete", live);
            // Not every build fires that event, so also watch the canvas.
            // The viewer keeps it hidden until the scene has painted, so
            // "visible" is the signal; a canvas merely existing is not.
            let n = 0;
            const poll = setInterval(() => {
                const cv = viewer.shadowRoot && viewer.shadowRoot.querySelector("canvas");
                if (cv && cv.style.visibility === "visible") {
                    live();
                    clearInterval(poll);
                } else if (++n > 200) {
                    clearInterval(poll);
                }
            }, 150);
            // A scene that is ready quickly simply eases in on its empty
            // stage. One that is slow, or never arrives, gets the flat
            // mark in its place after a short wait.
            setTimeout(() => {
                if (!mark.classList.contains("live")) mark.classList.add("fallback");
            }, 1600);
        } else {
            mark.classList.add("fallback");
        }
    }

    /* Device screenshots */
    const device = document.getElementById("device");
    if (device) {
        const img = device.querySelector(".device-shot img");
        const shots = JSON.parse(device.dataset.shots);
        const count = device.querySelector(".count");
        const name = device.querySelector(".shot-name");
        const OUT = 250;
        const IN = 270;
        let at = 0;
        let moving = false;

        shots.forEach((shot) => { new Image().src = shot.src; });

        const show = () => {
            img.src = shots[at].src;
            img.alt = shots[at].alt;
        };
        const label = () => {
            if (name) name.textContent = shots[at].name;
            if (count) count.textContent = `${at + 1} of ${shots.length}`;
        };

        const to = (next, dir) => {
            const target = (next + shots.length) % shots.length;
            if (moving || target === at) return;
            moving = true;
            at = target;
            label();

            if (stillPreferred) {
                show();
                moving = false;
                return;
            }

            img.style.transition = `translate ${OUT}ms ease, opacity ${OUT}ms ease`;
            img.style.opacity = "0";
            img.style.translate = `${dir * -20}px 0`;

            setTimeout(() => {
                show();
                img.style.transition = "none";
                img.style.translate = `${dir * 20}px 0`;
                void img.offsetWidth; // flush so the jump across is not animated
                img.style.transition = `translate ${IN}ms ease, opacity ${IN}ms ease`;
                img.style.opacity = "1";
                img.style.translate = "0 0";
            }, OUT);

            // One deterministic release, so a dropped frame cannot wedge the guard
            setTimeout(() => { moving = false; }, OUT + IN);
        };

        device.querySelector(".prev").addEventListener("click", () => to(at - 1, -1));
        device.querySelector(".next").addEventListener("click", () => to(at + 1, 1));
        device.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") to(at - 1, -1);
            if (e.key === "ArrowRight") to(at + 1, 1);
        });

        let from = null;
        img.addEventListener("pointerdown", (e) => { from = e.clientX; }, { passive: true });
        window.addEventListener("pointerup", (e) => {
            if (from === null) return;
            const dx = e.clientX - from;
            from = null;
            if (Math.abs(dx) > 40) to(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }, { passive: true });

        label();
    }

    /* Contact form composes a message in the visitor's mail client */
    const form = document.getElementById("say-hello");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const subject = encodeURIComponent("OCRadar inquiry");
            const body = encodeURIComponent(
                `From: ${form.email.value.trim()}\n\n${form.message.value.trim()}`
            );
            window.location.href =
                `mailto:ocradar.contact@gmail.com?subject=${subject}&body=${body}`;
        });
    }
})();
