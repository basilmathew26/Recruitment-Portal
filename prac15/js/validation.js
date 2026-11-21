/* =====================================================
   Practicum 11 - Form validation
   Uses: addEventListener(), preventDefault(), checkValidity(),
         reportValidity(), setCustomValidity()
   HTML attributes: required, type, min, max, minlength,
                    maxlength, pattern, placeholder
   ===================================================== */
(function () {
  "use strict";

  var form = document.querySelector("#application form");
  if (!form) return;

  var summary = document.getElementById("form-summary");
  var success = document.getElementById("success-message");
  var submitBtn = form.querySelector('button[type="submit"]');

  /* We show our own messages, so switch off the browser's default bubbles.
     (Without JavaScript the HTML attributes still validate normally.) */
  form.noValidate = true;

  /* ---------- Fields that are validated ---------- */
  var fields = Array.from(form.elements).filter(function (el) {
    var skip = ["submit", "reset", "button", "fieldset"];
    return el.name && skip.indexOf(el.type) === -1 && el.name !== "skills";
  });

  /* a radio group is one field: count only its first button in the error total */
  var countable = fields.filter(function (el, i) {
    return el.type !== "radio" || fields.findIndex(function (o) { return o.name === el.name; }) === i;
  });

  var password = document.getElementById("password");
  var confirmPw = document.getElementById("confirm");
  var dob = document.getElementById("dob");
  var joindate = document.getElementById("joindate");
  var resume = document.getElementById("resume");
  var cover = document.getElementById("cover");

  /* ---------- Date limits that never go out of date ---------- */
  function iso(date) {
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }

  var today = new Date();
  var eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  dob.max = iso(eighteenYearsAgo);                       // must be 18 or older

  if (iso(today) > joindate.min) joindate.min = iso(today); // not in the past

  /* ---------- Friendly messages for each kind of error ---------- */
  var MESSAGES = {
    fullname:   { valueMissing: "Please enter your full name.",
                  tooShort: "Name must be at least 3 characters." },
    email:      { valueMissing: "Please enter your email address.",
                  typeMismatch: "Enter a valid email such as you@example.com." },
    phone:      { valueMissing: "Please enter your mobile number.",
                  patternMismatch: "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.",
                  tooShort: "Mobile number must have 10 digits." },
    dob:        { valueMissing: "Please select your date of birth.",
                  rangeOverflow: "You must be at least 18 years old to apply." },
    password:   { valueMissing: "Please create a password.",
                  tooShort: "Password must have at least 8 characters.",
                  patternMismatch: "Use at least one letter and one number." },
    confirm:    { valueMissing: "Please re-enter your password.",
                  tooShort: "Password must have at least 8 characters." },
    position:   { valueMissing: "Please choose the position you are applying for." },
    jobtype:    { valueMissing: "Please select a job type." },
    joindate:   { valueMissing: "Please tell us when you can join.",
                  rangeUnderflow: "Available date cannot be in the past." },
    experience: { valueMissing: "Enter your years of experience (0 if fresher).",
                  rangeUnderflow: "Experience cannot be negative.",
                  rangeOverflow: "Experience cannot be more than 40 years.",
                  stepMismatch: "Enter a whole number of years.",
                  badInput: "Enter a valid number." },
    salary:     { rangeUnderflow: "Expected salary must be at least 1 LPA.",
                  rangeOverflow: "Expected salary cannot be more than 50 LPA.",
                  stepMismatch: "Use steps of 0.5 (for example 6 or 6.5).",
                  badInput: "Enter a valid number." },
    resume:     { valueMissing: "Please upload your resume." },
    terms:      { valueMissing: "You must confirm the declaration to continue." }
  };

  /* ---------- Rules that HTML attributes cannot express ---------- */
  function applyCustomRules(el) {
    el.setCustomValidity("");                 // clear the old custom message first

    if (el.id === "fullname" && el.value.trim() !== "") {
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(el.value.trim())) {
        el.setCustomValidity("Name can contain only letters, spaces and . ' - characters.");
      }
    }

    if (el.id === "phone" && el.value !== "" && /\D/.test(el.value)) {
      el.setCustomValidity("Mobile number must contain digits only.");
    }

    if (el.id === "confirm" && el.value !== "" && el.value !== password.value) {
      el.setCustomValidity("Passwords do not match.");
    }

    if (el.id === "resume" && el.files.length > 0) {
      var file = el.files[0];
      if (!/\.(pdf|docx?)$/i.test(file.name)) {
        el.setCustomValidity("Only PDF or Word files (.pdf, .doc, .docx) are allowed.");
      } else if (file.size > 2 * 1024 * 1024) {
        el.setCustomValidity("Resume is too large. Maximum size is 2 MB.");
      }
    }
  }

  function errorBoxFor(el) {
    var key = el.type === "radio" ? el.name : el.id;
    return document.getElementById(key + "-error");
  }

  function messageFor(el) {
    if (el.validity.customError) return el.validationMessage;

    var key = el.type === "radio" ? el.name : el.id;
    var set = MESSAGES[key] || {};
    var reasons = ["valueMissing", "typeMismatch", "patternMismatch", "tooShort",
                   "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput"];

    for (var i = 0; i < reasons.length; i++) {
      if (el.validity[reasons[i]]) {
        return set[reasons[i]] || el.validationMessage;
      }
    }
    return el.validationMessage;
  }

  /* ---------- Check ONE field and show / clear its message ---------- */
  function validateField(el) {
    applyCustomRules(el);
    var valid = el.checkValidity();               // true / false (fires no bubble)
    var box = errorBoxFor(el);

    if (box) box.textContent = valid ? "" : messageFor(el);
    el.setAttribute("aria-invalid", valid ? "false" : "true");
    return valid;
  }

  function markTouched(el) {
    if (el.type === "radio") {
      form.querySelectorAll('input[name="' + el.name + '"]').forEach(function (r) {
        r.classList.add("touched");
      });
    } else {
      el.classList.add("touched");
    }
  }

  /* ---------- Live feedback while the user types ---------- */
  fields.forEach(function (el) {
    var eventName = (el.tagName === "SELECT" || el.type === "file" ||
                     el.type === "radio" || el.type === "checkbox") ? "change" : "input";

    el.addEventListener("blur", function () {
      markTouched(el);
      validateField(el);
    });

    el.addEventListener(eventName, function () {
      if (el.classList.contains("touched") || eventName === "change") {
        markTouched(el);
        validateField(el);
      }
      // keep "confirm password" in step with the password field
      if (el === password && confirmPw.classList.contains("touched")) {
        validateField(confirmPw);
      }
    });
  });

  /* ---------- Password strength hint ---------- */
  var strength = document.getElementById("password-strength");
  password.addEventListener("input", function () {
    var v = password.value;
    var score = 0;
    if (v.length >= 8) score++;
    if (/[A-Za-z]/.test(v) && /[0-9]/.test(v)) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    var labels = ["", "Weak", "Fair", "Good", "Strong"];
    strength.textContent = v === "" ? "" : "Strength: " + labels[score || 1];
    strength.className = "hint strength-" + (v === "" ? 0 : score || 1);
  });

  /* ---------- Cover letter counter ---------- */
  var counter = document.getElementById("cover-count");
  function updateCounter() {
    var length = cover.value.length;
    counter.textContent = length + " / " + cover.maxLength;
    counter.classList.toggle("warn", length >= 450);
  }
  cover.addEventListener("input", updateCounter);

  /* ---------- Submit: validate everything ---------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();                       // stop the normal submit
    success.hidden = true;

    var invalid = [];
    fields.forEach(function (el) {
      markTouched(el);
      if (!validateField(el) && countable.indexOf(el) !== -1) invalid.push(el);
    });

    if (invalid.length > 0) {
      summary.hidden = false;
      summary.textContent =
        "Please correct " + invalid.length + " field" +
        (invalid.length > 1 ? "s" : "") + " marked in red and submit again.";
      summary.scrollIntoView({ behavior: "smooth", block: "start" });
      invalid[0].focus();
      invalid[0].reportValidity();                // browser bubble on first error
      if (window.showToast) window.showToast("The form has errors.", "error");
      return;
    }

    /* everything is valid: simulate sending the application */
    summary.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    submitBtn.classList.add("loading");

    var name = document.getElementById("fullname").value.trim();
    var position = document.getElementById("position");
    var positionText = position.options[position.selectedIndex].text.trim();
    var reference = "HH-" + Math.floor(100000 + Math.random() * 900000);

    setTimeout(function () {
      success.innerHTML = "";
      var title = document.createElement("strong");
      title.textContent = "Application submitted successfully!";
      var details = document.createElement("span");
      details.textContent =
        " Thank you, " + name + ". Your application for " + positionText +
        " has been received. Reference number: " + reference + ".";
      success.appendChild(title);
      success.appendChild(details);
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "start" });

      form.reset();                               // also fires the reset handler below
      submitBtn.disabled = false;
      submitBtn.textContent = "Apply Now";
      submitBtn.classList.remove("loading");
      if (window.showToast) window.showToast("Application " + reference + " submitted.", "success");
    }, 1200);
  });

  /* ---------- Reset: clear every message and state ---------- */
  form.addEventListener("reset", function () {
    setTimeout(function () {
      fields.forEach(function (el) {
        el.classList.remove("touched");
        el.setCustomValidity("");
        el.removeAttribute("aria-invalid");
        var box = errorBoxFor(el);
        if (box) box.textContent = "";
      });
      summary.hidden = true;
      strength.textContent = "";
      updateCounter();
    }, 0);
  });

  updateCounter();
})();
