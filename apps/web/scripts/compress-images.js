#!/usr/bin/env node
// compress-images.js
// Scans frontend/public for images and compresses JPEG/PNG/WebP using sharp.

const path = require('path');
const fs = require('fs/promises');
const { statSync } = require('fs');
const globby = require('globby');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const BACKUP_DIR = path.resolve(PUBLIC_DIR, '..', 'public-backup-' + Date.now());

async function ensureBackup() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create backup dir', e);
    process.exit(1);
  }
}

function isImage(file) {
  return /\.(jpe?g|png|webp)$/i.test(file);
}

async function compressFile(file) {
  const rel = path.relative(PUBLIC_DIR, file);
  const backupPath = path.join(BACKUP_DIR, rel);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(file, backupPath);

  const ext = path.extname(file).toLowerCase();
  const tempOut = file + '.tmp';

  try {
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(file)
        .jpeg({ quality: 72, mozjpeg: true })
        .toFile(tempOut);
    } else if (ext === '.png') {
      await sharp(file)
        .png({ quality: 72, compressionLevel: 9 })
        .toFile(tempOut);
    } else if (ext === '.webp') {
      await sharp(file)
        .webp({ quality: 72 })
        .toFile(tempOut);
    } else {
      return;
    }
    // Replace original
    await fs.rename(tempOut, file);
    const newSize = statSync(file).size;
    const oldSize = statSync(backupPath).size;
    console.log(`${rel} -> ${Math.round((oldSize - newSize)/1024)} KB saved`);
  } catch (err) {
    console.error('Failed to compress', rel, err);
    try { await fs.rm(tempOut); } catch {};
  }
}

async function main() {
  console.log('Searching for images in', PUBLIC_DIR);
  const patterns = ['**/*.{jpg,jpeg,png,webp}'];
  const files = await globby(patterns, { cwd: PUBLIC_DIR, absolute: true });
  if (files.length === 0) {
    console.log('No images found.');
    return;
  }
  console.log(`Found ${files.length} images. Backing up originals to ${BACKUP_DIR}`);
  await ensureBackup();

  for (const f of files) {
    try {
      await compressFile(f);
    } catch (e) {
      console.error('Error processing', f, e);
    }
  }

  console.log('Compression complete. Originals backed up at', BACKUP_DIR);
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
