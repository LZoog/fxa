import { ActionType as PromiseActionType } from 'redux-promise-middleware';
import { Action, FetchState } from './types';

import * as utils from './utils';

describe('mapToObject', () => {
  it('transforms a list of strings into an object via map function', () => {
    const list = ['one', 'two', 'three'];
    const mapFn = (item: string) => item.toUpperCase();
    const expected = {
      one: 'ONE',
      two: 'TWO',
      three: 'THREE',
    };
    expect(utils.mapToObject(list, mapFn)).toEqual(expected);
  });
});

describe('setAsPayload', () => {
  it('replaces state with action payload', () => {
    const state = { foo: 1 };
    const payload = { bar: 2 };
    const action: Action = { type: 'frobnicate', payload };
    expect(utils.setAsPayload(state, action)).toEqual(payload);
  });
});

describe('setFromPayload', () => {
  it('replaces a named part of state with action payload', () => {
    const state = { foo: 1, bar: 456 };
    const payload = 123;
    const action: Action = { type: 'frobnicate', payload };
    const subject = utils.setFromPayload('foo', '');
    expect(subject(state, action)).toEqual({ foo: 123, bar: 456 });
  });
});

describe('setFromPayloadFn', () => {
  it('merges the result of a function applied to payload into state', () => {
    const state = { foo: 1 };
    const payload = '123';
    const action: Action = { type: 'frobnicate', payload };
    const fn = (payload: any) => ({
      [payload]: parseInt(payload) * 2,
    });
    const subject = utils.setFromPayloadFn(fn);
    expect(subject(state, action)).toEqual({ foo: 1, '123': 246 });
  });
});

describe('fetchDefault', () => {
  it('builds a default value for a fetch reducer', () => {
    const subject = utils.fetchDefault('foo');
    expect(subject).toMatchObject({
      error: null,
      loading: false,
      result: 'foo',
    });
  });
});

describe('fetchReducer', () => {
  it('builds a reducer to handle fetch API promise actions', () => {
    const name = 'foo';
    const subject = utils.fetchReducer(name);

    type TestState = { foo: FetchState<string> };

    const state0: TestState = { foo: utils.fetchDefault('123') };
    expect(state0.foo.loading).toEqual(false);
    expect(state0.foo.result).toEqual('123');
    expect(state0.foo.error).toEqual(null);

    const action1 = { type: 'pending', payload: '456' };
    const state1 = subject[PromiseActionType.Pending](state0, action1) as TestState;
    expect(state1.foo.loading).toEqual(true);
    expect(state1.foo.result).toEqual(null);
    expect(state1.foo.error).toEqual(null);

    const action2 = { type: 'success', payload: '456' };
    const state2 = subject[PromiseActionType.Fulfilled](state1, action2) as TestState;
    expect(state2.foo.loading).toEqual(false);
    expect(state2.foo.result).toEqual('456');
    expect(state2.foo.error).toEqual(null);

    const action3 = { type: 'error', payload: '456' };
    const state3 = subject[PromiseActionType.Rejected](state2, action3) as TestState;
    expect(state3.foo.loading).toEqual(false);
    expect(state3.foo.result).toEqual(null);
    expect(state3.foo.error).toEqual('456');
  });
});
