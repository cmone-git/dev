export function initNavigation() {

  const body = document.body;
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) return;

  // Prevent duplicate initialization
  if (sidebar.dataset.navigationInitialized === "true") return;
  sidebar.dataset.navigationInitialized = "true";

  // --------------------------------------------------
  // OVERLAY
  // --------------------------------------------------

  let overlay = document.getElementById("sidebarOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  // --------------------------------------------------
  // OPEN / CLOSE
  // --------------------------------------------------

  function openSidebar() {
    body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    body.classList.remove("sidebar-open");
  }

  function toggleSidebar() {
    body.classList.toggle("sidebar-open");
  }

  // --------------------------------------------------
  // MENU BUTTON
  // --------------------------------------------------

  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // --------------------------------------------------
  // CLICK OUTSIDE SIDEBAR
  // --------------------------------------------------

  overlay.addEventListener("click", function () {
    closeSidebar();
  });

  // --------------------------------------------------
  // NAVIGATION LINKS
  // --------------------------------------------------

  sidebar.querySelectorAll(".nav-item").forEach(function (item) {

    item.addEventListener("click", function () {

      if (window.innerWidth <= 900) {
        closeSidebar();
      }

    });

  });

  // --------------------------------------------------
  // SWIPE: LEFT EDGE → RIGHT
  // OPEN SIDEBAR
  // --------------------------------------------------

  let startX = 0;
  let startY = 0;
  let tracking = false;

  document.addEventListener(
    "touchstart",
    function (e) {

      if (window.innerWidth > 900) return;

      const touch = e.touches[0];

      startX = touch.clientX;
      startY = touch.clientY;

      /*
       * Only start opening gesture from
       * the extreme left edge.
       */
      tracking =
        startX <= 30 &&
        !body.classList.contains("sidebar-open");

    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    function (e) {

      if (!tracking) return;

      const touch = e.changedTouches[0];

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      /*
       * Require a clear horizontal swipe.
       */
      if (
        deltaX >= 60 &&
        deltaX > deltaY * 1.2
      ) {
        openSidebar();
      }

      tracking = false;

    },
    { passive: true }
  );

  // --------------------------------------------------
  // SWIPE: SIDEBAR → LEFT
  // CLOSE SIDEBAR
  // --------------------------------------------------

  sidebar.addEventListener(
    "touchstart",
    function (e) {

      if (window.innerWidth > 900) return;
      if (!body.classList.contains("sidebar-open")) return;

      const touch = e.touches[0];

      startX = touch.clientX;
      startY = touch.clientY;

      tracking = true;

    },
    { passive: true }
  );

  sidebar.addEventListener(
    "touchend",
    function (e) {

      if (!tracking) return;

      const touch = e.changedTouches[0];

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      /*
       * Swipe left to close.
       */
      if (
        deltaX <= -60 &&
        Math.abs(deltaX) > deltaY * 1.2
      ) {
        closeSidebar();
      }

      tracking = false;

    },
    { passive: true }
  );

  // --------------------------------------------------
  // ESCAPE KEY
  // --------------------------------------------------

  document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {
      closeSidebar();
    }

  });

  // --------------------------------------------------
  // DESKTOP RESIZE
  // --------------------------------------------------

  window.addEventListener("resize", function () {

    /*
     * On desktop the sidebar is permanently visible,
     * so remove mobile overlay state.
     */
    if (window.innerWidth > 900) {
      closeSidebar();
    }

  });

}