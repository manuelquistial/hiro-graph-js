import { Observable } from 'rxjs';
import fetch from 'isomorphic-fetch';

import { lucene, Lucene } from './lucene';
import { Config, ConfigOptions, HttpAPI, WebsocketAPI } from './config';
import { gremlin, GremlinQuery, GremlinQueryBuilder } from './gremlin';
import { ensureSlash } from './utils';

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

export class Client {
  readonly config: Config;
  private readonly token: string = '';

  constructor(endpointOrOptions: string | ConfigOptions, token?: string) {
    if (token) {
      this.token = token;
    }

    if (typeof endpointOrOptions === 'string') {
      this.config = new Config({ endpoint: endpointOrOptions });
    } else {
      this.config = new Config(endpointOrOptions);
    }
  }

  fetch<T>(api: HttpAPI, path?: string, init?: ApiRequest) {
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

    const url =
      this.config.endpoint + this.config.apis.http[api] + ensureSlash(path);

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
