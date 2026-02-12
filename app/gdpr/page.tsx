import { LegalPage } from "@/components/legal-page"

export default function GDPRPage() {
  return (
    <LegalPage title="GDPR Compliance" lastUpdated="February 1, 2026">
      <h2>Our Commitment to GDPR</h2>
      <p>SpendFlow is committed to protecting the privacy and rights of individuals in the European Economic Area (EEA). We comply with the General Data Protection Regulation (GDPR) and provide tools to help your organization meet its own GDPR obligations.</p>

      <h2>Data Processing</h2>
      <p>SpendFlow acts as a data processor on behalf of your organization (the data controller). We process personal data only as instructed by your organization and in accordance with our Data Processing Agreement (DPA).</p>

      <h2>Your Rights Under GDPR</h2>
      <ul>
        <li><strong>Right of Access</strong> - Request a copy of all personal data we hold about you</li>
        <li><strong>Right to Rectification</strong> - Correct any inaccurate or incomplete personal data</li>
        <li><strong>Right to Erasure</strong> - Request deletion of your personal data ("right to be forgotten")</li>
        <li><strong>Right to Data Portability</strong> - Receive your data in a structured, machine-readable format</li>
        <li><strong>Right to Object</strong> - Object to processing of your personal data in certain circumstances</li>
        <li><strong>Right to Restrict Processing</strong> - Request limitation of processing of your personal data</li>
      </ul>

      <h2>Data Transfers</h2>
      <p>When transferring personal data outside the EEA, we use approved transfer mechanisms including Standard Contractual Clauses (SCCs) as approved by the European Commission, ensuring your data receives adequate protection regardless of where it is processed.</p>

      <h2>Data Protection Officer</h2>
      <p>Our designated Data Protection Officer can be reached at dpo@spendflow.io for any GDPR-related inquiries, data subject access requests, or concerns about how we handle personal data.</p>

      <h2>Sub-processors</h2>
      <p>We maintain an up-to-date list of sub-processors who may access personal data in the course of providing our services. We ensure all sub-processors are bound by data processing agreements that meet GDPR requirements. Contact us for the current list.</p>

      <h2>Breach Notification</h2>
      <p>In the event of a personal data breach, we will notify affected organizations within 72 hours of becoming aware of the breach, in compliance with Article 33 of the GDPR, including details of the nature of the breach and recommended mitigation measures.</p>
    </LegalPage>
  )
}
