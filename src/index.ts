import * as Sentry from '@sentry/node';
import App from './app';

Sentry.init({ dsn: 'https://a63d74f600b4405fb2c93587717194ce@o376267.ingest.sentry.io/5196889' });

(async () => {

  const app = new App();
  await app.start();
  
})();
