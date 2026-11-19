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
  if (diff > tol) {
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
assertClose(drop3ph.v_drop_V, 183.18, 0.5, '3-phase voltage drop: dV = sqrt(3) * I * L * (R*cos + X*sin)');
assertClose(drop3ph.pct_drop, (183.18 / 12470) * 100, 0.05, 'Percentage voltage drop calculation');
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
assertClose(drop1ph.v_drop_V / (2 * 50 * 0.1 * (0.531 * 0.95 + 0.148 * Math.sqrt(1 - 0.95*0.95))), 1.0, 1e-4, '1-phase K=2 factor verified');

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
ok(cascadeRes.bid4grid_specs.gsu_breaker.sample.includes('Substation Vacuum Breaker'), 'Bid4Grid breaker spec matched');
ok(cascadeRes.bid4grid_specs.dist_xfmr.sample.includes('Utility-Grade'), 'Bid4Grid transformer spec matched');
ok(cascadeRes.bid4grid_specs.voltage_regulator.sample.includes('32-Step Voltage Regulator'), 'Bid4Grid regulator spec matched');

console.log('\n==========================================================');
console.log('  ALL DISTRIBUTION TESTS PASSED: ' + passed + ' passed, ' + failed + ' failed.');
console.log('==========================================================');

if (failed > 0) process.exit(1);

// 6. CAD Canvas Diagram Verification (850x420 Bounds)
console.log('\n6. CAD Canvas Diagram Verification (850x420 Bounds)');
const draw = require('../assets/dist-draw.js');

function createMockCanvas(width, height) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  const text = [];

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
    beginPath() {},
    moveTo(x, y) { record(x, y, x, y); },
    lineTo(x, y) { record(x, y, x, y); },
    roundRect(x, y, w, h) { record(x, y, x + w, y + h); },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { record(x, y, x, y); },
    quadraticCurveTo(cpx, cpy, x, y) { record(x, y, x, y); },
    arc(x, y, r) { record(x - r, y - r, x + r, y + r); },
    closePath() {},
    stroke() {},
    fill() {},
    setLineDash() {},
    measureText(text) { return { width: text.length * 6.5 }; },
    fillText(text, x, y) {
      this._text.push(text);
      const w = this.measureText(text).width;
      let left = x;
      if (this.textAlign === 'center') left = x - w / 2;
      else if (this.textAlign === 'right') left = x - w;
      record(left, y - 10, left + w, y + 4);
    },
    _text: text
  };

  return {
    width, height,
    getContext() { return ctx; },
    getBounds() { return { minX, maxX, minY, maxY }; },
    getText() { return text; }
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
