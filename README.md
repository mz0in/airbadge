<img src="logo.svg" alt="logo" width="800"/>

> Stripe + Auth.js + SvelteKit

This project provides an easy way to create a SaaS site.

It is a [Stripe](https://stripe.com) addon for [Auth.js](https://authjs.dev).

Launch a SaaS app without writing any authentiction or payment code!

## Features

- **Integrated Payment**: Stripe Checkout is built into the signup flow.
- **Authentication**: Over 50 OAuth options (Google, Apple, GitHub...), provided by Auth.js.
- **Authorization**: Routes and UI can be restricted based on subscription.
- **Self-service account management**: Changing or canceling plans is accessible via `/billing/portal`.
- **Webhook handling**: All Stripe webhooks are handled for you.
- **Trials & Free plans**: Checkout can be skipped for free plans or trials.
- **Session data**: Subscription and plan data is included in the session.
- **Open source**: https://github.com/joshnuss/airbadge
- **BSL Licence**: Free for first 100 customers. Then $150/year for unlimited users.

## Authorization

### Conditional UI

Conditionally display components based on the user's subscription status.

Two component wrappers are provided:

- `<NonSubscriber/>`: Display content when user doesn't have a subscription.
- `<Subscriber/>`: Display content when user has a subscription. Can also filter by plan or payment state.

### Examples

```html
<script>
  import { Subscriber, NonSubscriber } from '@airbadge/sveltekit'
</script>

<!-- show to all subscribers -->
<Subscriber>
  <p>Welcome back subscriber!</p>
</Subscriber>

<!-- show to unpaid subscribers -->
<Subscriber unpaid>
  <p>Whoops, we couldn't collect a payment.</p>

  <a href="/billing/portal">Upgrade</a>
</Subscriber>

<!-- show to subscribers with canceled subscriptions -->
<Subscriber canceled>
  <p>Your account has been canceled</p>
  <a href="/billing/checkout">Sign up</a>
</Subscriber>

<!-- show to subscribers on the "pro" plan -->
<Subscriber plan="pro">
  You're on the Pro plan!!
</Subscriber>

<!-- show to subscribers on the "pro" or "enterprise" plan -->
<Subscriber plans={["pro", "enterprise"]}>
  You're a real player!!
</Subscriber>

<!-- show to non-subscribers -->
<NonSubscriber>
  <a href="/billing/checkout">Sign up</a>
</NonSubscriber>
```

### Restricting Routes

Guards are helper functions that can restrict access to a route based on the subscription status or plan:

```javascript
// in +page.server.js
import { nonSubscriber, member } from '@airbadge/sveltekit'

// route is for subscribers only (including canceled, or late on payment)
export const load = subscriber(callback)

// route is for fully paid subscribers only
export const load = subscriber.active(callback)

// route is for past due subscribers only
export const load = subscriber.pastDue(callback)

// route is for unpaid subscribers only
export const load = subscriber.unpaid(callback)

// route is for trailing subscribers only
export const load = subscriber.trialing(callback)

// route is for subscribers that have canceled their subscription
export const load = subscriber.canceled(callback)

// route is for subscribers on the "pro" plan
export const load = subscriber.plan('pro', callback)

// route is for subscribers on the "pro" or "enterprise" plans
export const load = subscriber.plans(['pro', 'enterprise'], callback)

// route is for non-subscribers only
export const load = nonSubscriber(callback)
```

## Billing Endpoint

This package provides a `/billing` endpoint, similar to how Auth.js provides a `/auth` endpoint.

The following routes are provided:

- `/billing/checkout`: Redirect current user to a Stripe checkout session.
- `/billing/portal`: Opens the billing portal for the current signed-in user.
- `/billing/cancel`: Cancels the current user's subscription.
- `/billing/webhooks`: Handles all Stripe webhooks for you.
- `/billing/plans`: List plans in json format.
- `/billing/modify`: Modify the current user's billing plan.
- `/billing/checkout/complete`: Handles post-checkout housekeeping.

## Setup

Install [@airbadge/sveltekit](https://npmjs.com/package/@airbadge/sveltekit):

```sh
pnpm i -D @airbadge/sveltekit
```

Setup a database provider for Auth.js. For example, follow instructions for Prisma:

https://authjs.dev/reference/adapter/prisma

Add environment variables to `.env`:

```sh
PUBLIC_STRIPE_KEY=pk_...
SECRET_STRIPE_KEY=sk_...
DOMAIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auth_stripe_sveltekit_dev?schema=public"
```

Configure authentication and billing options in `src/hooks.server.js`:

```javascript
import { SvelteKitAuth } from '@airbadge/sveltekit'

// use any OAuth provider (or multiple)
import GitHub from '@auth/core/providers/github'

// import prisma client for Auth.js's database adapter
import { PrismaClient } from '@prisma/client'

// init database client
const db = new PrismaClient()

// add Auth.js + Stripe handler
// API is similar to Auth.js
export const handle = SvelteKitAuth({
  // configure database adapter
  adapter: PrismaAdapter(db),

  // configure OAuth providers
  providers: [
    GitHub({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET
    })
  ],

  // configure list of plans.
  plans: [
    { id: 'basic', name: 'Basic', price: 1000, default: true },
    { id: 'pro', name: 'Pro', price: 2500 }
    { id: 'enterprise', name: 'Enterprise', price: 10000 }
  ]
})
```

Forward Stripe events to `localhost`:

```sh
stripe listen --forward-to localhost:5173/billing/webhooks
```

## License

BSL - Business Software License.
