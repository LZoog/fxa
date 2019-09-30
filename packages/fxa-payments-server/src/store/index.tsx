import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ReduxThunk, { ThunkMiddleware } from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';

import { reducers } from './reducers'

import { State, Action } from './types';

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
