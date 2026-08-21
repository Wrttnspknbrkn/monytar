import { LegalPage } from "@/components/legal-page"

export default function SecurityPage() {
  return (
    <LegalPage title="Security" lastUpdated="February 1, 2026">
      <h2>Our Commitment to Security</h2>
      <p>At Monytar, security is not an afterthought - it is foundational to everything we build. We handle sensitive financial data and take that responsibility seriously with enterprise-grade security measures.</p>

      <h2>Infrastructure Security</h2>
      <ul>
        <li>Data is encrypted in transit (TLS) and at rest by our managed infrastructure providers</li>
        <li>Hosted on established cloud providers (Vercel and Supabase) that maintain their own SOC 2 attestations</li>
        <li>Managed Postgres with automated backups and point-in-time recovery</li>
        <li>Secrets and credentials stored as environment variables, never in source or the client</li>
      </ul>

      <h2>Application Security</h2>
      <ul>
        <li>Role-based access control (RBAC) with granular, per-action permissions</li>
        <li>Row Level Security (RLS) policies enforcing data isolation between organizations</li>
        <li>Server-side authorization on every mutating action — client identity is never trusted</li>
        <li>Parameterized queries throughout to prevent SQL injection</li>
        <li>Private receipt storage served only through short-lived signed URLs</li>
        <li>Generic authentication errors to prevent account enumeration</li>
      </ul>

      <h2>Authentication & Access</h2>
      <ul>
        <li>Email and password authentication managed by Supabase Auth</li>
        <li>Industry-standard password hashing handled by the auth provider</li>
        <li>Secure, HTTP-only session cookies</li>
        <li>Complete, immutable audit trail of sensitive actions</li>
      </ul>
      <p className="text-sm opacity-80">Two-factor authentication and SSO/SAML are on our roadmap and are not yet generally available.</p>

      <h2>Compliance</h2>
      <p>Monytar is designed to help organizations maintain good financial controls. The platform provides complete audit trails, data export for regulatory reporting, and configurable role-based access. Formal certifications (such as SOC 2) are a roadmap item and are not currently held by Monytar itself.</p>

      <h2>Reporting Vulnerabilities</h2>
      <p>If you discover a security vulnerability, please report it responsibly to security@monytar.com. We commit to acknowledging reports within 24 hours and providing a resolution timeline within 72 hours.</p>
    </LegalPage>
  )
}
