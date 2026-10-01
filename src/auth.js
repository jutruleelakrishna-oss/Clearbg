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


function openSettings() {
  settingsOverlay.classList.add("open");
  settingsOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeSettingsModal() {
  settingsOverlay.classList.remove("open");
  settingsOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


settingsButton.addEventListener(
  "click",
  openSettings
);


closeSettings.addEventListener(
  "click",
  closeSettingsModal
);


settingsOverlay.addEventListener(
  "click",
  (event) => {
    if (event.target === settingsOverlay) {
      closeSettingsModal();
    }
  }
);


async function checkAuthentication() {

  const {
    data: { session }
  } = await supabase.auth.getSession();


  if (!session) {
    window.location.replace("/admin.html");
    return;
  }


  const user = session.user;


  profileEmail.value =
    user.email || "";


  displayName.value =
    user.user_metadata?.display_name || "";


  const savedWebsiteName =
    user.user_metadata?.website_name;


  if (savedWebsiteName) {

    brandName.textContent =
      savedWebsiteName;

    websiteName.value =
      savedWebsiteName;

    document.title =
      savedWebsiteName;
  }


  if (
    user.email &&
    user.email.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
  ) {

    settingsButton.style.display =
      "block";

  } else {

    settingsButton.style.display =
      "none";
  }


  document.body.classList.remove(
    "auth-checking"
  );
}


/* WEBSITE NAME */

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


    saveWebsiteName.disabled = true;

    websiteMessage.textContent =
      "Saving...";


    const { error } =
      await supabase.auth.updateUser({
        data: {
          website_name: name
        }
      });


    saveWebsiteName.disabled = false;


    if (error) {

      websiteMessage.textContent =
        error.message;

      return;
    }


    brandName.textContent =
      name;

    document.title =
      name;

    websiteMessage.textContent =
      "Website name saved.";
  }
);


/* PROFILE */

saveProfile.addEventListener(
  "click",
  async () => {

    const name =
      displayName.value.trim();


    saveProfile.disabled = true;

    profileMessage.textContent =
      "Saving...";


    const { error } =
      await supabase.auth.updateUser({
        data: {
          display_name: name
        }
      });


    saveProfile.disabled = false;


    if (error) {

      profileMessage.textContent =
        error.message;

      return;
    }


    profileMessage.textContent =
      "Profile saved.";
  }
);


/* PASSWORD */

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


    changePassword.disabled = true;

    passwordMessage.textContent =
      "Updating password...";


    const { error } =
      await supabase.auth.updateUser({
        password: password
      });


    changePassword.disabled = false;


    if (error) {

      passwordMessage.textContent =
        error.message;

      return;
    }


    newPassword.value = "";

    passwordMessage.textContent =
      "Password changed successfully.";
  }
);


/* ADMIN LOGOUT */

adminLogout.addEventListener(
  "click",
  async () => {

    adminLogout.disabled = true;


    const { error } =
      await supabase.auth.signOut();


    if (error) {

      adminLogout.disabled = false;

      passwordMessage.textContent =
        error.message;

      return;
    }


    window.location.replace(
      "/admin.html"
    );
  }
);


/* AUTH CHECK */

checkAuthentication();


supabase.auth.onAuthStateChange(
  (event, session) => {

    if (!session) {

      window.location.replace(
        "/admin.html"
      );
    }

  }
);
