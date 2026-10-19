import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { translations, message } from '../src/i18n.js';
const demo = JSON.parse(await readFile(new URL('../fixtures/demo.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(demo);
test('all user copy has FR/EN/ES and identical placeholders', () => {
  for (const [key, values] of Object.entries(translations)) {
    assert.equal(values.length, 3, key);
    for (const value of values) assert.ok(value.trim(), key);
    const placeholders = (v) => [...v.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
    assert.deepEqual(placeholders(values[0]), placeholders(values[1]), key);
    assert.deepEqual(placeholders(values[0]), placeholders(values[2]), key);
  }
  assert.throws(() => message('notice', 'de'));
});
import { compareSwitches, simulateDevice } from '../src/index.js';
import { spiceNetlist, runNgspice } from '../src/spice.js';
test('50us generic relay has I squared R normal loss, not zero conduction loss', () => {
  const r = compareSwitches(demo);
  const d = r.devices.find((d) => d.id === 'fastRelay');
  assert.equal(d.normalConductionLossW, 4.5);
  assert.equal(d.contactOpeningUs, 80);
  assert.ok(d.currentExtinctionUs > d.contactOpeningUs);
});
test('analytical opening current matches independently derived RL equation', () => {
  const d = demo.devices[2],
    r = simulateDevice(demo, d),
    resistance = demo.faultResistanceOhm + d.onResistanceOhm;
  const expected =
    demo.busVoltageV / resistance +
    (demo.loadCurrentA - demo.busVoltageV / resistance) * Math.exp((-resistance * 80e-6) / 100e-6);
  assert.ok(Math.abs(r.peakCurrentA - expected) < 1e-9);
});
test('post-opening energy conserves magnetic energy plus source contribution', () => {
  for (const d of compareSwitches(demo).devices) {
    const available = d.inductiveEnergyAtOpeningJ + d.postOpeningSourceEnergyJ;
    const absorbed = d.clampEnergyJ + d.postOpeningLineHeatJ;
    assert.ok(Math.abs(available - absorbed) / available < 1e-9);
    assert.ok(d.trace.at(-1).currentA < 1e-8);
  }
});
test('longer detection increases peak fault current and clamp energy', () => {
  const a = compareSwitches(demo),
    b = compareSwitches({ ...demo, detectionUs: 100 });
  for (let i = 0; i < a.devices.length; i++) {
    assert.ok(b.devices[i].peakCurrentA > a.devices[i].peakCurrentA);
    assert.ok(b.devices[i].clampEnergyJ > a.devices[i].clampEnergyJ);
  }
});
test('localized reports share the same calculations and malformed physics is rejected', () => {
  assert.deepEqual(
    compareSwitches(demo, { locale: 'fr' }).devices,
    compareSwitches(demo, { locale: 'es' }).devices,
  );
  for (const changed of [
    { clampVoltageV: 800 },
    { inductanceUh: 0 },
    { busVoltageV: Infinity },
    { faultResistanceOhm: 1e-300 },
    { loadCurrentA: -1 },
    { devices: [...demo.devices, demo.devices[0]] },
  ])
    assert.throws(() => compareSwitches({ ...demo, ...changed }));
});
test('generated SPICE uses validated numeric values and matching time constants', () => {
  const text = spiceNetlist(demo);
  assert.match(text, /Lfault feed contact 100u IC=150/);
  assert.match(text, /Ron=0.0002/);
  assert.throws(() => spiceNetlist(demo, 'missing'));
});
test(
  'ngspice agrees with analytical ideal-switch current and clamp energy',
  { skip: !process.env.SWITCHBENCH_NGSPICE },
  async () => {
    for (const device of ['mechanical', 'solidState', 'fastRelay']) {
      const r = await runNgspice(demo, device, { executable: process.env.SWITCHBENCH_NGSPICE });
      assert.ok(r.relativePeakError < 0.01, JSON.stringify({ device, error: r.relativePeakError }));
      const expected = simulateDevice(
        demo,
        demo.devices.find((d) => d.id === device),
      );
      assert.ok(Math.abs(r.clampEnergyJ / expected.clampEnergyJ - 1) < 0.02);
    }
  },
);

test('comparison input evidence is detached from caller and generated report mutations', () => {
  const input = clone(),
    expected = structuredClone(input),
    report = compareSwitches(input);
  input.busVoltageV = 200;
  input.devices[0].openingUs = 1;
  assert.deepEqual(report.inputs, expected);
  report.inputs.devices[0].onResistanceOhm = 999;
  assert.notEqual(input.devices[0].onResistanceOhm, 999);
});
test('SPICE reference stays bound to the netlist after caller changes during execution', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'switchbench-fixture-'));
  try {
    const executable = join(dir, 'fixture-engine');
    const trace =
      'time i(Lfault) v(contact)\n' +
      Array.from({ length: 11 }, (_, i) => `${i * 0.00001} 150 1200`).join('\n');
    await writeFile(
      executable,
      '#!/usr/bin/env node\n' +
        "require('node:fs').writeFileSync('trace.dat'," +
        JSON.stringify(trace) +
        ');\n',
      { mode: 0o700 },
    );
    const input = clone(),
      expected = simulateDevice(
        input,
        input.devices.find((d) => d.id === 'fastRelay'),
      ).peakCurrentA;
    const pending = runNgspice(input, 'fastRelay', { executable });
    input.busVoltageV = 200;
    input.devices.find((d) => d.id === 'fastRelay').openingUs = 999;
    const result = await pending;
    assert.equal(result.analyticalPeakCurrentA, expected);
    assert.equal(result.trace.length, 11);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('uncopyable comparison metadata is rejected in each locale', () => {
  for (const locale of ['fr', 'en', 'es'])
    assert.throws(
      () => compareSwitches({ ...demo, callback() {} }, { locale }),
      (error) => error.message === message('invalidInput', locale),
    );
});

test('small-R clamp energy approaches the independently derived lossless limit', () => {
  const input = {
    ...clone(),
    busVoltageV: 10000,
    clampVoltageV: 20000,
    inductanceUh: 100000,
    faultResistanceOhm: 1e-5,
    loadCurrentA: 1e-6,
    detectionUs: 0,
  };
  const device = { id: 'limit', onResistanceOhm: 1e-9, openingUs: 0 };
  const result = simulateDevice(input, device);
  const magnetic = 0.5 * 0.1 * 1e-6 ** 2;
  const expected = (magnetic * 20000) / (20000 - 10000);
  assert.ok(result.clampEnergyJ > 0);
  assert.ok(Math.abs(result.clampEnergyJ / expected - 1) < 1e-10);
  assert.ok(
    Math.abs(
      (result.clampEnergyJ + result.postOpeningLineHeatJ) /
        (magnetic + result.postOpeningSourceEnergyJ) -
        1,
    ) < 1e-10,
  );
});
test('sub-ulp exponential changes do not erase the initial fault-current slope', () => {
  const input = {
    ...clone(),
    busVoltageV: 10000,
    clampVoltageV: 20000,
    inductanceUh: 100000,
    faultResistanceOhm: 1e-5,
    loadCurrentA: 0,
    detectionUs: 1e-9,
  };
  const result = simulateDevice(input, { id: 'slope', onResistanceOhm: 1e-9, openingUs: 0 });
  const expected = (10000 / 0.1) * 1e-15;
  assert.ok(Math.abs(result.peakCurrentA / expected - 1) < 1e-12);
  assert.ok(result.faultI2tA2S > 0);
});
test('energy balance stays consistent across small and large dimensionless ratios', () => {
  for (const current of [1e-6, 150, 1e6])
    for (const resistance of [1e-5, 1, 1e6])
      for (const inductance of [0.001, 100000]) {
        const input = {
          ...clone(),
          busVoltageV: 10000,
          clampVoltageV: 20000,
          loadCurrentA: current,
          faultResistanceOhm: resistance,
          inductanceUh: inductance,
          detectionUs: 30,
        };
        const result = simulateDevice(input, { id: 'grid', onResistanceOhm: 1e-9, openingUs: 50 });
        const available = result.inductiveEnergyAtOpeningJ + result.postOpeningSourceEnergyJ;
        assert.ok(
          Math.abs((result.clampEnergyJ + result.postOpeningLineHeatJ) / available - 1) < 1e-9,
        );
      }
});
