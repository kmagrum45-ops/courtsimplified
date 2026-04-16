console.log("CourtSimplified app loaded");

(function () {
  const STORAGE_KEYS = {
    intake: "courtsimplified_start_case_v2",
    documents: "courtsimplified_documents_v1"
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupStartCasePage();
    setupDocumentsPage();
  });

  function setupStartCasePage() {
    const form = document.getElementById("case-form");
    if (!form) return;

    const steps = Array.from(document.querySelectorAll(".step-pane"));
    const progressSteps = Array.from(document.querySelectorAll(".progress-step"));
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const resetBtn = document.getElementById("resetBtn");
    const outputCard = document.getElementById("outputCard");

    const fields = {
      province: document.getElementById("province"),
      matterType: document.getElementById("matterType"),
      goal: document.getElementById("goal"),
      whatHappened: document.getElementById("whatHappened"),
      whenStarted: document.getElementById("whenStarted"),
      recentEvent: document.getElementById("recentEvent"),
      harm: document.getElementById("harm"),
      people: document.getElementById("people"),
      records: document.getElementById("records"),
      deadline: document.getElementById("deadline")
    };

    const outputs = {
      summaryText: document.getElementById("summaryText"),
      pathwaysList: document.getElementById("pathwaysList"),
      keyInfoList: document.getElementById("keyInfoList"),
      nextStepsList: document.getElementById("nextStepsList")
    };

    let currentStep = 0;

    restoreStartCase(fields, outputCard, outputs);
    showStep(0);

    nextBtn?.addEventListener("click", () => {
      if (currentStep < steps.length - 2) {
        if (!validateStep(currentStep, fields)) return;
        showStep(currentStep + 1);
        saveStartCase(fields);
        return;
      }

      if (currentStep === steps.length - 2) {
        if (!validateStep(currentStep, fields)) return;
        const result = buildStructuredOutput(fields);
        renderStructuredOutput(result, outputs, outputCard);
        saveStartCase(fields, result);
        saveDocumentsData(result);
        showStep(currentStep + 1);
        return;
      }

      const result = buildStructuredOutput(fields);
      renderStructuredOutput(result, outputs, outputCard);
      saveStartCase(fields, result);
      saveDocumentsData(result);
    });

    prevBtn?.addEventListener("click", () => {
      if (currentStep > 0) showStep(currentStep - 1);
    });

    resetBtn?.addEventListener("click", () => {
      form.reset();
      outputCard?.classList.remove("show");
      clearStartCase(outputs);
      localStorage.removeItem(STORAGE_KEYS.intake);
      localStorage.removeItem(STORAGE_KEYS.documents);
      showStep(0);
    });

    Object.values(fields).forEach((field) => {
      field?.addEventListener("input", () => saveStartCase(fields));
      field?.addEventListener("change", () => saveStartCase(fields));
    });

    function showStep(index) {
      steps.forEach((step, i) => step.classList.toggle("active", i === index));
      progressSteps.forEach((step, i) => step.classList.toggle("active", i <= index));
      if (prevBtn) prevBtn.style.visibility = index === 0 ? "hidden" : "visible";
      if (nextBtn) {
        nextBtn.textContent =
          index === steps.length - 1
            ? "Generate Again"
            : index === steps.length - 2
              ? "Generate Output"
              : "Continue";
      }
      currentStep = index;
    }
  }

  function validateStep(stepIndex, fields) {
    if (stepIndex === 0) {
      if (!value(fields.goal)) {
        alert("Please enter the main goal before continuing.");
        fields.goal?.focus();
        return false;
      }
    }

    if (stepIndex === 1) {
      if (!value(fields.whatHappened)) {
        alert("Please describe what happened before continuing.");
        fields.whatHappened?.focus();
        return false;
      }
    }

    if (stepIndex === 2) {
      if (!value(fields.people) && !value(fields.records)) {
        alert("Please enter the people involved or the records you have before generating the output.");
        fields.people?.focus();
        return false;
      }
    }

    return true;
  }

  function buildStructuredOutput(fields) {
    const province = value(fields.province) || "Ontario";
    const matterType = value(fields.matterType) || "Civil Matter";
    const goal = value(fields.goal) || "understand next steps";
    const whatHappened = value(fields.whatHappened) || "No detailed summary entered yet.";
    const whenStarted = value(fields.whenStarted) || "an unspecified date";
    const recentEvent = value(fields.recentEvent) || "no recent event listed";
    const harm = value(fields.harm) || "No harm or loss was described yet.";
    const people = value(fields.people) || "No parties or witnesses listed yet.";
    const records = value(fields.records) || "No records listed yet.";
    const deadline = value(fields.deadline) || "No deadline or court date listed yet.";

    const issueSignals = detectIssueSignals(matterType, whatHappened, harm, people, records);
    const likelyPath = determineLikelyPath(province, matterType, whatHappened, harm);
    const evidenceSuggestions = suggestEvidence(whatHappened, records, matterType);

    const summary = `This matter appears to involve ${normalizePhrase(matterType)} issues in ${province}. The current goal is to ${goal.toLowerCase()}. Based on the information entered, the problem began around ${whenStarted}, and the most recent important event identified was ${recentEvent.toLowerCase()}. The situation described is: ${whatHappened} The main harm, loss, or consequence described is: ${harm}`;

    const pathways = buildPathways(issueSignals, likelyPath);

    const keyInformation = [
      `People, businesses, institutions, or witnesses currently identified: ${people}`,
      `Documents or records already identified: ${records}`,
      `Timing issue or deadline currently noted: ${deadline}`,
      `A clearer dated chronology tied to real documents will usually strengthen later form completion and court preparation.`,
      ...evidenceSuggestions
    ];

    const nextSteps = buildNextSteps(likelyPath, deadline, records, matterType);

    return {
      province,
      matterType,
      goal,
      summary,
      pathways,
      keyInformation,
      nextSteps,
      likelyPath,
      whatHappened,
      whenStarted,
      recentEvent,
      harm,
      people,
      records,
      deadline
    };
  }

  function detectIssueSignals(matterType, whatHappened, harm, people, records) {
    const text = `${matterType} ${whatHappened} ${harm} ${people} ${records}`.toLowerCase();
    return {
      contract: includesAny(text, ["contract", "agreement", "invoice", "payment", "service", "refund", "quote"]),
      negligence: includesAny(text, ["injury", "damage", "unsafe", "careless", "negligence", "loss", "property damage"]),
      publicLaw: includesAny(text, ["government", "police", "crown", "charter", "rights", "state", "public authority"]),
      evidence: includesAny(text, ["email", "text", "photo", "video", "report", "receipt", "record", "contract"]),
      urgent: includesAny(text, ["deadline", "hearing", "court date", "limitation", "urgent", "tomorrow", "next week"]),
      smallClaims: includesAny(text, ["invoice", "refund", "money", "unpaid", "debt", "repair", "service dispute"])
    };
  }

  function determineLikelyPath(province, matterType, whatHappened, harm) {
    const text = `${matterType} ${whatHappened} ${harm}`.toLowerCase();

    if (province === "Ontario") {
      if (includesAny(text, ["small claims", "invoice", "refund", "unpaid", "money dispute", "debt", "service dispute"])) {
        return {
          label: "Ontario Small Claims Court",
          page: "ontario-small-claims.html",
          reason: "The facts sound more like a money, property, invoice, refund, or service dispute that may fit a Small Claims path."
        };
      }

      if (includesAny(text, ["charter", "government", "police", "public authority", "institution", "civil claim", "negligence"])) {
        return {
          label: "Ontario Civil Court",
          page: "ontario-civil.html",
          reason: "The facts sound more like a Superior Court civil matter or a more complex claim that needs the civil court path."
        };
      }
    }

    return {
      label: "Review the court path carefully",
      page: "legal-principles.html",
      reason: "The matter may need more issue sorting before the correct court path is obvious."
    };
  }

  function buildPathways(issueSignals, likelyPath) {
    const items = [];

    if (issueSignals.contract) {
      items.push("Contract or service-dispute principles, including what was promised, what was delivered, and what records support the difference.");
    }

    if (issueSignals.negligence) {
      items.push("Negligence principles, including whether a duty may have existed, whether conduct may have fallen below a reasonable standard, and whether the loss can be linked to that conduct.");
    }

    if (issueSignals.publicLaw) {
      items.push("Public law or Charter-related analysis, including whether state action, official process, or government conduct may be legally relevant.");
    }

    if (issueSignals.evidence) {
      items.push("Evidence and proof issues, including how messages, records, photographs, reports, and timelines may support or weaken the matter.");
    }

    if (!items.length) {
      items.push("General civil analysis focused on the facts, the parties involved, the records available, and the remedy being sought.");
    }

    items.push(`Court-path analysis focused on ${likelyPath.label}, because the site should guide the user into the most likely process page instead of leaving them with a summary only.`);

    return items;
  }

  function suggestEvidence(whatHappened, records, matterType) {
    const text = `${whatHappened} ${records} ${matterType}`.toLowerCase();
    const suggestions = [];

    if (!includesAny(text, ["email", "text", "message"])) {
      suggestions.push("Check whether messages, emails, or written communications should be added to the file.");
    }
    if (!includesAny(text, ["photo", "video"])) {
      suggestions.push("Consider whether photographs or video should be collected if they help prove damage, condition, or events.");
    }
    if (!includesAny(text, ["receipt", "invoice", "contract", "agreement"])) {
      suggestions.push("Look for receipts, invoices, contracts, quotes, or payment records if money or service issues are involved.");
    }

    return suggestions;
  }

  function buildNextSteps(likelyPath, deadline, records, matterType) {
    const steps = [
      `Review the ${likelyPath.label} page next so the user sees the proper process, common forms, and basic court path.`,
      "Turn the story into a dated chronology using documents, messages, receipts, letters, or reports wherever possible.",
      "Separate facts, legal issues, and evidence so later forms and summaries are cleaner and easier to use.",
      "Review official court forms, filing requirements, service rules, and deadlines before submitting anything."
    ];

    if (deadline && deadline !== "No deadline or court date listed yet.") {
      steps.unshift(`Address the timing issue first: ${deadline}`);
    }

    if (!records || records === "No records listed yet.") {
      steps.push("Build an evidence list now, because missing records often weaken the file before the user even reaches court.");
    }

    if (String(matterType).toLowerCase().includes("charter") || String(matterType).toLowerCase().includes("public law")) {
      steps.push("If the matter involves government action or official process, keep state decisions, notices, policies, transcripts, and correspondence grouped carefully.");
    }

    return steps;
  }

  function renderStructuredOutput(result, outputs, outputCard) {
    if (outputs.summaryText) outputs.summaryText.textContent = result.summary;

    if (outputs.pathwaysList) {
      outputs.pathwaysList.innerHTML = result.pathways
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }

    if (outputs.keyInfoList) {
      outputs.keyInfoList.innerHTML = result.keyInformation
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }

    if (outputs.nextStepsList) {
      outputs.nextStepsList.innerHTML = result.nextSteps
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }

    outputCard?.classList.add("show");
  }

  function saveStartCase(fields, result = null) {
    const payload = {
      province: value(fields.province),
      matterType: value(fields.matterType),
      goal: value(fields.goal),
      whatHappened: value(fields.whatHappened),
      whenStarted: value(fields.whenStarted),
      recentEvent: value(fields.recentEvent),
      harm: value(fields.harm),
      people: value(fields.people),
      records: value(fields.records),
      deadline: value(fields.deadline),
      result,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.intake, JSON.stringify(payload));
  }

  function restoreStartCase(fields, outputCard, outputs) {
    const raw = localStorage.getItem(STORAGE_KEYS.intake);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      setField(fields.province, payload.province);
      setField(fields.matterType, payload.matterType);
      setField(fields.goal, payload.goal);
      setField(fields.whatHappened, payload.whatHappened);
      setField(fields.whenStarted, payload.whenStarted);
      setField(fields.recentEvent, payload.recentEvent);
      setField(fields.harm, payload.harm);
      setField(fields.people, payload.people);
      setField(fields.records, payload.records);
      setField(fields.deadline, payload.deadline);

      if (payload.result) {
        renderStructuredOutput(payload.result, outputs, outputCard);
      }
    } catch (error) {
      console.error("Could not restore CourtSimplified intake:", error);
    }
  }

  function clearStartCase(outputs) {
    if (outputs.summaryText) outputs.summaryText.textContent = "";
    if (outputs.pathwaysList) outputs.pathwaysList.innerHTML = "";
    if (outputs.keyInfoList) outputs.keyInfoList.innerHTML = "";
    if (outputs.nextStepsList) outputs.nextStepsList.innerHTML = "";
  }

  function saveDocumentsData(result) {
    const documentsPayload = {
      generatedAt: new Date().toISOString(),
      summary: result.summary,
      chronology: [
        result.whenStarted !== "an unspecified date" ? `Start: ${result.whenStarted}` : "Start date still needs to be clarified.",
        result.recentEvent !== "no recent event listed" ? `Recent event: ${result.recentEvent}` : "Most recent important event still needs to be clarified."
      ],
      parties: result.people,
      records: result.records,
      deadline: result.deadline,
      nextSteps: result.nextSteps,
      likelyPath: result.likelyPath
    };

    localStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(documentsPayload));
  }

  function setupDocumentsPage() {
    const hero = document.querySelector("main");
    if (!hero) return;
    if (!window.location.pathname.toLowerCase().includes("documents") && !document.title.toLowerCase().includes("documents")) return;

    const raw = localStorage.getItem(STORAGE_KEYS.documents);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      injectDocumentsPreview(payload);
    } catch (error) {
      console.error("Could not restore CourtSimplified documents preview:", error);
    }
  }

  function injectDocumentsPreview(payload) {
    const targetSection = document.getElementById("workspace");
    if (!targetSection) return;

    const preview = document.createElement("section");
    preview.className = "container";
    preview.style.marginBottom = "24px";
    preview.innerHTML = `
      <div class="workspace-card">
        <div class="section-head" style="margin-bottom:18px;">
          <span class="label">Saved case preview</span>
          <h2>Your most recent generated case material.</h2>
          <p>This is pulled from the Start Your Case page so users can continue building their file instead of starting over.</p>
        </div>
        <div class="doc-stack">
          <article class="doc-card">
            <header>
              <span class="doc-type">Summary</span>
              <span class="status">Saved</span>
            </header>
            <p>${escapeHtml(payload.summary || "No summary saved yet.")}</p>
          </article>
          <article class="doc-card">
            <header>
              <span class="doc-type">Parties</span>
              <span class="status">Saved</span>
            </header>
            <p>${escapeHtml(payload.parties || "No parties listed yet.")}</p>
          </article>
          <article class="doc-card">
            <header>
              <span class="doc-type">Records</span>
              <span class="status">Saved</span>
            </header>
            <p>${escapeHtml(payload.records || "No records listed yet.")}</p>
          </article>
          <article class="doc-card">
            <header>
              <span class="doc-type">Next path</span>
              <span class="status">Suggested</span>
            </header>
            <p>${escapeHtml(payload.likelyPath?.label || "Review the site guidance pages.")}</p>
          </article>
        </div>
      </div>
    `;

    targetSection.parentNode.insertBefore(preview, targetSection);
  }

  function setField(field, fieldValue) {
    if (field && typeof fieldValue !== "undefined") {
      field.value = fieldValue || "";
    }
  }

  function value(field) {
    return field?.value?.trim() || "";
  }

  function includesAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
  }

  function normalizePhrase(text) {
    return String(text).toLowerCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
