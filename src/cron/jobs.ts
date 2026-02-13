import cron from 'node-cron';
import env from '@/config/env.js';

import { task as folderBackupTask } from './scripts/folderBackup.script.js';
import { task as postgresBackupTask } from './scripts/postgresBackup.script.js';
import { task as flushUnTrackedFilesTask } from './scripts/flushUnTrackedFiles.script.js';
import { task as flushFilesTask } from './scripts/flushFiles.script.js';

const isProduction = env.env === 'prod';

console.log('⏱ Backup scheduler started...');


/**
# ┌────────────── second (optional)
# │ ┌──────────── minute
# │ │ ┌────────── hour
# │ │ │ ┌──────── day of month
# │ │ │ │ ┌────── month
# │ │ │ │ │ ┌──── day of week
# │ │ │ │ │ │
# │ │ │ │ │ │
# * * * * * *
*/

// Run at midnight every 10 days
export const FlushUnTrackedFilesJob = isProduction ?
  cron.createTask('0 0 */10 * *', './scripts/flushUnTrackedFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 0 */10 * *', flushUnTrackedFilesTask, { timezone: 'Asia/Kolkata', });

// Run at 2:00 AM every 3 days
export const FlushFilesJob = isProduction ?
  cron.createTask('0 2 */3 * *', './scripts/flushFiles.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 2 */3 * *', flushFilesTask, { timezone: 'Asia/Kolkata', });

// Daily 1:30 AM
export const FolderBackupJob = isProduction?
  cron.createTask('30 1 * * *', './scripts/folderBackup.script.js', { timezone: 'Asia/Kolkata', }):
  cron.createTask('30 1 * * *', folderBackupTask, { timezone: 'Asia/Kolkata', });

// Daily 2:00 AM
export const PostgresBackupJob = isProduction ?
  cron.createTask('0 2 * * *', './scripts/postgresBackup.script.js', { timezone: 'Asia/Kolkata', }) :
  cron.createTask('0 2 * * *', postgresBackupTask, { timezone: 'Asia/Kolkata', });
