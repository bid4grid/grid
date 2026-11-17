/**
 * Power Systems Calculator - Comprehensive Core Engine
 * Pure mathematical & engineering library covering:
 * - Complex numbers, hyperbolic trig, polar/rectangular conversions
 * - Complex power, power triangle, 1-phase & 3-phase PF correction
 * - Balanced 3-phase systems (Star/Delta, line vs phase, Delta-Wye impedance)
 * - Synchronous Generators (Cylindrical & Salient-Pole machines, P-delta curves)
 * - Power Transformers (OC/SC test parameter extraction, VR%, efficiency curves)
 * - Transmission Lines (Short, Medium Pi/T, Long Hyperbolic, ABCD matrices, Ferranti, SIL)
 * - Per-Unit System (Bases, multi-zone conversion, change-of-base)
 * - Power Flow Analysis (Y_bus formulation, Gauss-Seidel solver, line flows & losses)
 * - Fault Analysis & Symmetrical Components (Fortescue transform, 3-Phase, SLG, L-L, DLG)
 */
(function (root) {
  'use strict';

  // ==========================================
  // 1. COMPLEX ARITHMETIC & HYPERBOLIC TRIG
  // Complex numbers represented as [re, im]
  // ==========================================
  var ONE = [1, 0];
  var ZERO = [0, 0];

  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cscale(a, k) { return [a[0] * k, a[1] * k]; }
  function cdiv(a, b) {
    var d = b[0] * b[0] + b[1] * b[1];
    if (d === 0) return [0, 0];
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
  }
  function cabs(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }
  function cangle(a) { return Math.atan2(a[1], a[0]); } // Radians
  function cangleDeg(a) { return cangle(a) * 180 / Math.PI; } // Degrees
  function cconj(a) { return [a[0], -a[1]]; }
  function cpolar(mag, angDeg) {
    var rad = (angDeg || 0) * Math.PI / 180;
    return [mag * Math.cos(rad), mag * Math.sin(rad)];
  }
  function csqrt(a) {
    var r = cabs(a);
    var theta = cangle(a);
    return [Math.sqrt(r) * Math.cos(theta / 2), Math.sqrt(r) * Math.sin(theta / 2)];
  }
  function cexp(a) {
    var ex = Math.exp(a[0]);
    return [ex * Math.cos(a[1]), ex * Math.sin(a[1])];
  }
  // sinh(x + jy) = sinh(x)cos(y) + j cosh(x)sin(y)
  function csinh(a) {
    var x = a[0], y = a[1];
    var sh = (Math.exp(x) - Math.exp(-x)) / 2;
    var ch = (Math.exp(x) + Math.exp(-x)) / 2;
    return [sh * Math.cos(y), ch * Math.sin(y)];
  }
  // cosh(x + jy) = cosh(x)cos(y) + j sinh(x)sin(y)
  function ccosh(a) {
    var x = a[0], y = a[1];
    var sh = (Math.exp(x) - Math.exp(-x)) / 2;
    var ch = (Math.exp(x) + Math.exp(-x)) / 2;
    return [ch * Math.cos(y), sh * Math.sin(y)];
  }

  // Matrix multiplication 2x2: M * N
  function mmul(M, N) {
    return [
      cadd(cmul(M[0], N[0]), cmul(M[1], N[2])), cadd(cmul(M[0], N[1]), cmul(M[1], N[3])),
      cadd(cmul(M[2], N[0]), cmul(M[3], N[2])), cadd(cmul(M[2], N[1]), cmul(M[3], N[3]))
    ];
  }

  // 3x3 Complex Matrix Multiply: A * B
  function m3mul(A, B) {
    var C = [];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var sum = [0, 0];
        for (var k = 0; k < 3; k++) {
          sum = cadd(sum, cmul(A[i * 3 + k], B[k * 3 + j]));
        }
        C.push(sum);
      }
    }
    return C;
  }
  // 3x3 Complex Matrix * 3-vector
  function m3vecmul(M, v) {
    var res = [];
    for (var i = 0; i < 3; i++) {
      var sum = [0, 0];
      for (var j = 0; j < 3; j++) {
        sum = cadd(sum, cmul(M[i * 3 + j], v[j]));
      }
      res.push(sum);
    }
    return res;
  }

  // ==========================================
  // 2. POWER PRINCIPLES & BALANCED 3-PHASE
  // ==========================================
  function calcPowerFactor(P, Q) {
    var S = cabs([P, Q]);
    return S === 0 ? 1.0 : Math.abs(P / S);
  }

  // Capacitor bank sizing for 1-phase or 3-phase (total kvar)
  function calcPFCorrection(P_kW, pfOld, pfNew) {
    var theta1 = Math.acos(Math.max(-1, Math.min(1, pfOld)));
    var theta2 = Math.acos(Math.max(-1, Math.min(1, pfNew)));
    var Q1 = P_kW * Math.tan(theta1);
    var Q2 = P_kW * Math.tan(theta2);
    var dQ_kvar = Q1 - Q2;
    return {
      P: P_kW,
      pfOld: pfOld,
      pfNew: pfNew,
      Q1_kvar: Q1,
      Q2_kvar: Q2,
      dQ_kvar: Math.max(0, dQ_kvar),
      S1_kVA: P_kW / pfOld,
      S2_kVA: P_kW / pfNew
    };
  }

  // 3-Phase calculations (Wye vs Delta)
  function calcThreePhase(conn, V_LL, S_3ph_kVA, pf, freqHz) {
    freqHz = freqHz || 60;
    var P_kW = S_3ph_kVA * pf;
    var theta = Math.acos(Math.max(-1, Math.min(1, pf)));
    var Q_kvar = S_3ph_kVA * Math.sin(theta);
    var I_line = (S_3ph_kVA * 1e3) / (Math.sqrt(3) * V_LL);

    var V_phase, I_phase;
    if (conn === 'wye') {
      V_phase = V_LL / Math.sqrt(3);
      I_phase = I_line;
    } else { // delta
      V_phase = V_LL;
      I_phase = I_line / Math.sqrt(3);
    }

    var Z_phase_mag = V_phase / I_phase;
    var R_phase = Z_phase_mag * Math.cos(theta);
    var X_phase = Z_phase_mag * Math.sin(theta);

    return {
      connection: conn,
      V_LL: V_LL,
      V_phase: V_phase,
      I_line: I_line,
      I_phase: I_phase,
      S_3ph: S_3ph_kVA,
      P_3ph: P_kW,
      Q_3ph: Q_kvar,
      pf: pf,
      Z_phase: [R_phase, X_phase],
      Z_phase_mag: Z_phase_mag
    };
  }

  // Delta to Wye conversion: Zy = Zd / 3
  function deltaToWye(Zd) { return cscale(Zd, 1 / 3); }
  function wyeToDelta(Zy) { return cscale(Zy, 3); }

  // ==========================================
  // 3. SYNCHRONOUS GENERATORS (Section 4)
  // ==========================================
  // Cylindrical Rotor Machine: E_g = V_t + I_a * (Ra + jXs)
  function calcCylindricalGenerator(Vt_LL, P_3ph_MW, pf, lagging, Ra, Xs) {
    var Vt_ph = Vt_LL * 1e3 / Math.sqrt(3); // Line-to-neutral V
    var S_3ph_MVA = P_3ph_MW / pf;
    var Ia_mag = (S_3ph_MVA * 1e6) / (Math.sqrt(3) * (Vt_LL * 1e3));
    var phi = Math.acos(Math.max(-1, Math.min(1, pf))) * (lagging ? -1 : 1);
    
    var Vt_vec = [Vt_ph, 0];
    var Ia_vec = cpolar(Ia_mag, phi * 180 / Math.PI);
    var Zs = [Ra, Xs];
    var Eg_vec = cadd(Vt_vec, cmul(Ia_vec, Zs));
    var Eg_mag = cabs(Eg_vec);
    var delta_deg = cangleDeg(Eg_vec);

    // Power-Angle Curve points for delta = 0 to 180 deg
    var curve = [];
    var Pmax = (3 * Eg_mag * Vt_ph) / (Xs * 1e6); // MW total
    for (var d = 0; d <= 180; d += 2) {
      var rad = d * Math.PI / 180;
      var P_mw = Pmax * Math.sin(rad);
      curve.push({ delta: d, P: P_mw });
    }

    return {
      type: 'cylindrical',
      Vt_LL: Vt_LL,
      Vt_ph: Vt_ph,
      Ia: Ia_vec,
      Ia_mag: Ia_mag,
      Eg: Eg_vec,
      Eg_mag: Eg_mag,
      Eg_LL: Eg_mag * Math.sqrt(3) / 1e3,
      delta_deg: delta_deg,
      Pmax_MW: Pmax,
      curve: curve
    };
  }

  // Salient-Pole Machine (Blondel Two-Reaction Theory): Xd and Xq
  // P(delta) = (Eg*Vt / Xd)*sin(delta) + (Vt^2 * (Xd - Xq) / (2*Xd*Xq))*sin(2*delta)
  function calcSalientGenerator(Vt_LL, P_3ph_MW, pf, lagging, Ra, Xd, Xq) {
    var Vt_ph = Vt_LL * 1e3 / Math.sqrt(3);
    var S_3ph_MVA = P_3ph_MW / pf;
    var Ia_mag = (S_3ph_MVA * 1e6) / (Math.sqrt(3) * (Vt_LL * 1e3));
    var phi = Math.acos(Math.max(-1, Math.min(1, pf))) * (lagging ? -1 : 1);

    // Initial estimate for delta angle using Xq:
    // tan(delta) = (Ia * Xq * cos(phi) - Ia * Ra * sin(phi)) / (Vt + Ia * Ra * cos(phi) + Ia * Xq * sin(phi))
    var num = Ia_mag * Xq * Math.cos(phi) - Ia_mag * Ra * Math.sin(phi);
    var den = Vt_ph + Ia_mag * Ra * Math.cos(phi) + Ia_mag * Xq * Math.sin(phi);
    var delta_rad = Math.atan2(num, den);
    var delta_deg = delta_rad * 180 / Math.PI;

    // Direct and Quadrature currents
    var psi = phi + delta_rad; // angle between Ia and q-axis
    var Id = Ia_mag * Math.sin(psi);
    var Iq = Ia_mag * Math.cos(psi);

    // Excitation EMF Eg = Vt*cos(delta) + Iq*Ra + Id*Xd
    var Eg_mag = Vt_ph * Math.cos(delta_rad) + Iq * Ra + Id * Xd;

    // Power-Angle curve (MW 3-phase)
    var curve = [];
    var Pmax = 0;
    var delta_max = 90;
    var P_fund_max = (3 * Eg_mag * Vt_ph) / (Xd * 1e6);
    var P_rel_max = (3 * Vt_ph * Vt_ph * (Xd - Xq)) / (2 * Xd * Xq * 1e6);

    for (var d = 0; d <= 180; d += 1) {
      var rad = d * Math.PI / 180;
      var P_val = P_fund_max * Math.sin(rad) + P_rel_max * Math.sin(2 * rad);
      curve.push({ delta: d, P: P_val });
      if (P_val > Pmax) {
        Pmax = P_val;
        delta_max = d;
      }
    }

    return {
      type: 'salient',
      Vt_LL: Vt_LL,
      Vt_ph: Vt_ph,
      Ia_mag: Ia_mag,
      Id: Id,
      Iq: Iq,
      Eg_mag: Eg_mag,
      Eg_LL: Eg_mag * Math.sqrt(3) / 1e3,
      delta_deg: delta_deg,
      Pmax_MW: Pmax,
      delta_max: delta_max,
      P_fund_max: P_fund_max,
      P_rel_max: P_rel_max,
      curve: curve
    };
  }

  // ==========================================
  // 4. POWER TRANSFORMERS (Section 5)
  // ==========================================
  // Parameter extraction from Open-Circuit and Short-Circuit tests
  function calcTransformerParams(Voc, Ioc, Poc, Vsc, Isc, Psc, S_kVA, V1_rated, V2_rated) {
    // OC Test (LV side or specified) -> Rc and Xm (shunt core branch)
    var S_oc = Voc * Ioc;
    var Q_oc = Math.sqrt(Math.max(0, S_oc * S_oc - Poc * Poc));
    var Rc = (Voc * Voc) / Poc;
    var Xm = (Voc * Voc) / (Q_oc || 1e-6);

    // SC Test (HV side or specified) -> Req and Xeq (series copper branch)
    var Zsc = Vsc / Isc;
    var Req = Psc / (Isc * Isc);
    var Xeq = Math.sqrt(Math.max(0, Zsc * Zsc - Req * Req));

    return {
      Rc: Rc,
      Xm: Xm,
      Req: Req,
      Xeq: Xeq,
      Zsc: Zsc,
      turnsRatio: V1_rated / V2_rated,
      S_kVA: S_kVA,
      Pcore_W: Poc,
      Pcu_full_W: Psc
    };
  }

  // Voltage Regulation & Efficiency curves across load fraction (0.1 to 1.5)
  function calcTransformerPerformance(S_kVA, V2_rated, Req, Xeq, Pcore_W, loadFraction, pf, lagging) {
    var I2_rated = (S_kVA * 1e3) / V2_rated;
    var I2 = loadFraction * I2_rated;
    var theta = Math.acos(Math.max(-1, Math.min(1, pf))) * (lagging ? -1 : 1);

    var P_out = loadFraction * S_kVA * 1e3 * pf; // Watts
    var P_cu = Math.pow(loadFraction, 2) * (I2_rated * I2_rated * Req);
    var P_in = P_out + Pcore_W + P_cu;
    var efficiency = P_in > 0 ? (P_out / P_in) * 100 : 0;

    // Voltage regulation: VR% = ( |V2_nl| - |V2_fl| ) / |V2_fl| * 100
    // V2_nl = V2_fl + I2 * (Req + jXeq)
    var V2_fl = [V2_rated, 0];
    var I2_vec = cpolar(I2, theta * 180 / Math.PI);
    var Zeq = [Req, Xeq];
    var V2_nl = cadd(V2_fl, cmul(I2_vec, Zeq));
    var vr_exact = ((cabs(V2_nl) - V2_rated) / V2_rated) * 100;

    // Sweep performance curve for plotting
    var curve = [];
    for (var m = 0.1; m <= 1.5; m += 0.05) {
      var P_o = m * S_kVA * 1e3 * pf;
      var P_c = Math.pow(m, 2) * (I2_rated * I2_rated * Req);
      var eff = (P_o / (P_o + Pcore_W + P_c)) * 100;
      var I_v = cpolar(m * I2_rated, theta * 180 / Math.PI);
      var V_nl = cabs(cadd(V2_fl, cmul(I_v, Zeq)));
      var vr = ((V_nl - V2_rated) / V2_rated) * 100;
      curve.push({ loadFraction: m, eff: eff, vr: vr });
    }

    return {
      loadFraction: loadFraction,
      pf: pf,
      P_out_kW: P_out / 1e3,
      P_cu_kW: P_cu / 1e3,
      P_core_kW: Pcore_W / 1e3,
      efficiency_pct: efficiency,
      voltage_reg_pct: vr_exact,
      V2_terminal: V2_rated,
      V2_no_load: cabs(V2_nl),
      curve: curve
    };
  }

  // ==========================================
  // 5. TRANSMISSION LINES (Section 6)
  // Short (<80km), Medium (80-250km Pi & T), Long (>250km Hyperbolic)
  // ==========================================
  function tlineShort(Z) {
    return [ONE, Z, ZERO, ONE];
  }

  function tlineMediumPi(Z, Y) {
    var Y2 = [Y[0] / 2, Y[1] / 2];
    var A = cadd(ONE, cmul(Z, Y2));
    var B = Z;
    var C = cadd(Y, cmul(Z, cmul(Y2, Y2)));
    var D = A;
    return [A, B, C, D];
  }

  function tlineMediumT(Z, Y) {
    var Z2 = [Z[0] / 2, Z[1] / 2];
    var A = cadd(ONE, cmul(Z2, Y));
    var B = cadd(Z, cmul(cmul(Z2, Z2), Y));
    var C = Y;
    var D = A;
    return [A, B, C, D];
  }

  // Long Line Hyperbolic model:
  // gamma = sqrt(z * y), Zc = sqrt(z / y)
  // A = D = cosh(gamma * L), B = Zc * sinh(gamma * L), C = (1/Zc) * sinh(gamma * L)
  function tlineLongHyperbolic(z_per_km, y_per_km, length_km) {
    var z = z_per_km;
    var y = y_per_km;
    var gamma = csqrt(cmul(z, y));
    var Zc = csqrt(cdiv(z, y));
    var gammaL = cscale(gamma, length_km);

    var A = ccosh(gammaL);
    var D = A;
    var B = cmul(Zc, csinh(gammaL));
    var C = cdiv(csinh(gammaL), Zc);

    return {
      ABCD: [A, B, C, D],
      gamma: gamma,
      Zc: Zc,
      alpha: gamma[0],
      beta: gamma[1]
    };
  }

  function solveTransmissionLine(modelType, r_ohm_km, x_ohm_km, g_s_km, b_s_km, length_km, Vr_LL_kV, Pr_MW, pf, lagging) {
    var z_per_km = [r_ohm_km, x_ohm_km];
    var y_per_km = [g_s_km, b_s_km];
    var Z_total = cscale(z_per_km, length_km);
    var Y_total = cscale(y_per_km, length_km);

    var ABCD, Zc, gamma;
    if (modelType === 'short' || length_km < 80) {
      ABCD = tlineShort(Z_total);
      Zc = csqrt(cdiv(z_per_km, [1e-9, b_s_km || 1e-9]));
      gamma = [0, 0];
    } else if (modelType === 'medium_pi' || (modelType === 'medium' && length_km <= 250)) {
      ABCD = tlineMediumPi(Z_total, Y_total);
      Zc = csqrt(cdiv(z_per_km, y_per_km));
      gamma = csqrt(cmul(z_per_km, y_per_km));
    } else if (modelType === 'medium_t') {
      ABCD = tlineMediumT(Z_total, Y_total);
      Zc = csqrt(cdiv(z_per_km, y_per_km));
      gamma = csqrt(cmul(z_per_km, y_per_km));
    } else { // long hyperbolic
      var longSol = tlineLongHyperbolic(z_per_km, y_per_km, length_km);
      ABCD = longSol.ABCD;
      Zc = longSol.Zc;
      gamma = longSol.gamma;
    }

    var Vr_ph = Vr_LL_kV * 1e3 / Math.sqrt(3);
    var Vr_vec = [Vr_ph, 0];
    var Sr_3ph_MVA = Pr_MW / pf;
    var Ir_mag = (Sr_3ph_MVA * 1e6) / (Math.sqrt(3) * (Vr_LL_kV * 1e3));
    var theta = Math.acos(Math.max(-1, Math.min(1, pf))) * (lagging ? -1 : 1);
    var Ir_vec = cpolar(Ir_mag, theta * 180 / Math.PI);

    // Sending end quantities: Vs = A*Vr + B*Ir, Is = C*Vr + D*Ir
    var Vs_vec = cadd(cmul(ABCD[0], Vr_vec), cmul(ABCD[1], Ir_vec));
    var Is_vec = cadd(cmul(ABCD[2], Vr_vec), cmul(ABCD[3], Ir_vec));

    var Vs_mag = cabs(Vs_vec);
    var Vs_LL_kV = Vs_mag * Math.sqrt(3) / 1e3;
    var Is_mag = cabs(Is_vec);

    // Ferranti Effect (Receiving end no-load voltage for same Vs): Vr_nl = Vs / A
    var Vr_nl_vec = cdiv(Vs_vec, ABCD[0]);
    var Vr_nl_LL_kV = cabs(Vr_nl_vec) * Math.sqrt(3) / 1e3;
    var ferrantiRise = Vr_nl_LL_kV - Vs_LL_kV;

    // Voltage regulation: VR% = ( |Vs/A| - |Vr| ) / |Vr| * 100
    var vr_pct = ((cabs(Vr_nl_vec) - Vr_ph) / Vr_ph) * 100;

    // Sending end power & efficiency
    // Ss = 3 * Vs * conj(Is)
    var Ss = cscale(cmul(Vs_vec, cconj(Is_vec)), 3);
    var Ps_MW = Ss[0] / 1e6;
    var Qs_MVAR = Ss[1] / 1e6;
    var eff_pct = Ps_MW > 0 ? (Pr_MW / Ps_MW) * 100 : 0;

    // Surge Impedance Loading (SIL): SIL = V_LL^2 / |Zc|
    var Zc_mag = cabs(Zc);
    var SIL_MW = (Vr_LL_kV * Vr_LL_kV) / Zc_mag;

    // Voltage profile along the line (x = 0 to length)
    var profile = [];
    var steps = 20;
    for (var i = 0; i <= steps; i++) {
      var dist = (length_km / steps) * i;
      var remaining = length_km - dist;
      var subSol = tlineLongHyperbolic(z_per_km, y_per_km, remaining);
      var V_x_nl = cabs(cdiv(Vs_vec, subSol.ABCD[0])) * Math.sqrt(3) / 1e3;
      profile.push({ dist_km: dist, V_nl: V_x_nl });
    }

    return {
      modelType: modelType,
      ABCD: ABCD,
      Zc: Zc,
      Zc_mag: Zc_mag,
      gamma: gamma,
      Vs_LL_kV: Vs_LL_kV,
      Vs_angle_deg: cangleDeg(Vs_vec),
      Is_mag: Is_mag,
      Is_angle_deg: cangleDeg(Is_vec),
      Vr_LL_kV: Vr_LL_kV,
      Vr_nl_LL_kV: Vr_nl_LL_kV,
      ferrantiRise_kV: ferrantiRise,
      voltageRegulation_pct: vr_pct,
      Ps_MW: Ps_MW,
      Qs_MVAR: Qs_MVAR,
      Pr_MW: Pr_MW,
      eff_pct: eff_pct,
      SIL_MW: SIL_MW,
      profile: profile
    };
  }

  // ==========================================
  // 6. PER-UNIT SYSTEM (Section 7)
  // ==========================================
  function calcBaseImpedance(Vbase_LL_kV, Sbase_3ph_MVA) {
    return (Vbase_LL_kV * Vbase_LL_kV) / Sbase_3ph_MVA;
  }
  function calcBaseCurrent(Vbase_LL_kV, Sbase_3ph_MVA) {
    return (Sbase_3ph_MVA * 1e3) / (Math.sqrt(3) * Vbase_LL_kV);
  }
  function changeOfBase(Zpu_old, Vbase_old, Vbase_new, Sbase_old, Sbase_new) {
    return Zpu_old * Math.pow(Vbase_old / Vbase_new, 2) * (Sbase_new / Sbase_old);
  }

  // Multi-zone base calculation across 2 transformers
  function calcMultiZoneBases(Sbase_MVA, V_gen_kV, T1_pri_kV, T1_sec_kV, T2_pri_kV, T2_sec_kV) {
    var Vb_zone1 = V_gen_kV;
    var Vb_zone2 = Vb_zone1 * (T1_sec_kV / T1_pri_kV);
    var Vb_zone3 = Vb_zone2 * (T2_sec_kV / T2_pri_kV);

    return {
      Sbase_MVA: Sbase_MVA,
      zones: [
        { name: 'Zone 1 (Generator)', Vbase_kV: Vb_zone1, Zbase: calcBaseImpedance(Vb_zone1, Sbase_MVA), Ibase: calcBaseCurrent(Vb_zone1, Sbase_MVA) },
        { name: 'Zone 2 (Transmission)', Vbase_kV: Vb_zone2, Zbase: calcBaseImpedance(Vb_zone2, Sbase_MVA), Ibase: calcBaseCurrent(Vb_zone2, Sbase_MVA) },
        { name: 'Zone 3 (Load)', Vbase_kV: Vb_zone3, Zbase: calcBaseImpedance(Vb_zone3, Sbase_MVA), Ibase: calcBaseCurrent(Vb_zone3, Sbase_MVA) }
      ]
    };
  }

  // ==========================================
  // 7. POWER FLOW / LOAD FLOW (Sections 8, 9)
  // ==========================================
  // Build Bus Admittance Matrix Y_bus (NxN complex)
  function buildYBus(numBuses, branches) {
    var Y = [];
    for (var i = 0; i < numBuses * numBuses; i++) Y.push([0, 0]);

    branches.forEach(function (br) {
      var f = br.from - 1;
      var t = br.to - 1;
      var z = [br.r, br.x];
      var y = cdiv(ONE, z); // line admittance
      var b_sh2 = [0, (br.b_shunt || 0) / 2];

      // Off-diagonals: Y_ft = Y_tf = -y
      var offIndex1 = f * numBuses + t;
      var offIndex2 = t * numBuses + f;
      Y[offIndex1] = csub(Y[offIndex1], y);
      Y[offIndex2] = csub(Y[offIndex2], y);

      // Diagonals: sum of connected admittances + shunt
      var diagF = f * numBuses + f;
      var diagT = t * numBuses + t;
      Y[diagF] = cadd(Y[diagF], cadd(y, b_sh2));
      Y[diagT] = cadd(Y[diagT], cadd(y, b_sh2));
    });

    return Y;
  }

  // Gauss-Seidel 3-Bus Power Flow Solver
  // Buses array: [ { type: 'slack'|'pv'|'pq', V_mag, V_angle_deg, P, Q, Qmin, Qmax } ]
  function solveGaussSeidel(buses, branches, maxIter, tol) {
    maxIter = maxIter || 50;
    tol = tol || 1e-4;
    var n = buses.length;
    var Y = buildYBus(n, branches);

    // Initial voltage vector
    var V = buses.map(function (b) {
      return cpolar(b.V_mag, b.V_angle_deg || 0);
    });

    var history = [];
    var converged = false;
    var iter = 0;

    for (iter = 0; iter < maxIter; iter++) {
      var maxDiff = 0;
      var iterSnapshot = [];

      for (var i = 0; i < n; i++) {
        var b = buses[i];
        if (b.type === 'slack') {
          iterSnapshot.push([V[i][0], V[i][1]]);
          continue;
        }

        var P_i = b.P || 0;
        var Q_i = b.Q || 0;

        // If PV bus, compute reactive power Q_i first
        if (b.type === 'pv') {
          var sumYV = [0, 0];
          for (var j = 0; j < n; j++) {
            sumYV = cadd(sumYV, cmul(Y[i * n + j], V[j]));
          }
          var S_pv = cmul(V[i], cconj(sumYV));
          Q_i = -S_pv[1];
        }

        // V_new = (1 / Y_ii) * [ (P_i - jQ_i) / conj(V_i) - sum_{j!=i} Y_ij * V_j ]
        var S_inj = [P_i, -Q_i];
        var term1 = cdiv(S_inj, cconj(V[i]));

        var sumOther = [0, 0];
        for (var k = 0; k < n; k++) {
          if (k !== i) {
            sumOther = cadd(sumOther, cmul(Y[i * n + k], V[k]));
          }
        }

        var Y_ii = Y[i * n + i];
        var V_new = cdiv(csub(term1, sumOther), Y_ii);

        // If PV bus, hold magnitude and update only angle
        if (b.type === 'pv') {
          var ang = cangle(V_new);
          V_new = [b.V_mag * Math.cos(ang), b.V_mag * Math.sin(ang)];
        }

        var diff = cabs(csub(V_new, V[i]));
        if (diff > maxDiff) maxDiff = diff;
        V[i] = V_new;
        iterSnapshot.push([V[i][0], V[i][1]]);
      }

      history.push({ iter: iter + 1, maxDiff: maxDiff, voltages: iterSnapshot });
      if (maxDiff < tol) {
        converged = true;
        break;
      }
    }

    // Line power flows and losses
    var lineFlows = branches.map(function (br) {
      var f = br.from - 1;
      var t = br.to - 1;
      var z = [br.r, br.x];
      var y = cdiv(ONE, z);
      var b_sh2 = [0, (br.b_shunt || 0) / 2];

      // I_ft = (V_f - V_t)*y + V_f * b_sh2
      var I_ft = cadd(cmul(csub(V[f], V[t]), y), cmul(V[f], b_sh2));
      var S_ft = cmul(V[f], cconj(I_ft));

      // I_tf = (V_t - V_f)*y + V_t * b_sh2
      var I_tf = cadd(cmul(csub(V[t], V[f]), y), cmul(V[t], b_sh2));
      var S_tf = cmul(V[t], cconj(I_tf));

      var loss = cadd(S_ft, S_tf);

      return {
        from: br.from,
        to: br.to,
        P_from: S_ft[0],
        Q_from: S_ft[1],
        P_to: S_tf[0],
        Q_to: S_tf[1],
        P_loss: loss[0],
        Q_loss: loss[1]
      };
    });

    var busResults = buses.map(function (b, idx) {
      return {
        busNum: idx + 1,
        type: b.type,
        V_mag: cabs(V[idx]),
        V_angle_deg: cangleDeg(V[idx])
      };
    });

    return {
      converged: converged,
      iterations: iter + 1,
      buses: busResults,
      lineFlows: lineFlows,
      history: history,
      YBus: Y
    };
  }

  // ==========================================
  // 8. FAULT ANALYSIS & SYMMETRICAL COMPONENTS (Sections 10, 11, 12)
  // ==========================================
  var a = cpolar(1, 120);
  var a2 = cpolar(1, 240);
  var ONE_THIRD = [1 / 3, 0];

  var matrixA = [
    ONE, ONE, ONE,
    ONE, a2, a,
    ONE, a, a2
  ];

  var matrixAinv = [
    ONE_THIRD, ONE_THIRD, ONE_THIRD,
    ONE_THIRD, cmul(ONE_THIRD, a), cmul(ONE_THIRD, a2),
    ONE_THIRD, cmul(ONE_THIRD, a2), cmul(ONE_THIRD, a)
  ];

  function getSequenceComponents(Vabc) { return m3vecmul(matrixAinv, Vabc); }
  function getPhaseComponents(V012) { return m3vecmul(matrixA, V012); }

  // Symmetrical 3-Phase Fault (Balanced)
  function solveSymmetricalFault(Vf, Z1, Zf, MVA_base, V_LL_kV) {
    Vf = Vf || [1, 0];
    Zf = Zf || [0, 0];
    var Ztotal = cadd(Z1, Zf);
    var If1 = cdiv(Vf, Ztotal); // per unit
    var If_mag_pu = cabs(If1);
    var I_base_kA = (MVA_base) / (Math.sqrt(3) * V_LL_kV);
    var If_kA = If_mag_pu * I_base_kA;
    var SCMVA = MVA_base / cabs(Ztotal);

    var Ia = If1;
    var Ib = cmul(a2, If1);
    var Ic = cmul(a, If1);

    return {
      faultType: '3phase',
      If_pu: If_mag_pu,
      If_kA: If_kA,
      SCMVA: SCMVA,
      I_phase: [Ia, Ib, Ic],
      V_phase: [ZERO, ZERO, ZERO]
    };
  }

  // Single Line-to-Ground Fault (SLG) on Phase A
  // Ia0 = Ia1 = Ia2 = Vf / (Z0 + Z1 + Z2 + 3*Zf)
  function solveSLGFault(Vf, Z0, Z1, Z2, Zf, MVA_base, V_LL_kV) {
    Vf = Vf || [1, 0];
    Zf = Zf || [0, 0];
    var Ztotal = cadd(cadd(Z0, Z1), cadd(Z2, cscale(Zf, 3)));
    var Ia0 = cdiv(Vf, Ztotal);
    var Ia1 = Ia0;
    var Ia2 = Ia0;

    var I012 = [Ia0, Ia1, Ia2];
    var Iabc = getPhaseComponents(I012);

    // Sequence voltages: V0 = -Z0*Ia0, V1 = Vf - Z1*Ia1, V2 = -Z2*Ia2
    var V0 = cscale(cmul(Z0, Ia0), -1);
    var V1 = csub(Vf, cmul(Z1, Ia1));
    var V2 = cscale(cmul(Z2, Ia2), -1);
    var Vabc = getPhaseComponents([V0, V1, V2]);

    var I_base_kA = (MVA_base) / (Math.sqrt(3) * V_LL_kV);
    var If_pu = cabs(Iabc[0]); // Ia is the fault current

    return {
      faultType: 'slg',
      If_pu: If_pu,
      If_kA: If_pu * I_base_kA,
      I012: I012,
      Iabc: Iabc,
      V012: [V0, V1, V2],
      Vabc: Vabc
    };
  }

  // Line-to-Line Fault (L-L) between Phases B and C
  // Ia0 = 0, Ia1 = -Ia2 = Vf / (Z1 + Z2 + Zf)
  function solveLLFault(Vf, Z0, Z1, Z2, Zf, MVA_base, V_LL_kV) {
    Vf = Vf || [1, 0];
    Zf = Zf || [0, 0];
    var Ztotal = cadd(cadd(Z1, Z2), Zf);
    var Ia1 = cdiv(Vf, Ztotal);
    var Ia2 = cscale(Ia1, -1);
    var Ia0 = ZERO;

    var I012 = [Ia0, Ia1, Ia2];
    var Iabc = getPhaseComponents(I012);

    var V0 = ZERO;
    var V1 = csub(Vf, cmul(Z1, Ia1));
    var V2 = cscale(cmul(Z2, Ia2), -1);
    var Vabc = getPhaseComponents([V0, V1, V2]);

    var I_base_kA = (MVA_base) / (Math.sqrt(3) * V_LL_kV);
    var If_pu = cabs(Iabc[1]); // Ib is the fault current magnitude

    return {
      faultType: 'll',
      If_pu: If_pu,
      If_kA: If_pu * I_base_kA,
      I012: I012,
      Iabc: Iabc,
      V012: [V0, V1, V2],
      Vabc: Vabc
    };
  }

  // Double Line-to-Ground Fault (DLG) on Phases B and C to Ground
  function solveDLGFault(Vf, Z0, Z1, Z2, Zf, MVA_base, V_LL_kV) {
    Vf = Vf || [1, 0];
    Zf = Zf || [0, 0];
    var Z0_mod = cadd(Z0, cscale(Zf, 3));
    var Z_par = cdiv(cmul(Z2, Z0_mod), cadd(Z2, Z0_mod));
    var Ia1 = cdiv(Vf, cadd(Z1, Z_par));

    var V1 = csub(Vf, cmul(Z1, Ia1));
    var V2 = V1;
    var V0 = V1;

    var Ia2 = cscale(cdiv(V2, Z2), -1);
    var Ia0 = cscale(cdiv(V0, Z0_mod), -1);

    var I012 = [Ia0, Ia1, Ia2];
    var Iabc = getPhaseComponents(I012);
    var Vabc = getPhaseComponents([V0, V1, V2]);

    var If_ground_pu = cabs(cadd(Iabc[1], Iabc[2])); // Ib + Ic = 3*Ia0
    var I_base_kA = (MVA_base) / (Math.sqrt(3) * V_LL_kV);

    return {
      faultType: 'dlg',
      If_pu: If_ground_pu,
      If_kA: If_ground_pu * I_base_kA,
      I012: I012,
      Iabc: Iabc,
      V012: [V0, V1, V2],
      Vabc: Vabc
    };
  }

  // ==========================================
  // EXPORTS
  // ==========================================
  var api = {
    // Complex arithmetic
    cadd: cadd, csub: csub, cmul: cmul, cscale: cscale, cdiv: cdiv, cabs: cabs,
    cangle: cangle, cangleDeg: cangleDeg, cconj: cconj, cpolar: cpolar, csqrt: csqrt,
    cexp: cexp, csinh: csinh, ccosh: ccosh,
    mmul: mmul, m3mul: m3mul, m3vecmul: m3vecmul,

    // Fundamentals & 3-phase
    calcPowerFactor: calcPowerFactor,
    calcPFCorrection: calcPFCorrection,
    calcThreePhase: calcThreePhase,
    deltaToWye: deltaToWye,
    wyeToDelta: wyeToDelta,

    // Synchronous Machines
    calcCylindricalGenerator: calcCylindricalGenerator,
    calcSalientGenerator: calcSalientGenerator,

    // Transformers
    calcTransformerParams: calcTransformerParams,
    calcTransformerPerformance: calcTransformerPerformance,

    // Transmission Lines
    tlineShort: tlineShort,
    tlineMediumPi: tlineMediumPi,
    tlineMediumT: tlineMediumT,
    tlineLongHyperbolic: tlineLongHyperbolic,
    solveTransmissionLine: solveTransmissionLine,

    // Per-Unit
    calcBaseImpedance: calcBaseImpedance,
    calcBaseCurrent: calcBaseCurrent,
    changeOfBase: changeOfBase,
    calcMultiZoneBases: calcMultiZoneBases,

    // Power Flow
    buildYBus: buildYBus,
    solveGaussSeidel: solveGaussSeidel,

    // Fault Analysis & Symmetrical Components
    getSequenceComponents: getSequenceComponents,
    getPhaseComponents: getPhaseComponents,
    solveSymmetricalFault: solveSymmetricalFault,
    solveSLGFault: solveSLGFault,
    solveLLFault: solveLLFault,
    solveDLGFault: solveDLGFault
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.PWRCore = api;
  }

})(typeof window !== 'undefined' ? window : this);
