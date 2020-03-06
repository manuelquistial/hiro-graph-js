export type GraphPath =
  | 'app'
  | 'auth'
  | 'events'
  | 'graph'
  | 'graphWS'
  | 'iam'
  | 'ki'
  | 'variables';

class _Paths {
  static readonly value: Record<GraphPath, string> = {
    app: '/api/app/7.0',
    auth: '/api/auth/6.1',
    events: '/api/events-ws/6.1',
    graph: '/api/graph/7.1',
    graphWS: '/api/graph-ws/6.1',
    iam: '/api/iam/6.1',
    ki: '/api/ki/6',
    variables: '/api/variables/6',
  };

  set(paths?: Record<GraphPath, string>) {
    if (!paths) {
      return;
    }

    const keys = Object.keys(paths) as GraphPath[];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Ensure correct slashes
      _Paths.value[key] = paths[key].startsWith('/')
        ? paths[key]
        : `/${paths[key]}`;
      _Paths.value[key] = _Paths.value[key].replace(/\/$/, '');
    }
  }

  get() {
    return _Paths.value;
  }
}

export const Paths = new _Paths();

export default Paths;
