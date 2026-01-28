import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import errorCodes from './errorCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const temporaryFileStoragePath = path.join(__dirname, '../../tmp');
const metaStorageFilePath = path.join(__dirname, '../../meta.json');

if (!fs.existsSync(temporaryFileStoragePath)) fs.mkdirSync(temporaryFileStoragePath);
if (!fs.existsSync(metaStorageFilePath)) fs.writeFileSync(metaStorageFilePath, JSON.stringify({}));

export default {
  temporaryFileStoragePath,
  metaStorageFilePath,

  user: {
    token: {
      expiryInSeconds: 86400,
    },
  },

  errorCodes,
};
