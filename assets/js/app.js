/* OCRadar */
(() => {
    "use strict";

    const stillPreferred = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Mobile menu */
    const tog = document.querySelector(".tog");
    const links = document.getElementById("links");
    if (tog && links) {
        const shut = () => {
            links.classList.remove("open");
            tog.setAttribute("aria-expanded", "false");
        };
        tog.addEventListener("click", () => {
            const open = links.classList.toggle("open");
            tog.setAttribute("aria-expanded", String(open));
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
            // Not every build fires that event, so also watch for a painted
            // canvas and fall back to the still logo if it never arrives.
            let n = 0;
            const poll = setInterval(() => {
                const cv = viewer.shadowRoot && viewer.shadowRoot.querySelector("canvas");
                if (cv && cv.width > 0) {
                    live();
                    clearInterval(poll);
                } else if (++n > 100) {
                    clearInterval(poll);
                }
            }, 150);
        }

        if (!stillPreferred && window.matchMedia("(min-width: 1001px)").matches) {
            const tilt = mark.querySelector(".mark-tilt");
            if (tilt) {
                window.addEventListener("pointermove", (e) => {
                    const x = e.clientX / window.innerWidth - 0.5;
                    const y = e.clientY / window.innerHeight - 0.5;
                    // Kept small: the Spline scene has its own camera response,
                    // and a larger range compounds with it into a skewed pose.
                    tilt.style.setProperty("--rx", `${(x * 4).toFixed(2)}deg`);
                    tilt.style.setProperty("--ry", `${(-y * 4).toFixed(2)}deg`);
                }, { passive: true });
            }
        }
    }

    /* Device screenshots */
    const device = document.getElementById("device");
    if (device) {
        const img = device.querySelector(".device-shot img");
        const shots = JSON.parse(device.dataset.shots);
        const count = device.querySelector(".count");
        const OUT = 250;
        const IN = 270;
        let at = 0;
        let moving = false;

        shots.forEach((src) => { new Image().src = src; });

        const pad = (n) => String(n).padStart(2, "0");
        const label = () => {
            if (count) count.textContent = `${pad(at + 1)} / ${pad(shots.length)}`;
        };

        const to = (next, dir) => {
            const target = (next + shots.length) % shots.length;
            if (moving || target === at) return;
            moving = true;
            at = target;
            label();

            if (stillPreferred) {
                img.src = shots[at];
                moving = false;
                return;
            }

            img.style.transition = `transform ${OUT}ms ease, opacity ${OUT}ms ease`;
            img.style.opacity = "0";
            img.style.transform = `translateX(${dir * -20}px)`;

            setTimeout(() => {
                img.src = shots[at];
                img.style.transition = "none";
                img.style.transform = `translateX(${dir * 20}px)`;
                void img.offsetWidth; // flush so the jump across is not animated
                img.style.transition = `transform ${IN}ms ease, opacity ${IN}ms ease`;
                img.style.opacity = "1";
                img.style.transform = "translateX(0)";
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
