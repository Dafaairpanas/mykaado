import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, '../src/data/kotoba');
const outputDir = path.resolve(__dirname, '../kotoba_txt');

// Ensure output directories
const minnaOut = path.join(outputDir, 'minna');
const n3Out = path.join(outputDir, 'n3');
const irodoriOut = path.join(outputDir, 'irodori');

[outputDir, minnaOut, n3Out, irodoriOut].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let totalFiles = 0;
let totalLines = 0;

function convertFile(srcFile, destFile) {
  const content = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const lines = content.map(item => {
    const kanji = (item.kanji ?? '').trim();
    const kana = (item.kana ?? '').trim();
    const arti = (item.meaning ?? item.arti ?? '').trim();
    return `${kanji};${kana};${arti}`;
  });

  fs.writeFileSync(destFile, lines.join('\n') + '\n', 'utf8');
  totalFiles++;
  totalLines += lines.length;
}

console.log('Memulai konversi JSON kotoba ke TXT...');
const startTime = Date.now();

// 1. Minna
const minnaDir = path.join(baseDir, 'minna-migrated');
if (fs.existsSync(minnaDir)) {
  const files = fs.readdirSync(minnaDir).filter(f => f.endsWith('.json')).sort();
  for (const file of files) {
    const baseName = path.basename(file, '.json');
    convertFile(path.join(minnaDir, file), path.join(minnaOut, `${baseName}.txt`));
  }
}

// 2. N3
const n3Dir = path.join(baseDir, 'n3-migrated');
if (fs.existsSync(n3Dir)) {
  const files = fs.readdirSync(n3Dir).filter(f => f.endsWith('.json')).sort();
  for (const file of files) {
    const baseName = path.basename(file, '.json');
    convertFile(path.join(n3Dir, file), path.join(n3Out, `${baseName}.txt`));
  }
}

// 3. Irodori (A1, A2-1, A2-2)
const irodoriDir = path.join(baseDir, 'irodori-migrated');
if (fs.existsSync(irodoriDir)) {
  const levels = ['a1', 'a2-1', 'a2-2'];
  for (const level of levels) {
    const levelDir = path.join(irodoriDir, level);
    if (fs.existsSync(levelDir)) {
      const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json')).sort();
      for (const file of files) {
        const baseName = path.basename(file, '.json');
        convertFile(path.join(levelDir, file), path.join(irodoriOut, `${level}-${baseName}.txt`));
      }
    }
  }
}

// 4. Other root files (e.g. all_adj_na.json)
const rootFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.json')).sort();
for (const file of rootFiles) {
  const baseName = path.basename(file, '.json');
  convertFile(path.join(baseDir, file), path.join(outputDir, `${baseName}.txt`));
}

const elapsed = Date.now() - startTime;
console.log(`Konversi selesai dalam ${elapsed}ms!`);
console.log(`Total file TXT: ${totalFiles}`);
console.log(`Total baris kosakata: ${totalLines}`);
