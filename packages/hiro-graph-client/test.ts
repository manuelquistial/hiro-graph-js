import { map, catchError, switchMap } from 'rxjs/operators';

import Client from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client(
  'https://ec2-52-210-153-20.eu-west-1.compute.amazonaws.com:8443',
  'RfcdwuGjiZmV9N1t8k3zvtZowD2b7QmRylDcvDzgwq3b5Y0iUsRKyPitTnpTVHWsk9fdGPWRgilzOIuJk0bn5zwm5jV2xFVhlD2QqgfIGFpgGdovcfZTOzZb8i2HS3HS',
);

const res = client.lucene(
  {
    'ogit/_type': 'ogit/Automation/KnowledgePool',
    'ogit/_scope': 'ck6rv3ied07w50l947ar3tt56_ck6rv3s91081w0l94n61j5gwe',
  },
  { limit: 1 },
);

res.pipe().subscribe({
  next: (res) => console.log(res),
  error: (res) => console.error(res),
});

const res2 = client.gremlin(
  'ck6rv3s91081w0l94n61j5gwe_ck70lejsahjev0l94fii10bf2',
  (gremlin) =>
    gremlin
      .inE('ogit/relates')
      .has('ogit/_out-type', 'ogit/Automation/AutomationIssue')
      .outV(),
  { limit: 1 },
);

res2.pipe().subscribe({
  next: (res) => console.log(res),
  error: (res) => console.error(res),
});
