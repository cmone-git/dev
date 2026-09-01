// ============================================================
// BIZODIT
// navigation.js
//
// Sidebar behavior:
// • Desktop: sidebar remains visible
// • Mobile/tablet: sidebar is hidden by default
// • Swipe from LEFT EDGE → RIGHT = open
// • Swipe sidebar LEFT = close
// • Tap outside sidebar = close
// • Menu button = toggle
// • ESC = close
// • Page never moves horizontally
// ============================================================

export function initNavigation() {

  const body = document.body;
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.getElementById("menuToggle");

  if (!sidebar) return;


  // ==========================================================
  // CREATE OVERLAY
  // ==========================================================

  let overlay = document.getElementById("sidebarOverlay");

  if (!overlay) {

    overlay = document.createElement("div");

    overlay.id = "sidebarOverlay";
    overlay.className = "sidebar-overlay";

    document.body.appendChild(overlay);

  }


  // ==========================================================
  // STATE
  // ==========================================================

  let sidebarOpen = false;

  let edgeTouchStartX = 0;
  let edgeTouchStartY = 0;
  let edgeTracking = false;

  let sidebarTouchStartX = 0;
  let sidebarTouchStartY = 0;
  let sidebarTracking = false;


  // ==========================================================
  // OPEN
  // ==========================================================

  function openSidebar() {

    if (window.innerWidth > 900) return;

    sidebarOpen = true;

    body.classList.add("sidebar-open");

  }


  // ==========================================================
  // CLOSE
  // ==========================================================

  function closeSidebar() {

    sidebarOpen = false;

    body.classList.remove("sidebar-open");

  }


  // ==========================================================
  // TOGGLE
  // ==========================================================

  function toggleSidebar() {

    if (sidebarOpen) {

      closeSidebar();

    } else {

      openSidebar();

    }

  }


  // ==========================================================
  // MENU BUTTON
  // ==========================================================

  if (menuToggle) {

    menuToggle.addEventListener("click", function (event) {

      event.preventDefault();
      event.stopPropagation();

      toggleSidebar();

    });

  }


  // ==========================================================
  // OVERLAY CLICK
  // ==========================================================

  overlay.addEventListener("click", function () {

    closeSidebar();

  });


  // ==========================================================
  // NAVIGATION ITEM CLICK
  // ==========================================================

  sidebar.querySelectorAll(".nav-item").forEach(function (item) {

    item.addEventListener("click", function () {

      if (window.innerWidth <= 900) {

        closeSidebar();

      }

    });

  });


  // ==========================================================
  // LEFT EDGE SWIPE → OPEN
  //
  // User must start within first 25px of screen.
  // ==========================================================

  document.addEventListener(
    "touchstart",
    function (event) {

      if (window.innerWidth > 900) return;

      if (sidebarOpen) return;

      if (!event.touches || !event.touches.length) return;

      const touch = event.touches[0];

      edgeTouchStartX = touch.clientX;
      edgeTouchStartY = touch.clientY;

      // Only track gestures starting at left edge
      edgeTracking = edgeTouchStartX <= 25;

    },
    {
      passive: true
    }
  );


  // ==========================================================
  // EDGE SWIPE MOVE
  //
  // Prevent horizontal page movement while performing
  // a valid edge swipe.
  // ==========================================================

  document.addEventListener(
    "touchmove",
    function (event) {

      if (!edgeTracking) return;

      if (window.innerWidth > 900) {

        edgeTracking = false;
        return;

      }

      const touch = event.touches[0];

      if (!touch) return;

      const deltaX =
        touch.clientX - edgeTouchStartX;

      const deltaY =
        touch.clientY - edgeTouchStartY;


      // Only interfere with clearly horizontal gestures
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        deltaX > 10
      ) {

        event.preventDefault();

      }

    },
    {
      passive: false
    }
  );


  // ==========================================================
  // EDGE SWIPE END
  // ==========================================================

  document.addEventListener(
    "touchend",
    function (event) {

      if (!edgeTracking) return;

      edgeTracking = false;

      if (window.innerWidth > 900) return;

      if (!event.changedTouches || !event.changedTouches.length) {
        return;
      }

      const touch = event.changedTouches[0];

      const deltaX =
        touch.clientX - edgeTouchStartX;

      const deltaY =
        touch.clientY - edgeTouchStartY;


      // Horizontal gesture only
      if (
        Math.abs(deltaX) <= Math.abs(deltaY)
      ) {

        return;

      }


      // Swipe RIGHT
      if (deltaX >= 60) {

        openSidebar();

      }

    },
    {
      passive: true
    }
  );


  // ==========================================================
  // SIDEBAR SWIPE → CLOSE
  // ==========================================================

  sidebar.addEventListener(
    "touchstart",
    function (event) {

      if (!sidebarOpen) return;

      if (!event.touches || !event.touches.length) return;

      const touch = event.touches[0];

      sidebarTouchStartX = touch.clientX;
      sidebarTouchStartY = touch.clientY;

      sidebarTracking = true;

    },
    {
      passive: true
    }
  );


  // ==========================================================
  // SIDEBAR SWIPE MOVE
  // ==========================================================

  sidebar.addEventListener(
    "touchmove",
    function (event) {

      if (!sidebarTracking) return;

      if (!sidebarOpen) {

        sidebarTracking = false;
        return;

      }

      const touch = event.touches[0];

      if (!touch) return;

      const deltaX =
        touch.clientX - sidebarTouchStartX;

      const deltaY =
        touch.clientY - sidebarTouchStartY;


      // Only prevent horizontal gesture
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        deltaX < -10
      ) {

        event.preventDefault();

      }

    },
    {
      passive: false
    }
  );


  // ==========================================================
  // SIDEBAR SWIPE END
  // ==========================================================

  sidebar.addEventListener(
    "touchend",
    function (event) {

      if (!sidebarTracking) return;

      sidebarTracking = false;

      if (!sidebarOpen) return;

      if (
        !event.changedTouches ||
        !event.changedTouches.length
      ) {

        return;

      }

      const touch = event.changedTouches[0];

      const deltaX =
        touch.clientX - sidebarTouchStartX;

      const deltaY =
        touch.clientY - sidebarTouchStartY;


      // Horizontal only
      if (
        Math.abs(deltaX) <= Math.abs(deltaY)
      ) {

        return;

      }


      // Swipe LEFT
      if (deltaX <= -60) {

        closeSidebar();

      }

    },
    {
      passive: true
    }
  );


  // ==========================================================
  // ESCAPE KEY
  // ==========================================================

  document.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Escape") {

        closeSidebar();

      }

    }
  );


  // ==========================================================
  // RESIZE
  //
  // If user rotates phone / switches to desktop,
  // remove mobile-open state.
  // ==========================================================

  window.addEventListener(
    "resize",
    function () {

      if (window.innerWidth > 900) {

        closeSidebar();

      }

    }
  );


  // ==========================================================
  // INITIAL STATE
  // ==========================================================

  if (window.innerWidth <= 900) {

    closeSidebar();

  }


  // ==========================================================
  // EXPOSE OPTIONAL CONTROLS
  //
  // Useful if another page needs to manually open/close menu.
  // ==========================================================

  window.cmNavigation = {

    open: openSidebar,

    close: closeSidebar,

    toggle: toggleSidebar,

    isOpen: function () {

      return sidebarOpen;

    }

  };

}