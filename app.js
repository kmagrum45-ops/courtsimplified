alert("app.js loaded");
console.log("app.js started");

const SUPABASE_URL = "https://ffymjxjcnwakgdmdlpne.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pOwKiwY1s3gc9-soS3jo8Q_UzB1T8b6";

if (!window.supabase) {
  alert("Supabase failed to load. Check the script order in index.html.");
  throw new Error("window.supabase is missing");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.signUpUser = async function () {
  const emailEl = document.getElementById("authEmail");
  const passwordEl = document.getElementById("authPassword");
  const authMessage = document.getElementById("authMessage");

  if (!emailEl || !passwordEl || !authMessage) {
    alert("Account section elements are missing in index.html");
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    authMessage.textContent = "Enter email and password.";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "Signup successful. Check your email if confirmation is required.";
  await window.loadCurrentUser();
  await window.loadSavedCases();
};

window.loginUser = async function () {
  const emailEl = document.getElementById("authEmail");
  const passwordEl = document.getElementById("authPassword");
  const authMessage = document.getElementById("authMessage");

  if (!emailEl || !passwordEl || !authMessage) {
    alert("Account section elements are missing in index.html");
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    authMessage.textContent = "Enter email and password.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "Logged in successfully.";
  await window.loadCurrentUser();
  await window.loadSavedCases();
};

window.logoutUser = async function () {
  const authMessage = document.getElementById("authMessage");
  await supabaseClient.auth.signOut();

  const currentUser = document.getElementById("currentUser");
  if (currentUser) currentUser.textContent = "Not logged in";
  if (authMessage) authMessage.textContent = "Logged out.";

  await window.loadSavedCases();
};

window.loadCurrentUser = async function () {
  const currentUser = document.getElementById("currentUser");
  if (!currentUser) return;

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    currentUser.textContent = "Error loading user";
    return;
  }

  currentUser.textContent = user ? user.email : "Not logged in";
};

window.saveCaseToDatabase = async function () {
  const saveMessage = document.getElementById("saveMessage");
  if (!saveMessage) {
    alert("saveMessage element is missing in index.html");
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    saveMessage.textContent = "You must be logged in to save.";
    return;
  }

  const province = document.getElementById("provinceSelect")?.value || "";
  const caseType = document.getElementById("caseType")?.value || "";
  const goal = document.getElementById("goal")?.value.trim() || "";
  const story = document.getElementById("story")?.value.trim() || "";
  const timeline = document.getElementById("timeline")?.value.trim() || "";
  const evidence = document.getElementById("evidence")?.value.trim() || "";
  const concerns = document.getElementById("concerns")?.value.trim() || "";
  const summary = document.getElementById("summaryOutput")?.textContent || "";

  const { error } = await supabaseClient.from("cases").insert([
    {
      user_id: user.id,
      province,
      case_type: caseType,
      goal,
      story,
      timeline,
      evidence,
      concerns,
      summary
    }
  ]);

  if (error) {
    saveMessage.textContent = "Save failed: " + error.message;
    return;
  }

  saveMessage.textContent = "Case saved successfully.";
  await window.loadSavedCases();
};

window.loadSavedCases = async function () {
  const savedCasesList = document.getElementById("savedCasesList");
  if (!savedCasesList) return;

  savedCasesList.innerHTML = "";

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    savedCasesList.innerHTML = "<li>Log in to see saved cases.</li>";
    return;
  }

  const { data, error } = await supabaseClient
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    savedCasesList.innerHTML = `<li>Error loading cases: ${error.message}</li>`;
    return;
  }

  if (!data || data.length === 0) {
    savedCasesList.innerHTML = "<li>No saved cases yet.</li>";
    return;
  }

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.case_type} | ${item.province} | ${item.goal || "No goal entered"}`;
    savedCasesList.appendChild(li);
  });
};

window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded in app.js");
  await window.loadCurrentUser();
  await window.loadSavedCases();
});
