/**
 * SPACE TEC - HUD INTERACTION & WEB AUDIO SYNTHESIZER
 * Genera efectos sonoros futuristas y cuenta regresiva en tiempo real.
 */

// Web Audio API Context
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

// Generador de tonos para cuenta regresiva (Beep futurista tipo telemetría espacial)
function playBeep(freq = 880, duration = 0.12, type = 'sine') {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envolvente de volumen rápida
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

// Efecto de ignición / lanzamiento exitoso
function playLaunchSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 1.2);

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

// Elementos del DOM
const hoursEl = document.getElementById('clock-hours');
const minutesEl = document.getElementById('clock-minutes');
const secondsEl = document.getElementById('clock-seconds');
const millisEl = document.getElementById('clock-millis');
const btnCountdown = document.getElementById('btn-countdown-trigger');
const statusText = document.getElementById('countdown-status-text');
const audioToggleBtn = document.getElementById('audio-toggle-btn');

// Reloj continuo en tiempo real con milisegundos HUD
let isSpecialCountdownRunning = false;
let countdownSeconds = 10;
let countdownTimer = null;

function updateClock() {
  if (isSpecialCountdownRunning) return;

  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');

  if (hoursEl) hoursEl.textContent = hrs;
  if (minutesEl) minutesEl.textContent = mins;
  if (secondsEl) secondsEl.textContent = secs;
  if (millisEl) millisEl.textContent = ms;

  requestAnimationFrame(updateClock);
}
requestAnimationFrame(updateClock);

// Manejador del Conteo Regresivo T-10 de Lanzamiento
if (btnCountdown) {
  btnCountdown.addEventListener('click', () => {
    initAudio();
    if (isSpecialCountdownRunning) return;

    isSpecialCountdownRunning = true;
    countdownSeconds = 10;
    btnCountdown.disabled = true;
    btnCountdown.style.opacity = '0.6';
    statusText.textContent = "¡SECUENCIA DE DESPEGUE INICIADA!";
    statusText.style.color = "var(--naranja)";

    // Subdivisión de milisegundos durante conteo
    let msCount = 99;
    const msInterval = setInterval(() => {
      msCount = (msCount - 3) < 0 ? 99 : msCount - 3;
      if (millisEl) millisEl.textContent = String(msCount).padStart(2, '0');
    }, 30);

    countdownTimer = setInterval(() => {
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      if (secondsEl) secondsEl.textContent = String(countdownSeconds).padStart(2, '0');

      if (countdownSeconds > 0) {
        // Beep de cada segundo
        playBeep(750 + (10 - countdownSeconds) * 45, 0.15, 'sawtooth');
        statusText.textContent = `T-MINUS: ${countdownSeconds} SEGUNDOS...`;
        countdownSeconds--;
      } else {
        // T-0 Ignición
        clearInterval(countdownTimer);
        clearInterval(msInterval);
        if (secondsEl) secondsEl.textContent = "00";
        if (millisEl) millisEl.textContent = "00";

        playLaunchSound();
        statusText.textContent = "🚀 ¡DESPEGUE EXITOSO! MISIÓN EN ÓRBITA";
        statusText.style.color = "#4ade80";

        // Efecto visual en el astronauta
        const astronaut = document.getElementById('astronaut');
        if (astronaut) {
          astronaut.style.transition = "transform 2s cubic-bezier(0.25, 1, 0.5, 1)";
          astronaut.style.transform = "translateX(-50%) translateY(-60px) scale(1.15)";
          setTimeout(() => {
            astronaut.style.transform = "";
            astronaut.style.transition = "";
          }, 3500);
        }

        setTimeout(() => {
          isSpecialCountdownRunning = false;
          btnCountdown.disabled = false;
          btnCountdown.style.opacity = '1';
          statusText.textContent = "Secuencia completada. Telemetría nominal.";
          statusText.style.color = "var(--dorado)";
          requestAnimationFrame(updateClock);
        }, 4000);
      }
    }, 1000);
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

// Efecto parallax suave al mover el mouse en el Hero
const hero = document.querySelector('.lunar-hero');
const astronaut = document.getElementById('astronaut');

if (hero && astronaut) {
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    astronaut.style.marginLeft = `${x * 20}px`;
    astronaut.style.marginTop = `${y * 15}px`;
  });

  hero.addEventListener('mouseleave', () => {
    astronaut.style.marginLeft = `0px`;
    astronaut.style.marginTop = `0px`;
  });
}
