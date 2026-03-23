import { Link } from 'react-router-dom';
import { ArrowLeft, Server, AlertTriangle, Ban } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Server className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-mono">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 2026</p>
        </div>

        {/* No Refund Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/40 bg-warning/5">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warning text-sm">No Refund Policy</p>
            <p className="text-sm text-muted-foreground mt-1">
              All payments made on iDevHost are <strong className="text-foreground">final and non-refundable</strong>. By making a payment, you waive any right to a chargeback or refund. Please review your order carefully before completing any purchase.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">1. Acceptance of Terms</h2>
            <p>By creating an account on iDevHost ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. We may update these terms at any time; continued use of the Platform after changes constitutes acceptance.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">2. Description of Service</h2>
            <p>iDevHost provides shared cloud hosting infrastructure for Node.js and Python applications. Each "panel" represents an isolated process environment with allocated compute resources including RAM, CPU, and storage. Resources are shared across the platform and are subject to fair-use limits.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">3. Account Registration</h2>
            <p>You must provide a valid email address to register. You are responsible for maintaining the security of your account credentials. iDevHost is not liable for any loss resulting from unauthorized access to your account caused by your failure to keep credentials secure.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">4. Payments & Subscriptions</h2>
            <p>Hosting plans are billed on a monthly basis. Payment is processed securely through Paystack. By completing a purchase you confirm that you are authorized to use the payment method provided.</p>
            <p>Panel slots expire at the end of the purchased period. Expired panels may be automatically terminated and their data permanently deleted after a 7-day grace period.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground font-mono flex items-center gap-2">
              <Ban className="w-4 h-4 text-destructive" /> 5. No Refund Policy
            </h2>
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-foreground">
              <p><strong>All purchases are final and non-refundable.</strong> This includes but is not limited to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Panels that were purchased but not used</li>
                <li>Panels suspended or terminated due to ToS violations</li>
                <li>Partial months of unused service</li>
                <li>Accidental purchases</li>
                <li>Service interruptions caused by third-party infrastructure outages</li>
              </ul>
              <p className="mt-2 text-sm">If you believe a charge was made in error, contact support. We will review your case but cannot guarantee resolution in your favor.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">6. Acceptable Use</h2>
            <p>You may only use iDevHost for lawful purposes. The following are strictly prohibited and will result in immediate account termination without refund:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Running cryptocurrency miners, DDoS tools, botnets, or proxies</li>
              <li>Hosting malware, phishing pages, or illegal content</li>
              <li>Violating the intellectual property rights of third parties</li>
              <li>Attempting to exceed resource limits or exploit the platform</li>
              <li>Reselling access to panels without written permission</li>
              <li>Spamming, scraping, or abusing external APIs at scale</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">7. Resource Limits & Auto-Management</h2>
            <p>Each panel is allocated specific RAM, CPU, and storage limits based on your plan. The platform enforces these limits to protect the stability of all hosted services. If your application exceeds its resource allocation:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The process will be automatically restarted</li>
              <li>If the application triggers more than 10 restarts within a 3-hour window, the panel will be automatically stopped</li>
              <li>You will be notified and prompted to upgrade your plan or optimize your application</li>
            </ul>
            <p>iDevHost is not liable for data loss resulting from automatic restarts or stops caused by resource limit violations.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">8. Uptime & Service Availability</h2>
            <p>We strive for high availability but do not guarantee 100% uptime. Scheduled maintenance, infrastructure failures, or circumstances beyond our control may cause temporary service interruptions. No credits or refunds are issued for downtime.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">9. Data & Privacy</h2>
            <p>We store only the data necessary to operate the service (email, hashed password, panel configurations, and logs). We do not sell your data to third parties. Files you upload to your panel are your property, but you grant us permission to store and process them for the purpose of hosting your application.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">10. Termination</h2>
            <p>We reserve the right to suspend or terminate any account at any time for violation of these Terms. Upon termination, your data may be permanently deleted. You may cancel your account at any time by contacting support; however, no refunds will be issued for remaining subscription time.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">11. Limitation of Liability</h2>
            <p>iDevHost is provided "as-is" without warranties of any kind. In no event shall iDevHost or its operators be liable for any indirect, incidental, special, or consequential damages including lost profits, data loss, or service interruptions arising from your use of the platform.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground font-mono">12. Contact</h2>
            <p>For questions, billing disputes, or support, contact us via Telegram at{' '}
              <a href="https://t.me/theidledeveloper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @theidledeveloper
              </a>.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>By using iDevHost you confirm you have read, understood, and agreed to these Terms.</p>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
