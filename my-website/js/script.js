document.addEventListener("DOMContentLoaded", () => {

  // --- AUDIO ---
  let soundEnabled = false;
  const tickSound = new Audio("sounds/tick.mp3");

  const spinLoop = new Audio("sounds/spin.mp3");
  spinLoop.loop = true;

  const enableSound = () => {
    soundEnabled = true;
    document.removeEventListener("click", enableSound);
    document.removeEventListener("touchstart", enableSound);
    document.removeEventListener("wheel", enableSound);
  };

  document.addEventListener("click", enableSound);
  document.addEventListener("touchstart", enableSound);
  document.addEventListener("wheel", enableSound);

  function playTick() {
    if (!soundEnabled) return;
    tickSound.currentTime = 0;
    tickSound.play();
  }

  // --- ELEMENTS ---
  const wheel = document.getElementById("wheel");
  const list = document.getElementById("wheelList");

  const bulkInput = document.getElementById("bulkInput");
  const loadBtn = document.getElementById("loadBtn");
  const singleInput = document.getElementById("singleInput");
  const spinBtn = document.getElementById("spinBtn");
  const resetBtn = document.getElementById("resetBtn");
  const itemCount = document.getElementById("itemCount");

  // WINNERS ELEMENTS
  const winnersList = document.getElementById("winnersList");
  const clearWinnersBtn = document.getElementById("clearWinnersBtn");
  const removeFromWheelBtn = document.getElementById("removeFromWheelBtn");

  // NEW BUTTONS
  const hideWinnersBtn = document.getElementById("hideWinnersBtn");
  const autoRemoveBtn = document.getElementById("autoRemoveBtn");

  // --- CONSTANTS ---
  const itemHeight = 40;
  const centerOffset = itemHeight * 2;

  let items = [];
  let lastIndex = -1;
  let isSpinning = false;

  // WINNERS DATA
  let winners = [];
  let autoRemove = false;

  function updateWinnersUI() {
    if (!winnersList) return;
    winnersList.innerHTML = "";
    winners.forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      winnersList.appendChild(li);
    });
  }

  // --- UPDATE ITEM COUNT ---
  function updateCount() {
    itemCount.textContent = `Items: ${items.length}`;
  }

  // --- SMOOTH SCROLL ---
  function smoothScrollTo(element, target, duration, callback) {
    const start = element.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    function animate(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      element.scrollTop = start + change * eased;

      if (t < 1) requestAnimationFrame(animate);
      else if (callback) callback();
    }

    requestAnimationFrame(animate);
  }

  // --- BUILD LIST ---
  function buildList() {
    list.innerHTML = "";

    for (let i = 0; i < 3; i++) {
      items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        li.style.fontWeight = "bold";
        list.appendChild(li);
      });
    }

    wheel.scrollTop = items.length * itemHeight;
    lastIndex = -1;
    updateCount();
  }

  // --- LOOP CORRECTION ---
  wheel.addEventListener("scroll", () => {
    if (isSpinning) return;

    const total = items.length * itemHeight;

    if (wheel.scrollTop < total * 0.5) wheel.scrollTop += total;
    else if (wheel.scrollTop > total * 1.5) wheel.scrollTop -= total;
  });

  // --- LOAD ITEMS ---
  loadBtn.addEventListener("click", () => {
    items = bulkInput.value
      .split("\n")
      .map(x => x.trim())
      .filter(x => x.length > 0);

    if (items.length === 0) return;

    buildList();

    // FIX: re-enable spin button
    spinBtn.disabled = false;
    spinBtn.textContent = "Spin Random";
    spinBtn.style.opacity = "1";
  });

  // --- ENTER TO ADD ---
  singleInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const value = singleInput.value.trim();
    if (!value) return;

    items.push(value);
    singleInput.value = "";

    buildList();

    // FIX: re-enable spin button
    spinBtn.disabled = false;
    spinBtn.textContent = "Spin Random";
    spinBtn.style.opacity = "1";
  });

  // --- RESET ---
  resetBtn.addEventListener("click", () => {
    items = [];
    list.innerHTML = "";
    bulkInput.value = "";
    singleInput.value = "";
    wheel.scrollTop = 0;
    updateCount();
  });

  // --- RANDOM SPIN ---
  spinBtn.addEventListener("click", () => {
    if (items.length === 0 || isSpinning) return;

    const randomIndex = Math.floor(Math.random() * items.length);
    spinToIndex(randomIndex);
  });

  // --- SPIN TO INDEX ---
  function spinToIndex(i) {
    if (isSpinning) return;

    const total = items.length * itemHeight;
    const middleStart = total;

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = "Spinning...";
    spinBtn.style.opacity = "0.5";

    spinLoop.currentTime = 0;
    spinLoop.play();

    const bigSpin = total * 40;
    const target = wheel.scrollTop + bigSpin + (i * itemHeight);
    const normalized = (target % total) + middleStart - centerOffset;

    smoothScrollTo(wheel, normalized, 3000, () => {
      playTick();
      lastIndex = i;

      // ADD WINNER
      if (items[i] !== undefined) {
        winners.push(items[i]);
        updateWinnersUI();
      }

      // AUTO REMOVE MODE
      if (autoRemove) {
        const winner = items[i];
        items = items.filter(item => item !== winner);
        buildList();

        if (items.length === 0) {
          spinBtn.disabled = true;
          spinBtn.textContent = "No Items";
        }
      }

      spinLoop.pause();
      spinLoop.currentTime = 0;

      isSpinning = false;
      spinBtn.disabled = false;
      spinBtn.textContent = "Spin Random";
      spinBtn.style.opacity = "1";
    });
  }

  // CLEAR WINNERS
  clearWinnersBtn.addEventListener("click", () => {
    winners = [];
    updateWinnersUI();
  });

  // REMOVE WINNERS FROM WHEEL
  removeFromWheelBtn.addEventListener("click", () => {
    if (winners.length === 0) return;

    items = items.filter(item => !winners.includes(item));

    buildList();

    winners = [];
    updateWinnersUI();

    if (items.length === 0) {
      spinBtn.disabled = true;
      spinBtn.textContent = "No Items";
    }
  });

  // HIDE BUTTON
  hideWinnersBtn.addEventListener("click", () => {
    const list = document.getElementById("winnersList");
    const buttons = document.getElementById("winnerButtons");

    if (list.style.display === "none") {
      list.style.display = "block";
      buttons.style.display = "block";
      hideWinnersBtn.textContent = "Hide";
    } else {
      list.style.display = "none";
      buttons.style.display = "none";
      hideWinnersBtn.textContent = "Show";
    }
  });

  // AUTO REMOVE BUTTON
  autoRemoveBtn.addEventListener("click", () => {
    autoRemove = !autoRemove;
    autoRemoveBtn.classList.toggle("active");
    autoRemoveBtn.textContent = autoRemove ? "Auto ✓" : "Auto";
  });

});