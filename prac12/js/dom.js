/* =====================================================
   Practicum 10 - DOM manipulation
   Uses: getElementById(), querySelector(), createElement(),
         appendChild(), remove(), innerHTML, textContent,
         setAttribute(), addEventListener()
   Nothing here reloads the page.
   ===================================================== */
(function () {
  "use strict";

  function notify(message, type) {
    if (window.showToast) window.showToast(message, type);
  }

  /* helper: build an element in one line */
  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  /* =====================================================
     HOME PAGE
     ===================================================== */

  /* ---------- 1. Greeting: MODIFY existing text ---------- */
  var greetBtn = document.getElementById("greet-btn");
  if (greetBtn) {
    var nameInput = document.getElementById("visitor-name");
    var heading = document.querySelector("#hero h2");
    var original = heading.textContent;

    var greet = function () {
      var name = nameInput.value.trim();
      if (name === "") {
        heading.textContent = original;
        nameInput.setAttribute("placeholder", "Please type your name first");
        nameInput.focus();
        return;
      }
      heading.textContent = "Welcome to HireHub, " + name + "!";
      nameInput.setAttribute("placeholder", "Type your name");
      notify("Hello " + name + "! Explore the vacancies below.", "success");
    };

    greetBtn.addEventListener("click", greet);
    nameInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") greet();
    });
  }

  /* ---------- 2. Saved jobs: ADD and REMOVE list items ---------- */
  var savedList = document.getElementById("saved-list");
  if (savedList) {
    var savedCount = document.getElementById("saved-count");
    var savedEmpty = document.getElementById("saved-empty");

    var refreshSaved = function () {
      var total = savedList.children.length;
      savedCount.textContent = total;
      savedEmpty.hidden = total > 0;
      savedEmpty.innerHTML =
        "No saved jobs yet. Click <strong>Save job</strong> on a featured card.";
    };

    document.querySelectorAll(".save-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        var title = button.getAttribute("data-title");

        if (savedList.querySelector('[data-title="' + title + '"]')) {
          notify(title + " is already in your saved list.", "info");
          return;
        }

        var item = make("li", "saved-item");
        item.setAttribute("data-title", title);

        var label = make(
          "span",
          "",
          title + " - " + button.getAttribute("data-company") +
            " (" + button.getAttribute("data-location") + ")"
        );

        var remove = make("button", "mini-btn danger", "Remove");
        remove.setAttribute("type", "button");
        remove.setAttribute("aria-label", "Remove " + title + " from saved jobs");
        remove.addEventListener("click", function () {
          item.classList.add("removing");
          setTimeout(function () {
            item.remove();
            refreshSaved();
            button.textContent = "Save job";
            button.classList.remove("saved");
            button.setAttribute("aria-pressed", "false");
          }, 350);
        });

        item.appendChild(label);
        item.appendChild(remove);
        savedList.appendChild(item);

        button.textContent = "Saved";
        button.classList.add("saved");
        button.setAttribute("aria-pressed", "true");
        refreshSaved();
        notify(title + " saved.", "success");
      });
    });

    refreshSaved();
  }

  /* =====================================================
     JOBS PAGE
     ===================================================== */
  var tbody = document.querySelector("#job-list tbody");
  if (tbody) {
    var form = document.getElementById("add-vacancy-form");
    var countEl = document.getElementById("vacancy-count");
    var emptyMsg = document.getElementById("jobs-empty");
    var shortlistUl = document.getElementById("shortlist");
    var shortlistCount = document.getElementById("shortlist-count");
    var shortlistEmpty = document.getElementById("shortlist-empty");

    var LABELS = ["Job Title", "Company", "Location", "Eligibility", "Skills", "Salary", "Apply"];

    /* cell text helper (the first cell may contain a "New" tag) */
    var titleOf = function (row) {
      return row.cells[0].childNodes[0].textContent.trim();
    };
    var companyOf = function (row) {
      return row.cells[1].textContent.trim();
    };

    /* ---------- DISPLAY: counters and empty messages ---------- */
    var updateCount = function () {
      var total = tbody.rows.length;
      countEl.textContent = total;
      emptyMsg.hidden = total > 0;
    };

    /* ---------- DISPLAY: rebuild the shortlist panel ---------- */
    var syncShortlist = function () {
      shortlistUl.innerHTML = "";               // clear the old list
      var chosen = tbody.querySelectorAll('tr[data-shortlisted="true"]');

      chosen.forEach(function (row) {
        var li = make("li", "saved-item");
        li.appendChild(make("span", "", titleOf(row) + " - " + companyOf(row)));

        var undo = make("button", "mini-btn danger", "Remove");
        undo.setAttribute("type", "button");
        undo.addEventListener("click", function () {
          row.removeAttribute("data-shortlisted");
          syncShortlist();
        });
        li.appendChild(undo);
        shortlistUl.appendChild(li);
      });

      shortlistCount.textContent = chosen.length;
      shortlistEmpty.hidden = chosen.length > 0;

      /* keep each row's button text in step with its attribute */
      tbody.querySelectorAll("tr").forEach(function (row) {
        var btn = row.querySelector(".shortlist-btn");
        if (btn) {
          var on = row.getAttribute("data-shortlisted") === "true";
          btn.textContent = on ? "Shortlisted" : "Shortlist";
          btn.setAttribute("aria-pressed", on);
        }
      });
    };

    /* ---------- MODIFY: edit the salary cell in place ---------- */
    var editSalary = function (row) {
      var cell = row.cells[5];
      if (cell.querySelector("input")) return;      // already editing

      var oldValue = cell.textContent.trim();
      cell.innerHTML = "";

      var input = make("input", "inline-input");
      input.setAttribute("type", "text");
      input.setAttribute("aria-label", "New salary for " + titleOf(row));
      input.value = oldValue;

      var save = make("button", "mini-btn", "Save");
      save.setAttribute("type", "button");

      var finish = function (keep) {
        var value = input.value.trim();
        cell.textContent = keep && value !== "" ? value : oldValue;
        if (keep && value !== "" && value !== oldValue) {
          notify("Salary for " + titleOf(row) + " updated.", "success");
        }
      };

      save.addEventListener("click", function () { finish(true); });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") finish(true);
        if (event.key === "Escape") finish(false);
      });

      cell.appendChild(input);
      cell.appendChild(save);
      input.focus();
    };

    /* ---------- REMOVE: delete a row with a short fade-out ---------- */
    var removeRow = function (row) {
      var title = titleOf(row);
      row.classList.add("removing");
      setTimeout(function () {
        row.remove();
        updateCount();
        syncShortlist();
        notify(title + " removed from the table.", "info");
      }, 400);
    };

    /* ---------- add the action buttons to a row ---------- */
    var addActions = function (row) {
      var cell = row.cells[6];
      var wrap = make("div", "row-actions");

      var applyLink = cell.querySelector("a");
      if (applyLink) wrap.appendChild(applyLink);

      var shortlistBtn = make("button", "mini-btn shortlist-btn", "Shortlist");
      shortlistBtn.setAttribute("type", "button");
      shortlistBtn.addEventListener("click", function () {
        if (row.getAttribute("data-shortlisted") === "true") {
          row.removeAttribute("data-shortlisted");
        } else {
          row.setAttribute("data-shortlisted", "true");
          notify(titleOf(row) + " shortlisted.", "success");
        }
        syncShortlist();
      });

      var editBtn = make("button", "mini-btn", "Edit");
      editBtn.setAttribute("type", "button");
      editBtn.addEventListener("click", function () { editSalary(row); });

      var removeBtn = make("button", "mini-btn danger", "Remove");
      removeBtn.setAttribute("type", "button");
      removeBtn.addEventListener("click", function () { removeRow(row); });

      wrap.appendChild(shortlistBtn);
      wrap.appendChild(editBtn);
      wrap.appendChild(removeBtn);
      cell.appendChild(wrap);
    };

    /* existing rows from the HTML get the same buttons */
    tbody.querySelectorAll("tr").forEach(addActions);

    /* ---------- ADD: create a new row from the form ---------- */
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var values = [
        document.getElementById("nv-title").value.trim(),
        document.getElementById("nv-company").value.trim(),
        document.getElementById("nv-location").value.trim(),
        document.getElementById("nv-eligibility").value.trim(),
        document.getElementById("nv-skills").value.trim(),
        document.getElementById("nv-salary").value.trim()
      ];

      if (values.some(function (v) { return v === ""; })) {
        notify("Please fill in every field.", "error");
        return;
      }

      var row = document.createElement("tr");
      row.setAttribute("data-custom", "true");
      row.classList.add("new-row");

      values.forEach(function (value, i) {
        var td = document.createElement("td");
        td.setAttribute("data-label", LABELS[i]);
        td.textContent = value;
        row.appendChild(td);
      });

      var applyCell = document.createElement("td");
      applyCell.setAttribute("data-label", "Apply");
      var link = make("a", "", "Apply");
      link.setAttribute("href", "apply.html");
      applyCell.appendChild(link);
      row.appendChild(applyCell);

      addActions(row);
      tbody.appendChild(row);
      updateCount();
      form.reset();
      document.getElementById("nv-title").focus();
      notify(values[0] + " added to the vacancy table.", "success");

      row.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    /* ---------- REMOVE many: delete every vacancy added by the form ---------- */
    document.getElementById("clear-added").addEventListener("click", function () {
      var added = tbody.querySelectorAll("tr[data-custom]");
      if (added.length === 0) {
        notify("There are no added vacancies to remove.", "info");
        return;
      }
      added.forEach(function (row) { row.remove(); });
      updateCount();
      syncShortlist();
      notify(added.length + " added vacancies removed.", "info");
    });

    /* ---------- Recruiter mode: edit tools are hidden from normal visitors ---------- */
    var recruiterBtn = document.getElementById("recruiter-toggle");
    recruiterBtn.addEventListener("click", function () {
      var on = document.body.classList.toggle("recruiter");
      recruiterBtn.setAttribute("aria-pressed", on);
      recruiterBtn.textContent = "Recruiter mode: " + (on ? "On" : "Off");
      notify(on ? "Recruiter tools are now visible." : "Recruiter tools hidden.", "info");
    });

    updateCount();
    syncShortlist();
  }
})();
