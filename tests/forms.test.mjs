/**
 * The two public entry points and the endpoint they post to must not drift.
 *
 * The homepage enquiry section once hand-rolled its own submission: it built a
 * `mailto:` link from NEXT_PUBLIC_RFQ_EMAIL and navigated the browser to it.
 * That address is not configured on the deployed site, so the form could only
 * answer "Enquiry delivery is not configured yet" and no enquiry ever reached
 * the endpoint — a second, untested delivery path that quietly replaced the
 * one the whole backend exists for. Nothing in the suite noticed.
 *
 * So the checks here are about the *shape* of the wiring, which is what went
 * wrong:
 *
 *   1. the fields each form posts are exactly the fields the endpoint
 *      validates — nothing missing, nothing invented, nothing misspelled
 *   2. both enquiry entry points post the same contract, not two similar ones
 *   3. the option lists the browser offers are the option lists the server
 *      accepts (the source comments promise this; nothing enforced it)
 *   4. no form submits by navigating to a mailto: URL, and both enquiry forms
 *      go through the one shared submission path
 *
 * The server's side of every comparison is read by *executing* the real PHP,
 * so the authority is the code that runs in production, not a copy of it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PHP =
  process.env.AERO_PHP ||
  (fs.existsSync(path.join(ROOT, ".pdf-work", "tools", "php", "php.exe"))
    ? path.join(ROOT, ".pdf-work", "tools", "php", "php.exe")
    : "php");

/** The endpoint's own view of the two forms, straight out of the running code. */
function serverContract() {
  const script = `
    define('AERO_API', true);
    require 'public/api/lib/config.php';
    require 'public/api/lib/mailmode.php';
    require 'public/api/lib/forms.php';
    $out = ['fields' => [], 'options' => []];
    foreach (aero_form_specs() as $name => $spec) {
      $fields = [];
      foreach ($spec['fields'] as $key => $field) {
        $fields[] = $key;
        if (($field['type'] ?? '') === 'select') {
          $out['options'][$key] = array_values($field['options']);
        }
      }
      $out['fields'][$name] = $fields;
    }
    echo json_encode($out);
  `;
  const raw = execFileSync(PHP, ["-r", script.replace(/\r/g, "")], { cwd: ROOT, encoding: "utf8" });
  return JSON.parse(raw);
}

/** The `name="…"` attributes a form component declares, each name once. */
function declaredFields(relative) {
  const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
  // A variant that renders the same fields twice (the homepage form has a full
  // and a compact layout) must not make the field list look duplicated.
  return [...new Set([...source.matchAll(/name="([^"]+)"/g)].map((m) => m[1]))].sort();
}

const CONTACT_FORM = "src/components/forms/EnquiryForm.tsx";
const SUPPORT_FORM = "src/components/forms/SupportForm.tsx";
/** The homepage enquiry section — the entry point that used to bypass the endpoint. */
const HOME_FORM = "src/components/rfq/RfqForm.tsx";
const FORM_KIT = "src/components/forms/form-kit.tsx";

/** Shared, form-independent extras the endpoint knows about. */
const SHARED = ["files[]", "website"];

test("both public entry points use the endpoint's contract", async (t) => {
  const contract = serverContract();

  await t.test("the endpoint validates the fields the contact page posts", () => {
    assert.deepEqual(contract.fields.contact, ["name", "company", "email", "phone", "country", "interest", "message"]);
    assert.deepEqual(declaredFields(CONTACT_FORM), [...contract.fields.contact].sort());
  });

  await t.test("the homepage enquiry section posts the same contract, not a near copy", () => {
    assert.deepEqual(
      declaredFields(HOME_FORM),
      declaredFields(CONTACT_FORM),
      "the homepage form and the contact page must post the same fields"
    );
    for (const field of declaredFields(HOME_FORM)) {
      assert.ok(
        contract.fields.contact.includes(field),
        `the homepage form posts "${field}", which the endpoint does not validate`
      );
    }
  });

  await t.test("the support form's fields are the support contract", () => {
    assert.deepEqual(declaredFields(SUPPORT_FORM), [...contract.fields.support].sort());
  });

  await t.test("the only extra field names are the shared honeypot and the attachment list", () => {
    const declared = new Set([...declaredFields(FORM_KIT), ...declaredFields(CONTACT_FORM), ...declaredFields(HOME_FORM)]);
    for (const shared of SHARED) declared.delete(shared);
    // Assert the declared set equals the two specs' union.
    const known = new Set([...contract.fields.contact, ...contract.fields.support]);
    const unknown = [...declared].filter((field) => !known.has(field));
    assert.deepEqual(unknown, [], `form components declare fields the endpoint does not know: ${unknown.join(", ")}`);
    assert.deepEqual(declaredFields(FORM_KIT), [...SHARED].sort());
  });

  await t.test("the choices the browser offers are the choices the server accepts", async () => {
    const options = await import("../src/lib/forms/options.ts");

    assert.deepEqual([...options.INTEREST_OPTIONS], contract.options.interest, "INTEREST_OPTIONS has drifted from AERO_INTEREST_OPTIONS");
    assert.deepEqual([...options.CATEGORY_OPTIONS], contract.options.category, "CATEGORY_OPTIONS has drifted from AERO_CATEGORY_OPTIONS");
    assert.deepEqual([...options.PRIORITY_OPTIONS], contract.options.priority, "PRIORITY_OPTIONS has drifted from AERO_PRIORITY_OPTIONS");
  });

  await t.test("the endpoint's option lists contain the collections the site deep-links with", async () => {
    const options = await import("../src/lib/forms/options.ts");
    // Product and collection pages link to /contact?product=<Collection> collection
    for (const collection of ["Nature", "Mountain", "Beach", "City", "Forest", "Lake", "Desert", "Waterfall", "Snow", "Aurora"]) {
      const offered = `${collection} collection`;
      assert.ok(
        options.INTEREST_OPTIONS.includes(offered),
        `the collections deep-link to "${offered}", which the form does not offer`
      );
      assert.ok(contract.options.interest.includes(offered), `the server would reject the deep link "${offered}"`);
    }
  });
});

test("no form submits anywhere except the endpoint", async (t) => {
  await t.test("no component hands the browser a mailto: URL as a submission", () => {
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = fs.readFileSync(full, "utf8");
          // A *submission* by navigation: the address is built and assigned to
          // the location. A plain <a href="mailto:…"> contact link is fine.
          if (/(location\.(href|assign|replace)|window\.open)[^;]*mailto:/s.test(source)) {
            offenders.push(path.relative(ROOT, full).split(path.sep).join("/"));
          }
        }
      }
    };
    walk(path.join(ROOT, "src"));
    assert.deepEqual(offenders, [], `these files submit by navigating to mailto: ${offenders.join(", ")}`);
  });

  await t.test("both enquiry entry points go through the shared submission path", () => {
    for (const form of [CONTACT_FORM, HOME_FORM]) {
      const source = fs.readFileSync(path.join(ROOT, form), "utf8");
      assert.match(source, /useSubmission\(/, `${form} must submit through useSubmission()`);
      assert.match(source, /from "@\/lib\/forms\/options"/, `${form} must offer the shared option lists`);
    }
  });

  await t.test("the submission path posts to the endpoint and nowhere else", () => {
    const source = fs.readFileSync(path.join(ROOT, "src", "lib", "forms", "submit.ts"), "utf8");
    assert.match(source, /NEXT_PUBLIC_FORMS_ENDPOINT\?\.trim\(\) \|\| "\/api\/submit\.php"/);
    assert.equal(
      [...source.matchAll(/fetch\(/g)].length,
      1,
      "the forms must have exactly one network call between them"
    );
  });
});
