import { LegalPage } from "@/components/legal-page"

export default function SecurityPage() {
  return (
    <LegalPage title="Security" lastUpdated="February 1, 2026">
      <h2>Our Commitment to Security</h2>
      <p>At Monytar, security is not an afterthought - it is foundational to everything we build. We handle sensitive financial data and take that responsibility seriously with enterprise-grade security measures.</p>

      <h2>Infrastructure Security</h2>
      <ul>
        <li>All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption</li>
        <li>Infrastructure hosted on SOC 2 Type II certified cloud providers</li>
        <li>Automated vulnerability scanning and penetration testing performed quarterly</li>
        <li>DDoS protection and Web Application Firewall (WAF) on all endpoints</li>
      </ul>

      <h2>Application Security</h2>
      <ul>
        <li>Role-based access control (RBAC) with granular permissions</li>
        <li>Row-level security policies ensuring data isolation between organizations</li>
        <li>Input validation and parameterized queries to prevent injection attacks</li>
        <li>Secure session management with HTTP-only cookies and CSRF protection</li>
      </ul>

      <h2>Authentication & Access</h2>
      <ul>
        <li>Password hashing using bcrypt with adaptive cost factors</li>
        <li>Optional two-factor authentication (2FA) for all accounts</li>
        <li>SSO/SAML integration available on Enterprise plans</li>
        <li>Automatic session expiration and account lockout after failed attempts</li>
      </ul>

      <h2>Compliance</h2>
      <p>Monytar is designed to help organizations maintain compliance with financial regulations. Our platform supports complete audit trails, data retention policies, and export capabilities for regulatory reporting.</p>

      <h2>Reporting Vulnerabilities</h2>
      <p>If you discover a security vulnerability, please report it responsibly to security@monytar.com. We commit to acknowledging reports within 24 hours and providing a resolution timeline within 72 hours.</p>
    </LegalPage>
  )
}
