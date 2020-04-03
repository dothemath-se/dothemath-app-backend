import prompts from 'prompts';
import path from 'path';
import { promises as fs} from 'fs';

import App from './app';

(async () => {

  const app = new App();
  await app.start();
  app.prompt();
  
})();

