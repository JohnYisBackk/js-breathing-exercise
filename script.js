"use strict";

// ======================================================
// SELECT ELEMENTS
// ======================================================

// Header
const navLinks = document.querySelectorAll(".nav-link");
const themeToggle = document.querySelector(".theme-toggle");

// Navigation Sections
const breathingMainSection = document.querySelector(".breathing-main-section");
const patternSection = document.querySelector(".pattern-section");
const sessionStatsSection = document.querySelector(".session-stats-section");
const presetsSection = document.querySelector(".presets-section");
const footer = document.querySelector(".footer");

// Guided Breathing
const mainCircle = document.querySelector(".main-circle");
const circleOuterRing = document.querySelector(".circle-outer-ring");
const circleMiddleRing = document.querySelector(".circle-middle-ring");
const circleInner = document.querySelector(".circle-inner");

const breathingPhase = document.getElementById("breathingPhase");
const breathingSeconds = document.getElementById("breathingSeconds");
const breathingMessage = document.getElementById("breathingMessage");

// Session Controls
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

// Breathing Pattern
const inhaleInput = document.getElementById("inhaleInput");
const holdInput = document.getElementById("holdInput");
const exhaleInput = document.getElementById("exhaleInput");
const holdAfterExhaleInput = document.getElementById("holdAfterExhaleInput");
const cyclesInput = document.getElementById("cyclesInput");

// Custom Input Arrows
const inputBoxes = document.querySelectorAll(".input-box");
const increaseButtons = document.querySelectorAll(".increase");
const decreaseButtons = document.querySelectorAll(".decrease");

// Session Stats
const currentCycleValue = document.getElementById("currentCycleValue");
const elapsedValue = document.getElementById("elapsedValue");
const remainingValue = document.getElementById("remainingValue");

// Presets
const presetButtons = document.querySelectorAll(".preset-box");

// ======================================================
// STATE
// ======================================================

let currentPreset = "";

let isStarted = false;
let isPaused = false;

let currentPhase = "inhale";
let currentCycle = 1;

let secondsRemaining = 0;
let elapsedSeconds = 0;

let timerId = null;

let currentTheme = "dark";

// ======================================================
// THEME
// ======================================================

function loadTheme() {
  const storedTheme = localStorage.getItem("breathingExerciseTheme");

  if (storedTheme) {
    currentTheme = storedTheme;
  }

  applyTheme();
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme();

  localStorage.setItem("breathingExerciseTheme", currentTheme);
}

// ======================================================
// NAVIGATION
// ======================================================

function navigateToSection(selectedSection) {
  switch (selectedSection) {
    case "home":
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      break;

    case "sessions":
      patternSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      break;

    case "progress":
      sessionStatsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      break;

    case "about":
      footer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      break;
  }
}

// ======================================================
// NUMBER INPUT CONTROLS
// ======================================================

function changeNumberInput(button, direction) {
  const inputBox = button.closest(".input-box");
  const input = inputBox.querySelector('input[type="number"]');

  if (direction === "increase") {
    input.stepUp();
  } else {
    input.stepDown();
  }
}

// ======================================================
// BREATHING PRESETS
// ======================================================

function applyPreset(presetName) {
  currentPreset = presetName;

  if (presetName === "relax") {
    inhaleInput.value = 4;
    holdInput.value = 4;
    exhaleInput.value = 6;
    holdAfterExhaleInput.value = 2;
  } else if (presetName === "box") {
    inhaleInput.value = 4;
    holdInput.value = 4;
    exhaleInput.value = 4;
    holdAfterExhaleInput.value = 4;
  } else if (presetName === "478") {
    inhaleInput.value = 4;
    holdInput.value = 7;
    exhaleInput.value = 8;
    holdAfterExhaleInput.value = 0;
  }

  presetButtons.forEach((button) => {
    button.classList.remove("active");

    if (button.dataset.preset === presetName) {
      button.classList.add("active");
    }
  });
}

// ======================================================
// GET BREATHING SETTINGS
// ======================================================

function getBreathingSettings() {
  const inhale = Number(inhaleInput.value);
  const hold = Number(holdInput.value);
  const exhale = Number(exhaleInput.value);
  const holdAfterExhale = Number(holdAfterExhaleInput.value);
  const cycles = Number(cyclesInput.value);

  return {
    inhale,
    hold,
    exhale,
    holdAfterExhale,
    cycles,
  };
}

// ======================================================
// START SESSION
// ======================================================

function startSession() {
  const settings = getBreathingSettings();

  isStarted = true;
  isPaused = false;

  currentPhase = "inhale";
  currentCycle = 1;

  elapsedSeconds = 0;
  secondsRemaining = settings.inhale;

  updateBreathingUI();
  updateSessionStats();
  startSessionTimer();
}

// ======================================================
// PAUSE / RESUME SESSION
// ======================================================

function togglePauseSession() {
  if (!isStarted) return;

  if (isPaused) {
    isPaused = false;

    pauseBtn.innerHTML = `
      <i class="bi bi-pause-fill"></i>
      Pause 
    `;

    startSessionTimer();
  } else {
    isPaused = true;

    clearInterval(timerId);
    timerId = null;

    pauseBtn.innerHTML = `
      <i class="bi bi-play-fill"></i>
      Resume
    `;
  }
}

// ======================================================
// RESET SESSION
// ======================================================

function resetSession() {
  const settings = getBreathingSettings();

  clearInterval(timerId);
  timerId = null;

  isStarted = false;
  isPaused = false;

  currentPhase = "inhale";
  currentCycle = 1;

  elapsedSeconds = 0;
  secondsRemaining = settings.inhale;

  pauseBtn.innerHTML = `
    <i class="bi bi-pause-fill"></i>
    Pause
  `;

  updateBreathingUI();
  updateSessionStats();
}

// ======================================================
// BREATHING PHASES
// ======================================================

function getPhaseDuration(phase) {
  const settings = getBreathingSettings();

  if (phase === "inhale") {
    return settings.inhale;
  }

  if (phase === "holdInhale") {
    return settings.hold;
  }

  if (phase === "exhale") {
    return settings.exhale;
  }

  if (phase === "holdExhale") {
    return settings.holdAfterExhale;
  }

  return 0;
}

// ======================================================
// CHANGE BREATHING PHASE
// ======================================================

function changeBreathingPhase() {
  const settings = getBreathingSettings();

  if (currentPhase === "inhale") {
    if (settings.hold > 0) {
      currentPhase = "holdInhale";
    } else {
      currentPhase = "exhale";
    }
  } else if (currentPhase === "holdInhale") {
    currentPhase = "exhale";
  } else if (currentPhase === "exhale") {
    if (settings.holdAfterExhale > 0) {
      currentPhase = "holdExhale";
    } else {
      if (currentCycle >= settings.cycles) {
        completeSession();
        return;
      }

      currentCycle++;
      currentPhase = "inhale";
    }
  } else if (currentPhase === "holdExhale") {
    if (currentCycle >= settings.cycles) {
      completeSession();
      return;
    }

    currentCycle++;
    currentPhase = "inhale";
  }

  secondsRemaining = getPhaseDuration(currentPhase);

  updateBreathingUI();
  updateSessionStats();
}

// ======================================================
// UPDATE BREATHING UI
// ======================================================

function updateBreathingUI() {
  breathingSeconds.textContent = secondsRemaining;

  if (currentPhase === "inhale") {
    breathingPhase.textContent = "INHALE";
    breathingMessage.textContent = "Breathe in slowly";
  } else if (currentPhase === "holdInhale") {
    breathingPhase.textContent = "HOLD";
    breathingMessage.textContent = "Hold your breath";
  } else if (currentPhase === "exhale") {
    breathingPhase.textContent = "EXHALE";
    breathingMessage.textContent = "Breathe out slowly";
  } else if (currentPhase === "holdExhale") {
    breathingPhase.textContent = "HOLD";
    breathingMessage.textContent = "Pause before the next breath";
  }

  updateBreathingCircle();
}

// ======================================================
// UPDATE BREATHING CIRCLE
// ======================================================

function updateBreathingCircle() {
  const phaseDuration = getPhaseDuration(currentPhase);

  circleOuterRing.style.transition = `transform ${phaseDuration}s ease-in-out`;

  if (!isStarted) {
    circleOuterRing.style.transition = "none";
    circleOuterRing.style.transform = "scale(1)";
    return;
  }

  if (currentPhase === "inhale") {
    circleOuterRing.style.transform = "scale(1.08)";
  } else if (currentPhase === "holdInhale") {
    circleOuterRing.style.transform = "scale(1.08)";
  } else if (currentPhase === "exhale") {
    circleOuterRing.style.transform = "scale(0.9)";
  } else if (currentPhase === "holdExhale") {
    circleOuterRing.style.transform = "scale(0.9)";
  }
}

// ======================================================
// UPDATE SESSION TIMER
// ======================================================

function startSessionTimer() {
  clearInterval(timerId);

  timerId = setInterval(() => {
    secondsRemaining--;
    elapsedSeconds++;

    if (secondsRemaining <= 0) {
      changeBreathingPhase();
    } else {
      updateBreathingUI();
      updateSessionStats();
    }
  }, 1000);
}

// ======================================================
// UPDATE SESSION STATS
// ======================================================

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateSessionStats() {
  const settings = getBreathingSettings();

  const cycleDuration =
    settings.inhale +
    settings.hold +
    settings.exhale +
    settings.holdAfterExhale;

  const totalDuration = cycleDuration * settings.cycles;

  const remainingSeconds = Math.max(totalDuration - elapsedSeconds, 0);

  currentCycleValue.textContent = `${currentCycle}/${settings.cycles}`;

  elapsedValue.textContent = formatTime(elapsedSeconds);

  remainingValue.textContent = formatTime(remainingSeconds);
}

// ======================================================
// COMPLETE SESSION
// ======================================================

function completeSession() {
  clearInterval(timerId);
  timerId = null;

  isStarted = false;
  isPaused = false;

  secondsRemaining = 0;

  breathingPhase.textContent = "COMPLETE";
  breathingSeconds.textContent = "0";
  breathingMessage.textContent = "Session complete. Great job!";

  pauseBtn.innerHTML = `
    <i class="bi bi-pause-fill"></i>
    Pause
  `;

  updateSessionStats();
  updateBreathingCircle();
}

// ======================================================
// EVENT LISTENERS
// ======================================================

themeToggle.addEventListener("click", toggleTheme);

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    navLinks.forEach((navLink) => {
      navLink.classList.remove("active");
    });

    link.classList.add("active");

    const selectedSection = link.dataset.section;

    navigateToSection(selectedSection);
  });
});

increaseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeNumberInput(button, "increase");

    const input = button
      .closest(".input-box")
      .querySelector('input[type="number"]');

    if (input !== cyclesInput) {
      applyPreset("custom");
    }
  });
});

decreaseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeNumberInput(button, "decrease");

    const input = button
      .closest(".input-box")
      .querySelector('input[type="number"]');

    if (input !== cyclesInput) {
      applyPreset("custom");
    }
  });
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const presetName = button.dataset.preset;

    applyPreset(presetName);
  });
});

[inhaleInput, holdInput, exhaleInput, holdAfterExhaleInput].forEach((input) => {
  input.addEventListener("input", () => {
    applyPreset("custom");
  });
});

startBtn.addEventListener("click", startSession);
pauseBtn.addEventListener("click", togglePauseSession);
resetBtn.addEventListener("click", resetSession);

// ======================================================
// INITIALIZE APP
// ======================================================

function init() {
  loadTheme();

  applyPreset("relax");
  resetSession();
}

init();
