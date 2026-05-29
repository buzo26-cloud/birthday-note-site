const canvas = document.querySelector("[data-particles]");
const ctx = canvas?.getContext("2d");
const cursorGlow = document.querySelector(".cursor-glow");
const confettiLayer = document.querySelector(".confetti-layer");
const transitionLinks = document.querySelectorAll("[data-transition-link]");
const tiltCards = document.querySelectorAll(".tilt-card");
const magneticButtons = document.querySelectorAll(".magnetic");
const openButton = document.querySelector("[data-open-note]");
const noteCard = document.querySelector("[data-note-card]");
const codeForm = document.querySelector("[data-code-form]");
const codeInput = document.querySelector("[data-code-input]");
const codeFeedback = document.querySelector("[data-code-feedback]");

const confettiColors = ["#f6a4ab", "#d9a13d", "#bfeadb", "#d45771", "#ffffff", "#b6a6d9"];
const SECRET_CODE = "shona";
let particles = [];
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitTitles() {
  document.querySelectorAll(".kinetic-title").forEach((title) => {
    const words = title.textContent.trim().split(/\s+/);
    let charIndex = 0;
    title.textContent = "";

    words.forEach((word, wordIndex) => {
      const wordWrap = document.createElement("span");
      wordWrap.className = "word";

      [...word].forEach((char) => {
        const span = document.createElement("span");
        span.className = "char";
        span.style.setProperty("--i", charIndex);
        span.textContent = char;
        wordWrap.appendChild(span);
        charIndex += 1;
      });

      title.appendChild(wordWrap);

      if (wordIndex < words.length - 1) {
        title.appendChild(document.createTextNode(" "));
        charIndex += 1;
      }
    });
  });
}

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(90, Math.max(42, Math.floor(window.innerWidth / 18)));
  particles = Array.from({ length: count }, () => createParticle(true));
}

function createParticle(randomY = false) {
  const size = 1.2 + Math.random() * 2.8;

  return {
    x: Math.random() * window.innerWidth,
    y: randomY ? Math.random() * window.innerHeight : window.innerHeight + 20,
    vx: -0.18 + Math.random() * 0.36,
    vy: -0.22 - Math.random() * 0.72,
    size,
    pulse: Math.random() * Math.PI * 2,
    color: Math.random() > 0.5 ? "217, 161, 61" : "246, 164, 171",
  };
}

function drawParticles() {
  if (!ctx || !canvas || reducedMotion) return;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach((particle, index) => {
    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy);

    if (pointer.active && distance < 150) {
      particle.x -= dx * 0.006;
      particle.y -= dy * 0.006;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.pulse += 0.04;

    const alpha = 0.35 + Math.sin(particle.pulse) * 0.22;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
    ctx.shadowColor = `rgba(${particle.color}, 0.55)`;
    ctx.shadowBlur = 18;
    ctx.fill();

    for (let other = index + 1; other < particles.length; other += 1) {
      const next = particles[other];
      const lineDistance = Math.hypot(particle.x - next.x, particle.y - next.y);

      if (lineDistance < 92) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - lineDistance / 92)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (particle.y < -30 || particle.x < -30 || particle.x > window.innerWidth + 30) {
      particles[index] = createParticle(false);
    }
  });

  requestAnimationFrame(drawParticles);
}

function makeConfettiPiece(index, originX = 50) {
  const piece = document.createElement("span");
  const size = 7 + Math.random() * 11;
  const drift = (Math.random() - 0.5) * 320;
  const hueOffset = (Math.random() - 0.5) * 12;

  piece.className = "confetti-piece";
  piece.style.left = `${originX + (Math.random() - 0.5) * 18}%`;
  piece.style.width = `${size}px`;
  piece.style.height = `${size * 1.5}px`;
  piece.style.background = confettiColors[index % confettiColors.length];
  piece.style.filter = `hue-rotate(${hueOffset}deg)`;
  piece.style.animationDelay = `${Math.random() * 0.22}s`;
  piece.style.setProperty("--drift", `${drift}px`);
  piece.addEventListener("animationend", () => piece.remove());
  return piece;
}

function releaseConfetti(amount = 52, originX = 50) {
  if (!confettiLayer || reducedMotion) return;

  for (let index = 0; index < amount; index += 1) {
    confettiLayer.appendChild(makeConfettiPiece(index, originX));
  }
}

function moveCursorGlow(event) {
  pointer = { x: event.clientX, y: event.clientY, active: true };

  if (!cursorGlow) return;
  cursorGlow.style.opacity = "1";
  cursorGlow.style.transform = `translate3d(${event.clientX - 140}px, ${event.clientY - 40}px, 0) rotate(-12deg)`;
}

function tiltCard(card, event) {
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(1000px) rotateX(${-y * 9}deg) rotateY(${x * 11}deg) translateY(-4px)`;
}

function resetTilt(card) {
  card.style.transform = "";
}

function moveMagnet(button, event) {
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  button.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px) translateY(-3px)`;
}

function resetMagnet(button) {
  button.style.transform = "";
}

function transitionTo(href) {
  document.body.classList.add("is-leaving");
  releaseConfetti(36, 50);

  window.setTimeout(() => {
    window.location.href = href;
  }, 470);
}

function isCorrectCode(value) {
  return value.trim().toLowerCase() === SECRET_CODE;
}

function revealMessage() {
  noteCard?.classList.add("is-open");
  if (codeFeedback) codeFeedback.textContent = "";
  releaseConfetti(86, 62);
}

splitTitles();
document.body.classList.add("is-ready");

const urlCode = new URLSearchParams(window.location.search).get("secret-code");

if (urlCode) {
  if (codeInput) codeInput.value = urlCode;

  if (isCorrectCode(urlCode)) {
    revealMessage();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (codeFeedback) {
    codeFeedback.textContent = "Wrong code. Try again.";
  }
}

if (canvas && ctx && !reducedMotion) {
  resizeCanvas();
  drawParticles();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", moveCursorGlow);
window.addEventListener("pointerleave", () => {
  pointer.active = false;
  if (cursorGlow) cursorGlow.style.opacity = "0";
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => tiltCard(card, event));
  card.addEventListener("pointerleave", () => resetTilt(card));
});

magneticButtons.forEach((button) => {
  button.addEventListener("pointermove", (event) => moveMagnet(button, event));
  button.addEventListener("pointerleave", () => resetMagnet(button));
});

transitionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (!href || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    transitionTo(href);
  });
});

openButton?.addEventListener("click", () => {
  noteCard?.classList.add("is-open");
  releaseConfetti(80, 62);
});

codeForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const typedCode = codeInput?.value || "";

  if (isCorrectCode(typedCode)) {
    revealMessage();
    return;
  }

  if (codeFeedback) codeFeedback.textContent = "Wrong code. Try again.";
  codeForm.classList.remove("is-wrong");
  window.setTimeout(() => codeForm.classList.add("is-wrong"), 10);
  codeInput?.select();
});

document.querySelector("[data-confetti-card]")?.addEventListener("click", (event) => {
  releaseConfetti(64, (event.clientX / window.innerWidth) * 100);
});
