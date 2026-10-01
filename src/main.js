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


/* =====================================================
   ELEMENTS
===================================================== */

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
  document.getElementById("websiteSettingsMenuButton");

const settingsOverlay =
  document.getElementById("settingsOverlay");

const closeSettings =
  document.getElementById("closeSettings");

const profileSection =
  document.getElementById("profileSection");

const securitySection =
  document.getElementById("securitySection");

const websiteSettingsSection =
  document.getElementById("websiteSettingsSection");

const settingsModalTitle =
  document.getElementById("settingsModalTitle");

const settingsModalSubtitle =
  document.getElementById("settingsModalSubtitle");

const displayName =
  document.getElementById("displayName");

const profileEmail =
  document.getElementById("profileEmail");

const profilePhone =
  document.getElementById("profilePhone");

const profileLocation =
  document.getElementById("profileLocation");

const profileAbout =
  document.getElementById("profileAbout");

const accountCreated =
  document.getElementById("accountCreated");

const profilePicture =
  document.getElementById("profilePicture");

const profileAvatarPlaceholder =
  document.getElementById(
    "profileAvatarPlaceholder"
  );

const profilePictureInput =
  document.getElementById(
    "profilePictureInput"
  );

const changeProfilePicture =
  document.getElementById(
    "changeProfilePicture"
  );

const removeProfilePicture =
  document.getElementById(
    "removeProfilePicture"
  );

const saveProfile =
  document.getElementById("saveProfile");

const newPassword =
  document.getElementById("newPassword");

const changePassword =
  document.getElementById("changePassword");

const adminLogout =
  document.getElementById("adminLogout");

const websiteName =
  document.getElementById("websiteName");

const websiteDescription =
  document.getElementById(
    "websiteDescription"
  );

const websiteTheme =
  document.getElementById("websiteTheme");

const maxLoginCount =
  document.getElementById("maxLoginCount");

const saveWebsiteName =
  document.getElementById(
    "saveWebsiteName"
  );

const settingMessage =
  document.getElementById(
    "settingMessage"
  );

const headerWebsiteName =
  document.getElementById(
    "headerWebsiteName"
  );

const settingsEmail =
  document.getElementById(
    "settingsEmail"
  );


/* =====================================================
   ADMIN CHECK
===================================================== */

function isAdmin(user) {

  if (!user) {
    return false;
  }

  if (!user.email) {
    return false;
  }

  return (
    user.email.trim().toLowerCase() ===
    ADMIN_EMAIL.trim().toLowerCase()
  );
}


/* =====================================================
   HIDE ALL ADMIN CONTROLS
===================================================== */

function hideAdminControls() {

  if (menuButton) {
    menuButton.style.display = "none";
  }

  if (websiteSettingsMenuButton) {
    websiteSettingsMenuButton.style.display =
      "none";
  }

  if (menuOverlay) {
    menuOverlay.classList.remove("open");
  }

  if (settingsOverlay) {
    settingsOverlay.classList.remove(
      "open"
    );
  }
}


/* =====================================================
   SHOW ADMIN CONTROLS
===================================================== */

function showAdminControls() {

  if (menuButton) {
    menuButton.style.display = "flex";
  }

  if (websiteSettingsMenuButton) {
    websiteSettingsMenuButton.style.display =
      "flex";
  }
}


/* =====================================================
   MENU
===================================================== */

function openMenu() {

  if (!menuOverlay) {
    return;
  }

  menuOverlay.classList.add("open");
}


function closeMenuPanel() {

  if (!menuOverlay) {
    return;
  }

  menuOverlay.classList.remove("open");
}


menuButton?.addEventListener(
  "click",
  openMenu
);


closeMenu?.addEventListener(
  "click",
  closeMenuPanel
);


menuOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target === menuOverlay
    ) {
      closeMenuPanel();
    }

  }
);


/* =====================================================
   SETTINGS MODAL
===================================================== */

function hideAllSettingsSections() {

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


function openSettingsSection(
  section
) {

  hideAllSettingsSections();

  if (!settingsOverlay) {
    return;
  }


  settingsOverlay.classList.add(
    "open"
  );


  if (section === "profile") {

    if (profileSection) {
      profileSection.style.display =
        "block";
    }

    if (settingsModalTitle) {
      settingsModalTitle.textContent =
        "Profile";
    }

    if (settingsModalSubtitle) {
      settingsModalSubtitle.textContent =
        "Manage your profile";
    }

  }


  if (section === "settings") {

    if (securitySection) {
      securitySection.style.display =
        "block";
    }

    if (settingsModalTitle) {
      settingsModalTitle.textContent =
        "Settings";
    }

    if (settingsModalSubtitle) {
      settingsModalSubtitle.textContent =
        "Account, security & devices";
    }

  }


  if (section === "website") {

    if (websiteSettingsSection) {
      websiteSettingsSection.style.display =
        "block";
    }

    if (settingsModalTitle) {
      settingsModalTitle.textContent =
        "Website Settings";
    }

    if (settingsModalSubtitle) {
      settingsModalSubtitle.textContent =
        "Manage Krishna AI Studio";
    }

  }

}


/* =====================================================
   MENU ITEM ACTIONS
===================================================== */

profileMenuButton?.addEventListener(
  "click",
  () => {

    closeMenuPanel();

    openSettingsSection(
      "profile"
    );

  }
);


settingsMenuButton?.addEventListener(
  "click",
  () => {

    closeMenuPanel();

    openSettingsSection(
      "settings"
    );

  }
);


websiteSettingsMenuButton?.addEventListener(
  "click",
  () => {

    closeMenuPanel();

    openSettingsSection(
      "website"
    );

  }
);


/* =====================================================
   CLOSE SETTINGS
===================================================== */

closeSettings?.addEventListener(
  "click",
  () => {

    if (settingsOverlay) {

      settingsOverlay.classList.remove(
        "open"
      );

    }

  }
);


settingsOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target === settingsOverlay
    ) {

      settingsOverlay.classList.remove(
        "open"
      );

    }

  }
);


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
  message,
  success = true
) {

  if (!settingMessage) {
    return;
  }

  settingMessage.textContent =
    message;

  settingMessage.style.display =
    "block";

  settingMessage.style.color =
    success
      ? "#6ee7b7"
      : "#ff9ba5";

}


/* =====================================================
   LOAD USER PROFILE
===================================================== */

function loadUserProfile(user) {

  if (!user) {
    return;
  }


  const metadata =
    user.user_metadata || {};


  /* EMAIL */

  if (profileEmail) {

    profileEmail.value =
      user.email || "";

  }


  if (settingsEmail) {

    settingsEmail.textContent =
      user.email || "—";

  }


  /* DISPLAY NAME */

  if (displayName) {

    displayName.value =
      metadata.display_name || "";

  }


  /* PHONE */

  if (profilePhone) {

    profilePhone.value =
      metadata.phone || "";

  }


  /* LOCATION */

  if (profileLocation) {

    profileLocation.value =
      metadata.location || "";

  }


  /* ABOUT */

  if (profileAbout) {

    profileAbout.value =
      metadata.about || "";

  }


  /* ACCOUNT CREATED */

  if (accountCreated) {

    if (user.created_at) {

      const date =
        new Date(user.created_at);

      accountCreated.textContent =
        date.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );

    }

  }


  /* PROFILE PICTURE */

  const avatar =
    metadata.profile_picture || "";

  if (avatar) {

    if (profilePicture) {

      profilePicture.src =
        avatar;

      profilePicture.style.display =
        "block";

    }

    if (profileAvatarPlaceholder) {

      profileAvatarPlaceholder.style.display =
        "none";

    }

  } else {

    if (profilePicture) {

      profilePicture.src = "";

      profilePicture.style.display =
        "none";

    }

    if (profileAvatarPlaceholder) {

      profileAvatarPlaceholder.style.display =
        "grid";

    }

  }


  /* WEBSITE NAME */

  const savedWebsiteName =
    metadata.website_name ||
    "Krishna AI Studio";


  if (websiteName) {

    websiteName.value =
      savedWebsiteName;

  }


  if (headerWebsiteName) {

    headerWebsiteName.textContent =
      savedWebsiteName;

  }


  document.title =
    savedWebsiteName;


  /* WEBSITE DESCRIPTION */

  if (websiteDescription) {

    websiteDescription.value =
      metadata.website_description ||
      "";

  }


  /* WEBSITE THEME */

  if (websiteTheme) {

    websiteTheme.value =
      metadata.website_theme ||
      "dark";

  }


  /* LOGIN LIMIT */

  if (maxLoginCount) {

    const savedLimit =
      Number(
        metadata.max_login_count
      );

    if (
      savedLimit >= 1 &&
      savedLimit <= 10
    ) {

      maxLoginCount.value =
        String(savedLimit);

    } else {

      maxLoginCount.value =
        "10";

    }

  }

}


/* =====================================================
   PROFILE PICTURE
===================================================== */

changeProfilePicture?.addEventListener(
  "click",
  () => {

    profilePictureInput?.click();

  }
);


profilePictureInput?.addEventListener(
  "change",
  () => {

    const file =
      profilePictureInput.files?.[0];

    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      showMessage(
        "Please select an image.",
        false
      );

      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      () => {

        const imageUrl =
          reader.result;

        if (profilePicture) {

          profilePicture.src =
            imageUrl;

          profilePicture.style.display =
            "block";

        }

        if (
          profileAvatarPlaceholder
        ) {

          profileAvatarPlaceholder.style.display =
            "none";

        }

        /*
         * Save the image temporarily
         * in memory.
         *
         * A proper Supabase Storage
         * upload can be connected later.
         */

        window.pendingProfilePicture =
          imageUrl;

      };


    reader.readAsDataURL(file);

  }
);


/* =====================================================
   REMOVE PROFILE PICTURE
===================================================== */

removeProfilePicture?.addEventListener(
  "click",
  () => {

    if (profilePicture) {

      profilePicture.src = "";

      profilePicture.style.display =
        "none";

    }

    if (
      profileAvatarPlaceholder
    ) {

      profileAvatarPlaceholder.style.display =
        "grid";

    }

    window.pendingProfilePicture =
      null;

  }
);


/* =====================================================
   SAVE PROFILE
===================================================== */

saveProfile?.addEventListener(
  "click",
  async () => {

    const name =
      displayName?.value.trim() || "";

    const phone =
      profilePhone?.value.trim() || "";

    const location =
      profileLocation?.value.trim() || "";

    const about =
      profileAbout?.value.trim() || "";


    saveProfile.disabled = true;

    showMessage(
      "Saving profile..."
    );


    const metadata = {

      display_name: name,

      phone: phone,

      location: location,

      about: about,

      profile_picture:
        window.pendingProfilePicture !==
        undefined
          ? window.pendingProfilePicture
          : undefined

    };


    /*
     * Remove undefined values.
     */

    Object.keys(metadata).forEach(
      (key) => {

        if (
          metadata[key] ===
          undefined
        ) {

          delete metadata[key];

        }

      }
    );


    const {
      error
    } =
      await supabase.auth.updateUser({
        data: metadata
      });


    saveProfile.disabled = false;


    if (error) {

      showMessage(
        error.message,
        false
      );

      return;
    }


    window.pendingProfilePicture =
      undefined;


    showMessage(
      "Profile saved successfully."
    );

  }
);


/* =====================================================
   CHANGE PASSWORD
===================================================== */

changePassword?.addEventListener(
  "click",
  async () => {

    const password =
      newPassword?.value || "";


    if (password.length < 6) {

      showMessage(
        "Password must contain at least 6 characters.",
        false
      );

      return;

    }


    changePassword.disabled =
      true;


    showMessage(
      "Updating password..."
    );


    const {
      error
    } =
      await supabase.auth.updateUser({
        password: password
      });


    changePassword.disabled =
      false;


    if (error) {

      showMessage(
        error.message,
        false
      );

      return;
    }


    newPassword.value = "";


    showMessage(
      "Password changed successfully."
    );

  }
);


/* =====================================================
   WEBSITE SETTINGS
===================================================== */

saveWebsiteName?.addEventListener(
  "click",
  async () => {

    const name =
      websiteName?.value.trim() ||
      "Krishna AI Studio";

    const description =
      websiteDescription?.value.trim() ||
      "";

    const theme =
      websiteTheme?.value ||
      "dark";

    const loginLimit =
      Number(
        maxLoginCount?.value || 10
      );


    if (
      loginLimit < 1 ||
      loginLimit > 10
    ) {

      showMessage(
        "Maximum login count must be between 1 and 10.",
        false
      );

      return;

    }


    saveWebsiteName.disabled =
      true;


    showMessage(
      "Saving website settings..."
    );


    const {
      error
    } =
      await supabase.auth.updateUser({

        data: {

          website_name:
            name,

          website_description:
            description,

          website_theme:
            theme,

          max_login_count:
            loginLimit

        }

      });


    saveWebsiteName.disabled =
      false;


    if (error) {

      showMessage(
        error.message,
        false
      );

      return;

    }


    if (headerWebsiteName) {

      headerWebsiteName.textContent =
        name;

    }


    document.title =
      name;


    showMessage(
      "Website settings saved successfully."
    );

  }
);


/* =====================================================
   ADMIN LOGOUT
===================================================== */

adminLogout?.addEventListener(
  "click",
  async () => {

    adminLogout.disabled =
      true;


    showMessage(
      "Logging out..."
    );


    const {
      error
    } =
      await supabase.auth.signOut();


    if (error) {

      adminLogout.disabled =
        false;

      showMessage(
        error.message,
        false
      );

      return;

    }


    window.location.reload();

  }
);


/* =====================================================
   AUTHENTICATION
===================================================== */

async function checkAuthentication() {

  /*
   * Hide everything first.
   */

  hideAdminControls();


  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();


    if (error) {

      console.error(
        "Supabase authentication error:",
        error
      );

      /*
       * Don't leave the user
       * permanently stuck on
       * "Checking login".
       */

      document.body.classList.remove(
        "auth-checking"
      );

      return;

    }


    const session =
      data?.session;


    /*
     * No session.
     *
     * We don't redirect to admin.html
     * because the current website
     * itself may be the login page.
     */

    if (!session) {

      document.body.classList.remove(
        "auth-checking"
      );

      return;

    }


    const user =
      session.user;


    /*
     * LOAD PROFILE
     */

    loadUserProfile(user);


    /*
     * ADMIN ONLY
     */

    if (isAdmin(user)) {

      showAdminControls();

    } else {

      hideAdminControls();

    }


    /*
     * Authentication completed.
     */

    document.body.classList.remove(
      "auth-checking"
    );

  } catch (error) {

    console.error(
      "Authentication check failed:",
      error
    );

    /*
     * Prevent permanent loading screen.
     */

    document.body.classList.remove(
      "auth-checking"
    );

  }

}


/* =====================================================
   AUTH STATE CHANGES
===================================================== */

supabase.auth.onAuthStateChange(
  (event, session) => {

    /*
     * Always hide admin controls
     * before checking the new session.
     */

    hideAdminControls();


    if (!session) {

      /*
       * User logged out.
       */

      document.body.classList.remove(
        "auth-checking"
      );

      return;

    }


    const user =
      session.user;


    loadUserProfile(user);


    if (isAdmin(user)) {

      showAdminControls();

    }


    document.body.classList.remove(
      "auth-checking"
    );

  }
);


/* =====================================================
   START
===================================================== */

checkAuthentication();
