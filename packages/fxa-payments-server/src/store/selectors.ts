import { Selectors, Plan } from './types';

export const selectors: Selectors = {
  profile: state => state.api.profile,
  token: state => state.api.token,
  subscriptions: state => state.api.subscriptions,
  plans: state => state.api.plans,
  customer: state => state.api.customer,
  createSubscriptionStatus: state => state.api.createSubscription,
  cancelSubscriptionStatus: state => state.api.cancelSubscription,
  reactivateSubscriptionStatus: state => state.api.reactivateSubscription,
  updatePaymentStatus: state => state.api.updatePayment,

  lastError: state =>
    Object.entries(state.api)
      .filter(([k, v]) => v && !!v.error)
      .map(([k, v]) => [k, v.error])[0],

  isLoading: state => Object.values(state.api).some(v => v && !!v.loading),

  plansByProductId: state => (productId: string): Array<Plan> => {
    const plans = selectors.plans(state).result || [];
    return productId
      ? plans.filter((plan: Plan) => plan.product_id === productId)
      : plans;
  },

  customerSubscriptions: state => {
    const customer = selectors.customer(state);
    if (customer && customer.result && customer.result.subscriptions) {
      return customer.result.subscriptions;
    }
    return [];
  },
};
