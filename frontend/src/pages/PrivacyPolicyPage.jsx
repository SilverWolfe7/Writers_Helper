import { Link } from "react-router-dom";
import { Feather, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-rule">
        <div className="max-w-3xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="privacy-brand-link">
            <span className="inline-flex items-center justify-center w-8 h-8 border border-ink">
              <Feather className="w-4 h-4 text-ink" />
            </span>
            <span className="font-serif text-xl tracking-tight">Writer&apos;s Helper</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-ink transition-colors"
            data-testid="privacy-back-link"
          >
            <ArrowLeft className="w-4 h-4" /> Back to app
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 md:px-10 py-16" data-testid="privacy-policy">
        <div className="overline mb-3">Legal · Privacy Policy</div>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-muted2 text-sm mb-12">Last Updated: April 27, 2026</p>

        <Section>
          <p>
            SilverWolfe Application Development (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the
            Writer&rsquo;s Helper application (the &quot;Service&quot;). This page informs you of our policies
            regarding the collection, use, and disclosure of personal data when you use our Service.
          </p>
        </Section>

        <Section title="1. Data Collection and Use">
          <p>
            We believe in user privacy. Because Writer&rsquo;s Helper is a stand-alone application, we do not
            collect, store, or transmit any personally identifiable information (PII) to external servers.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>
              <strong>Personal Data:</strong> We do not collect any personal data such as names, email
              addresses, or phone numbers.
            </li>
            <li>
              <strong>Usage Data:</strong> Any data created or stored within the app is saved locally on your
              device and is not accessible by us.
            </li>
          </ul>
        </Section>

        <Section title="2. Permissions">
          <p>
            The app may request certain permissions to function correctly (e.g., Microphone). These permissions
            are used strictly for the app&rsquo;s core functionality:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>
              <strong>Microphone:</strong> Used to enable voice dictation into text. This data is stored on an
              authenticated MongoDB database and the data can be downloaded and shared by the user, but the
              data is NOT publicly available data.
            </li>
          </ul>
        </Section>

        <Section title="3. Third-Party Services">
          <p>
            We do not use third-party analytics, advertising networks, or tracking software that monitors your
            activity across other apps or websites.
          </p>
        </Section>

        <Section title="4. Security">
          <p>
            The security of your data is important to us, but remember that no method of electronic storage is
            100% secure. While we rely on the built-in security features of iOS to protect your local data, we
            encourage you to use device-level security (Passcode, FaceID, or TouchID) to protect your
            information.
          </p>
        </Section>

        <Section title="5. Children's Privacy">
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally
            identifiable information from children under 13.
          </p>
        </Section>

        <Section title="6. Changes to This Privacy Policy">
          <p>
            We may update our Privacy Policy from time to time. You are advised to review this page
            periodically for any changes. Changes to this Privacy Policy are effective when they are posted on
            this page.
          </p>
        </Section>

        <Section title="7. Contact Us">
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <p className="mt-3">
            By email:{" "}
            <a className="ink-link" href="mailto:lnaeyae@mac.com" data-testid="privacy-contact-email">
              lnaeyae@mac.com
            </a>
          </p>
        </Section>

        <div className="hair-rule mt-16 pt-8 text-sm text-muted2">
          <Link to="/" className="ink-link">
            &larr; Return to Writer&apos;s Helper
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-10 leading-relaxed text-ink">
      {title && <h2 className="font-serif text-2xl tracking-tight mb-4">{title}</h2>}
      <div className="space-y-3 text-base">{children}</div>
    </section>
  );
}
