import { fileURLToPath } from 'url';
import { task as folderBackupTask } from './folderBackup.script.js';
import { task as postgresBackupTask } from './postgresBackup.script.js';

export async function task() {
  await postgresBackupTask();
  await folderBackupTask();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task().catch(console.error);
}
