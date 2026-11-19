/**
 * Distribution Systems CAD Calculator - Core Engineering Engine (dist-core.js)
 * Standalone pure mathematical and analytical library covering:
 * - Conductor resistance, reactance, ampacity database (Copper & Aluminum/ACSR)
 * - Single-Phase (2-wire & 120/240V split-phase 3-wire) and Three-Phase voltage drop
 * - Full Grid-to-Customer Voltage Cascade Solver (Gen -> Transmission -> Substation -> Feeder -> Xfmr -> Service -> Meter)
 * - ANSI C84.1 Voltage Tolerance & Power Quality Compliance (Range A & Range B)
 * - Transformer bank transformation ratios and unbalanced neutral return currents
 * - Bid4Grid IEEE Equipment Specification Integration (Transformers, Switchgear, Regulators, Reclosers, Breakers)
 */
(function (root) {
  'use strict';

  // =========================================================================
  // 1. CONDUCTOR IMPEDANCE & AMPACITY DATABASE
  // Standard 60 Hz parameters (75°C conductor temp, typical pole/duct spacing)
  // Values: R in ohms/km, X in ohms/km, ampacity in Amps (NEC / IEEE 738)
  // =========================================================================
  var CONDUCTORS = {
    cu: {
      '6_AWG':    { name: '#6 AWG Cu',    area_mm2: 13.3,  r_ohm_per_km: 1.345,  x_ohm_per_km: 0.165, ampacity: 65 },
      '4_AWG':    { name: '#4 AWG Cu',    area_mm2: 21.2,  r_ohm_per_km: 0.846,  x_ohm_per_km: 0.157, ampacity: 85 },
      '2_AWG':    { name: '#2 AWG Cu',    area_mm2: 33.6,  r_ohm_per_km: 0.531,  x_ohm_per_km: 0.148, ampacity: 115 },
      '1/0_AWG':  { name: '1/0 AWG Cu',   area_mm2: 53.5,  r_ohm_per_km: 0.334,  x_ohm_per_km: 0.141, ampacity: 150 },
      '2/0_AWG':  { name: '2/0 AWG Cu',   area_mm2: 67.4,  r_ohm_per_km: 0.265,  x_ohm_per_km: 0.138, ampacity: 175 },
      '3/0_AWG':  { name: '3/0 AWG Cu',   area_mm2: 85.0,  r_ohm_per_km: 0.210,  x_ohm_per_km: 0.135, ampacity: 200 },
      '4/0_AWG':  { name: '4/0 AWG Cu',   area_mm2: 107.2, r_ohm_per_km: 0.167,  x_ohm_per_km: 0.131, ampacity: 230 },
      '250_kcmil':{ name: '250 kcmil Cu', area_mm2: 126.7, r_ohm_per_km: 0.141,  x_ohm_per_km: 0.128, ampacity: 255 },
      '350_kcmil':{ name: '350 kcmil Cu', area_mm2: 177.3, r_ohm_per_km: 0.101,  x_ohm_per_km: 0.125, ampacity: 310 },
      '500_kcmil':{ name: '500 kcmil Cu', area_mm2: 253.4, r_ohm_per_km: 0.071,  x_ohm_per_km: 0.121, ampacity: 380 },
      '750_kcmil':{ name: '750 kcmil Cu', area_mm2: 380.0, r_ohm_per_km: 0.048,  x_ohm_per_km: 0.118, ampacity: 475 },
      '1000_kcmil':{name:'1000 kcmil Cu', area_mm2: 506.7, r_ohm_per_km: 0.036,  x_ohm_per_km: 0.115, ampacity: 545 }
    },
    al: {
      '6_AWG':    { name: '#6 AWG Al',    area_mm2: 13.3,  r_ohm_per_km: 2.208,  x_ohm_per_km: 0.165, ampacity: 50 },
      '4_AWG':    { name: '#4 AWG Al',    area_mm2: 21.2,  r_ohm_per_km: 1.388,  x_ohm_per_km: 0.157, ampacity: 65 },
      '2_AWG':    { name: '#2 AWG Al',    area_mm2: 33.6,  r_ohm_per_km: 0.873,  x_ohm_per_km: 0.148, ampacity: 90 },
      '1/0_AWG':  { name: '1/0 AWG ACSR', area_mm2: 53.5,  r_ohm_per_km: 0.548,  x_ohm_per_km: 0.141, ampacity: 120 },
      '2/0_AWG':  { name: '2/0 AWG ACSR', area_mm2: 67.4,  r_ohm_per_km: 0.435,  x_ohm_per_km: 0.138, ampacity: 135 },
      '3/0_AWG':  { name: '3/0 AWG ACSR', area_mm2: 85.0,  r_ohm_per_km: 0.345,  x_ohm_per_km: 0.135, ampacity: 155 },
      '4/0_AWG':  { name: '4/0 AWG ACSR', area_mm2: 107.2, r_ohm_per_km: 0.274,  x_ohm_per_km: 0.131, ampacity: 180 },
      '250_kcmil':{ name: '250 kcmil Al', area_mm2: 126.7, r_ohm_per_km: 0.232,  x_ohm_per_km: 0.128, ampacity: 205 },
      '336_kcmil':{ name: '336.4 kcmil ACSR (Linnet)', area_mm2: 170.5, r_ohm_per_km: 0.174, x_ohm_per_km: 0.126, ampacity: 235 },
      '477_kcmil':{ name: '477 kcmil ACSR (Hawk)', area_mm2: 241.7, r_ohm_per_km: 0.122, x_ohm_per_km: 0.122, ampacity: 290 },
      '500_kcmil':{ name: '500 kcmil Al', area_mm2: 253.4, r_ohm_per_km: 0.116,  x_ohm_per_km: 0.121, ampacity: 310 },
      '795_kcmil':{ name: '795 kcmil ACSR (Drake)', area_mm2: 402.8, r_ohm_per_km: 0.073, x_ohm_per_km: 0.117, ampacity: 400 },
      '1000_kcmil':{name:'1000 kcmil Al',area_mm2: 506.7, r_ohm_per_km: 0.059,  x_ohm_per_km: 0.115, ampacity: 445 }
    }
  };

  // Convert km to feet and miles
  var KM_TO_MILES = 0.621371;
  var KM_TO_FEET = 3280.84;
  var FEET_TO_KM = 0.0003048;
  var MILES_TO_KM = 1.60934;

  // ANSI C84.1 Voltage Standard Ranges (on 120V base)
  // Range A: Service: 114V - 126V (-5.0% to +5.0%), Utilization: 110V - 125V
  // Range B: Service: 110V - 127V (-8.3% to +5.8%), Utilization: 106V - 127V
  var ANSI_C84 = {
    base_120: {
      nominal: 120,
      rangeA_min: 114,
      rangeA_max: 126,
      rangeB_min: 110,
      rangeB_max: 127
    },
    base_240: {
      nominal: 240,
      rangeA_min: 228,
      rangeA_max: 252,
      rangeB_min: 220,
      rangeB_max: 254
    },
    base_208: {
      nominal: 208,
      rangeA_min: 197,
      rangeA_max: 218,
      rangeB_min: 191,
      rangeB_max: 220
    },
    base_480: {
      nominal: 480,
      rangeA_min: 456,
      rangeA_max: 504,
      rangeB_min: 440,
      rangeB_max: 508
    }
  };

  // =========================================================================
  // 2. VOLTAGE DROP CALCULATIONS
  // Exact vector formula: ΔV = K * I * L * (R*cosφ + X*sinφ)
  // K = 2 for 1-phase 2-wire
  // K = √3 for 3-phase 3-wire / 4-wire balanced
  // =========================================================================

  /**
   * Calculate Voltage Drop for a conductor segment
   * @param {Object} params
   * @param {string} params.phaseType - '1phase' or '3phase'
   * @param {number} params.voltage - Line-to-line or line-to-neutral nominal voltage (V)
   * @param {number} params.current_A - Load current in Amperes
   * @param {number} params.length_km - One-way conductor length in km
   * @param {string} params.material - 'cu' or 'al'
   * @param {string} params.sizeKey - Conductor key (e.g., '1/0_AWG', '4/0_AWG')
   * @param {number} [params.powerFactor=0.90] - Lagging power factor (0.0 to 1.0)
   * @returns {Object} Voltage drop results
   */
  function calcVoltageDrop(params) {
    var phaseType = params.phaseType || '3phase';
    var V_nom = params.voltage || 12470;
    var I = Math.max(0, params.current_A || 0);
    var L_km = Math.max(0.0001, params.length_km || 1.0);
    var mat = params.material === 'cu' ? 'cu' : 'al';
    var size = params.sizeKey || (mat === 'al' ? '1/0_AWG' : '2_AWG');
    var cond = (CONDUCTORS[mat] && CONDUCTORS[mat][size]) || CONDUCTORS.al['1/0_AWG'];
    var pf = Math.min(1.0, Math.max(0.1, params.powerFactor !== undefined ? params.powerFactor : 0.90));

    // cos(theta) = pf, sin(theta) = sqrt(1 - pf^2)
    var cosPhi = pf;
    var sinPhi = Math.sqrt(Math.max(0, 1.0 - pf * pf));

    // Total resistance and reactance for length L
    var R_tot = cond.r_ohm_per_km * L_km;
    var X_tot = cond.x_ohm_per_km * L_km;

    // Effective impedance drop factor: R*cos(phi) + X*sin(phi)
    var effective_z = (R_tot * cosPhi + X_tot * sinPhi);

    var K = (phaseType === '1phase') ? 2.0 : Math.sqrt(3.0);
    var v_drop = K * I * effective_z;

    // End-of-line voltage
    var v_end = Math.max(0, V_nom - v_drop);
    var pct_drop = V_nom > 0 ? (v_drop / V_nom) * 100 : 0;

    // Power losses (I^2 * R)
    var n_conductors = (phaseType === '1phase') ? 2 : 3;
    var p_loss_W = n_conductors * Math.pow(I, 2) * R_tot;
    var q_loss_var = n_conductors * Math.pow(I, 2) * X_tot;

    // Thermal ampacity loading percentage
    var ampacity_pct = cond.ampacity > 0 ? (I / cond.ampacity) * 100 : 0;

    return {
      phaseType: phaseType,
      nominalVoltage_V: V_nom,
      current_A: I,
      length_km: L_km,
      length_miles: L_km * KM_TO_MILES,
      length_ft: L_km * KM_TO_FEET,
      conductor: cond,
      powerFactor: pf,
      R_ohms: R_tot,
      X_ohms: X_tot,
      v_drop_V: v_drop,
      v_end_V: v_end,
      pct_drop: pct_drop,
      p_loss_kW: p_loss_W / 1000.0,
      q_loss_kvar: q_loss_var / 1000.0,
      ampacity_A: cond.ampacity,
      ampacity_pct: ampacity_pct,
      isThermalOverload: ampacity_pct > 100
    };
  }

  // =========================================================================
  // 3. RESIDENTIAL 120/240-V SPLIT-PHASE SOLVER
  // Models the single-phase center-tapped transformer secondary:
  // L1 - Neutral = 120V
  // L2 - Neutral = 120V (180° out of phase relative to center-tap)
  // L1 - L2 = 240V
  // Neutral current I_N = I_L1 - I_L2 (scalar subtraction when at same PF)
  // =========================================================================

  /**
   * Solves residential 120/240V split-phase distribution secondary & service
   * @param {Object} params
   * @param {number} params.load1_W - 120V Load on Leg 1 in Watts
   * @param {number} params.load2_W - 120V Load on Leg 2 in Watts
   * @param {number} params.load240_W - 240V Load across L1-L2 in Watts
   * @param {number} [params.pf=0.92] - Power factor
   * @param {number} [params.secondary_len_ft=120] - Secondary conductor length in feet
   * @param {string} [params.secondary_size='4_AWG'] - Conductor size
   * @param {string} [params.secondary_mat='al'] - Material ('al' triplex or 'cu')
   */
  function solveSplitPhase(params) {
    var p1 = Math.max(0, params.load1_W || 0);
    var p2 = Math.max(0, params.load2_W || 0);
    var p240 = Math.max(0, params.load240_W || 0);
    var pf = params.pf || 0.92;
    var len_ft = params.secondary_len_ft || 120;
    var len_km = len_ft * FEET_TO_KM;
    var size = params.secondary_size || '4_AWG';
    var mat = params.secondary_mat || 'al';

    var cond = (CONDUCTORS[mat] && CONDUCTORS[mat][size]) || CONDUCTORS.al['4_AWG'];

    // Current on L1 and L2
    // I_L1 = (P1 / (120 * pf)) + (P240 / (240 * pf))
    // I_L2 = (P2 / (120 * pf)) + (P240 / (240 * pf))
    var i1_120 = p1 / (120.0 * pf);
    var i2_120 = p2 / (120.0 * pf);
    var i_240 = p240 / (240.0 * pf);

    var I_L1 = i1_120 + i_240;
    var I_L2 = i2_120 + i_240;

    // Neutral carries the difference between 120V loads (assuming same PF)
    var I_N = Math.abs(i1_120 - i2_120);

    // Conductor impedances
    var R_leg = cond.r_ohm_per_km * len_km;
    var X_leg = cond.x_ohm_per_km * len_km;
    var Z_eff = R_leg * pf + X_leg * Math.sqrt(1 - pf * pf);

    // Drop on L1 conductor, L2 conductor, and Neutral
    var drop_L1 = I_L1 * Z_eff;
    var drop_L2 = I_L2 * Z_eff;
    var drop_N = I_N * Z_eff;

    // Net voltages at customer panel
    // If L1 is more heavily loaded, neutral drop shifts neutral potential toward L1,
    // causing V_L1 to drop more and V_L2 to experience less drop (neutral shift)
    var v_L1_N = 120.0 - drop_L1 - (i1_120 >= i2_120 ? drop_N : -drop_N * 0.5);
    var v_L2_N = 120.0 - drop_L2 - (i2_120 >= i1_120 ? drop_N : -drop_N * 0.5);
    var v_L1_L2 = 240.0 - (drop_L1 + drop_L2);

    // ANSI C84 evaluation
    var ansi = evaluateANSI(v_L1_N, 120);

    return {
      I_L1: I_L1,
      I_L2: I_L2,
      I_N: I_N,
      unbalance_A: Math.abs(I_L1 - I_L2),
      v_L1_N: Math.max(0, v_L1_N),
      v_L2_N: Math.max(0, v_L2_N),
      v_L1_L2: Math.max(0, v_L1_L2),
      drop_L1_V: drop_L1,
      drop_L2_V: drop_L2,
      drop_N_V: drop_N,
      drop_240_V: drop_L1 + drop_L2,
      pct_drop_240: ((drop_L1 + drop_L2) / 240.0) * 100,
      conductor: cond,
      length_ft: len_ft,
      ansiStatus: ansi
    };
  }

  // =========================================================================
  // 4. ANSI C84.1 COMPLIANCE EVALUATION
  // =========================================================================
  function evaluateANSI(voltage, nominal) {
    nominal = nominal || 120;
    var ratio = voltage / nominal;
    var pct_dev = (ratio - 1.0) * 100;

    // Range A: ±5.0% (0.95 to 1.05)
    // Range B: -8.3% to +5.8% (0.917 to 1.058)
    if (ratio >= 0.95 && ratio <= 1.05) {
      return {
        status: 'Range A (Optimal)',
        code: 'A',
        color: '#16a34a', // green
        description: 'Meets ANSI C84.1 Range A (normal utility standard: ±5% tolerance)',
        pct_dev: pct_dev
      };
    } else if (ratio >= 0.9167 && ratio <= 1.0583) {
      return {
        status: 'Range B (Acceptable / Emergency)',
        code: 'B',
        color: '#d97706', // amber
        description: 'Within ANSI C84.1 Range B (acceptable during contingency or heavy loading)',
        pct_dev: pct_dev
      };
    } else {
      return {
        status: 'Violation (Out of Range)',
        code: 'V',
        color: '#dc2626', // red
        description: 'Exceeds ANSI C84.1 limits. Requires voltage regulation or conductor upgrade',
        pct_dev: pct_dev
      };
    }
  }

  // =========================================================================
  // 5. GRID-TO-CUSTOMER COMPLETE VOLTAGE CASCADE SOLVER
  // Traces power flow through all 7 physical stages:
  // 1. Generation (13.8 kV - 24 kV)
  // 2. Step-Up Substation GSU (13.8 kV -> 230 kV)
  // 3. High-Voltage Transmission Line (230 kV, ACSR Drake)
  // 4. Distribution Substation Transformer (230 kV -> 13.2 kV / 12.47 kV)
  // 5. Primary Distribution Feeder (13.2 kV 3-phase, ACSR Linnet, overhead/underground)
  // 6. Distribution Transformer (13.2 kV -> 120/240V 1φ or 277/480V 3φ)
  // 7. Secondary / Service Drop Lateral -> Customer Meter
  // =========================================================================

  /**
   * Solves the complete power cascade from power plant generation to customer meter
   * @param {Object} config - System configuration options
   * @returns {Object} Multi-stage solution with node telemetry and equipment specs
   */
  function solveGridCascade(config) {
    config = config || {};

    // 1. Generation Stage
    var gen_kV = config.gen_kV || 13.8;
    var gen_MVA = config.gen_MVA || 100.0;
    var gen_pf = config.gen_pf || 0.92;

    // 2. GSU Transformer Stage
    var gsu_hv_kV = config.gsu_hv_kV || 230.0;
    var gsu_z_pct = config.gsu_z_pct || 10.0; // % impedance
    var gsu_eff_pct = 99.2;

    // 3. Transmission Line Stage
    var trans_len_km = config.trans_len_km || 50.0; // 50 km (~31 miles)
    var trans_cond = CONDUCTORS.al['795_kcmil']; // ACSR Drake
    var feeder_load_MVA = config.feeder_load_MVA || 6.5;
    // Transmission line power dynamically tracks downstream feeder loading
    var trans_MVA = Math.max(0.5, feeder_load_MVA * 1.03);
    var trans_I = (trans_MVA * 1e6) / (Math.sqrt(3) * gsu_hv_kV * 1e3);
    var trans_drop = calcVoltageDrop({
      phaseType: '3phase',
      voltage: gsu_hv_kV * 1e3,
      current_A: trans_I,
      length_km: trans_len_km,
      material: 'al',
      sizeKey: '795_kcmil',
      powerFactor: gen_pf
    });
    var trans_recv_kV = trans_drop.v_end_V / 1e3;

    // 4. Substation Step-Down Stage
    var dist_sub_kV = config.dist_sub_kV || 13.2; // 13.2 kV or 12.47 kV
    var sub_xfmr_MVA = config.sub_xfmr_MVA || 25.0; // 25 MVA substation xfmr
    var sub_xfmr_z_pct = config.sub_xfmr_z_pct || 8.0;

    // 5. Distribution Feeder Stage
    var feeder_type = config.feeder_type || 'overhead'; // 'overhead' or 'underground'
    var feeder_len_km = config.feeder_len_km || 4.5; // 4.5 km (~2.8 miles)
    var feeder_load_MVA = config.feeder_load_MVA || 6.5; // 6.5 MVA on feeder
    var feeder_cond_key = (feeder_type === 'overhead') ? '336_kcmil' : '500_kcmil';
    var feeder_cond_mat = (feeder_type === 'overhead') ? 'al' : 'cu';

    var feeder_I = (feeder_load_MVA * 1e6) / (Math.sqrt(3) * dist_sub_kV * 1e3);
    var feeder_drop = calcVoltageDrop({
      phaseType: '3phase',
      voltage: dist_sub_kV * 1e3,
      current_A: feeder_I,
      length_km: feeder_len_km,
      material: feeder_cond_mat,
      sizeKey: feeder_cond_key,
      powerFactor: 0.90
    });
    var feeder_end_kV = feeder_drop.v_end_V / 1e3;

    // 6. Local Distribution Transformer Stage
    // Can be Single-Phase 120/240V (residential) or Three-Phase 277/480V or 120/208V (commercial)
    var service_type = config.service_type || 'residential_split'; // 'residential_split', 'commercial_480', 'commercial_208'
    var service_label = service_type === 'residential_split' ? '1φ 120/240V' : (service_type === 'commercial_480' ? '3φ 480V' : '3φ 208V');
    var xfmr_kVA = config.xfmr_kVA || (service_type === 'residential_split' ? 50.0 : 500.0);
    var xfmr_z_pct = config.xfmr_z_pct || (service_type === 'residential_split' ? 2.1 : 5.75);

    var sec_nominal_V = (service_type === 'residential_split') ? 120.0 : (service_type === 'commercial_480' ? 277.0 : 120.0);
    var sec_nominal_LL_V = (service_type === 'residential_split') ? 240.0 : (service_type === 'commercial_480' ? 480.0 : 208.0);

    // Transformer internal voltage regulation drop at rated load (~ Z% * cos(phi))
    var xfmr_drop_pct = (xfmr_z_pct * 0.90) * (config.xfmr_load_pct ? config.xfmr_load_pct / 100.0 : 0.75);
    var sec_xfmr_out_V = Math.max(0, sec_nominal_V * (1.0 - (feeder_drop.pct_drop / 100.0) - (xfmr_drop_pct / 100.0)));

    // 7. Secondary Triplex & Service Drop Lateral
    var sec_len_ft = config.sec_len_ft || 150.0; // 150 ft triplex / lateral
    var sec_len_km = sec_len_ft * FEET_TO_KM;
    var sec_cond_key = config.sec_cond_key || '2_AWG';
    var sec_mat = config.sec_mat || 'al';
    var customer_load_kW = config.customer_load_kW || (service_type === 'residential_split' ? 12.0 : 180.0);

    var cust_I = (service_type === 'residential_split')
      ? (customer_load_kW * 1e3) / (sec_nominal_LL_V * 0.92)
      : (customer_load_kW * 1e3) / (Math.sqrt(3) * sec_nominal_LL_V * 0.90);

    var sec_drop = calcVoltageDrop({
      phaseType: (service_type === 'residential_split') ? '1phase' : '3phase',
      voltage: sec_nominal_LL_V,
      current_A: cust_I,
      length_km: sec_len_km,
      material: sec_mat,
      sizeKey: sec_cond_key,
      powerFactor: 0.92
    });

    // Customer Meter Terminal Voltage
    var meter_V = Math.max(0, sec_xfmr_out_V - sec_drop.v_drop_V / (service_type === 'residential_split' ? 2 : Math.sqrt(3)));
    var total_pct_drop = ((sec_nominal_V - meter_V) / sec_nominal_V) * 100.0;
    var ansi = evaluateANSI(meter_V, sec_nominal_V);

    // Associated Bid4Grid Equipment Sample Spec references
    var bid4grid_specs = {
      gsu_breaker: {
        item: "Substation Circuit Breaker (Transmission)",
        standard: "IEEE C37.04 / C37.09",
        sample: "IEEE C37.04 Substation Vacuum Breaker (Rated 15kV/230kV, 600A-2000A, 20kA Interrupting)"
      },
      sub_xfmr: {
        item: "Substation Power Transformer",
        standard: "IEEE C57.12.00 / C57.12.10",
        sample: "Delta-Wye Grounded, 25 MVA, ONAN/ONAF, 230 kV to 13.2 kV, BIL 900/110 kV"
      },
      feeder_recloser: {
        item: "Automatic Circuit Recloser / Sectionalizer",
        standard: "IEEE C37.60",
        sample: "IEEE C37.60 Solid-Dielectric Recloser (15.5 kV, 630 A Continuous, 12.5 kA Interrupting, 3-cycle)"
      },
      dist_switchgear: {
        item: "Medium-Voltage Padmount / Metal-Clad Switchgear",
        standard: "IEEE C37.20.2",
        sample: "IEEE C37.20.2 Metal-Clad Switchgear (15 kV Nominal, 1200 A Bus, 25 kA Sym. Interrupting)"
      },
      dist_xfmr: {
        item: "Pad-Mounted Distribution Transformer",
        standard: "IEEE C57.12.22 / C57.12.28",
        sample: "IEEE C57 Utility-Grade 500 kVA Padmount Transformer (13.2 kV to 480Y/277V, Dead-Front, 5.75% Z)"
      },
      pole_xfmr: {
        item: "Single-Phase Overhead Distribution Transformer (Pole Can)",
        standard: "IEEE C57.12.20",
        sample: "IEEE C57.12.20 Utility-Grade 50 kVA Pole-Mount Can (13.2 kV GrdY / 7620 V to 120/240 V, 2.1% Z, ANSI 70 Grey)"
      },
      voltage_regulator: {
        item: "Step-Voltage Regulator",
        standard: "IEEE C57.15",
        sample: "IEEE C57.15 32-Step Voltage Regulator (±10% Regulation in 5/8% steps, 578 kVA, 7620V/13200V GrdY)"
      }
    };

    return {
      // Stage 1: Generation
      gen: {
        voltage_kV: gen_kV,
        power_MVA: gen_MVA,
        pf: gen_pf,
        current_kA: (gen_MVA * 1e6) / (Math.sqrt(3) * gen_kV * 1e3) / 1000.0
      },
      // Stage 2: GSU
      gsu: {
        primary_kV: gen_kV,
        secondary_kV: gsu_hv_kV,
        z_pct: gsu_z_pct,
        efficiency_pct: gsu_eff_pct
      },
      // Stage 3: Transmission
      transmission: {
        voltage_send_kV: gsu_hv_kV,
        voltage_recv_kV: trans_recv_kV,
        length_km: trans_len_km,
        length_miles: trans_len_km * KM_TO_MILES,
        conductor: trans_cond.name,
        current_A: trans_I,
        v_drop_kV: (gsu_hv_kV - trans_recv_kV),
        pct_drop: trans_drop.pct_drop,
        p_loss_MW: trans_drop.p_loss_kW / 1000.0
      },
      // Stage 4: Substation
      substation: {
        primary_kV: trans_recv_kV,
        bus_kV: dist_sub_kV,
        mva_rating: sub_xfmr_MVA,
        z_pct: sub_xfmr_z_pct
      },
      // Stage 5: Primary Feeder
      feeder: {
        type: feeder_type,
        send_kV: dist_sub_kV,
        end_kV: feeder_end_kV,
        length_km: feeder_len_km,
        length_miles: feeder_len_km * KM_TO_MILES,
        conductor: feeder_drop.conductor.name,
        current_A: feeder_I,
        v_drop_V: feeder_drop.v_drop_V,
        pct_drop: feeder_drop.pct_drop,
        p_loss_kW: feeder_drop.p_loss_kW,
        ampacity_pct: feeder_drop.ampacity_pct
      },
      // Stage 6: Distribution Transformer
      distTransformer: {
        service_type: service_type,
        service_label: service_label,
        primary_kV: feeder_end_kV,
        secondary_nominal_V: sec_nominal_V,
        secondary_nominal_LL_V: sec_nominal_LL_V,
        rating_kVA: xfmr_kVA,
        z_pct: xfmr_z_pct,
        voltage_out_V: sec_xfmr_out_V,
        internal_drop_pct: xfmr_drop_pct
      },
      // Stage 7: Secondary & Service Drop
      serviceDrop: {
        length_ft: sec_len_ft,
        conductor: sec_drop.conductor.name,
        size_key: sec_cond_key,
        material: sec_mat,
        current_A: cust_I,
        v_drop_V: sec_drop.v_drop_V,
        pct_drop: sec_drop.pct_drop,
        p_loss_kW: sec_drop.p_loss_kW
      },
      // Stage 8: Customer Meter Terminal
      customerMeter: {
        nominal_V: sec_nominal_V,
        nominal_LL_V: sec_nominal_LL_V,
        terminal_V: meter_V,
        terminal_LL_V: (service_type === 'residential_split') ? meter_V * 2.0 : meter_V * Math.sqrt(3),
        total_pct_drop: total_pct_drop,
        ansi: ansi,
        load_kW: customer_load_kW
      },
      // Bid4Grid specifications
      bid4grid_specs: bid4grid_specs
    };
  }

  // =========================================================================
  // 6. OVERHEAD & UNDERGROUND HARDWARE SPECIFICATIONS & MODELING
  // Covers IEEE C57.12, IEEE C37.20, IEEE C37.60, and NESC Rules 235/238
  // =========================================================================

  var HARDWARE_SPECS = {
    // Utility Pole Framing (NESC Class 4 Wood / Fiberglass)
    pole: {
      standard_height_ft: 40,
      setting_depth_ft: 6, // Rule: 10% of length + 2 ft = 4 + 2 = 6 ft
      above_ground_ft: 34,
      crossarm: {
        material: 'Fir / Fiberglass',
        length_ft: 8,
        pin_spacing_inches: 30, // Phase-to-phase separation
        insulators: {
          type: 'ANSI 55-4 Pin-Type Porcelain / Polymer',
          rating_kV: 15,
          bil_kV: 95,
          creepage_inches: 12.0
        }
      },
      cutout: {
        type: 'Open Expulsion Fuse Cutout (Type F2)',
        standard: 'IEEE C37.42',
        continuous_A: 100,
        interrupting_kA: 10.0,
        fuse_link: 'Type K (Fast) or Type T (Slow) 6A-100A',
        mounting: 'Crossarm or Pole Top'
      },
      arrester: {
        type: 'Heavy-Duty Metal-Oxide Varistor (MOV)',
        standard: 'IEEE C62.11',
        duty_cycle_kV: 10,
        mcov_kV: 8.4, // Max Continuous Operating Voltage for 13.2kV GrdY
        lead_length_max_ft: 2.0 // Short leads to prevent L*di/dt overvoltage
      },
      clearances: {
        primary_to_neutral_inches: 48, // NESC Rule 235 (40-60 in)
        safety_space_inches: 40, // NESC Rule 238 comms worker safety space
        ground_to_secondary_ft: 16, // Over roads / driveways
        ground_to_comms_ft: 15.5
      }
    },

    // Pad-Mounted Transformer (IEEE C57.12.22 / C57.12.28)
    padmount: {
      enclosure: {
        type: 'Compartmental Pad-Mounted NEMA 3R Tamper-Resistant',
        standard: 'IEEE C57.12.28',
        steel_gauge: 12,
        finish: 'Munsell 7GY 3.29/1.5 Green (Polyurethane Powder Coat)',
        security: 'Captive Pentahead Bolt with Padlock Hasp'
      },
      hv_compartment: {
        bushings: '200 A Loadbreak Bushing Wells & Inserts (15.5 kV, 95 kV BIL)',
        elbows: '200 A Dead-Front Loadbreak Elbow with Capacitive Test Point',
        configuration: 'Loop Feed (H1A/H1B, H2A/H2B, H3A/H3B) or Radial (H1, H2, H3)',
        parking_stand: 'Includes insulated standoff & feed-thru parking positions',
        fusing: 'Dual Protection: Bayonet Expulsion Fuse in series with Internal Current-Limiting Fuse (CLF, 50kA)'
      },
      lv_compartment: {
        bushings: '4-Hole / 6-Hole NEMA Inline Spade Terminals (Copper / Al)',
        neutral: 'Fully insulated neutral with removable ground strap to tank ground pad',
        accessories: [
          'Automatic Pressure Relief Valve (10 psig cracking)',
          '1-inch Drain Valve with Oil Sampling Device',
          'Liquid Level Float Gauge',
          'Dial Type Thermometer (-20°C to +120°C)'
        ]
      },
      // Comparison: Padmount Switchgear vs Transformer
      switchgear_comparison: {
        type: 'Pad-Mounted Vacuum / SF6 Sectionalizing Switchgear',
        standard: 'IEEE C37.20.2',
        functional_diff: 'Switchgear has NO windings and NO voltage transformation. It provides vacuum fault interruption (12.5kA-25kA), 3-position sectionalizing (Close-Open-Ground), and SCADA motor operators.'
      }
    },

    // Overhead-to-Underground Riser Pole Transition
    riser: {
      pothead: {
        type: 'Cold-Shrink Silicone Termination with Stress Cone',
        standard: 'IEEE 48 Class 1',
        bil_kV: 95,
        creepage_inches: 15.5
      },
      shield: 'Schedule 80 PVC or Hot-Dip Galvanized Rigid Steel Conduit (3-4 inch)',
      grounding: 'Concentric neutral bonded directly to pole MGN and grounding electrode'
    }
  };

  /**
   * Generates complete hardware bill of materials and spatial geometry
   * @param {string} type - 'pole', 'padmount', 'riser'
   * @param {Object} options - Custom parameters
   */
  function getHardwareModel(type, options) {
    options = options || {};
    var specs = HARDWARE_SPECS[type] || HARDWARE_SPECS.pole;

    if (type === 'pole') {
      var isXfmrPole = options.hasTransformer !== false;
      var primarykV = options.primary_kV || 13.2;
      return {
        type: 'pole',
        framing: options.framing || (isXfmrPole ? 'Transformer Tangent' : 'Crossarm Tangent'),
        pole_height_ft: specs.standard_height_ft,
        above_ground_ft: specs.above_ground_ft,
        primary_kV: primarykV,
        hasTransformer: isXfmrPole,
        crossarm: specs.crossarm,
        cutout: specs.cutout,
        arrester: specs.arrester,
        clearances: specs.clearances,
        nesc_compliant: true
      };
    } else if (type === 'padmount') {
      var isLoop = options.loopFeed !== false;
      var kVA = options.kVA || 500;
      return {
        type: 'padmount',
        rating_kVA: kVA,
        isLoopFeed: isLoop,
        feedType: isLoop ? 'Loop Feed (Dual Bushings per Phase)' : 'Radial Feed (Single Bushing)',
        enclosure: specs.enclosure,
        hv: specs.hv_compartment,
        lv: specs.lv_compartment,
        switchgear_diff: specs.switchgear_comparison
      };
    } else if (type === 'riser') {
      return {
        type: 'riser',
        pothead: specs.pothead,
        shield: specs.shield,
        grounding: specs.grounding
      };
    }
    return specs;
  }

  // =========================================================================
  // 7. TRANSFORMER BANKING & COMMERCIAL 3-PHASE SERVICES
  // Models Wye-Wye, Delta-Wye, 240V High-Leg Delta, Open-Delta, and Secondary Networks
  // =========================================================================

  /**
   * Solves 3-phase transformer bank configurations
   * @param {Object} config
   * @param {string} config.bank_type - 'wye_wye', 'delta_wye', 'high_leg_delta', 'open_delta', 'delta_delta'
   * @param {number} [config.primary_kV=13.2] - Primary line-to-line voltage
   * @param {number} [config.can_kVA=50] - Rating of individual single-phase transformer can
   * @param {number} [config.load_kW=90] - Total 3-phase load in kW
   * @param {number} [config.pf=0.90] - Power factor
   */
  function solveTransformerBank(config) {
    config = config || {};
    var type = config.bank_type || 'wye_wye';
    var prim_kV = config.primary_kV || 13.2;
    var can_kVA = config.can_kVA || 50.0;
    var load_kW = config.load_kW || 90.0;
    var pf = config.pf || 0.90;

    var result = {
      bank_type: type,
      primary_kV: prim_kV,
      num_cans: (type === 'open_delta') ? 2 : 3,
      can_kVA: can_kVA,
      load_kW: load_kW,
      pf: pf
    };

    if (type === 'wye_wye') {
      // 120/208V or 277/480V Grounded Wye
      var sec_VLL = config.sec_VLL || 208.0;
      var sec_VLN = sec_VLL / Math.sqrt(3.0);
      var total_kVA = 3 * can_kVA;
      var line_I = (load_kW * 1000) / (Math.sqrt(3) * sec_VLL * pf);

      result.name = (sec_VLL < 250) ? '120/208V 3φ 4-Wire Wye' : '277/480V 3φ 4-Wire Wye';
      result.sec_VLL = sec_VLL;
      result.sec_VLN = sec_VLN;
      result.total_bank_kVA = total_kVA;
      result.line_I_A = line_I;
      result.phase_shift_deg = 0;
      result.has_neutral = true;
      result.application = (sec_VLL < 250)
        ? 'Commercial Lighting (120V) & Small Motors/HVAC (208V 3φ)'
        : 'Industrial Plants, Large Chillers (480V 3φ), & Commercial Fluorescent/LED (277V)';
    } else if (type === 'delta_wye') {
      // Standard Delta-Wye step-down with 30° phase shift
      var sec_VLL = config.sec_VLL || 480.0;
      var sec_VLN = sec_VLL / Math.sqrt(3.0);
      var total_kVA = 3 * can_kVA;
      var line_I = (load_kW * 1000) / (Math.sqrt(3) * sec_VLL * pf);

      result.name = 'Delta-Wye (30° Phase Shift)';
      result.sec_VLL = sec_VLL;
      result.sec_VLN = sec_VLN;
      result.total_bank_kVA = total_kVA;
      result.line_I_A = line_I;
      result.phase_shift_deg = -30; // Standard IEEE Dyn1 (LV lags HV by 30°)
      result.has_neutral = true;
      result.application = 'Distribution Substation & Commercial Services: isolates triplen harmonics in Delta';
    } else if (type === 'high_leg_delta') {
      // 240V 4-Wire Delta with Center-Tapped Leg
      // Phase A-N = 120V, Phase C-N = 120V, Phase B-N = 120 * sqrt(3) = 207.85V (Orange Wild-Leg)
      var total_kVA = 3 * can_kVA;
      var line_I = (load_kW * 1000) / (Math.sqrt(3) * 240.0 * pf);

      result.name = '240V 4-Wire High-Leg (Wild-Leg) Delta';
      result.sec_VLL = 240.0;
      result.v_AN = 120.0;
      result.v_CN = 120.0;
      result.v_BN = 120.0 * Math.sqrt(3.0); // 207.85 V High Leg
      result.total_bank_kVA = total_kVA;
      result.line_I_A = line_I;
      result.phase_shift_deg = 0;
      result.has_neutral = true;
      result.nec_warning = 'NEC 110.15: High-Leg (Phase B) MUST be marked with orange tape. NEVER connect 120V single-phase loads to Phase B (it carries 208V to neutral!)';
      result.application = 'Machine shops & small businesses requiring 120V receptacles and 240V 3φ motor power';
    } else if (type === 'open_delta') {
      // Open-Delta (V-V Bank) using only 2 transformers
      // Total bank capacity is sqrt(3) * can_kVA = 57.7% of 3-can bank
      var open_kVA = Math.sqrt(3.0) * can_kVA;
      var line_I = (load_kW * 1000) / (Math.sqrt(3) * 240.0 * pf);

      result.name = 'Open-Delta (V-V Bank) 2-Transformer Service';
      result.sec_VLL = 240.0;
      result.sec_VLN = null;
      result.total_bank_kVA = open_kVA;
      result.derating_pct = 57.74; // (sqrt(3) / 3) * 100
      result.utilization_pct = 86.60; // (sqrt(3) / 2) * 100
      result.line_I_A = line_I;
      result.phase_shift_deg = 0;
      result.has_neutral = false;
      result.application = 'Two-transformer, three-wire 3φ service; center-tapped variants are not modeled';
    } else {
      // Delta-Delta 3-wire ungrounded or corner-grounded
      result.name = '240V / 480V 3-Wire Delta-Delta';
      result.sec_VLL = config.sec_VLL || 240.0;
      result.sec_VLN = 0; // No neutral
      result.total_bank_kVA = 3 * can_kVA;
      result.line_I_A = (load_kW * 1000) / (Math.sqrt(3) * result.sec_VLL * pf);
      result.has_neutral = false;
      result.application = 'Pure 3-phase motor and industrial loads (no 120V lighting)';
    }

    // Overload check
    var load_kVA = load_kW / pf;
    result.load_kVA = load_kVA;
    result.loading_pct = (load_kVA / result.total_bank_kVA) * 100.0;
    result.isOverloaded = result.loading_pct > 100.0;

    return result;
  }

  /**
   * Solves an urban Secondary Network System with network protectors
   * @param {Object} config
   */
  function solveSecondaryNetwork(config) {
    config = config || {};
    var feeder1_active = config.feeder1_active !== false;
    var feeder2_active = config.feeder2_active !== false;
    var net_load_MVA = config.net_load_MVA || 1.8;
    var xfmr_kVA = config.xfmr_kVA || 1000.0; // 1000 kVA network xfmr

    // Protectors status
    // If a primary feeder faults/trips, reverse active power flows back toward the fault
    // The network protector trips on reverse active power (P < 0) within 2-5 cycles
    var prot1_status = feeder1_active ? 'Closed (Forward Flow)' : 'Tripped (Reverse Power Cleared)';
    var prot2_status = feeder2_active ? 'Closed (Forward Flow)' : 'Tripped (Reverse Power Cleared)';

    var active_sources = (feeder1_active ? 1 : 0) + (feeder2_active ? 1 : 0);
    var grid_energized = active_sources > 0;
    var loading_per_xfmr_kVA = active_sources > 0 ? (net_load_MVA * 1000.0) / active_sources : 0;
    var xfmr_load_pct = (loading_per_xfmr_kVA / xfmr_kVA) * 100.0;

    return {
      feeder1: { name: 'Primary Feeder 1 (13.2 kV)', status: feeder1_active ? 'Energized' : 'Faulted / Open', active: feeder1_active },
      feeder2: { name: 'Primary Feeder 2 (13.2 kV)', status: feeder2_active ? 'Energized' : 'Faulted / Open', active: feeder2_active },
      protector1: { status: prot1_status, trip_cycles: 3, reverse_power_trip: !feeder1_active },
      protector2: { status: prot2_status, trip_cycles: 3, reverse_power_trip: !feeder2_active },
      secondary_grid: {
        voltage: '120/208V Urban Mesh',
        total_load_MVA: net_load_MVA,
        active_transformers: active_sources,
        load_per_xfmr_kVA: loading_per_xfmr_kVA,
        xfmr_load_pct: xfmr_load_pct,
        is_contingency_n_minus_1: active_sources === 1,
        grid_interrupted: !grid_energized
      }
    };
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================
  var api = {
    CONDUCTORS: CONDUCTORS,
    ANSI_C84: ANSI_C84,
    HARDWARE_SPECS: HARDWARE_SPECS,
    getHardwareModel: getHardwareModel,
    calcVoltageDrop: calcVoltageDrop,
    solveSplitPhase: solveSplitPhase,
    evaluateANSI: evaluateANSI,
    solveGridCascade: solveGridCascade,
    solveTransformerBank: solveTransformerBank,
    solveSecondaryNetwork: solveSecondaryNetwork,
    KM_TO_MILES: KM_TO_MILES,
    KM_TO_FEET: KM_TO_FEET,
    FEET_TO_KM: FEET_TO_KM,
    MILES_TO_KM: MILES_TO_KM
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.DistCore = api;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
