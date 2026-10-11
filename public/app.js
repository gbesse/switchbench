import { compareSwitches } from '../src/index.js';
import { mount, $, metric, table, chart, legend, format } from './ui.js';
await mount({
  name: 'SwitchBench',
  analyze: compareSwitches,
  fields: [
    ...[
      ['busVoltageV', 'busVoltage', 1, 10000, 10],
      ['loadCurrentA', 'current', 0, 10000, 10],
      ['inductanceUh', 'inductance', 0.1, 100000, 1],
      ['detectionUs', 'detection', 0, 100000, 1],
    ].map(([key, label, min, max, step]) => ({
      key,
      label,
      min,
      max,
      step,
      get: (x) => x[key],
      set: (x, v) => (x[key] = v),
    })),
  ],
  view: ({ report: r, locale, m }) => {
    const f = (v) => format(v, locale);
    const label = (d) =>
      ['mechanical', 'solidState', 'fastRelay'].includes(d.id) ? m(d.id) : d.id;
    const fast = r.devices.find((d) => d.id === 'fastRelay') ?? r.devices[0];
    $('metrics').append(
      metric(m('peak'), f(fast.peakCurrentA)),
      metric(m('energy'), f(fast.clampEnergyJ)),
      metric(m('loss'), f(fast.normalConductionLossW)),
    );
    const series = r.devices.map((d) => ({
      label: label(d),
      points: d.trace.map((p) => ({ x: p.timeUs, y: p.currentA })),
    }));
    $('chart').append(
      chart(series, { xLabel: m('xAxis'), yLabel: m('yAxis'), locale, logX: true }),
    );
    legend(series);
    $('table').append(
      table(
        [m('device'), m('loss'), m('peak'), m('opening'), m('extinction'), m('energy')],
        r.devices.map((d) => [
          label(d),
          f(d.normalConductionLossW),
          f(d.peakCurrentA),
          f(d.contactOpeningUs),
          f(d.currentExtinctionUs),
          f(d.clampEnergyJ),
        ]),
      ),
    );
  },
});
