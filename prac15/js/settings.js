/* =====================================================
   Practicum 15 - Custom toggle switches
   Uses: addEventListener(), checked, classList.toggle(),
         localStorage.setItem(), localStorage.getItem()
   This file runs on EVERY page so the saved settings are
   applied everywhere; the switches exist only on settings.html.
   ===================================================== */
(function () {
  "use strict";

  var KEY = "hirehubSettings";
  var DEFAULTS = { dark: false, hideSalary: false, alerts: false, reduceMotion: false };
  var root = document.documentElement;

  /* ---------- Local Storage ---------- */
  function load() {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (error) {
      saved = {};
    }
    return Object.assign({}, DEFAULTS, saved);
  }

  function save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (error) {
      if (window.showToast) window.showToast("Settings could not be saved in this browser.", "error");
    }
  }

  var settings = load();

  /* ---------- Apply the settings to the page ---------- */
  function applyAll() {
    root.classList.toggle("dark", settings.dark);
    root.classList.toggle("hide-salary", settings.hideSalary);
    root.classList.toggle("no-motion", settings.reduceMotion);
    updateAlertPill();
  }

  /* small "Job alerts on" label in the page header */
  function updateAlertPill() {
    var header = document.querySelector("body > header");
    if (!header) return;
    var pill = header.querySelector(".alert-pill");

    if (settings.alerts && !pill) {
      pill = document.createElement("span");
      pill.className = "alert-pill";
      pill.textContent = "Job alerts on";
      header.appendChild(pill);
    } else if (!settings.alerts && pill) {
      pill.remove();
    }
  }

  /* ---------- Job alerts: a notification while the setting is on ---------- */
  var ALERTS = [
    "New vacancy: Web Developer at TechNova Solutions, Bengaluru.",
    "New vacancy: Data Analyst at DataWise Analytics, Chennai.",
    "Urgent: HR Executive needed at PeopleFirst Consulting, Kochi."
  ];
  var alertTimer;

  function scheduleAlert(delay) {
    clearTimeout(alertTimer);
    if (!settings.alerts) return;
    alertTimer = setTimeout(function () {
      if (!settings.alerts || !window.showToast) return;
      var pick = ALERTS[Math.floor(Math.random() * ALERTS.length)];
      window.showToast(pick, "info", 4000);
    }, delay);
  }

  applyAll();                                  // runs on every page
  scheduleAlert(2500);                         // alert shortly after the page opens

  /* =====================================================
     SETTINGS PAGE: the switches
     ===================================================== */
  var switches = document.querySelectorAll("input[data-setting]");
  if (switches.length === 0) return;

  var LABELS = {
    dark: "Dark mode",
    hideSalary: "Salary details hidden",
    alerts: "Job alerts",
    reduceMotion: "Reduced animations"
  };

  function showState(input) {
    var key = input.getAttribute("data-setting");
    var state = document.getElementById("state-" + key);
    state.textContent = input.checked ? "On" : "Off";
    state.classList.toggle("on", input.checked);      // change the label colour
  }

  switches.forEach(function (input) {
    var key = input.getAttribute("data-setting");

    input.checked = settings[key];                    // restore the saved position
    showState(input);

    input.addEventListener("change", function () {
      settings[key] = input.checked;                  // read the switch
      save(settings);
      applyAll();
      showState(input);

      if (window.showToast) {
        window.showToast(
          LABELS[key] + (input.checked ? " enabled." : " disabled."),
          input.checked ? "success" : "info",
          2000
        );
      }
      if (key === "alerts") scheduleAlert(input.checked ? 3000 : 0);
    });
  });

  document.getElementById("reset-settings").addEventListener("click", function () {
    settings = Object.assign({}, DEFAULTS);
    save(settings);
    applyAll();
    switches.forEach(function (input) {
      input.checked = settings[input.getAttribute("data-setting")];
      showState(input);
    });
    clearTimeout(alertTimer);
    if (window.showToast) window.showToast("Settings restored to defaults.", "info", 2000);
  });
})();
