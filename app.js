console.log("app.js started");

const SUPABASE_URL = "https://ffymjxjcnwakgdmldpne.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pOwKiwY1s3gc9-soS3jo8Q_UzB1T8b6";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_SUMMARY = `COURTSIMPLIFIED CASE SUMMARY

Choose a province or territory, fill out the intake form, and generate a structured summary.

This tool is designed to:
- organize the story
- identify likely issues
- create a cleaner starting point
- keep the selected jurisdiction visible in the output`;

const fields = {};
let selectedPlan = null;
let selectedCaseId = null;

const guidance = {
  Ontario: {
    "Family Law": {
      court: "Ontario Court of Justice or Superior Court of Justice",
      likelyForm: "Varies by issue. Common family court forms may include an Application, affidavit materials, and financial forms where required.",
      steps: [
        "Identify the main issue clearly, such as parenting, support, decision-making, or safety.",
        "Organize facts in date order and separate facts from emotion.",
        "Gather messages, records, court orders, financial information, and any other key proof.",
        "Confirm the correct family court forms and filing path before filing."
      ],
      filing: "Family matters often depend on the type of order requested and the court location. Always confirm the exact filing process before submitting.",
      links: [
        { label: "Ontario Family Court Forms", url: "https://ontariocourtforms.on.ca/en/family-law-rules-forms/" },
        { label: "Ontario Family Law Rules Forms", url: "https://ontariocourtforms.on.ca/en/family-law-rules-forms/" }
      ],
      note: "Family matters are highly fact-specific. Focus on chronology, consistency, and evidence."
    },
    "Civil Matter": {
      court: "Ontario Superior Court of Justice",
      likelyForm: "Form 14A – Statement of Claim (General), often used with Form 4A and Form 4C.",
      steps: [
        "Prepare the claim with the correct heading and details.",
        "File the claim using the Ontario civil filing process.",
        "Serve the issued claim on each defendant.",
        "File proof of service and track the response deadline."
      ],
      filing: "Use Ontario civil procedure forms and confirm the exact filing route before submitting.",
      links: [
        { label: "Ontario Form 14A", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/14a/" },
        { label: "Ontario Civil Forms", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/" }
      ],
      note: "This is general filing guidance only. Civil procedure can vary depending on the claim."
    },
    "Small Claims": {
      court: "Ontario Small Claims Court",
      likelyForm: "Form 7A – Plaintiff’s Claim.",
      steps: [
        "Prepare the Plaintiff’s Claim with the facts and amount claimed.",
        "File the claim online, by mail, or in person where permitted.",
        "Serve the issued claim on the defendant.",
        "File proof of service and watch the defence deadline."
      ],
      filing: "Ontario Small Claims documents may be filed online, by mail, or in person where allowed.",
      links: [
        { label: "Ontario Form 7A", url: "https://ontariocourtforms.on.ca/en/rules-of-the-small-claims-court-forms/7a/" },
        { label: "Ontario Small Claims Filing", url: "https://www.ontariocourts.ca/scj/filing-procedures/filing/filing-for-small-claims/" }
      ],
      note: "Keep the story simple, clear, and supported by documents."
    },
    "Negligence": {
      court: "Often Ontario Superior Court of Justice, depending on the claim amount and nature",
      likelyForm: "Usually a civil claim form structure rather than a special negligence-only form.",
      steps: [
        "Identify what duty was owed and how it was breached.",
        "Explain how the breach caused harm.",
        "List the harm, loss, or damage clearly.",
        "Attach records, documents, photos, reports, and timelines that support the claim."
      ],
      filing: "Negligence matters usually proceed as civil claims unless they fit within Small Claims Court.",
      links: [
        { label: "Ontario Civil Forms", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/" }
      ],
      note: "A strong negligence summary usually explains duty, breach, causation, and damages clearly."
    },
    "State Conduct / Charter": {
      court: "Usually Ontario Superior Court of Justice, depending on the claim and remedy",
      likelyForm: "Often civil-style originating materials, depending on relief sought.",
      steps: [
        "Identify the state actor or institution involved.",
        "Explain what happened in chronological order.",
        "Describe the right, interest, or harm involved.",
        "Attach documents, correspondence, policies, court records, and timelines where available."
      ],
      filing: "This area can be more complex and should be checked carefully before filing.",
      links: [
        { label: "Ontario Civil Forms", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/" }
      ],
      note: "This kind of claim often benefits from especially clean structure and document organization."
    },
    "Not Sure Yet": {
      court: "Not yet determined",
      likelyForm: "Not yet determined",
      steps: [
        "Start by organizing the facts and the timeline.",
        "Identify who was involved.",
        "List what proof you have.",
        "Clarify the outcome you want before choosing a filing path."
      ],
      filing: "The best next step is to organize the case first so the right court track becomes easier to identify.",
      links: [],
      note: "This is normal. Many users know what happened before they know what type of claim it is."
    }
  }
};

const planDetails = {
  single: {
    name: "Single Document",
    price: "$25 one-time",
    description: "A focused, lower-cost option for users who want one organized court-prep document or upgraded summary.",
    deliverables: [
      "One focused written output",
      "Simple entry point",
      "Good for first-time users"
    ]
  },
  plus: {
    name: "Case Builder Plus",
    price: "$79 one-time",
    description: "A stronger package for users who want more detail, better organization, and a more complete prep result.",
    deliverables: [
      "Expanded organization support",
      "More detail for facts and issues",
      "Better prep before filing or review"
    ]
  },
  ultimate: {
    name: "Ultimate Case Package",
    price: "$249 starting price",
    description: "A premium package for bigger or more complex matters that need deeper organization and a stronger overall case-prep structure.",
    deliverables: [
      "Premium organization support",
      "Better fit for complex matters",
      "More complete case package structure"
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  mapFields();
  bindEvents();
  restoreBrowserSave();
  updateProvinceLabel();
  updateProcessPanel();
  checkCurrentSession();
});

function mapFields() {
  fields.name = document.getElementById("name");
  fields.email = document.getElementById("email");
  fields.caseType = document.getElementById("caseType");
  fields.goal = document.getElementById("goal");
  fields.story = document.getElementById("story");
  fields.timeline = document.getElementById("timeline");
  fields.evidence = document.getElementById("evidence");
  fields.concerns = document.getElementById("concerns");
  fields.provinceSelect = document.getElementById("provinceSelect");
  fields.selectedProvinceLabel = document.getElementById("selectedProvinceLabel");
  fields.summaryOutput = document.getElementById("summaryOutput");
  fields.processPanel = document.getElementById("processPanel");
  fields.saveMessage = document.getElementById("saveMessage");
  fields.authEmail = document.getElementById("authEmail");
  fields.authPassword = document.getElementById("authPassword");
  fields.authMessage = document.getElementById("authMessage");
  fields.currentUser = document.getElementById("currentUser");
  fields.savedCasesList = document.getElementById("savedCasesList");
  fields.purchaseMessage = document.getElementById("purchaseMessage");
  fields.selectedPlanName = document.getElementById("selectedPlanName");
  fields.selectedPlanPrice = document.getElementById("selectedPlanPrice");
  fields.selectedPlanDescription = document.getElementById("selectedPlanDescription");
  fields.selectedPlanDeliverables = document.getElementById("selectedPlanDeliverables");
}

function bindEvents() {
  document.getElementById("generateSummaryBtn")?.addEventListener("click", generateSummary);
  document.getElementById("saveSummaryBtn")?.addEventListener("click", saveToBrowser);
  document.getElementById("printSummaryBtn")?.addEventListener("click", printSummary);
  document.getElementById("clearSummaryBtn")?.addEventListener("click", clearForm);

  fields.provinceSelect?.addEventListener("change", () => {
    updateProvinceLabel();
    updateProcessPanel();
    generateSummary();
  });

  fields.caseType?.addEventListener("change", () => {
    updateProcessPanel();
    generateSummary();
  });

  document.querySelectorAll("[data-plan-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planId = btn.getAttribute("data-plan-id");
      selectPlan(planId);
    });
  });
}

function getProvince() {
  return fields.provinceSelect?.value || "Ontario";
}

function getCaseType() {
  return fields.caseType?.value || "Not Sure Yet";
}

function updateProvinceLabel() {
  if (fields.selectedProvinceLabel) {
    fields.selectedProvinceLabel.textContent = getProvince();
  }
}

function getGuidanceForSelection() {
  const province = getProvince();
  const caseType = getCaseType();

  if (guidance[province] && guidance[province][caseType]) {
    return guidance[province][caseType];
  }

  // fallback to Ontario general logic for now
  if (guidance.Ontario && guidance.Ontario[caseType]) {
    return guidance.Ontario[caseType];
  }

  return guidance.Ontario["Not Sure Yet"];
}

function updateProcessPanel() {
  if (!fields.processPanel) return;

  const info = getGuidanceForSelection();

  fields.processPanel.innerHTML = `
    <div class="process-row">
      <div class="process-label">Likely court</div>
      <div class="process-value">${escapeHtml(info.court || "Not available")}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Likely form</div>
      <div class="process-value">${escapeHtml(info.likelyForm || "Not available")}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Filing notes</div>
      <div class="process-value">${escapeHtml(info.filing || "Not available")}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Next steps</div>
      <div class="process-value">
        <ol class="process-steps">
          ${(info.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </div>
    <div class="process-row">
      <div class="process-label">Important note</div>
      <div class="process-value">${escapeHtml(info.note || "")}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Helpful links</div>
      <div class="process-value">
        <div class="process-links">
          ${
            (info.links || []).length
              ? info.links
                  .map(
                    (link) =>
                      `<a class="process-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
                  )
                  .join("")
              : "<span>No links available yet.</span>"
          }
        </div>
      </div>
    </div>
  `;
}

function buildSummaryText() {
  const province = getProvince();
  const caseType = getCaseType();
  const info = getGuidanceForSelection();

  const name = fields.name?.value.trim() || "Not provided";
  const email = fields.email?.value.trim() || "Not provided";
  const goal = fields.goal?.value.trim() || "Not provided";
  const story = fields.story?.value.trim() || "Not provided";
  const timeline = fields.timeline?.value.trim() || "Not provided";
  const evidence = fields.evidence?.value.trim() || "Not provided";
  const concerns = fields.concerns?.value.trim() || "Not provided";

  return `COURTSIMPLIFIED CASE SUMMARY

Jurisdiction:
${province}

Case Type:
${caseType}

Your Name:
${name}

Email:
${email}

Main Goal:
${goal}

BACKGROUND / WHAT HAPPENED:
${story}

TIMELINE / IMPORTANT DATES:
${timeline}

EVIDENCE / PROOF AVAILABLE:
${evidence}

MAIN CONCERNS / ISSUES:
${concerns}

LIKELY COURT:
${info.court}

LIKELY FORM OR STARTING MATERIAL:
${info.likelyForm}

LIKELY NEXT STEPS:
${(info.steps || []).map((step, index) => `${index + 1}. ${step}`).join("\n")}

FILING NOTE:
${info.filing}

IMPORTANT NOTE:
${info.note}

GENERAL REMINDER:
This summary is for organization and preparation only. CourtSimplified is not a law firm and does not provide legal advice.`;
}

function generateSummary() {
  const summary = buildSummaryText();
  if (fields.summaryOutput) {
    fields.summaryOutput.textContent = summary;
  }
  updateProcessPanel();
}

function saveToBrowser() {
  try {
    const payload = collectFormData();
    payload.summary = buildSummaryText();
    payload.savedAt = new Date().toISOString();

    localStorage.setItem("courtsimplified_case_builder", JSON.stringify(payload));
    if (fields.saveMessage) {
      fields.saveMessage.textContent = "Saved in this browser successfully.";
    }
  } catch (error) {
    console.error(error);
    if (fields.saveMessage) {
      fields.saveMessage.textContent = "Could not save in browser.";
    }
  }
}

function restoreBrowserSave() {
  try {
    const raw = localStorage.getItem("courtsimplified_case_builder");
    if (!raw) {
      if (fields.summaryOutput) {
        fields.summaryOutput.textContent = DEFAULT_SUMMARY;
      }
      return;
    }

    const payload = JSON.parse(raw);

    if (fields.name) fields.name.value = payload.name || "";
    if (fields.email) fields.email.value = payload.email || "";
    if (fields.caseType) fields.caseType.value = payload.caseType || "Family Law";
    if (fields.goal) fields.goal.value = payload.goal || "";
    if (fields.story) fields.story.value = payload.story || "";
    if (fields.timeline) fields.timeline.value = payload.timeline || "";
    if (fields.evidence) fields.evidence.value = payload.evidence || "";
    if (fields.concerns) fields.concerns.value = payload.concerns || "";
    if (fields.provinceSelect) fields.provinceSelect.value = payload.province || "Ontario";
    if (fields.summaryOutput) fields.summaryOutput.textContent = payload.summary || DEFAULT_SUMMARY;

    updateProvinceLabel();
    updateProcessPanel();
  } catch (error) {
    console.error("Restore failed:", error);
    if (fields.summaryOutput) {
      fields.summaryOutput.textContent = DEFAULT_SUMMARY;
    }
  }
}

function clearForm() {
  if (fields.name) fields.name.value = "";
  if (fields.email) fields.email.value = "";
  if (fields.caseType) fields.caseType.value = "Family Law";
  if (fields.goal) fields.goal.value = "";
  if (fields.story) fields.story.value = "";
  if (fields.timeline) fields.timeline.value = "";
  if (fields.evidence) fields.evidence.value = "";
  if (fields.concerns) fields.concerns.value = "";
  if (fields.provinceSelect) fields.provinceSelect.value = "Ontario";
  if (fields.summaryOutput) fields.summaryOutput.textContent = DEFAULT_SUMMARY;
  if (fields.saveMessage) fields.saveMessage.textContent = "";
  updateProvinceLabel();
  updateProcessPanel();
  localStorage.removeItem("courtsimplified_case_builder");
}

function printSummary() {
  generateSummary();
  window.print();
}

function collectFormData() {
  return {
    province: getProvince(),
    name: fields.name?.value.trim() || "",
    email: fields.email?.value.trim() || "",
    caseType: getCaseType(),
    goal: fields.goal?.value.trim() || "",
    story: fields.story?.value.trim() || "",
    timeline: fields.timeline?.value.trim() || "",
    evidence: fields.evidence?.value.trim() || "",
    concerns: fields.concerns?.value.trim() || ""
  };
}

function selectPlan(planId) {
  const plan = planDetails[planId];
  if (!plan) return;

  selectedPlan = planId;

  if (fields.selectedPlanName) fields.selectedPlanName.textContent = plan.name;
  if (fields.selectedPlanPrice) fields.selectedPlanPrice.textContent = plan.price;
  if (fields.selectedPlanDescription) fields.selectedPlanDescription.textContent = plan.description;

  if (fields.selectedPlanDeliverables) {
    fields.selectedPlanDeliverables.innerHTML = plan.deliverables
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  }

  if (fields.purchaseMessage) {
    fields.purchaseMessage.textContent = `${plan.name} selected. Payment is not active yet, but this flow is ready for later.`;
  }

  const section = document.getElementById("purchaseFlow");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function beginCheckout() {
  if (!selectedPlan) {
    if (fields.purchaseMessage) {
      fields.purchaseMessage.textContent = "Please select a plan first.";
    }
    return;
  }

  if (fields.purchaseMessage) {
    fields.purchaseMessage.textContent = "Checkout is not live yet. Later this button can connect to Stripe or another payment flow.";
  }
}

async function signUpUser() {
  const email = fields.authEmail?.value.trim();
  const password = fields.authPassword?.value;

  if (!email || !password) {
    setAuthMessage("Enter an email and password first.");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    setAuthMessage("Sign-up submitted. Check your email if confirmation is enabled.");
    await checkCurrentSession();
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message || "Could not sign up.");
  }
}

async function loginUser() {
  const email = fields.authEmail?.value.trim();
  const password = fields.authPassword?.value;

  if (!email || !password) {
    setAuthMessage("Enter an email and password first.");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuthMessage("Logged in successfully.");
    await checkCurrentSession();
    await loadSavedCases();
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message || "Could not log in.");
  }
}

async function logoutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    setAuthMessage("Logged out.");
    if (fields.currentUser) fields.currentUser.textContent = "Not logged in";
    if (fields.savedCasesList) {
      fields.savedCasesList.innerHTML = "<li>Log in to see saved cases.</li>";
    }
  } catch (error) {
    console.error(error);
    setAuthMessage(error.message || "Could not log out.");
  }
}

async function checkCurrentSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    const user = data?.session?.user || null;

    if (fields.currentUser) {
      fields.currentUser.textContent = user?.email || "Not logged in";
    }

    if (user) {
      await loadSavedCases();
    }
  } catch (error) {
    console.error(error);
  }
}

function setAuthMessage(message) {
  if (fields.authMessage) {
    fields.authMessage.textContent = message;
  }
}

async function saveCaseToDatabase() {
  generateSummary();

  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;

    const user = sessionData?.session?.user;
    if (!user) {
      if (fields.saveMessage) {
        fields.saveMessage.textContent = "Log in first to save to your account.";
      }
      return;
    }

    const payload = collectFormData();
    const summary = buildSummaryText();

    const record = {
      user_id: user.id,
      case_title: `${payload.caseType} - ${payload.goal || "Untitled Case"}`,
      province: payload.province,
      case_type: payload.caseType,
      full_name: payload.name,
      email: payload.email,
      goal: payload.goal,
      story: payload.story,
      timeline: payload.timeline,
      evidence: payload.evidence,
      concerns: payload.concerns,
      summary_text: summary,
      updated_at: new Date().toISOString()
    };

    let result;

    if (selectedCaseId) {
      result = await supabaseClient
        .from("cases")
        .update(record)
        .eq("id", selectedCaseId)
        .select()
        .single();
    } else {
      record.created_at = new Date().toISOString();
      result = await supabaseClient
        .from("cases")
        .insert(record)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    selectedCaseId = result.data.id;

    if (fields.saveMessage) {
      fields.saveMessage.textContent = "Saved to your account.";
    }

    await loadSavedCases();
  } catch (error) {
    console.error(error);
    if (fields.saveMessage) {
      fields.saveMessage.textContent =
        "Could not save to Supabase. Make sure your 'cases' table exists with matching columns.";
    }
  }
}

async function loadSavedCases() {
  if (!fields.savedCasesList) return;

  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;

    const user = sessionData?.session?.user;
    if (!user) {
      fields.savedCasesList.innerHTML = "<li>Log in to see saved cases.</li>";
      return;
    }

    const { data, error } = await supabaseClient
      .from("cases")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    if (!data || !data.length) {
      fields.savedCasesList.innerHTML = "<li>No saved cases yet.</li>";
      return;
    }

    fields.savedCasesList.innerHTML = data
      .map((item) => {
        const title = escapeHtml(item.case_title || "Untitled Case");
        const province = escapeHtml(item.province || "");
        const updated = item.updated_at ? new Date(item.updated_at).toLocaleString() : "";
        return `
          <li>
            <a href="#" onclick="loadCaseFromList('${item.id}'); return false;">
              ${title}
            </a>
            <br />
            <span class="tiny">${province} • Updated ${escapeHtml(updated)}</span>
          </li>
        `;
      })
      .join("");
  } catch (error) {
    console.error(error);
    fields.savedCasesList.innerHTML = "<li>Could not load saved cases.</li>";
  }
}

async function loadCaseFromList(caseId) {
  try {
    const { data, error } = await supabaseClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error) throw error;
    if (!data) return;

    selectedCaseId = data.id;

    if (fields.provinceSelect) fields.provinceSelect.value = data.province || "Ontario";
    if (fields.name) fields.name.value = data.full_name || "";
    if (fields.email) fields.email.value = data.email || "";
    if (fields.caseType) fields.caseType.value = data.case_type || "Family Law";
    if (fields.goal) fields.goal.value = data.goal || "";
    if (fields.story) fields.story.value = data.story || "";
    if (fields.timeline) fields.timeline.value = data.timeline || "";
    if (fields.evidence) fields.evidence.value = data.evidence || "";
    if (fields.concerns) fields.concerns.value = data.concerns || "";
    if (fields.summaryOutput) {
      fields.summaryOutput.textContent = data.summary_text || DEFAULT_SUMMARY;
    }

    updateProvinceLabel();
    updateProcessPanel();

    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (fields.saveMessage) {
      fields.saveMessage.textContent = "Saved case loaded.";
    }
  } catch (error) {
    console.error(error);
    if (fields.saveMessage) {
      fields.saveMessage.textContent = "Could not load that saved case.";
    }
  }
}

function askAI() {
  generateSummary();
  if (fields.saveMessage) {
    fields.saveMessage.textContent =
      "This button is ready for future AI features. For now it regenerates your structured summary.";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.signUpUser = signUpUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.saveCaseToDatabase = saveCaseToDatabase;
window.loadCaseFromList = loadCaseFromList;
window.beginCheckout = beginCheckout;
window.askAI = askAI;
