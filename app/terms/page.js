import LegalDocumentShell from "../../components/LegalDocumentShell";

export const metadata = {
  title: "Terms of Service — Synthr",
  description: "Terms of Service for the Synthr SaaS platform.",
};

export default function TermsPage() {
  return (
    <LegalDocumentShell
      title="Terms of Service"
      updated="Last updated: March 30, 2026. These terms are a starting point for your legal review — not legal advice."
    >
      <p>
        Welcome to Synthr. By accessing or using our services, you agree to these Terms of Service. If you do not agree,
        do not use the service.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Synthr is a software-as-a-service (SaaS) platform that provides CRM, property listings, publishing, optional AI
        features, and related tools for real estate agencies, operated by AlphaSynth AI (“AlphaSynth AI”, “we”, “us”).
        Learn more at <a href="https://alphasynthai.com" target="_blank" rel="noopener noreferrer">alphasynthai.com</a>.
      </p>

      <h2>2. The service</h2>
      <p>
        We grant your organization a limited, non-exclusive, non-transferable right to use Synthr in accordance with your
        subscription plan, our documentation, and these terms. We may modify, suspend, or discontinue parts of the
        service with reasonable notice where practicable.
      </p>

      <h2>3. Accounts and security</h2>
      <p>
        You are responsible for maintaining the confidentiality of login credentials, for all activity under your
        account, and for ensuring your team complies with these terms. Notify us promptly at{" "}
        <a href="mailto:support@synthrstate.com">support@synthrstate.com</a> if you suspect unauthorized access.
      </p>

      <h2>4. Your data and CRM content</h2>
      <p>
        You retain ownership of data you submit (contacts, listings, messages, files, etc.). You instruct us to host and
        process that data to provide the service. You represent that you have the rights needed to submit such data and
        that your use complies with applicable law (including marketing and anti-spam rules).
      </p>

      <h2>5. Gmail integration</h2>
      <p>
        If you connect Google Gmail, you authorize Synthr to access and sync email only as needed for the features you
        enable (for example, linking messages to CRM records). Use is subject to Google’s terms and your workspace
        policies. You may disconnect the integration at any time; we will stop new sync accordingly, subject to
        reasonable retention for backups described in our Privacy Policy.
      </p>

      <h2>6. Billing (Stripe)</h2>
      <p>
        Paid plans are billed via our payment processor, <strong>Stripe</strong>. By subscribing, you agree to Stripe’s
        terms and authorize us (via Stripe) to charge your payment method for fees, taxes, and renewals on the schedule
        shown at checkout or in the billing portal. Paid plans are billed monthly in advance. You can manage or cancel
        subscriptions through the in-app billing area where available.
      </p>

      <p>
        <strong>Free trial.</strong> New agencies start with a 30-day free trial at the agency level. During the trial,
        you have full access to Synthr. After the trial ends, access to productive features is restricted until you activate
        an active subscription. The trial automatically ends after 30 days.
      </p>

      <p>
        <strong>Cancellation and refunds.</strong> You may cancel your subscription at any time through the billing portal.
        Cancellation typically takes effect at the end of your current billing period. Fees are generally non-refundable for
        unused portions of a billing period, except where required by applicable law.
      </p>

      <h2>7. AI features (OpenAI)</h2>
      <p>
        Optional AI features may send prompts or content to <strong>OpenAI</strong> (or similar providers we disclose) to
        generate text or summaries. You are responsible for reviewing outputs before use. Do not submit special-category
        or highly sensitive personal data to AI features unless you have a lawful basis and our product explicitly
        supports it.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to misuse the service, including by:</p>
      <ul>
        <li>Violating laws or third-party rights</li>
        <li>Uploading malware or attempting unauthorized access</li>
        <li>Scraping or overloading the service without permission</li>
        <li>Using the service to send unsolicited bulk communications without consent</li>
      </ul>

      <h2>9. Disclaimers</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; to the maximum extent permitted by law. We disclaim implied
        warranties where allowed. We do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the extent permitted by law, our total liability arising out of these terms or the service is limited to the
        fees you paid us in the twelve (12) months before the claim.
        Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest
        extent permitted.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using Synthr at any time. We may suspend or terminate access for material breach, non-payment where
        applicable, or legal or security reasons. Provisions that by nature should survive (e.g., liability limits,
        governing law) will survive termination.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable to AlphaSynth AI, excluding conflict-of-law rules. Courts in the
        applicable jurisdiction may have jurisdiction over disputes.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:legal@synthrstate.com">legal@synthrstate.com</a>
      </p>
    </LegalDocumentShell>
  );
}
