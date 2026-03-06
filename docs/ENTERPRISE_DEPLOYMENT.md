# Monytar Enterprise & On-Premise Deployment Guide

This guide covers how to handle Enterprise/On-Premise subscriptions for organizations that require dedicated infrastructure, custom integrations, or compliance with specific data residency requirements.

## Enterprise Subscription Overview

Enterprise subscriptions are **custom-priced** and include:

- Unlimited users
- On-premise deployment option
- Custom integrations
- SLA guarantee
- 24/7 phone support
- Dedicated infrastructure
- Custom training & onboarding

## Handling Enterprise Sales Flow

### 1. Initial Contact

When a customer clicks "Contact Sales" on the pricing page, they are directed to `/contact`. The sales inquiry should include:

- Company name and size
- Number of expected users
- Specific requirements (compliance, data residency, integrations)
- Deployment preference (cloud vs on-premise)

### 2. Sales Process

1. **Discovery call**: Understand requirements, compliance needs, and scale
2. **Technical assessment**: Evaluate integration complexity and infrastructure needs
3. **Proposal**: Custom pricing based on users, features, and deployment type
4. **Contract negotiation**: Legal review, SLA terms, support levels
5. **Onboarding**: Dedicated implementation with training

### 3. Custom Pricing Implementation

For enterprise customers, you do NOT use Stripe Checkout. Instead:

```typescript
// In your admin panel or CRM system:

// 1. Create a Stripe subscription manually via Dashboard or API
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_enterprise_custom' }], // Custom price ID
  metadata: {
    company_name: 'Client Corp',
    contract_id: 'CONTRACT-2026-001',
    annual_value: '120000', // $120k/year
  },
});

// 2. Update the organization in Supabase
await supabase
  .from('organizations')
  .update({
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    enterprise_features: {
      sso_enabled: true,
      api_access: true,
      custom_domain: 'expenses.clientcorp.com',
      data_retention_days: 2555, // 7 years
    },
  })
  .eq('id', organizationId);
```

## On-Premise Deployment

### Architecture Options

#### Option A: Customer-Hosted (Full On-Premise)

Customer hosts everything on their infrastructure:

1. **Provide deployment package:**
   - Docker images for all services
   - Kubernetes Helm charts
   - Database migration scripts
   - Configuration templates

2. **Infrastructure requirements:**
   - PostgreSQL 15+ (or Supabase self-hosted)
   - Node.js 20+ runtime
   - Reverse proxy (nginx/Caddy)
   - SSL certificates

3. **Deployment commands:**

```bash
# Clone the deployment repository (private)
git clone https://github.com/gydgen/monytar-onprem.git
cd monytar-onprem

# Configure environment
cp .env.example .env
# Edit .env with customer-specific values

# Deploy with Docker Compose
docker-compose up -d

# Or with Kubernetes
helm install monytar ./charts/monytar \
  --namespace monytar \
  --values customer-values.yaml
```

#### Option B: Dedicated Cloud Instance

You manage a dedicated instance for the customer:

1. **Create isolated infrastructure:**
   - Dedicated Vercel project
   - Dedicated Supabase project
   - Isolated database with customer data only

2. **Custom domain setup:**
   - Customer provides domain: `expenses.clientcorp.com`
   - Configure DNS to point to dedicated instance
   - Issue SSL certificate

3. **Data isolation:**
   - Separate database instance
   - No shared resources with other customers
   - Customer-specific backup schedule

### On-Premise Configuration

Create a dedicated configuration file for each on-premise customer:

```typescript
// config/enterprise/clientcorp.ts
export const enterpriseConfig = {
  // Organization
  organizationId: 'org-enterprise-001',
  
  // Features
  features: {
    sso: {
      enabled: true,
      provider: 'okta',
      issuer: 'https://clientcorp.okta.com',
      clientId: process.env.SSO_CLIENT_ID,
    },
    api: {
      enabled: true,
      rateLimit: 10000, // requests per hour
    },
    customBranding: {
      enabled: true,
      logoUrl: '/branding/clientcorp-logo.png',
      primaryColor: '#1a365d',
    },
  },
  
  // Compliance
  compliance: {
    dataRetentionDays: 2555, // 7 years
    auditLogRetentionDays: 3650, // 10 years
    encryptionAtRest: true,
    encryptionInTransit: true,
  },
  
  // Support
  support: {
    tier: 'enterprise',
    sla: '99.9%',
    responseTime: '1 hour',
    dedicatedManager: 'support@gydgen.com',
  },
};
```

## Developer Execution Checklist

When setting up an Enterprise customer, follow this checklist:

### Pre-Deployment

- [ ] Contract signed and payment confirmed
- [ ] Technical requirements documented
- [ ] Security questionnaire completed
- [ ] Data processing agreement (DPA) signed
- [ ] SSO configuration details obtained

### Infrastructure Setup

- [ ] Create dedicated Supabase project (or provide self-hosted instructions)
- [ ] Run database migrations
- [ ] Configure Row Level Security policies
- [ ] Set up backup schedule (daily + point-in-time recovery)
- [ ] Create Stripe customer and subscription
- [ ] Configure custom domain and SSL

### Application Configuration

- [ ] Create organization record in database
- [ ] Configure enterprise features (SSO, API access, etc.)
- [ ] Set up admin user accounts
- [ ] Configure email templates with customer branding
- [ ] Test all integrations

### Handoff

- [ ] Conduct admin training session
- [ ] Provide documentation package
- [ ] Set up monitoring and alerts
- [ ] Establish support communication channel
- [ ] Schedule first quarterly business review

## Subscription Management for Enterprise

### Upgrading Existing Customers

```typescript
// When a Professional customer upgrades to Enterprise:
await stripe.subscriptions.update(subscriptionId, {
  items: [
    { id: existingItemId, deleted: true },
    { price: 'price_enterprise_custom' },
  ],
  proration_behavior: 'create_prorations',
});

await supabase
  .from('organizations')
  .update({
    subscription_tier: 'enterprise',
    enterprise_features: { /* new features */ },
  })
  .eq('id', organizationId);
```

### Downgrading Enterprise Customers

Downgrades require:
1. 30-day notice (per contract terms)
2. Data export provided to customer
3. Feature access revocation scheduled
4. Stripe subscription updated at end of billing period

```typescript
// Schedule downgrade at period end
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,
  metadata: { downgrade_to: 'professional' },
});

// Webhook handles actual tier change when subscription ends
```

### Cancellation

Enterprise cancellations require:
1. 90-day notice (per contract)
2. Full data export
3. Infrastructure decommissioning plan
4. Final invoice reconciliation

## Security Considerations for Enterprise

1. **Data Isolation**: Each enterprise customer has isolated database schemas or dedicated databases
2. **Encryption**: All data encrypted at rest (AES-256) and in transit (TLS 1.3)
3. **Access Control**: IP allowlisting, VPN access options
4. **Audit Logging**: All admin actions logged with immutable audit trail
5. **Compliance**: SOC 2 Type II, GDPR, and customer-specific certifications
6. **Penetration Testing**: Annual third-party security assessments

## Support Escalation

For Enterprise customers:

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | 1 hour | System down, data breach |
| High | 4 hours | Major feature broken, security concern |
| Medium | 24 hours | Feature bug, performance issue |
| Low | 72 hours | Enhancement request, minor bug |

Contact: enterprise-support@gydgen.com
