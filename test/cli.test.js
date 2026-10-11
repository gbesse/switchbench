import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const exec = promisify(execFile),
  cli = new URL('../bin/cli.js', import.meta.url).pathname;
test('CLI runs in each language, hashes evidence and never overwrites exports', async () => {
  for (const locale of ['fr', 'en', 'es']) {
    const r = JSON.parse(
      (await exec(process.execPath, [cli, 'demo', '--locale=' + locale])).stdout,
    );
    assert.equal(r.locale, locale);
    assert.match(r.evidence[0].sha256, /^[a-f0-9]{64}$/);
  }
  const dir = await mkdtemp(join(tmpdir(), 'atomic-cli-'));
  try {
    const file = join(dir, 'report.json');
    await exec(process.execPath, [cli, 'demo', '--output=' + file]);
    const original = await readFile(file, 'utf8');
    await assert.rejects(
      exec(process.execPath, [cli, 'demo', '--output=' + file]),
      (e) => e.code === 2,
    );
    assert.equal(await readFile(file, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  await assert.rejects(exec(process.execPath, [cli, 'demo', '--locale=de']), (e) => e.code === 2);
  await assert.rejects(exec(process.execPath, [cli, 'demo', '--unknown=1']), (e) => e.code === 2);
});
