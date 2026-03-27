import LegalDocumentShell from "../../components/LegalDocumentShell";

export const metadata = {
  title: "Privacy Policy — Synthr",
  description: "How Synthr collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell title="Privacy Policy" updated="Last updated: [PLACEHOLDER: DATE]. Draft for review — not legal advice.">
      <p>
        This Privacy Policy explains how Synthr (&ldquo;we&rdquo;, &ldquo;us&rdquo;) processes personal data when you use
        our SaaS platform (CRM, listings, publishing, optional AI, and billing).{" "}
        <span className="legal-placeholder">[PLACEHOLDER: DATA CONTROLLER IDENTITY AND CONTACT DETAILS]</span>
      </p>

      <h2>1. Scope</h2>
      <p>
        This policy applies to visitors of our marketing site, users of the Synthr web application, and data processed on
        behalf of your agency (including contacts and leads you store in the CRM).
      </p>

      <h2>2. Data we process</h2>
      <p>Depending on how you use Synthr, we may process:</p>
      <ul>
        <li>
          <strong>Account and profile data:</strong> name, email, phone, role, agency name, authentication data (e.g.
          session tokens managed securely).
        </li>
        <li>
          <strong>CRM and listing data:</strong> information your agency enters (contacts, leads, tasks, property and
          listing details, notes, communications metadata).
        </li>
        <li>
          <strong>Integration data:</strong> when you connect <strong>Gmail</strong>, we process email content and
          metadata needed for the features you enable, in line with Google permissions you grant.
        </li>
        <li>
          <strong>Billing data:</strong> subscription status, plan, and payment-related identifiers processed by{" "}
          <strong>Stripe</strong> (we typically do not store full card numbers on our servers).
        </li>
        <li>
          <strong>AI processing:</strong> prompts and content you submit to optional AI features may be sent to{" "}
          <strong>OpenAI</strong> (or another provider we disclose) to generate responses.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, device/browser type, logs, and cookies or similar technologies as
          described in our Cookie Policy.
        </li>
      </ul>

      <h2>3. Purposes and legal bases (GDPR)</h2>
      <p>Where the GDPR applies, we rely on appropriate bases, such as:</p>
      <ul>
        <li>
          <strong>Contract</strong> — providing the service you signed up for.
        </li>
        <li>
          <strong>Legitimate interests</strong> — securing the platform, improving features, analytics (non-essential
          analytics only with your consent — see cookies).
        </li>
        <li>
          <strong>Consent</strong> — where required (e.g., non-essential cookies, certain marketing, optional AI where
          consent is the appropriate basis).
        </li>
        <li>
          <strong>Legal obligation</strong> — where we must retain or disclose information by law.
        </li>
      </ul>

      <h2>4. Sharing with processors</h2>
      <p>We use trusted subprocessors to run Synthr, including (as applicable):</p>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing.
        </li>
        <li>
          <strong>Google (Gmail API)</strong> — when you connect email.
        </li>
        <li>
          <strong>OpenAI</strong> — optional AI features.
        </li>
        <li>
          <strong>Hosting / infrastructure</strong> —{" "}
          <span className="legal-placeholder">[PLACEHOLDER: HOSTING PROVIDER NAMES AND REGIONS]</span>
        </li>
      </ul>
      <p>
        We enter into data processing agreements where required. A current list of subprocessors can be provided on
        request <span className="legal-placeholder">[PLACEHOLDER: OR LINK TO SUBPROCESSOR PAGE]</span>.
      </p>

      <h2>5. International transfers</h2>
      <p>
        If data is transferred outside the European Economic Area, we use appropriate safeguards (e.g. Standard
        Contractual Clauses) where required.{" "}
        <span className="legal-placeholder">[PLACEHOLDER: DETAIL TRANSFERS FOR YOUR STACK]</span>
      </p>

      <h2>6. Retention</h2>
      <p>
        We keep data only as long as needed for the purposes above, including legal, accounting, and security
        requirements. Backup retention may apply for a limited period.{" "}
        <span className="legal-placeholder">[PLACEHOLDER: SPECIFIC RETENTION PERIODS]</span>
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, rectify, delete, restrict, or object to processing,
        data portability, and to withdraw consent. You may lodge a complaint with a supervisory authority. Contact us at{" "}
        <a href="mailto:privacy@synthrstate.com">privacy@synthrstate.com</a>{" "}
        <span className="legal-placeholder">[PLACEHOLDER: PRIVACY CONTACT]</span> to exercise your rights.
      </p>

      <h2>8. Security</h2>
      <p>
        We implement technical and organizational measures appropriate to the risk (encryption in transit, access
        controls, monitoring). No system is 100% secure; please use strong passwords and protect your devices.
      </p>

      <h2>9. Children</h2>
      <p>Synthr is not directed at children. We do not knowingly collect personal data from children.</p>

      <h2>10. Changes</h2>
      <p>
        We may update this policy and will post the new version here with an updated date. Material changes may require
        additional notice where required by law.
      </p>
    </LegalDocumentShell>
  );
}
