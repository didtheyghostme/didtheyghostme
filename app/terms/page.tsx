import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
        <p>
          By accessing and using didtheyghost.me (&quot;the Platform&quot;), a free service, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of
          these terms, you may not access the Platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. User Accounts and Authentication</h2>
        <p>To use certain features of the Platform, you must register for an account. You agree to:</p>
        <ul className="list-disc pl-6">
          <li>Provide accurate and complete information during registration</li>
          <li>Maintain the security of your account credentials</li>
          <li>Accept responsibility for all activities under your account</li>
          <li>Not share your account credentials</li>
          <li>Manage account security through Clerk&apos;s security settings</li>
          <li>Only use authentication services (including Google, GitHub, or email) in accordance with their terms</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. User Content and Responsibility</h2>
        <p>Users may submit content including job information, interview experiences, and comments. By posting content, you:</p>
        <ul className="list-disc pl-6">
          <li>Accept full and sole responsibility for all content you post</li>
          <li>Warrant that your content is accurate, legal, and does not violate any rights</li>
          <li>Acknowledge that we do not verify, endorse, or fact-check user-submitted content</li>
          <li>Agree to indemnify and hold us harmless from any claims, damages, or expenses resulting from your content</li>
          <li>Grant us a worldwide, royalty-free license to use, modify, display, and distribute your content</li>
          <li>Understand that we may use your content for platform improvement or promotional purposes</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Third-Party Authentication and Services</h2>
        <p>Our platform uses Clerk for authentication, which provides sign-in with Google, GitHub, and email. By using these services, you:</p>
        <ul className="list-disc pl-6">
          <li>Agree to comply with Clerk&apos;s Terms of Service and Privacy Policy</li>
          <li>Agree to comply with Google&apos;s API Services User Data Policy when using Google Sign-In</li>
          <li>Understand that authentication data is processed according to our Privacy Policy and Clerk&apos;s security standards</li>
          <li>Accept that third-party services have their own terms and privacy policies</li>
          <li>Acknowledge that we use analytics services to monitor platform usage</li>
          <li>Acknowledge that we are not responsible for third-party service disruptions</li>
          <li>Can revoke access to any authentication method through respective provider settings</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Prohibited Content</h2>
        <p>Users must not post content that:</p>
        <ul className="list-disc pl-6">
          <li>Is false, misleading, or fraudulent</li>
          <li>Infringes on intellectual property rights</li>
          <li>Contains confidential information or trade secrets</li>
          <li>Violates privacy rights or data protection laws</li>
          <li>Is defamatory, harassing, or promotes discrimination</li>
          <li>Contains malware or harmful code</li>
          <li>Attempts to manipulate platform features or metrics</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Disclaimer of Liability</h2>
        <p>The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We expressly disclaim:</p>
        <ul className="list-disc pl-6">
          <li>Any responsibility for accuracy, completeness, or reliability of user content</li>
          <li>Liability for any direct, indirect, incidental, or consequential damages</li>
          <li>Responsibility for decisions made based on platform content</li>
          <li>Any implied warranties of merchantability or fitness</li>
          <li>Liability for platform availability, errors, or data loss</li>
          <li>Responsibility for third-party services or links</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Content Moderation and Removal</h2>
        <p>We reserve the right, but have no obligation, to:</p>
        <ul className="list-disc pl-6">
          <li>Monitor, moderate, or remove any content</li>
          <li>Suspend or terminate access to the platform</li>
          <li>Process account deletion requests</li>
          <li>Modify or discontinue platform features</li>
          <li>Enforce these terms at our sole discretion</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. No Liability</h2>
        <p>This is a free service provided without any warranties or guarantees. By using this platform, you acknowledge and agree that:</p>
        <ul className="list-disc pl-6">
          <li>We shall not be liable for any damages or losses of any kind</li>
          <li>You use the platform entirely at your own risk</li>
          <li>We are not responsible for any consequences of your use of the platform</li>
          <li>We do not guarantee the accuracy or reliability of any information on the platform</li>
          <li>You waive any right to seek damages or compensation from us</li>
        </ul>
        <p className="mt-4">
          If any court determines that we are liable despite these terms, you agree that our total liability for all claims shall not exceed zero dollars (SGD 0.00), as this is a free service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">9. Data Processing and Security</h2>
        <p>Regarding your data and platform security:</p>
        <ul className="list-disc pl-6">
          <li>Authentication security is provided by Clerk, a SOC 2 Type 2 certified provider</li>
          <li>Data storage is managed by Supabase with their security infrastructure</li>
          <li>You acknowledge that all security depends on these third-party providers</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
        <p>We may modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of modified terms.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p>
          For matters related to these terms, you can reach us through our{" "}
          <Link className="text-primary" href="/contact">
            contact page
          </Link>
          .
        </p>
      </section>

      <footer className="mt-8 text-sm text-gray-500">
        <p>Last updated: 21 November 2024</p>
        <Link className="text-primary" href="/privacy">
          View Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
