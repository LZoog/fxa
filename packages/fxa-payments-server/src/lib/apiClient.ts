import { Config, defaultConfig } from './config';

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

let accessToken = '';
let config: Config = defaultConfig();

export function updateAPIClientConfig(configFromMeta: any) {
  config = configFromMeta;
}

export function updateAPIClientToken(token: string) {
  accessToken = token;
}

async function apiFetch(
  method: string,
  path: string,
  options: APIFetchOptions = {}
) {
  const response = await fetch(path, {
    mode: 'cors',
    credentials: 'omit',
    method,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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

export function getProfile() {
  return apiFetch('GET', `${config.servers.profile.url}/v1/profile`);
}

export function getPlans() {
  return apiFetch(
    'GET',
    `${config.servers.auth.url}/v1/oauth/subscriptions/plans`
  );
}

export function getSubscriptions() {
  return apiFetch(
    'GET',
    `${config.servers.auth.url}/v1/oauth/subscriptions/active`
  );
}

export function getToken() {
  return apiFetch('POST', `${config.servers.oauth.url}/v1/introspect`, {
    body: JSON.stringify({
      token: accessToken,
    }),
  });
}

export function getCustomer() {
  return apiFetch(
    'GET',
    `${config.servers.auth.url}/v1/oauth/subscriptions/customer`
  );
}

export function createSubscription(params: {
  paymentToken: string;
  planId: string;
  displayName: string;
}) {
  return apiFetch(
    'POST',
    `${config.servers.auth.url}/v1/oauth/subscriptions/active`,
    {
      body: JSON.stringify({
        ...params,
      }),
    }
  );
}

export function cancelSubscription(subscriptionId: string) {
  return apiFetch(
    'DELETE',
    `${config.servers.auth.url}/v1/oauth/subscriptions/active/${subscriptionId}`
  );
}

export function reactivateSubscription(subscriptionId: string) {
  return apiFetch(
    'POST',
    `${config.servers.auth.url}/v1/oauth/subscriptions/reactivate`,
    { body: JSON.stringify({ subscriptionId }) }
  );
}

export function updatePayment(paymentToken: string) {
  return apiFetch(
    'POST',
    `${config.servers.auth.url}/v1/oauth/subscriptions/updatePayment`,
    { body: JSON.stringify({ paymentToken }) }
  );
}
