import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { validateScenario, simulateDevice } from './index.js';
import { message } from './i18n.js';
import { requireValue } from './validate.js';
const exec = promisify(execFile);

export function spiceNetlist(input, id = 'fastRelay', { locale = 'fr' } = {}) {
  validateScenario(input, locale);
  const d = input.devices.find((d) => d.id === id);
  requireValue(d, locale);
  const reference = simulateDevice(input, d, { locale });
  const cutS = reference.contactOpeningUs * 1e-6;
  // 1 ns gate edges and finite switch off-resistance regularize the ideal analytical model.
  const horizon = Math.max(reference.currentExtinctionUs * 1e-6 * 1.1, 0.00001);
  const step = Math.max(horizon / 200000, Math.min(horizon / 4000, Math.max(cutS / 100, 1e-9)));
  return `SwitchBench: ${message('notice', locale)}
Vbus bus 0 ${input.busVoltageV}
Rline bus feed ${input.faultResistanceOhm}
Lfault feed contact ${input.inductanceUh}u IC=${input.loadCurrentA}
Scontact contact 0 gate 0 SW
.model SW SW(Ron=${d.onResistanceOhm} Roff=1e12 Vt=0.5 Vh=0)
Vgate gate 0 PULSE(1 0 ${Math.max(cutS, 1e-9)} 1n 1n ${horizon * 2} ${horizon * 4})
Vclamp clamp 0 ${input.clampVoltageV}
Dclamp contact clamp DC
.model DC D(Is=1e-12 N=0.01 Rs=0.001)
.options reltol=1e-5 abstol=1e-10
.tran ${step} ${horizon} 0 ${step} uic
.control
run
set wr_singlescale
set wr_vecnames
wrdata trace.dat i(Lfault) v(contact)
quit
.endc
.end
`;
}

export async function runNgspice(
  input,
  id = 'fastRelay',
  { locale = 'fr', executable = 'ngspice' } = {},
) {
  const executablePath = /[\\/]/.test(executable) ? resolve(executable) : executable;
  const netlist = spiceNetlist(input, id, { locale });
  const dir = await mkdtemp(join(tmpdir(), 'switchbench-'));
  try {
    await writeFile(join(dir, 'scenario.cir'), netlist, { mode: 0o600 });
    try {
      await exec(executablePath, ['-b', 'scenario.cir'], {
        cwd: dir,
        timeout: 30000,
        maxBuffer: 2e6,
      });
    } catch (e) {
      throw Error(message(e.code === 'ENOENT' ? 'spiceMissing' : 'spiceFailure', locale));
    }
    let text;
    try {
      text = await readFile(join(dir, 'trace.dat'), 'utf8');
    } catch {
      throw Error(message('spiceFailure', locale));
    }
    const trace = text
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim().split(/\s+/).map(Number))
      .map(([time, currentA, contactVoltageV]) => ({
        timeUs: time * 1e6,
        currentA,
        contactVoltageV,
      }));
    requireValue(
      trace.length > 10 && trace.every((p) => Object.values(p).every(Number.isFinite)),
      locale,
      'spiceFailure',
    );
    const reference = simulateDevice(
      input,
      input.devices.find((d) => d.id === id),
      { locale },
    );
    const peakCurrentA = trace.reduce((max, p) => Math.max(max, p.currentA), 0);
    const clampEnergyJ = trace.slice(1).reduce((s, p, i) => {
      const prev = trace[i],
        dt = (p.timeUs - prev.timeUs) * 1e-6;
      return (
        s +
        (input.clampVoltageV *
          dt *
          (Math.max(0, p.contactVoltageV >= input.clampVoltageV ? p.currentA : 0) +
            Math.max(0, prev.contactVoltageV >= input.clampVoltageV ? prev.currentA : 0))) /
          2
      );
    }, 0);
    return {
      schemaVersion: 1,
      locale,
      project: 'SwitchBench',
      notice: message('notice', locale),
      engine: 'ngspice',
      device: id,
      peakCurrentA,
      clampEnergyJ,
      analyticalPeakCurrentA: reference.peakCurrentA,
      relativePeakError: Math.abs(peakCurrentA / reference.peakCurrentA - 1),
      trace,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
