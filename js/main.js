/* =====================================================================
   M&A VALUATION LAB — SHARED JAVASCRIPT
   ---------------------------------------------------------------------
   Every page loads this file. It holds small features used site-wide:
     1. The mobile hamburger menu
     2. The glossary search box (only does something on glossary.html)
     3. The current year in the footer
   ===================================================================== */


/* ---------------------------------------------------------------------
   setupMobileMenu
   WHAT: Opens and closes the navigation links when the hamburger
         button (☰) is clicked on small screens.
   WHY:  On phones there is no room for all links in one row, so CSS
         hides them. Adding the "open" class shows them again.
   --------------------------------------------------------------------- */
function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  // If this page has no menu, there is nothing to do.
  if (!menuButton || !navLinks) {
    return;
  }

  // Toggle the menu every time the button is clicked.
  menuButton.addEventListener("click", function () {
    const isOpen = navLinks.classList.toggle("open");

    // aria-expanded tells screen readers whether the menu is open.
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.textContent = isOpen ? "✕" : "☰";
  });

  // Close the menu if the visitor presses the Escape key.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "☰";
      menuButton.focus();
    }
  });
}


/* ---------------------------------------------------------------------
   setupGlossarySearch
   WHAT: Hides glossary terms that don't contain the text typed in the
         search box, as the visitor types.
   WHY:  With 30+ terms, searching is quicker than scrolling.
   --------------------------------------------------------------------- */
function setupGlossarySearch() {
  const searchBox = document.getElementById("glossary-search");

  // Only the glossary page has a search box; other pages skip this.
  if (!searchBox) {
    return;
  }

  const glossaryItems = document.querySelectorAll(".glossary-item");
  const resultCount = document.getElementById("glossary-count");
  const noResultsMessage = document.getElementById("glossary-no-results");

  // Show the total number of terms when the page first loads.
  // (Counting them here means you never have to update the number by hand.)
  resultCount.textContent = "Showing all " + glossaryItems.length + " terms";

  // The "input" event fires on every keystroke (and on paste).
  searchBox.addEventListener("input", function () {
    const searchText = searchBox.value.trim().toLowerCase();
    let visibleCount = 0;

    // Check each term: show it if its text contains the search text.
    glossaryItems.forEach(function (item) {
      const itemText = item.textContent.toLowerCase();
      const matches = itemText.includes(searchText);

      item.classList.toggle("hidden", !matches);
      if (matches) {
        visibleCount = visibleCount + 1;
      }
    });

    // Update the "Showing X of Y terms" line and the "no results" note.
    resultCount.textContent =
      "Showing " + visibleCount + " of " + glossaryItems.length + " terms";
    noResultsMessage.classList.toggle("hidden", visibleCount > 0);
  });
}


/* ---------------------------------------------------------------------
   showCurrentYear
   WHAT: Writes the current year into the footer (e.g. "© 2026").
   WHY:  So you never have to update the year by hand.
   --------------------------------------------------------------------- */
function showCurrentYear() {
  const yearSpan = document.getElementById("current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}


/* ---------------------------------------------------------------------
   START-UP
   WHAT: Runs the functions above once the page has finished loading.
   WHY:  JavaScript can only find HTML elements after they exist.
         The <script> tags use "defer", which already waits for the
         HTML, so we can simply call the functions here.
   --------------------------------------------------------------------- */
setupMobileMenu();
setupGlossarySearch();
showCurrentYear();
