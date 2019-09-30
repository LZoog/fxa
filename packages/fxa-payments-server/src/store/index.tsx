import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ReduxThunk, { ThunkMiddleware } from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';
import typeToReducer from 'type-to-reducer';

import {
  fetchProfile,
  fetchToken,
  fetchPlans,
  fetchSubscriptions,
  fetchCustomer,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updatePayment,
  updateApiData,
  resetCreateSubscription,
  resetCancelSubscription,
  resetReactivateSubscription,
  resetUpdatePayment
} from './actions'

import {
  fetchDefault,
  fetchReducer,
  setStatic,
  mapToObject,
} from './utils';

import { State, Action } from './types';

const RESET_PAYMENT_DELAY = 2000;

export const defaultState: State = {
  api: {
    cancelSubscription: fetchDefault(null),
    reactivateSubscription: fetchDefault(null),
    createSubscription: fetchDefault(null),
    customer: fetchDefault(null),
    plans: fetchDefault(null),
    profile: fetchDefault(null),
    updatePayment: fetchDefault(null),
    subscriptions: fetchDefault(null),
    token: fetchDefault(null),
  },
};

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

export const reducers = {
  api: typeToReducer(
    {
      [fetchProfile.toString()]: fetchReducer('profile'),
      [fetchPlans.toString()]: fetchReducer('plans'),
      [fetchSubscriptions.toString()]: fetchReducer('subscriptions'),
      [fetchToken.toString()]: fetchReducer('token'),
      [fetchCustomer.toString()]: fetchReducer('customer'),
      [createSubscription.toString()]: fetchReducer(
        'createSubscription'
      ),
      [cancelSubscription.toString()]: fetchReducer(
        'cancelSubscription'
      ),
      [reactivateSubscription.toString()]: fetchReducer(
        'reactivateSubscription'
      ),
      [updatePayment.toString()]: fetchReducer('updatePayment'),
      [updateApiData.toString()]: (state, { payload }) => ({
        ...state,
        ...payload,
      }),
      [resetCreateSubscription.toString()]: setStatic({
        createSubscription: fetchDefault(null),
      }),
      [resetCancelSubscription.toString()]: setStatic({
        cancelSubscription: fetchDefault(null),
      }),
      [resetReactivateSubscription.toString()]: setStatic({
        reactivateSubscription: fetchDefault(null),
      }),
      [resetUpdatePayment.toString()]: setStatic({
        updatePayment: fetchDefault(null),
      }),
    },
    defaultState.api
  ),
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
