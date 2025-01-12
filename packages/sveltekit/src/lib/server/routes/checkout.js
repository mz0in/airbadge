import { error } from '@sveltejs/kit'
import { redirect } from './utils'

export default async function handler({ url }, { user, plans, billing, options }) {
  if (!user) error(401, 'Authentication required')
  if (user.subscriptionId) error(403, 'User is already subscribed')

  const planId = url.searchParams.get('plan')
  const plan = planId ? plans.getById(planId) : plans.getDefault()

  if (!plan) error(403, 'No default plan, and plan was not specified in URL')

  if (plan.trial || plan.price == 0) {
    await billing.createSubscription(user, plan)

    return redirect(303, options.pages.checkout.success)
  } else {
    const checkout = await billing.createCheckout(user, plan)

    return redirect(303, checkout.url)
  }
}
