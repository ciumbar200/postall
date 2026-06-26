# MoOn Presentation Notes

## Local URLs

- Landing: `http://127.0.0.1:5174/#/landing`
- Demo flow: `http://127.0.0.1:5174/#/demo`
- Overview: `http://127.0.0.1:5174/#/overview`
- Integrations: `http://127.0.0.1:5174/#/integrations`
- Billing: `http://127.0.0.1:5174/#/billing`
- Compose: `http://127.0.0.1:5174/#/compose`
- Workspaces: `http://127.0.0.1:5174/#/workspaces`

## Before the meeting

1. Open the app on `#/landing`
2. Click `Start presentation` or `Prepare`
3. Leave `Presenter` mode enabled
4. Keep one spare tab on `#/demo`

Useful shortcuts:

- `Shift + P` -> toggle Presenter mode
- `Shift + R` -> prepare the presentation state
- `Shift + D` -> jump to Demo Flow

Preflight:

- `npm run preflight`

## 3-minute script

### 1. Market pain

Open `Landing`.

Say:

> Social teams still stitch together fragmented schedulers, analytics tools and manual platform workflows. MoOn consolidates that into one direct publishing control plane.

### 2. Why this wins

Open `Integrations`.

Say:

> The moat is direct provider connectivity. We are not reselling a generic scheduler layer. Instagram and TikTok open the wedge; LinkedIn, Facebook and YouTube expand the market into brand and B2B workflows.

### 3. How it makes money

Open `Billing`.

Say:

> Pricing expands with real operational complexity: more channels, more team coordination, more approvals, more governance. That gives us a clean path from Starter to Growth to Scale.

### 4. Show the product is real

Open `Overview`, then `Compose`.

Say:

> This is not just a landing page. The operator workflow already exists: provider states, post composition, calendar planning, queue logic and workspace readiness all sit in one product.

### 5. Show expansion

Open `Workspaces`.

Say:

> The product naturally grows into multi-brand teams, approvals and agency accounts. That is where expansion revenue and defensibility start to compound.

## What to emphasize

- Direct APIs instead of reseller dependency
- LinkedIn, Facebook and YouTube make the product broader than creator-only tools
- Pricing is tied to workflow complexity, not vanity usage
- Workspaces and approvals turn the product into team software

## What not to over-explain

- Internal implementation details
- Missing backend worker/runtime pieces
- Supabase specifics unless asked
- The exact line between current demo state and production MVP unless due diligence requires it

## If they ask what is next

Say:

> The next step is converting the current product surface into a production MVP with live OAuth, durable publishing workers, and real analytics ingestion, while keeping the same operator experience.
