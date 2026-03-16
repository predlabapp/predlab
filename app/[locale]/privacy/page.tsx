import { Link } from "@/navigation"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-8 inline-block">
          ← PredLab
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: March 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--text-secondary)]">

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">1. Who we are</h2>
            <p>PredLab (<strong>predlab.app</strong>) is a personal forecasting platform where users record, track and improve their predictions. Contact: <a href="mailto:contact@predlab.app" className="text-[var(--accent)]">contact@predlab.app</a></p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">2. Information we collect</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li><strong>Account data:</strong> name, email address, and profile picture (when signing in via Google).</li>
              <li><strong>Prediction data:</strong> predictions, probabilities, categories, and resolutions you enter.</li>
              <li><strong>Usage data:</strong> pages visited, actions taken, and browser/device type for analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">3. How we use your information</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>To provide and operate the PredLab service.</li>
              <li>To calculate your accuracy score and leaderboard position.</li>
              <li>To send optional email notifications (only if you opt in).</li>
              <li>To improve the platform through aggregated, anonymised analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">4. Data sharing</h2>
            <p>We do not sell your personal data. We share data only with trusted service providers necessary to operate PredLab (database hosting, authentication, email). These providers are contractually bound to protect your data.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">5. Social media integrations</h2>
            <p>PredLab may publish automated posts to its own social media accounts (Instagram, X/Twitter) using the Polymarket public API for market data. We do not access or store your personal social media data unless you explicitly connect your account.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">6. Cookies</h2>
            <p>We use session cookies for authentication and local storage for UI preferences. No third-party advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">7. Data retention</h2>
            <p>Your data is retained as long as your account is active. You may request deletion at any time by emailing <a href="mailto:contact@predlab.app" className="text-[var(--accent)]">contact@predlab.app</a>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">8. Your rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:contact@predlab.app" className="text-[var(--accent)]">contact@predlab.app</a>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">9. Changes to this policy</h2>
            <p>We may update this policy periodically. We will notify users of significant changes via email or an in-app notice.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
