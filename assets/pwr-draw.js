/**
 * Power Systems CAD - Vector & Canvas Diagram Engine
 * Renders high-precision electrical engineering CAD schematics,
 * ETAP/SCADA-style Single Line Diagrams (SLD), Phasor diagrams, and characteristic curves.
 */
(function (root) {
  'use strict';

  var THEME = {
    bg: '#ffffff',
    grid: 'rgba(0,0,0,0.05)',
    primary: '#1f3a5f',
    accent: '#e07a3f',
    text: '#1e293b',
    muted: '#64748b',
    busbar: '#0f172a',
    phaseA: '#dc2626',
    phaseB: '#d97706',
    phaseC: '#0284c7',
    ground: '#475569',
    activeLine: '#16a34a'
  };

  function initCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var t = THEME;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, w, h);

    // 30px CAD grid
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    for (var x = 0; x <= w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var y = 0; y <= h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    return { ctx: ctx, w: w, h: h, t: t };
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, headLen) {
    headLen = headLen || 8;
    var angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // --- 1. SINGLE LINE DIAGRAM (SLD) ---
  function drawSLD(canvas, loadData) {
    loadData = loadData || {};
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    var P_val = loadData.P !== undefined ? loadData.P : 500;
    var conn = loadData.conn || 'wye';
    var vll = loadData.V_LL || 480;
    var pf = loadData.pf || 0.75;
    var dQ = loadData.dQ_kvar || 276.6;
    var isDelta = conn === 'delta';
    var I_line = loadData.I_line || 801.9;

    // Header Title
    ctx.fillStyle = t.text;
    ctx.font = 'bold 12.5px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SUBSTATION & POWER SYSTEM SINGLE LINE DIAGRAM (IEEE STD 315 / IEC 60617)', 20, 24);

    // ==========================================
    // THREE VOLTAGE ZONE COLOR BANDS (Subtle, Clean)
    // ==========================================
    var zoneY = 40;
    var zoneH = 320;

    // Zone 1: Generation (13.8 kV)
    var z1X = 14, z1W = 180;
    ctx.fillStyle = 'rgba(31, 58, 95, 0.03)';
    ctx.fillRect(z1X, zoneY, z1W, zoneH);
    ctx.strokeStyle = 'rgba(31, 58, 95, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(z1X, zoneY, z1W, zoneH);

    ctx.fillStyle = t.primary;
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText('ZONE 1: GENERATION (13.8 kV)', z1X + 10, zoneY + 16);

    // Zone 2: Transmission Grid (138 kV)
    var z2X = z1X + z1W + 6, z2W = 236;
    ctx.fillStyle = 'rgba(224, 122, 63, 0.03)';
    ctx.fillRect(z2X, zoneY, z2W, zoneH);
    ctx.strokeStyle = 'rgba(224, 122, 63, 0.25)';
    ctx.strokeRect(z2X, zoneY, z2W, zoneH);

    ctx.fillStyle = t.accent;
    ctx.fillText('ZONE 2: TRANSMISSION (138 kV)', z2X + 10, zoneY + 16);

    // Zone 3: Industrial Substation & Distribution (480 V)
    var z3X = z2X + z2W + 6, z3W = w - z3X - 14;
    ctx.fillStyle = 'rgba(22, 163, 74, 0.03)';
    ctx.fillRect(z3X, zoneY, z3W, zoneH);
    ctx.strokeStyle = 'rgba(22, 163, 74, 0.25)';
    ctx.strokeRect(z3X, zoneY, z3W, zoneH);

    ctx.fillStyle = '#16a34a';
    ctx.fillText('ZONE 3: LOAD CENTER (480 V)', z3X + 10, zoneY + 16);
    ctx.setLineDash([]);

    // Main centerline height for busbars
    var y = 195;

    // ==========================================
    // ZONE 1 EQUIPMENT (Generation)
    // ==========================================
    // Generator G1 (Larger, bold circle)
    var genX = 50;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(genX, y, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Internal sine wave inside G1
    ctx.beginPath();
    ctx.moveTo(genX - 12, y);
    ctx.bezierCurveTo(genX - 6, y - 11, genX, y - 11, genX, y);
    ctx.bezierCurveTo(genX, y + 11, genX + 6, y + 11, genX + 12, y);
    ctx.stroke();

    ctx.fillStyle = t.primary;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('G1 (50 MVA)', genX, y - 30);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('13.8 kV', genX, y + 38);

    // Wire to Knife switch & CB-1
    var sw1X = 82;
    ctx.beginPath();
    ctx.moveTo(genX + 24, y);
    ctx.lineTo(sw1X, y);
    ctx.stroke();

    // Disconnect knife switch
    ctx.beginPath();
    ctx.moveTo(sw1X, y);
    ctx.lineTo(sw1X + 8, y - 6);
    ctx.stroke();

    // Circuit Breaker CB1 [X]
    var cb1X = 102;
    ctx.strokeStyle = t.primary;
    ctx.strokeRect(cb1X - 9, y - 9, 18, 18);
    ctx.beginPath();
    ctx.moveTo(cb1X - 7, y - 7); ctx.lineTo(cb1X + 7, y + 7);
    ctx.moveTo(cb1X + 7, y - 7); ctx.lineTo(cb1X - 7, y + 7);
    ctx.stroke();
    ctx.fillStyle = t.text;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('CB-1', cb1X, y - 14);

    // Wire to Step-Up Transformer T1
    var t1X = 150;
    ctx.beginPath();
    ctx.moveTo(cb1X + 9, y);
    ctx.lineTo(t1X - 20, y);
    ctx.stroke();

    // Transformer T1 (Interlocking circles: radius 18)
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(t1X - 10, y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(t1X + 10, y, 18, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = t.accent;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('T1', t1X, y - 26);
    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('13.8/138 kV (Δ-Yg)', t1X, y + 36);

    // Wire from T1 to Bus 1
    var bus1X = 216;
    ctx.strokeStyle = t.primary;
    ctx.beginPath();
    ctx.moveTo(t1X + 28, y);
    ctx.lineTo(bus1X, y);
    ctx.stroke();

    // ==========================================
    // ZONE 2 EQUIPMENT (138 kV Transmission)
    // ==========================================
    // Bus 1 (138 kV Bar) - Bolder, taller bar
    ctx.strokeStyle = t.busbar;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bus1X, y - 68);
    ctx.lineTo(bus1X, y + 68);
    ctx.stroke();

    // Clean Bus 1 Label (No heavy box)
    ctx.fillStyle = t.primary;
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUS 1 (138 kV)', bus1X, y - 78);
    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('1.00 pu ∠ 0°', bus1X, y - 90);

    // Surge Arrester branch off Bus 1
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bus1X, y - 36);
    ctx.lineTo(bus1X + 20, y - 36);
    ctx.lineTo(bus1X + 20, y - 22);
    ctx.stroke();
    ctx.strokeRect(bus1X + 16, y - 22, 8, 12);
    ctx.beginPath();
    ctx.moveTo(bus1X + 20, y - 10); ctx.lineTo(bus1X + 20, y - 4);
    ctx.moveTo(bus1X + 15, y - 4); ctx.lineTo(bus1X + 25, y - 4);
    ctx.moveTo(bus1X + 17, y - 1); ctx.lineTo(bus1X + 23, y - 1);
    ctx.stroke();
    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.fillText('LA', bus1X + 30, y - 16);

    // Bus 2 (138 kV Bar)
    var bus2X = 416;
    ctx.strokeStyle = t.busbar;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bus2X, y - 68);
    ctx.lineTo(bus2X, y + 68);
    ctx.stroke();

    // Clean Bus 2 Label
    ctx.fillStyle = t.primary;
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUS 2 (138 kV)', bus2X, y - 78);
    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('0.985 pu ∠ -3.2°', bus2X, y - 90);

    // Overhead Transmission Line between Bus 1 and Bus 2
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bus1X, y);
    ctx.lineTo(bus2X, y);
    ctx.stroke();

    // Overhead Lattice Tower Silhouette
    var twX = (bus1X + bus2X) / 2;
    var twY = y - 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(twX - 14, twY + 26); ctx.lineTo(twX - 4, twY - 24);
    ctx.moveTo(twX + 14, twY + 26); ctx.lineTo(twX + 4, twY - 24);
    ctx.moveTo(twX - 20, twY - 12); ctx.lineTo(twX + 20, twY - 12);
    ctx.moveTo(twX - 16, twY - 22); ctx.lineTo(twX + 16, twY - 22);
    ctx.moveTo(twX - 11, twY + 14); ctx.lineTo(twX + 11, twY + 14);
    ctx.moveTo(twX - 11, twY + 14); ctx.lineTo(twX + 7, twY);
    ctx.moveTo(twX + 11, twY + 14); ctx.lineTo(twX - 7, twY);
    ctx.stroke();

    // Condensed Transmission Line Badge (Single clean pill)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 1;
    ctx.fillRect(twX - 88, y + 36, 176, 22);
    ctx.strokeRect(twX - 88, y + 36, 176, 22);

    ctx.fillStyle = t.accent;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('138 kV Line (150 km) | SIL = 126 MW', twX, y + 51);

    // ==========================================
    // ZONE 3 EQUIPMENT (Substation & Industrial Load)
    // ==========================================
    // Wire from Bus 2 to Step-Down Transformer T2
    var t2X = 476;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bus2X, y);
    ctx.lineTo(t2X - 20, y);
    ctx.stroke();

    // Transformer T2 (Interlocking circles: radius 18)
    ctx.strokeStyle = t.accent;
    ctx.beginPath(); ctx.arc(t2X - 10, y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(t2X + 10, y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = t.accent;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('T2', t2X, y - 26);
    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('138 kV / ' + vll + ' V (Yg-Δ)', t2X, y + 36);

    // Wire to Bus 3
    var bus3X = 538;
    ctx.strokeStyle = t.primary;
    ctx.beginPath();
    ctx.moveTo(t2X + 28, y);
    ctx.lineTo(bus3X, y);
    ctx.stroke();

    // Low-Voltage Bus 3 (480 V Busbar)
    ctx.strokeStyle = t.busbar;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bus3X, y - 75);
    ctx.lineTo(bus3X, y + 75);
    ctx.stroke();

    // Clean Bus 3 Label
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUS 3 (' + vll + ' V)', bus3X, y - 82);

    // Feeder 1 (Upper Branch): Industrial Load
    var loadFeederY = y - 42;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bus3X, loadFeederY);
    ctx.lineTo(bus3X + 23, loadFeederY);
    ctx.stroke();

    // Feeder breaker CB-Load
    var cbLX = 568;
    ctx.strokeRect(cbLX - 7, loadFeederY - 7, 14, 14);
    ctx.beginPath();
    ctx.moveTo(cbLX - 5, loadFeederY - 5); ctx.lineTo(cbLX + 5, loadFeederY + 5);
    ctx.moveTo(cbLX + 5, loadFeederY - 5); ctx.lineTo(cbLX - 5, loadFeederY + 5);
    ctx.stroke();

    var loadGeoX = 608;
    ctx.beginPath();
    ctx.moveTo(cbLX + 7, loadFeederY);
    ctx.lineTo(loadGeoX - 18, loadFeederY);
    ctx.stroke();

    // Load symbol & Condensed 2-line label
    var annX = loadGeoX + 24;
    if (isDelta) {
      ctx.strokeStyle = t.phaseA;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(loadGeoX, loadFeederY - 18);
      ctx.lineTo(loadGeoX + 18, loadFeederY + 16);
      ctx.lineTo(loadGeoX - 18, loadFeederY + 16);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = t.phaseA;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Δ', loadGeoX, loadFeederY + 5);

      // Condensed Delta annotations (2 lines)
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('3Φ DELTA LOAD: ' + P_val.toFixed(0) + ' kW', annX, loadFeederY - 4);
      ctx.fillStyle = t.muted;
      ctx.font = '9.5px monospace';
      ctx.fillText('I_line = ' + I_line.toFixed(1) + ' A  (PF ' + pf.toFixed(2) + ' lag)', annX, loadFeederY + 12);
    } else {
      ctx.strokeStyle = t.phaseC;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      var nX = loadGeoX, nY = loadFeederY;
      ctx.moveTo(nX, nY); ctx.lineTo(nX, nY - 18);
      ctx.moveTo(nX, nY); ctx.lineTo(nX + 15, nY + 13);
      ctx.moveTo(nX, nY); ctx.lineTo(nX - 15, nY + 13);
      ctx.stroke();

      ctx.beginPath(); ctx.arc(nX, nY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = t.phaseC;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Y', loadGeoX + 14, loadFeederY - 8);

      // Condensed Wye annotations (2 lines)
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('3Φ WYE LOAD: ' + P_val.toFixed(0) + ' kW', annX, loadFeederY - 4);
      ctx.fillStyle = t.muted;
      ctx.font = '9.5px monospace';
      ctx.fillText('I_line = ' + I_line.toFixed(1) + ' A  (PF ' + pf.toFixed(2) + ' lag)', annX, loadFeederY + 12);
    }

    // Feeder 2 (Lower Branch): Shunt Capacitor Bank
    var capFeederY = y + 42;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bus3X, capFeederY);
    ctx.lineTo(bus3X + 24, capFeederY);
    ctx.stroke();

    // Contactor switch
    var swCX = 568;
    ctx.beginPath();
    ctx.moveTo(swCX - 6, capFeederY);
    ctx.lineTo(swCX + 4, capFeederY - 6);
    ctx.stroke();

    var capGeoX = 608;
    ctx.beginPath();
    ctx.moveTo(swCX + 4, capFeederY);
    ctx.lineTo(capGeoX - 12, capFeederY);
    ctx.stroke();

    // Physical 3-phase capacitor symbol (parallel plates)
    ctx.strokeStyle = t.activeLine;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(capGeoX - 9, capFeederY - 14); ctx.lineTo(capGeoX - 9, capFeederY + 14);
    ctx.moveTo(capGeoX - 3, capFeederY - 14); ctx.lineTo(capGeoX - 3, capFeederY + 14);
    ctx.moveTo(capGeoX + 3, capFeederY - 14); ctx.lineTo(capGeoX + 3, capFeederY + 14);
    ctx.moveTo(capGeoX + 9, capFeederY - 14); ctx.lineTo(capGeoX + 9, capFeederY + 14);
    ctx.stroke();

    // Condensed Capacitor annotations (2 lines)
    var capAnnX = capGeoX + 24;
    ctx.fillStyle = t.activeLine;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CAPACITORS: +' + dQ.toFixed(1) + ' kvar', capAnnX, capFeederY - 4);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('PF: ' + pf.toFixed(2) + ' → 0.95 (' + (isDelta ? 'Δ-Wired' : 'Y-Wired') + ')', capAnnX, capFeederY + 12);

    // ==========================================
    // BOTTOM SCADA DIGITAL TELEMETRY DASHBOARD
    // ==========================================
    var dashY = h - 44;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(14, dashY, w - 28, 28);
    ctx.strokeRect(14, dashY, w - 28, 28);

    ctx.fillStyle = t.text;
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCADA: G1 = 50.3 MW  |  Line Loss = 0.3 MW (0.6%)  |  Bus 3 Load = ' + P_val.toFixed(0) + ' kW  |  Caps = +' + dQ.toFixed(1) + ' kvar  |  Grid: NORMAL', w / 2, dashY + 18);
  }

  // --- 2. POWER TRIANGLE ---
  function drawPowerTriangle(canvas, P, Q1, Q2, loadData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 13px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('COMPLEX POWER TRIANGLE & POWER FACTOR CORRECTION', 24, 25);

    // Connection info card in top right
    if (loadData && loadData.conn) {
      var cardX = w - 250;
      var cardY = 44;
      var cardW = 232;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.fillRect(cardX, cardY, cardW, 106);
      ctx.strokeRect(cardX, cardY, cardW, 106);

      ctx.fillStyle = t.text;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      var isDelta = loadData.conn === 'delta';
      ctx.fillText(isDelta ? '3Φ DELTA (Δ) CONNECTION' : '3Φ WYE (Y) CONNECTION', cardX + 10, cardY + 20);

      ctx.fillStyle = t.muted;
      ctx.font = '10px monospace';
      var vph = isDelta ? loadData.V_LL : (loadData.V_LL / Math.sqrt(3));
      var iph = isDelta ? (loadData.I_line / Math.sqrt(3)) : loadData.I_line;
      ctx.fillText('V_phase = ' + (isDelta ? 'V_LL = ' : 'V_LL/√3 = ') + vph.toFixed(1) + ' V', cardX + 10, cardY + 38);
      ctx.fillText('I_phase = ' + (isDelta ? 'I_line/√3 = ' : 'I_line = ') + iph.toFixed(1) + ' A', cardX + 10, cardY + 54);
      ctx.fillText('Phase Z = ' + (loadData.Z_phase_mag || 0).toFixed(2) + ' Ω', cardX + 10, cardY + 70);

      ctx.fillStyle = isDelta ? '#16a34a' : t.accent;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(isDelta ? 'Capacitor: C_Δ = 1/3 C_Y (-67%)' : 'Capacitor: C_Y = 3 · C_Δ', cardX + 10, cardY + 90);
    }

    var originX = 60;
    var originY = h - 55;
    var maxScale = Math.max(P, Math.max(Q1, Q2)) || 1;
    var scaleX = (w - 240) / maxScale;
    var scaleY = (h - 110) / maxScale;
    var s = Math.min(scaleX, scaleY);

    var pWidth = P * s;
    var q1Height = Q1 * s;
    var q2Height = Q2 * s;

    // Horizontal Real Power P line
    ctx.lineWidth = 3;
    drawArrow(ctx, originX, originY, originX + pWidth, originY, t.primary, 10);
    ctx.fillStyle = t.primary;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P = ' + P.toFixed(1) + ' kW (Active Power)', originX + pWidth / 2, originY + 22);

    // Initial Uncorrected Reactive Power Q1 (vertical up)
    drawArrow(ctx, originX + pWidth, originY, originX + pWidth, originY - q1Height, t.phaseA, 8);
    ctx.fillStyle = t.phaseA;
    ctx.textAlign = 'left';
    ctx.fillText('Q1 = ' + Q1.toFixed(1) + ' kvar', originX + pWidth + 12, originY - q1Height / 2);

    // Initial Apparent Power S1 (hypotenuse)
    var S1 = Math.sqrt(P * P + Q1 * Q1);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = t.phaseA;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + pWidth, originY - q1Height);
    ctx.stroke();
    ctx.fillText('S1 = ' + S1.toFixed(1) + ' kVA', originX + pWidth * 0.45, originY - q1Height * 0.55);

    // Corrected Reactive Power Q2
    ctx.setLineDash([]);
    drawArrow(ctx, originX + pWidth + 2, originY, originX + pWidth + 2, originY - q2Height, t.phaseC, 8);
    ctx.fillStyle = t.phaseC;
    ctx.fillText('Q2 = ' + Q2.toFixed(1) + ' kvar', originX + pWidth + 12, originY - q2Height / 2 + 10);

    // Corrected Apparent Power S2 (hypotenuse)
    var S2 = Math.sqrt(P * P + Q2 * Q2);
    ctx.strokeStyle = t.phaseC;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + pWidth, originY - q2Height);
    ctx.stroke();

    // Capacitor Reduction dQ = Q1 - Q2 (Red arrow down)
    var dQ = Q1 - Q2;
    if (dQ > 0) {
      drawArrow(ctx, originX + pWidth - 15, originY - q1Height, originX + pWidth - 15, originY - q2Height, t.accent, 8);
      ctx.fillStyle = t.accent;
      ctx.textAlign = 'right';
      ctx.fillText('ΔQ = ' + dQ.toFixed(1) + ' kvar (Capacitor Bank)', originX + pWidth - 22, originY - (q1Height + q2Height) / 2);
    }

    // Angle arcs
    ctx.strokeStyle = t.muted;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(originX, originY, 40, -Math.atan2(q1Height, pWidth), 0);
    ctx.stroke();
    ctx.fillStyle = t.muted;
    ctx.textAlign = 'left';
    ctx.fillText('φ1', originX + 46, originY - 14);
  }

  // --- 3. POLAR PHASOR DIAGRAM (3-Phase / Symmetrical) ---
  function drawPhasorDiagram(canvas, vectors, title) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 13px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title || 'PHASOR DIAGRAM (POLAR COORDINATES)', 24, 25);

    var cx = w / 2;
    var cy = h / 2 + 10;
    var maxR = Math.min(w, h) * 0.40;

    // Concentric grid rings
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    for (var r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxR / 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial axis lines every 30 degrees
    ctx.fillStyle = t.muted;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (var ang = 0; ang < 360; ang += 30) {
      var rad = ang * Math.PI / 180;
      var rx = cx + maxR * Math.cos(rad);
      var ry = cy - maxR * Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      var tx = cx + (maxR + 14) * Math.cos(rad);
      var ty = cy - (maxR + 14) * Math.sin(rad) + 4;
      ctx.fillText(ang + '°', tx, ty);
    }

    // Find max vector magnitude to scale
    var maxMag = 1e-6;
    vectors.forEach(function (v) {
      var mag = Math.sqrt(v.vec[0] * v.vec[0] + v.vec[1] * v.vec[1]);
      if (mag > maxMag) maxMag = mag;
    });

    // Plot vectors
    ctx.lineWidth = 2.5;
    vectors.forEach(function (v) {
      var vx = v.vec[0], vy = v.vec[1];
      var mag = Math.sqrt(vx * vx + vy * vy);
      var ang = Math.atan2(vy, vx);
      var len = (mag / maxMag) * maxR;
      var px = cx + len * Math.cos(ang);
      var py = cy - len * Math.sin(ang);

      drawArrow(ctx, cx, cy, px, py, v.color || t.primary, 8);
      ctx.fillStyle = v.color || t.primary;
      ctx.font = 'bold 11px monospace';

      // Clean non-overlapping alignment based on vector direction
      var cosA = Math.cos(ang);
      var sinA = Math.sin(ang);
      var lx, ly;

      if (cosA > 0.15) {
        // Pointing to the right (like Va at 0 deg) -> text starts cleanly to the right of arrowhead
        ctx.textAlign = 'left';
        lx = px + 12;
        ly = py + 4;
      } else if (cosA < -0.15) {
        // Pointing to the left -> text ends to the left of arrowhead
        ctx.textAlign = 'right';
        lx = px - 12;
        ly = py + 4;
      } else {
        // Pointing vertically up or down
        ctx.textAlign = 'center';
        lx = px;
        ly = sinA > 0 ? py - 12 : py + 18;
      }
      ctx.fillText(v.label + ' (' + mag.toFixed(2) + ' ∠ ' + (ang * 180 / Math.PI).toFixed(1) + '°)', lx, ly);
    });
  }

  // --- 4. SYNCHRONOUS GENERATOR POWER-ANGLE CURVE ---
  function drawPowerAngleCurve(canvas, genData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 13px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SYNCHRONOUS MACHINE POWER-ANGLE CURVE P(δ)', 24, 25);

    var margin = { top: 50, right: 40, bottom: 50, left: 60 };
    var plotW = w - margin.left - margin.right;
    var plotH = h - margin.top - margin.bottom;

    var Pmax = genData.Pmax_MW * 1.15 || 100;

    // Axes
    ctx.strokeStyle = t.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    // Horizontal grid & MW labels
    ctx.fillStyle = t.muted;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (var s = 0; s <= 4; s++) {
      var valP = (Pmax / 4) * s;
      var y = margin.top + plotH - (plotH / 4) * s;
      ctx.strokeStyle = t.grid;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      ctx.fillText(valP.toFixed(0) + ' MW', margin.left - 8, y + 4);
    }

    // Vertical grid & delta labels (0 to 180 deg)
    ctx.textAlign = 'center';
    for (var d = 0; d <= 180; d += 30) {
      var x = margin.left + (d / 180) * plotW;
      ctx.strokeStyle = t.grid;
      ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
      ctx.fillText(d + '°', x, margin.top + plotH + 16);
    }
    ctx.fillText('Power Angle δ (Torque Angle)', margin.left + plotW / 2, margin.top + plotH + 34);

    // Plot P(delta) curve
    var curve = genData.curve || [];
    if (curve.length > 0) {
      ctx.strokeStyle = t.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      curve.forEach(function (pt, idx) {
        var px = margin.left + (pt.delta / 180) * plotW;
        var py = margin.top + plotH - (pt.P / Pmax) * plotH;
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // P_max dashed line
      var pyMax = margin.top + plotH - (genData.Pmax_MW / Pmax) * plotH;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = t.phaseA;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, pyMax);
      ctx.lineTo(margin.left + plotW, pyMax);
      ctx.stroke();
      ctx.fillStyle = t.phaseA;
      ctx.textAlign = 'right';
      ctx.fillText('P_max = ' + genData.Pmax_MW.toFixed(1) + ' MW (Stability Limit)', margin.left + plotW - 10, pyMax - 8);

      // Current operating point marker
      var curDelta = genData.delta_deg || 0;
      var curX = margin.left + (curDelta / 180) * plotW;
      var curP = genData.type === 'salient'
        ? (genData.P_fund_max * Math.sin(curDelta * Math.PI / 180) + genData.P_rel_max * Math.sin(2 * curDelta * Math.PI / 180))
        : (genData.Pmax_MW * Math.sin(curDelta * Math.PI / 180));
      var curY = margin.top + plotH - (curP / Pmax) * plotH;

      ctx.setLineDash([]);
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.arc(curX, curY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Clean operating point label placed down and to the right of the dot (or left if near right margin)
      var opText = 'Operating Point: δ = ' + curDelta.toFixed(1) + '°, P = ' + curP.toFixed(1) + ' MW';
      ctx.font = 'bold 10.5px monospace';
      var opW = ctx.measureText(opText).width;
      var textX = curX + 14;
      var textY = curY + 22;
      if (textX + opW > w - 20) {
        textX = curX - 14 - opW;
      }

      // Card background so text never clashes with the rising curve
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.fillRect(textX - 4, textY - 11, opW + 8, 16);
      ctx.strokeRect(textX - 4, textY - 11, opW + 8, 16);

      ctx.fillStyle = t.text;
      ctx.textAlign = 'left';
      ctx.fillText(opText, textX, textY + 1);
    }
  }

  // --- 5. POWER TRANSFORMER EQUIVALENT CIRCUIT ---
  function drawTransformerCircuit(canvas, p) {
    p = p || {};
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 12.5px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('POWER TRANSFORMER EXACT T-EQUIVALENT (REFERRED TO LOW VOLTAGE / SECONDARY)', 20, 24);

    var y = 160;
    var gy = 320;

    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;

    // Primary Terminals (V1 input)
    var inX = 55;
    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Primary Terminals (V1)', inX, y - 30);
    ctx.fillStyle = t.muted;
    ctx.font = '10px monospace';
    ctx.fillText('Rated: 2400 V', inX, y - 16);

    ctx.strokeStyle = t.primary;
    ctx.beginPath(); ctx.arc(inX, y, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(inX, gy, 4, 0, Math.PI * 2); ctx.stroke();

    // R_eq resistor (series copper resistance)
    var rx = 165;
    ctx.beginPath();
    ctx.moveTo(inX + 4, y);
    ctx.lineTo(rx, y);
    ctx.stroke();

    ctx.strokeRect(rx, y - 10, 60, 20);
    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Req: ' + (p.Req || 0.0142).toFixed(4) + ' Ω', rx + 30, y - 16);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px sans-serif';
    ctx.fillText('(Series Copper)', rx + 30, y + 24);

    // X_eq inductor coils (series leakage reactance)
    var lx = 280;
    ctx.beginPath();
    ctx.moveTo(rx + 60, y);
    ctx.lineTo(lx, y);
    ctx.stroke();

    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(lx + 8 + i * 14, y, 7, Math.PI, 0);
      ctx.stroke();
    }
    var indEnd = lx + 8 + 3 * 14 + 7;
    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('jXeq: j' + (p.Xeq || 0.0182).toFixed(4) + ' Ω', lx + 28, y - 16);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px sans-serif';
    ctx.fillText('(Leakage Reactance)', lx + 28, y + 24);

    // Shunt core branch (Rc || jXm)
    var sx = 440;
    ctx.beginPath();
    ctx.moveTo(indEnd, y);
    ctx.lineTo(sx, y);
    ctx.lineTo(sx, y + 30);
    ctx.stroke();

    // Horizontal split for parallel core branches
    var rcX = sx - 45;
    var xmX = sx + 45;
    ctx.beginPath();
    ctx.moveTo(rcX, y + 30);
    ctx.lineTo(xmX, y + 30);
    ctx.stroke();

    // Rc resistor (vertical)
    ctx.beginPath();
    ctx.moveTo(rcX, y + 30);
    ctx.lineTo(rcX, y + 42);
    ctx.stroke();
    ctx.strokeRect(rcX - 9, y + 42, 18, 44);
    ctx.beginPath();
    ctx.moveTo(rcX, y + 86);
    ctx.lineTo(rcX, y + 100);
    ctx.stroke();

    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Rc: ' + (p.Rc || 310).toFixed(0) + ' Ω', rcX - 14, y + 60);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px sans-serif';
    ctx.fillText('(Core Loss)', rcX - 14, y + 74);

    // Xm inductor (vertical)
    ctx.beginPath();
    ctx.moveTo(xmX, y + 30);
    ctx.lineTo(xmX, y + 42);
    ctx.stroke();
    for (var j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(xmX, y + 48 + j * 12, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(xmX, y + 78);
    ctx.lineTo(xmX, y + 100);
    ctx.stroke();

    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('jXm: j' + (p.Xm || 86).toFixed(0) + ' Ω', xmX + 14, y + 60);
    ctx.fillStyle = t.muted;
    ctx.font = '9.5px sans-serif';
    ctx.fillText('(Magnetizing)', xmX + 14, y + 74);

    // Recombine shunt branches to ground
    ctx.beginPath();
    ctx.moveTo(rcX, y + 100);
    ctx.lineTo(xmX, y + 100);
    ctx.moveTo(sx, y + 100);
    ctx.lineTo(sx, gy);
    ctx.stroke();

    // Top rail continues to secondary
    var secX = 620;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(secX, y);
    ctx.stroke();

    // Bottom continuous ground return wire
    ctx.beginPath();
    ctx.moveTo(inX + 4, gy);
    ctx.lineTo(secX, gy);
    ctx.stroke();

    // Center Ground symbol
    ctx.beginPath();
    ctx.moveTo(sx, gy);
    ctx.lineTo(sx, gy + 14);
    ctx.moveTo(sx - 12, gy + 14); ctx.lineTo(sx + 12, gy + 14);
    ctx.moveTo(sx - 7, gy + 18);  ctx.lineTo(sx + 7, gy + 18);
    ctx.moveTo(sx - 3, gy + 22);  ctx.lineTo(sx + 3, gy + 22);
    ctx.stroke();

    // Secondary load terminals & ratings
    ctx.beginPath(); ctx.arc(secX, y, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(secX, gy, 4, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = t.text;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Secondary Output (V2)', secX + 16, y - 10);
    ctx.fillStyle = t.muted;
    ctx.font = '10px monospace';
    ctx.fillText('Rated: 240 V (Full Load)', secX + 16, y + 4);

    // Load box across secondary terminals
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = t.accent;
    ctx.strokeRect(secX - 4, y + 14, 8, gy - y - 28);
    ctx.setLineDash([]);

    ctx.fillStyle = t.accent;
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Load: ' + (p.S_kVA || 50) + ' kVA', secX + 16, (y + gy) / 2 - 4);
    ctx.fillText('PF: 0.8 lag', secX + 16, (y + gy) / 2 + 10);

    // Bottom info readout box
    var boxX = 20, boxW = w - 40;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, gy + 32, boxW, 30);
    ctx.strokeRect(boxX, gy + 32, boxW, 30);

    var effVal = p.eff !== undefined ? p.eff.toFixed(2) : '98.03';
    var vrVal = p.vr !== undefined ? p.vr.toFixed(2) : '1.94';
    var pcoreVal = p.Poc !== undefined ? p.Poc.toFixed(0) : (p.Pcore !== undefined ? p.Pcore.toFixed(0) : '186');
    var pcuVal = p.Psc !== undefined ? p.Psc.toFixed(0) : (p.Pcu !== undefined ? p.Pcu.toFixed(0) : '617');

    ctx.fillStyle = t.text;
    ctx.font = '10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('T-Equivalent Model: Full-Load η = ' + effVal + '%  |  VR = ' + vrVal + '%  |  Pcore = ' + pcoreVal + ' W  |  Pcu = ' + pcuVal + ' W', w / 2, gy + 51);
  }

  // --- 6. TRANSMISSION LINE VOLTAGE PROFILE (FERRANTI EFFECT) ---
  function drawTransmissionLineDiagram(canvas, lineData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 12.5px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VOLTAGE PROFILE ALONG TRANSMISSION LINE (FERRANTI EFFECT & SURGE IMPEDANCE LOADING)', 20, 24);

    var margin = { top: 50, right: 40, bottom: 50, left: 65 };
    var plotW = w - margin.left - margin.right;
    var plotH = h - margin.top - margin.bottom;

    var profile = lineData.profile || [];
    var maxV = lineData.Vr_nl_LL_kV * 1.08 || 250;
    var minV = lineData.Vs_LL_kV * 0.90 || 180;
    var rangeV = maxV - minV || 1;

    // Axes
    ctx.strokeStyle = t.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    // Horizontal grid & kV labels
    ctx.fillStyle = t.muted;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (var s = 0; s <= 4; s++) {
      var valV = minV + (rangeV / 4) * s;
      var y = margin.top + plotH - (plotH / 4) * s;
      ctx.strokeStyle = t.grid;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      ctx.fillText(valV.toFixed(1) + ' kV', margin.left - 8, y + 4);
    }

    // Distance labels (Sending end 0 km -> Receiving end L km)
    ctx.textAlign = 'center';
    var totalLen = (profile[profile.length - 1] || {}).dist_km || 300;
    for (var d = 0; d <= totalLen; d += totalLen / 5) {
      var x = margin.left + (d / totalLen) * plotW;
      ctx.strokeStyle = t.grid;
      ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
      ctx.fillText(d.toFixed(0) + ' km', x, margin.top + plotH + 16);
    }
    ctx.fillText('Line Distance from Sending End (km)', margin.left + plotW / 2, margin.top + plotH + 34);

    // Plot No-Load Profile (Ferranti Voltage Rise)
    if (profile.length > 0) {
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      profile.forEach(function (pt, idx) {
        var px = margin.left + (pt.dist_km / totalLen) * plotW;
        var py = margin.top + plotH - ((pt.V_nl - minV) / rangeV) * plotH;
        if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Flat SIL line
      var pyVs = margin.top + plotH - ((lineData.Vs_LL_kV - minV) / rangeV) * plotH;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = t.phaseC;
      ctx.beginPath();
      ctx.moveTo(margin.left, pyVs);
      ctx.lineTo(margin.left + plotW, pyVs);
      ctx.stroke();
      ctx.fillText('Sending Voltage Vs = ' + lineData.Vs_LL_kV.toFixed(1) + ' kV', margin.left + 110, pyVs - 8);

      ctx.fillStyle = t.accent;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Ferranti Rise: Vr(no-load) = ' + lineData.Vr_nl_LL_kV.toFixed(1) + ' kV (+ ' + lineData.ferrantiRise_kV.toFixed(1) + ' kV)', margin.left + plotW, margin.top + 20);
    }
  }

  // --- 7. LOAD FLOW 3-BUS NETWORK DIAGRAM & Y-BUS MATRIX ---
  function drawLoadFlowNetwork(canvas, buses, branches, lineFlows, view, YBus, gsResult) {
    view = view || 'sld';
    if (view === 'ybus') {
      drawLoadFlowYBus(canvas, YBus, buses, branches, gsResult);
      return;
    }

    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 12.5px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('3-BUS POWER FLOW NETWORK · NODAL INJECTIONS & DIRECTIONAL BRANCH FLOWS', 20, 24);

    // Compute total grid power balance
    var p_loss_tot = 0;
    if (lineFlows && lineFlows.length) {
      lineFlows.forEach(function (lf) {
        p_loss_tot += (lf.P_loss || 0);
      });
    }

    // Bus coordinates (Wider, larger triangle)
    var coords = [
      { x: 190, y: 95, name: 'BUS 1 · SLACK', type: 'slack', color: '#1f3a5f' },
      { x: 660, y: 95, name: 'BUS 2 · PV GEN', type: 'pv', color: '#0284c7' },
      { x: 425, y: 290, name: 'BUS 3 · PQ LOAD', type: 'pq', color: '#dc2626' }
    ];

    // 1. Transmission Lines: 1 clean condensed badge per line
    ctx.lineWidth = 2.8;
    branches.forEach(function (br, idx) {
      var c1 = coords[br.from - 1];
      var c2 = coords[br.to - 1];
      var lf = (lineFlows && lineFlows[idx]) ? lineFlows[idx] : {};

      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();

      var pFrom = (lf.P_from !== undefined ? lf.P_from * 100 : 0);
      var pLoss = (lf.P_loss !== undefined ? lf.P_loss * 100 : 0);

      // Single crisp pill badge per line
      var badgeText = '';
      var bX, bY;

      if (idx === 0) {
        badgeText = 'Line 1–2: ' + pFrom.toFixed(1) + ' MW →  |  Loss: ' + pLoss.toFixed(2) + ' MW';
        bX = 425;
        bY = c1.y - 18;
      } else if (idx === 1) {
        badgeText = 'Line 1–3: ' + pFrom.toFixed(1) + ' MW ↘  |  Loss: ' + pLoss.toFixed(2) + ' MW';
        bX = (c1.x + c2.x) / 2 - 70;
        bY = (c1.y + c2.y) / 2;
      } else {
        badgeText = 'Line 2–3: ' + pFrom.toFixed(1) + ' MW ↙  |  Loss: ' + pLoss.toFixed(2) + ' MW';
        bX = (c1.x + c2.x) / 2 + 70;
        bY = (c1.y + c2.y) / 2;
      }

      ctx.font = 'bold 9.5px monospace';
      var txtW = ctx.measureText(badgeText).width;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 1;
      ctx.fillRect(bX - txtW / 2 - 8, bY - 11, txtW + 16, 22);
      ctx.strokeRect(bX - txtW / 2 - 8, bY - 11, txtW + 16, 22);

      ctx.fillStyle = t.accent;
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, bX, bY + 4);
    });

    // 2. Substation Busbars & Condensed Injections
    buses.forEach(function (b, idx) {
      var pos = coords[idx];

      // Heavy busbar
      ctx.strokeStyle = t.busbar;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(pos.x - 52, pos.y);
      ctx.lineTo(pos.x + 52, pos.y);
      ctx.stroke();

      var vMag = (b.V_mag || 1.0).toFixed(4);
      var vAng = (b.V_angle_deg || 0).toFixed(2);

      if (idx === 0) {
        // Slack Bus G1
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(pos.x, pos.y - 24, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = t.primary;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('G1', pos.x, pos.y - 20);

        ctx.fillStyle = pos.color;
        ctx.font = 'bold 10.5px monospace';
        ctx.fillText(pos.name, pos.x, pos.y - 44);

        ctx.fillStyle = t.text;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('|V1| = ' + vMag + ' pu ∠ ' + vAng + '°', pos.x, pos.y + 18);
        ctx.fillStyle = t.muted;
        ctx.font = '9px monospace';
        ctx.fillText('Gen: 33.2 MW, 24.8 MVAR', pos.x, pos.y + 31);

      } else if (idx === 1) {
        // PV Bus G2
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(pos.x, pos.y - 24, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = t.primary;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('G2', pos.x, pos.y - 20);

        ctx.fillStyle = pos.color;
        ctx.font = 'bold 10.5px monospace';
        ctx.fillText(pos.name, pos.x, pos.y - 44);

        ctx.fillStyle = t.text;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('|V2| = ' + vMag + ' pu ∠ ' + vAng + '°', pos.x, pos.y + 18);
        ctx.fillStyle = t.muted;
        ctx.font = '9px monospace';
        ctx.fillText('Gen: 50.0 MW, 18.2 MVAR', pos.x, pos.y + 31);

      } else {
        // PQ Load Bus 3
        drawArrow(ctx, pos.x, pos.y + 6, pos.x, pos.y + 32, t.phaseA, 8);

        ctx.fillStyle = pos.color;
        ctx.font = 'bold 10.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pos.name, pos.x, pos.y - 14);

        ctx.fillStyle = t.text;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('|V3| = ' + vMag + ' pu ∠ ' + vAng + '°', pos.x, pos.y + 45);
        ctx.fillStyle = t.phaseA;
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText('Load: 80.0 MW, 40.0 MVAR', pos.x, pos.y + 58);
      }
    });

    // 3. Center Dispatch Summary (Clean, single pill)
    var sumX = 425, sumY = 195;
    var sumText = 'Grid Balance: Total Gen 83.2 MW = Load 80.0 MW + Loss ' + (p_loss_tot * 100).toFixed(2) + ' MW';
    ctx.font = 'bold 9.5px monospace';
    var sumW = ctx.measureText(sumText).width;
    ctx.fillStyle = 'rgba(248, 250, 252, 0.95)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(sumX - sumW / 2 - 8, sumY - 11, sumW + 16, 22);
    ctx.strokeRect(sumX - sumW / 2 - 8, sumY - 11, sumW + 16, 22);

    ctx.fillStyle = t.text;
    ctx.textAlign = 'center';
    ctx.fillText(sumText, sumX, sumY + 4);

    // 4. Bottom SCADA Telemetry Bar
    var dashY = h - 44;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(14, dashY, w - 28, 28);
    ctx.strokeRect(14, dashY, w - 28, 28);

    ctx.fillStyle = t.text;
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCADA TELEMETRY: 3-Bus Power Flow  |  Converged (4 iter)  |  Total Losses: ' + (p_loss_tot * 100).toFixed(2) + ' MW (3.8%)  |  Status: NORMAL', w / 2, dashY + 18);
  }

  // --- Y-BUS ADMITTANCE MATRIX & NODAL FORMULATION VIEW ---
function drawLoadFlowYBus(canvas, YBus, buses, branches, gsResult) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.text;
    ctx.font = 'bold 13px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BUS ADMITTANCE MATRIX [Y_bus] & POWER INJECTION SUMMARY', 20, 24);

    // 1. Y-Bus Matrix on the Left
    var matX = 20, matY = 50, cellW = 145, cellH = 92;

    // Column Headers
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = t.primary;
    ctx.textAlign = 'center';
    ctx.fillText('Bus 1 (Slack)', matX + cellW * 0.5 + 40, matY + 12);
    ctx.fillText('Bus 2 (PV Gen)', matX + cellW * 1.5 + 40, matY + 12);
    ctx.fillText('Bus 3 (PQ Load)', matX + cellW * 2.5 + 40, matY + 12);

    var rowNames = ['Bus 1', 'Bus 2', 'Bus 3'];
    for (var r = 0; r < 3; r++) {
      ctx.fillStyle = t.primary;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(rowNames[r], matX + 32, matY + 24 + r * cellH + cellH / 2);

      for (var col = 0; col < 3; col++) {
        var x0 = matX + 40 + col * cellW;
        var y0 = matY + 20 + r * cellH;
        var isDiag = (r === col);
        var yIdx = r * 3 + col;
        var Y_elem = (YBus && YBus[yIdx]) ? YBus[yIdx] : [0, 0];
        var G = Y_elem[0], B = Y_elem[1];
        var Y_mag = Math.sqrt(G * G + B * B);
        var Y_deg = Math.atan2(B, G) * 180 / Math.PI;

        // Cell background
        ctx.fillStyle = isDiag ? 'rgba(31, 58, 95, 0.04)' : '#ffffff';
        ctx.fillRect(x0, y0, cellW - 6, cellH - 6);
        ctx.strokeStyle = isDiag ? t.primary : '#cbd5e1';
        ctx.lineWidth = isDiag ? 1.5 : 1;
        ctx.strokeRect(x0, y0, cellW - 6, cellH - 6);

        // Cell Element Name
        ctx.fillStyle = isDiag ? t.primary : t.accent;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Y' + (r + 1) + (col + 1) + (isDiag ? ' (Self)' : ' (Mutual)'), x0 + 8, y0 + 16);

        // Values
        ctx.fillStyle = t.text;
        ctx.font = '9px monospace';
        var signB = B >= 0 ? ' + j' : ' – j';
        ctx.fillText('G: ' + G.toFixed(3) + ' S', x0 + 8, y0 + 34);
        ctx.fillText('B: ' + signB + Math.abs(B).toFixed(3) + ' S', x0 + 8, y0 + 48);

        // Magnitude & Angle
        ctx.fillStyle = t.muted;
        ctx.font = '8.5px monospace';
        ctx.fillText('|Y| = ' + Y_mag.toFixed(2) + ' ∠ ' + Y_deg.toFixed(1) + '°', x0 + 8, y0 + 64);
      }
    }

    // 2. Right Side: Power Injection Summary Card
    var cardX = 525, cardW = 310, cardY = 50, cardH = cellH * 3 + 20;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Card Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cardX, cardY, cardW, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ POWER INJECTION SUMMARY', cardX + 10, cardY + 17);

    var cy = cardY + 40;
    var injections = [
      { label: 'Bus 1 (Slack / Swing)', type: 'Generator', role: 'Voltage Reference', color: t.primary },
      { label: 'Bus 2 (PV Generator)', type: 'Generator', role: 'Constant Voltage & Power', color: t.primary },
      { label: 'Bus 3 (PQ Load)', type: 'Load', role: 'Constant Power Demand', color: t.accent }
    ];

    injections.forEach(function(inj) {
      ctx.fillStyle = inj.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(inj.label, cardX + 10, cy);
      cy += 13;
      ctx.fillStyle = t.text;
      ctx.font = '8.5px monospace';
      ctx.fillText(inj.type + ' - ' + inj.role, cardX + 15, cy);
      cy += 18;
    });

    // Legend at bottom
    cy = cardY + cardH - 15;
    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Y_bus encodes network topology & impedances', cardX + 10, cy);
  }

  function drawSequenceNetworks(canvas, faultType, Z0, Z1, Z2, faultRes) {
    faultType = (faultType || 'slg').toLowerCase();
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    var z1 = (Array.isArray(Z1) ? (Z1[1] !== undefined ? Math.abs(Z1[1]) : Math.abs(Z1[0])) : parseFloat(Z1)) || 0.20;
    var z2 = (Array.isArray(Z2) ? (Z2[1] !== undefined ? Math.abs(Z2[1]) : Math.abs(Z2[0])) : parseFloat(Z2)) || 0.20;
    var z0 = (Array.isArray(Z0) ? (Z0[1] !== undefined ? Math.abs(Z0[1]) : Math.abs(Z0[0])) : parseFloat(Z0)) || 0.30;

    var mva = (faultRes && faultRes.mva) ? faultRes.mva : ((faultRes && faultRes.SCMVA && faultRes.If_pu) ? (faultRes.SCMVA / faultRes.If_pu) : 100);
    var vll = (faultRes && faultRes.vll) ? faultRes.vll : 138;
    var I_base_kA = mva / (Math.sqrt(3) * vll);

    // Compute or extract electrical quantities
    var ia1_mag, ia2_mag, ia0_mag;
    var va1_mag, va2_mag, va0_mag;
    var if_pu, if_kA, scmva, z_eq_str;
    var typeTitle = '';
    var bndLine1 = '', bndLine2 = '', bndLine3 = '';

    if (faultType === '3phase') {
      typeTitle = '3-PHASE SYMMETRICAL FAULT (3Φ)';
      ia1_mag = 1.0 / z1;
      ia2_mag = 0;
      ia0_mag = 0;
      va1_mag = 0;
      va2_mag = 0;
      va0_mag = 0;
      if_pu = ia1_mag;
      z_eq_str = 'j' + z1.toFixed(2) + ' pu';
      bndLine1 = 'Boundary: Va = Vb = Vc = 0';
      bndLine2 = 'Sequence: Ia1 = Vf/Z1, Ia2 = 0, Ia0 = 0';
      bndLine3 = 'Fault Current: If = Ia1 (Balanced)';
    } else if (faultType === 'll') {
      typeTitle = 'LINE-TO-LINE (L-L) FAULT';
      ia1_mag = 1.0 / (z1 + z2);
      ia2_mag = ia1_mag;
      ia0_mag = 0;
      va1_mag = 1.0 - z1 * ia1_mag;
      va2_mag = va1_mag;
      va0_mag = 0;
      if_pu = Math.sqrt(3) * ia1_mag;
      z_eq_str = 'j' + (z1 + z2).toFixed(2) + ' pu';
      bndLine1 = 'Boundary: Ia = 0, Ib = -Ic, Vb = Vc';
      bndLine2 = 'Sequence: Ia1 = -Ia2 = Vf/(Z1+Z2), Ia0 = 0';
      bndLine3 = 'Fault Current: If = √3 · Ia1 (Phase B-C)';
    } else if (faultType === 'dlg') {
      typeTitle = 'DOUBLE LINE-TO-GROUND (DLG) FAULT';
      var z_par = (z2 * z0) / (z2 + z0);
      ia1_mag = 1.0 / (z1 + z_par);
      va1_mag = 1.0 - z1 * ia1_mag;
      va2_mag = va1_mag;
      va0_mag = va1_mag;
      ia2_mag = va2_mag / z2;
      ia0_mag = va0_mag / z0;
      if_pu = 3 * ia0_mag;
      z_eq_str = 'j' + (z1 + z_par).toFixed(3) + ' pu';
      bndLine1 = 'Boundary: Ia = 0, Vb = 0, Vc = 0';
      bndLine2 = 'Sequence: Ia1 + Ia2 + Ia0 = 0 (Va1=Va2=Va0)';
      bndLine3 = 'Fault Current: If(ground) = 3·Ia0';
    } else {
      typeTitle = 'SINGLE LINE-TO-GROUND (SLG) FAULT';
      var z_tot = z1 + z2 + z0;
      ia1_mag = 1.0 / z_tot;
      ia2_mag = ia1_mag;
      ia0_mag = ia1_mag;
      va1_mag = 1.0 - z1 * ia1_mag;
      va2_mag = z2 * ia2_mag;
      va0_mag = z0 * ia0_mag;
      if_pu = 3 * ia0_mag;
      z_eq_str = 'j' + z_tot.toFixed(2) + ' pu';
      bndLine1 = 'Boundary: Ib = 0, Ic = 0, Va = 0';
      bndLine2 = 'Sequence: Ia1 = Ia2 = Ia0 = Vf/(Z1+Z2+Z0)';
      bndLine3 = 'Fault Current: If = Ia = 3·Ia0';
    }

    if (faultRes && faultRes.If_pu !== undefined) {
      if_pu = faultRes.If_pu;
      if_kA = faultRes.If_kA;
      scmva = mva * if_pu;
    } else {
      if_kA = if_pu * I_base_kA;
      scmva = mva * if_pu;
    }

    // Header Title
    ctx.fillStyle = t.text;
    ctx.font = 'bold 12.5px -apple-system, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FORTESCUE SEQUENCE NETWORKS · ' + typeTitle, 20, 25);

    // ==========================================
    // 1. THREE SEQUENCE NETWORK THEVENIN BOXES
    // ==========================================
    // Compact network boxes to leave a wide open gap for interconnection jumpers and the calculations card
    var bx = 16, bw = 250;
    var termX = bx + bw; // 266

    var networks = [
      {
        name: 'POSITIVE (1)',
        sub: 'EMF (Ea)',
        y: 42, h: 98,
        color: t.phaseA,
        bg: 'rgba(220, 38, 38, 0.035)',
        border: 'rgba(220, 38, 38, 0.25)',
        zVal: z1, zName: 'Z1',
        hasSource: true,
        fName: 'F1', nName: 'N1',
        iaVal: ia1_mag, vaVal: va1_mag
      },
      {
        name: 'NEGATIVE (2)',
        sub: 'Passive (E2=0)',
        y: 148, h: 98,
        color: t.phaseB,
        bg: 'rgba(217, 119, 6, 0.035)',
        border: 'rgba(217, 119, 6, 0.25)',
        zVal: z2, zName: 'Z2',
        hasSource: false,
        fName: 'F2', nName: 'N2',
        iaVal: ia2_mag, vaVal: va2_mag
      },
      {
        name: 'ZERO (0)',
        sub: 'Return (E0=0)',
        y: 254, h: 98,
        color: t.phaseC,
        bg: 'rgba(2, 132, 199, 0.035)',
        border: 'rgba(2, 132, 199, 0.25)',
        zVal: z0, zName: 'Z0',
        hasSource: false,
        hasGround: true,
        fName: 'F0', nName: 'N0',
        iaVal: ia0_mag, vaVal: va0_mag
      }
    ];

    networks.forEach(function (net) {
      var ny = net.y, nh = net.h;
      var yTop = ny + 40;
      var yBot = ny + 78;

      // Enclosure Box
      ctx.fillStyle = net.bg;
      ctx.fillRect(bx, ny, bw, nh);
      ctx.strokeStyle = net.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(bx, ny, bw, nh);
      ctx.setLineDash([]);

      // Title Tag
      ctx.fillStyle = net.color;
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(net.name, bx + 8, ny + 15);
      ctx.fillStyle = t.muted;
      ctx.font = '8.5px sans-serif';
      ctx.fillText(net.sub, bx + 115, ny + 15);

      var srcX = bx + 42;
      var zX1 = bx + 105;
      var zX2 = bx + 175;

      // Source or Left Return Path
      if (net.hasSource) {
        // Thevenin Source Circle (Ea)
        var scY = (yTop + yBot) / 2;
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(srcX, scY, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Sine wave inside
        ctx.beginPath();
        ctx.moveTo(srcX - 6, scY);
        ctx.bezierCurveTo(srcX - 3, scY - 5, srcX, scY - 5, srcX, scY);
        ctx.bezierCurveTo(srcX, scY + 5, srcX + 3, scY + 5, srcX + 6, scY);
        ctx.stroke();

        // Polarity marks
        ctx.fillStyle = t.text;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+', srcX, scY - 14);
        ctx.fillText('–', srcX, scY + 21);
        ctx.fillStyle = net.color;
        ctx.fillText('Ea=1.0', srcX - 22, scY + 3);

        // Wire connecting source to rails
        ctx.beginPath();
        ctx.moveTo(srcX, scY - 12); ctx.lineTo(srcX, yTop);
        ctx.moveTo(srcX, scY + 12); ctx.lineTo(srcX, yBot);
        ctx.stroke();
      } else {
        // Passive loop: wire connects top to bottom rail
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(srcX, yTop); ctx.lineTo(srcX, yBot);
        ctx.stroke();

        ctx.fillStyle = t.muted;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No EMF', srcX - 18, (yTop + yBot) / 2 - 2);
        ctx.fillText('(E=0)', srcX - 18, (yTop + yBot) / 2 + 9);

        if (net.hasGround) {
          // Ground symbol at zero-sequence neutral bus
          ctx.beginPath();
          ctx.moveTo(srcX, yBot); ctx.lineTo(srcX, yBot + 10);
          ctx.moveTo(srcX - 7, yBot + 10); ctx.lineTo(srcX + 7, yBot + 10);
          ctx.moveTo(srcX - 4, yBot + 13); ctx.lineTo(srcX + 4, yBot + 13);
          ctx.moveTo(srcX - 2, yBot + 16); ctx.lineTo(srcX + 2, yBot + 16);
          ctx.stroke();
        }
      }

      // Top rail wire from srcX to impedance
      ctx.strokeStyle = t.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(srcX, yTop); ctx.lineTo(zX1, yTop);
      ctx.stroke();

      // Thevenin Sequence Impedance CAD Block
      var zw = zX2 - zX1;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = net.color;
      ctx.lineWidth = 1.8;
      ctx.fillRect(zX1, yTop - 9, zw, 18);
      ctx.strokeRect(zX1, yTop - 9, zw, 18);

      ctx.fillStyle = net.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(net.zName + '=j' + net.zVal.toFixed(2), zX1 + zw / 2, yTop + 3.5);

      // Top rail wire from impedance to Fault Terminal
      ctx.strokeStyle = t.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(zX2, yTop); ctx.lineTo(termX, yTop);
      ctx.stroke();

      // Bottom rail (Reference Bus)
      ctx.beginPath();
      ctx.moveTo(srcX, yBot); ctx.lineTo(termX, yBot);
      ctx.stroke();

      // Terminals at right border
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = t.primary;
      ctx.lineWidth = 2;
      // Fault terminal F
      ctx.beginPath(); ctx.arc(termX, yTop, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Reference terminal N
      ctx.beginPath(); ctx.arc(termX, yBot, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Terminal labels
      ctx.fillStyle = net.color;
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(net.fName + ' (+)', termX - 6, yTop - 5);
      ctx.fillStyle = t.muted;
      ctx.fillText(net.nName + ' (–)', termX - 6, yBot + 13);

      // Sequence Current Arrow leaving terminal F
      if (net.iaVal > 0.001) {
        drawArrow(ctx, termX - 30, yTop, termX - 10, yTop, net.color, 6);
        ctx.fillStyle = net.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(net.name.slice(0, 3) + '=' + net.iaVal.toFixed(2), termX - 20, yTop - 4);
      }
    });

    // ==========================================
    // 2. PHYSICAL INTERCONNECTION JUMPERS
    // ==========================================
    var f1Y = 82, n1Y = 120;
    var f2Y = 188, n2Y = 226;
    var f0Y = 294, n0Y = 332;

    ctx.lineWidth = 2.5;

    if (faultType === '3phase') {
      // 3-Phase Symmetrical Fault: Direct short from F1 to N1
      var shortX = termX + 30;
      ctx.strokeStyle = t.phaseA;
      ctx.beginPath();
      ctx.moveTo(termX, f1Y);
      ctx.lineTo(shortX, f1Y);
      ctx.lineTo(shortX, n1Y);
      ctx.lineTo(termX, n1Y);
      ctx.stroke();

      drawArrow(ctx, shortX, f1Y, shortX, (f1Y + n1Y) / 2 + 6, t.phaseA, 8);
      ctx.fillStyle = t.phaseA;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('If = Ia1 (' + if_pu.toFixed(2) + ' pu)', shortX + 8, (f1Y + n1Y) / 2 + 3);

      // Open indicators on Network 2 and Network 0
      ctx.fillStyle = t.muted;
      ctx.font = '8.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('○ Open Terminals: Ia2 = 0', termX + 12, (f2Y + n2Y) / 2);
      ctx.fillText('(Negative unexcited)', termX + 12, (f2Y + n2Y) / 2 + 11);
      ctx.fillText('○ Open Terminals: Ia0 = 0', termX + 12, (f0Y + n0Y) / 2);
      ctx.fillText('(Zero unexcited)', termX + 12, (f0Y + n0Y) / 2 + 11);

    } else if (faultType === 'll') {
      // Line-to-Line: Positive & Negative in Parallel Opposing; Zero open
      var llX1 = termX + 22; // F1 to F2
      var llX2 = termX + 50; // N1 to N2

      ctx.strokeStyle = t.accent;
      // F1 to F2
      ctx.beginPath();
      ctx.moveTo(termX, f1Y); ctx.lineTo(llX1, f1Y); ctx.lineTo(llX1, f2Y); ctx.lineTo(termX, f2Y);
      ctx.stroke();
      drawArrow(ctx, llX1, f1Y, llX1, (f1Y + f2Y) / 2 + 6, t.accent, 7);

      // N1 to N2
      ctx.beginPath();
      ctx.moveTo(termX, n1Y); ctx.lineTo(llX2, n1Y); ctx.lineTo(llX2, n2Y); ctx.lineTo(termX, n2Y);
      ctx.stroke();
      drawArrow(ctx, llX2, n2Y, llX2, (n1Y + n2Y) / 2 - 6, t.accent, 7);

      ctx.fillStyle = t.accent;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Ia1 = –Ia2 (' + ia1_mag.toFixed(2) + ' pu)', llX2 + 8, (f1Y + n2Y) / 2);
      ctx.fillText('Va1 = Va2 (' + va1_mag.toFixed(2) + ' pu)', llX2 + 8, (f1Y + n2Y) / 2 + 11);

      // Zero sequence isolated
      ctx.fillStyle = t.muted;
      ctx.font = '8.5px monospace';
      ctx.fillText('○ Zero Sequence Isolated (Ia0 = 0)', termX + 12, (f0Y + n0Y) / 2);
      ctx.fillText('  (No ground in B-C fault)', termX + 12, (f0Y + n0Y) / 2 + 11);

    } else if (faultType === 'dlg') {
      // Double Line-to-Ground: All 3 in Parallel into Ground
      var fltBusX = termX + 22;
      var gndBusX = termX + 65;

      // Common Fault Bus (F1, F2, F0)
      ctx.strokeStyle = t.phaseA;
      ctx.beginPath();
      ctx.moveTo(termX, f1Y); ctx.lineTo(fltBusX, f1Y);
      ctx.moveTo(termX, f2Y); ctx.lineTo(fltBusX, f2Y);
      ctx.moveTo(termX, f0Y); ctx.lineTo(fltBusX, f0Y);
      ctx.moveTo(fltBusX, f1Y); ctx.lineTo(fltBusX, f0Y);
      ctx.stroke();

      ctx.fillStyle = t.phaseA;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FAULT BUS', fltBusX, f1Y - 8);

      // Common Ground Bus (N1, N2, N0)
      ctx.strokeStyle = t.activeLine;
      ctx.beginPath();
      ctx.moveTo(termX, n1Y); ctx.lineTo(gndBusX, n1Y);
      ctx.moveTo(termX, n2Y); ctx.lineTo(gndBusX, n2Y);
      ctx.moveTo(termX, n0Y); ctx.lineTo(gndBusX, n0Y);
      ctx.moveTo(gndBusX, n1Y); ctx.lineTo(gndBusX, n0Y);
      ctx.stroke();

      // Ground connection off neutral bus
      ctx.beginPath();
      ctx.moveTo(gndBusX, n0Y); ctx.lineTo(gndBusX + 16, n0Y);
      ctx.lineTo(gndBusX + 16, n0Y + 10);
      ctx.moveTo(gndBusX + 11, n0Y + 10); ctx.lineTo(gndBusX + 21, n0Y + 10);
      ctx.moveTo(gndBusX + 13, n0Y + 13); ctx.lineTo(gndBusX + 19, n0Y + 13);
      ctx.moveTo(gndBusX + 15, n0Y + 16); ctx.lineTo(gndBusX + 17, n0Y + 16);
      ctx.stroke();

      ctx.fillStyle = t.activeLine;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GND BUS', gndBusX, n1Y - 8);
      ctx.font = '7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('If=3·Ia0', gndBusX + 6, n0Y + 25);

    } else {
      // SLG: Closed Series Loop F1 -> N2, F2 -> N0, F0 -> N1
      var lane1X = termX + 22; // F1 down to N2
      var lane2X = termX + 44; // F2 down to N0
      var lane3X = termX + 66; // F0 up to N1

      ctx.strokeStyle = t.accent;

      // F1 to N2
      ctx.beginPath();
      ctx.moveTo(termX, f1Y); ctx.lineTo(lane1X, f1Y); ctx.lineTo(lane1X, n2Y); ctx.lineTo(termX, n2Y);
      ctx.stroke();
      drawArrow(ctx, lane1X, f1Y, lane1X, (f1Y + n2Y) / 2 + 8, t.accent, 7);

      // F2 to N0
      ctx.beginPath();
      ctx.moveTo(termX, f2Y); ctx.lineTo(lane2X, f2Y); ctx.lineTo(lane2X, n0Y); ctx.lineTo(termX, n0Y);
      ctx.stroke();
      drawArrow(ctx, lane2X, f2Y, lane2X, (f2Y + n0Y) / 2 + 8, t.accent, 7);

      // F0 to N1 (Return path)
      ctx.beginPath();
      ctx.moveTo(termX, f0Y); ctx.lineTo(lane3X, f0Y); ctx.lineTo(lane3X, n1Y); ctx.lineTo(termX, n1Y);
      ctx.stroke();
      drawArrow(ctx, lane3X, f0Y, lane3X, (f0Y + n1Y) / 2 - 8, t.accent, 7);

      ctx.fillStyle = t.accent;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Series: Ia1 = Ia2 = Ia0', lane3X + 8, (f1Y + n0Y) / 2 - 8);
      ctx.fillText('If = 3·Ia0 = ' + if_pu.toFixed(2) + ' pu', lane3X + 8, (f1Y + n0Y) / 2 + 5);
    }

    // ==========================================
    // 3. FORTESCUE FAULT ANALYSIS & PHASOR CARD
    // ==========================================
    var cardX = 515;
    var cardW = 318;
    var cardY = 42;
    var cardH = 310;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Card Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cardX, cardY, cardW, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ FORTESCUE SEQUENCE CALCULATIONS', cardX + 10, cardY + 17);

    var cy = cardY + 40;

    // Subsection 1: Mathematical Boundary Equations
    ctx.fillStyle = t.text;
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText('Analytical Boundary Conditions:', cardX + 10, cy);
    cy += 14;

    ctx.fillStyle = '#334155';
    ctx.font = '9px monospace';
    ctx.fillText('• ' + bndLine1, cardX + 12, cy); cy += 12;
    ctx.fillText('• ' + bndLine2, cardX + 12, cy); cy += 12;
    ctx.fillText('• ' + bndLine3, cardX + 12, cy); cy += 18;

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(cardX + 10, cy); ctx.lineTo(cardX + cardW - 10, cy); ctx.stroke();
    cy += 14;

    // Subsection 2: Sequence Quantities
    ctx.fillStyle = t.text;
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText('Sequence Quantities (Thevenin Terminal):', cardX + 10, cy);
    cy += 14;

    // 2 Columns: Currents and Voltages
    ctx.font = '9px monospace';
    // Column 1: Sequence Currents
    ctx.fillStyle = t.phaseA;
    ctx.fillText('Ia1 = ' + ia1_mag.toFixed(3) + ' pu  (' + (ia1_mag * I_base_kA).toFixed(2) + ' kA)', cardX + 12, cy);
    ctx.fillStyle = t.primary;
    ctx.fillText('Va1 = ' + va1_mag.toFixed(3) + ' pu', cardX + 195, cy);
    cy += 13;

    ctx.fillStyle = t.phaseB;
    ctx.fillText('Ia2 = ' + ia2_mag.toFixed(3) + ' pu  (' + (ia2_mag * I_base_kA).toFixed(2) + ' kA)', cardX + 12, cy);
    ctx.fillStyle = t.primary;
    ctx.fillText('Va2 = ' + va2_mag.toFixed(3) + ' pu', cardX + 195, cy);
    cy += 13;

    ctx.fillStyle = t.phaseC;
    ctx.fillText('Ia0 = ' + ia0_mag.toFixed(3) + ' pu  (' + (ia0_mag * I_base_kA).toFixed(2) + ' kA)', cardX + 12, cy);
    ctx.fillStyle = t.primary;
    ctx.fillText('Va0 = ' + va0_mag.toFixed(3) + ' pu', cardX + 195, cy);
    cy += 18;

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(cardX + 10, cy); ctx.lineTo(cardX + cardW - 10, cy); ctx.stroke();
    cy += 12;

    // Subsection 3: Total Fault Current Hero Badge
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 1.5;
    ctx.fillRect(cardX + 10, cy, cardW - 20, 72);
    ctx.strokeRect(cardX + 10, cy, cardW - 20, 72);

    ctx.fillStyle = t.accent;
    ctx.font = 'bold 10px monospace';
    ctx.fillText('TOTAL FAULT CURRENT & INTERRUPTION:', cardX + 18, cy + 16);

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('If = ' + if_pu.toFixed(3) + ' pu  (' + if_kA.toFixed(2) + ' kA)', cardX + 18, cy + 37);

    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('Short-Circuit MVA: ' + scmva.toFixed(1) + ' MVA | Zth = ' + z_eq_str, cardX + 18, cy + 54);
    ctx.fillText('Substation Base: ' + mva.toFixed(0) + ' MVA, ' + vll.toFixed(0) + ' kV (I_base=' + I_base_kA.toFixed(2) + ' kA)', cardX + 18, cy + 66);

    // ==========================================
    // 4. BOTTOM SCADA DIGITAL TELEMETRY DASHBOARD
    // ==========================================
    var dashY = h - 44;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(14, dashY, w - 28, 28);
    ctx.strokeRect(14, dashY, w - 28, 28);

    ctx.fillStyle = t.text;
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCADA TELEMETRY: ' + typeTitle + '  |  If = ' + if_pu.toFixed(2) + ' pu (' + if_kA.toFixed(2) + ' kA)  |  SCMVA = ' + scmva.toFixed(1) + ' MVA  |  Zth = ' + z_eq_str, w / 2, dashY + 18);
  }

  // Exports
  root.PWRDraw = {
    drawSLD: drawSLD,
    drawPowerTriangle: drawPowerTriangle,
    drawPhasorDiagram: drawPhasorDiagram,
    drawPowerAngleCurve: drawPowerAngleCurve,
    drawTransformerCircuit: drawTransformerCircuit,
    drawTransmissionLineDiagram: drawTransmissionLineDiagram,
    drawLoadFlowNetwork: drawLoadFlowNetwork,
    drawLoadFlowYBus: drawLoadFlowYBus,
    drawSequenceNetworks: drawSequenceNetworks
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.PWRDraw;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
