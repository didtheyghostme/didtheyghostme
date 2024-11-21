import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>

      <p className="mb-8">
        This privacy policy explains how didtheyghost.me (&quot;the Platform&quot;), a free service, collects and uses your information. By using the Platform, you agree to the collection and use of
        information in accordance with this policy. If you disagree with any part of this policy, you may not access the Platform.
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>We collect and process the following types of information:</p>
        <ul className="list-disc pl-6">
          <li>
            Authentication information:
            <ul className="mt-2 list-disc pl-6">
              <li>Basic profile information (name, email, profile picture)</li>
              <li>Authentication data through third-party providers</li>
            </ul>
          </li>
          <li>
            Platform data:
            <ul className="mt-2 list-disc pl-6">
              <li>User preferences and settings</li>
              <li>Job application and interview experiences you choose to share</li>
              <li>Usage analytics to improve our service</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>Your information may be used to:</p>
        <ul className="list-disc pl-6">
          <li>Authenticate and maintain your account</li>
          <li>Operate and maintain the platform</li>
          <li>Improve user experience</li>
          <li>Monitor platform usage and performance</li>
          <li>Prevent abuse and ensure compliance with our terms</li>
          <li>Communicate important updates about your account or the platform</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Authentication and Third-Party Services</h2>
        <p>We use trusted third-party services for specific functions:</p>
        <ul className="list-disc pl-6">
          <li>
            Clerk - for authentication services:
            <ul className="mt-2 list-disc pl-6">
              <li>Handles sign-in with Google, GitHub, and email</li>
              <li>We only access basic profile information needed for authentication (name, email, profile picture)</li>
              <li>We process Google account data in accordance with Google&apos;s API Services User Data Policy</li>
              <li>You can revoke access to your Google account through Google&apos;s security settings</li>
              <li>Authentication data is processed in accordance with Clerk&apos;s security standards</li>
              <li>You can manage all authentication methods through your Clerk account settings</li>
            </ul>
          </li>
          <li>Supabase - for data storage</li>
          <li>Analytics services - to understand platform usage and improve user experience</li>
        </ul>
        <p className="mt-2">
          These services have their own privacy policies and data handling practices. By using our platform, you also agree to the terms and privacy policies of these third-party services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Data Security</h2>
        <p>Our platform security is primarily managed through our service providers:</p>
        <ul className="list-disc pl-6">
          <li>Authentication security is handled by Clerk (SOC 2 Type 2 certified)</li>
          <li>Data storage is secured through Supabase&apos;s infrastructure</li>
        </ul>
        <p className="mt-2">While we choose reputable service providers, no internet-based platform can guarantee absolute security. You use this platform at your own risk.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Your Rights and Choices</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6">
          <li>Access your personal information</li>
          <li>Edit or delete your submitted content</li>
          <li>Manage your authentication methods through Clerk&apos;s user settings</li>
          <li>Request account deletion by contacting us</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. User Content</h2>
        <p>
          Any content you post on the platform may be visible to other users. Exercise caution when sharing personal or sensitive information. We are not responsible for how other users may use or
          share information you post publicly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Data Retention</h2>
        <p>
          Your data is retained in our service providers as long as you maintain your account and the platform remains active. To request account deletion, please contact us through our contact page.
          Note that if the platform discontinues its services, all user data will be deleted.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. Changes to Policy</h2>
        <p>This privacy policy may be updated at any time without notice. Your continued use of the platform after changes indicates acceptance of the updated policy.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">9. Contact</h2>
        <p>
          For privacy-related matters, you can reach us through our{" "}
          <Link className="text-primary" href="/contact">
            contact page
          </Link>
          .
        </p>
      </section>

      <footer className="mt-8 text-sm text-gray-500">
        <p>Last updated: 21 November 2024</p>
        <Link className="text-primary" href="/terms">
          View Terms of Service
        </Link>
      </footer>
    </div>
  );
}
