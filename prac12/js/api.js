/* =====================================================
   Practicum 12 - Endpoint data management
   Uses: fetch(), async / await, response.json(), try / catch / finally,
         createElement(), appendChild(), textContent
   ===================================================== */
(function () {
  "use strict";

  var USERS_URL = "https://jsonplaceholder.typicode.com/users";
  var BAD_URL = "https://jsonplaceholder.typicode.com/invalid-endpoint"; // 404, used for the error test
  var TIMEOUT_MS = 8000;

  /* sample mapping: the demo API has no job data, so each user is
     shown as applying for one of HireHub's vacancies */
  var JOBS = ["Web Developer", "Data Analyst", "HR Executive",
              "UI/UX Designer", "Software Tester", "Digital Marketing Intern"];

  var loader = document.getElementById("loader");
  var errorBox = document.getElementById("error-box");
  var errorText = document.getElementById("error-text");
  var summary = document.getElementById("summary");
  var tableWrap = document.getElementById("table-wrap");
  var tbody = document.getElementById("candidate-body");
  var statusMsg = document.getElementById("status-msg");
  var loadBtn = document.getElementById("load-btn");
  var lastUrl = USERS_URL;

  if (!loadBtn) return;

  /* ---------- show / hide helpers ---------- */
  function setLoading(isLoading) {
    loader.hidden = !isLoading;
    loadBtn.disabled = isLoading;
    document.getElementById("error-btn").disabled = isLoading;
    loadBtn.textContent = isLoading ? "Loading..." : "Load Candidates";
  }

  function showError(message) {
    errorText.textContent = message;
    errorBox.hidden = false;
    summary.hidden = true;
    tableWrap.hidden = true;
    statusMsg.textContent = "";
  }

  /* ---------- turn the JSON into table rows ---------- */
  function addCell(row, label, text) {
    var td = document.createElement("td");
    td.setAttribute("data-label", label);
    td.textContent = text;
    row.appendChild(td);
  }

  function renderTable(users) {
    tbody.innerHTML = "";

    users.forEach(function (user, index) {
      var row = document.createElement("tr");
      addCell(row, "ID", user.id);
      addCell(row, "Name", user.name);
      addCell(row, "Email", user.email.toLowerCase());
      addCell(row, "City", user.address && user.address.city ? user.address.city : "-");
      addCell(row, "Employer", user.company && user.company.name ? user.company.name : "-");
      addCell(row, "Phone", user.phone ? user.phone.split(" x")[0] : "-");
      addCell(row, "Applying For", JOBS[index % JOBS.length]);
      tbody.appendChild(row);
    });
  }

  function renderSummary(users, ms) {
    var cities = new Set(users.map(function (u) { return u.address && u.address.city; }));
    var companies = new Set(users.map(function (u) { return u.company && u.company.name; }));

    document.getElementById("stat-total").textContent = users.length;
    document.getElementById("stat-cities").textContent = cities.size;
    document.getElementById("stat-companies").textContent = companies.size;
    document.getElementById("stat-time").textContent = ms;
  }

  /* ---------- the main async function ---------- */
  async function loadData(url) {
    lastUrl = url;
    errorBox.hidden = true;
    setLoading(true);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    var started = performance.now();

    try {
      var response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error("Server replied with status " + response.status +
                        (response.statusText ? " (" + response.statusText + ")" : "") + ".");
      }

      var users = await response.json();           // parse the JSON body

      if (!Array.isArray(users) || users.length === 0) {
        throw new Error("The endpoint returned no candidate records.");
      }

      var elapsed = Math.round(performance.now() - started);
      renderTable(users);
      renderSummary(users, elapsed);

      summary.hidden = false;
      tableWrap.hidden = false;
      statusMsg.textContent = "Loaded " + users.length + " records at " +
                              new Date().toLocaleTimeString() + ".";
      if (window.showToast) window.showToast(users.length + " candidates loaded.", "success");

    } catch (error) {
      var message;
      if (error.name === "AbortError") {
        message = "The request took longer than " + (TIMEOUT_MS / 1000) +
                  " seconds and was cancelled. Please try again.";
      } else if (error instanceof TypeError) {
        message = "Could not reach the server. Check your internet connection and try again.";
      } else {
        message = error.message;
      }
      showError(message);
      if (window.showToast) window.showToast("Could not load the data.", "error");

    } finally {
      clearTimeout(timer);
      setLoading(false);                           // always runs: success or failure
    }
  }

  /* ---------- buttons ---------- */
  loadBtn.addEventListener("click", function () { loadData(USERS_URL); });

  document.getElementById("retry-btn").addEventListener("click", function () {
    loadData(lastUrl);
  });

  document.getElementById("error-btn").addEventListener("click", function () {
    loadData(BAD_URL);                             // deliberately wrong URL
  });

  document.getElementById("clear-btn").addEventListener("click", function () {
    tbody.innerHTML = "";
    summary.hidden = true;
    tableWrap.hidden = true;
    errorBox.hidden = true;
    statusMsg.textContent = "Data cleared. Click Load Candidates to fetch it again.";
  });

  /* load automatically when the page opens */
  loadData(USERS_URL);
})();
