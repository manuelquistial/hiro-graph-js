import { Observable } from 'rxjs';
import fetch from 'isomorphic-fetch';

import { lucene, Lucene } from './lucene';
import { gremlin, GremlinQuery, GremlinQueryBuilder } from './gremlin';

export interface LuceneQueryOptions {
  limit?: number;
  offset?: number;
}

export interface GremlinQueryOptions {
  limit?: number;
  offset?: number;
}

type GremlinQueryFunction = (
  gremlin: GremlinQueryBuilder,
) => GremlinQueryBuilder;

export type ApiRequest = RequestInit & { json?: object };

export type SupportedWSAPI = 'events' | 'graph';

export type SupportedHTTPAPI =
  | 'app'
  | 'auth'
  | 'events'
  | 'graph'
  | 'iam'
  | 'ki'
  | 'variables';

interface APIs {
  http?: Partial<Record<SupportedHTTPAPI, string>>;
  ws?: Partial<Record<SupportedWSAPI, string>>;
}

export interface ClientOptions {
  endpoint: string;
  apis?: APIs;
}

const ensureSlash = (value?: string) => {
  if (!value) {
    return '';
  }

  let v = value;

  if (v.startsWith('http')) {
    return v;
  }

  if (!v.startsWith('/')) {
    v = `/${v}`;
  }

  if (v.endsWith('/')) {
    v = v.replace(/\/+$/, '');
  }

  return v;
};

export class Client {
  readonly endpoint: string;
  private readonly _http: Record<SupportedHTTPAPI, string> = {
    app: '/api/app/7.0',
    auth: '/api/auth/6.1',
    events: '/api/events-ws/6.1',
    graph: '/api/graph/7.1',
    iam: '/api/iam/6.1',
    ki: '/api/ki/6',
    variables: '/api/variables/6',
  };
  private readonly _ws: Record<SupportedWSAPI, string> = {
    events: '/api/events-ws/6.1',
    graph: '/api/graph-ws/7.1',
  };
  private readonly token: string = '';

  constructor(endpointOrOptions: string | ClientOptions, token?: string) {
    if (token) {
      this.token = token;
    }

    if (typeof endpointOrOptions === 'string') {
      this.endpoint = ensureSlash(endpointOrOptions);
    } else {
      this.endpoint = endpointOrOptions.endpoint;
      this.apis = endpointOrOptions.apis || {};
    }
  }

  set apis(apis: APIs) {
    for (const name in apis.http) {
      this._http[name as SupportedHTTPAPI] = ensureSlash(
        apis.http[name as SupportedHTTPAPI],
      );
    }

    for (const name in apis.ws) {
      this._ws[name as SupportedWSAPI] = ensureSlash(
        apis.ws[name as SupportedWSAPI],
      );
    }
  }

  fetch<T>(api: SupportedHTTPAPI, path?: string, init?: ApiRequest) {
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
    options.headers['Authorization'] = `Bearer ${this.token}`;
    // @ts-ignore
    options.withCredentials = true;
    options.credentials = 'include';

    const url = this.endpoint + this._http[api] + ensureSlash(path);

    return new Observable<T>((subscriber) => {
      fetch(url, options)
        .then((res) => res.json())
        .then((res) => subscriber.next(res))
        .catch((err) => subscriber.error(err))
        .finally(() => subscriber.complete());
    });
  }

  lucene<T>(query: Lucene.Query, options: LuceneQueryOptions = {}) {
    const { querystring, placeholders } = lucene(query);

    return this.fetch<T>('graph', '/query/vertices', {
      method: 'POST',
      json: {
        query: querystring,
        ...options,
        ...placeholders,
      },
    });
  }

  gremlin<T>(
    root: string,
    query: GremlinQuery | GremlinQueryFunction,
    options: GremlinQueryOptions = {},
  ) {
    const _query =
      typeof query === 'function' ? query(gremlin('')) : gremlin(query);

    return this.fetch<T>('graph', '/query/gremlin', {
      method: 'POST',
      json: {
        root,
        query: _query.toString(),
        ...options,
      },
    });
  }
}
