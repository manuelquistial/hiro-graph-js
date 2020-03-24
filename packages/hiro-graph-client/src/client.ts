import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { map, filter, catchError } from 'rxjs/operators';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import fetch from 'isomorphic-fetch';
import { w3cwebsocket } from 'websocket';

import { lucene, Lucene } from './lucene';
import { Config, ConfigOptions, HttpAPI, WebsocketAPI } from './config';
import { gremlin, GremlinQuery, GremlinQueryBuilder } from './gremlin';
import { ensureSlash } from './utils';
import { Token } from './token';

export interface LuceneQueryOptions {
  limit?: number;
  offset?: number;
}

export interface GremlinQueryOptions {
  limit?: number;
  offset?: number;
}

type GraphRequestType =
  | 'get'
  | 'ids'
  | 'create'
  | 'update'
  | 'replace'
  | 'delete'
  | 'connect'
  | 'disconnect'
  | 'query'
  | 'writets'
  | 'streamts'
  | 'history'
  | 'getme';

type GremlinQueryFunction = (
  gremlin: GremlinQueryBuilder,
) => GremlinQueryBuilder;

export type ApiRequest = RequestInit & { json?: object };

export class Client {
  readonly config: Config;

  // @todo Move token to rxjs subject
  private readonly token: Token;
  private connections: Partial<
    Record<WebsocketAPI, WebSocketSubject<any>>
  > = {};

  constructor(endpointOrOptions: string | ConfigOptions, token?: string) {
    this.token = new Token(token);

    if (typeof endpointOrOptions === 'string') {
      this.config = new Config({ endpoint: endpointOrOptions });
    } else {
      this.config = new Config(endpointOrOptions);
    }
  }

  async fetch<T>(api: HttpAPI, path?: string, init?: ApiRequest) {
    const options = {
      headers: {},
      ...(init || {}),
    };

    if (options.json) {
      options.body = JSON.stringify(options.json);

      // @ts-ignore
      options.headers['Content-Type'] = 'application/json';
    }

    const token = this.token.get();

    // @ts-ignore
    options.headers['Authorization'] = `Bearer ${token}`;
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

  private createWebsocket(api: WebsocketAPI) {
    let connection: WebSocketSubject<any>;

    if (!this.connections[api]) {
      connection = webSocket({
        url: this.config.getUrl('ws', api),
        WebSocketCtor: w3cwebsocket as any,
        protocol: ['graph-2.0.0', `token-${this.token.get()}`],
      });

      this.connections[api] = connection;
    } else {
      connection = this.connections[api] as any;
    }

    if (!connection) {
      throw Error(`No connection exists for ${api}`);
    }

    return connection;
  }

  request<T, R extends GraphRequestType = GraphRequestType>(
    api: WebsocketAPI,
    type: R,
    body: object,
    headers: object = {},
  ) {
    const id = uuid();

    const subject$ = new Subject<{
      id: string;
      more: boolean;
      multi: boolean;
      body: T | null;
    }>();

    const connection = this.createWebsocket(api);

    connection
      .pipe(
        catchError((err) =>
          of({ error: { message: err.reason, code: err.code } }),
        ),
        map((res) => {
          if (res.error) {
            throw res.error;
          }

          return res;
        }),
        filter((res) => res.id === id),
      )
      .subscribe({
        next: (res) => {
          subject$.next(res);

          if (!res.more) {
            subject$.complete();
          }
        },
        error: (err) => subject$.error(err),
      });

    connection.next({
      _TOKEN: this.token.get(),
      id,
      type,
      headers,
      body,
    });

    return subject$;
  }

  lucene<T>(query: Lucene.Query, options: LuceneQueryOptions = {}) {
    const { querystring, placeholders } = lucene(query);

    return this.request<T>(
      'graph',
      'query',
      {
        query: querystring,
        ...options,
        ...placeholders,
      },
      {
        type: 'vertices',
      },
    );
  }

  gremlin<T>(
    root: string,
    query: GremlinQuery | GremlinQueryFunction,
    options: GremlinQueryOptions = {},
  ) {
    const _query =
      typeof query === 'function' ? query(gremlin('')) : gremlin(query);

    return this.request<T>(
      'graph',
      'query',
      {
        root,
        query: _query.toString(),
        ...options,
      },
      {
        type: 'gremlin',
      },
    );
  }
}
