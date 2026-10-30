#!/usr/bin/env node
/**
 * Post one sample enquiry through the endpoint, for the client to review.
 *
 *     node scripts/send-sample-enquiry.mjs --url http://127.0.0.1:8787
 *
 * This is the only script here that can put a message in front of a real
 * person, and it can only do so when the server itself is in `sample` mode with
 * `mail_sample_approved` set. Everything it sends is obviously an example: the
 * fields are labelled as samples rather than imitating a customer, and the
 * endpoint adds its own "SAMPLE FOR REVIEW" banner on top.
 *
 * It never switches the server to production. Approving the sample is an
 * operator edit to the configuration; see PRODUCTION_HANDOVER.md.
 */
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const base = (flag("url", process.env.AERO_ENDPOINT || "http://127.0.0.1:8787")).replace(/\/+$/, "");

/**
 * Deliberately not a plausible enquiry: nobody reading this could mistake it
 * for a real customer, and every value says what it is.
 */
const sample = {
  form: "contact",
  name: "Sample Reviewer (not a customer)",
  company: "Sample Enquiry — Aerocotton website test",
  email: "sample@example.com",
  phone: "+00 00000 00000",
  country: "Sample Country",
  interest: "General enquiry",
  message:
    "This is the sample enquiry sent for approval, not a real customer request. "
    + "It shows the subject line, the sending address, the Reply-To header and the "
    + "layout that a live enquiry will use, and where each field appears in the "
    + "notification. Please check that it reads the way you want, then confirm so "
    + "that live delivery to the company inbox can be switched on.",
  website: "",
  elapsed: "60000",
};

async function main() {
  const body = new FormData();
  for (const [key, value] of Object.entries(sample)) {
    if (key === "form") continue;
    body.append(key, value);
  }

  const url = `${base}/api/submit.php?form=${sample.form}`;
  console.log(`posting the sample enquiry to ${url}\n`);

  let response;
  try {
    response = await fetch(url, { method: "POST", body });
  } catch (error) {
    console.error(`Could not reach the endpoint: ${error.message}`);
    console.error("Start it first with: npm run mail:start");
    process.exitCode = 1;
    return;
  }

  const raw = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error(`The endpoint answered ${response.status} with something that is not JSON:`);
    console.error(raw.slice(0, 400));
    console.error("\nOn a host that runs PHP this means the request never reached it:");
    console.error("check that the URL and path are right.");
    process.exitCode = 1;
    return;
  }

  console.log(`HTTP ${response.status}`);
  console.log(JSON.stringify(payload, null, 2));

  if (payload.mailMode === "sample" && payload.ok === true) {
    console.log("\nSent for review. Open the reviewer's inbox to check it.");
    console.log("Nothing is delivered live until an operator switches the mode —");
    console.log("see PRODUCTION_HANDOVER.md, 'Approving the sample'.");
  } else if (payload.mailMode === "local") {
    console.log("\nCaptured locally — this was not sent to the reviewer.");
    console.log("Open http://127.0.0.1:8025 to read it.");
  } else if (payload.ok !== true) {
    console.log("\nThe endpoint refused. Reason above; the server-side log has the detail.");
    process.exitCode = 1;
  }
}

await main();
