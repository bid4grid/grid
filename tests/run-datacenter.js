const assert = require('node:assert/strict');
const { calculate } = require('../assets/datacenter-core.js');

const inputs = {
  racks: 50, rackKW: 5, demandPct: 80, otherKW: 70,
  upsEfficiencyPct: 95, upsPF: 0.95, facilityPF: 0.9,
  primaryKV: 13.2, secondaryV: 480,
  transformerCount: 2, transformerKVA: 400, upsCount: 2, upsKVA: 300,
  batteryKWh: 100, batteryEfficiencyPct: 90, targetMinutes: 15
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

const result = calculate(inputs);
close(result.itKW, 200);
close(result.upsInputKW, 200 / 0.95);
close(result.upsLossKW, 200 / 0.95 - 200);
close(result.facilityKVA, (200 / 0.95 + 70) / 0.9);
close(result.primaryCurrentA, result.facilityKVA / (Math.sqrt(3) * 13.2));
close(result.secondaryCurrentA, result.facilityKVA * 1000 / (Math.sqrt(3) * 480));
close(result.ups.required_kVA, 200 / 0.95);
close(result.battery.runtimeMinutes, 27);
close(result.battery.requiredUsableKWh, 200 * 15 / 60 / 0.9);
assert.equal(result.battery.targetMet, true);
assert.equal(result.transformer.normalAdequate, true);
assert.equal(result.transformer.nMinusOneAdequate, true);
assert.equal(result.ups.nMinusOneAdequate, true);

const reduced = calculate({ ...inputs, transformerCount: 1, upsCount: 2, upsKVA: 150, batteryKWh: 0 });
assert.equal(reduced.transformer.normalAdequate, true);
assert.equal(reduced.transformer.nMinusOneAdequate, false);
assert.equal(reduced.ups.normalAdequate, true);
assert.equal(reduced.ups.nMinusOneAdequate, false);
assert.equal(reduced.ups.minimumForNMinusOne, 3);
assert.equal(reduced.battery.runtimeMinutes, 0);
assert.equal(reduced.battery.targetMet, false);
const overloaded = calculate({ ...inputs, transformerKVA: 100, upsKVA: 100 });
assert.equal(overloaded.transformer.normalAdequate, false);
assert.equal(overloaded.ups.normalAdequate, false);
const exact = calculate({ ...inputs, racks: 1, rackKW: 100, demandPct: 100, otherKW: 0,
  upsEfficiencyPct: 100, upsPF: 1, facilityPF: 1,
  transformerKVA: 100, upsKVA: 100, batteryKWh: 50,
  batteryEfficiencyPct: 100, targetMinutes: 30 });
assert.equal(exact.transformer.nMinusOneAdequate, true);
assert.equal(exact.ups.nMinusOneAdequate, true);
assert.equal(exact.battery.targetMet, true);
assert.equal(exact.transformer.minimumForNMinusOne, 2);
for (const changes of [{ racks: 0 }, { racks: 1.5 }, { upsPF: 0 }, { batteryKWh: -1 },
  { transformerCount: NaN }, { secondaryV: Infinity }, { upsEfficiencyPct: undefined }]) {
  assert.throws(() => calculate({ ...inputs, ...changes }), RangeError);
}

const fs = require('node:fs');
const vm = require('node:vm');
const elements = {};
const handlers = {};
const fields = Object.entries(inputs).map(([name, value]) => ({
  name, value: String(value), valueAsNumber: value, validity: { valid: true },
  min: '1', max: '100000', step: '1',
  parentElement: { firstChild: { textContent: name } }
}));
elements['dc-form'] = {
  elements: fields,
  addEventListener(name, handler) { handlers[name] = handler; }
};
const document = {
  getElementById(id) { return elements[id] || (elements[id] = { textContent: '', hidden: false }); }
};
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/datacenter-app.js'), 'utf8'),
  { document, DataCenterCore: { calculate } });
assert.equal(elements['diagram-primary'].textContent, '13.2 kV primary');
assert.equal(elements['diagram-it'].textContent, '200 kW demand');
assert.equal(elements['diagram-runtime'].textContent, '27 min estimated');
assert.equal(elements['tile-it'].textContent, '200 kW');
assert.equal(elements['tile-ups'].textContent, 'Adequate');
assert.equal(elements['tile-ups-card'].className, 'dist-tile');
assert.equal(elements['voltage-warning'].hidden, true);
fields.find(field => field.name === 'racks').valueAsNumber = 100;
fields.find(field => field.name === 'upsCount').valueAsNumber = 1;
handlers.input();
assert.equal(elements['diagram-it'].textContent, '400 kW demand');
assert.equal(elements['diagram-ups-status'].textContent, 'N−1 kVA: Insufficient');
assert.equal(elements['tile-it'].textContent, '400 kW');
assert.equal(elements['tile-ups'].textContent, 'Insufficient');
assert.equal(elements['tile-ups-card'].className, 'dist-tile amber');
const primary = fields.find(field => field.name === 'primaryKV');
primary.valueAsNumber = 0.48;
handlers.input();
assert.equal(elements['voltage-warning'].hidden, false);
primary.valueAsNumber = 0.1;
handlers.input();
assert.equal(elements['voltage-warning'].hidden, false);
primary.valueAsNumber = 13.2;
handlers.input();
assert.equal(elements['voltage-warning'].hidden, true);
const racks = fields.find(field => field.name === 'racks');
racks.value = '';
handlers.input();
assert.equal(elements['diagram-content'].hidden, true);
assert.equal(elements['diagram-unavailable'].hidden, false);
assert.equal(elements['dc-summary'].hidden, true);
racks.value = '100';
handlers.input();
assert.equal(elements['diagram-content'].hidden, false);
assert.equal(elements['diagram-unavailable'].hidden, true);
assert.equal(elements['dc-summary'].hidden, false);
console.log('Data center sizing tests passed.');
