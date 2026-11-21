/* =====================================================
   Practicum 13 - Task manager (CRUD + Local Storage)
   Uses: addEventListener(), createElement(), appendChild(), remove(),
         push(), filter(), find(), localStorage.setItem(),
         localStorage.getItem(), JSON.stringify(), JSON.parse()
   ===================================================== */
(function () {
  "use strict";

  var form = document.getElementById("task-form");
  if (!form) return;

  var STORAGE_KEY = "hirehubTasks";
  var tasks = [];                         // the single source of truth

  /* ---------- element shortcuts ---------- */
  var idField = document.getElementById("task-id");
  var titleField = document.getElementById("task-title");
  var priorityField = document.getElementById("task-priority");
  var statusField = document.getElementById("task-status");
  var dueField = document.getElementById("task-due");
  var notesField = document.getElementById("task-notes");
  var saveBtn = document.getElementById("save-btn");
  var cancelBtn = document.getElementById("cancel-btn");
  var formTitle = document.getElementById("form-title");
  var filterField = document.getElementById("filter-status");
  var tbody = document.getElementById("task-body");
  var emptyMsg = document.getElementById("task-empty");

  function notify(message, type) {
    if (window.showToast) window.showToast(message, type);
  }

  /* =====================================================
     LOCAL STORAGE
     ===================================================== */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      notify("Could not save tasks in this browser.", "error");
    }
  }

  function loadTasks() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        /* first visit: start with a few example tasks */
        var base = Date.now();
        return [
          { id: base + 1, title: "Screen Web Developer resumes", priority: "High",
            status: "In Progress", due: "", notes: "Shortlist 10 candidates for TechNova." },
          { id: base + 2, title: "Schedule HR interview round", priority: "Medium",
            status: "Pending", due: "", notes: "Coordinate with PeopleFirst Consulting." },
          { id: base + 3, title: "Send offer letters", priority: "Low",
            status: "Completed", due: "", notes: "" }
        ];
      }
      var parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];                           // storage blocked or data damaged
    }
  }

  /* =====================================================
     READ: draw the table and the counters
     ===================================================== */
  function formatDate(value) {
    if (!value) return "-";
    var parts = value.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function makeCell(label, child) {
    var td = document.createElement("td");
    td.setAttribute("data-label", label);
    if (typeof child === "string") td.textContent = child;
    else td.appendChild(child);
    return td;
  }

  function makeButton(text, className, handler) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mini-btn " + className;
    btn.textContent = text;
    btn.addEventListener("click", handler);
    return btn;
  }

  function render() {
    var filter = filterField.value;
    var visible = tasks.filter(function (t) {
      return filter === "All" || t.status === filter;
    });

    tbody.innerHTML = "";

    visible.forEach(function (task) {
      var row = document.createElement("tr");
      row.setAttribute("data-status", task.status);

      /* title + notes */
      var titleBox = document.createElement("div");
      var strong = document.createElement("strong");
      strong.textContent = task.title;
      titleBox.appendChild(strong);
      if (task.notes) {
        var note = document.createElement("small");
        note.className = "task-note";
        note.textContent = task.notes;
        titleBox.appendChild(note);
      }
      row.appendChild(makeCell("Task", titleBox));

      /* priority badge */
      var badge = document.createElement("span");
      badge.className = "priority " + task.priority.toLowerCase();
      badge.textContent = task.priority;
      row.appendChild(makeCell("Priority", badge));

      row.appendChild(makeCell("Due", formatDate(task.due)));

      /* UPDATE status straight from the table */
      var select = document.createElement("select");
      select.className = "status-select";
      select.setAttribute("aria-label", "Status of " + task.title);
      ["Pending", "In Progress", "Completed"].forEach(function (s) {
        var option = document.createElement("option");
        option.value = s;
        option.textContent = s;
        if (s === task.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        updateStatus(task.id, select.value);
      });
      row.appendChild(makeCell("Status", select));

      /* edit / delete */
      var actions = document.createElement("div");
      actions.className = "row-actions";
      actions.appendChild(makeButton("Edit", "", function () { startEdit(task.id); }));
      actions.appendChild(makeButton("Delete", "danger", function () { deleteTask(task.id); }));
      row.appendChild(makeCell("Actions", actions));

      tbody.appendChild(row);
    });

    /* empty-state message */
    if (visible.length === 0) {
      emptyMsg.hidden = false;
      emptyMsg.textContent = tasks.length === 0
        ? "No tasks yet. Add your first task using the form above."
        : "No tasks match this filter.";
    } else {
      emptyMsg.hidden = true;
    }
    document.querySelector("#task-list table").hidden = visible.length === 0;

    /* counters */
    function count(status) {
      return tasks.filter(function (t) { return t.status === status; }).length;
    }
    document.getElementById("count-total").textContent = tasks.length;
    document.getElementById("count-pending").textContent = count("Pending");
    document.getElementById("count-progress").textContent = count("In Progress");
    document.getElementById("count-done").textContent = count("Completed");
  }

  /* =====================================================
     CREATE and UPDATE (same form)
     ===================================================== */
  function resetForm() {
    form.reset();
    idField.value = "";
    formTitle.textContent = "Add a Recruitment Task";
    saveBtn.textContent = "Add Task";
    cancelBtn.hidden = true;
  }

  function startEdit(id) {
    var task = tasks.find(function (t) { return t.id === id; });   // find()
    if (!task) return;

    idField.value = task.id;
    titleField.value = task.title;
    priorityField.value = task.priority;
    statusField.value = task.status;
    dueField.value = task.due;
    notesField.value = task.notes;

    formTitle.textContent = "Edit Task";
    saveBtn.textContent = "Update Task";
    cancelBtn.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    titleField.focus();
  }

  function updateStatus(id, status) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.status = status;
    saveTasks();
    render();
    notify("Status changed to " + status + ".", "info");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var title = titleField.value.trim();
    if (title.length < 3) {
      notify("Task title must have at least 3 characters.", "error");
      titleField.focus();
      return;
    }

    var data = {
      title: title,
      priority: priorityField.value,
      status: statusField.value,
      due: dueField.value,
      notes: notesField.value.trim()
    };

    if (idField.value === "") {
      /* CREATE */
      data.id = Date.now();
      tasks.push(data);                                            // push()
      notify("Task added.", "success");
    } else {
      /* UPDATE */
      var task = tasks.find(function (t) { return t.id === Number(idField.value); });
      if (task) {
        task.title = data.title;
        task.priority = data.priority;
        task.status = data.status;
        task.due = data.due;
        task.notes = data.notes;
        notify("Task updated.", "success");
      }
    }

    saveTasks();
    resetForm();
    render();
  });

  cancelBtn.addEventListener("click", function () {
    resetForm();
    notify("Edit cancelled.", "info");
  });

  /* =====================================================
     DELETE
     ===================================================== */
  function deleteTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task || !window.confirm('Delete the task "' + task.title + '"?')) return;

    tasks = tasks.filter(function (t) { return t.id !== id; });    // filter()
    if (idField.value === String(id)) resetForm();
    saveTasks();
    render();
    notify("Task deleted.", "info");
  }

  document.getElementById("clear-done").addEventListener("click", function () {
    var done = tasks.filter(function (t) { return t.status === "Completed"; }).length;
    if (done === 0) {
      notify("There are no completed tasks to delete.", "info");
      return;
    }
    if (!window.confirm("Delete all " + done + " completed task(s)?")) return;

    tasks = tasks.filter(function (t) { return t.status !== "Completed"; });
    saveTasks();
    render();
    notify(done + " completed task(s) deleted.", "info");
  });

  filterField.addEventListener("change", render);

  /* ---------- start-up ---------- */
  tasks = loadTasks();
  saveTasks();                              // store the sample tasks on the first visit
  render();
})();
