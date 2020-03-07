import { map, catchError, switchMap } from 'rxjs/operators';

import Client from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client(
  'https://eu-stagegraph.arago.co',
  'aHya5sQKanWaL6RD79MZ2ff7BMvTMJ8GwSK8l0KKCth2EulXZ3bU4csdNRnT3A4V2bhAkq6DrQzrNPg2tQVngggEkVW0SghtuWC9EMmarmDMUgjkNVPFqLQ42hUq23AV',
);

const res = client.lucene(
  {
    'ogit/_id': 'cjuwixjvq0xfc1q90xqn8jsvf_cjuwixjvq0xfg1q90asxz9lba',
  },
  { limit: 1 },
);

res.pipe().subscribe({
  next: (res) => console.log(res),
  error: (res) => console.error(res),
});

// const res2 = client.gremlin(
//   'ck6rv3s91081w0l94n61j5gwe_ck70lejsahjev0l94fii10bf2',
//   (gremlin) =>
//     gremlin
//       .inE('ogit/relates')
//       .has('ogit/_out-type', 'ogit/Automation/AutomationIssue')
//       .outV(),
//   { limit: 1 },
// );

// res2.pipe().subscribe({
//   next: (res) => console.log(res),
//   error: (res) => console.error(res),
// });
