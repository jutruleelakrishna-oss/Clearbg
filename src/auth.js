import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


const SUPABASE_URL =
  "https://kqhhjwmifqrkxhygjhap.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_BXXJIGsGG_6uIeyfGXPSKQ_uwjXdRa1";

const ADMIN_EMAIL =
  "jutruleelakrishna@gmail.com";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================
   ELEMENTS
========================================= */

const menuButton =
  document.getElementById("menuButton");

const menuOverlay =
  document.getElementById("menuOverlay");

const profileMenuButton =
  document.getElementById("profileMenuButton");

const settingsMenuButton =
  document.getElementById("settingsMenuButton");

const websiteSettingsMenuButton =
  document.getElementById(
    "websiteSettingsMenuButton"
  );

const settingsOverlay =
  document.getElementById(
    "settingsOverlay"
  );

const profileSection =
  document.getElementById(
    "profileSection"
  );

const securitySection =
  document.getElementById(
    "securitySection"
  );

const websiteSettingsSection =
  document.getElementById(
    "websiteSettingsSection"
  );

const closeMenu =
  document.getElementById("closeMenu");

const closeSettings =
  document.getElementById(
    "closeSettings"
  );


/* =========================================
   ADMIN CHECK
========================================= */

function isAdmin(user) {

  return (
    user?.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );

}


/* =========================================
   SHOW WEBSITE
========================================= */

function showWebsite() {

  document.body.classList.remove(
    "auth-checking"
  );

}


/* =========================================
   ADMIN MENU
========================================= */

function hideAdminMenu() {

  if (menuButton) {

    menuButton.style.display =
      "none";

  }

  if (websiteSettingsMenuButton) {

    websiteSettingsMenuButton.style.display =
      "none";

  }

}


function showAdminMenu() {

  if (menuButton) {

    menuButton.style.display =
      "flex";

  }

  if (websiteSettingsMenuButton) {

    websiteSettingsMenuButton.style.display =
      "flex";

  }

}


/* =========================================
   MENU OPEN/CLOSE
========================================= */

menuButton?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.add(
      "open"
    );

  }
);


closeMenu?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.remove(
      "open"
    );

  }
);


menuOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      menuOverlay
    ) {

      menuOverlay.classList.remove(
        "open"
      );

    }

  }
);


/* =========================================
   SETTINGS OPEN/CLOSE
========================================= */

function openSettings() {

  settingsOverlay?.classList.add(
    "open"
  );

}


function closeSettingsModal() {

  settingsOverlay?.classList.remove(
    "open"
  );

}


closeSettings?.addEventListener(
  "click",
  closeSettingsModal
);


settingsOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      settingsOverlay
    ) {

      closeSettingsModal();

    }

  }
);


/* =========================================
   SECTIONS
========================================= */

function hideSections() {

  if (profileSection) {

    profileSection.style.display =
      "none";

  }

  if (securitySection) {

    securitySection.style.display =
      "none";

  }

  if (websiteSettingsSection) {

    websiteSettingsSection.style.display =
      "none";

  }

}


profileMenuButton?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.remove(
      "open"
    );

    openSettings();

    hideSections();

    if (profileSection) {

      profileSection.style.display =
        "block";

    }

  }
);


settingsMenuButton?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.remove(
      "open"
    );

    openSettings();

    hideSections();

    if (securitySection) {

      securitySection.style.display =
        "block";

    }

  }
);


websiteSettingsMenuButton?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.remove(
      "open"
    );

    openSettings();

    hideSections();

    if (websiteSettingsSection) {

      websiteSettingsSection.style.display =
        "block";

    }

  }
);


/* =========================================
   LOAD AUTH
========================================= */

async function checkLogin() {

  try {

    const result =
      await supabase.auth.getSession();

    const session =
      result?.data?.session;


    if (session) {

      if (
        isAdmin(session.user)
      ) {

        showAdminMenu();

      } else {

        hideAdminMenu();

      }

    } else {

      /*
       * No login:
       * website still opens.
       */

      hideAdminMenu();

    }


  } catch (error) {

    console.error(
      "Supabase authentication error:",
      error
    );

    /*
     * Even if Supabase has
     * an error, don't leave
     * the website stuck.
     */

    hideAdminMenu();

  }


  /*
   * MOST IMPORTANT LINE
   */

  showWebsite();

}


/* =========================================
   AUTH STATE
========================================= */

supabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    if (
      session &&
      isAdmin(session.user)
    ) {

      showAdminMenu();

    } else {

      hideAdminMenu();

    }

  }
);


/* =========================================
   START
========================================= */

checkLogin();
