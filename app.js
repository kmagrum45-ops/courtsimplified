const SUPABASE_URL = "https://ffymjxjcnwakgdmdlpne.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pOwKiwY1s3gc9-soS3jo8Q_UzB1T8b6";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUpUser() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const authMessage = document.getElementById("authMessage");

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
  await loadCurrentUser();
}

async function loginUser() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const authMessage = document.getElementById("authMessage");

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
  await loadCurrentUser();
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  document.getElementById("currentUser").textContent = "Not logged in";
  document.getElementById("authMessage").textContent = "Logged out.";
}

async function loadCurrentUser() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const currentUser = document.getElementById("currentUser");

  if (user) {
    currentUser.textContent = user.email;
  } else {
    currentUser.textContent = "Not logged in";
  }
}

async function saveCaseToDatabase() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const saveMessage = document.getElementById("saveMessage");

  if (!user) {
    saveMessage.textContent = "You must be logged in to save.";
    return;
  }

  const province = document.getElementById("provinceSelect").value;
  const caseType = document.getElementById("caseType").value;
  const goal = document.getElementById("goal").value.trim();
  const story = document.getElementById("story").value.trim();
  const timeline = document.getElementById("timeline").value.trim();
  const evidence = document.getElementById("evidence").value.trim();
  const concerns = document.getElementById("concerns").value.trim();
  const summary = document.getElementById("summaryOutput").textContent;

  const { error } = await supabaseClient.from("cases").insert([
    {
      user_id: user.id,
      province: province,
      case_type: caseType,
      goal: goal,
      story: story,
      timeline: timeline,
      evidence: evidence,
      concerns: concerns,
      summary: summary
    }
  ]);

  if (error) {
    saveMessage.textContent = "Save failed: " + error.message;
    return;
  }

  saveMessage.textContent = "Case saved successfully.";
  await loadSavedCases();
}

async function loadSavedCases() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const savedCasesList = document.getElementById("savedCasesList");

  if (!savedCasesList) return;

  savedCasesList.innerHTML = "";

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
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  await loadSavedCases();
});
