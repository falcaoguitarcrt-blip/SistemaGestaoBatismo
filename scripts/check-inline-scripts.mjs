import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const htmlPath = path.resolve('index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('ERRO: index.html não encontrado na raiz.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scriptTag = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'batismo-script-check-'));
let count = 0;
let failures = 0;
let match;

try {
  while ((match = scriptTag.exec(html)) !== null) {
    const attributes = match[1] || '';
    const code = match[2] || '';
    if (/\bsrc\s*=/.test(attributes) || !code.trim()) continue;

    const isModule = /\btype\s*=\s*["']module["']/i.test(attributes);
    const extension = isModule ? '.mjs' : '.cjs';
    const file = path.join(tempDir, 'inline-' + count + extension);
    fs.writeFileSync(file, code, 'utf8');

    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      failures += 1;
      console.error('FALHOU: script inline #' + count + (isModule ? ' (module)' : ''));
      if (result.stderr) console.error(result.stderr.trim());
      if (result.stdout) console.error(result.stdout.trim());
    } else {
      console.log('OK: script inline #' + count + (isModule ? ' (module)' : ''));
    }
    count += 1;
  }

  if (count === 0) {
    console.error('ERRO: nenhum script inline foi encontrado para validar.');
    process.exitCode = 1;
  } else if (failures > 0) {
    console.error('Falha de sintaxe em ' + failures + ' de ' + count + ' scripts inline.');
    process.exitCode = 1;
  } else {
    console.log('Validação de sintaxe concluída: ' + count + ' scripts inline válidos.');
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
