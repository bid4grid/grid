const core = require('../assets/dist-core.js');

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    console.log('  ok   ' + msg);
    passed++;
  } else {
    console.error('  FAIL ' + msg);
    failed++;
  }
}

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  if (!Number.isFinite(actual) || diff > tol) {
    console.error('  FAIL ' + msg + ' | Expected ' + expected + ', got ' + actual + ' (diff ' + diff + ' > ' + tol + ')');
    failed++;
  } else {
    console.log('  ok   ' + msg);
    passed++;
  }
}

console.log('==========================================================');
console.log('  DISTRIBUTION SYSTEMS CAD CORE MATHEMATICAL VERIFICATION');
console.log('==========================================================\n');

// 1. Conductor Database Verification
console.log('1. Conductor Database & Resistances');
ok(core.CONDUCTORS.cu['4/0_AWG'].ampacity === 230, 'Cu 4/0 ampacity is 230 A');
ok(core.CONDUCTORS.al['4/0_AWG'].ampacity === 180, 'Al 4/0 ampacity is 180 A');
ok(core.CONDUCTORS.al['4/0_AWG'].r_ohm_per_km > core.CONDUCTORS.cu['4/0_AWG'].r_ohm_per_km, 'Al resistance > Cu resistance for same gauge');
assertClose(core.CONDUCTORS.cu['4/0_AWG'].r_ohm_per_km, 0.1992, 0.0001, 'Cu resistance corrected to 75 C');
assertClose(core.CONDUCTORS.al['4_AWG'].r_ohm_per_km, 1.6621, 0.0001, 'Al resistance corrected to 75 C');
ok(core.CONDUCTORS.acsr['336_kcmil'].ampacity === 530 && core.CONDUCTORS.acsr['795_kcmil'].ampacity === 910, 'ACSR ampacities match reference conditions');

// 2. 3-Phase & 1-Phase Voltage Drop Solvers
console.log('\n2. Voltage Drop Equation Verification');
const drop3ph = core.calcVoltageDrop({
  phaseType: '3phase',
  voltage: 12470,
  current_A: 100,
  length_km: 5.0,
  material: 'al',
  sizeKey: '336_kcmil',
  powerFactor: 0.90
});
assertClose(drop3ph.v_drop_V, 303.51, 0.01, '3-phase overhead voltage drop at 4 ft spacing');
assertClose(drop3ph.pct_drop, (303.51 / 12470) * 100, 0.001, 'Percentage voltage drop calculation');
ok(drop3ph.p_loss_kW > 0, '3-phase line loss = ' + drop3ph.p_loss_kW.toFixed(2) + ' kW');

// 1-phase 2-wire comparison: K = 2
const drop1ph = core.calcVoltageDrop({
  phaseType: '1phase',
  voltage: 240,
  current_A: 50,
  length_km: 0.1,
  material: 'cu',
  sizeKey: '2_AWG',
  powerFactor: 0.95
});
assertClose(drop1ph.v_drop_V, 6.478, 0.001, '1-phase drop uses two conductors and 75 C resistance');
const wide = core.calcVoltageDrop({ material: 'acsr', sizeKey: '336_kcmil', length_km: 1, spacing_ft: 10, current_A: 100, powerFactor: 0.9 });
const narrow = core.calcVoltageDrop({ material: 'acsr', sizeKey: '336_kcmil', length_km: 1, spacing_ft: 1, current_A: 100, powerFactor: 0.9 });
assertClose(narrow.X_ohms, 0.0854 / 0.3048, 1e-10, 'ACSR reactance matches one-foot reference');
ok(wide.v_drop_V > narrow.v_drop_V && wide.X_ohms > 0.4, 'Overhead spacing increases reactance and voltage drop');
const zeroDrop = core.calcVoltageDrop({ length_km: 0, current_A: 100 });
ok(zeroDrop.v_drop_V === 0 && zeroDrop.p_loss_kW === 0, 'Zero conductor length has no drop or loss');

// 3. Residential 120/240V Split-Phase Solver
console.log('\n3. Residential 120/240V Split-Phase Solver');
const splitBal = core.solveSplitPhase({
  load1_W: 2400,
  load2_W: 2400,
  load240_W: 4800,
  pf: 1.0,
  secondary_len_ft: 100,
  secondary_size: '4_AWG',
  secondary_mat: 'al'
});
assertClose(splitBal.I_N, 0, 1e-6, 'Balanced 120V legs produce zero neutral current');
assertClose(splitBal.I_L1, splitBal.I_L2, 1e-6, 'Leg currents are equal under balanced loading');

const splitUnbal = core.solveSplitPhase({
  load1_W: 3600,
  load2_W: 1200,
  load240_W: 0,
  pf: 1.0,
  secondary_len_ft: 100,
  secondary_size: '4_AWG',
  secondary_mat: 'al'
});
assertClose(splitUnbal.I_N, 20.0, 1e-3, 'Neutral carries the exact load difference (30A - 10A = 20A)');
ok(splitUnbal.v_L1_N < splitUnbal.v_L2_N, 'Heavily loaded L1 experiences greater voltage drop than lightly loaded L2');
assertClose(splitUnbal.v_L1_N + splitUnbal.v_L2_N, splitUnbal.v_L1_L2, 1e-10, 'Split-phase voltages satisfy KVL');
const splitB = core.solveSplitPhase({ load1_W: 8000, load2_W: 0, pf: 1, secondary_len_ft: 100 });
const splitBSwapped = core.solveSplitPhase({ load1_W: 0, load2_W: 8000, pf: 1, secondary_len_ft: 100 });
ok(splitB.ansiStatus.code === 'B' && splitBSwapped.ansiStatus.code === 'B', 'Worst-leg ANSI status is unchanged by swapping loads');
assertClose(splitB.v_L1_N, splitBSwapped.v_L2_N, 1e-10, 'Swapping loads swaps leg voltages');
let badPfRejected = false;
try { core.solveSplitPhase({ pf: 1.1 }); } catch (e) { badPfRejected = e instanceof RangeError; }
ok(badPfRejected, 'Invalid split-phase power factor is rejected');
const zeroSplit = core.solveSplitPhase({ load1_W: 8000, pf: 1, secondary_len_ft: 0 });
ok(zeroSplit.v_L1_N === 120 && zeroSplit.v_L2_N === 120, 'Zero-length split-phase service has nominal leg voltages');

// 4. ANSI C84.1 Evaluation
console.log('\n4. ANSI C84.1 Voltage Standard Compliance');
const ansiNormal = core.evaluateANSI(118.5, 120);
ok(ansiNormal.code === 'A', '118.5V is ANSI C84.1 Range A (normal)');
const ansiEmergency = core.evaluateANSI(112.0, 120);
ok(ansiEmergency.code === 'B', '112.0V is ANSI C84.1 Range B (emergency contingency)');
const ansiLow = core.evaluateANSI(105.0, 120);
ok(ansiLow.code === 'V', '105.0V is an ANSI C84.1 Violation');

// 5. Full Grid-to-Customer Cascade Solver
console.log('\n5. Grid-to-Customer Cascade Simulation');
const cascadeRes = core.solveGridCascade({
  gen_kV: 13.8,
  gen_MVA: 100,
  gsu_hv_kV: 230,
  trans_len_km: 40,
  dist_sub_kV: 13.2,
  feeder_len_km: 3.5,
  feeder_load_MVA: 5.0,
  service_type: 'residential_split',
  customer_load_kW: 10.0
});

ok(cascadeRes.gen.current_kA > 4.0, 'Generator current = ' + cascadeRes.gen.current_kA.toFixed(2) + ' kA');
ok(cascadeRes.transmission.current_A < 300, 'Transmission current stepped down: ' + cascadeRes.transmission.current_A.toFixed(1) + ' A');
ok(cascadeRes.transmission.voltage_recv_kV < 230, 'Transmission receiving voltage reflects line drop');
ok(cascadeRes.feeder.end_kV < 13.2, 'Feeder end voltage reflects 3-phase line drop');
ok(cascadeRes.customerMeter.terminal_V >= 110 && cascadeRes.customerMeter.terminal_V <= 126, 'Customer terminal voltage in realistic range (' + cascadeRes.customerMeter.terminal_V.toFixed(1) + ' V)');
ok(cascadeRes.bid4grid_specs.gsu_breaker.sample.includes('245 kV') && cascadeRes.bid4grid_specs.gsu_breaker.sample.includes('40 kA'), 'Illustrative transmission breaker has consistent ratings');
ok(cascadeRes.bid4grid_specs.dist_switchgear.standard === 'IEEE C37.74', 'Pad-mounted switchgear references IEEE C37.74');
ok(cascadeRes.bid4grid_specs.dist_xfmr.sample.includes('Utility-Grade'), 'Bid4Grid transformer spec matched');
ok(cascadeRes.bid4grid_specs.voltage_regulator.sample.includes('32-Step Voltage Regulator'), 'Bid4Grid regulator spec matched');
const isolated = core.solveGridCascade({ trans_len_km: 400, sub_xfmr_z_pct: 30, gen_MVA: 1, gsu_z_pct: 30 });
const baseline = core.solveGridCascade({});
ok(isolated.transmission.voltage_recv_kV < baseline.transmission.voltage_recv_kV, 'Transmission drop changes upstream telemetry');
assertClose(isolated.customerMeter.terminal_V, baseline.customerMeter.terminal_V, 1e-10, 'Regulated bus isolates meter from upstream parameters');
const noLoad = core.solveGridCascade({ gen_MVA: 0, feeder_load_MVA: 0, customer_load_kW: 0, xfmr_load_pct: 0, feeder_len_km: 0, trans_len_km: 0, sec_len_ft: 0 });
ok(noLoad.gen.power_MVA === 0 && noLoad.transmission.current_A === 0 && noLoad.feeder.current_A === 0 && noLoad.customerMeter.terminal_V === 120, 'Zero loads, rating and lengths remain zero');
const xfmr = core.solveGridCascade({ xfmr_z_pct: 5, xfmr_xr: 4, xfmr_load_pct: 100 });
assertClose(xfmr.distTransformer.internal_drop_pct, 5 / Math.sqrt(17) * (0.92 + 4 * Math.sqrt(1 - 0.92 ** 2)), 1e-10, 'Transformer drop uses R and X at service power factor');
let badXrRejected = false;
try { core.solveGridCascade({ xfmr_xr: -1 }); } catch (e) { badXrRejected = e instanceof RangeError; }
ok(badXrRejected, 'Invalid transformer X/R is rejected');

for (const [service, label, factor] of [
  ['residential_split', '1φ 120/240V', 2],
  ['commercial_480', '3φ 480V', Math.sqrt(3)],
  ['commercial_208', '3φ 208V', Math.sqrt(3)]
]) {
  const c = core.solveGridCascade({ service_type: service, customer_load_kW: 12, sec_len_ft: 125 });
  ok(c.distTransformer.service_label === label, service + ' reports the selected service');
  assertClose(c.distTransformer.voltage_out_V - c.customerMeter.terminal_V, c.serviceDrop.v_drop_V / factor, 1e-8, service + ' converts line-to-line drop to line-to-neutral drop');
  if (service !== 'residential_split') {
    assertClose(c.serviceDrop.current_A, 12000 / (Math.sqrt(3) * c.distTransformer.secondary_nominal_LL_V * 0.92), 1e-10, service + ' uses service drop power factor for current');
  }
}

// 6. CAD Canvas Diagram Verification (850x420 Bounds)
console.log('\n6. CAD Canvas Diagram Verification (850x420 Bounds)');
const draw = require('../assets/dist-draw.js');

function createMockCanvas(width, height) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  const text = [];
  const textBoxes = [];
  const segments = [];
  const strokedSegments = [];
  const nodes = [];
  let currentPoint;
  let path = [];

  function record(x1, y1, x2, y2) {
    if (x1 < minX) minX = x1;
    if (x2 > maxX) maxX = x2;
    if (y1 < minY) minY = y1;
    if (y2 > maxY) maxY = y2;
  }

  const ctx = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px monospace',
    textAlign: 'left',

    fillRect(x, y, w, h) {
      if (w === width && h === height) return;
      record(x, y, x + w, y + h);
    },
    strokeRect(x, y, w, h) { record(x, y, x + w, y + h); },
    beginPath() { path = []; currentPoint = undefined; },
    moveTo(x, y) { currentPoint = [x, y]; record(x, y, x, y); },
    lineTo(x, y) {
      if (currentPoint) {
        const segment = [currentPoint[0], currentPoint[1], x, y];
        segments.push(segment);
        path.push(segment);
      }
      currentPoint = [x, y];
      record(x, y, x, y);
    },
    roundRect(x, y, w, h) { record(x, y, x + w, y + h); },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { currentPoint = [x, y]; record(x, y, x, y); },
    quadraticCurveTo(cpx, cpy, x, y) { record(x, y, x, y); },
    arc(x, y, r) { nodes.push([x, y, r]); record(x - r, y - r, x + r, y + r); },
    closePath() {},
    stroke() { path.forEach(segment => strokedSegments.push({ segment, color: this.strokeStyle })); },
    fill() {},
    setLineDash() {},
    measureText(text) { return { width: text.length * 6.5 }; },
    fillText(text, x, y) {
      this._text.push(text);
      const w = this.measureText(text).width;
      let left = x;
      if (this.textAlign === 'center') left = x - w / 2;
      else if (this.textAlign === 'right') left = x - w;
      const fontSize = parseFloat(this.font.match(/([\d.]+)px/)[1]);
      const labelWidth = text.length * fontSize * 0.6;
      const labelLeft = this.textAlign === 'center' ? x - labelWidth / 2 :
        (this.textAlign === 'right' ? x - labelWidth : x);
      textBoxes.push({ text, box: [labelLeft, y - fontSize * 0.75, labelLeft + labelWidth, y + fontSize * 0.15] });
      record(left, y - 10, left + w, y + 4);
    },
    _text: text
  };

  return {
    width, height,
    getContext() { return ctx; },
    getBounds() { return { minX, maxX, minY, maxY }; },
    getText() { return text; },
    getTextBoxes() { return textBoxes; },
    getSegments() { return segments; },
    getStrokedSegments() { return strokedSegments; },
    getNodes() { return nodes; }
  };
}

function verifyDiagramFit(name, renderFn) {
  const canvas = createMockCanvas(850, 420);
  renderFn(canvas);
  const b = canvas.getBounds();
  const fits = b.minX >= 0 && b.maxX <= 850 && b.minY >= 0 && b.maxY <= 420;
  ok(fits, name + ' fits within 850x420 canvas (x: [' + b.minX.toFixed(1) + ', ' + b.maxX.toFixed(1) + '], y: [' + b.minY.toFixed(1) + ', ' + b.maxY.toFixed(1) + '])');
}

verifyDiagramFit('Grid-to-Customer Cascade SLD', c => {
  draw.drawGridCascade(c, cascadeRes, 'feeder');
});

verifyDiagramFit('ANSI C84.1 Voltage Profile Curve', c => {
  draw.drawVoltageProfile(c, cascadeRes);
});

verifyDiagramFit('Residential 120/240V Split-Phase Schematic', c => {
  draw.drawSplitPhaseDiagram(c, splitUnbal);
});

// 7. Module 2: Overhead & Underground Hardware Canvas Bounds Tests
console.log('\n7. Module 2: Overhead & Underground Hardware Canvas Bounds Tests');
const poleModel = core.getHardwareModel('pole', { hasTransformer: true, primary_kV: 13.2 });
const padModel = core.getHardwareModel('padmount', { loopFeed: true, kVA: 500 });
const riserModel = core.getHardwareModel('riser', {});

verifyDiagramFit('Overhead Utility Pole Framing CAD', c => {
  draw.drawPoleFraming(c, poleModel, null);
});

verifyDiagramFit('Padmount Transformer Enclosure CAD', c => {
  draw.drawPadmountEnclosure(c, padModel, 'transformer');
});

verifyDiagramFit('Padmount Switchgear CAD', c => {
  draw.drawPadmountEnclosure(c, padModel, 'switchgear');
});

verifyDiagramFit('Riser Pole Transition CAD', c => {
  draw.drawRiserPole(c, riserModel);
});

// 8. Module 3: Transformer Banks & Secondary Network Mathematical Tests
console.log('\n8. Module 3: Transformer Banks & Secondary Network Mathematical Tests');

// 8.1 Wye-Wye Bank
const wyeBank = core.solveTransformerBank({
  bank_type: 'wye_wye',
  primary_kV: 13.2,
  can_kVA: 50,
  sec_VLL: 208,
  load_kW: 90,
  pf: 0.90
});
assertClose(wyeBank.total_bank_kVA, 150.0, 1e-4, 'Wye bank total capacity = 3 * 50 = 150 kVA');
assertClose(wyeBank.sec_VLN, 208 / Math.sqrt(3), 1e-2, 'Wye bank V_LN = 208 / sqrt(3) = 120.09 V');
ok(wyeBank.num_cans === 3, 'Wye bank uses 3 cans');

// 8.2 240V 4-Wire High-Leg Delta
const highLeg = core.solveTransformerBank({
  bank_type: 'high_leg_delta',
  primary_kV: 13.2,
  can_kVA: 50,
  load_kW: 100,
  pf: 0.90
});
assertClose(highLeg.v_AN, 120.0, 1e-4, 'High-leg Phase A to Neutral is 120V');
assertClose(highLeg.v_CN, 120.0, 1e-4, 'High-leg Phase C to Neutral is 120V');
assertClose(highLeg.v_BN, 120.0 * Math.sqrt(3), 1e-2, 'High-leg Phase B to Neutral is 207.85V (~208V)');
assertClose(highLeg.sec_VLL, 240.0, 1e-4, 'High-leg Line-to-Line is 240V');
ok(highLeg.nec_warning.includes('NEC 110.15'), 'NEC 110.15 orange marking warning present');

// 8.3 Open-Delta (V-V Bank)
const openDelta = core.solveTransformerBank({
  bank_type: 'open_delta',
  primary_kV: 13.2,
  can_kVA: 50,
  load_kW: 60,
  pf: 0.90
});
ok(openDelta.num_cans === 2, 'Open-Delta uses 2 cans');
assertClose(openDelta.total_bank_kVA, 50 * Math.sqrt(3), 1e-2, 'Open-Delta capacity = sqrt(3) * 50 = 86.60 kVA');
assertClose(openDelta.derating_pct, 57.74, 1e-2, 'Open-Delta derating is 57.74% of 3-can bank');
assertClose(openDelta.utilization_pct, 86.60, 1e-2, 'Open-Delta utilization factor is 86.60%');
ok(openDelta.phase_shift_deg === 0 && openDelta.has_neutral === false && openDelta.sec_VLN === null, 'Open-delta example is three-wire with matching primary/secondary phase connections');

// 8.4 Secondary Network System & Reverse-Power Tripping
const netNormal = core.solveSecondaryNetwork({
  feeder1_active: true,
  feeder2_active: true,
  net_load_MVA: 1.8,
  xfmr_kVA: 1000
});
ok(netNormal.secondary_grid.active_transformers === 2, 'Normal network has 2 active feeders');
assertClose(netNormal.secondary_grid.load_per_xfmr_kVA, 900.0, 1e-2, '900 kVA per transformer');
ok(!netNormal.protector1.reverse_power_trip, 'Protector 1 closed under forward flow');

// Feeder 1 Outage Contingency (N-1)
const netContingency = core.solveSecondaryNetwork({
  feeder1_active: false,
  feeder2_active: true,
  net_load_MVA: 1.8,
  xfmr_kVA: 1000
});
ok(netContingency.protector1.reverse_power_trip, 'Protector 1 trips on reverse power flow');
ok(!netContingency.secondary_grid.grid_interrupted, 'Zero customer interruption during primary feeder trip (N-1 active)');
assertClose(netContingency.secondary_grid.load_per_xfmr_kVA, 1800.0, 1e-2, 'Remaining transformer picks up 1.8 MVA load');

// 9. Module 3 Canvas Bounds Tests (850x420)
console.log('\n9. Module 3: Canvas Bounds Tests (850x420)');
verifyDiagramFit('Wye-Wye Transformer Bank Schematic', c => {
  draw.drawTransformerBank(c, wyeBank);
});

verifyDiagramFit('Open-Delta Transformer Bank Schematic', c => {
  draw.drawTransformerBank(c, openDelta);
});

verifyDiagramFit('240V 4-Wire High-Leg Delta CAD', c => {
  draw.drawHighLegDelta(c, highLeg);
});

verifyDiagramFit('Urban Secondary Network Mesh Grid CAD', c => {
  draw.drawSecondaryNetwork(c, netContingency);
});

console.log('\n10. Dynamic CAD Values');
const dynamicCascade = core.solveGridCascade({
  gen_kV: 24, gsu_hv_kV: 345, dist_sub_kV: 24.94, service_type: 'commercial_208'
});
const cascadeCanvas = createMockCanvas(850, 420);
draw.drawGridCascade(cascadeCanvas, dynamicCascade, 'feeder');
const cascadeText = cascadeCanvas.getText();
ok(cascadeText.includes('24/345 kV'), 'Cascade GSU label reflects selected voltages');
ok(cascadeText.includes('345/24.94kV'), 'Cascade substation label reflects selected voltages');
ok(cascadeText.includes('3φ 208V'), 'Cascade service label reflects 208 V selection');

const undergroundCascade = core.solveGridCascade({
  feeder_type: 'underground', sec_len_ft: 350, sec_cond_key: '1/0_AWG',
  customer_load_kW: 85, service_type: 'commercial_480', gsu_hv_kV: 345
});
const undergroundCanvas = createMockCanvas(850, 420);
draw.drawGridCascade(undergroundCanvas, undergroundCascade);
const undergroundText = undergroundCanvas.getText();
ok(undergroundText.includes('SERVICE: 350 ft | 1/0 AWG Al') &&
   undergroundText.includes('CUSTOMER LOAD: 85 kW'),
  'Cascade shows selected service length, conductor size and customer load');
ok(undergroundText.includes('Feeder: 500 kcmil Cu') &&
   undergroundText.includes('Grid: 345 kV | Substation: 25 MVA'),
  'Cascade specification cards reflect the selected feeder and grid voltage');
const hasLine = (canvas, expected) =>
  canvas.getSegments().some(segment => segment.every((value, index) => value === expected[index]));
ok(hasLine(undergroundCanvas, [507, 175, 623, 175]) &&
   hasLine(undergroundCanvas, [553, 170, 573, 170]) &&
   !hasLine(undergroundCanvas, [563, 157, 563, 183]),
  'Underground feeder uses a continuous line and cable symbol instead of a pole');
ok(hasLine(cascadeCanvas, [507, 175, 623, 175]) &&
   hasLine(cascadeCanvas, [563, 157, 563, 183]) &&
   !hasLine(cascadeCanvas, [553, 170, 573, 170]),
  'Overhead feeder uses a continuous line and pole symbol');

const radialCanvas = createMockCanvas(850, 420);
draw.drawPadmountEnclosure(radialCanvas, core.getHardwareModel('padmount', { loopFeed: false, kVA: 1500 }), 'transformer');
ok(radialCanvas.getText().includes('Dead-Front Radial Feed (3 Bushings)'), 'Padmount CAD reflects radial feed selection');
ok(radialCanvas.getText().includes('1500 kVA (3φ Padmount)'), 'Padmount CAD reflects selected rating');
const loopCanvas = createMockCanvas(850, 420);
draw.drawPadmountEnclosure(loopCanvas, core.getHardwareModel('padmount', { loopFeed: true, kVA: 150 }), 'transformer');
ok(loopCanvas.getText().includes('Dead-Front 200A Loop Feed (6 Bushings)'), 'Padmount CAD reflects loop feed selection');
ok(loopCanvas.getText().includes('150 kVA (3φ Padmount)'), 'Padmount CAD reflects a different rating');

const bankCanvas = createMockCanvas(850, 420);
draw.drawTransformerBank(bankCanvas, core.solveTransformerBank({ bank_type: 'wye_wye', primary_kV: 24.94 }));
ok(bankCanvas.getText().includes('PRIMARY  24.94 kV L-L'), 'Bank CAD reflects selected primary voltage');

function verifyBankConnections(type, expectedPrimary, expectedSecondary, expectedShift) {
  const result = core.solveTransformerBank({ bank_type: type, can_kVA: 100, load_kW: 120 });
  const canvas = createMockCanvas(850, 420);
  draw.drawTransformerBank(canvas, result);
  const segments = canvas.getSegments();
  const nodes = canvas.getNodes();
  const hasSegment = (x1, y1, x2, y2) => segments.some(s => s[0] === x1 && s[1] === y1 && s[2] === x2 && s[3] === y2);
  const hasNode = (x, y) => nodes.some(p => p[0] === x && p[1] === y && p[2] === 3);
  for (const [x, branches, prefix] of [[16, expectedPrimary, 'H'], [438, expectedSecondary, 'X']]) {
    const bus = { A: x + 26, B: x + 48, C: x + 70, N: x + 340 };
    branches.forEach(([from, to], i) => {
      const y = 124 + i * 74;
      const endY = to === 'N' ? y : y + 22;
      ok(hasSegment(bus[from], y, x + 145, y) &&
         (to === 'N' ? hasSegment(x + 205, y, bus.N, y) :
           hasSegment(x + 205, y, x + 330, y) &&
           hasSegment(x + 330, y, x + 330, endY) &&
           hasSegment(x + 330, endY, bus[to], endY)) &&
         hasNode(bus[from], y) && hasNode(bus[to], endY),
      type + ' ' + prefix + ' T' + (i + 1) + ' connects ' + from + ' to ' + to);
    });
  }
  ok(nodes.filter(p => p[2] === 3).length === 2 * (expectedPrimary.length + expectedSecondary.length),
    type + ' marks only the winding junctions');
  const phases = { A: [1, 0], B: [-0.5, -Math.sqrt(3) / 2], C: [-0.5, Math.sqrt(3) / 2], N: [0, 0] };
  const difference = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const windingVoltage = ([from, to]) => difference(phases[from], phases[to]);
  const primaryAB = difference(phases.A, phases.B);
  const secondaryAB = type === 'open_delta'
    ? windingVoltage(expectedPrimary[0])
    : difference(windingVoltage(expectedPrimary[0]), windingVoltage(expectedPrimary[1]));
  const angle = Math.atan2(secondaryAB[1], secondaryAB[0]) - Math.atan2(primaryAB[1], primaryAB[0]);
  assertClose(angle * 180 / Math.PI, expectedShift, 1e-8, type + ' winding polarity produces the expected line-to-line phase shift');
  ok(result.phase_shift_deg === expectedShift &&
     canvas.getText().some(t => t.includes('LV shift: ' + expectedShift + '°')),
  type + ' displays the phase shift for the shown polarity');
}

verifyBankConnections('wye_wye',
  [['A', 'N'], ['B', 'N'], ['C', 'N']],
  [['A', 'N'], ['B', 'N'], ['C', 'N']], 0);
verifyBankConnections('delta_wye',
  [['A', 'C'], ['B', 'A'], ['C', 'B']],
  [['A', 'N'], ['B', 'N'], ['C', 'N']], -30);
verifyBankConnections('open_delta',
  [['A', 'B'], ['B', 'C']],
  [['A', 'B'], ['B', 'C']], 0);

const outageCanvas = createMockCanvas(850, 420);
draw.drawSecondaryNetwork(outageCanvas, core.solveSecondaryNetwork({ feeder1_active: false, feeder2_active: false }));
ok(outageCanvas.getText().includes('OUT'), 'Network CAD shows buildings out when both feeders are open');
ok(outageCanvas.getText().includes('Interrupted (No Active Feeders)'), 'Network CAD identifies a complete outage');
ok(outageCanvas.getText().some(t => t.includes('Customer Continuity: 0% (Interrupted)')), 'Network telemetry reports loss of continuity');

const extremeCascade = core.solveGridCascade({
  dist_sub_kV: 12.47, feeder_len_km: 25 * core.MILES_TO_KM, feeder_load_MVA: 25,
  customer_load_kW: 1000, sec_len_ft: 500
});
ok(extremeCascade.distTransformer.voltage_out_V === 0, 'Transformer output does not become negative at extreme voltage drop');
verifyDiagramFit('Voltage profile with extreme drop', c => {
  draw.drawVoltageProfile(c, extremeCascade);
});

console.log('\n11. Diagram Label Clearance');
function intersectsBox([x, y, endX, endY], [left, top, right, bottom]) {
  const dx = endX - x, dy = endY - y;
  let first = 0, last = 1;
  for (const [direction, distance] of [
    [-dx, x - left], [dx, right - x], [-dy, y - top], [dy, bottom - y]
  ]) {
    if (direction === 0) {
      if (distance < 0) return false;
    } else if (direction < 0) {
      first = Math.max(first, distance / direction);
    } else {
      last = Math.min(last, distance / direction);
    }
  }
  return first <= last;
}

function verifyClearLabels(name, render, selectLabel) {
  const canvas = createMockCanvas(850, 420);
  render(canvas);
  const labels = canvas.getTextBoxes().filter(({ text }) => selectLabel(text));
  const lines = canvas.getStrokedSegments().filter(({ color }) =>
    !['rgba(0,0,0,0.05)', '#e2e8f0', '#cbd5e1'].includes(color));
  const collisions = labels.filter(({ box }) =>
    lines.some(({ segment }) => intersectsBox(segment, box)));
  ok(labels.length > 0 && collisions.length === 0,
    name + ' labels clear of lines' + (collisions.length ? ': ' + collisions.map(label => label.text).join(', ') : ''));
}

verifyClearLabels('Cascade feeder', c => draw.drawGridCascade(c, cascadeRes, 'feeder'), text => text === 'FEEDER');
const selectedFeederLabels = cascadeCanvas.getTextBoxes().filter(({ text }) =>
  text === 'FEEDER' || text.endsWith('3φ OH') || /\d+A \| [\d.]+kV/.test(text));
ok(selectedFeederLabels.length === 3 && selectedFeederLabels.every(({ box }) => box[1] > 205),
  'Selected feeder halo stays clear of the feeder labels');
verifyClearLabels('Cascade service', c => draw.drawGridCascade(c, undergroundCascade),
  text => text.startsWith('SERVICE:') || text.startsWith('CUSTOMER LOAD:'));
verifyClearLabels('Pole callouts and telemetry', c => draw.drawPoleFraming(c, poleModel),
  text => text.startsWith('100A Expulsion Cutout') || text.startsWith('50 kVA Can') || text.startsWith('OVERHEAD HARDWARE:'));
for (const loopFeed of [true, false]) {
  const model = core.getHardwareModel('padmount', { loopFeed });
  for (const mode of ['transformer', 'switchgear']) {
    verifyClearLabels('Padmount ' + mode + ' ' + (loopFeed ? 'loop' : 'radial'),
      c => draw.drawPadmountEnclosure(c, model, mode), text => /^H[123][AB]?$/.test(text));
  }
}
verifyClearLabels('Junction phase labels', c => draw.drawPadmountEnclosure(c, padModel, 'junction'),
  text => /^PHASE [ABC]$/.test(text));
verifyClearLabels('High-leg load', c => draw.drawHighLegDelta(c, highLeg),
  text => text.startsWith('3φ LOAD:') || text.includes('% of 150 kVA Bank'));
for (const network of [netNormal, netContingency, core.solveSecondaryNetwork({ feeder1_active: false, feeder2_active: false })]) {
  verifyClearLabels('Secondary network', c => draw.drawSecondaryNetwork(c, network),
    text => text.startsWith('PRIMARY FEEDER') || /^VAULT [12]$/.test(text) || text.startsWith('SECONDARY MESH GRID'));
}
for (const cascade of [cascadeRes, extremeCascade]) {
  verifyClearLabels('Voltage profile', c => draw.drawVoltageProfile(c, cascade),
    text => /^(Substation \(|Feeder \(|Xfmr \(|Meter \(|ANSI Range [AB])/.test(text));
}
verifyClearLabels('Split-phase neutral', c => draw.drawSplitPhaseDiagram(c, splitUnbal),
  text => text.startsWith('N (X2') || text.startsWith('I_N='));

console.log('\nDistribution tests: ' + passed + ' passed, ' + failed + ' failed.');
if (failed > 0) process.exit(1);
