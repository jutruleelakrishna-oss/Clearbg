import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =====================================
   SUPABASE
===================================== */

const SUPABASE_URL =
  "https://kqhhjwmifqrkxhygjhap.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_BXXJIGsGG_6uIeyfGXPSkQ_uwjXdRa1";

const ADMIN_EMAIL =
  "jutruleelakrishna@gmail.com";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================
   ELEMENTS
===================================== */

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const app =
  document.getElementById(
    "app"
  );

const loginForm =
  document.getElementById(
    "loginForm"
  );

const loginEmail =
  document.getElementById(
    "loginEmail"
  );

const loginPassword =
  document.getElementById(
    "loginPassword"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );

const menuButton =
  document.getElementById(
    "menuButton"
  );

const menuOverlay =
  document.getElementById(
    "menuOverlay"
  );

const closeMenu =
  document.getElementById(
    "closeMenu"
  );

const profileMenuButton =
  document.getElementById(
    "profileMenuButton"
  );

const settingsMenuButton =
  document.getElementById(
    "settingsMenuButton"
  );

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

const settingMessage =
  document.getElementById(
    "settingMessage"
  );


/* =====================================
   HELPERS
===================================== */

function isAdmin(user) {

  return (
    user?.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );

}


function loginStatus(
  message,
  error = false
) {

  if (!loginMessage) return;

  loginMessage.textContent =
    message;

  loginMessage.style.color =
    error
      ? "#ff6b6b"
      : "#8df0b5";

}


function settingStatus(
  message,
  error = false
) {

  if (!settingMessage) return;

  settingMessage.textContent =
    message;

  settingMessage.style.color =
    error
      ? "#ff6b6b"
      : "#8df0b5";

}


/* =====================================
   SHOW / HIDE APP
===================================== */

function showApp() {

  loginScreen.style.display =
    "none";

  app.classList.remove(
    "app-hidden"
  );

  app.style.display =
    "block";

}


function showLogin() {

  app.classList.add(
    "app-hidden"
  );

  app.style.display =
    "none";

  loginScreen.style.display =
    "flex";

}


function showAdminMenu() {

  menuButton.style.display =
    "flex";

}


function hideAdminMenu() {

  menuButton.style.display =
    "none";

  menuOverlay.classList.remove(
    "open"
  );

}


/* =====================================
   LOGIN
===================================== */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const email =
      loginEmail.value.trim();

    const password =
      loginPassword.value;


    if (!email || !password) {

      loginStatus(
        "Enter your email and password.",
        true
      );

      return;

    }


    loginButton.disabled =
      true;

    loginButton.textContent =
      "Signing in...";


    loginStatus("");


    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password
          });


      if (error) {

        throw error;

      }


      if (!data?.session) {

        throw new Error(
          "Login succeeded but no session was created."
        );

      }


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


      loginPassword.value =
        "";


    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      loginStatus(
        error?.message ||
        "Login failed.",
        true
      );


    } finally {

      loginButton.disabled =
        false;

      loginButton.textContent =
        "Login";

    }

  }
);


/* =====================================
   ADMIN MENU
===================================== */

menuButton.addEventListener(
  "click",
  () => {

    menuOverlay.classList.add(
      "open"
    );

  }
);


closeMenu.addEventListener(
  "click",
  () => {

    menuOverlay.classList.remove(
      "open"
    );

  }
);


menuOverlay.addEventListener(
  "click",
  event => {

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


/* =====================================
   SETTINGS
===================================== */

function openSettings(
  section
) {

  profileSection.style.display =
    "none";

  securitySection.style.display =
    "none";

  websiteSettingsSection.style.display =
    "none";


  section.style.display =
    "block";


  settingsOverlay.classList.add(
    "open"
  );

}


profileMenuButton.addEventListener(
  "click",
  async () => {

    menuOverlay.classList.remove(
      "open"
    );

    openSettings(
      profileSection
    );

    await loadProfile();

  }
);


settingsMenuButton.addEventListener(
  "click",
  async () => {

    menuOverlay.classList.remove(
      "open"
    );

    openSettings(
      securitySection
    );

    await loadSecurity();

  }
);


websiteSettingsMenuButton.addEventListener(
  "click",
  () => {

    menuOverlay.classList.remove(
      "open"
    );

    openSettings(
      websiteSettingsSection
    );

  }
);


closeSettings.addEventListener(
  "click",
  () => {

    settingsOverlay.classList.remove(
      "open"
    );

  }
);


settingsOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      settingsOverlay
    ) {

      settingsOverlay.classList.remove(
        "open"
      );

    }

  }
);


/* =====================================
   PROFILE
===================================== */

async function loadProfile() {

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


    if (!user) return;


    const metadata =
      user.user_metadata || {};


    const displayName =
      document.getElementById(
        "displayName"
      );

    const profileEmail =
      document.getElementById(
        "profileEmail"
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

    const accountCreated =
      document.getElementById(
        "accountCreated"
      );


    profileEmail.value =
      user.email || "";


    displayName.value =
      metadata.display_name ||
      metadata.full_name ||
      "";


    phone.value =
      metadata.phone ||
      "";


    location.value =
      metadata.location ||
      "";


    about.value =
      metadata.about ||
      "";


    accountCreated.value =
      user.created_at
        ? new Date(
            user.created_at
          ).toLocaleString()
        : "";

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );

  }

}


/* =====================================
   SAVE PROFILE
===================================== */

document
  .getElementById("saveProfile")
  .addEventListener(
    "click",
    async () => {

      try {

        const {
          error
        } =
          await supabase.auth
            .updateUser({
              data: {

                display_name:
                  document.getElementById(
                    "displayName"
                  ).value.trim(),

                phone:
                  document.getElementById(
                    "profilePhone"
                  ).value.trim(),

                location:
                  document.getElementById(
                    "profileLocation"
                  ).value.trim(),

                about:
                  document.getElementById(
                    "profileAbout"
                  ).value.trim()

              }
            });


        if (error) {
          throw error;
        }


        settingStatus(
          "Profile saved successfully."
        );

      } catch (error) {

        console.error(
          error
        );

        settingStatus(
          error?.message ||
          "Could not save profile.",
          true
        );

      }

    }
  );


/* =====================================
   SECURITY
===================================== */

async function loadSecurity() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getUser();


    if (error) {
      throw error;
    }


    document.getElementById(
      "settingsEmail"
    ).value =
      data?.user?.email || "";


  } catch (error) {

    console.error(
      "Security error:",
      error
    );

  }

}


/* =====================================
   CHANGE PASSWORD
===================================== */

document
  .getElementById("changePassword")
  .addEventListener(
    "click",
    async () => {

      const input =
        document.getElementById(
          "newPassword"
        );


      const password =
        input.value.trim();


      if (password.length < 6) {

        settingStatus(
          "Password must contain at least 6 characters.",
          true
        );

        return;

      }


      try {

        const {
          error
        } =
          await supabase.auth
            .updateUser({
              password
            });


        if (error) {
          throw error;
        }


        input.value =
          "";


        settingStatus(
          "Password changed successfully."
        );


      } catch (error) {

        settingStatus(
          error?.message ||
          "Could not change password.",
          true
        );

      }

    }
  );


/* =====================================
   LOGOUT
===================================== */

async function logout() {

  try {

    await supabase.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  settingsOverlay.classList.remove(
    "open"
  );

  hideAdminMenu();

  showLogin();

}


logoutMenuButton.addEventListener(
  "click",
  logout
);


document
  .getElementById("adminLogout")
  .addEventListener(
    "click",
    logout
  );


/* =====================================
   PROFILE IMAGE
===================================== */

const profilePictureInput =
  document.getElementById(
    "profilePictureInput"
  );

const profilePicture =
  document.getElementById(
    "profilePicture"
  );

const profilePlaceholder =
  document.getElementById(
    "profileAvatarPlaceholder"
  );


document
  .getElementById(
    "changeProfilePicture"
  )
  .addEventListener(
    "click",
    () => {

      profilePictureInput.click();

    }
  );


profilePictureInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];


    if (!file) return;


    const url =
      URL.createObjectURL(file);


    profilePicture.src =
      url;

    profilePicture.style.display =
      "block";

    profilePlaceholder.style.display =
      "none";

  }
);


document
  .getElementById(
    "removeProfilePicture"
  )
  .addEventListener(
    "click",
    () => {

      profilePicture.removeAttribute(
        "src"
      );

      profilePicture.style.display =
        "none";

      profilePlaceholder.style.display =
        "flex";

      profilePictureInput.value =
        "";

    }
  );


/* =====================================
   WEBSITE SETTINGS
===================================== */

document
  .getElementById(
    "saveWebsiteName"
  )
  .addEventListener(
    "click",
    () => {

      const name =
        document.getElementById(
          "websiteName"
        ).value.trim();


      if (name) {

        document.title =
          name;


        document.querySelector(
          ".brand-text"
        ).textContent =
          name;


        settingStatus(
          "Website settings saved."
        );

      }

    }
  );


/* =====================================
   AUTH STATE
===================================== */

supabase.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Authentication:",
      event
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


/* =====================================
   INITIAL SESSION
===================================== */

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


    if (data?.session?.user) {

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

    } else {

      showLogin();

    }

  } catch (error) {

    console.error(
      "Initial auth error:",
      error
    );

    showLogin();

  }

}


showLogin();

hideAdminMenu();

initializeAuth();
