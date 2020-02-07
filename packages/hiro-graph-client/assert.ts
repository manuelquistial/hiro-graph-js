import { client } from 'websocket';

interface DataMap {
  key: string;
  type: 'string' | 'number' | 'boolean';
  optional?: boolean;
}

type GetType<
  T extends DataMap['type'],
  O extends boolean | undefined
> = T extends 'string'
  ? O extends true
    ? string | undefined
    : string
  : T extends 'number'
  ? O extends true
    ? number | undefined
    : number
  : T extends 'boolean'
  ? O extends true
    ? boolean | undefined
    : boolean
  : any;

const assertResponse = <
  A extends Record<string, any>,
  E extends Record<string, DataMap>
>(
  expected: E,
) => (actual: A) => {
  const result: any = {};
  const keys = Object.keys(expected);

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const { key, type, optional } = expected[k];
    const value = actual[key];

    if (value) {
      if (typeof value === type) {
        result[k] = value;
      } else {
        throw new TypeError(`'${key}' should be of type '${type}'`);
      }
    } else if (!optional) {
      throw new TypeError(`'${key}' missing`);
    }
  }

  return result as {
    [K in keyof E]: GetType<E[K]['type'], E[K]['optional']>;
  };
};

const assertIsAccount = assertResponse({
  name: {
    key: 'ogit/name',
    type: 'string',
  },
  size: {
    key: '/size',
    type: 'number',
    optional: true,
  },
});

const account = assertIsAccount({
  'ogit/name': 'MyName',
});

console.table(account);
