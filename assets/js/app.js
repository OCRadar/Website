/* OCRadar */
(() => {
    "use strict";

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Nav shadow on scroll */
    const nav = document.querySelector(".nav");
    if (nav) {
        const pin = () => nav.classList.toggle("pinned", window.scrollY > 4);
        pin();
        window.addEventListener("scroll", pin, { passive: true });
    }

    /* Mobile menu */
    const burger = document.querySelector(".burger");
    const menu = document.getElementById("menu");
    if (burger && menu) {
        const shut = () => {
            menu.classList.remove("show");
            burger.setAttribute("aria-expanded", "false");
        };
        burger.addEventListener("click", () => {
            const open = menu.classList.toggle("show");
            burger.setAttribute("aria-expanded", String(open));
        });
        document.addEventListener("click", (e) => {
            if (menu.classList.contains("show") &&
                !menu.contains(e.target) && !burger.contains(e.target)) shut();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && menu.classList.contains("show")) {
                shut();
                burger.focus();
            }
        });
    }

    /* Fade-up on entry */
    const ups = document.querySelectorAll(".up");
    if (ups.length) {
        if (still || !("IntersectionObserver" in window)) {
            ups.forEach((el) => el.classList.add("seen"));
        } else {
            const io = new IntersectionObserver((rows) => {
                rows.forEach((row) => {
                    if (row.isIntersecting) {
                        row.target.classList.add("seen");
                        io.unobserve(row.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
            ups.forEach((el) => io.observe(el));
        }
    }

    /* 3D mark: reveal once the viewer paints, tilt with the pointer */
    const stage = document.getElementById("stage");
    if (stage) {
        const viewer = stage.querySelector("spline-viewer");
        if (viewer) {
            const live = () => stage.classList.add("live");
            viewer.addEventListener("load-complete", live);
            // The component does not fire that event in every build, so also
            // watch for a painted canvas and give up quietly if it never lands.
            let n = 0;
            const poll = setInterval(() => {
                const cv = viewer.shadowRoot && viewer.shadowRoot.querySelector("canvas");
                if (cv && cv.width > 0) {
                    live();
                    clearInterval(poll);
                } else if (++n > 100) {
                    clearInterval(poll); // still image stays visible
                }
            }, 150);
        }

        if (!still && window.matchMedia("(min-width: 941px)").matches) {
            const tilt = stage.querySelector(".stage-tilt");
            if (tilt) {
                window.addEventListener("pointermove", (e) => {
                    const x = e.clientX / window.innerWidth - 0.5;
                    const y = e.clientY / window.innerHeight - 0.5;
                    tilt.style.setProperty("--rx", `${(x * 8).toFixed(2)}deg`);
                    tilt.style.setProperty("--ry", `${(-y * 8).toFixed(2)}deg`);
                }, { passive: true });
            }
        }
    }

    /* Screenshot viewer */
    const viewer = document.getElementById("viewer");
    if (viewer) {
        const img = viewer.querySelector(".shot img");
        const shots = JSON.parse(viewer.dataset.shots);
        const pips = Array.from(viewer.querySelectorAll(".pip"));
        const OUT = 260;
        const IN = 280;
        let at = 0;
        let moving = false;

        shots.forEach((src) => { new Image().src = src; });

        const mark = () => pips.forEach((p, i) =>
            p.setAttribute("aria-current", String(i === at)));

        const to = (next, dir) => {
            const target = (next + shots.length) % shots.length;
            if (moving || target === at) return;
            moving = true;
            at = target;
            mark();

            if (still) {
                img.src = shots[at];
                moving = false;
                return;
            }

            img.style.transition = `transform ${OUT}ms ease, opacity ${OUT}ms ease`;
            img.style.opacity = "0";
            img.style.transform = `translateX(${dir * -22}px)`;

            setTimeout(() => {
                img.src = shots[at];
                img.style.transition = "none";
                img.style.transform = `translateX(${dir * 22}px)`;
                void img.offsetWidth; // flush so the jump across is not animated
                img.style.transition = `transform ${IN}ms ease, opacity ${IN}ms ease`;
                img.style.opacity = "1";
                img.style.transform = "translateX(0)";
            }, OUT);

            // One deterministic release, so a dropped frame cannot wedge the guard
            setTimeout(() => { moving = false; }, OUT + IN);
        };

        viewer.querySelector(".prev").addEventListener("click", () => to(at - 1, -1));
        viewer.querySelector(".next").addEventListener("click", () => to(at + 1, 1));
        pips.forEach((p, i) => p.addEventListener("click", () => to(i, i > at ? 1 : -1)));

        viewer.addEventListener("keydown", (e) => {
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

        mark();
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
