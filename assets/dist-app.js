/**
 * Distribution Systems CAD Calculator - Application UI Controller (dist-app.js)
 * Implements:
 * - Master Grid Model Synchronization Banner showing active parameter propagation
 * - Interactive Bid4Grid Equipment Sourcing Selector & Live Technical Nameplate Simulator
 * - Persistent tab panes & silky-smooth 60fps slider updates
 * - Generic IEEE utility equipment specifications (no vendor brand names)
 * - Tactile segmented buttons & responsive mobile pill navbar
 */
(function () {
  'use strict';

  var core = window.DistCore;
  var draw = window.DistDraw;

  if (!core || !draw) {
    console.error("Distribution CAD dependencies missing (dist-core.js or dist-draw.js).");
    return;
  }

  // Application State
  var state = {
    activeTab: 'cascade',
    activeNode: 'feeder',
    activeApparatus: 'dist_xfmr', // 'dist_xfmr', 'feeder_recloser', 'dist_switchgear', 'voltage_regulator', 'gsu_breaker'
    guideOpen: true,

    // Master Cascade inputs
    gen_kV: 13.8,
    gen_MVA: 100.0,
    gsu_hv_kV: 230.0,
    trans_len_miles: 25.0,
    dist_sub_kV: 13.2,
    feeder_type: 'overhead', // 'overhead' or 'underground'
    feeder_len_miles: 2.8,
    feeder_load_MVA: 6.5,
    service_type: 'residential_split', // 'residential_split', 'commercial_480', 'commercial_208'
    sec_len_ft: 125,
    sec_cond_key: '2_AWG',
    sec_mat: 'al',
    customer_load_kW: 12.0,

    // Hardware state (synchronized with master model)
    poleHasXfmr: true,
    polekV: 13.2,
    padMode: 'transformer', // 'transformer' or 'switchgear'
    padLoopFeed: true,
    padkVA: 500,

    // Bank & Network state
    bankType: 'wye_wye',
    bankCanKVA: 50,
    bankLoadKW: 90,
    netFeeder1Active: true,
    netFeeder2Active: true,
    netLoadMVA: 1.8,

    // Split-Phase inputs
    load1_W: 3200,
    load2_W: 1600,
    load240_W: 7200,
    split_len_ft: 120,
    split_size: '4_AWG',
    split_mat: 'al',

    // Results
    cascadeResult: null,
    splitResult: null,
    bankResult: null,
    networkResult: null,
    specViewMode: 'sld' // 'sld' or 'cad'
  };

  var TOPIC_GUIDES = {
    cascade: {
      title: "Complete Grid-to-Customer Voltage Cascade & Architecture",
      models: "Illustrates generation and transmission separately; estimates feeder-to-meter voltage from a regulated substation bus. Upstream transmission drop, generator and GSU ratings, and substation impedance do not affect the meter. Transformer regulation assumes X/R = 4 and 0.92 lagging power factor.",
      why: [
        "<strong>Where Transmission Ends &amp; Distribution Begins:</strong> Transmission lines (69 kV–500 kV) transport bulk energy across regions. The distribution substation steps voltage down to medium voltage (4.16 kV–34.5 kV) for safe routing down suburban streets.",
        "<strong>Why Distribution Stays at Medium Voltage Near Homes:</strong> Pushing 5 MW at 240 V would require conductors thicker than tree trunks (20,800 Amps!). Keeping voltage at 13.2 kV slashes feeder current to just 218 Amps, slashing I²R line losses by 99.9%.",
        "<strong>Conductor estimates:</strong> ACSR ratings use illustrative 75°C, sun and 2 ft/s wind conditions, with assumed equivalent spacing of 4 ft for distribution and 10 ft for transmission. Cable values are approximate. Verify actual geometry, installation and manufacturer ratings.",
        "<strong>Where the Final Transformer Fits:</strong> The pole-top 'can' or green padmount transformer is the final step-down apparatus, placed within 100–300 feet of the customer's meter to minimize low-voltage drop."
      ]
    },
    pole: {
      title: "Overhead Utility Pole Framing &amp; Hardware Architecture",
      models: "Visualizes NESC Class 4 distribution poles with 8 ft crossarms, 15 kV pin insulators, 100 A fuse cutouts, MOV surge arresters, single-phase pole-mount transformer cans, Multi-Grounded Neutral (MGN), triplex secondary, and communications worker safety space (40 in).",
      why: [
        "<strong>Distinguishing Wires on a Pole:</strong> Top wires are Medium-Voltage Primary (13.2 kV 3-phase). 4 feet below is the System Neutral (MGN). Immediately below is the low-voltage secondary/triplex (120/240 V). 40 inches below the neutral is the safety space, followed by third-party telecom (cable TV, fiber).",
        "<strong>Cutouts &amp; Lightning Arresters:</strong> A lightning strike causes high-frequency surges. The MOV arrester shunts surge current to earth before it reaches transformer windings, while the expulsion cutout drops open visibly if the transformer faults.",
        "<strong>Why 3 Conductors for Balanced Power:</strong> 3-phase power delivers constant instantaneous power without the pulsating torque of single-phase, optimizing copper weight and line capacity."
      ]
    },
    padmount: {
      title: "Pad-Mounted Transformers &amp; Switchgear Enclosures",
      models: "Models NEMA 3R tamper-resistant green cabinets with compartmentalized High-Voltage (dead-front 200 A loadbreak elbows, bayonet fuses, parking stands) and Low-Voltage (spade terminals, ground bus, gauges) sections, as well as pad-mounted sectionalizing switchgear.",
      why: [
        "<strong>Not Every Green Box is a Transformer:</strong> Pad-mounted switchgear houses vacuum interrupters and 3-position switches (Close-Open-Ground) for sectionalizing circuits without transforming voltage.",
        "<strong>Dead-Front vs. Live-Front:</strong> Modern utility installations require dead-front construction where no exposed high-voltage copper is accessible; all primary connections are enclosed in insulated, grounded EPDM rubber elbows.",
        "<strong>Dual Fusing Protection:</strong> Bayonet fuses protect against secondary overloads and high oil temperature, while an internal backing current-limiting fuse (CLF) clears catastrophic internal faults without tank rupture."
      ]
    },
    riser: {
      title: "Where Overhead Becomes Underground: Riser Poles &amp; Potheads",
      models: "Simulates the transition point where overhead 3-phase primary distribution circuits descend via fused cutouts and surge arresters into Class 1 pothead terminations and conduit risers to feed underground subdivisions.",
      why: [
        "<strong>The Role of the Stress Cone:</strong> Stripping the grounded semiconducting shield from high-voltage cable creates a massive concentration of dielectric flux lines. The geometric stress cone spreads these field lines apart to prevent electrical flashover.",
        "<strong>Surge Arrester Requirement:</strong> Underground cable has much lower surge impedance (30–40 Ω) than overhead lines (300–400 Ω), causing voltage reflections. Top arresters protect the cable dielectric.",
        "<strong>Conduit Protection:</strong> The mechanical riser pipe (Schedule 80 PVC or galvanized steel) protects high-voltage cable from traffic damage and lawnmower impacts from 8 ft above ground down into the trench."
      ]
    },
    bank: {
      title: "Transformer Banks: 3-Phase Transformation from 1-Phase Cans",
      models: "Models Wye-Wye (120/208V &amp; 277/480V), Delta-Wye (30° shift), and Open-Delta (V-V Bank) assemblies. Explains why utilities bank multiple single-phase cans on pole platforms to serve commercial customers.",
      why: [
        "<strong>Field Flexibility:</strong> Hanging standard single-phase cans on a crossarm avoids having to transport a heavy, specialized 3-phase unit. If one can fails in a storm, only that single can needs replacement.",
        "<strong>Open-Delta Economy:</strong> By using only 2 cans instead of 3, a utility can supply 3-phase motor power at 57.7% of the 3-can bank capacity. Ideal for rural commercial customers with occasional motor demand.",
        "<strong>Motor Torque Advantage:</strong> Commercial 3-phase motors deliver smooth, constant instantaneous power without the pulsating torque and starting capacitors required by single-phase motors."
      ]
    },
    highleg: {
      title: "240V 4-Wire High-Leg (Wild-Leg) Delta &amp; NEC 110.15 Safety",
      models: "Simulates the center-tapped 240 V Delta secondary. Explains why Phase B measures 208 V to neutral (120 × √3) and why NEC 110.15 mandates orange tagging to prevent equipment destruction.",
      why: [
        "<strong>The 208V Burnout Hazard:</strong> Electricians must NEVER connect 120 V single-phase loads (computers, lighting, receptacles) between the orange High-Leg (Phase B) and Neutral. Applying 208 V instantly destroys 120 V electronics!",
        "<strong>Machine Shop Niche:</strong> Machine shops with 240 V 3-phase motors and standard 120 V wall outlets use this bank to get both voltages from a single service without an auxiliary step-down transformer.",
        "<strong>Phasor Geometry:</strong> Because the neutral is centered on the A-C winding, Phase B is at the apex of an equilateral triangle at 90°, producing 120 × √3 = 207.85 V."
      ]
    },
    network: {
      title: "Urban Secondary Network Systems &amp; Reverse-Power Protectors",
      models: "Models downtown high-density mesh distribution grids fed by multiple primary feeders. Demonstrates network protector reverse-power tripping that isolates faulted feeders in 2–5 cycles without dropping customer load.",
      why: [
        "<strong>N-1 Contingency Reliability:</strong> Downtown financial districts, hospitals, and high-rises connect to a common street collector mesh fed by multiple redundant primary feeders.",
        "<strong>The Network Protector (IEEE C37.51):</strong> If Primary Feeder 1 trips, current tries to backfeed from the energized secondary mesh back up into the fault. The protector detects reverse active power (P < 0) and trips open in 3 cycles.",
        "<strong>Zero Customer Outage:</strong> While the faulted feeder is isolated for lineworker repairs, all buildings remain 100% energized through the remaining active feeders."
      ]
    },
    profile: {
      title: "ANSI C84.1 Feeder Voltage Profile &amp; Regulation Limits",
      models: "Analyzes voltage drop along feeder distance against ANSI C84.1 Range A and Range B. The local transformer estimate assumes X/R = 4 and 0.92 lagging power factor.",
      why: [
        "<strong>Preventing Appliance Damage:</strong> Induction motors (refrigerators, AC compressors) overheat and trip when voltage drops below 110 V due to increased current draw (I = P / V).",
        "<strong>Voltage Regulators &amp; Capacitors:</strong> When primary feeders exceed 5–10 miles, utilities install 32-step autotransformer regulators and shunt capacitor banks to boost the line profile back into Range A.",
        "<strong>Model boundary:</strong> The substation bus is assumed regulated; upstream voltage drop and substation impedance do not affect this profile. Verify equipment and compliance with actual system data."
      ]
    },
    split: {
      title: "Residential 120/240-V Split-Phase System &amp; Center-Tap Physics",
      models: "Simulates a single-phase center-tapped transformer using a linearized voltage-drop approximation. Extreme results, including negative leg voltages, are outside the approximation's valid range.",
      why: [
        "<strong>The 180° Center-Tap Principle:</strong> L1 to Neutral is 120 V ∠0°. L2 to Neutral is 120 V ∠180°. The voltage across both legs is V_L1 - V_L2 = 120 - (-120) = 240 V.",
        "<strong>Why Both 120 V and 240 V Are Available:</strong> Small loads (lighting, outlets) connect between either leg and Neutral (120 V). High-power loads (EV chargers, heat pumps, water heaters) connect across L1-L2 (240 V).",
        "<strong>Neutral Wire Return Current:</strong> Balanced 120 V loads cancel out on the neutral (I_N = 0). The neutral only carries the unbalanced difference current (I_N = |I_1 - I_2|), keeping neutral line losses low."
      ]
    },
    spec: {
      title: "Bid4Grid IEEE Equipment Procurement Specifications &amp; Nameplate Sizing",
      models: "Illustrative equipment examples referencing IEEE C57 and C37 standards. Ratings are not verified for a particular installation or procurement.",
      why: [
        "<strong>Pad-Mounted vs. Pole-Mounted Transformers (IEEE C57.12):</strong> Green ground-level boxes house dead-front loadbreak elbows and bayonet fuses; pole-mount cans use external porcelain bushings and fuse cutouts.",
        "<strong>Switchgear vs. Transformers:</strong> Not every green metal box is a transformer. Pad-mounted switchgear provides vacuum sectionalizing, isolation, and overcurrent protection without transforming voltage.",
        "<strong>Reclosers &amp; Fault Clearing (IEEE C37.60):</strong> Automatic reclosers clear 80%+ of distribution faults (lightning, tree branches) by de-energizing and re-closing before a permanent outage lock-out."
      ]
    }
  };

  function recalculate() {
    state.cascadeResult = core.solveGridCascade({
      gen_kV: state.gen_kV,
      gen_MVA: state.gen_MVA,
      gsu_hv_kV: state.gsu_hv_kV,
      trans_len_km: state.trans_len_miles * core.MILES_TO_KM,
      dist_sub_kV: state.dist_sub_kV,
      feeder_type: state.feeder_type,
      feeder_len_km: state.feeder_len_miles * core.MILES_TO_KM,
      feeder_load_MVA: state.feeder_load_MVA,
      service_type: state.service_type,
      sec_len_ft: state.sec_len_ft,
      sec_cond_key: state.sec_cond_key,
      sec_mat: state.sec_mat,
      customer_load_kW: state.customer_load_kW
    });

    state.splitResult = core.solveSplitPhase({
      load1_W: state.load1_W,
      load2_W: state.load2_W,
      load240_W: state.load240_W,
      pf: 0.92,
      secondary_len_ft: state.split_len_ft,
      secondary_size: state.split_size,
      secondary_mat: state.split_mat
    });

    state.bankResult = core.solveTransformerBank({
      bank_type: state.bankType,
      primary_kV: state.polekV,
      can_kVA: state.bankCanKVA,
      load_kW: state.bankLoadKW,
      sec_VLL: (state.bankType === 'wye_wye' || state.bankType === 'delta_wye') ? 208 : 240,
      pf: 0.90
    });

    state.networkResult = core.solveSecondaryNetwork({
      feeder1_active: state.netFeeder1Active,
      feeder2_active: state.netFeeder2Active,
      net_load_MVA: state.netLoadMVA,
      xfmr_kVA: 1000
    });

    updateSyncBanner();
  }

  function updateSyncBanner() {
    var elSub = document.getElementById('sync-sub');
    var elFeeder = document.getElementById('sync-feeder');
    var elCust = document.getElementById('sync-cust');
    if (elSub) elSub.innerHTML = 'Substation: <strong>' + state.dist_sub_kV + ' kV GrdY</strong>';
    if (elFeeder) elFeeder.innerHTML = 'Feeder: <strong>' + state.feeder_len_miles + ' mi ' + (state.feeder_type === 'overhead' ? 'Overhead ACSR' : 'Underground UG') + '</strong> (' + state.feeder_load_MVA + ' MVA)';
    if (elCust) elCust.innerHTML = 'Customer: <strong>' + state.customer_load_kW + ' kW (' + state.cascadeResult.distTransformer.service_label + ')</strong>';
    var elPoleVoltage = document.getElementById('pole-field-voltage');
    if (elPoleVoltage) elPoleVoltage.textContent = state.polekV;
  }

  function updateTabSharing() {
    var descriptions = {
      cascade: 'Regulated substation bus: upstream drops and impedances do not affect meter voltage. Settings also appear in V-Profile; some are used by Pole and Banks.',
      profile: 'Regulated substation bus: upstream drops and impedances do not affect meter voltage. All settings are shared with Cascade.',
      pole: 'Substation voltage is shared with Cascade and Banks; other pole settings are independent.',
      padmount: 'Independent example: primary voltage is fixed at 13.2 kV; other settings are local.',
      riser: 'Independent, fixed hardware example; Cascade settings do not change this diagram.',
      bank: 'Substation voltage is shared. Cascade load changes set the bank load; bank edits do not change Cascade.',
      highleg: 'Cascade load changes set this example load; High-Leg edits do not change Cascade.',
      network: 'Independent network example with separate feeder and load settings; primary voltage is fixed at 13.2 kV.',
      split: 'Independent residential example with separate loads and service settings. The neutral-current tile refers to this example.',
      spec: 'Grid SLD uses the master model; some apparatus views use the Pole or Padmount example settings.'
    };
    var badge = document.getElementById('dist-sync-badge');
    if (badge) badge.textContent = descriptions[state.activeTab] || '';
  }

  function updateMetricTiles() {
    var c = state.cascadeResult;
    var s = state.splitResult;
    if (!c || !s) return;

    var elTileGen = document.getElementById('tile-gen');
    var elTileFeeder = document.getElementById('tile-feeder');
    var elTileMeter = document.getElementById('tile-meter');
    var elTileDrop = document.getElementById('tile-drop');
    var elTileLoss = document.getElementById('tile-loss');
    var elTileNeutral = document.getElementById('tile-neutral');

    if (elTileGen) elTileGen.innerHTML = '<b>' + c.gen.voltage_kV + ' kV / ' + c.transmission.voltage_send_kV + ' kV</b><span>Gen &amp; Transmission</span><small>' + c.transmission.length_miles.toFixed(0) + ' mi (' + c.transmission.current_A.toFixed(0) + ' A)</small>';
    if (elTileFeeder) elTileFeeder.innerHTML = '<b>' + c.feeder.end_kV.toFixed(2) + ' kV</b><span>Feeder End Voltage</span><small>' + c.feeder.length_miles.toFixed(1) + ' mi ' + (c.feeder.type === 'overhead' ? 'Overhead' : 'UG Cable') + '</small>';
    if (elTileMeter) elTileMeter.innerHTML = '<b>' + c.customerMeter.terminal_V.toFixed(1) + ' V</b><span>Customer Service (L-N)</span><small>Nominal: ' + c.customerMeter.nominal_V + ' V</small>';
    if (elTileDrop) elTileDrop.innerHTML = '<b>' + c.customerMeter.total_pct_drop.toFixed(2) + ' %</b><span>Total Voltage Drop</span><small>ANSI ' + c.customerMeter.ansi.code + ' (' + c.customerMeter.ansi.status.split('(')[0] + ')</small>';
    if (elTileLoss) elTileLoss.innerHTML = '<b>' + (c.feeder.p_loss_kW + c.serviceDrop.p_loss_kW).toFixed(1) + ' kW</b><span>Total Line Losses</span><small>Feeder: ' + c.feeder.p_loss_kW.toFixed(1) + ' kW</small>';
    if (elTileNeutral) elTileNeutral.innerHTML = '<b>' + s.I_N.toFixed(1) + ' A</b><span>Split-Phase Neutral</span><small>L1=' + s.I_L1.toFixed(0) + 'A | L2=' + s.I_L2.toFixed(0) + 'A</small>';
  }

  function redrawActiveCanvas() {
    var canvas = document.getElementById('canvas-' + state.activeTab);
    if (!canvas) return;

    var c = state.cascadeResult;
    var s = state.splitResult;
    var b = state.bankResult;
    var n = state.networkResult;

    if (state.activeTab === 'cascade') {
      draw.drawGridCascade(canvas, c, state.activeNode);
    } else if (state.activeTab === 'pole') {
      var poleModel = core.getHardwareModel('pole', { hasTransformer: state.poleHasXfmr, primary_kV: state.polekV });
      draw.drawPoleFraming(canvas, poleModel, null);
    } else if (state.activeTab === 'padmount') {
      var padModel = core.getHardwareModel('padmount', { loopFeed: state.padLoopFeed, kVA: state.padkVA });
      draw.drawPadmountEnclosure(canvas, padModel, state.padMode);
    } else if (state.activeTab === 'riser') {
      var riserModel = core.getHardwareModel('riser', {});
      draw.drawRiserPole(canvas, riserModel);
    } else if (state.activeTab === 'bank') {
      draw.drawTransformerBank(canvas, b);
    } else if (state.activeTab === 'highleg') {
      var hlData = core.solveTransformerBank({ bank_type: 'high_leg_delta', can_kVA: state.bankCanKVA, load_kW: state.bankLoadKW });
      draw.drawHighLegDelta(canvas, hlData);
    } else if (state.activeTab === 'network') {
      draw.drawSecondaryNetwork(canvas, n);
    } else if (state.activeTab === 'profile') {
      draw.drawVoltageProfile(canvas, c);
    } else if (state.activeTab === 'split') {
      draw.drawSplitPhaseDiagram(canvas, s);
    } else if (state.activeTab === 'spec') {
      if (state.specViewMode === 'cad') {
        if (state.activeApparatus === 'pole_xfmr') {
          var poleModel = core.getHardwareModel('pole', { hasTransformer: true, primary_kV: state.polekV });
          draw.drawPoleFraming(canvas, poleModel, null);
        } else if (state.activeApparatus === 'dist_xfmr') {
          var padModel = core.getHardwareModel('padmount', { loopFeed: true, kVA: state.padkVA });
          draw.drawPadmountEnclosure(canvas, padModel, 'transformer');
        } else if (state.activeApparatus === 'dist_switchgear') {
          var padModel = core.getHardwareModel('padmount', { loopFeed: true, kVA: state.padkVA });
          draw.drawPadmountEnclosure(canvas, padModel, 'switchgear');
        } else {
          draw.drawGridCascade(canvas, c, null, state.activeApparatus);
        }
      } else {
        draw.drawGridCascade(canvas, c, null, state.activeApparatus);
      }
    }
  }

  function initAppDOM() {
    recalculate();
    var app = document.getElementById('dist-app') || document.getElementById('app');
    if (!app) return;

    var html = '';

    // 1. Header
    html += '<header class="dist-header">';
    html += '  <div class="dist-header-content">';
    html += '    <div class="dist-title-wrap">';
    html += '      <h1>Distribution Systems |&nbsp;<span style="color:var(--primary);font-weight:700;">BID</span><span style="color:var(--accent);font-weight:700;">4</span><span style="color:var(--primary);font-weight:700;">GRID</span></h1>';
    html += '      <div class="subtitle">Interactive Grid-to-Customer Voltage Cascade &amp; Hardware</div>';
    html += '    </div>';
    html += '    <div class="dist-header-actions">';
    html += '      <a href="datacenter.html" class="dist-btn-action">Data Center</a>';
    html += '      <a href="transmission.html" class="dist-btn-action">⚡ Transmission</a>';
    html += '      <button type="button" class="dist-watch-video" id="btn-watch-walkthrough" title="Watch Video Walkthrough" aria-label="Watch video walkthrough">';
    html += '        <span class="dist-watch-icon"><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 2.5v11l9-5.5z"/></svg></span>';
    html += '        <span class="dist-watch-label">Walkthrough</span>';
    html += '      </button>';
    html += '    </div>';
    html += '  </div>';
    html += '</header>';

    // 2. Sticky Pill Navigation Bar
    html += '<div class="dist-nav-container">';
    html += '  <nav class="dist-nav" aria-label="Main Navigation">';
    var tabs = [
      { id: 'theory', icon: '📖', full: 'Theory & Formulas', short: 'Theory' },
      { id: 'cascade', icon: '⚡', full: 'Cascade', short: 'Cascade' },
      { id: 'pole', icon: '🪵', full: 'Pole', short: 'Pole' },
      { id: 'riser', icon: '🧗', full: 'Riser', short: 'Riser' },
      { id: 'padmount', icon: '🟩', full: 'Padmount', short: 'Padmount' },
      { id: 'split', icon: '🔌', full: 'Split-Phase', short: 'Split' },
      { id: 'bank', icon: '📦', full: '3Φ Banks', short: 'Banks' },
      { id: 'highleg', icon: '🟧', full: 'High-Leg', short: 'High-Leg' },
      { id: 'network', icon: '🏙️', full: 'Network', short: 'Network' },
      { id: 'profile', icon: '📉', full: 'V-Profile', short: 'V-Profile' },
      { id: 'spec', icon: '📋', full: 'Specs', short: 'Specs' }
    ];

    tabs.forEach(function (tab) {
      var isAct = state.activeTab === tab.id;
      html += '    <button class="' + (isAct ? 'on' : '') + '" data-tab="' + tab.id + '">';
      html += '      <span class="dist-tab-icon">' + tab.icon + '</span>';
      html += '      <span class="dist-tab-full">' + tab.full + '</span>';
      html += '      <span class="dist-tab-short">' + tab.short + '</span>';
      html += '    </button>';
    });
    html += '  </nav>';
    html += '</div>';

    html += '<main class="dist-main">';

    // 3. Master Grid Model Synchronization Banner
    html += '<div class="dist-sync-banner" id="dist-sync-banner">';
    html += '  <div class="dist-sync-info">';
    html += '    <span class="dist-sync-pulse"></span>';
    html += '    <span class="dist-sync-title">MASTER GRID MODEL:</span>';
    html += '    <span id="sync-sub">Substation: <strong>' + state.dist_sub_kV + ' kV GrdY</strong></span>';
    html += '    <span class="dist-sync-sep">•</span>';
    html += '    <span id="sync-feeder">Feeder: <strong>' + state.feeder_len_miles + ' mi ' + (state.feeder_type === 'overhead' ? 'Overhead ACSR' : 'Underground UG') + '</strong> (' + state.feeder_load_MVA + ' MVA)</span>';
    html += '    <span class="dist-sync-sep">•</span>';
    html += '    <span id="sync-cust">Customer: <strong>' + state.customer_load_kW + ' kW (' + state.cascadeResult.distTransformer.service_label + ')</strong></span>';
    html += '  </div>';
    html += '  <div class="dist-sync-badge" id="dist-sync-badge" aria-live="polite"></div>';
    html += '</div>';

    // 4. Six Signature Metric Tiles
    html += '<div class="dist-tiles">';
    html += '  <div class="dist-tile purple" id="tile-gen"></div>';
    html += '  <div class="dist-tile blue" id="tile-feeder"></div>';
    html += '  <div class="dist-tile green" id="tile-meter"></div>';
    html += '  <div class="dist-tile amber" id="tile-drop"></div>';
    html += '  <div class="dist-tile hot" id="tile-loss"></div>';
    html += '  <div class="dist-tile green" id="tile-neutral"></div>';
    html += '</div>';

    // 5. Topic Guide Card
    html += '<div class="dist-guide-card">';
    html += '  <div class="dist-guide-header" id="dist-guide-toggle">';
    html += '    <h3 id="dist-guide-title">📌 Topic Guidance</h3>';
    html += '    <span style="font-size:12px;color:var(--muted)" id="dist-guide-btn">▲ Hide Guide</span>';
    html += '  </div>';
    html += '  <div class="dist-guide-body" id="dist-guide-content"></div>';
    html += '</div>';

    // 6. Persistent Tab Panes
    tabs.forEach(function (tab) {
      if (tab.id === 'theory') {
        html += '<div class="dist-tab-pane" id="pane-theory" style="display:' + (state.activeTab === 'theory' ? 'block' : 'none') + ';">';
        html += '  <div class="card dist-theory-card">';
        html += '    <h2 class="card-title">Technical Theory &amp; Formulas</h2>';
        html += '    <iframe class="dist-theory-frame" src="assets/dist-help.html?v=2" title="Distribution Systems Technical Theory and Formulas" loading="lazy"></iframe>';
        html += '  </div>';
        html += '</div>';
        return;
      }
      html += '<div class="dist-tab-pane" id="pane-' + tab.id + '" style="display:' + (state.activeTab === tab.id ? 'block' : 'none') + ';">';
      html += '  <div class="dist-grid-split">';
      html += '    <div class="card" id="ctrl-' + tab.id + '"></div>';
      html += '    <div class="card">';
      if (tab.id === 'spec') {
        html += '      <div class="card-header">';
        html += '        <h2 class="card-title">📋 Bid4Grid Equipment CAD Diagram</h2>';
        html += '        <div class="btn-group cols-2" id="grp-specViewMode" style="margin:0;max-width:260px">';
        html += '          <button type="button" class="' + (state.specViewMode === 'sld' ? 'active' : '') + '" data-spec-view="sld">Grid SLD</button>';
        html += '          <button type="button" class="' + (state.specViewMode === 'cad' ? 'active' : '') + '" data-spec-view="cad">Apparatus CAD</button>';
        html += '        </div>';
        html += '      </div>';
      } else {
        html += '      <div class="card-header">';
        html += '        <h2 class="card-title">' + tab.icon + ' ' + tab.full + ' CAD Diagram</h2>';
        html += '      </div>';
      }
      html += '      <div class="dist-canvas-wrapper">';
      html += '        <canvas id="canvas-' + tab.id + '" class="dist-canvas" width="850" height="420"></canvas>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });

    html += '</main>';

    html += '<dialog class="dist-video-overlay" id="walkthrough-overlay" aria-labelledby="walkthrough-title">';
    html += '  <div class="dist-video-header">';
    html += '    <div>';
    html += '      <h2 id="walkthrough-title">Distribution Systems Walkthrough</h2>';
    html += '      <p>Use the video controls to pause or adjust playback.</p>';
    html += '    </div>';
    html += '    <button type="button" class="dist-btn-action" id="btn-close-walkthrough" aria-label="Close walkthrough">Close</button>';
    html += '  </div>';
    html += '  <video id="walkthrough-video" controls playsinline preload="metadata">';
    html += '    <source src="assets/dist-walkthrough.mp4?v=2" type="video/mp4">';
    html += '    Your browser does not support HTML video.';
    html += '  </video>';
    html += '  <p class="dist-video-status" id="walkthrough-status" aria-live="polite"></p>';
    html += '</dialog>';

    app.innerHTML = html;

    // Fill in Controls for all panes
    renderAllControlPanels();

    // Attach Event Handlers
    bindAllEvents();

    // Initial update
    updateTopicGuide();
    updateTabSharing();
    updateMetricTiles();
    redrawActiveCanvas();
  }

  function buildCascadeControlsHTML(prefix) {
    prefix = prefix || 'cas';
    var h = '<div class="card-header"><h2 class="card-title">⚡ Voltage Cascade Settings</h2><span class="badge green">MASTER MODEL</span></div>';
    h += '<div class="dist-form-section-title">Bulk Generation &amp; Transmission Supply</div>';
    h += '<div class="dist-input-row">';
    h += '  <div class="dist-input-group">';
    h += '    <label>Generator Terminal <span class="unit">kV</span></label>';
    h += '    <select id="' + prefix + '-gen_kV" data-field="gen_kV">';
    h += '      <option value="13.8" ' + (state.gen_kV === 13.8 ? 'selected' : '') + '>13.8 kV (Standard Gen)</option>';
    h += '      <option value="18.0" ' + (state.gen_kV === 18.0 ? 'selected' : '') + '>18.0 kV (Gas Turbine)</option>';
    h += '      <option value="24.0" ' + (state.gen_kV === 24.0 ? 'selected' : '') + '>24.0 kV (Nuclear/Steam)</option>';
    h += '    </select>';
    h += '  </div>';
    h += '  <div class="dist-input-group">';
    h += '    <label>Transmission Grid <span class="unit">kV</span></label>';
    h += '    <select id="' + prefix + '-gsu_hv_kV" data-field="gsu_hv_kV">';
    h += '      <option value="230" ' + (state.gsu_hv_kV === 230 ? 'selected' : '') + '>230 kV (Standard)</option>';
    h += '      <option value="138" ' + (state.gsu_hv_kV === 138 ? 'selected' : '') + '>138 kV Sub-Trans</option>';
    h += '      <option value="345" ' + (state.gsu_hv_kV === 345 ? 'selected' : '') + '>345 kV Bulk Grid</option>';
    h += '      <option value="500" ' + (state.gsu_hv_kV === 500 ? 'selected' : '') + '>500 kV EHV Grid</option>';
    h += '      <option value="69" ' + (state.gsu_hv_kV === 69 ? 'selected' : '') + '>69 kV Regional</option>';
    h += '    </select>';
    h += '  </div>';
    h += '</div>';

    h += '<div class="dist-input-group">';
    h += '  <label>Transmission Distance <span class="unit">miles</span></label>';
    h += '  <input type="number" id="' + prefix + '-trans_len_miles" data-field="trans_len_miles" step="5" min="5" max="150" value="' + state.trans_len_miles + '">';
    h += '</div>';

    h += '<div class="dist-form-section-title">Feeder Construction</div>';
    h += '<div class="btn-group" id="' + prefix + '-grp-feeder_type">';
    h += '  <button type="button" class="' + (state.feeder_type === 'overhead' ? 'active' : '') + '" data-field="feeder_type" data-val="overhead">Overhead (ACSR)</button>';
    h += '  <button type="button" class="' + (state.feeder_type === 'underground' ? 'active' : '') + '" data-field="feeder_type" data-val="underground">Underground (UG)</button>';
    h += '</div>';

    h += '<div class="dist-form-section-title">Customer Service Type</div>';
    h += '<div class="btn-group" id="' + prefix + '-grp-service_type">';
    h += '  <button type="button" class="' + (state.service_type === 'residential_split' ? 'active' : '') + '" data-field="service_type" data-val="residential_split">1φ 120/240V</button>';
    h += '  <button type="button" class="' + (state.service_type === 'commercial_480' ? 'active' : '') + '" data-field="service_type" data-val="commercial_480">3φ 480V</button>';
    h += '  <button type="button" class="' + (state.service_type === 'commercial_208' ? 'active' : '') + '" data-field="service_type" data-val="commercial_208">3φ 208V</button>';
    h += '</div>';

    h += '<div class="dist-input-row">';
    h += '  <div class="dist-input-group">';
    h += '    <label>Substation Bus <span class="unit">kV</span></label>';
    h += '    <select id="' + prefix + '-dist_sub_kV" data-field="dist_sub_kV">';
    h += '      <option value="13.2" ' + (state.dist_sub_kV === 13.2 ? 'selected' : '') + '>13.2 kV GrdY</option>';
    h += '      <option value="12.47" ' + (state.dist_sub_kV === 12.47 ? 'selected' : '') + '>12.47 kV GrdY</option>';
    h += '      <option value="24.94" ' + (state.dist_sub_kV === 24.94 ? 'selected' : '') + '>24.94 kV GrdY</option>';
    h += '      <option value="34.5" ' + (state.dist_sub_kV === 34.5 ? 'selected' : '') + '>34.5 kV GrdY</option>';
    h += '    </select>';
    h += '  </div>';
    h += '  <div class="dist-input-group">';
    h += '    <label>Feeder Length <span class="unit">mi</span></label>';
    h += '    <input type="number" id="' + prefix + '-feeder_len_miles" data-field="feeder_len_miles" step="0.2" min="0.2" max="25" value="' + state.feeder_len_miles + '">';
    h += '  </div>';
    h += '</div>';

    h += '<div class="dist-input-row">';
    h += '  <div class="dist-input-group">';
    h += '    <label>Feeder Load <span class="unit">MVA</span></label>';
    h += '    <input type="number" id="' + prefix + '-feeder_load_MVA" data-field="feeder_load_MVA" step="0.5" min="0.5" max="25" value="' + state.feeder_load_MVA + '">';
    h += '  </div>';
    h += '  <div class="dist-input-group">';
    h += '    <label>Customer Load <span class="unit">kW</span></label>';
    h += '    <input type="number" id="' + prefix + '-customer_load_kW" data-field="customer_load_kW" step="1" min="1" max="1000" value="' + state.customer_load_kW + '">';
    h += '  </div>';
    h += '</div>';

    h += '<div class="dist-input-row">';
    h += '  <div class="dist-input-group">';
    h += '    <label>Service Conductor</label>';
    h += '    <select id="' + prefix + '-sec_cond_key" data-field="sec_cond_key">';
    h += '      <option value="4_AWG" ' + (state.sec_cond_key === '4_AWG' ? 'selected' : '') + '>#4 AWG Triplex</option>';
    h += '      <option value="2_AWG" ' + (state.sec_cond_key === '2_AWG' ? 'selected' : '') + '>#2 AWG Triplex</option>';
    h += '      <option value="1/0_AWG" ' + (state.sec_cond_key === '1/0_AWG' ? 'selected' : '') + '>1/0 AWG Triplex</option>';
    h += '      <option value="4/0_AWG" ' + (state.sec_cond_key === '4/0_AWG' ? 'selected' : '') + '>4/0 AWG Triplex</option>';
    h += '    </select>';
    h += '  </div>';
    h += '  <div class="dist-input-group">';
    h += '    <label>Service Drop <span class="unit">ft</span></label>';
    h += '    <input type="number" id="' + prefix + '-sec_len_ft" data-field="sec_len_ft" step="10" min="20" max="500" value="' + state.sec_len_ft + '">';
    h += '  </div>';
    h += '</div>';
    return h;
  }

  function renderAllControlPanels() {
    // 1. Cascade Controls
    var cCascade = document.getElementById('ctrl-cascade');
    if (cCascade) {
      cCascade.innerHTML = buildCascadeControlsHTML('cas');
    }

    // 2. Pole Controls (Inherits master feeder kV)
    var cPole = document.getElementById('ctrl-pole');
    if (cPole) {
      var h = '<div class="card-header"><h2 class="card-title">🪵 Pole Framing &amp; Hardware</h2><span class="badge blue">NESC 235/238</span></div>';
      h += '<div class="dist-form-section-title">Pole Configuration</div>';
      h += '<div class="btn-group" id="grp-poleHasXfmr">';
      h += '  <button type="button" class="' + (state.poleHasXfmr ? 'active' : '') + '" data-field="poleHasXfmr" data-val="true">Transformer Pole</button>';
      h += '  <button type="button" class="' + (!state.poleHasXfmr ? 'active' : '') + '" data-field="poleHasXfmr" data-val="false">Tangent Pole</button>';
      h += '</div>';

      h += '<div class="dist-input-group">';
      h += '  <label>Primary Voltage <span class="unit">kV (Inherited from Master Model)</span></label>';
      h += '  <select id="ctrl-polekV" data-field="polekV">';
      h += '    <option value="13.2" ' + (state.polekV === 13.2 ? 'selected' : '') + '>13.2 kV GrdY</option>';
      h += '    <option value="12.47" ' + (state.polekV === 12.47 ? 'selected' : '') + '>12.47 kV GrdY</option>';
      h += '    <option value="24.94" ' + (state.polekV === 24.94 ? 'selected' : '') + '>24.94 kV GrdY</option>';
      h += '    <option value="34.5" ' + (state.polekV === 34.5 ? 'selected' : '') + '>34.5 kV GrdY</option>';
      h += '  </select>';
      h += '</div>';

      h += '<div style="background:#faf8f5;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;line-height:1.5;margin-top:10px">';
      h += '  <strong>Field Recognition:</strong><br>';
      h += '  • <strong>Top Conductors:</strong> <span id="pole-field-voltage">' + state.polekV + '</span> kV 3φ ACSR on 8ft crossarm.<br>';
      h += '  • <strong>Protective Cutout:</strong> 100 A expulsion cutout + MOV arrester.<br>';
      h += '  • <strong>Transformer Can:</strong> 50 kVA step-down unit.<br>';
      h += '  • <strong>Neutral Space:</strong> System MGN &amp; triplex service drop.<br>';
      h += '  • <strong>Safety Space:</strong> 40 inches vertical clearance to telecom.';
      h += '</div>';
      cPole.innerHTML = h;
    }

    // 3. Padmount Controls
    var cPad = document.getElementById('ctrl-padmount');
    if (cPad) {
      var h = '<div class="card-header"><h2 class="card-title">🟩 Padmount Apparatus</h2><span class="badge green">IEEE C57.12</span></div>';
      h += '<div class="dist-form-section-title">Apparatus Function</div>';
      h += '<div class="btn-group" id="grp-padMode">';
      h += '  <button type="button" class="' + (state.padMode === 'transformer' ? 'active' : '') + '" data-field="padMode" data-val="transformer">Transformer</button>';
      h += '  <button type="button" class="' + (state.padMode === 'switchgear' ? 'active' : '') + '" data-field="padMode" data-val="switchgear">Switchgear</button>';
      h += '</div>';

      h += '<div class="dist-form-section-title">Bushing Configuration</div>';
      h += '<div class="btn-group" id="grp-padLoopFeed">';
      h += '  <button type="button" class="' + (state.padLoopFeed ? 'active' : '') + '" data-field="padLoopFeed" data-val="true">Loop Feed (6)</button>';
      h += '  <button type="button" class="' + (!state.padLoopFeed ? 'active' : '') + '" data-field="padLoopFeed" data-val="false">Radial Feed (3)</button>';
      h += '</div>';

      h += '<div class="dist-input-group">';
      h += '  <label>Rating <span class="unit">kVA</span></label>';
      h += '  <select id="ctrl-padkVA" data-field="padkVA">';
      h += '    <option value="150" ' + (state.padkVA === 150 ? 'selected' : '') + '>150 kVA Padmount</option>';
      h += '    <option value="500" ' + (state.padkVA === 500 ? 'selected' : '') + '>500 kVA Commercial Padmount</option>';
      h += '    <option value="1500" ' + (state.padkVA === 1500 ? 'selected' : '') + '>1500 kVA Industrial Padmount</option>';
      h += '  </select>';
      h += '</div>';
      cPad.innerHTML = h;
    }

    // 4. Riser Controls
    var cRiser = document.getElementById('ctrl-riser');
    if (cRiser) {
      var h = '<div class="card-header"><h2 class="card-title">🧗 Riser Transition</h2><span class="badge blue">IEEE 48</span></div>';
      h += '<div style="background:#faf8f5;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6">';
      h += '  <strong>Apparatus &amp; Physics:</strong><br>';
      h += '  • <strong>Class 1 Potheads:</strong> Silicone stress cones spread electrical flux at shield cutoff.<br>';
      h += '  • <strong>Cutouts &amp; Arresters:</strong> Clear faults and clamp lightning surges before underground cable entry.<br>';
      h += '  • <strong>Conduit Riser:</strong> Sched 80 PVC / steel shields cable from mechanical impacts.';
      h += '</div>';
      cRiser.innerHTML = h;
    }

    // 5. Bank Controls
    var cBank = document.getElementById('ctrl-bank');
    if (cBank) {
      var h = '<div class="card-header"><h2 class="card-title">📦 3-Phase Transformer Banks</h2><span class="badge blue">C57.12.20</span></div>';
      h += '<div class="dist-form-section-title">Bank Configuration</div>';
      h += '<div class="btn-group" id="grp-bankType">';
      h += '  <button type="button" class="' + (state.bankType === 'wye_wye' ? 'active' : '') + '" data-field="bankType" data-val="wye_wye">Wye-Wye</button>';
      h += '  <button type="button" class="' + (state.bankType === 'delta_wye' ? 'active' : '') + '" data-field="bankType" data-val="delta_wye">Delta-Wye</button>';
      h += '  <button type="button" class="' + (state.bankType === 'open_delta' ? 'active' : '') + '" data-field="bankType" data-val="open_delta">Open-Delta</button>';
      h += '</div>';

      h += '<div class="dist-input-row">';
      h += '  <div class="dist-input-group">';
      h += '    <label>Can Rating <span class="unit">kVA</span></label>';
      h += '    <select id="ctrl-bankCanKVA" data-field="bankCanKVA">';
      h += '      <option value="25" ' + (state.bankCanKVA === 25 ? 'selected' : '') + '>25 kVA Cans</option>';
      h += '      <option value="50" ' + (state.bankCanKVA === 50 ? 'selected' : '') + '>50 kVA Cans</option>';
      h += '      <option value="100" ' + (state.bankCanKVA === 100 ? 'selected' : '') + '>100 kVA Cans</option>';
      h += '    </select>';
      h += '  </div>';
      h += '  <div class="dist-input-group">';
      h += '    <label>3φ Load <span class="unit">kW</span></label>';
      h += '    <input type="number" id="ctrl-bankLoadKW" data-field="bankLoadKW" step="1" min="1" max="1000" value="' + state.bankLoadKW + '">';
      h += '  </div>';
      h += '</div>';
      cBank.innerHTML = h;
    }

    // 6. High-Leg Controls (Calm Neutral Styling, Zero Harsh Red)
    var cHighLeg = document.getElementById('ctrl-highleg');
    if (cHighLeg) {
      var h = '<div class="card-header"><h2 class="card-title">🟧 240V High-Leg Delta</h2><span class="badge amber">NEC 110.15</span></div>';
      h += '<div style="background:#f8fafc;border:1px solid var(--border);border-left:4px solid #d97706;border-radius:8px;padding:12px;margin-bottom:14px;font-size:12px;color:#1e293b;line-height:1.5">';
      h += '  <strong style="color:#b45309">⚠️ NEC 110.15 ORANGE RULE:</strong><br>';
      h += '  Phase B carries <strong>208 V to Neutral</strong> (120 × √3). Must be identified with orange finish. Connecting 120 V single-phase loads to Phase B destroys electronics!';
      h += '</div>';

      var i_3ph = (state.bankLoadKW * 1000) / (Math.sqrt(3) * 240 * 0.90);
      h += '<div class="dist-input-group">';
      h += '  <label>Commercial 3φ Load <span class="unit" id="lbl-highleg-load">' + state.bankLoadKW + ' kW (' + i_3ph.toFixed(1) + ' A @ 240V)</span></label>';
      h += '  <input type="range" id="ctrl-highleg-range" min="1" max="1000" step="1" value="' + state.bankLoadKW + '">';
      h += '  <small style="color:var(--muted)">Adjust slider to watch dynamic amperage change on diagram</small>';
      h += '</div>';

      h += '<div class="dist-input-row" style="margin-top:8px">';
      h += '  <div class="dist-input-group">';
      h += '    <label>Load Power <span class="unit">kW</span></label>';
      h += '    <input type="number" id="ctrl-highleg-num" step="1" min="1" max="1000" value="' + state.bankLoadKW + '">';
      h += '  </div>';
      h += '  <div class="dist-input-group">';
      h += '    <label>Bank Rating</label>';
      h += '    <select id="ctrl-highleg-can" data-field="bankCanKVA">';
      h += '      <option value="50" ' + (state.bankCanKVA === 50 ? 'selected' : '') + '>3 × 50 kVA (150 kVA)</option>';
      h += '      <option value="25" ' + (state.bankCanKVA === 25 ? 'selected' : '') + '>3 × 25 kVA (75 kVA)</option>';
      h += '      <option value="100" ' + (state.bankCanKVA === 100 ? 'selected' : '') + '>3 × 100 kVA (300 kVA)</option>';
      h += '    </select>';
      h += '  </div>';
      h += '</div>';
      cHighLeg.innerHTML = h;
    }

    // 7. Network Controls
    var cNet = document.getElementById('ctrl-network');
    if (cNet) {
      var h = '<div class="card-header"><h2 class="card-title">🏙️ Urban Secondary Network</h2><span class="badge blue">IEEE C37.51</span></div>';
      h += '<div class="dist-form-section-title">Primary Feeder 1 (Vault 1)</div>';
      h += '<div class="btn-group" id="grp-netFeeder1Active">';
      h += '  <button type="button" class="' + (state.netFeeder1Active ? 'active' : '') + '" data-field="netFeeder1Active" data-val="true">Energized</button>';
      h += '  <button type="button" class="' + (!state.netFeeder1Active ? 'active' : '') + '" data-field="netFeeder1Active" data-val="false">Faulted / Open</button>';
      h += '</div>';

      h += '<div class="dist-form-section-title">Primary Feeder 2 (Vault 2)</div>';
      h += '<div class="btn-group" id="grp-netFeeder2Active">';
      h += '  <button type="button" class="' + (state.netFeeder2Active ? 'active' : '') + '" data-field="netFeeder2Active" data-val="true">Energized</button>';
      h += '  <button type="button" class="' + (!state.netFeeder2Active ? 'active' : '') + '" data-field="netFeeder2Active" data-val="false">Faulted / Open</button>';
      h += '</div>';

      h += '<div class="dist-input-group">';
      h += '  <label>Grid Load <span class="unit">MVA</span></label>';
      h += '  <input type="number" id="ctrl-netLoadMVA" data-field="netLoadMVA" step="0.2" min="0.5" max="3.5" value="' + state.netLoadMVA + '">';
      h += '</div>';
      cNet.innerHTML = h;
    }

    // 8. Profile Controls (Mirrors Master Cascade with unique IDs and shared data-field)
    var cProfile = document.getElementById('ctrl-profile');
    if (cProfile) {
      cProfile.innerHTML = buildCascadeControlsHTML('prof');
    }

    // 9. Split-Phase Controls (Smooth Range Sliders)
    var cSplit = document.getElementById('ctrl-split');
    if (cSplit) {
      var h = '<div class="card-header"><h2 class="card-title">🔌 Residential 120/240V Split-Phase</h2><span class="badge green">120/240V</span></div>';

      h += '<div class="dist-input-group">';
      h += '  <label>Leg 1 (120 V Loads) <span class="unit" id="lbl-load1_W">' + state.load1_W + ' W (' + (state.load1_W / (120 * 0.92)).toFixed(1) + ' A)</span></label>';
      h += '  <input type="range" id="ctrl-load1_W" min="500" max="8000" step="100" value="' + state.load1_W + '">';
      h += '  <small style="color:var(--muted)">Lighting &amp; small appliance circuits</small>';
      h += '</div>';

      h += '<div class="dist-input-group">';
      h += '  <label>Leg 2 (120 V Loads) <span class="unit" id="lbl-load2_W">' + state.load2_W + ' W (' + (state.load2_W / (120 * 0.92)).toFixed(1) + ' A)</span></label>';
      h += '  <input type="range" id="ctrl-load2_W" min="500" max="8000" step="100" value="' + state.load2_W + '">';
      h += '  <small style="color:var(--muted)">Refrigeration &amp; electronics circuits</small>';
      h += '</div>';

      h += '<div class="dist-input-group">';
      h += '  <label>240 V Load (L1-L2) <span class="unit" id="lbl-load240_W">' + state.load240_W + ' W (' + (state.load240_W / (240 * 0.92)).toFixed(1) + ' A)</span></label>';
      h += '  <input type="range" id="ctrl-load240_W" min="0" max="15000" step="500" value="' + state.load240_W + '">';
      h += '  <small style="color:var(--muted)">EV Charger / Heat Pump (Zero Neutral Current)</small>';
      h += '</div>';

      h += '<div class="dist-input-row">';
      h += '  <div class="dist-input-group">';
      h += '    <label>Conductor Gauge</label>';
      h += '    <select id="ctrl-split_size" data-field="split_size">';
      h += '      <option value="4_AWG" ' + (state.split_size === '4_AWG' ? 'selected' : '') + '>#4 AWG Al Triplex</option>';
      h += '      <option value="2_AWG" ' + (state.split_size === '2_AWG' ? 'selected' : '') + '>#2 AWG Al Triplex</option>';
      h += '      <option value="1/0_AWG" ' + (state.split_size === '1/0_AWG' ? 'selected' : '') + '>1/0 AWG Al Triplex</option>';
      h += '    </select>';
      h += '  </div>';
      h += '  <div class="dist-input-group">';
      h += '    <label>Service Length <span class="unit">ft</span></label>';
      h += '    <input type="number" id="ctrl-split_len_ft" data-field="split_len_ft" step="10" min="20" max="400" value="' + state.split_len_ft + '">';
      h += '  </div>';
      h += '</div>';
      cSplit.innerHTML = h;
    }

    // 10. Interactive Bid4Grid Spec Controls & Live Technical Nameplate
    renderInteractiveSpecPanel();
  }

  function renderInteractiveSpecPanel() {
    var cSpec = document.getElementById('ctrl-spec');
    if (!cSpec) return;

    var h = '<div class="card-header"><h2 class="card-title">📋 Bid4Grid Equipment Sourcing Console</h2><span class="badge blue">INTERACTIVE RFQ</span></div>';
    h += '<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Illustrative examples only; verify ratings and standards with the manufacturer. Select equipment to view its example nameplate and CAD location:</div>';

    var specItems = [
      { id: 'pole_xfmr', icon: '🪵', name: 'Pole-Mount Transformer', std: 'IEEE C57.12.20', rating: '50 kVA 1φ Overhead Can (120/240V)' },
      { id: 'dist_xfmr', icon: '⚡', name: 'Padmount Transformer', std: 'IEEE C57.12.22 / C57.12.28', rating: state.padkVA + ' kVA 3φ Padmount' },
      { id: 'feeder_recloser', icon: '🛡️', name: 'Automatic Recloser', std: 'IEEE C37.60', rating: '15.5 kV, 630 A, 12.5 kA Trip' },
      { id: 'dist_switchgear', icon: '🟩', name: 'Padmount Switchgear', std: 'IEEE C37.74', rating: '15 kV class, 600 A Bus, 25 kA Sym.' },
      { id: 'voltage_regulator', icon: '📈', name: 'Step-Voltage Regulator', std: 'IEEE C57.15', rating: '578 kVA, 32-Step ±10%' },
      { id: 'gsu_breaker', icon: '⚡', name: 'Transmission SF6 Breaker', std: 'IEEE C37.04', rating: '245 kV class, 2000 A, 40 kA Sym.' }
    ];

    h += '<div class="spec-selector-grid">';
    specItems.forEach(function (sp) {
      var isAct = state.activeApparatus === sp.id;
      h += '<div class="spec-item-btn ' + (isAct ? 'active' : '') + '" data-spec-id="' + sp.id + '">';
      h += '  <div>';
      h += '    <div class="spec-item-title">' + sp.icon + ' ' + sp.name + '</div>';
      h += '    <div style="font-size:10.5px;color:var(--muted)">' + sp.rating + '</div>';
      h += '  </div>';
      h += '  <span class="spec-item-std">' + sp.std.split('/')[0] + '</span>';
      h += '</div>';
    });
    h += '</div>';

    // Live Technical Nameplate Sheet based on active selection
    h += renderActiveNameplateSheet();

    cSpec.innerHTML = h;

    // Attach click events to the spec item buttons
    cSpec.querySelectorAll('.spec-item-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var spId = this.getAttribute('data-spec-id');
        if (spId) {
          state.activeApparatus = spId;
          renderInteractiveSpecPanel();
          redrawActiveCanvas();
        }
      });
    });
  }

  function renderActiveNameplateSheet() {
    var id = state.activeApparatus;
    var h = '<div class="spec-nameplate-box">';

    if (id === 'pole_xfmr') {
      var kVA = 50;
      var vPriLN = (state.dist_sub_kV * 1000) / Math.sqrt(3);
      var vSecLL = 240;
      var iFL_sec = (kVA * 1000) / vSecLL;
      var iFL_pri = (kVA * 1000) / vPriLN;
      var zPct = 2.1;
      var iSC_sec = (iFL_sec / (zPct / 100)).toFixed(0);
      var noLoadW = 115;
      var fullLoadW = 680;
      var annualLossKWh = (((noLoadW + fullLoadW * 0.5) * 8760) / 1000).toFixed(0);
      var estWeightLbs = 495;

      h += '<div class="spec-nameplate-header"><span>IEEE C57.12.20 POLE-MOUNT CAN NAMEPLATE</span><span class="badge blue">OVERHEAD UNIT</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">1-Phase Overhead Pole Transformer Can</span>';
      h += '  <span class="spec-prop-label">Rated Power:</span><span class="spec-prop-val">' + kVA + ' kVA Continuous (65°C Temperature Rise)</span>';
      h += '  <span class="spec-prop-label">Primary Voltage:</span><span class="spec-prop-val">' + (state.dist_sub_kV).toFixed(2) + ' kV GrdY / ' + vPriLN.toFixed(0) + ' V (95 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Secondary Voltage:</span><span class="spec-prop-val">120/240 V 3-Wire Split-Phase (30 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Secondary Current:</span><span class="spec-prop-val">' + iFL_sec.toFixed(1) + ' A (240V) | ' + (iFL_sec * 2).toFixed(1) + ' A (120V)</span>';
      h += '  <span class="spec-prop-label">Primary Current:</span><span class="spec-prop-val">' + iFL_pri.toFixed(2) + ' A Full-Load Primary</span>';
      h += '  <span class="spec-prop-label">Available Fault (ISC):</span><span class="spec-prop-val">' + iSC_sec + ' A (' + zPct + '% Z)</span>';
      h += '  <span class="spec-prop-label">No-Load Core Losses:</span><span class="spec-prop-val">' + noLoadW + ' Watts</span>';
      h += '  <span class="spec-prop-label">Full-Load Losses:</span><span class="spec-prop-val">' + fullLoadW + ' Watts</span>';
      h += '  <span class="spec-prop-label">Annual Losses:</span><span class="spec-prop-val">' + annualLossKWh + ' kWh / yr</span>';
      h += '  <span class="spec-prop-label">Estimated Weight:</span><span class="spec-prop-val">' + estWeightLbs + ' lbs (Pole Hanger Lugs Included)</span>';
      h += '  <span class="spec-prop-label">Tank Coating / Color:</span><span class="spec-prop-val">ANSI 70 Sky Grey Polyester Powder Coat</span>';
      h += '  <span class="spec-prop-label">Certification:</span><span class="spec-prop-val">2-Year Utility Warranty &amp; Certified FAT Report</span>';
      h += '</div>';
    } else if (id === 'dist_xfmr') {
      var kVA = state.padkVA;
      var vPri = state.dist_sub_kV * 1000;
      var vSec = 480;
      var iFL = (kVA * 1000) / (Math.sqrt(3) * vSec);
      var zPct = 5.75;
      var iSC = (iFL / (zPct / 100)).toFixed(0);
      var noLoadW = (kVA * 2.1).toFixed(0);
      var fullLoadW = (kVA * 8.4).toFixed(0);
      var annualLossKWh = (((parseFloat(noLoadW) + parseFloat(fullLoadW) * 0.5) * 8760) / 1000).toFixed(0);
      var estWeightLbs = (kVA * 8.5 + 1200).toFixed(0);

      h += '<div class="spec-nameplate-header"><span>IEEE C57.12 NAMEPLATE EXAMPLE</span><span class="badge green">EXAMPLE</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">3-Phase Padmount Transformer</span>';
      h += '  <span class="spec-prop-label">Rated Power:</span><span class="spec-prop-val">' + kVA + ' kVA Continuous (65°C Rise)</span>';
      h += '  <span class="spec-prop-label">Primary Voltage:</span><span class="spec-prop-val">' + (vPri / 1000).toFixed(2) + ' kV GrdY (95 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Secondary Voltage:</span><span class="spec-prop-val">480Y/277 V 4-Wire (30 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Full Load Current (IFL):</span><span class="spec-prop-val">' + iFL.toFixed(1) + ' A</span>';
      h += '  <span class="spec-prop-label">Available Fault (ISC):</span><span class="spec-prop-val">' + iSC + ' A (' + zPct + '% Z)</span>';
      h += '  <span class="spec-prop-label">No-Load Core Losses:</span><span class="spec-prop-val">' + noLoadW + ' Watts</span>';
      h += '  <span class="spec-prop-label">Full-Load Losses:</span><span class="spec-prop-val">' + fullLoadW + ' Watts</span>';
      h += '  <span class="spec-prop-label">Annual Losses:</span><span class="spec-prop-val">' + annualLossKWh + ' kWh / yr</span>';
      h += '  <span class="spec-prop-label">Estimated Weight:</span><span class="spec-prop-val">' + estWeightLbs + ' lbs</span>';
      h += '  <span class="spec-prop-label">Cabinet Finish:</span><span class="spec-prop-val">NEMA 3R Munsell 7GY Green (IEEE C57.12.28)</span>';
      h += '  <span class="spec-prop-label">Certification:</span><span class="spec-prop-val">2-Year Warranty &amp; Certified FAT Report</span>';
      h += '</div>';
    } else if (id === 'feeder_recloser') {
      h += '<div class="spec-nameplate-header"><span>IEEE C37.60 RECLOSER SPECIFICATION</span><span class="badge blue">SCADA READY</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">Solid-Dielectric Vacuum Recloser</span>';
      h += '  <span class="spec-prop-label">Rated Max Voltage:</span><span class="spec-prop-val">15.5 kV (110 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Continuous Current:</span><span class="spec-prop-val">630 A RMS</span>';
      h += '  <span class="spec-prop-label">Interrupting Rating:</span><span class="spec-prop-val">12.5 kA Symmetrical (3-Cycle)</span>';
      h += '  <span class="spec-prop-label">Insulating Medium:</span><span class="spec-prop-val">Solid Dielectric (Eco-friendly, No SF6)</span>';
      h += '  <span class="spec-prop-label">Reclosing Sequence:</span><span class="spec-prop-val">Up to 4 shots (Fast &amp; Delayed TCC)</span>';
      h += '  <span class="spec-prop-label">Automation / RTU:</span><span class="spec-prop-val">Integrated DNP3 / Modbus Controller</span>';
      h += '</div>';
    } else if (id === 'dist_switchgear') {
      h += '<div class="spec-nameplate-header"><span>IEEE C37.74 SWITCHGEAR SPECIFICATION</span><span class="badge green">SECTIONALIZING</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">Pad-Mounted Switchgear</span>';
      h += '  <span class="spec-prop-label">Nominal Voltage:</span><span class="spec-prop-val">15 kV / 17.5 kV (95 kV BIL)</span>';
      h += '  <span class="spec-prop-label">Bus Continuous:</span><span class="spec-prop-val">600 A Main / 200 A Taps</span>';
      h += '  <span class="spec-prop-label">Short-Circuit kA:</span><span class="spec-prop-val">25 kA Symmetrical</span>';
      h += '  <span class="spec-prop-label">Mechanism:</span><span class="spec-prop-val">3-Position: Close - Open - Ground</span>';
      h += '  <span class="spec-prop-label">Interrupters:</span><span class="spec-prop-val">Vacuum Bottles (Hermetically Sealed)</span>';
      h += '</div>';
    } else if (id === 'voltage_regulator') {
      h += '<div class="spec-nameplate-header"><span>IEEE C57.15 REGULATOR SPECIFICATION</span><span class="badge blue">AUTOMATIC TAP</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">32-Step Step-Voltage Regulator</span>';
      h += '  <span class="spec-prop-label">Regulating kVA:</span><span class="spec-prop-val">578 kVA (13.2 kV GrdY / 7620 V)</span>';
      h += '  <span class="spec-prop-label">Regulation Range:</span><span class="spec-prop-val">±10% in 32 Steps (0.625% per step)</span>';
      h += '  <span class="spec-prop-label">Control Mechanism:</span><span class="spec-prop-val">Line Drop Compensation (R &amp; X dials)</span>';
      h += '  <span class="spec-prop-label">Reverse Power:</span><span class="spec-prop-val">Bi-directional Distributed Gen Ready</span>';
      h += '</div>';
    } else {
      h += '<div class="spec-nameplate-header"><span>IEEE C37.04 BREAKER SPECIFICATION</span><span class="badge purple">SUBSTATION CLASS</span></div>';
      h += '<div class="spec-nameplate-grid">';
      h += '  <span class="spec-prop-label">Equipment Category:</span><span class="spec-prop-val">Illustrative SF6 Transmission Circuit Breaker</span>';
      h += '  <span class="spec-prop-label">Rated Voltage:</span><span class="spec-prop-val">245 kV class for a 230 kV system</span>';
      h += '  <span class="spec-prop-label">Continuous Current:</span><span class="spec-prop-val">2000 A</span>';
      h += '  <span class="spec-prop-label">Interrupting kA:</span><span class="spec-prop-val">40 kA Symmetrical</span>';
      h += '  <span class="spec-prop-label">Operating Cycle:</span><span class="spec-prop-val">O-0.3s -CO -3min -CO</span>';
      h += '</div>';
    }

    h += '</div>';
    return h;
  }

  function updateTopicGuide() {
    var guide = TOPIC_GUIDES[state.activeTab] || TOPIC_GUIDES.cascade;
    var elTitle = document.getElementById('dist-guide-title');
    var elContent = document.getElementById('dist-guide-content');

    if (elTitle) elTitle.innerHTML = '📌 ' + guide.title;
    if (elContent) {
      var h = '<p><strong>Engineering Model:</strong> ' + guide.models + '</p>';
      h += '<div style="font-weight:700;color:var(--primary);margin-top:10px">Practical "Why We Need to Know This" (Field &amp; Utility Reality):</div>';
      h += '<ul class="dist-why-list">';
      guide.why.forEach(function (w) {
        h += '<li>' + w + '</li>';
      });
      h += '</ul>';
      elContent.innerHTML = h;
    }
  }

  function bindAllEvents() {
    function switchTab(tabId) {
      if (!tabId) return;
      state.activeTab = tabId;

      document.querySelectorAll('.dist-nav button').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-tab') === tabId);
      });

      document.querySelectorAll('.dist-tab-pane').forEach(function (p) {
        p.style.display = p.id === 'pane-' + tabId ? 'block' : 'none';
      });

      var isTheory = tabId === 'theory';
      updateTabSharing();
      var elTiles = document.querySelector('.dist-tiles');
      var elGuide = document.querySelector('.dist-guide-card');
      var elSync = document.getElementById('dist-sync-banner');
      if (elTiles) elTiles.style.display = isTheory ? 'none' : '';
      if (elGuide) elGuide.style.display = isTheory ? 'none' : '';
      if (elSync) elSync.style.display = isTheory ? 'none' : '';

      if (!isTheory) {
        if (tabId === 'spec') renderInteractiveSpecPanel();
        updateTopicGuide();
        redrawActiveCanvas();
      }
    }

    // 1. Navigation Tab Switching (Shows/Hides persistent panes)
    document.querySelectorAll('.dist-nav button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = this.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // 1b. Video Walkthrough Modal Handlers
    var walkthrough = document.getElementById('walkthrough-overlay');
    var walkthroughVideo = document.getElementById('walkthrough-video');
    var walkthroughStatus = document.getElementById('walkthrough-status');
    var watchButton = document.getElementById('btn-watch-walkthrough');

    if (walkthrough && walkthroughVideo && watchButton) {
      watchButton.addEventListener('click', function () {
        walkthroughVideo.volume = 0.25;
        walkthrough.showModal();
        var closeBtn = document.getElementById('btn-close-walkthrough');
        if (closeBtn) closeBtn.focus();
        walkthroughVideo.play().catch(function () {
          if (walkthroughStatus) walkthroughStatus.textContent = 'Press Play in video controls to start playback.';
        });
      });

      var closeBtn = document.getElementById('btn-close-walkthrough');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          walkthrough.close();
        });
      }

      walkthrough.addEventListener('click', function (event) {
        if (event.target === walkthrough) walkthrough.close();
      });

      walkthrough.addEventListener('close', function () {
        walkthroughVideo.pause();
        if (walkthroughStatus) walkthroughStatus.textContent = '';
      });
    }

    // 2. Guide Toggle
    var elGuideToggle = document.getElementById('dist-guide-toggle');
    if (elGuideToggle) {
      elGuideToggle.addEventListener('click', function () {
        state.guideOpen = !state.guideOpen;
        var elBody = document.getElementById('dist-guide-content');
        var elBtn = document.getElementById('dist-guide-btn');
        if (elBody) elBody.style.display = state.guideOpen ? 'block' : 'none';
        if (elBtn) elBtn.innerText = state.guideOpen ? '▲ Hide Guide' : '▼ Show Guide';
      });
    }

    // 3. Universal Segmented Button Groups with Multi-Panel Synchronization
    document.querySelectorAll('.btn-group button[data-field]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var field = this.getAttribute('data-field');
        var val = this.getAttribute('data-val');
        if (!field) return;

        if (val === 'true') state[field] = true;
        else if (val === 'false') state[field] = false;
        else state[field] = val;

        // Synchronize all matching button groups across all panels (Cascade & V-Profile)
        document.querySelectorAll('.btn-group button[data-field="' + field + '"]').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-val') === val);
        });

        recalculate();
        updateMetricTiles();
        redrawActiveCanvas();
      });
    });

    // 4. Universal Number & Select Inputs with Multi-Panel Synchronization
    document.querySelectorAll('input[data-field], select[data-field]').forEach(function (el) {
      el.addEventListener('input', function () {
        var field = this.getAttribute('data-field');
        if (!field) return;

        var isText = field === 'sec_cond_key' || field === 'split_size';
        var val = isText ? this.value : parseFloat(this.value);
        if (!isText && isNaN(val)) return;

        state[field] = val;

        // Synchronize all other inputs/selects in the DOM that bind to this same field
        document.querySelectorAll('input[data-field="' + field + '"], select[data-field="' + field + '"]').forEach(function (other) {
          if (other !== el) other.value = el.value;
        });

        // Cross-module parameter propagation
        if (field === 'dist_sub_kV' || field === 'polekV') {
          state.polekV = val;
          state.dist_sub_kV = val;
          document.querySelectorAll('[data-field="polekV"]').forEach(function (p) { p.value = val; });
          document.querySelectorAll('[data-field="dist_sub_kV"]').forEach(function (p) { p.value = val; });
        }
        if (field === 'customer_load_kW' || field === 'bankLoadKW') {
          state.bankLoadKW = val;
          document.querySelectorAll('[data-field="bankLoadKW"]').forEach(function (b) { b.value = val; });
          var elHLNum = document.getElementById('ctrl-highleg-num');
          if (elHLNum) elHLNum.value = val;
          var elHLRange = document.getElementById('ctrl-highleg-range');
          if (elHLRange) elHLRange.value = val;
          var elHLLbl = document.getElementById('lbl-highleg-load');
          var i_3ph = (val * 1000) / (Math.sqrt(3) * 240 * 0.90);
          if (elHLLbl) elHLLbl.innerText = val + ' kW (' + i_3ph.toFixed(1) + ' A @ 240V)';
        }

        recalculate();
        updateMetricTiles();
        redrawActiveCanvas();
      });
    });

    // 5. High-Leg Delta Dynamic Slider & Input Synchronization
    var elHLRange = document.getElementById('ctrl-highleg-range');
    var elHLNum = document.getElementById('ctrl-highleg-num');
    var elHLLbl = document.getElementById('lbl-highleg-load');

    function onHLChange(val) {
      if (isNaN(val)) return;
      state.bankLoadKW = val;
      if (elHLRange) elHLRange.value = val;
      if (elHLNum) elHLNum.value = val;
      var elBankLoad = document.getElementById('ctrl-bankLoadKW');
      if (elBankLoad) elBankLoad.value = val;
      var i_3ph = (val * 1000) / (Math.sqrt(3) * 240 * 0.90);
      if (elHLLbl) elHLLbl.innerText = val + ' kW (' + i_3ph.toFixed(1) + ' A @ 240V)';
      recalculate();
      updateMetricTiles();
      redrawActiveCanvas();
    }

    if (elHLRange) {
      elHLRange.addEventListener('input', function () { onHLChange(parseFloat(this.value)); });
    }
    if (elHLNum) {
      elHLNum.addEventListener('input', function () { onHLChange(parseFloat(this.value)); });
    }

    // 6. Silky-Smooth Range Sliders for Split-Phase
    var sliders = [
      { id: 'ctrl-load1_W', field: 'load1_W', lbl: 'lbl-load1_W', V: 120 },
      { id: 'ctrl-load2_W', field: 'load2_W', lbl: 'lbl-load2_W', V: 120 },
      { id: 'ctrl-load240_W', field: 'load240_W', lbl: 'lbl-load240_W', V: 240 }
    ];

    sliders.forEach(function (sl) {
      var el = document.getElementById(sl.id);
      if (el) {
        el.addEventListener('input', function () {
          var wVal = parseFloat(this.value);
          state[sl.field] = wVal;
          var aVal = (wVal / (sl.V * 0.92)).toFixed(1);
          var lbl = document.getElementById(sl.lbl);
          if (lbl) lbl.innerText = wVal + ' W (' + aVal + ' A)';

          recalculate();
          updateMetricTiles();
          redrawActiveCanvas();
        });
      }
    });

    // 6. Spec Tab View Mode Toggle (Grid SLD vs Physical Apparatus CAD)
    var grpSpecView = document.getElementById('grp-specViewMode');
    if (grpSpecView) {
      grpSpecView.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = this.getAttribute('data-spec-view');
          if (v) {
            state.specViewMode = v;
            grpSpecView.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            redrawActiveCanvas();
          }
        });
      });
    }

    // 7. Window Resize Canvas Redraw
    window.addEventListener('resize', function () {
      redrawActiveCanvas();
    });
  }

  // Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppDOM);
  } else {
    initAppDOM();
  }

})();
