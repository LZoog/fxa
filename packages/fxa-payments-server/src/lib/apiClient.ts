import { Config } from './config';

// TODO: Use a better type here
interface APIFetchOptions {
  [propName: string]: any;
}

type ErrorResponseBody = {
  code?: string;
  statusCode?: number;
  errno?: number;
  error?: string;
  message?: string;
  info?: string;
};

export class APIError extends Error {
  body: ErrorResponseBody | null;
  response: Response | null | undefined;
  code: string | null;
  statusCode: number | null;
  errno: number | null;
  error: string | null;

  constructor(
    body?: ErrorResponseBody,
    response?: Response,
    code?: string,
    errno?: number,
    error?: string,
    statusCode?: number,
    ...params: Array<any>
  ) {
    super(...params);
    this.response = response;
    this.body = body || null;
    this.code = code || null;
    this.statusCode = statusCode || null;
    this.errno = errno || null;
    this.error = error || null;

    if (this.body) {
      const { code, errno, error, message, statusCode } = this.body;
      Object.assign(this, { code, errno, error, message, statusCode });
    }
  }
}

export default class APIClient {
  config: Config;
  accessToken: string;

  constructor(config: Config, accessToken: string) {
    this.config = config;
    this.accessToken = accessToken;
  }

  async fetch(method: string, path: string, options: APIFetchOptions = {}) {
    const response = await fetch(path, {
      mode: 'cors',
      credentials: 'omit',
      method,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        ...(options.headers || {}),
      },
    });
    if (response.status >= 400) {
      let body = {};
      try {
        // Parse the body as JSON, but will fail if things have really gone wrong
        body = await response.json();
      } catch (_) {
        // No-op
      }
      throw new APIError(body, response);
    }
    return response.json();
  }

  getProfile() {
    return this.fetch('GET', `${this.config.servers.profile.url}/v1/profile`);
  }

  getPlans() {
    return this.fetch(
      'GET',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/plans`
    );
  }

  getSubscriptions() {
    return this.fetch(
      'GET',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/active`
    );
  }

  getToken() {
    return this.fetch(
      'POST',
      `${this.config.servers.oauth.url}/v1/introspect`,
      {
        body: JSON.stringify({
          token: this.accessToken,
        }),
      }
    );
  }

  getCustomer() {
    return this.fetch(
      'GET',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/customer`
    );
  }

  createSubscription(params: {
    paymentToken: string;
    planId: string;
    displayName: string;
  }) {
    return this.fetch(
      'POST',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/active`,
      {
        body: JSON.stringify({
          ...params,
        }),
      }
    );
  }

  cancelSubscription(subscriptionId: string) {
    return this.fetch(
      'DELETE',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/active/${subscriptionId}`
    );
  }

  reactivateSubscription(subscriptionId: string) {
    return this.fetch(
      'POST',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/reactivate`,
      { body: JSON.stringify({ subscriptionId }) }
    );
  }

  updatePayment(paymentToken: string) {
    return this.fetch(
      'POST',
      `${this.config.servers.auth.url}/v1/oauth/subscriptions/updatePayment`,
      { body: JSON.stringify({ paymentToken }) }
    );
  }
}
