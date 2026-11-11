/**
 * SPACE TEC - HUD CLOCK & MISSION COUNTDOWN (1-Second Cadence)
 * Sin parpadeo frenético: ritmo calmado y exacto de 1 segundo.
 */

let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Sonido Beep nítido estilo NASA (1 cada segundo)
function playBeep(freq = 880, duration = 0.1) {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context init required user interaction:", e);
  }
}

// Sonido de ignición en T-0
function playLaunchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.4);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// Elementos del reloj
const daysEl = document.getElementById('clock-days');
const hoursEl = document.getElementById('clock-hours');
const minutesEl = document.getElementById('clock-minutes');
const secondsEl = document.getElementById('clock-seconds');
const btnCountdown = document.getElementById('btn-countdown-trigger');
const statusText = document.getElementById('countdown-status-text');
const audioToggleBtn = document.getElementById('audio-toggle-btn');

let isLaunchSequenceRunning = false;
let launchCountdown = 10;
let launchInterval = null;

// Objetivo de entrega: cuenta regresiva real constante
let totalSecondsRemaining = 2 * 86400 + 14 * 3600 + 30 * 60; // 2 días, 14 horas, 30 minutos

function renderClockValues(totalSecs) {
  if (totalSecs < 0) totalSecs = 0;
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);

  if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
}

// Actualizar cada 1 segundo (1000 ms) EXACTO, sin carreras rápidas
renderClockValues(totalSecondsRemaining);
const normalClockInterval = setInterval(() => {
  if (isLaunchSequenceRunning) return;
  totalSecondsRemaining = Math.max(0, totalSecondsRemaining - 1);
  renderClockValues(totalSecondsRemaining);
}, 1000);

// Secuencia interactiva de Lanzamiento T-10 (a ritmo de 1 segundo por paso)
if (btnCountdown) {
  btnCountdown.addEventListener('click', () => {
    initAudio();
    if (isLaunchSequenceRunning) return;

    isLaunchSequenceRunning = true;
    launchCountdown = 10;
    btnCountdown.disabled = true;
    btnCountdown.style.opacity = '0.6';

    statusText.textContent = "¡SECUENCIA DE IGNICIÓN INICIADA!";
    statusText.style.color = "var(--naranja)";

    // Fijamos días, horas y minutos en 00 para ver los 10 segundos
    if (daysEl) daysEl.textContent = "00";
    if (hoursEl) hoursEl.textContent = "00";
    if (minutesEl) minutesEl.textContent = "00";
    if (secondsEl) secondsEl.textContent = "10";
    playBeep(800, 0.12);

    launchInterval = setInterval(() => {
      launchCountdown--;

      if (launchCountdown > 0) {
        if (secondsEl) secondsEl.textContent = String(launchCountdown).padStart(2, '0');
        statusText.textContent = `T-MINUS: 00:00:0${launchCountdown} SEGUNDOS...`;
        playBeep(700 + (10 - launchCountdown) * 50, 0.12);
      } else {
        // T-0
        clearInterval(launchInterval);
        if (secondsEl) secondsEl.textContent = "00";
        playLaunchSound();

        statusText.textContent = "🚀 ¡DESPEGUE EXITOSO! MISIÓN SPACE TEC EN ÓRBITA";
        statusText.style.color = "#4ade80";

        // Animación suave de elevación del astronauta
        const astronaut = document.getElementById('astronaut');
        if (astronaut) {
          astronaut.style.transition = "transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)";
          astronaut.style.transform = "translateX(-50%) translateY(-65px) scale(1.15)";
          setTimeout(() => {
            astronaut.style.transform = "";
            astronaut.style.transition = "";
          }, 3500);
        }

        setTimeout(() => {
          isLaunchSequenceRunning = false;
          btnCountdown.disabled = false;
          btnCountdown.style.opacity = '1';
          statusText.textContent = "Secuencia completada. Telemetría nominal.";
          statusText.style.color = "var(--dorado)";
          renderClockValues(totalSecondsRemaining);
        }, 4000);
      }
    }, 1000); // 1 segundo exacto
  });
}

// Botón de Toggle Audio
if (audioToggleBtn) {
  audioToggleBtn.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    const indicator = audioToggleBtn.querySelector('.status-indicator');
    const text = audioToggleBtn.querySelector('.btn-text');

    if (soundEnabled) {
      text.textContent = "AUDIO HUD";
      indicator.classList.add('live');
      playBeep(980, 0.1);
    } else {
      text.textContent = "SILENCIADO";
      indicator.classList.remove('live');
    }
  });
}

// Efecto parallax suave
const hero = document.querySelector('.lunar-hero');
const astronaut = document.getElementById('astronaut');

if (hero && astronaut) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    astronaut.style.marginLeft = `${x * 18}px`;
    astronaut.style.marginTop = `${y * 14}px`;
  });

  hero.addEventListener('mouseleave', () => {
    astronaut.style.marginLeft = `0px`;
    astronaut.style.marginTop = `0px`;
  });
}
