/* =====================================================
   Practicum 14 - Interactive components
     1. Jobs page   : search and filter system
     2. Gallery page: category tabs + image lightbox
     3. Contact page: FAQ accordion
   Uses: addEventListener(), querySelector(), querySelectorAll(),
         classList.toggle/add/remove(), filter(), forEach(), find()
   ===================================================== */
(function () {
  "use strict";

  /* =====================================================
     1. JOBS: SEARCH + FILTER
     ===================================================== */
  var searchBox = document.getElementById("job-search");
  var jobBody = document.querySelector("#job-list tbody");

  if (searchBox && jobBody) {
    var locationSelect = document.getElementById("filter-location");
    var salarySelect = document.getElementById("filter-salary");
    var resetBtn = document.getElementById("filter-reset");
    var chips = document.querySelectorAll("#category-chips .chip");
    var countText = document.getElementById("filter-count");
    var noMatch = document.getElementById("no-match");
    var category = "all";

    /* work out a category from the job title */
    var CATEGORY_WORDS = [
      { name: "data",      words: ["data", "analyst", "analytics"] },
      { name: "design",    words: ["design", "ui", "ux"] },
      { name: "hr",        words: ["hr", "recruit", "human"] },
      { name: "marketing", words: ["marketing", "seo", "content", "social"] },
      { name: "tech",      words: ["developer", "tester", "engineer", "software", "web"] }
    ];

    function categoryOf(row) {
      var title = row.cells[0].textContent.toLowerCase();
      var match = CATEGORY_WORDS.find(function (c) {
        return c.words.some(function (w) {
          return new RegExp("\\b" + w + "\\b").test(title);
        });
      });
      return match ? match.name : "other";
    }

    /* "₹6-8 LPA" -> 6    "₹15,000/month" -> 1.8 LPA */
    function minSalaryOf(row) {
      var text = row.cells[5].textContent.replace(/,/g, "");
      var number = parseFloat(text.replace(/[^0-9.]/g, " ").trim().split(/\s+/)[0]);
      if (isNaN(number)) return 0;
      return /month/i.test(text) ? (number * 12) / 100000 : number;
    }

    /* fill the location drop-down from the table itself */
    function buildLocations() {
      var current = locationSelect.value;
      var places = Array.from(jobBody.rows)
        .map(function (r) { return r.cells[2].textContent.trim(); })
        .filter(function (p, i, all) { return p !== "" && all.indexOf(p) === i; })
        .sort();

      locationSelect.innerHTML = '<option value="all">All locations</option>';
      places.forEach(function (place) {
        var option = document.createElement("option");
        option.value = place.toLowerCase();
        option.textContent = place;
        locationSelect.appendChild(option);
      });
      locationSelect.value = current;
      if (locationSelect.value !== current) locationSelect.value = "all";
    }

    function applyFilters() {
      var query = searchBox.value.trim().toLowerCase();
      var place = locationSelect.value;
      var minSalary = parseFloat(salarySelect.value);
      var rows = Array.from(jobBody.rows);

      var visible = rows.filter(function (row) {
        var matchesText = query === "" || row.textContent.toLowerCase().indexOf(query) !== -1;
        var matchesPlace = place === "all" || row.cells[2].textContent.trim().toLowerCase() === place;
        var matchesSalary = minSalaryOf(row) >= minSalary;
        var matchesCategory = category === "all" || categoryOf(row) === category;
        return matchesText && matchesPlace && matchesSalary && matchesCategory;
      });

      rows.forEach(function (row) {
        row.classList.toggle("is-hidden", visible.indexOf(row) === -1);
      });

      countText.textContent = "Showing " + visible.length + " of " + rows.length + " vacancies.";
      noMatch.hidden = visible.length > 0 || rows.length === 0;
    }

    /* can also be called from other scripts to refresh the filters */
    window.applyJobFilters = function () {
      buildLocations();
      applyFilters();
    };

    searchBox.addEventListener("input", applyFilters);
    locationSelect.addEventListener("change", applyFilters);
    salarySelect.addEventListener("change", applyFilters);

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        category = chip.getAttribute("data-category");
        applyFilters();
      });
    });

    resetBtn.addEventListener("click", function () {
      searchBox.value = "";
      locationSelect.value = "all";
      salarySelect.value = "0";
      category = "all";
      chips.forEach(function (c) {
        c.classList.toggle("active", c.getAttribute("data-category") === "all");
      });
      applyFilters();
      searchBox.focus();
    });

    /* rows added or removed by js/dom.js: refresh automatically */
    new MutationObserver(function () {
      buildLocations();
      applyFilters();
    }).observe(jobBody, { childList: true });

    buildLocations();
    applyFilters();
  }

  /* =====================================================
     2. GALLERY: CATEGORY TABS + LIGHTBOX
     ===================================================== */
  var gallery = document.querySelector(".gallery");

  if (gallery) {
    var figures = Array.from(gallery.querySelectorAll("figure"));
    var tabs = document.querySelectorAll("#gallery-chips .chip");
    var galleryCount = document.getElementById("gallery-count");

    function showCategory(name) {
      var shown = 0;
      figures.forEach(function (figure) {
        var match = name === "all" || figure.getAttribute("data-category") === name;
        figure.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      galleryCount.textContent = "Showing " + shown + " of " + figures.length + " photos.";
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        showCategory(tab.getAttribute("data-category"));
      });
    });
    showCategory("all");

    /* ---------- lightbox ---------- */
    var box = document.getElementById("lightbox");
    var boxImg = box.querySelector("img");
    var boxCaption = box.querySelector("figcaption");
    var current = null;                                  // the figure on show

    function visibleFigures() {
      return figures.filter(function (f) { return !f.classList.contains("is-hidden"); });
    }

    function show(figure) {
      var img = figure.querySelector("img");
      current = figure;
      boxImg.classList.remove("swap");
      void boxImg.offsetWidth;                           // restart the animation
      boxImg.classList.add("swap");
      boxImg.src = img.getAttribute("src");
      boxImg.alt = img.getAttribute("alt");
      boxCaption.textContent = figure.querySelector("figcaption").textContent.replace(/\s+/g, " ").trim();
    }

    function openBox(figure) {
      show(figure);
      box.classList.add("open");
      document.body.classList.add("no-scroll");
      box.querySelector(".lb-close").focus();
    }

    function closeBox() {
      box.classList.remove("open");
      document.body.classList.remove("no-scroll");
      if (current) current.querySelector("img").focus({ preventScroll: true });
    }

    function step(direction) {
      var list = visibleFigures();
      var index = list.indexOf(current);
      show(list[(index + direction + list.length) % list.length]);
    }

    figures.forEach(function (figure) {
      var img = figure.querySelector("img");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.addEventListener("click", function () { openBox(figure); });
      img.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBox(figure);
        }
      });
    });

    box.querySelector(".lb-close").addEventListener("click", closeBox);
    box.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    box.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    box.addEventListener("click", function (event) {
      if (event.target === box) closeBox();              // click on the dark area
    });

    document.addEventListener("keydown", function (event) {
      if (!box.classList.contains("open")) return;
      if (event.key === "Escape") closeBox();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
  }

  /* =====================================================
     3. CONTACT: FAQ ACCORDION (only one answer open at a time)
     ===================================================== */
  var faqItems = document.querySelectorAll("#faq details");

  if (faqItems.length > 0) {
    var toggleAll = document.getElementById("faq-toggle-all");

    faqItems.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (item.open && !toggleAll.classList.contains("all-open")) {
          faqItems.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        }
      });
    });

    toggleAll.addEventListener("click", function () {
      var expand = !toggleAll.classList.contains("all-open");
      toggleAll.classList.toggle("all-open", expand);
      faqItems.forEach(function (item) { item.open = expand; });
      toggleAll.textContent = expand ? "Collapse all" : "Expand all";
    });
  }
})();
