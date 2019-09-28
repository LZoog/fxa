// import { Action, ActionCreator, ActionCreators } from './types'

import {
  apiFetchProfile,
  apiFetchPlans,
  apiFetchSubscriptions,
  apiFetchToken,
  apiFetchCustomer,
  apiCreateSubscription,
  apiCancelSubscription,
  apiReactivateSubscription,
  apiUpdatePayment,
} from '../lib/apiClient';

// Action creators
// export function fetchProfile() {
//   return {
//     type: 'fetchProfile',
//     payload: getProfile(),
//   }
// }
// fetchProfile.toString = () => 'fetchProfile';

// export function fetchToken() {
//   return {
//     type: 'fetchToken',
//     payload: getToken(),
//   }
// }
// fetchToken.toString = () => 'fetchToken';

// export function fetchPlans() {
//   return {
//     type: 'fetchPlans',
//     payload: getPlans(),
//   }
// }
// fetchPlans.toString = () => 'fetchPlans';

function makeActionCreator(type: string, payload: Function) {
  return () => ({ type, payload });
}

export const fetchProfile = makeActionCreator('fetchProfile', apiFetchProfile);
fetchProfile.toString = () => 'fetchProfile';

export const fetchToken = makeActionCreator('fetchToken', apiFetchToken);
fetchToken.toString = () => 'fetchToken';

export const fetchPlans = makeActionCreator('fetchPlans', apiFetchPlans);
fetchPlans.toString = () => 'fetchPlans';

export const fetchSubscriptions = makeActionCreator(
  'fetchSubscriptions',
  apiFetchSubscriptions
);
fetchSubscriptions.toString = () => 'fetchSubscriptions';

export const fetchCustomer = makeActionCreator(
  'fetchCustomer',
  apiFetchCustomer
);
fetchCustomer.toString = () => 'fetchCustomer';
