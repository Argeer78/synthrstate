import LegalDocumentShell from "../../components/LegalDocumentShell";

export const metadata = {
  title: "Cookie Policy — Synthr",
  description: "How Synthr uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalDocumentShell
      title="Cookie Policy"
      updated="Last updated: March 30, 2026. Subject to legal review."
    >
      <p>
        This Cookie Policy describes how Synthr uses cookies and similar technologies on our marketing website and, where
        applicable, in our web application. For personal data processing, see our{" "}
        <a href="/privacy/">Privacy Policy</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. We also use similar technologies (e.g. local storage) where
        described below.
      </p>

      <h2>2. Essential (strictly necessary)</h2>
      <p>These are required for the site or app to function (e.g. security, load balancing, session after login).</p>
      <ul>
        <li>
          <strong>Locale / preferences (marketing site):</strong> we may store language or theme preferences.{" "}
          We store your cookie/analytics consent choice using <code>localStorage</code> under the key{" "}
          <code>synthr_cookie_consent</code>.
        </li>
        <li>
          <strong>Authentication (admin app):</strong> session cookies set by our API for logged-in users (typically
          <code>httpOnly</code>). We use a session cookie named <code>synthr_token</code>.
        </li>
      </ul>
      <p>We do not ask for consent for strictly necessary cookies under the ePrivacy approach used in many EU implementations.</p>

      <h2>3. Analytics (optional — requires consent on the marketing site)</h2>
      <p>
        On <strong>synthrstate.com</strong> (marketing), we may use <strong>Google Analytics 4 (GA4)</strong> to
        understand aggregate traffic if you click &ldquo;Accept&rdquo; on our cookie banner. Until you accept, we do{" "}
        <strong>not</strong> load GA4 scripts.
      </p>
      <ul>
        <li>
          <strong>Provider:</strong> Google Ireland Limited / Google LLC — see Google’s policy for GA.
        </li>
        <li>
          <strong>Purpose:</strong> page views and events such as navigation patterns to improve the site.
        </li>
        <li>
          <strong>Storage:</strong> we store your choice (accept/reject) in <code>localStorage</code> under{" "}
          <code>synthr_cookie_consent</code> on the marketing site.
        </li>
      </ul>

      <h2>4. Admin application (app.synthrstate.com)</h2>
      <p>
        The admin app may show a similar consent banner for optional analytics. Essential cookies for login and security
        apply without consent. We use the same consent storage key (<code>synthr_cookie_consent</code>) for optional
        analytics, and only load Google Analytics after consent is accepted.
      </p>

      <h2>5. Managing cookies</h2>
      <p>
        You can change browser settings to block or delete cookies. Blocking essential cookies may break login or
        features. You can withdraw analytics consent by clearing site data for our domain and revisiting the site — the
        banner will appear again if no choice is stored.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions: <a href="mailto:privacy@synthrstate.com">privacy@synthrstate.com</a>
      </p>
    </LegalDocumentShell>
  );
}
