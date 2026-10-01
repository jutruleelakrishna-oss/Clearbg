import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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

window.krishnaSupabase = supabase;


/* ELEMENTS */

const settingsButton =
  document.getElementById("settingsButton");

const settingsOverlay =
  document.getElementById("settingsOverlay");

const closeSettings =
  document.getElementById("closeSettings");

const brandName =
  document.getElementById("brandName");

const websiteName =
  document.getElementById("websiteName");

const saveWebsiteName =
  document.getElementById("saveWebsiteName");

const websiteMessage =
  document.getElementById("websiteMessage");

const displayName =
  document.getElementById("displayName");

const profileEmail =
  document.getElementById("profileEmail");

const saveProfile =
  document.getElementById("saveProfile");

const profileMessage =
  document.getElementById("profileMessage");

const newPassword =
  document.getElementById("newPassword");

const changePassword =
  document.getElementById("changePassword");

const passwordMessage =
  document.getElementById("passwordMessage");

const adminLogout =
  document.getElementById("adminLogout");


/*
 * IMPORTANT:
 * Settings is hidden immediately.
 * It will ONLY become visible after
 * Supabase confirms the admin email.
 */

if (settingsButton) {
  settingsButton.style.display = "none";
}


/* SETTINGS OPEN */

function openSettings() {
  if (!settingsButton) return;

  settingsOverlay.classList.add("open");

  settingsOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}


/* SETTINGS CLOSE */

function closeSettingsModal() {
  if (!settingsOverlay) return;

  settingsOverlay.classList.remove("open");

  settingsOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


if (settingsButton) {
  settingsButton.addEventListener(
    "click",
    openSettings
  );
}


if (closeSettings) {
  closeSettings.addEventListener(
    "click",
    closeSettingsModal
  );
}


if (settingsOverlay) {
  settingsOverlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target === settingsOverlay
      ) {
        closeSettingsModal();
      }

    }
  );
}


/* AUTHENTICATION */

async function checkAuthentication() {

  /*
   * Always hide Settings first.
   * This prevents normal users from
   * seeing it while authentication loads.
   */

  if (settingsButton) {
    settingsButton.style.display = "none";
  }


  const {
    data: { session },
    error
  } = await supabase.auth.getSession();


  if (error) {

    console.error(
      "Authentication error:",
      error
    );

    window.location.replace(
      "/admin.html"
    );

    return;
  }


  /*
   * No logged-in user
   */

  if (!session) {

    window.location.replace(
      "/admin.html"
    );

    return;
  }


  const user =
    session.user;


  /*
   * Profile email
   */

  if (profileEmail) {

    profileEmail.value =
      user.email || "";

  }


  /*
   * Display name
   */

  if (displayName) {

    displayName.value =
      user.user_metadata?.display_name || "";

  }


  /*
   * Website name
   */

  const savedWebsiteName =
    user.user_metadata?.website_name;


  if (savedWebsiteName) {

    if (brandName) {

      brandName.textContent =
        savedWebsiteName;

    }


    if (websiteName) {

      websiteName.value =
        savedWebsiteName;

    }


    document.title =
      savedWebsiteName;

  }


  /*
   * ADMIN CHECK
   *
   * Settings is shown ONLY when
   * the logged-in email exactly matches
   * the admin email.
   */

  const loggedInEmail =
    (user.email || "")
      .trim()
      .toLowerCase();


  const adminEmail =
    ADMIN_EMAIL
      .trim()
      .toLowerCase();


  const isAdmin =
    loggedInEmail === adminEmail;


  if (
    settingsButton
  ) {

    if (isAdmin) {

      settingsButton.style.display =
        "block";

    } else {

      settingsButton.style.display =
        "none";

    }

  }


  /*
   * Authentication completed
   */

  document.body.classList.remove(
    "auth-checking"
  );
}


/* WEBSITE NAME */

if (saveWebsiteName) {

  saveWebsiteName.addEventListener(
    "click",
    async () => {

      const name =
        websiteName.value.trim();


      if (!name) {

        websiteMessage.textContent =
          "Please enter a website name.";

        return;
      }


      saveWebsiteName.disabled =
        true;

      websiteMessage.textContent =
        "Saving...";


      const {
        error
      } =
        await supabase.auth.updateUser({

          data: {
            website_name: name
          }

        });


      saveWebsiteName.disabled =
        false;


      if (error) {

        websiteMessage.textContent =
          error.message;

        return;
      }


      if (brandName) {

        brandName.textContent =
          name;

      }


      document.title =
        name;


      websiteMessage.textContent =
        "Website name saved.";
    }
  );

}


/* PROFILE */

if (saveProfile) {

  saveProfile.addEventListener(
    "click",
    async () => {

      const name =
        displayName.value.trim();


      saveProfile.disabled =
        true;

      profileMessage.textContent =
        "Saving...";


      const {
        error
      } =
        await supabase.auth.updateUser({

          data: {
            display_name: name
          }

        });


      saveProfile.disabled =
        false;


      if (error) {

        profileMessage.textContent =
          error.message;

        return;
      }


      profileMessage.textContent =
        "Profile saved.";
    }
  );

}


/* CHANGE PASSWORD */

if (changePassword) {

  changePassword.addEventListener(
    "click",
    async () => {

      const password =
        newPassword.value;


      if (password.length < 6) {

        passwordMessage.textContent =
          "Password must contain at least 6 characters.";

        return;
      }


      changePassword.disabled =
        true;

      passwordMessage.textContent =
        "Updating password...";


      const {
        error
      } =
        await supabase.auth.updateUser({

          password: password

        });


      changePassword.disabled =
        false;


      if (error) {

        passwordMessage.textContent =
          error.message;

        return;
      }


      newPassword.value =
        "";

      passwordMessage.textContent =
        "Password changed successfully.";
    }
  );

}


/* ADMIN LOGOUT */

if (adminLogout) {

  adminLogout.addEventListener(
    "click",
    async () => {

      adminLogout.disabled =
        true;


      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {

        adminLogout.disabled =
          false;

        passwordMessage.textContent =
          error.message;

        return;
      }


      window.location.replace(
        "/admin.html"
      );
    }
  );

}


/*
 * START AUTHENTICATION
 */

checkAuthentication();


/*
 * AUTH STATE CHANGES
 */

supabase.auth.onAuthStateChange(
  (event, session) => {

    /*
     * If user logs out,
     * hide Settings immediately.
     */

    if (!session) {

      if (settingsButton) {

        settingsButton.style.display =
          "none";

      }


      window.location.replace(
        "/admin.html"
      );

      return;
    }


    /*
     * For every new session,
     * hide Settings first.
     * checkAuthentication() will
     * show it only for the admin.
     */

    if (settingsButton) {

      settingsButton.style.display =
        "none";

    }


    checkAuthentication();

  }
);
