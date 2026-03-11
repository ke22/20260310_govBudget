import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 50 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

const paths = [
  '/index.html',
  '/budget.html?q=%E5%9C%8B%E9%98%B2',
  '/legislators.html',
  '/other.html',
  '/styles_vs.css',
  '/main_vs.js',
  '/vs-modules/dom-map.js',
  '/vs-modules/navigation-state.js',
  '/vs-modules/data-contract.js',
  '/vs-modules/data-loader.js',
  '/vs-modules/search-engine.js',
  '/vs-modules/dashboard-renderers.js',
  '/vs-modules/modal-renderers.js',
  '/data_page_a.json',
  '/data_page_b.json',
  '/data_page_c.json',
  '/data_page_d.json'
];

export default function () {
  const idx = Math.floor(Math.random() * paths.length);
  const url = `${BASE_URL}${paths[idx]}`;
  const res = http.get(url, { redirects: 2, tags: { name: paths[idx] } });

  check(res, {
    'status is 200/304': r => r.status === 200 || r.status === 304
  });

  sleep(Math.random() * 0.6 + 0.2);
}

