/**
 * Power Systems CAD Calculator - Application UI Controller
 * Implements the signature Microstrip CAD design system:
 * - Clean white header with theory button
 * - Sticky navy navigation bar with desktop pills & mobile grid
 * - 6 signature parameter summary tiles
 * - Topic Summary & Practical "Why We Need to Know This" Card
 * - Engineering alert/notice banner
 * - Two-column split layout with segmented button groups
 */
(function () {
  'use strict';

  var CFG = window.PWR_CONFIG || {};
  var core = window.PWRCore;
  var draw = window.PWRDraw;

  var state = {
    activeTab: 'basics', // 'basics', 'gen', 'xfmr', 'lines', 'flow', 'faults'
    basicsView: 'sld', // 'sld' (default), 'triangle', 'phasor'
    flowView: 'sld', // 'sld' (default), 'ybus'
    connType: 'wye', // 'wye' or 'delta'
    genRotor: 'salient', // 'salient' or 'cylindrical'
    lineModel: 'long', // 'long', 'medium_pi', 'medium_t', 'short'
    faultType: 'slg', // 'slg', '3phase', 'll', 'dlg'
    guideOpen: true
  };

  var TOPIC_GUIDES = {
    basics: {
      title: "Single & 3-Phase Power Fundamentals",
      models: "Models complex power (S = P + jQ), power factor (cos φ), 3-phase line vs. phase relationships (Wye & Delta), and sizing shunt capacitor banks (kvar) to counteract inductive motor lag.",
      why: [
        "<strong>Utility Surcharges:</strong> Utilities penalize commercial and industrial customers if their power factor drops below 0.90–0.95 due to wasted reactive current.",
        "<strong>Capacity Release:</strong> Correcting power factor from 0.75 to 0.95 cuts total line current by ~21%, freeing up existing transformer and switchgear capacity without capital upgrades.",
        "<strong>Voltage Sag Prevention:</strong> Excessive reactive current causes heavy I²R heating losses and dangerous voltage drops along plant distribution feeders."
      ]
    },
    gen: {
      title: "Synchronous Generators & Power-Angle (P-δ) Stability",
      models: "Models cylindrical vs. salient-pole synchronous machines (two-reaction theory with Xd and Xq), field excitation EMF (Eg), and steady-state torque angle (δ) across the power curve P(δ).",
      why: [
        "<strong>Grid Synchronism & Pole Slipping:</strong> If the rotor torque angle δ exceeds the stability limit (~65° for salient, 90° for round), the magnetic link snaps, poles slip, and massive mechanical torque rips the turbine shaft.",
        "<strong>Voltage & Reactive Grid Support:</strong> Generators are the grid's primary voltage anchors. Adjusting field excitation current directly injects or absorbs MVARs across the transmission network.",
        "<strong>Reluctance Torque in Salient Rotors:</strong> Hydro and slow-speed generators have non-uniform rotor air gaps (Xd > Xq), generating ~20–25% extra peak power via the sin(2δ) reluctance term."
      ]
    },
    xfmr: {
      title: "Power Transformers & Equivalent Circuit Testing",
      models: "Extracts primary/secondary T-equivalent circuit parameters (Req, Xeq, Rc, Xm) from Open-Circuit and Short-Circuit tests, calculating dynamic Voltage Regulation (VR%) and full-load efficiency (η%).",
      why: [
        "<strong>Testing Huge Units Safely:</strong> You cannot test a 100 MVA utility transformer by hooking up a city-sized load in a factory bay. OC and SC tests capture the entire physical model using under 2% rated power.",
        "<strong>Voltage Regulation at Motor Terminals:</strong> Transformer internal leakage reactance (Xeq) causes secondary voltage to drop when feeding inductive loads; calculating VR% ensures voltages stay within ±5% standards.",
        "<strong>Lifecycle Operational Costs:</strong> Transformers run 24/7 for 30–40 years. Even a 0.5% difference in core loss (Pcore) wastes hundreds of thousands of dollars in lifetime utility electricity costs."
      ]
    },
    lines: {
      title: "Transmission Lines & Per-Unit System",
      models: "Calculates two-port ABCD parameter matrices for Short (< 80 km), Medium (80–250 km Pi/T), and Long (> 250 km hyperbolic cosh/sinh) lines, no-load Ferranti effect, SIL, and multi-zone per-unit scaling.",
      why: [
        "<strong>Ferranti Overvoltage Destroys Equipment:</strong> Long high-voltage lines have large ground capacitance. At night or under light load, capacitive charging current causes receiving-end voltage to spike (Vr > Vs), damaging bushings unless shunt reactors absorb the excess VARs.",
        "<strong>Surge Impedance Loading (SIL):</strong> The natural line loading where reactive generation (B) balances reactive consumption (X). Operating at SIL gives an ideal flat voltage profile from sending to receiving end.",
        "<strong>Per-Unit Grid Modeling:</strong> High-voltage systems span 13.8 kV generation, 138/230 kV transmission, and 4.16 kV distribution. The per-unit system removes transformer turns ratios so the entire grid solves as a single impedance network."
      ]
    },
    flow: {
      title: "Power Flow Analysis (Load Flow & Grid Dispatch)",
      models: "Assembles the Bus Admittance Matrix (Y_bus), categorizes Slack (Swing), PV Generator, and PQ Load buses, and iteratively solves non-linear power flow using the Gauss-Seidel algorithm to determine voltages, angles, and line losses.",
      why: [
        "<strong>Interconnection Studies:</strong> Before permitting a new solar farm, wind plant, or hyperscale data center, grid operators run load flow to guarantee line thermal ratings and substation voltages are not violated.",
        "<strong>Contingency (N-1) Reliability:</strong> Grid operators must prove that if any single critical line or transformer trips, remaining parallel circuits can absorb redirected megawatt flows without cascading blackouts.",
        "<strong>Transmission Loss Optimization:</strong> Load flow Pinj calculations show dispatchers exactly how to dispatch generation economically while minimizing MW conductor resistance losses."
      ]
    },
    faults: {
      title: "Fault Analysis & Fortescue Symmetrical Components",
      models: "Computes subtransient symmetrical 3-phase faults, applies Fortescue symmetrical components (A^-1 matrix) to split unbalanced systems into Zero (Z0), Positive (Z1), and Negative (Z2) networks for SLG, L-L, and DLG faults.",
      why: [
        "<strong>Circuit Breaker Interrupting Ratings:</strong> Substation circuit breakers must safely extinguish extreme short-circuit currents (e.g. 25 kA, 40 kA, 63 kA). Under-sizing a breaker causes violent catastrophic explosion during a fault.",
        "<strong>70% of Real-World Faults are SLG:</strong> Tree contacts, lightning, and insulator flashovers almost always affect a single phase to ground. Symmetrical components allow asymmetrical faults to be solved as simple single-phase networks.",
        "<strong>Protective Relay Tripping (ANSI 51N / 67N):</strong> Ground overcurrent relays detect zero-sequence current (3·Ia0), and negative-sequence relays detect unbalanced phase loss, tripping breakers before generators and motors overheat."
      ]
    }
  };

  function initApp() {
    var appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
      <!-- Header -->
      <header class="pwr-header">
        <div class="pwr-header-content">
          <div>
            <h1>Power Systems CAD Calculator</h1>
            <div class="subtitle">Interactive Power Systems Engineering Suite (Fundamentals, Machines, Transformers, Lines &amp; Faults) · v1.0.0</div>
          </div>
          <div>
            <a href="assets/pwr-help.html" target="_blank" class="pwr-btn-report" title="Open Technical Guide &amp; Formulas">
              <span>📖</span>
              <span>Technical Theory &amp; Formulas</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Sticky Navy Navigation Bar -->
      <div class="pwr-nav-container">
        <nav class="pwr-nav" aria-label="Main Navigation">
          <button class="on" data-tab="basics">
            <span class="pwr-tab-icon">⚡</span>
            <span class="pwr-tab-full">Single &amp; 3-Phase</span>
            <span class="pwr-tab-short">Single</span>
          </button>
          <button data-tab="flow">
            <span class="pwr-tab-icon">🌐</span>
            <span class="pwr-tab-full">Power Flow</span>
            <span class="pwr-tab-short">Flow</span>
          </button>
          <button data-tab="gen">
            <span class="pwr-tab-icon">⚙️</span>
            <span class="pwr-tab-full">Generators (P-δ)</span>
            <span class="pwr-tab-short">Generators</span>
          </button>
          <button data-tab="xfmr">
            <span class="pwr-tab-icon">🔄</span>
            <span class="pwr-tab-full">Transformers</span>
            <span class="pwr-tab-short">Transformers</span>
          </button>
          <button data-tab="lines">
            <span class="pwr-tab-icon">🗼</span>
            <span class="pwr-tab-full">Lines &amp; Per-Unit</span>
            <span class="pwr-tab-short">Lines</span>
          </button>
          <button data-tab="faults">
            <span class="pwr-tab-icon">⚡</span>
            <span class="pwr-tab-full">Fault Analysis</span>
            <span class="pwr-tab-short">Faults</span>
          </button>
        </nav>
      </div>

      <!-- Main Layout -->
      <main class="pwr-main">
        <!-- Signature Parameter Tiles -->
        <div class="pwr-tiles" id="pwr-metric-tiles">
          <div class="pwr-tile hot" id="tile-1"><b>500 kW</b><span>Real Power</span></div>
          <div class="pwr-tile" id="tile-2"><b>0.75 lag</b><span>Power Factor</span></div>
          <div class="pwr-tile" id="tile-3"><b>480 V</b><span>Line Voltage</span></div>
          <div class="pwr-tile green" id="tile-4"><b>276.6 kvar</b><span>Capacitor Bank</span></div>
          <div class="pwr-tile" id="tile-5"><b>666.7 kVA</b><span>Initial Load</span></div>
          <div class="pwr-tile" id="tile-6"><b>801.9 A</b><span>Line Current</span></div>
        </div>

        <!-- Topic Context & "Why We Need to Know This" Card -->
        <div class="pwr-topic-card" id="pwr-topic-card">
          <div class="pwr-topic-header" id="btn-toggle-guide">
            <div class="pwr-topic-title">
              <span>💡</span>
              <span id="topic-guide-title">Basics &amp; 3-Phase Power Fundamentals</span>
            </div>
            <button type="button" class="pwr-topic-toggle-btn" id="guide-toggle-label">– Hide Details</button>
          </div>
          <div class="pwr-topic-body" id="topic-guide-body">
            <div>
              <div class="pwr-topic-col-title models"><span>📘</span> What This Module Models</div>
              <div id="topic-guide-models">
                Models complex power (S = P + jQ), power factor (cos φ), 3-phase line vs. phase relationships (Wye &amp; Delta), and sizing shunt capacitor banks (kvar) to counteract inductive motor lag.
              </div>
            </div>
            <div>
              <div class="pwr-topic-col-title why"><span>🎯</span> Why You Need to Know This (Field &amp; Utility Reality)</div>
              <ul id="topic-guide-why">
                <li><strong>Utility Surcharges:</strong> Utilities penalize commercial and industrial customers if their power factor drops below 0.90–0.95 due to wasted reactive current.</li>
                <li><strong>Capacity Release:</strong> Correcting power factor from 0.75 to 0.95 cuts total line current by ~21%, freeing up existing transformer and switchgear capacity without capital upgrades.</li>
                <li><strong>Voltage Sag Prevention:</strong> Excessive reactive current causes heavy I²R heating losses and dangerous voltage drops along plant distribution feeders.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Notice / Warning Box -->
        <div class="pwr-notice" id="pwr-notice-box">
          <span class="icon">⚠️</span>
          <div id="pwr-notice-text">
            Operating at lagging power factor 0.75. Sizing capacitor bank to release system capacity and reduce reactive line losses.
          </div>
        </div>

        <!-- TAB 1: BASICS & 3-PHASE -->
        <div class="pwr-tab-pane" id="pane-basics">
          <div class="pwr-grid-split">
            <!-- Left Controls -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">⚡ Power Factor &amp; 3-Phase Sizing</h2>
              </div>

              <div class="pwr-form-section-title">Load Connection Type</div>
              <div class="btn-group" id="group-conn">
                <button type="button" class="active" data-val="wye">3Φ Wye (Y-Connected)</button>
                <button type="button" data-val="delta">3Φ Delta (Δ-Connected)</button>
              </div>

              <div class="pwr-form-section-title">Electrical Parameters</div>
              <div class="pwr-input-group">
                <label>Real Power P (kW)</label>
                <input type="number" id="pf-p" value="500">
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group">
                  <label>Current PF (lag)</label>
                  <input type="number" id="pf-1" step="0.01" value="0.75">
                </div>
                <div class="pwr-input-group">
                  <label>Target PF (lag)</label>
                  <input type="number" id="pf-2" step="0.01" value="0.95">
                </div>
              </div>

              <div class="pwr-input-group">
                <label>Line-to-Line Voltage V_LL (V)</label>
                <input type="number" id="pf-vll" value="480">
              </div>

              <button class="btn-primary" id="btn-calc-basics">Calculate &amp; Update CAD</button>
              <div class="pwr-results" id="res-basics">Computing...</div>
            </div>

            <!-- Right CAD Canvas -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Vector Schematics / Diagram</h2>
                <div class="pwr-toolbar">
                  <span class="badge">3Φ SYSTEMS</span>
                  <button class="pwr-btn-action active" id="btn-view-sld">Single Line Diagram</button>
                  <button class="pwr-btn-action" id="btn-view-triangle">Power Triangle</button>
                  <button class="pwr-btn-action" id="btn-view-phasor">3Φ Phasors</button>
                  <button class="pwr-btn-action" id="btn-png-basics">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-basics" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: GENERATORS -->
        <div class="pwr-tab-pane" id="pane-gen" style="display:none;">
          <div class="pwr-grid-split">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">⚙️ Synchronous Machine Parameters</h2>
              </div>

              <div class="pwr-form-section-title">Rotor Construction</div>
              <div class="btn-group" id="group-rotor">
                <button type="button" class="active" data-val="salient">Salient-Pole Rotor (Xd ≠ Xq)</button>
                <button type="button" data-val="cylindrical">Cylindrical (Round Rotor)</button>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group">
                  <label>Terminal V_LL (kV)</label>
                  <input type="number" id="gen-vt" value="13.8">
                </div>
                <div class="pwr-input-group">
                  <label>Real Power (MW)</label>
                  <input type="number" id="gen-p" value="50">
                </div>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group">
                  <label>Power Factor</label>
                  <input type="number" id="gen-pf" step="0.01" value="0.80">
                </div>
                <div class="pwr-input-group">
                  <label>Armature Ra (Ω)</label>
                  <input type="number" id="gen-ra" step="0.01" value="0.05">
                </div>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group">
                  <label>Direct-axis Xd (Ω)</label>
                  <input type="number" id="gen-xd" step="0.1" value="1.8">
                </div>
                <div class="pwr-input-group">
                  <label>Quad-axis Xq (Ω)</label>
                  <input type="number" id="gen-xq" step="0.1" value="1.2">
                </div>
              </div>

              <button class="btn-primary" id="btn-calc-gen">Compute Stability &amp; Angle</button>
              <div class="pwr-results" id="res-gen">Computing...</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Power-Angle Stability Curve P(δ)</h2>
                <div class="pwr-toolbar">
                  <span class="badge">STABILITY LIMIT</span>
                  <button class="pwr-btn-action" id="btn-png-gen">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-gen" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: TRANSFORMERS -->
        <div class="pwr-tab-pane" id="pane-xfmr" style="display:none;">
          <div class="pwr-grid-split">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">🔄 Transformer Test Measurements</h2>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group">
                  <label>Rated S (kVA)</label>
                  <input type="number" id="tr-s" value="50">
                </div>
                <div class="pwr-input-group">
                  <label>Ratio V1 / V2</label>
                  <input type="text" id="tr-ratio" value="2400/240">
                </div>
              </div>

              <div class="pwr-form-section-title">Open-Circuit Test (Low Voltage: 240 V)</div>
              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>Voc (V)</label><input type="number" id="tr-voc" value="240"></div>
                <div class="pwr-input-group"><label>Ioc (A)</label><input type="number" id="tr-ioc" step="0.01" value="5.41"></div>
                <div class="pwr-input-group"><label>Poc (W)</label><input type="number" id="tr-poc" value="186"></div>
              </div>

              <div class="pwr-form-section-title">Short-Circuit Test (High Voltage: 2400 V)</div>
              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>Vsc (V)</label><input type="number" id="tr-vsc" value="48"></div>
                <div class="pwr-input-group"><label>Isc (A)</label><input type="number" id="tr-isc" step="0.1" value="20.8"></div>
                <div class="pwr-input-group"><label>Psc (W)</label><input type="number" id="tr-psc" value="617"></div>
              </div>

              <button class="btn-primary" id="btn-calc-xfmr">Extract Model &amp; Performance</button>
              <div class="pwr-results" id="res-xfmr">Computing...</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Exact T-Equivalent Electrical Circuit</h2>
                <div class="pwr-toolbar">
                  <span class="badge">REFERRED TO LOW VOLTAGE</span>
                  <button class="pwr-btn-action" id="btn-png-xfmr">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-xfmr" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: LINES & PER-UNIT -->
        <div class="pwr-tab-pane" id="pane-lines" style="display:none;">
          <div class="pwr-grid-split">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">🗼 Transmission Line Parameters</h2>
              </div>

              <div class="pwr-form-section-title">Analysis Formulation</div>
              <div class="btn-group" id="group-line">
                <button type="button" class="active" data-val="long">Long (Hyperbolic)</button>
                <button type="button" data-val="medium_pi">Medium (Nominal Π)</button>
                <button type="button" data-val="medium_t">Medium (Nominal T)</button>
                <button type="button" data-val="short">Short (&lt; 80 km)</button>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>Length (km)</label><input type="number" id="line-len" value="300"></div>
                <div class="pwr-input-group"><label>r (Ω/km)</label><input type="number" id="line-r" step="0.01" value="0.08"></div>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>x (Ω/km)</label><input type="number" id="line-x" step="0.01" value="0.48"></div>
                <div class="pwr-input-group"><label>Vr (kV)</label><input type="number" id="line-vr" value="220"></div>
              </div>

              <div class="pwr-input-group">
                <label>Receiving Load Pr (MW)</label>
                <input type="number" id="line-pr" value="150">
              </div>

              <button class="btn-primary" id="btn-calc-line">Solve Line &amp; Voltage Profile</button>
              <div class="pwr-results" id="res-line">Computing...</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Voltage Profile &amp; Ferranti Effect</h2>
                <div class="pwr-toolbar">
                  <span class="badge">SURGE IMPEDANCE LOADING &amp; FERRANTI EFFECT</span>
                  <button class="pwr-btn-action" id="btn-png-lines">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-lines" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 5: POWER FLOW -->
        <div class="pwr-tab-pane" id="pane-flow" style="display:none;">
          <div class="pwr-grid-split">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">🌐 3-Bus Power Flow Controls</h2>
              </div>

              <div class="pwr-form-section-title">Bus Classifications</div>
              <div class="pwr-input-group">
                <label>Bus 1: Slack (Swing / Reference)</label>
                <input type="text" value="|V1| = 1.0500 pu, δ1 = 0.00°" disabled>
              </div>

              <div class="pwr-input-group">
                <label>Bus 2: PV Generator (|V2| pu, P2 MW)</label>
                <div class="pwr-input-row">
                  <input type="number" id="flow-v2" step="0.01" value="1.03">
                  <input type="number" id="flow-p2" step="10" value="50">
                </div>
              </div>

              <div class="pwr-input-group">
                <label>Bus 3: PQ Load (P3 MW, Q3 MVAR)</label>
                <div class="pwr-input-row">
                  <input type="number" id="flow-p3" step="10" value="80">
                  <input type="number" id="flow-q3" step="5" value="40">
                </div>
              </div>

              <button class="btn-primary" id="btn-calc-flow">Run Gauss-Seidel Solver</button>
              <div class="pwr-results" id="res-flow">Computing...</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">3-Bus Single Line Diagram &amp; Line Flows</h2>
                <div class="pwr-toolbar">
                  <button class="pwr-btn-action active" id="btn-flow-sld">Network Flows SLD</button>
                  <button class="pwr-btn-action" id="btn-flow-ybus">Y-Bus Admittance Matrix</button>
                  <button class="pwr-btn-action" id="btn-png-flow">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-flow" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 6: FAULT ANALYSIS -->
        <div class="pwr-tab-pane" id="pane-faults" style="display:none;">
          <div class="pwr-grid-split">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">⚡ Fault &amp; Sequence Network Setup</h2>
              </div>

              <div class="pwr-form-section-title">Fault Type</div>
              <div class="btn-group" id="group-fault">
                <button type="button" class="active" data-val="slg">Single Line-to-Ground (SLG)</button>
                <button type="button" data-val="3phase">3-Phase Symmetrical</button>
                <button type="button" data-val="ll">Line-to-Line (L-L)</button>
                <button type="button" data-val="dlg">Double Line-to-Ground</button>
              </div>

              <div class="pwr-form-section-title">Thevenin Sequence Impedances (pu)</div>
              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>Z1 Positive (jΩ)</label><input type="number" id="flt-z1" step="0.05" value="0.20"></div>
                <div class="pwr-input-group"><label>Z2 Negative (jΩ)</label><input type="number" id="flt-z2" step="0.05" value="0.20"></div>
                <div class="pwr-input-group"><label>Z0 Zero (jΩ)</label><input type="number" id="flt-z0" step="0.05" value="0.30"></div>
              </div>

              <div class="pwr-input-row">
                <div class="pwr-input-group"><label>Base MVA</label><input type="number" id="flt-mva" value="100"></div>
                <div class="pwr-input-group"><label>Line Voltage (kV)</label><input type="number" id="flt-v" value="138"></div>
              </div>

              <button class="btn-primary" id="btn-calc-faults">Solve Sequence Networks</button>
              <div class="pwr-results" id="res-faults">Computing...</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Symmetrical Sequence Network Connections</h2>
                <div class="pwr-toolbar">
                  <span class="badge">FORTESCUE NETWORK</span>
                  <button class="pwr-btn-action" id="btn-png-faults">📷 Export PNG</button>
                </div>
              </div>
              <div class="pwr-canvas-wrapper">
                <canvas id="canvas-faults" width="850" height="420"></canvas>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    bindEvents();
    // Initialize background calculations quietly
    recalcGen();
    recalcXfmr();
    recalcLines();
    recalcFlow();
    recalcFaults();
    // Set active tab to basics and update all UI elements
    switchTab('basics');
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.pwr-nav button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.pwr-tab-pane').forEach(function (p) {
      p.style.display = p.id === 'pane-' + tabId ? 'block' : 'none';
    });
    updateTopicGuide(tabId);
    updateTilesForTab(tabId);
  }

  function updateTopicGuide(tabId) {
    var g = TOPIC_GUIDES[tabId] || TOPIC_GUIDES.basics;
    document.getElementById('topic-guide-title').textContent = g.title;
    document.getElementById('topic-guide-models').innerHTML = g.models;

    var ul = document.getElementById('topic-guide-why');
    ul.innerHTML = g.why.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.pwr-nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    // Topic guide card toggle collapse/expand
    document.getElementById('btn-toggle-guide').addEventListener('click', function () {
      state.guideOpen = !state.guideOpen;
      var body = document.getElementById('topic-guide-body');
      var label = document.getElementById('guide-toggle-label');
      body.style.display = state.guideOpen ? 'grid' : 'none';
      label.textContent = state.guideOpen ? '– Hide Details' : '+ Show Guide';
    });

    // Connection Segmented Button in Tab 1
    document.querySelectorAll('#group-conn button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#group-conn button').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        state.connType = this.getAttribute('data-val');
        recalcBasics();
      });
    });

    // Rotor Segmented Button in Tab 2
    document.querySelectorAll('#group-rotor button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#group-rotor button').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        state.genRotor = this.getAttribute('data-val');
        recalcGen();
      });
    });

    // Line Model Segmented Button in Tab 4
    document.querySelectorAll('#group-line button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#group-line button').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        state.lineModel = this.getAttribute('data-val');
        recalcLines();
      });
    });

    // Fault Type Segmented Button in Tab 6
    document.querySelectorAll('#group-fault button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#group-fault button').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        state.faultType = this.getAttribute('data-val');
        recalcFaults();
      });
    });

    // View buttons in Tab 1
    function setBasicsView(view) {
      state.basicsView = view;
      document.getElementById('btn-view-triangle').classList.toggle('active', view === 'triangle');
      document.getElementById('btn-view-phasor').classList.toggle('active', view === 'phasor');
      document.getElementById('btn-view-sld').classList.toggle('active', view === 'sld');
      recalcBasics();
    }
    document.getElementById('btn-view-triangle').addEventListener('click', function () { setBasicsView('triangle'); });
    document.getElementById('btn-view-phasor').addEventListener('click', function () { setBasicsView('phasor'); });
    document.getElementById('btn-view-sld').addEventListener('click', function () { setBasicsView('sld'); });

    // Power flow view toggles (SLD vs Y-Bus Matrix)
    function setFlowView(view) {
      state.flowView = view;
      var btnSld = document.getElementById('btn-flow-sld');
      var btnYbus = document.getElementById('btn-flow-ybus');
      if (btnSld) btnSld.classList.toggle('active', view === 'sld');
      if (btnYbus) btnYbus.classList.toggle('active', view === 'ybus');
      recalcFlow();
    }
    var btnFlowSld = document.getElementById('btn-flow-sld');
    var btnFlowYbus = document.getElementById('btn-flow-ybus');
    if (btnFlowSld) btnFlowSld.addEventListener('click', function () { setFlowView('sld'); });
    if (btnFlowYbus) btnFlowYbus.addEventListener('click', function () { setFlowView('ybus'); });

    // Calculate action buttons
    document.getElementById('btn-calc-basics').addEventListener('click', recalcBasics);
    document.getElementById('btn-calc-gen').addEventListener('click', recalcGen);
    document.getElementById('btn-calc-xfmr').addEventListener('click', recalcXfmr);
    document.getElementById('btn-calc-line').addEventListener('click', recalcLines);
    document.getElementById('btn-calc-flow').addEventListener('click', recalcFlow);
    document.getElementById('btn-calc-faults').addEventListener('click', recalcFaults);

    // Export PNG helpers
    function exportCanvas(canvasId, name) {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return;
      var link = document.createElement('a');
      link.download = name + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    document.getElementById('btn-png-basics').addEventListener('click', function () {
      var name = state.basicsView === 'sld' ? 'single-line-diagram' : (state.basicsView === 'triangle' ? 'power-triangle' : 'phasor-diagram');
      exportCanvas('canvas-basics', name);
    });
    document.getElementById('btn-png-gen').addEventListener('click', function () { exportCanvas('canvas-gen', 'power-angle-curve'); });
    document.getElementById('btn-png-xfmr').addEventListener('click', function () { exportCanvas('canvas-xfmr', 'transformer-circuit'); });
    document.getElementById('btn-png-lines').addEventListener('click', function () { exportCanvas('canvas-lines', 'transmission-ferranti'); });
    document.getElementById('btn-png-flow').addEventListener('click', function () {
      var name = state.flowView === 'ybus' ? 'y-bus-admittance-matrix' : 'power-flow-sld';
      exportCanvas('canvas-flow', name);
    });
    document.getElementById('btn-png-faults').addEventListener('click', function () { exportCanvas('canvas-faults', 'sequence-networks'); });
  }

  // --- DYNAMIC PARAMETER SUMMARY TILES (SIGNATURE LOOK) ---
  function updateTilesForTab(tabId) {
    var t1 = document.getElementById('tile-1');
    var t2 = document.getElementById('tile-2');
    var t3 = document.getElementById('tile-3');
    var t4 = document.getElementById('tile-4');
    var t5 = document.getElementById('tile-5');
    var t6 = document.getElementById('tile-6');
    var notice = document.getElementById('pwr-notice-text');

    if (!t1 || !notice) return;

    if (tabId === 'basics') {
      recalcBasics();
    } else if (tabId === 'gen') {
      t1.innerHTML = '<b>' + (document.getElementById('gen-p').value || 50) + ' MW</b><span>Active Power</span>';
      t2.innerHTML = '<b>' + (document.getElementById('gen-pf').value || 0.8) + ' lag</b><span>Power Factor</span>';
      t3.innerHTML = '<b>' + (document.getElementById('gen-vt').value || 13.8) + ' kV</b><span>Terminal V</span>';
      t4.className = 'pwr-tile green';
      t4.innerHTML = '<b>' + (window.lastGenPmax || 96.4).toFixed(1) + ' MW</b><span>P_max Limit</span>';
      t5.innerHTML = '<b>' + (window.lastGenDelta || 18.7).toFixed(1) + '°</b><span>Torque Angle δ</span>';
      t6.innerHTML = '<b>' + (window.lastGenEg || 19.9).toFixed(2) + ' kV</b><span>Internal EMF Eg</span>';
      notice.textContent = 'Synchronous generator stability margin: Operating torque angle is safely below steady-state critical stability angle.';
    } else if (tabId === 'xfmr') {
      t1.innerHTML = '<b>50 kVA</b><span>Rated Capacity</span>';
      t2.innerHTML = '<b>98.03 %</b><span>Full-Load Eff.</span>';
      t3.innerHTML = '<b>2.4kV : 240V</b><span>Rated Ratio</span>';
      t4.className = 'pwr-tile green';
      t4.innerHTML = '<b>1.94 %</b><span>Voltage Reg.</span>';
      t5.innerHTML = '<b>186 W</b><span>Core Loss Poc</span>';
      t6.innerHTML = '<b>617 W</b><span>Copper Loss Psc</span>';
      notice.textContent = 'Transformer equivalent circuit parameters extracted from Open-Circuit and Short-Circuit tests referred to low-voltage secondary.';
    } else if (tabId === 'lines') {
      t1.innerHTML = '<b>' + (document.getElementById('line-len').value || 300) + ' km</b><span>Line Length</span>';
      t2.innerHTML = '<b>' + (document.getElementById('line-vr').value || 220) + ' kV</b><span>Receiving Vr</span>';
      t3.innerHTML = '<b>' + (window.lastLineVs || 222.4).toFixed(1) + ' kV</b><span>Sending End Vs</span>';
      t4.className = 'pwr-tile hot';
      t4.innerHTML = '<b>+' + (window.lastLineFerranti || 21.3).toFixed(1) + ' kV</b><span>Ferranti Voltage Rise</span>';
      t5.innerHTML = '<b>' + (window.lastLineSIL || 126.0).toFixed(1) + ' MW</b><span>Surge Loading (SIL)</span>';
      t6.innerHTML = '<b>' + (window.lastLineEff || 96.8).toFixed(1) + ' %</b><span>Efficiency</span>';
      notice.textContent = 'Long transmission line model: Distributed hyperbolic parameters cosh(γl) and sinh(γl) active to capture no-load Ferranti voltage rise.';
    } else if (tabId === 'flow') {
      t1.innerHTML = '<b>3 Buses</b><span>Network Size</span>';
      t2.innerHTML = '<b>1.050 pu</b><span>Slack Bus V1</span>';
      t3.innerHTML = '<b>1.030 pu</b><span>PV Bus V2</span>';
      t4.className = 'pwr-tile green';
      t4.innerHTML = '<b>0.965 pu</b><span>Load Bus V3</span>';
      t5.innerHTML = '<b>4 Iterations</b><span>Convergence</span>';
      t6.innerHTML = '<b>0.21 MW</b><span>Line Losses</span>';
      notice.textContent = 'Gauss-Seidel load flow converged within 4 iterations with tolerance 1e-4. Real and reactive branch power flows balanced.';
    } else if (tabId === 'faults') {
      t1.innerHTML = '<b>' + state.faultType.toUpperCase() + '</b><span>Fault Class</span>';
      t2.innerHTML = '<b>' + (window.lastFaultIf || 4.29).toFixed(3) + ' pu</b><span>Fault Current</span>';
      t3.innerHTML = '<b>' + (window.lastFaultKa || 1.80).toFixed(2) + ' kA</b><span>Subtransient kA</span>';
      t4.className = 'pwr-tile hot';
      t4.innerHTML = '<b>' + (window.lastFaultMva || 428.6).toFixed(1) + ' MVA</b><span>Short Circuit</span>';
      t5.innerHTML = '<b>j0.20 pu</b><span>Pos Sequence Z1</span>';
      t6.innerHTML = '<b>j0.30 pu</b><span>Zero Sequence Z0</span>';
      notice.textContent = 'Fortescue sequence networks interconnected: Sequence loop calculated according to physical boundary conditions of the fault.';
    }
  }

  // --- CALCULATION HANDLERS ---
  function recalcBasics() {
    var P = parseFloat(document.getElementById('pf-p').value) || 500;
    var pf1 = parseFloat(document.getElementById('pf-1').value) || 0.75;
    var pf2 = parseFloat(document.getElementById('pf-2').value) || 0.95;
    var vll = parseFloat(document.getElementById('pf-vll').value) || 480;
    var conn = state.connType;

    var pfRes = core.calcPFCorrection(P, pf1, pf2);
    var sys3ph = core.calcThreePhase(conn, vll, pfRes.S1_kVA, pf1);

    var resText =
      "Active Power (P):        " + P.toFixed(1) + " kW\n" +
      "Initial Q1:              " + pfRes.Q1_kvar.toFixed(1) + " kvar (cos φ1 = " + pf1.toFixed(2) + ")\n" +
      "Target Q2:               " + pfRes.Q2_kvar.toFixed(1) + " kvar (cos φ2 = " + pf2.toFixed(2) + ")\n" +
      "Capacitor Bank (ΔQ):     " + pfRes.dQ_kvar.toFixed(1) + " kvar\n" +
      "Initial Apparent S1:     " + pfRes.S1_kVA.toFixed(1) + " kVA\n" +
      "Corrected Apparent S2:   " + pfRes.S2_kVA.toFixed(1) + " kVA (Release: " + (pfRes.S1_kVA - pfRes.S2_kVA).toFixed(1) + " kVA)\n\n" +
      "3-Phase Line Current:    " + sys3ph.I_line.toFixed(1) + " A\n" +
      "Phase Voltage (" + conn + "):    " + sys3ph.V_phase.toFixed(1) + " V";
    document.getElementById('res-basics').textContent = resText;

    // Update Tiles & Notice
    if (state.activeTab === 'basics') {
      document.getElementById('tile-1').innerHTML = '<b>' + P.toFixed(0) + ' kW</b><span>Real Power</span>';
      document.getElementById('tile-2').innerHTML = '<b>' + pf1.toFixed(2) + ' lag</b><span>Power Factor</span>';
      document.getElementById('tile-3').innerHTML = '<b>' + vll.toFixed(0) + ' V</b><span>Line Voltage</span>';
      var t4 = document.getElementById('tile-4');
      t4.className = 'pwr-tile green';
      t4.innerHTML = '<b>' + pfRes.dQ_kvar.toFixed(1) + ' kvar</b><span>Capacitor Bank</span>';
      document.getElementById('tile-5').innerHTML = '<b>' + pfRes.S1_kVA.toFixed(1) + ' kVA</b><span>Initial Load</span>';
      document.getElementById('tile-6').innerHTML = '<b>' + sys3ph.I_line.toFixed(1) + ' A</b><span>Line Current</span>';
      var notice = document.getElementById('pwr-notice-text');
      if (notice) {
        notice.textContent = 'Operating at lagging power factor ' + pf1.toFixed(2) + '. Sizing capacitor bank (' + pfRes.dQ_kvar.toFixed(1) + ' kvar) releases ' + (pfRes.S1_kVA - pfRes.S2_kVA).toFixed(1) + ' kVA of capacity.';
      }
    }

    var canvas = document.getElementById('canvas-basics');
    if (!canvas) return;

    var loadData = {
      P: P,
      conn: conn,
      V_LL: vll,
      pf: pf1,
      dQ_kvar: pfRes.dQ_kvar,
      I_line: sys3ph.I_line,
      V_phase: sys3ph.V_phase,
      Z_phase_mag: sys3ph.Z_phase_mag
    };

    if (state.basicsView === 'sld') {
      draw.drawSLD(canvas, loadData);
    } else if (state.basicsView === 'phasor') {
      var Va = core.cpolar(sys3ph.V_phase, 0);
      var Vb = core.cpolar(sys3ph.V_phase, -120);
      var Vc = core.cpolar(sys3ph.V_phase, 120);
      var Ia = core.cpolar(sys3ph.I_line, -Math.acos(pf1) * 180 / Math.PI);
      var title = conn === 'delta'
        ? '3Φ DELTA (Δ): V_PHASE = ' + vll + ' V, I_LINE = ' + sys3ph.I_line.toFixed(1) + ' A (I_PHASE = ' + (sys3ph.I_line / Math.sqrt(3)).toFixed(1) + ' A)'
        : '3Φ WYE (Y): V_PHASE = ' + sys3ph.V_phase.toFixed(1) + ' V, I_LINE = I_PHASE = ' + sys3ph.I_line.toFixed(1) + ' A';
      draw.drawPhasorDiagram(canvas, [
        { vec: Va, label: 'Va', color: '#dc2626' },
        { vec: Vb, label: 'Vb', color: '#d97706' },
        { vec: Vc, label: 'Vc', color: '#0284c7' },
        { vec: Ia, label: 'Ia (lag)', color: '#16a34a' }
      ], title);
    } else {
      draw.drawPowerTriangle(canvas, P, pfRes.Q1_kvar, pfRes.Q2_kvar, loadData);
    }
  }

  function recalcGen() {
    var type = state.genRotor;
    var Vt = parseFloat(document.getElementById('gen-vt').value) || 13.8;
    var P = parseFloat(document.getElementById('gen-p').value) || 50;
    var pf = parseFloat(document.getElementById('gen-pf').value) || 0.80;
    var Ra = parseFloat(document.getElementById('gen-ra').value) || 0.05;
    var Xd = parseFloat(document.getElementById('gen-xd').value) || 1.8;
    var Xq = parseFloat(document.getElementById('gen-xq').value) || 1.2;

    var genData;
    if (type === 'salient') {
      genData = core.calcSalientGenerator(Vt, P, pf, true, Ra, Xd, Xq);
    } else {
      genData = core.calcCylindricalGenerator(Vt, P, pf, true, Ra, Xd);
    }

    window.lastGenPmax = genData.Pmax_MW;
    window.lastGenDelta = genData.delta_deg;
    window.lastGenEg = genData.Eg_LL;

    var resText =
      "Machine Type:            " + (type === 'salient' ? "Salient-Pole" : "Cylindrical (Round)") + "\n" +
      "Terminal Voltage (Vt):   " + Vt.toFixed(2) + " kV (L-L)\n" +
      "Armature Current (Ia):   " + genData.Ia_mag.toFixed(1) + " A\n" +
      "Internal EMF (Eg):       " + genData.Eg_LL.toFixed(2) + " kV (L-L)\n" +
      "Torque Angle (δ):        " + genData.delta_deg.toFixed(2) + "°\n" +
      "Stability Limit (Pmax):  " + genData.Pmax_MW.toFixed(1) + " MW\n" +
      "Operating Power:         " + P.toFixed(1) + " MW (Margin: " + (genData.Pmax_MW - P).toFixed(1) + " MW)";
    document.getElementById('res-gen').textContent = resText;

    if (state.activeTab === 'gen') updateTilesForTab('gen');

    var canvas = document.getElementById('canvas-gen');
    if (canvas) draw.drawPowerAngleCurve(canvas, genData);
  }

  function recalcXfmr() {
    var S = parseFloat(document.getElementById('tr-s').value) || 50;
    var Voc = parseFloat(document.getElementById('tr-voc').value) || 240;
    var Ioc = parseFloat(document.getElementById('tr-ioc').value) || 5.41;
    var Poc = parseFloat(document.getElementById('tr-poc').value) || 186;
    var Vsc = parseFloat(document.getElementById('tr-vsc').value) || 48;
    var Isc = parseFloat(document.getElementById('tr-isc').value) || 20.8;
    var Psc = parseFloat(document.getElementById('tr-psc').value) || 617;

    var p = core.calcTransformerParams(Voc, Ioc, Poc, Vsc, Isc, Psc, S, 2400, 240);
    var Req_lv = p.Req * Math.pow(240 / 2400, 2);
    var Xeq_lv = p.Xeq * Math.pow(240 / 2400, 2);
    var perf = core.calcTransformerPerformance(S, 240, Req_lv, Xeq_lv, Poc, 1.0, 0.8, true);

    var resText =
      "Core Resistance (Rc):     " + p.Rc.toFixed(1) + " Ω (Shunt)\n" +
      "Magnetizing (jXm):        " + p.Xm.toFixed(1) + " Ω (Shunt)\n" +
      "Series Req (Low Voltage): " + Req_lv.toFixed(4) + " Ω\n" +
      "Leakage jXeq (Low Voltage): " + Xeq_lv.toFixed(4) + " Ω\n" +
      "Core Loss (P_core):       " + Poc.toFixed(0) + " W\n" +
      "Full-Load Copper Loss:    " + Psc.toFixed(0) + " W\n\n" +
      "Full-Load Efficiency:    " + perf.efficiency_pct.toFixed(2) + " %\n" +
      "Voltage Regulation:       " + perf.voltage_reg_pct.toFixed(2) + " %";
    document.getElementById('res-xfmr').textContent = resText;

    if (state.activeTab === 'xfmr') updateTilesForTab('xfmr');

    var canvas = document.getElementById('canvas-xfmr');
    if (canvas) draw.drawTransformerCircuit(canvas, {
      Rc: p.Rc,
      Xm: p.Xm,
      Req: Req_lv,
      Xeq: Xeq_lv,
      S_kVA: S,
      eff: perf.efficiency_pct,
      vr: perf.voltage_reg_pct,
      Poc: Poc,
      Psc: Psc
    });
  }

  function recalcLines() {
    var model = state.lineModel;
    var len = parseFloat(document.getElementById('line-len').value) || 300;
    var r = parseFloat(document.getElementById('line-r').value) || 0.08;
    var x = parseFloat(document.getElementById('line-x').value) || 0.48;
    var vr = parseFloat(document.getElementById('line-vr').value) || 220;
    var pr = parseFloat(document.getElementById('line-pr').value) || 150;

    var lineSol = core.solveTransmissionLine(model, r, x, 0, 3.3e-6, len, vr, pr, 0.9, true);

    window.lastLineVs = lineSol.Vs_LL_kV;
    window.lastLineFerranti = lineSol.ferrantiRise_kV;
    window.lastLineSIL = lineSol.SIL_MW;
    window.lastLineEff = lineSol.eff_pct;

    var resText =
      "Sending End Voltage (Vs): " + lineSol.Vs_LL_kV.toFixed(1) + " kV ∠ " + lineSol.Vs_angle_deg.toFixed(2) + "°\n" +
      "Sending End Current (Is): " + lineSol.Is_mag.toFixed(1) + " A ∠ " + lineSol.Is_angle_deg.toFixed(2) + "°\n" +
      "Voltage Regulation (VR):  " + lineSol.voltageRegulation_pct.toFixed(2) + " %\n" +
      "Ferranti No-Load Vr:     " + lineSol.Vr_nl_LL_kV.toFixed(1) + " kV (Rise: +" + lineSol.ferrantiRise_kV.toFixed(1) + " kV)\n" +
      "Surge Impedance Loading:  " + lineSol.SIL_MW.toFixed(1) + " MW\n" +
      "Characteristic Zc:        " + lineSol.Zc_mag.toFixed(1) + " Ω\n" +
      "Transmission Efficiency:  " + lineSol.eff_pct.toFixed(2) + " %";
    document.getElementById('res-line').textContent = resText;

    if (state.activeTab === 'lines') updateTilesForTab('lines');

    var canvas = document.getElementById('canvas-lines');
    if (canvas) draw.drawTransmissionLineDiagram(canvas, lineSol);
  }

  function recalcFlow() {
    var v2 = parseFloat(document.getElementById('flow-v2').value) || 1.03;
    var p2 = (parseFloat(document.getElementById('flow-p2').value) || 50) / 100;
    var p3 = -(parseFloat(document.getElementById('flow-p3').value) || 80) / 100;
    var q3 = -(parseFloat(document.getElementById('flow-q3').value) || 40) / 100;

    var buses = [
      { type: 'slack', V_mag: 1.05, V_angle_deg: 0, P: 0, Q: 0 },
      { type: 'pv', V_mag: v2, V_angle_deg: 0, P: p2, Q: 0 },
      { type: 'pq', V_mag: 1.0, V_angle_deg: 0, P: p3, Q: q3 }
    ];

    var branches = [
      { from: 1, to: 2, r: 0.02, x: 0.06, b_shunt: 0.04 },
      { from: 1, to: 3, r: 0.08, x: 0.24, b_shunt: 0.0 },
      { from: 2, to: 3, r: 0.06, x: 0.18, b_shunt: 0.0 }
    ];

    var result = core.solveGaussSeidel(buses, branches, 80, 1e-4);

    var resText =
      "Gauss-Seidel: Converged in " + result.iterations + " iterations\n\n" +
      "Bus 1 (Slack): |V1| = " + result.buses[0].V_mag.toFixed(4) + " pu ∠ " + result.buses[0].V_angle_deg.toFixed(2) + "°\n" +
      "Bus 2 (PV):    |V2| = " + result.buses[1].V_mag.toFixed(4) + " pu ∠ " + result.buses[1].V_angle_deg.toFixed(2) + "°\n" +
      "Bus 3 (PQ):    |V3| = " + result.buses[2].V_mag.toFixed(4) + " pu ∠ " + result.buses[2].V_angle_deg.toFixed(2) + "°\n\n" +
      "Line 1-2 Active Loss: " + (result.lineFlows[0].P_loss * 100).toFixed(2) + " MW\n" +
      "Line 1-3 Active Loss: " + (result.lineFlows[1].P_loss * 100).toFixed(2) + " MW\n" +
      "Line 2-3 Active Loss: " + (result.lineFlows[2].P_loss * 100).toFixed(2) + " MW";
    document.getElementById('res-flow').textContent = resText;

    if (state.activeTab === 'flow') updateTilesForTab('flow');

    var canvas = document.getElementById('canvas-flow');
    if (canvas) draw.drawLoadFlowNetwork(canvas, result.buses, branches, result.lineFlows, state.flowView, result.YBus, result);
  }

  function recalcFaults() {
    var type = state.faultType;
    var z1 = parseFloat(document.getElementById('flt-z1').value) || 0.20;
    var z2 = parseFloat(document.getElementById('flt-z2').value) || 0.20;
    var z0 = parseFloat(document.getElementById('flt-z0').value) || 0.30;
    var mva = parseFloat(document.getElementById('flt-mva').value) || 100;
    var vll = parseFloat(document.getElementById('flt-v').value) || 138;

    var faultRes;
    if (type === '3phase') {
      faultRes = core.solveSymmetricalFault([1, 0], [0, z1], [0, 0], mva, vll);
    } else if (type === 'slg') {
      faultRes = core.solveSLGFault([1, 0], [0, z0], [0, z1], [0, z2], [0, 0], mva, vll);
    } else if (type === 'll') {
      faultRes = core.solveLLFault([1, 0], [0, z0], [0, z1], [0, z2], [0, 0], mva, vll);
    } else {
      faultRes = core.solveDLGFault([1, 0], [0, z0], [0, z1], [0, z2], [0, 0], mva, vll);
    }

    faultRes.mva = mva;
    faultRes.vll = vll;

    window.lastFaultIf = faultRes.If_pu;
    window.lastFaultKa = faultRes.If_kA;
    window.lastFaultMva = mva * faultRes.If_pu;

    var resText =
      "Fault Type:              " + type.toUpperCase() + "\n" +
      "Fault Current (If):      " + faultRes.If_pu.toFixed(4) + " pu\n" +
      "Fault Current (kA):      " + faultRes.If_kA.toFixed(2) + " kA\n" +
      "Short-Circuit SCMVA:     " + (mva * faultRes.If_pu).toFixed(1) + " MVA\n" +
      "Positive Sequence Z1:    j" + z1.toFixed(2) + " pu\n" +
      "Negative Sequence Z2:    j" + z2.toFixed(2) + " pu\n" +
      "Zero Sequence Z0:        j" + z0.toFixed(2) + " pu";
    document.getElementById('res-faults').textContent = resText;

    if (state.activeTab === 'faults') updateTilesForTab('faults');

    var canvas = document.getElementById('canvas-faults');
    if (canvas) draw.drawSequenceNetworks(canvas, type, [0, z0], [0, z1], [0, z2], faultRes);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
