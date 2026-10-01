import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =====================================================
   SUPABASE
===================================================== */

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


/* =====================================================
   ELEMENTS
===================================================== */

const menuButton =
  document.getElementById(
    "menuButton"
  );

const menuOverlay =
  document.getElementById(
    "menuOverlay"
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

const settingMessage =
  document.getElementById(
    "settingMessage"
  );


/* =====================================================
   PROFILE ELEMENTS
===================================================== */

const profilePicture =
  document.getElementById(
    "profilePicture"
  );

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

const displayName =
  document.getElementById(
    "displayName"
  );

const profileEmail =
  document.getElementById(
    "profileEmail"
  );

const profilePhone =
  document.getElementById(
    "profilePhone"
  );

const profileLocation =
  document.getElementById(
    "profileLocation"
  );

const profileAbout =
  document.getElementById(
    "profileAbout"
  );

const accountCreated =
  document.getElementById(
    "accountCreated"
  );

const saveProfile =
  document.getElementById(
    "saveProfile"
  );


/* =====================================================
   SECURITY ELEMENTS
===================================================== */

const settingsEmail =
  document.getElementById(
    "settingsEmail"
  );

const newPassword =
  document.getElementById(
    "newPassword"
  );

const changePassword =
  document.getElementById(
    "changePassword"
  );

const maxLoginCount =
  document.getElementById(
    "maxLoginCount"
  );

const adminLogout =
  document.getElementById(
    "adminLogout"
  );


/* =====================================================
   WEBSITE SETTINGS
===================================================== */

const websiteName =
  document.getElementById(
    "websiteName"
  );

const websiteDescription =
  document.getElementById(
    "websiteDescription"
  );

const websiteTheme =
  document.getElementById(
    "websiteTheme"
  );

const saveWebsiteName =
  document.getElementById(
    "saveWebsiteName"
  );


/* =====================================================
   CURRENT USER
===================================================== */

let currentUser =
  null;


/* =====================================================
   HELPERS
===================================================== */

function isAdmin(
  user
) {

  return (
    user &&
    user.email &&
    user.email.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  );

}


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


  settingMessage.dataset.type =
    success
      ? "success"
      : "error";


  setTimeout(
    () => {

      if (settingMessage) {

        settingMessage.style.display =
          "none";

      }

    },
    3500
  );

}


/* =====================================================
   ADMIN VISIBILITY
===================================================== */

function updateAdminVisibility(
  user
) {

  const admin =
    isAdmin(user);


  /*
   * Hamburger is completely hidden
   * for normal users.
   */

  if (menuButton) {

    menuButton.style.display =
      admin
        ? "flex"
        : "none";

  }


  if (!admin) {

    closeAdminMenu();
    closeSettings();

  }

}


/* =====================================================
   MENU
===================================================== */

function openAdminMenu() {

  if (
    !currentUser ||
    !isAdmin(currentUser)
  ) {

    return;

  }


  if (menuOverlay) {

    menuOverlay.classList.add(
      "active"
    );

  }

}


function closeAdminMenu() {

  if (menuOverlay) {

    menuOverlay.classList.remove(
      "active"
    );

  }

}


function toggleAdminMenu() {

  if (
    !currentUser ||
    !isAdmin(currentUser)
  ) {

    return;

  }


  if (
    menuOverlay?.classList.contains(
      "active"
    )
  ) {

    closeAdminMenu();

  } else {

    openAdminMenu();

  }

}


menuButton?.addEventListener(
  "click",
  toggleAdminMenu
);


menuOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      menuOverlay
    ) {

      closeAdminMenu();

    }

  }
);


/* =====================================================
   SETTINGS MODAL
===================================================== */

function openSettings() {

  if (
    !currentUser ||
    !isAdmin(currentUser)
  ) {

    return;

  }


  settingsOverlay?.classList.add(
    "active"
  );

}


function closeSettings() {

  settingsOverlay?.classList.remove(
    "active"
  );

}


settingsOverlay?.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      settingsOverlay
    ) {

      closeSettings();

    }

  }
);


/* =====================================================
   SETTINGS SECTIONS
===================================================== */

function hideSections() {

  profileSection?.classList.remove(
    "active"
  );

  securitySection?.classList.remove(
    "active"
  );

  websiteSettingsSection?.classList.remove(
    "active"
  );

}


profileMenuButton?.addEventListener(
  "click",
  () => {

    closeAdminMenu();

    openSettings();

    hideSections();

    profileSection?.classList.add(
      "active"
    );

  }
);


settingsMenuButton?.addEventListener(
  "click",
  () => {

    closeAdminMenu();

    openSettings();

    hideSections();

    securitySection?.classList.add(
      "active"
    );

  }
);


websiteSettingsMenuButton?.addEventListener(
  "click",
  () => {

    closeAdminMenu();

    openSettings();

    hideSections();

    websiteSettingsSection?.classList.add(
      "active"
    );

  }
);


/* =====================================================
   PROFILE IMAGE
===================================================== */

function updateProfilePicture(
  image
) {

  if (
    !profilePicture ||
    !profileAvatarPlaceholder
  ) {

    return;

  }


  if (image) {

    profilePicture.src =
      image;

    profilePicture.style.display =
      "block";

    profileAvatarPlaceholder.style.display =
      "none";

  } else {

    profilePicture.removeAttribute(
      "src"
    );

    profilePicture.style.display =
      "none";

    profileAvatarPlaceholder.style.display =
      "flex";

  }

}


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

        const image =
          reader.result;


        updateProfilePicture(
          image
        );


        /*
         * Store temporarily in memory
         * until Save Profile is clicked.
         */

        profilePictureInput.dataset.image =
          image;

      };


    reader.readAsDataURL(
      file
    );

  }
);


removeProfilePicture?.addEventListener(
  "click",
  () => {

    updateProfilePicture(
      null
    );


    if (profilePictureInput) {

      profilePictureInput.value =
        "";

      profilePictureInput.dataset.image =
        "";

    }

  }
);


/* =====================================================
   LOAD PROFILE
===================================================== */

function loadProfile(
  user
) {

  if (!user) {
    return;
  }


  const metadata =
    user.user_metadata || {};


  if (displayName) {

    displayName.value =
      metadata.display_name ||
      "Krishna AI Studio Admin";

  }


  if (profileEmail) {

    profileEmail.value =
      user.email || "";

  }


  if (profilePhone) {

    profilePhone.value =
      metadata.phone || "";

  }


  if (profileLocation) {

    profileLocation.value =
      metadata.location || "";

  }


  if (profileAbout) {

    profileAbout.value =
      metadata.about || "";

  }


  if (accountCreated) {

    accountCreated.value =
      user.created_at
        ? new Date(
            user.created_at
          ).toLocaleString()
        : "";

  }


  if (settingsEmail) {

    settingsEmail.value =
      user.email || "";

  }


  updateProfilePicture(
    metadata.profile_picture ||
    null
  );

}


/* =====================================================
   SAVE PROFILE
===================================================== */

saveProfile?.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !isAdmin(currentUser)
    ) {

      return;

    }


    try {

      const existingMetadata =
        currentUser.user_metadata || {};


      let profileImage =
        existingMetadata.profile_picture ||
        null;


      /*
       * New image selected.
       */

      if (
        profilePictureInput?.dataset.image
      ) {

        profileImage =
          profilePictureInput.dataset.image;

      }


      /*
       * If image was removed.
       */

      if (
        profilePictureInput &&
        profilePictureInput.dataset.image ===
          ""
      ) {

        profileImage =
          null;

      }


      const updates = {

        display_name:
          displayName?.value?.trim() ||
          "Krishna AI Studio Admin",

        phone:
          profilePhone?.value?.trim() ||
          "",

        location:
          profileLocation?.value?.trim() ||
          "",

        about:
          profileAbout?.value?.trim() ||
          "",

        profile_picture:
          profileImage

      };


      const {
        data,
        error
      } =
        await supabase.auth.updateUser(
          {
            data: updates
          }
        );


      if (error) {
        throw error;
      }


      currentUser =
        data.user;


      showMessage(
        "Profile saved successfully."
      );


      loadProfile(
        currentUser
      );

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );


      showMessage(
        error.message ||
          "Could not save profile.",
        false
      );

    }

  }
);


/* =====================================================
   CHANGE PASSWORD
===================================================== */

changePassword?.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !isAdmin(currentUser)
    ) {

      return;

    }


    const password =
      newPassword?.value?.trim();


    if (!password) {

      showMessage(
        "Enter a new password.",
        false
      );

      return;

    }


    if (password.length < 6) {

      showMessage(
        "Password must contain at least 6 characters.",
        false
      );

      return;

    }


    try {

      const {
        error
      } =
        await supabase.auth.updateUser(
          {
            password
          }
        );


      if (error) {
        throw error;
      }


      if (newPassword) {

        newPassword.value =
          "";

      }


      showMessage(
        "Password changed successfully."
      );

    } catch (error) {

      console.error(
        "Password change error:",
        error
      );


      showMessage(
        error.message ||
          "Could not change password.",
        false
      );

    }

  }
);


/* =====================================================
   WEBSITE SETTINGS
===================================================== */

function loadWebsiteSettings(
  user
) {

  const metadata =
    user?.user_metadata || {};


  if (websiteName) {

    websiteName.value =
      metadata.website_name ||
      "Krishna AI Studio";

  }


  if (websiteDescription) {

    websiteDescription.value =
      metadata.website_description ||
      "AI-powered background removal studio.";

  }


  if (websiteTheme) {

    websiteTheme.value =
      metadata.website_theme ||
      "dark";

  }


  if (maxLoginCount) {

    maxLoginCount.value =
      metadata.max_login_count ||
      1;

  }

}


saveWebsiteName?.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !isAdmin(currentUser)
    ) {

      return;

    }


    try {

      const existingMetadata =
        currentUser.user_metadata || {};


      const maxLogins =
        Number(
          maxLoginCount?.value || 1
        );


      const safeMaxLogins =
        Math.max(
          1,
          Math.min(
            10,
            maxLogins
          )
        );


      const updates = {

        ...existingMetadata,

        website_name:
          websiteName?.value?.trim() ||
          "Krishna AI Studio",

        website_description:
          websiteDescription?.value?.trim() ||
          "AI-powered background removal studio.",

        website_theme:
          websiteTheme?.value ||
          "dark",

        max_login_count:
          safeMaxLogins

      };


      const {
        data,
        error
      } =
        await supabase.auth.updateUser(
          {
            data: updates
          }
        );


      if (error) {
        throw error;
      }


      currentUser =
        data.user;


      showMessage(
        "Website settings saved."
      );

    } catch (error) {

      console.error(
        "Website settings error:",
        error
      );


      showMessage(
        error.message ||
          "Could not save website settings.",
        false
      );

    }

  }
);


/* =====================================================
   LOGOUT
===================================================== */

adminLogout?.addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !isAdmin(currentUser)
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        "Log out of your admin account on this device?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {
        throw error;
      }


      window.location.href =
        "/";

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );


      showMessage(
        error.message ||
          "Could not log out.",
        false
      );

    }

  }
);


/* =====================================================
   AUTHENTICATION CHECK
===================================================== */

async function checkAuthentication() {

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


    if (!session) {

      currentUser =
        null;


      updateAdminVisibility(
        null
      );


      /*
       * Don't keep the website
       * stuck on "Checking login..."
       */

      document.body.classList.remove(
        "auth-checking"
      );

      return;

    }


    currentUser =
      session.user;


    updateAdminVisibility(
      currentUser
    );


    if (
      isAdmin(currentUser)
    ) {

      loadProfile(
        currentUser
      );

      loadWebsiteSettings(
        currentUser
      );

    }


    document.body.classList.remove(
      "auth-checking"
    );

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );


    currentUser =
      null;


    updateAdminVisibility(
      null
    );


    document.body.classList.remove(
      "auth-checking"
    );

  }

}


/* =====================================================
   AUTH STATE CHANGES
===================================================== */

supabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    currentUser =
      session?.user || null;


    updateAdminVisibility(
      currentUser
    );


    if (
      currentUser &&
      isAdmin(currentUser)
    ) {

      loadProfile(
        currentUser
      );

      loadWebsiteSettings(
        currentUser
      );

    }

  }
);


/* =====================================================
   START
===================================================== */

checkAuthentication();
