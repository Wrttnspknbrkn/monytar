# Monytar Security Guide

This document outlines security measures, best practices, and configurations to ensure the Monytar platform is production-ready and secure.

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled. Key principles:

1. **Organization Isolation**: Users can only access data within their organization
2. **Role-Based Access**: Permissions vary by user role (admin, finance, manager, employee)
3. **Least Privilege**: Users get minimum necessary access

```sql
-- Example: Expense requests are org-scoped and role-filtered
CREATE POLICY "Employees see own requests" ON expense_requests FOR SELECT USING (
  organization_id = auth.user_org_id() AND (
    employee_id = auth.uid() OR
    auth.user_role() IN ('admin', 'finance') OR
    (auth.user_role() = 'manager' AND department_id IN (
      SELECT department_id FROM users WHERE id = auth.uid()
    ))
  )
);
```

### SQL Injection Prevention

- All queries use parameterized statements via Supabase client
- Never concatenate user input into SQL strings
- Input validation at API boundary

```typescript
// CORRECT: Parameterized query
const { data } = await supabase
  .from('expense_requests')
  .select('*')
  .eq('id', requestId) // Parameterized

// WRONG: String concatenation (never do this)
// const { data } = await supabase.rpc('raw_query', { sql: `SELECT * FROM expenses WHERE id = '${requestId}'` })
```

### Database Encryption

- **At Rest**: AES-256 encryption (Supabase default)
- **In Transit**: TLS 1.3 for all database connections
- **Secrets**: Environment variables for connection strings, never committed to code

## Authentication Security

### Supabase Auth Configuration

```typescript
// Secure auth configuration
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE for enhanced security
  },
});
```

### Session Management

- HTTP-only cookies for session tokens (when applicable)
- Session timeout: 7 days with activity, 24 hours idle
- Secure flag enabled for all auth cookies
- SameSite=Lax to prevent CSRF

### Password Requirements

For custom auth implementations:
- Minimum 8 characters
- Bcrypt hashing with cost factor 12
- Rate limiting on login attempts
- Account lockout after 5 failed attempts

## API Security

### Input Validation

All API inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

const expenseRequestSchema = z.object({
  amount: z.number().positive().max(1000000),
  currency: z.enum(['USD', 'EUR', 'GBP', 'GHS']),
  purpose: z.string().min(10).max(500),
  category: z.enum(['software', 'travel', 'supplies', 'meals', 'equipment', 'other']),
  vendor_id: z.string().uuid().optional(),
});

// In API route:
const validated = expenseRequestSchema.parse(requestBody);
```

### Rate Limiting

Implement rate limiting on sensitive endpoints:

```typescript
// Example with Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

// In API route:
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### CORS Configuration

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

## Stripe Security

### Webhook Verification

Always verify webhook signatures:

```typescript
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  sig!,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### Price Validation

Never trust client-side price data:

```typescript
// Products defined server-side only
export const PRODUCTS: Product[] = [
  { id: 'starter-monthly', priceInCents: 2900, ... },
  // Prices are NEVER accepted from client
];

// Checkout always uses server-defined prices
const product = getProductById(productId);
if (!product) throw new Error('Invalid product');
// Use product.priceInCents, not client-provided price
```

### PCI Compliance

- Never handle raw credit card data
- Stripe Elements/Checkout handles all payment form rendering
- Card data never touches your servers

## Security Headers

Add security headers in middleware or next.config:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; frame-src https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  return response;
}
```

## Environment Variables Security

### Required Environment Variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only, never expose to client

# Stripe (required for billing)
STRIPE_SECRET_KEY=sk_live_...     # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # Server-side only

# App
NEXT_PUBLIC_APP_URL=https://monytar.com
```

### Security Rules

1. **Never commit secrets**: Use `.env.local` (gitignored) for local development
2. **Prefix public vars**: Only `NEXT_PUBLIC_*` vars are exposed to client
3. **Rotate regularly**: Rotate keys quarterly or after any suspected breach
4. **Use Vercel env vars**: Store production secrets in Vercel dashboard

## Audit Logging

All sensitive operations are logged:

```typescript
// Example audit log entry
await supabase.from('activity_logs').insert({
  organization_id: orgId,
  user_id: userId,
  action: 'expense_approved',
  entity_type: 'expense_request',
  entity_id: expenseId,
  details: {
    amount: expense.amount,
    approved_by: approverId,
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
  },
  created_at: new Date().toISOString(),
});
```

## Security Checklist for Production

### Pre-Launch

- [ ] All RLS policies tested and verified
- [ ] No hardcoded secrets in codebase
- [ ] All API inputs validated with Zod
- [ ] Stripe webhook secret configured
- [ ] Security headers enabled
- [ ] HTTPS enforced (Vercel handles this)
- [ ] Rate limiting on auth endpoints

### Ongoing

- [ ] Dependency updates (monthly)
- [ ] Security audit (quarterly)
- [ ] Penetration testing (annually)
- [ ] Access review (quarterly)
- [ ] Backup verification (monthly)

### Incident Response

1. **Detect**: Monitor logs for anomalies
2. **Contain**: Revoke compromised credentials immediately
3. **Investigate**: Analyze audit logs
4. **Remediate**: Fix vulnerability and deploy
5. **Report**: Notify affected users if required by law

## Reporting Security Issues

If you discover a security vulnerability:

- Email: security@gydgen.com
- Do NOT open a public GitHub issue
- Include steps to reproduce
- Allow 90 days for remediation before disclosure
