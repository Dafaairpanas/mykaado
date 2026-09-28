import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../src/data');
const outputFilePath = path.resolve(__dirname, '../public/all-data.json');

const allData = {};

function readDirRecursive(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      readDirRecursive(filePath);
    } else if (file.endsWith('.json')) {
      const relativePath = path.relative(dataDir, filePath).replace(/\\/g, '/');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        allData[relativePath] = JSON.parse(fileContent);
      } catch (e) {
        console.error(`Failed to parse ${relativePath}`);
      }
    }
  }
}

console.log('Building all-data.json...');
readDirRecursive(dataDir);
fs.writeFileSync(outputFilePath, JSON.stringify(allData));
console.log(`Successfully built all-data.json with ${Object.keys(allData).length} files.`);
