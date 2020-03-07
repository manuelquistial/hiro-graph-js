import { ensureSlash } from './utils';

export type WebsocketAPI = 'events' | 'graph';

export type HttpAPI = 'app' | 'auth' | 'graph' | 'iam' | 'ki' | 'variables';

interface APIs {
  http: Record<HttpAPI, string>;
  ws: Record<WebsocketAPI, string>;
}

export interface ConfigOptions {
  endpoint?: string;
  apis?: {
    http?: Partial<Record<HttpAPI, string>>;
    ws?: Partial<Record<WebsocketAPI, string>>;
  };
}

export class Config {
  public readonly endpoint: string;

  public readonly apis: APIs = {
    http: {
      app: '/api/app/7.0',
      auth: '/api/auth/6.1',
      graph: '/api/graph/7.1',
      iam: '/api/iam/6.1',
      ki: '/api/ki/6',
      variables: '/api/variables/6',
    },
    ws: {
      events: '/api/events-ws/6.1',
      graph: '/api/graph-ws/6.1',
    },
  };

  constructor(options: ConfigOptions) {
    this.endpoint = ensureSlash(options.endpoint);

    if (options.apis) {
      for (const name in options.apis.http) {
        this.apis.http[name as HttpAPI] = ensureSlash(
          options.apis.http[name as HttpAPI],
        );
      }

      for (const name in options.apis.ws) {
        this.apis.ws[name as WebsocketAPI] = ensureSlash(
          options.apis.ws[name as WebsocketAPI],
        );
      }
    }
  }

  getUrl<T extends 'ws' | 'http'>(type: T, api: GetAPIType<T>, path?: string) {
    const baseUrl =
      type === 'ws' ? this.endpoint.replace(/^http/, 'ws') : this.endpoint;

    // @ts-ignore
    return baseUrl + this.apis[type][api] + ensureSlash(path);
  }
}

type GetAPIType<T> = T extends 'ws'
  ? WebsocketAPI
  : T extends 'http'
  ? HttpAPI
  : undefined;
