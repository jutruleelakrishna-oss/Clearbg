import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://kqhhjwmifqrkxhygjhap.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_BXXJIGsGG_6uIeyfGXPSKQ_uwjXdRa1";

const ADMIN_EMAIL =
  "jutruleelakrishna@gmail.com";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ==========================================
   ELEMENTS
========================================== */

const loginScreen =
  document.getElementById("loginScreen");

const app =
  document.getElementById("app");

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const menuButton =
  document.getElementById("menuButton");

const menuOverlay =
  document.getElementById("menuOverlay");

const closeMenu =
  document.getElementById("closeMenu");

const profileMenuButton =
  document.getElementById("profileMenuButton");

const settingsMenuButton =
  document.getElementById("settingsMenuButton");

const websiteSettingsMenuButton =
  document.getElementById(
    "websiteSettingsMenuButton"
  );

const logoutMenuButton =
  document.getElementById(
    "logoutMenuButton"
  );

const settingsOverlay =
  document.getElementById(
    "settingsOverlay"
  );

const closeSettings =
  document.getElementById(
    "closeSettings"
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

const settingsEmail =
  document.getElementById(
    "settingsEmail"
  );

const profileEmail =
  document.getElementById(
    "profileEmail"
  );

const accountCreated =
  document.getElementById(
    "accountCreated"
  );

const newPassword =
  document.getElementById(
    "newPassword"
  );

const changePassword =
  document.getElementById(
    "changePassword"
  );

const adminLogout =
  document.getElementById(
    "adminLogout"
  );

const settingMessage =
  document.getElementById(
    "settingMessage"
  );


/* ==========================================
   HELPERS
========================================== */

function isAdmin(user) {
  if (!user?.email) {
    return false;
  }

  return (
    user.email.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );
}


function showMessage(
  message,
  error = false
) {
  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.style.color =
    error
      ? "#ff6b6b"
      : "#8df0b5";
}


function showSettingMessage(
  message,
  error = false
) {
  if (!settingMessage) {
    return;
  }

  settingMessage.textContent =
    message;

  settingMessage.style.color =
    error
      ? "#ff6b6b"
      : "#8df0b5";
}


function showApp() {
  if (loginScreen) {
    loginScreen.style.display =
      "none";
  }

  if (app) {
    app.classList.remove(
      "app-hidden"
    );

    app.style.display =
      "block";
  }
}


function showLogin() {
  if (app) {
    app.classList.add(
      "app-hidden"
    );

    app.style.display =
      "none";
  }

  if (loginScreen) {
    loginScreen.style.display =
      "flex";
  }
}


function showAdminMenu() {
  if (menuButton) {
    menuButton.style.display =
      "flex";
  }
}


function hideAdminMenu() {
  if (menuButton) {
    menuButton.style.display =
      "none";
  }

  if (menuOverlay) {
    menuOverlay.classList.remove(
      "open"
    );
  }
}


function hideSettingsSections() {
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


function openSettings() {
  if (settingsOverlay) {
    settingsOverlay.classList.add(
      "open"
    );
  }
}


function closeSettingsModal() {
  if (settingsOverlay) {
    settingsOverlay.classList.remove(
      "open"
    );
  }
}


/* ==========================================
   LOGIN
========================================== */

loginForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      loginEmail?.value.trim();

    const password =
      loginPassword?.value;

    if (!email || !password) {
      showMessage(
        "Please enter your email and password.",
        true
      );
      return;
    }

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent =
        "Signing in...";
    }

    showMessage("");

    try {

      console.log(
        "Krishna AI Studio login:",
        email
      );

      console.log(
        "Supabase URL:",
        SUPABASE_URL
      );

      const {
        data,
        error
      } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      console.log(
        "Supabase login response:",
        data
      );

      console.log(
        "Supabase login error:",
        error
      );

      if (error) {

        console.error(
          "FULL SUPABASE ERROR:",
          error
        );

        /*
          SHOW THE REAL ERROR
        */

        const realError =
          error.message ||
          error.error_description ||
          error.code ||
          "Unknown Supabase authentication error.";

        showMessage(
          `Supabase: ${realError}`,
          true
        );

        return;
      }

      if (!data?.session) {

        showMessage(
          "Supabase login succeeded, but no session was created.",
          true
        );

        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        data.session.user
      );

      showApp();

      if (
        isAdmin(
          data.session.user
        )
      ) {
        showAdminMenu();
      } else {
        hideAdminMenu();
      }

      if (loginPassword) {
        loginPassword.value = "";
      }

    } catch (error) {

      console.error(
        "Unexpected login error:",
        error
      );

      showMessage(
        `Login error: ${
          error?.message ||
          "Unknown error"
        }`,
        true
      );

    } finally {

      if (loginButton) {
        loginButton.disabled =
          false;

        loginButton.textContent =
          "Login";
      }
    }
  }
);


/* ==========================================
   ADMIN MENU
========================================== */

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


/* ==========================================
   PROFILE
========================================== */

profileMenuButton?.addEventListener(
  "click",
  async () => {

    menuOverlay?.classList.remove(
      "open"
    );

    hideSettingsSections();

    if (profileSection) {
      profileSection.style.display =
        "block";
    }

    openSettings();

    await loadUserProfile();

  }
);


/* ==========================================
   SECURITY
========================================== */

settingsMenuButton?.addEventListener(
  "click",
  async () => {

    menuOverlay?.classList.remove(
      "open"
    );

    hideSettingsSections();

    if (securitySection) {
      securitySection.style.display =
        "block";
    }

    openSettings();

    await loadSecurityInfo();

  }
);


/* ==========================================
   WEBSITE SETTINGS
========================================== */

websiteSettingsMenuButton?.addEventListener(
  "click",
  () => {

    menuOverlay?.classList.remove(
      "open"
    );

    hideSettingsSections();

    if (websiteSettingsSection) {
      websiteSettingsSection.style.display =
        "block";
    }

    openSettings();

  }
);


/* ==========================================
   CLOSE SETTINGS
========================================== */

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


/* ==========================================
   LOAD PROFILE
========================================== */

async function loadUserProfile() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    const user =
      data?.user;

    if (!user) {
      return;
    }

    if (profileEmail) {
      profileEmail.value =
        user.email || "";
    }

    if (settingsEmail) {
      settingsEmail.value =
        user.email || "";
    }

    if (accountCreated) {
      accountCreated.value =
        user.created_at
          ? new Date(
              user.created_at
            ).toLocaleString()
          : "";
    }

    const metadata =
      user.user_metadata || {};

    const displayName =
      document.getElementById(
        "displayName"
      );

    const phone =
      document.getElementById(
        "profilePhone"
      );

    const location =
      document.getElementById(
        "profileLocation"
      );

    const about =
      document.getElementById(
        "profileAbout"
      );

    if (displayName) {
      displayName.value =
        metadata.display_name ||
        metadata.full_name ||
        "";
    }

    if (phone) {
      phone.value =
        metadata.phone ||
        "";
    }

    if (location) {
      location.value =
        metadata.location ||
        "";
    }

    if (about) {
      about.value =
        metadata.about ||
        "";
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

  }
}


/* ==========================================
   SECURITY INFO
========================================== */

async function loadSecurityInfo() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    const user =
      data?.user;

    if (!user) {
      return;
    }

    if (settingsEmail) {
      settingsEmail.value =
        user.email || "";
    }

  } catch (error) {

    console.error(
      "Security loading error:",
      error
    );

  }
}


/* ==========================================
   CHANGE PASSWORD
========================================== */

changePassword?.addEventListener(
  "click",
  async () => {

    const password =
      newPassword?.value.trim();

    if (!password) {
      showSettingMessage(
        "Enter a new password.",
        true
      );
      return;
    }

    if (password.length < 6) {
      showSettingMessage(
        "Password must be at least 6 characters.",
        true
      );
      return;
    }

    changePassword.disabled =
      true;

    changePassword.textContent =
      "Updating...";

    try {

      const {
        error
      } =
        await supabase.auth.updateUser({
          password
        });

      if (error) {
        throw error;
      }

      if (newPassword) {
        newPassword.value = "";
      }

      showSettingMessage(
        "Password changed successfully."
      );

    } catch (error) {

      console.error(
        "Password change error:",
        error
      );

      showSettingMessage(
        error?.message ||
        "Could not change password.",
        true
      );

    } finally {

      changePassword.disabled =
        false;

      changePassword.textContent =
        "Change Password";
    }
  }
);


/* ==========================================
   LOGOUT
========================================== */

async function logout() {

  try {

    await supabase.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

  closeSettingsModal();

  hideAdminMenu();

  showLogin();
}


logoutMenuButton?.addEventListener(
  "click",
  logout
);


adminLogout?.addEventListener(
  "click",
  logout
);


/* ==========================================
   AUTH STATE
========================================== */

supabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    console.log(
      "Auth state:",
      event,
      session
    );

    if (session?.user) {

      showApp();

      if (
        isAdmin(
          session.user
        )
      ) {
        showAdminMenu();
      } else {
        hideAdminMenu();
      }

    } else {

      hideAdminMenu();

      showLogin();

    }

  }
);


/* ==========================================
   INITIAL SESSION
========================================== */

async function initializeAuth() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    const session =
      data?.session;

    if (session?.user) {

      showApp();

      if (
        isAdmin(
          session.user
        )
      ) {
        showAdminMenu();
      } else {
        hideAdminMenu();
      }

    } else {

      hideAdminMenu();

      showLogin();

    }

  } catch (error) {

    console.error(
      "Authentication initialization error:",
      error
    );

    hideAdminMenu();

    showLogin();

  }
}


/* ==========================================
   START
========================================== */

showLogin();

hideAdminMenu();

initializeAuth();
