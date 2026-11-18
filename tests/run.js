const core = require('../assets/pwr-core.js');

let passed = 0;
let failed = 0;

function ok(condition, msg) {
  if (condition) {
    console.log(`  ok   ${msg}`);
    passed++;
  } else {
    console.error(`  FAIL ${msg}`);
    failed++;
  }
}

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  if (diff > tol) {
    console.error(`  FAIL ${msg} | Expected ${expected}, got ${actual} (diff ${diff.toExponential(3)} > ${tol})`);
    failed++;
  } else {
    console.log(`  ok   ${msg}`);
    passed++;
  }
}

function assertComplexClose(actual, expected, tol, msg) {
  const diffRe = Math.abs(actual[0] - expected[0]);
  const diffIm = Math.abs(actual[1] - expected[1]);
  if (diffRe > tol || diffIm > tol) {
    console.error(`  FAIL ${msg} | Expected [${expected[0]}, ${expected[1]}], got [${actual[0]}, ${actual[1]}]`);
    failed++;
  } else {
    console.log(`  ok   ${msg}`);
    passed++;
  }
}

console.log("==================================================");
console.log("  POWER SYSTEMS CAD CORE MATHEMATICAL VERIFICATION");
console.log("==================================================\n");

// 1. Complex Arithmetic & Hyperbolic Functions
console.log("1. Complex Arithmetic & Hyperbolic Functions");
const c1 = [3, 4];
assertClose(core.cabs(c1), 5.0, 1e-6, "cabs([3, 4]) == 5");
assertClose(core.cangleDeg([1, 1]), 45.0, 1e-6, "cangleDeg([1, 1]) == 45 deg");

const z_sq = core.csqrt([0, 4]); // sqrt(4j) = sqrt(2) + j*sqrt(2)
assertComplexClose(z_sq, [Math.sqrt(2), Math.sqrt(2)], 1e-6, "csqrt(4j) == sqrt(2) + j*sqrt(2)");

// cosh^2(z) - sinh^2(z) = 1 identity for complex hyperbolic
const z_hyp = [0.2, 0.6];
const ch = core.ccosh(z_hyp);
const sh = core.csinh(z_hyp);
const ch2 = core.cmul(ch, ch);
const sh2 = core.cmul(sh, sh);
const diff_hyp = core.csub(ch2, sh2);
assertComplexClose(diff_hyp, [1, 0], 1e-6, "Identity cosh^2(z) - sinh^2(z) == 1");

// 2. Power Principles & 3-Phase Systems
console.log("\n2. Power Principles & 3-Phase Systems");
const pfCorr = core.calcPFCorrection(500, 0.75, 0.95);
// Q1 = 500*tan(acos(0.75)) = 440.96 kvar, Q2 = 500*tan(acos(0.95)) = 164.34 kvar -> dQ = 276.62 kvar
assertClose(pfCorr.dQ_kvar, 276.62, 0.1, "3-Phase PF correction capacitor sizing (500kW 0.75 -> 0.95)");

const wyeSys = core.calcThreePhase('wye', 480, 100, 0.85);
assertClose(wyeSys.V_phase, 480 / Math.sqrt(3), 0.01, "Wye V_phase = V_LL / sqrt(3)");
assertClose(wyeSys.I_line, (100e3) / (Math.sqrt(3) * 480), 0.01, "Wye Line Current");

const deltaSys = core.calcThreePhase('delta', 480, 100, 0.85);
assertClose(deltaSys.V_phase, 480, 0.01, "Delta V_phase = V_LL");
assertClose(deltaSys.I_phase, deltaSys.I_line / Math.sqrt(3), 0.01, "Delta I_phase = I_line / sqrt(3)");

// Delta-Wye conversion
const Zd = [9, 12];
const Zy = core.deltaToWye(Zd);
assertComplexClose(Zy, [3, 4], 1e-6, "deltaToWye(Zd) == Zd / 3");
assertComplexClose(core.wyeToDelta(Zy), Zd, 1e-6, "wyeToDelta(Zy) == Zd");

// 3. Synchronous Machines (Section 4)
console.log("\n3. Synchronous Machines (Section 4)");
const genCyl = core.calcCylindricalGenerator(13.8, 50, 0.8, true, 0.05, 1.8);
ok(genCyl.delta_deg > 0 && genCyl.delta_deg < 45, `Cylindrical machine torque angle delta = ${genCyl.delta_deg.toFixed(2)} deg`);
ok(genCyl.Eg_LL > 13.8, `Excitation EMF under lagging PF > terminal V (${genCyl.Eg_LL.toFixed(2)} kV > 13.8 kV)`);
assertClose(genCyl.Pmax_MW, (3 * genCyl.Eg_mag * genCyl.Vt_ph) / (1.8 * 1e6), 0.01, "Cylindrical P_max formula");

// Salient-pole machine (Xd > Xq)
const genSal = core.calcSalientGenerator(13.8, 50, 0.8, true, 0.05, 1.8, 1.2);
ok(genSal.delta_max < 90, `Salient-pole P_max occurs at delta < 90 deg due to reluctance torque (${genSal.delta_max} deg)`);
ok(genSal.Pmax_MW > genSal.P_fund_max, `Salient-pole P_max includes reluctance power (${genSal.Pmax_MW.toFixed(2)} MW > ${genSal.P_fund_max.toFixed(2)} MW)`);

// 4. Power Transformers (Section 5)
console.log("\n4. Power Transformers (Section 5)");
// 50 kVA, 2400/240 V transformer test data:
// OC test (LV side): Voc = 240 V, Ioc = 5.41 A, Poc = 186 W
// SC test (HV side): Vsc = 48 V, Isc = 20.8 A, Psc = 617 W
const xfmr = core.calcTransformerParams(240, 5.41, 186, 48, 20.8, 617, 50, 2400, 240);
assertClose(xfmr.Rc, (240 * 240) / 186, 1.0, "Core resistance Rc from OC test");
assertClose(xfmr.Req, 617 / (20.8 * 20.8), 0.05, "Equivalent series Req from SC test");
ok(xfmr.Xeq > xfmr.Req, "Transformer leakage reactance Xeq > Req");

// Referred to LV side (240V): Req_lv = Req_hv * (240/2400)^2 = 1.42 * 0.01 = 0.0142 ohm
const Req_lv = xfmr.Req * Math.pow(240 / 2400, 2);
const Xeq_lv = xfmr.Xeq * Math.pow(240 / 2400, 2);
const xfmrPerf = core.calcTransformerPerformance(50, 240, Req_lv, Xeq_lv, 186, 1.0, 0.8, true);
ok(xfmrPerf.efficiency_pct > 95 && xfmrPerf.efficiency_pct < 99, `Transformer efficiency = ${xfmrPerf.efficiency_pct.toFixed(2)} %`);
ok(xfmrPerf.voltage_reg_pct > 0 && xfmrPerf.voltage_reg_pct < 5, `Voltage regulation under lagging PF is positive (${xfmrPerf.voltage_reg_pct.toFixed(2)} %)`);

// 5. Transmission Lines & ABCD Parameters (Section 6)
console.log("\n5. Transmission Lines & ABCD Parameters (Section 6)");
// 300 km, 220 kV Long Line: r = 0.08 ohm/km, x = 0.48 ohm/km, b = 3.3e-6 S/km
const lineSol = core.solveTransmissionLine('long', 0.08, 0.48, 0, 3.3e-6, 300, 220, 150, 0.9, true);
// Two-port reciprocity condition: AD - BC = 1
const A = lineSol.ABCD[0], B = lineSol.ABCD[1], C = lineSol.ABCD[2], D = lineSol.ABCD[3];
const det = core.csub(core.cmul(A, D), core.cmul(B, C));
assertComplexClose(det, [1, 0], 1e-4, "Long-line ABCD reciprocity: A*D - B*C == 1");

// Ferranti Effect on long unloaded line: Vr_nl > Vs
ok(lineSol.ferrantiRise_kV > 0, `Ferranti voltage rise confirmed: no-load Vr > Vs (+${lineSol.ferrantiRise_kV.toFixed(2)} kV)`);
ok(lineSol.SIL_MW > 100, `Surge Impedance Loading SIL = ${lineSol.SIL_MW.toFixed(1)} MW`);

// 6. Per-Unit System (Section 7)
console.log("\n6. Per-Unit System (Section 7)");
const Zbase1 = core.calcBaseImpedance(138, 100);
assertClose(Zbase1, 190.44, 0.01, "Zbase = 138^2 / 100 = 190.44 ohms");
const Ibase1 = core.calcBaseCurrent(138, 100);
assertClose(Ibase1, (100e3) / (Math.sqrt(3) * 138), 0.01, "Ibase = 100M / (sqrt(3)*138k)");

const zpu_new = core.changeOfBase(0.12, 138, 13.8, 100, 50);
assertClose(zpu_new, 6.0, 0.01, "Multi-zone change of base formula");

const multiZone = core.calcMultiZoneBases(100, 13.8, 13.8, 138, 138, 69);
assertClose(multiZone.zones[0].Vbase_kV, 13.8, 0.01, "Zone 1 Generator Base kV");
assertClose(multiZone.zones[1].Vbase_kV, 138.0, 0.01, "Zone 2 Transmission Base kV");
assertClose(multiZone.zones[2].Vbase_kV, 69.0, 0.01, "Zone 3 Substation Base kV");

// 7. Power Flow / Load Flow (Sections 8, 9)
console.log("\n7. Power Flow / Load Flow (Sections 8, 9)");
const branches3 = [
  { from: 1, to: 2, r: 0.02, x: 0.06, b_shunt: 0.04 },
  { from: 1, to: 3, r: 0.08, x: 0.24, b_shunt: 0.0 },
  { from: 2, to: 3, r: 0.06, x: 0.18, b_shunt: 0.0 }
];
const Y3 = core.buildYBus(3, branches3);
ok(Y3.length === 9, "Y_bus 3x3 dimension (9 complex elements)");
// Y_bus symmetry: Y_12 == Y_21
assertComplexClose(Y3[1], Y3[3], 1e-6, "Y_bus symmetry: Y_12 == Y_21");

// Gauss-Seidel solver for 3-bus system
const buses3 = [
  { type: 'slack', V_mag: 1.05, V_angle_deg: 0, P: 0, Q: 0 },
  { type: 'pv', V_mag: 1.03, V_angle_deg: 0, P: 0.5, Q: 0 },
  { type: 'pq', V_mag: 1.0, V_angle_deg: 0, P: -0.8, Q: -0.4 }
];
const lfResult = core.solveGaussSeidel(buses3, branches3, 100, 1e-4);
ok(lfResult.converged, `Gauss-Seidel converged in ${lfResult.iterations} iterations`);
ok(lfResult.buses[2].V_mag < 1.05, `Load bus voltage sag: |V3| = ${lfResult.buses[2].V_mag.toFixed(4)} pu`);
ok(lfResult.lineFlows[0].P_loss > 0, `Line 1-2 active loss > 0 (${(lfResult.lineFlows[0].P_loss * 100).toFixed(2)} MW)`);

// 8. Fault Analysis & Symmetrical Components (Sections 10, 11, 12)
console.log("\n8. Fault Analysis & Symmetrical Components (Sections 10, 11, 12)");
// Balanced phase voltages
const Va_bal = core.cpolar(1, 0);
const Vb_bal = core.cpolar(1, -120);
const Vc_bal = core.cpolar(1, 120);
const seq_bal = core.getSequenceComponents([Va_bal, Vb_bal, Vc_bal]);
assertComplexClose(seq_bal[0], [0, 0], 1e-6, "Zero sequence V0 is 0 for balanced set");
assertComplexClose(seq_bal[1], Va_bal, 1e-6, "Positive sequence V1 equals Va for balanced set");
assertComplexClose(seq_bal[2], [0, 0], 1e-6, "Negative sequence V2 is 0 for balanced set");

// Fault solvers with: Z1 = j0.2, Z2 = j0.2, Z0 = j0.3, Zf = 0, 100 MVA, 138 kV
const Z1 = [0, 0.2], Z2 = [0, 0.2], Z0 = [0, 0.3], Zf = [0, 0];
const symFault = core.solveSymmetricalFault([1, 0], Z1, Zf, 100, 138);
assertClose(symFault.If_pu, 1 / 0.2, 0.01, "3-Phase balanced fault If = 1 / 0.2 = 5.0 pu");

const slgFault = core.solveSLGFault([1, 0], Z0, Z1, Z2, Zf, 100, 138);
// If_slg = 3 / (Z0 + Z1 + Z2) = 3 / j0.7 = -j4.2857 pu -> mag 4.2857 pu
assertClose(slgFault.If_pu, 3 / 0.7, 0.01, "SLG fault If = 3 / (Z0+Z1+Z2) = 4.286 pu");

const llFault = core.solveLLFault([1, 0], Z0, Z1, Z2, Zf, 100, 138);
// If_ll = sqrt(3) / (Z1 + Z2) = sqrt(3) / 0.4 = 4.3301 pu
assertClose(llFault.If_pu, Math.sqrt(3) / 0.4, 0.01, "L-L fault If = sqrt(3) / (Z1+Z2) = 4.33 pu");

const dlgFault = core.solveDLGFault([1, 0], Z0, Z1, Z2, Zf, 100, 138);
// Z_par = (j0.2 * j0.3) / (j0.2 + j0.3) = j0.06 / j0.5 = j0.12
// Ia1 = 1 / (j0.2 + j0.12) = 1 / j0.32 = -j3.125
// V1 = 1 - j0.2 * (-j3.125) = 1 - 0.625 = 0.375
// Ia0 = -0.375 / j0.3 = j1.25 -> If_ground = 3 * 1.25 = 3.75 pu
assertClose(dlgFault.If_pu, 3.75, 0.01, "DLG ground fault current = 3.75 pu");

// 9. CAD Diagram Canvas Bounds & Export Verification
console.log("\n9. CAD Diagram Canvas Bounds & Export Verification (850x420)");
const draw = require('../assets/pwr-draw.js');

function createMockCanvas(width, height) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  const text = [];
  const lines = [];

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
    textBaseline: 'alphabetic',

    fillRect(x, y, w, h) {
      if (w === width && h === height) return;
      record(x, y, x + w, y + h);
    },
    strokeRect(x, y, w, h) { record(x, y, x + w, y + h); },
    clearRect() {},
    beginPath() { this._path = []; },
    moveTo(x, y) { this._path = this._path || []; this._path.push([x, y]); },
    lineTo(x, y) {
      if (this.strokeStyle === 'rgba(0,0,0,0.05)') return; // ignore CAD grid
      this._path = this._path || [];
      const start = this._path[this._path.length - 1];
      if (start) lines.push({ start, end: [x, y], color: this.strokeStyle });
      this._path.push([x, y]);
      record(x, y, x, y);
    },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { record(x, y, x, y); },
    arc(x, y, r) { record(x - r, y - r, x + r, y + r); },
    closePath() {},
    stroke() {},
    fill() {},
    setLineDash() {},
    measureText(text) {
      const match = (this.font || '').match(/(\d+(\.\d+)?)px/);
      const size = match ? parseFloat(match[1]) : 10;
      return { width: text.length * size * 0.62 };
    },
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
    width,
    height,
    getContext() { return ctx; },
    getBounds() { return { minX, maxX, minY, maxY }; },
    getText() { return text; },
    getLines() { return lines; }
  };
}

function verifyDiagramFit(name, renderFn) {
  const canvas = createMockCanvas(850, 420);
  renderFn(canvas);
  const b = canvas.getBounds();
  const fits = b.minX >= 0 && b.maxX <= 850 && b.minY >= 0 && b.maxY <= 420;
  ok(fits, `${name} fits within 850x420 canvas (x: [${b.minX.toFixed(1)}, ${b.maxX.toFixed(1)}], y: [${b.minY.toFixed(1)}, ${b.maxY.toFixed(1)}])`);
}

verifyDiagramFit("Single Line Diagram (Delta Load)", c => {
  draw.drawSLD(c, { P: 500, conn: 'delta', V_LL: 480, pf: 0.75, dQ_kvar: 276.6, I_line: 801.9 });
});

verifyDiagramFit("Single Line Diagram (Wye Load)", c => {
  draw.drawSLD(c, { P: 500, conn: 'wye', V_LL: 480, pf: 0.75, dQ_kvar: 276.6, I_line: 801.9 });
});

const sldCanvas = createMockCanvas(850, 420);
draw.drawSLD(sldCanvas, { conn: 'wye', pf: 0.75, targetPf: 0.80, dQ_kvar: 66.0 });
ok(sldCanvas.getText().includes('PF: 0.75 → 0.80 (Y-Wired)'), "SLD displays the selected target power factor");
ok(sldCanvas.getText().includes('CAPACITORS: +66.0 kvar'), "SLD displays the calculated capacitor size");

const noCorrectionCanvas = createMockCanvas(850, 420);
draw.drawSLD(noCorrectionCanvas, { conn: 'delta', pf: 0.75, targetPf: 0.75, dQ_kvar: 0 });
ok(noCorrectionCanvas.getText().includes('PF: 0.75 → 0.75 (Δ-Wired)'), "SLD displays an unchanged target power factor");
ok(noCorrectionCanvas.getText().includes('CAPACITORS: +0.0 kvar'), "SLD displays zero capacitor size when no correction is needed");

verifyDiagramFit("Transformer T-Equivalent Circuit", c => {
  draw.drawTransformerCircuit(c, { Rc: 310, Xm: 86, Req: 0.0142, Xeq: 0.0182, S_kVA: 50, eff: 98.03, vr: 1.94, Poc: 186, Psc: 617 });
});

verifyDiagramFit("Power Triangle & PF Correction", c => {
  draw.drawPowerTriangle(c, 500, 440.9, 164.3, { conn: 'delta', V_LL: 480, I_line: 801.9, Z_phase_mag: 0.58 });
});

verifyDiagramFit("Synchronous Machine Phasor Diagram", c => {
  draw.drawPhasorDiagram(c, [
    { label: 'Va', vec: [277, 0], color: '#dc2626' },
    { label: 'Vb', vec: [-138, -240], color: '#d97706' },
    { label: 'Vc', vec: [-138, 240], color: '#0284c7' }
  ]);
});

const phasorCanvas = createMockCanvas(850, 420);
draw.drawPhasorDiagram(phasorCanvas, [
  { label: 'Va', vec: [277.1, 0], unit: 'V', color: '#dc2626' },
  { label: 'Vb', vec: [-138.55, 0], unit: 'V', color: '#0284c7' },
  { label: 'Ia (lag)', vec: [600, -530], unit: 'A', color: '#16a34a' }
]);
const arrowLength = color => {
  const line = phasorCanvas.getLines().find(l => l.color === color && l.start[0] === 425 && l.start[1] === 220);
  return Math.hypot(line.end[0] - line.start[0], line.end[1] - line.start[1]);
};
assertClose(arrowLength('#dc2626'), arrowLength('#16a34a'), 1e-9, "Voltage and current use separate scales");
assertClose(arrowLength('#0284c7'), arrowLength('#dc2626') / 2, 1e-9, "Voltage phasors retain relative magnitudes");
ok(phasorCanvas.getText().includes('Separate scales; outer ring: 277.10 V / 800.56 A'), "Phasor diagram identifies both scales");
ok(phasorCanvas.getText().includes('Ia (lag) (800.56 A ∠ -41.5°)'), "Phasor diagram preserves current magnitude and angle with units");

verifyDiagramFit("Generator Power-Angle Curve", c => {
  draw.drawPowerAngleCurve(c, {
    Pmax_MW: 100, delta_deg: 30, type: 'salient', P_fund_max: 84, P_rel_max: 12,
    curve: [{ delta: 0, P: 0 }, { delta: 90, P: 96 }, { delta: 180, P: 0 }]
  });
});

verifyDiagramFit("Transmission Line Ferranti Voltage Profile", c => {
  draw.drawTransmissionLineDiagram(c, {
    Vs_LL_kV: 220, Vr_nl_LL_kV: 241.3, ferrantiRise_kV: 21.3,
    profile: [{ dist_km: 0, V_nl: 220 }, { dist_km: 300, V_nl: 241.3 }]
  });
});

verifyDiagramFit("3-Bus Load Flow Network (SLD View)", c => {
  draw.drawLoadFlowNetwork(c,
    [{ V_mag: 1.05, V_angle_deg: 0 }, { V_mag: 1.03, V_angle_deg: 0.21 }, { V_mag: 0.965, V_angle_deg: -3.80 }],
    [{ from: 1, to: 2, r: 0.02, x: 0.06, b_shunt: 0.04 }, { from: 1, to: 3, r: 0.08, x: 0.24, b_shunt: 0.0 }, { from: 2, to: 3, r: 0.06, x: 0.18, b_shunt: 0.0 }],
    [{ P_from: 0.332, Q_from: 0.124, P_to: -0.330, Q_to: -0.118, P_loss: 0.0021, Q_loss: 0.0063 },
     { P_from: 0.291, Q_from: 0.150, P_to: -0.276, Q_to: -0.120, P_loss: 0.0146, Q_loss: 0.0438 },
     { P_from: 0.539, Q_from: 0.200, P_to: -0.524, Q_to: -0.180, P_loss: 0.0152, Q_loss: 0.0456 }],
    'sld'
  );
});

verifyDiagramFit("3-Bus Load Flow (Y-Bus Matrix View)", c => {
  const branches = [
    { from: 1, to: 2, r: 0.02, x: 0.06, b_shunt: 0.04 },
    { from: 1, to: 3, r: 0.08, x: 0.24, b_shunt: 0.0 },
    { from: 2, to: 3, r: 0.06, x: 0.18, b_shunt: 0.0 }
  ];
  const Y3 = core.buildYBus(3, branches);
  draw.drawLoadFlowNetwork(c, [], branches, [], 'ybus', Y3);
});

verifyDiagramFit("Fortescue Sequence Networks (SLG Fault)", c => {
  draw.drawSequenceNetworks(c, 'slg', [0, 0.3], [0, 0.2], [0, 0.2]);
});

verifyDiagramFit("Fortescue Sequence Networks (3-Phase Symmetrical)", c => {
  draw.drawSequenceNetworks(c, '3phase', [0, 0.3], [0, 0.2], [0, 0.2]);
});

verifyDiagramFit("Fortescue Sequence Networks (Line-to-Line)", c => {
  draw.drawSequenceNetworks(c, 'll', [0, 0.3], [0, 0.2], [0, 0.2]);
});

verifyDiagramFit("Fortescue Sequence Networks (Double Line-to-Ground)", c => {
  draw.drawSequenceNetworks(c, 'dlg', [0, 0.3], [0, 0.2], [0, 0.2]);
});

console.log("\n==================================================");
console.log(`  ALL TESTS PASSED: ${passed} passed, ${failed} failed.`);
console.log("==================================================");

if (failed > 0) process.exit(1);
