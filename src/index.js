import { message } from './i18n.js';
import { requireValue, positive, nonnegative, object } from './validate.js';

export function validateScenario(input, locale = 'fr') {
  requireValue(
    object(input) && input.schemaVersion === 1 && ['synthetic', 'user'].includes(input.origin),
    locale,
  );
  requireValue(
    ['busVoltageV', 'clampVoltageV', 'inductanceUh', 'faultResistanceOhm'].every((k) =>
      positive(input[k]),
    ),
    locale,
  );
  requireValue(
    nonnegative(input.loadCurrentA) &&
      input.loadCurrentA <= 1000000 &&
      nonnegative(input.detectionUs) &&
      input.clampVoltageV > input.busVoltageV,
    locale,
  );
  requireValue(
    input.busVoltageV >= 1 &&
      input.busVoltageV <= 10000 &&
      input.clampVoltageV <= 20000 &&
      input.inductanceUh >= 0.001 &&
      input.inductanceUh <= 100000 &&
      input.faultResistanceOhm >= 0.00001 &&
      input.faultResistanceOhm <= 1000000 &&
      input.detectionUs <= 100000,
    locale,
  );
  requireValue(
    Array.isArray(input.devices) && input.devices.length > 0 && input.devices.length <= 10,
    locale,
  );
  const ids = new Set();
  for (const d of input.devices) {
    requireValue(
      object(d) &&
        typeof d.id === 'string' &&
        /^[a-zA-Z0-9_-]{1,64}$/.test(d.id) &&
        !ids.has(d.id) &&
        positive(d.onResistanceOhm) &&
        d.onResistanceOhm >= 1e-9 &&
        d.onResistanceOhm <= 1000 &&
        nonnegative(d.openingUs) &&
        d.openingUs <= 100000,
      locale,
    );
    ids.add(d.id);
  }
  return input;
}

const integral = (a, b, k, t) => a * t + (b * -Math.expm1(-k * t)) / k;
const integralSquare = (a, b, k, t) =>
  a * a * t + (2 * a * b * -Math.expm1(-k * t)) / k + (b * b * -Math.expm1(-2 * k * t)) / (2 * k);

export function simulateDevice(input, device, { locale = 'fr' } = {}) {
  validateScenario({ ...input, devices: [device] }, locale);
  const l = input.inductanceUh * 1e-6,
    r = input.faultResistanceOhm + device.onResistanceOhm;
  const cutS = (input.detectionUs + device.openingUs) * 1e-6;
  const steady = input.busVoltageV / r;
  const onCurrent = (t) => steady + (input.loadCurrentA - steady) * Math.exp((-r * t) / l);
  const cutCurrentA = onCurrent(cutS);
  const offR = input.faultResistanceOhm,
    headroom = input.clampVoltageV - input.busVoltageV;
  const decayS = (l / offR) * Math.log1p((cutCurrentA * offR) / headroom);
  const offCurrent = (t) =>
    Math.max(0, (cutCurrentA + headroom / offR) * Math.exp((-offR * t) / l) - headroom / offR);
  const preI2 = Math.max(0, integralSquare(steady, input.loadCurrentA - steady, r / l, cutS));
  const postI2 = Math.max(
    0,
    integralSquare(-headroom / offR, cutCurrentA + headroom / offR, offR / l, decayS),
  );
  const postCharge = Math.max(
    0,
    integral(-headroom / offR, cutCurrentA + headroom / offR, offR / l, decayS),
  );
  const times = new Set([0, cutS, cutS + decayS]);
  for (let j = 0; j <= 120; j++) {
    times.add((cutS * j) / 120);
    times.add(cutS + (decayS * j) / 120);
  }
  const trace = [...times]
    .sort((a, b) => a - b)
    .map((t) => ({ timeUs: t * 1e6, currentA: t <= cutS ? onCurrent(t) : offCurrent(t - cutS) }));
  return {
    id: device.id,
    openingUs: device.openingUs,
    onResistanceOhm: device.onResistanceOhm,
    normalConductionLossW: input.loadCurrentA ** 2 * device.onResistanceOhm,
    peakCurrentA: Math.max(cutCurrentA, input.loadCurrentA),
    contactOpeningUs: cutS * 1e6,
    currentExtinctionUs: (cutS + decayS) * 1e6,
    clampEnergyJ: input.clampVoltageV * postCharge,
    faultI2tA2S: preI2 + postI2,
    inductiveEnergyAtOpeningJ: 0.5 * l * cutCurrentA ** 2,
    postOpeningSourceEnergyJ: input.busVoltageV * postCharge,
    postOpeningLineHeatJ: offR * postI2,
    trace,
  };
}

export function compareSwitches(input, { locale = 'fr' } = {}) {
  message('notice', locale);
  validateScenario(input, locale);
  return {
    schemaVersion: 1,
    locale,
    project: 'SwitchBench',
    origin: input.origin,
    notice: message('notice', locale),
    summary: message('summary', locale, { count: input.devices.length }),
    model: 'ideal-source/series-RL/instantaneous-switch/constant-voltage-clamp',
    assumptions: [
      'no-arcs',
      'no-bounce',
      'no-parasitic-capacitance',
      'no-thermal-derating',
      'no-hybrid-commutation-model',
    ],
    inputs: input,
    devices: input.devices.map((d) => simulateDevice(input, d, { locale })),
    findings: [{ code: 'unknownRating', message: message('unknownRating', locale) }],
  };
}
