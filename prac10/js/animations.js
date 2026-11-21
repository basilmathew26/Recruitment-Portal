/* =====================================================
   Practicum 9 - Animated sequences for user interactions
   Uses: addEventListener(), classList.add(), classList.remove(),
         classList.toggle(), setTimeout()
   ===================================================== */
(function () {
  "use strict";

  /* ---------- 1. Toast notification (slides in, auto-hides) ---------- */
  var toastTimer;

  function showToast(message, type, duration) {
    var toast = document.getElementById("toast");
    if (!toast) return;

    toast.querySelector("span").textContent = message;
    toast.classList.remove("success", "error", "info", "show");
    toast.classList.add(type || "info");

    // restart the animation if a toast is already visible
    void toast.offsetWidth;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, duration || 3000);
  }

  // shared with the scripts of later practicums
  window.showToast = showToast;

  /* ---------- 2. Button click feedback (quick "pop") ---------- */
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;

    button.classList.add("clicked");
    setTimeout(function () {
      button.classList.remove("clicked");
    }, 300);
  });

  /* ---------- 3. Featured cards: show / hide the info card ---------- */
  document.querySelectorAll(".details-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var card = document.getElementById(button.getAttribute("aria-controls"));
      var isOpen = card.classList.toggle("open");
      button.setAttribute("aria-expanded", isOpen);
      button.textContent = isOpen ? "Hide details" : "Quick details";
    });
  });

  /* ---------- 4. "Notify me" button + notification ---------- */
  document.querySelectorAll(".notify-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var job = button.getAttribute("data-job");
      var active = button.classList.toggle("active");
      button.textContent = active ? "Notifying" : "Notify me";

      if (active) {
        showToast("Done! We will notify you about new " + job + " jobs.", "success");
      } else {
        showToast("Notifications turned off for " + job + ".", "info");
      }
    });
  });

  /* ---------- 5. Collapsible content sections (open / close) ---------- */
  document.querySelectorAll(".toggle-section").forEach(function (button) {
    button.addEventListener("click", function () {
      var body = document.getElementById(button.getAttribute("aria-controls"));
      var collapsed = body.classList.toggle("collapsed");
      button.setAttribute("aria-expanded", !collapsed);
      button.textContent = collapsed ? "Show" : "Hide";
    });
  });

  /* ---------- 6. Gallery: heart "like" animation ---------- */
  document.querySelectorAll(".heart").forEach(function (button) {
    button.addEventListener("click", function () {
      var liked = button.classList.toggle("liked");
      button.setAttribute("aria-pressed", liked);
      if (liked) {
        button.classList.add("beat");
        setTimeout(function () {
          button.classList.remove("beat");
        }, 600);
        showToast("Photo added to your favourites.", "success", 2000);
      }
    });
  });

  /* ---------- 7. Contact page: copy buttons ---------- */
  document.querySelectorAll(".copy-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy");
      var done = function () {
        button.classList.add("copied");
        button.textContent = "Copied";
        showToast("Copied: " + text, "success", 2000);
        setTimeout(function () {
          button.classList.remove("copied");
          button.textContent = "Copy";
        }, 1500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          showToast("Copy not allowed here. Please copy it manually.", "error");
        });
      } else {
        showToast("Copy not supported in this browser.", "error");
      }
    });
  });

  /* ---------- 8. Apply form: submit / reset feedback ---------- */
  var form = document.querySelector("#application form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var submit = form.querySelector('button[type="submit"]');
      submit.classList.add("loading");
      submit.textContent = "Sending...";
      setTimeout(function () {
        submit.classList.remove("loading");
        submit.textContent = "Apply Now";
        showToast("Application submitted successfully!", "success");
        form.reset();
      }, 1500);
    });

    form.addEventListener("reset", function () {
      showToast("Form cleared.", "info", 2000);
    });
  }
})();
