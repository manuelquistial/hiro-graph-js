import { Observable } from 'rxjs';
import fetch from 'isomorphic-fetch';

import Token from '../token';

export type SupportedAPI =
  | 'app'
  | 'auth'
  | 'events'
  | 'graph'
  | 'graphWS'
  | 'iam'
  | 'ki'
  | 'variables';

export type ApiRequest = RequestInit & { json?: object };

export class API {
  readonly url: string;
  static readonly apis: Record<SupportedAPI, string> = {
    app: '/api/app/7.0',
    auth: '/api/auth/6.1',
    events: '/api/events-ws/6.1',
    graph: '/api/graph/7.1',
    graphWS: '/api/graph-ws/6.1',
    iam: '/api/iam/6.1',
    ki: '/api/ki/6',
    variables: '/api/variables/6',
  };

  constructor(url: string) {
    this.url = url;
  }

  static set(apis?: Record<SupportedAPI, string>) {
    if (!apis) {
      return;
    }

    const keys = Object.keys(apis) as SupportedAPI[];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Ensure correct slashes
      API.apis[key] = apis[key].startsWith('/') ? apis[key] : `/${apis[key]}`;
      API.apis[key] = API.apis[key].replace(/\/$/, '');
    }
  }

  protected request<T>(api: SupportedAPI, path?: string, init?: ApiRequest) {
    const options = {
      headers: {},
      ...(init || {}),
    };

    if (options.json) {
      options.body = JSON.stringify(options.json);

      // @ts-ignore
      options.headers['Content-Type'] = 'application/json';
    }

    // @ts-ignore
    options.headers['Authorization'] = `Bearer ${Token.get()}`;
    // @ts-ignore
    options.withCredentials = true;
    options.credentials = 'include';

    let url = this.url + API.apis[api];

    if (path) {
      url += path.startsWith('/') ? path : `/${path}`;
    }

    return new Observable<T>((subscriber) => {
      fetch(url, options)
        .then((res) => res.json())
        .then((res) => subscriber.next(res))
        .catch((err) => subscriber.error(err))
        .finally(() => subscriber.complete());
    });
  }
}
