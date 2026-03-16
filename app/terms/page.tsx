import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-8 inline-block">
          ← PredLab
        </Link>

        <h1 className="font-display text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: March 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-[var(--text-secondary)]">

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">1. Acceptance of terms</h2>
            <p>By accessing or using PredLab (<strong>predlab.app</strong>), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">2. Description of service</h2>
            <p>PredLab is a personal forecasting tool that allows users to record, track, and score their predictions about future events. The platform is for educational and analytical purposes only. PredLab is not a gambling, betting, or financial services platform.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">3. User accounts</h2>
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate and complete information when creating your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
              <li>Use the platform for any unlawful purpose.</li>
              <li>Attempt to gain unauthorised access to any part of the service.</li>
              <li>Post content that is harmful, abusive, or violates any applicable law.</li>
              <li>Use automated scripts to interact with the platform without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">5. Predictions and content</h2>
            <p>Predictions recorded on PredLab are for personal tracking and entertainment purposes only. Nothing on PredLab constitutes financial, investment, legal, or professional advice. Public predictions and profiles are visible to other users when you opt in to sharing.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">6. Intellectual property</h2>
            <p>PredLab and its original content, features, and functionality are owned by PredLab and are protected by applicable intellectual property laws. You retain ownership of the predictions and content you create.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">7. Third-party data</h2>
            <p>PredLab displays market probability data sourced from Polymarket's public API. This data is provided for informational purposes only. PredLab is not affiliated with Polymarket.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">8. Disclaimers</h2>
            <p>PredLab is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or availability of the service at any time.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">9. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, PredLab shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">10. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting <a href="mailto:contact@predlab.app" className="text-[var(--accent)]">contact@predlab.app</a>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">11. Changes to terms</h2>
            <p>We may revise these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">12. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:contact@predlab.app" className="text-[var(--accent)]">contact@predlab.app</a>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
