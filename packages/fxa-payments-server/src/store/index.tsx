import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ReduxThunk, { ThunkMiddleware } from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';

import {
  fetchProfile,
  fetchPlans,
  fetchSubscriptions,
  fetchCustomer,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updatePayment,
  resetUpdatePayment
} from './actions'

import { reducers } from './reducers'

import { State, Action } from './types';

const RESET_PAYMENT_DELAY = 2000;

// TODO: Find another way to handle these errors? Rejected promises result
// in Redux actions dispatched *and* exceptions thrown. We handle the
// actions in the UI, but the exceptions bubble and get caught by dev server
// and testing handlers unless we swallow them.
// See also: https://github.com/pburtchaell/redux-promise-middleware/blob/master/docs/guides/rejected-promises.md
const handleThunkError = (err: any) => {
  // console.warn(err);
};

// Convenience functions to produce action sequences via react-thunk functions
export const thunks = {
  fetchProductRouteResources: () => async (
    dispatch: Function
  ) => {
    await Promise.all([
      dispatch(fetchPlans()),
      dispatch(fetchProfile()),
      dispatch(fetchCustomer()),
      dispatch(fetchSubscriptions()),
    ]).catch(handleThunkError);
  },

  fetchSubscriptionsRouteResources: () => async (
    dispatch: Function
  ) => {
    await Promise.all([
      dispatch(fetchPlans()),
      dispatch(fetchProfile()),
      dispatch(fetchCustomer()),
      dispatch(fetchSubscriptions()),
    ]).catch(handleThunkError);
  },

  fetchCustomerAndSubscriptions: () => async (
    dispatch: Function
  ) => {
    await Promise.all([
      dispatch(fetchCustomer()),
      dispatch(fetchSubscriptions()),
    ]).catch(handleThunkError);
  },

  createSubscriptionAndRefresh: (
    params: {
      paymentToken: string;
      planId: string;
      displayName: string;
    }
  ) => async (dispatch: Function) => {
    try {
      await dispatch(createSubscription(params));
      await dispatch(thunks.fetchCustomerAndSubscriptions());
    } catch (err) {
      handleThunkError(err);
    }
  },

  cancelSubscriptionAndRefresh: (
    subscriptionId: string
  ) => async (dispatch: Function, getState: Function) => {
    try {
      await dispatch(cancelSubscription(subscriptionId));
      await dispatch(thunks.fetchCustomerAndSubscriptions());
    } catch (err) {
      handleThunkError(err);
    }
  },

  reactivateSubscriptionAndRefresh: (
    subscriptionId: string
  ) => async (dispatch: Function, getState: Function) => {
    try {
      await dispatch(
        reactivateSubscription(subscriptionId)
      );
      await dispatch(thunks.fetchCustomerAndSubscriptions());
    } catch (err) {
      handleThunkError(err);
    }
  },

  updatePaymentAndRefresh: ({ paymentToken }: { paymentToken: string }) => async (
    dispatch: Function
  ) => {
    try {
      await dispatch(updatePayment(paymentToken));
      await dispatch(thunks.fetchCustomerAndSubscriptions());
      setTimeout(
        () => dispatch(resetUpdatePayment()),
        RESET_PAYMENT_DELAY
      );
    } catch (err) {
      handleThunkError(err);
    }
  },
};

// export const selectorsFromState = (...names: Array<string>) => (state: State) =>
//   mapToObject(names, (name: string) => selectors[name](state));

// export const pickActions = (...names: Array<string>) =>
//   mapToObject(names, (name: string) => actions[name]);

export const createAppStore = (initialState?: State, enhancers?: Array<any>) =>
  createStore<State, Action, unknown, unknown>(
    combineReducers(reducers),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        ReduxThunk as ThunkMiddleware<State, Action>,
        promiseMiddleware()
      ),
      ...(enhancers || [])
    )
  );
