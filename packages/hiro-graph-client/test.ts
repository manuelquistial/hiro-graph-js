import { map, catchError, switchMap } from 'rxjs/operators';

import Client, { OGIT } from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client(
  'https://eu-stagegraph.arago.co',
  'oQx39UXVL6BAmXvKwfHIU8rm3G1C3hSXUrcefygR9ttzh1nk41YStq1Cz51J53PpXRd03SlGiWvpJfhoZ9dIDSC3g1DvDHT3c50ST2igvww0PzHcqJR0tqZqX6Zu2NCP',
);

client
  .lucene<OGIT.Auth.Organization>(
    {
      'ogit/_id': 'cjuwixjvq0xfc1q90xqn8jsvf_cjuwixjvq0xfg1q90asxz9lba',
    },
    { limit: 1 },
  )
  //.pipe(map((res) => res.body && res.body['ogit/_id']))
  .subscribe({
    next: (res) => console.log(res),
    error: (res) => console.error(res),
  });

client
  .gremlin<number>(
    'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
    (gremlin) =>
      gremlin
        .inE('ogit/Auth/isMemberOf')
        .has('ogit/_out-type', 'ogit/Auth/Account')
        .outV()
        .count(),
    { limit: 1 },
  )
  //.pipe(map((res) => res.body))
  .subscribe({
    next: (res) => console.log(res),
    error: (res) => console.error(res),
  });
