#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compareSwitches } from '../src/index.js';
import { message } from '../src/i18n.js';
import { spiceNetlist, runNgspice } from '../src/spice.js';
const args = process.argv.slice(2),
  flags = {},
  positional = [];
for (const arg of args) {
  if (arg.startsWith('--') && arg.includes('=')) {
    const i = arg.indexOf('=');
    if (Object.hasOwn(flags, arg.slice(2, i))) flags.invalid = true;
    flags[arg.slice(2, i)] = arg.slice(i + 1);
  } else if (arg.startsWith('--')) flags.invalid = true;
  else positional.push(arg);
}
const locale = flags.locale ?? 'fr';
const permitted = ['locale', 'output', 'device'];
try {
  message('invalidInput', locale);
  if (Object.keys(flags).some((k) => !permitted.includes(k)))
    throw Error(message('failure', locale));
  const [command, file] = positional;
  if (!command || command === 'help') {
    console.log(message('cliUsage', locale, { name: 'switchbench' }));
    console.log(message('spiceUsage', locale));
  } else {
    const allowed = ['demo', 'run', 'netlist', 'spice'];
    if (
      !allowed.includes(command) ||
      positional.length > (command === 'demo' ? 1 : 2) ||
      (command !== 'demo' && !file)
    )
      throw Error(message('failure', locale));
    const raw = await readFile(
      command === 'demo' ? new URL('../fixtures/demo.json', import.meta.url) : file,
    );
    if (raw.length > 5000000) throw Error(message('invalidInput', locale));
    const input = JSON.parse(raw.toString('utf8'));
    const evidence = [
      { role: 'input', sha256: createHash('sha256').update(raw).digest('hex'), bytes: raw.length },
    ];
    if (command === 'netlist') {
      const text = spiceNetlist(input, flags.device ?? input.devices?.[0]?.id, { locale });
      if (flags.output) await writeFile(flags.output, text, { flag: 'wx', mode: 0o600 });
      else process.stdout.write(text);
    } else {
      const report =
        command === 'spice'
          ? await runNgspice(input, flags.device ?? input.devices?.[0]?.id, { locale })
          : compareSwitches(input, { locale });
      report.evidence = evidence;
      const text = JSON.stringify(report, null, 2) + '\n';
      if (flags.output) await writeFile(flags.output, text, { flag: 'wx', mode: 0o600 });
      else process.stdout.write(text);
    }
  }
} catch (e) {
  const safeLocale = ['fr', 'en', 'es'].includes(locale) ? locale : 'fr';
  console.error(
    e.code === 'EEXIST'
      ? message('noOverwrite', safeLocale)
      : e instanceof SyntaxError
        ? message('invalidJson', safeLocale)
        : e.message?.includes(' / ')
          ? e.message
          : message('failure', safeLocale) +
            ' ' +
            (e.code ? message('invalidInput', safeLocale) : e.message),
  );
  process.exitCode = 2;
}
