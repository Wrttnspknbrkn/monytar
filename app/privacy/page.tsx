import { LegalPage } from "@/components/legal-page"

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="February 1, 2026">
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly when you create an account, submit expense requests, or contact us. This includes your name, email address, organization details, and financial data related to expense management.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to provide and improve our expense management services, process transactions, communicate with you about your account, and ensure the security of our platform.</p>
      <ul>
        <li>Process and manage expense requests and approvals</li>
        <li>Generate reports and analytics for your organization</li>
        <li>Send notifications about request status changes</li>
        <li>Improve and personalize your experience</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>We do not sell your personal information. We share data only with your organization administrators as needed for expense management workflows, and with service providers who assist in operating our platform under strict confidentiality agreements.</p>

      <h2>4. Data Security</h2>
      <p>We implement industry-standard security measures including encryption in transit and at rest, regular security audits, and access controls to protect your data. All financial data is encrypted using AES-256 encryption.</p>

      <h2>5. Data Retention</h2>
      <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting our support team.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. You may also request a copy of your data in a portable format. To exercise these rights, contact us at privacy@spendwell.io.</p>

      <h2>7. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at privacy@spendwell.io or write to SpendWell, 123 Finance Street, San Francisco, CA 94105.</p>
    </LegalPage>
  )
}
