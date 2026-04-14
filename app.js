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
});
