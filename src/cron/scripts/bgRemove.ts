/**
 * Batch Background Remover - TypeScript
 * Removes backgrounds from images using @imgly/background-removal-node
 * Runs fully locally — no API key, no internet required.
 *
 * Usage:
 *   npx ts-node remove-background.ts
 *
 * Install deps:
 *   npm install typescript ts-node @types/node @imgly/background-removal-node
 *
 * Config: edit the CONFIG block below before running.
 */

import * as fs from 'fs';
import * as path from 'path';
import { removeBackground } from '@imgly/background-removal-node';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface AppConfig {
  inputDir: string;
  outputDir: string;
  extensions: string[];
  concurrency: number;
  skipExisting: boolean;
}

interface ErrorRecord {
  file: string;
  error: string;
}

interface ProcessingStats {
  done: number;
  skipped: number;
  failed: number;
  errors: ErrorRecord[];
}

// ─────────────────────────────────────────────
//  CONFIG — edit these values before running
// ─────────────────────────────────────────────
const CONFIG: AppConfig = {
  // Folder containing your source images
  inputDir: '/Users/r.p.raiyani/Desktop/gravis/files/files',

  // Folder where processed images will be saved (created automatically)
  outputDir: '/Users/r.p.raiyani/Desktop/gravis/files/files_no_bg',

  // Image extensions to process
  extensions: ['.jpg', '.jpeg', '.png', '.webp'],

  // How many images to process simultaneously
  concurrency: 5,

  // Skip images that have already been processed
  skipExisting: true,
};
// ─────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

function getImageFiles(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Input directory not found: ${path.resolve(dir)}`);
  }
  return fs
    .readdirSync(dir)
    .filter((f: string) => exts.includes(path.extname(f).toLowerCase()))
    .map((f: string) => path.join(dir, f));
}

function getOutputPath(inputFile: string, outputDir: string): string {
  const base = path.basename(inputFile, path.extname(inputFile));
  return path.join(outputDir, `${base}.png`);
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}

// ── Core: remove background from a single image ───────────────────────────────

async function processImage(inputFile: string, outFile: string): Promise<void> {
  // Let the library handle reading + MIME detection from the file path
  const resultBlob: Blob = await removeBackground(inputFile, {
    debug: false,
    progress: () => {}, // suppress per-image progress noise
  });

  const arrayBuffer: ArrayBuffer = await resultBlob.arrayBuffer();
  fs.writeFileSync(outFile, Buffer.from(arrayBuffer));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🖼  Batch Background Remover');
  console.log(`   Input dir  : ${path.resolve(CONFIG.inputDir)}`);
  console.log(`   Output dir : ${path.resolve(CONFIG.outputDir)}`);
  console.log(`   Concurrency: ${CONFIG.concurrency}\n`);

  // Prepare output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${CONFIG.outputDir}`);
  }

  // Collect images
  const files: string[] = getImageFiles(CONFIG.inputDir, CONFIG.extensions);
  console.log(`📂 Found ${files.length} image(s) to process.\n`);

  if (files.length === 0) {
    console.log('Nothing to do. Check your inputDir and extensions config.');
    return;
  }

  const stats: ProcessingStats = {
    done: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const tasks: Array<() => Promise<void>> = files.map(
    (file: string) => async (): Promise<void> => {
      const out = getOutputPath(file, CONFIG.outputDir);
      const label = path.basename(file);

      if (CONFIG.skipExisting && fs.existsSync(out)) {
        stats.skipped++;
        process.stdout.write(`⏭  Skipped (exists): ${label}\n`);
        return;
      }

      try {
        await processImage(file, out);
        stats.done++;
        const processed = stats.done + stats.skipped + stats.failed;
        const pct = ((processed / files.length) * 100).toFixed(1);
        process.stdout.write(`✅ [${pct}%] ${label} → ${path.basename(out)}\n`);
      } catch (err: unknown) {
        stats.failed++;
        const message = err instanceof Error ? err.message : String(err);
        stats.errors.push({ file: label, error: message });
        process.stdout.write(`❌ Failed: ${label} — ${message}\n`);
      }
    }
  );

  const startTime = Date.now();
  await runWithConcurrency(tasks, CONFIG.concurrency);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n─────────────────────────────────────');
  console.log(`🏁 Done in ${elapsed}s`);
  console.log(`   ✅ Processed : ${stats.done}`);
  console.log(`   ⏭  Skipped   : ${stats.skipped}`);
  console.log(`   ❌ Failed    : ${stats.failed}`);

  if (stats.errors.length > 0) {
    const logPath = path.join(CONFIG.outputDir, 'errors.log');
    const logContent = stats.errors
      .map((e: ErrorRecord) => `${e.file}: ${e.error}`)
      .join('\n');
    fs.writeFileSync(logPath, logContent);
    console.log(`\n⚠️  Error details saved to: ${logPath}`);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('\n💥 Fatal error:', message);
  process.exit(1);
});
