console.log("CourtSimplified app loaded");

const defaultOutputs = {
  family: `COURTSIMPLIFIED FAMILY LAW SUMMARY

Fill out the intake and generate a structured summary.`,
  civil: `COURTSIMPLIFIED CIVIL LAW SUMMARY

Fill out the intake and generate a structured summary.`,
  "small-claims": `COURTSIMPLIFIED SMALL CLAIMS SUMMARY

Fill out the intake and generate a structured summary.`
};

const guidance = {
  Ontario: {
    "Family Law": {
      court: "Ontario Court of Justice or Superior Court of Justice, depending on the issue",
      likelyForm: "Family forms vary by issue and stage. Conference and motion forms are commonly involved.",
      steps: [
        "Identify the main issue clearly, such as parenting, support, decision-making, or safety.",
        "Organize facts in date order and focus on specifics.",
        "Gather messages, schedules, records, and other proof tied to the real issues.",
        "Confirm the exact forms and filing steps for the court and stage you are dealing with."
      ],
      filing: "Family court procedure depends on the issue and stage. Conference briefs and filing timelines matter.",
      links: [
        { label: "Family Law Rules Forms", url: "https://ontariocourtforms.on.ca/en/family-law-rules-forms/" },
        { label: "Case Conferences", url: "https://www.ontariocourts.ca/ocj/family-court/going-to-court/case-conferences/" },
        { label: "Settlement Conferences", url: "https://www.ontariocourts.ca/ocj/family-court/going-to-court/settlement-conferences/" }
      ],
      note: "Strong family materials are usually specific, child-focused where relevant, and supported by a clean chronology."
    },
    "Civil Matter": {
      court: "Ontario Superior Court of Justice",
      likelyForm: "A typical civil claim may involve Form 4A, Form 14A, and Form 4C together.",
      steps: [
        "Identify what happened, who is responsible, and what remedy is being requested.",
        "Organize events in order and connect each key point to proof.",
        "Gather letters, contracts, invoices, reports, and other supporting records.",
        "Confirm the proper filing process and any special procedure that may apply."
      ],
      filing: "Civil procedure varies by claim type and process. Do not assume one path fits every civil matter.",
      links: [
        { label: "Rules of Civil Procedure Forms", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/" },
        { label: "Form 14A", url: "https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/14a/" },
        { label: "Civil Case Management", url: "https://www.ontario.ca/page/civil-case-management" }
      ],
      note: "The strongest civil summaries usually connect facts, responsibility, loss, and remedy in a direct way."
    },
    "Small Claims": {
      court: "Ontario Small Claims Court",
      likelyForm: "Form 7A – Plaintiff’s Claim is a common starting form.",
      steps: [
        "Explain what happened simply and clearly.",
        "Set out the amount claimed and why.",
        "Gather invoices, receipts, messages, photos, and other proof.",
        "Be ready for settlement conference and later steps if the matter continues."
      ],
      filing: "Small Claims Court still expects organized facts, proper forms, and supporting proof.",
      links: [
        { label: "Small Claims Court Forms", url: "https://ontariocourtforms.on.ca/en/rules-of-the-small-claims-court-forms/" },
        { label: "Settlement Conferences", url: "https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/settlement-conference-trial-management-conferences/" },
        { label: "Steps in a Case", url: "https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/steps-in-a-case/" }
      ],
      note: "Simple, clear, and supported usually works better than overloading the court with extra detail."
    }
  }
};

const pageType = document.body.dataset.pageType || "home";
const fields = {};

document.addEventListener("DOMContentLoaded", () => {
  if (pageType === "home") return;

  mapFields();
  bindEvents();
  restoreBrowserSave();
  renderProcessPanel();
});

function mapFields() {
  fields.name = document.getElementById("name");
  fields.email = document.getElementById("email");
  fields.goal = document.getElementById("goal");
  fields.story = document.getElementById("story");
  fields.timeline = document.getElementById("timeline");
  fields.evidence = document.getElementById("evidence");
  fields.concerns = document.getElementById("concerns");
  fields.caseType = document.getElementById("caseType");
  fields.provinceSelect = document.getElementById("provinceSelect");
  fields.summaryOutput = document.getElementById("summaryOutput");
  fields.processPanel = document.getElementById("processPanel");
  fields.saveMessage = document.getElementById("saveMessage");
}

function bindEvents() {
  document.getElementById("generateSummaryBtn")?.addEventListener("click", generateSummary);
  document.getElementById("saveSummaryBtn")?.addEventListener("click", saveToBrowser);
  document.getElementById("printSummaryBtn")?.addEventListener("click", printSummary);
  document.getElementById("clearSummaryBtn")?.addEventListener("click", clearForm);

  fields.provinceSelect?.addEventListener("change", () => {
    renderProcessPanel();
    generateSummary();
  });
}

function getProvince() {
  return fields.provinceSelect?.value || "Ontario";
}

function getCaseType() {
  return fields.caseType?.value || "";
}

function getStorageKey() {
  return `courtsimplified_${pageType}_builder`;
}

function getDefaultOutput() {
  return defaultOutputs[pageType] || "Fill out the intake and generate a structured summary.";
}

function getGuidance() {
  const province = getProvince();
  const caseType = getCaseType();

  if (guidance[province] && guidance[province][caseType]) {
    return guidance[province][caseType];
  }

  return {
    court: "Not available",
    likelyForm: "Not available",
    steps: ["Complete the intake, then confirm the proper court process from official sources."],
    filing: "Confirm the exact process before filing.",
    links: [],
    note: "More guidance can be added here later."
  };
}

function renderProcessPanel() {
  if (!fields.processPanel) return;

  const info = getGuidance();

  fields.processPanel.innerHTML = `
    <div class="process-row">
      <div class="process-label">Likely court</div>
      <div class="process-value">${escapeHtml(info.court)}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Likely form</div>
      <div class="process-value">${escapeHtml(info.likelyForm)}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Next steps</div>
      <div class="process-value">
        <ol class="process-steps">
          ${(info.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    </div>
    <div class="process-row">
      <div class="process-label">Filing notes</div>
      <div class="process-value">${escapeHtml(info.filing)}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Important note</div>
      <div class="process-value">${escapeHtml(info.note)}</div>
    </div>
    <div class="process-row">
      <div class="process-label">Official links</div>
      <div class="process-value">
        <div class="process-links">
          ${
            (info.links || []).length
              ? info.links.map(link =>
                  `<a class="process-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
                ).join("")
              : "<span>No official links added yet.</span>"
          }
        </div>
      </div>
    </div>
  `;
}

function buildSummary() {
  const caseType = getCaseType();
  const province = getProvince();
  const info = getGuidance();

  const name = fields.name?.value.trim() || "Not provided";
  const email = fields.email?.value.trim() || "Not provided";
  const goal = fields.goal?.value.trim() || "Not provided";
  const story = fields.story?.value.trim() || "Not provided";
  const timeline = fields.timeline?.value.trim() || "Not provided";
  const evidence = fields.evidence?.value.trim() || "Not provided";
  const concerns = fields.concerns?.value.trim() || "Not provided";

  return `COURTSIMPLIFIED ${caseType.toUpperCase()} SUMMARY

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
  if (fields.summaryOutput) {
    fields.summaryOutput.textContent = buildSummary();
  }
  renderProcessPanel();
}

function saveToBrowser() {
  const payload = {
    name: fields.name?.value || "",
    email: fields.email?.value || "",
    goal: fields.goal?.value || "",
    story: fields.story?.value || "",
    timeline: fields.timeline?.value || "",
    evidence: fields.evidence?.value || "",
    concerns: fields.concerns?.value || "",
    province: getProvince(),
    caseType: getCaseType(),
    summary: buildSummary(),
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(getStorageKey(), JSON.stringify(payload));

  if (fields.saveMessage) {
    fields.saveMessage.textContent = "Saved in this browser.";
  }
}

function restoreBrowserSave() {
  const raw = localStorage.getItem(getStorageKey());

  if (!raw) {
    if (fields.summaryOutput) {
      fields.summaryOutput.textContent = getDefaultOutput();
    }
    return;
  }

  try {
    const payload = JSON.parse(raw);

    if (fields.name) fields.name.value = payload.name || "";
    if (fields.email) fields.email.value = payload.email || "";
    if (fields.goal) fields.goal.value = payload.goal || "";
    if (fields.story) fields.story.value = payload.story || "";
    if (fields.timeline) fields.timeline.value = payload.timeline || "";
    if (fields.evidence) fields.evidence.value = payload.evidence || "";
    if (fields.concerns) fields.concerns.value = payload.concerns || "";
    if (fields.provinceSelect) fields.provinceSelect.value = payload.province || "Ontario";
    if (fields.summaryOutput) fields.summaryOutput.textContent = payload.summary || getDefaultOutput();
  } catch (error) {
    console.error("Restore failed:", error);
    if (fields.summaryOutput) {
      fields.summaryOutput.textContent = getDefaultOutput();
    }
  }
}

function clearForm() {
  if (fields.name) fields.name.value = "";
  if (fields.email) fields.email.value = "";
  if (fields.goal) fields.goal.value = "";
  if (fields.story) fields.story.value = "";
  if (fields.timeline) fields.timeline.value = "";
  if (fields.evidence) fields.evidence.value = "";
  if (fields.concerns) fields.concerns.value = "";
  if (fields.summaryOutput) fields.summaryOutput.textContent = getDefaultOutput();
  if (fields.saveMessage) fields.saveMessage.textContent = "";

  localStorage.removeItem(getStorageKey());
  renderProcessPanel();
}

function printSummary() {
  generateSummary();
  window.print();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
