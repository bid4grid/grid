/**
 * Distribution Systems CAD - Vector & Canvas Diagram Engine (dist-draw.js)
 * Clean, high-precision electrical engineering CAD schematics:
 * - Pure white CAD background with subtle grid
 * - Slender, realistic pole framing & hardware
 * - Light, modern padmount dual-compartment CAD
 * - Light-themed SCADA telemetry dashboard bars
 */
(function (root) {
  'use strict';

  var THEME = {
    bg: '#ffffff',
    grid: 'rgba(0,0,0,0.05)',
    primary: '#1f3a5f',
    accent: '#e07a3f',
    text: '#1e293b',
    muted: '#475569',
    busbar: '#0f172a',
    phaseA: '#dc2626',
    phaseB: '#d97706',
    phaseC: '#0284c7',
    ground: '#475569',
    activeLine: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    cadBlue: '#0284c7',
    textBlue: '#075985',
    transPurple: '#7c3aed'
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

  function drawTransformerSymbol(ctx, cx, cy, r, color) {
    ctx.strokeStyle = color || THEME.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.55, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawGroundSymbol(ctx, x, y, len) {
    len = len || 14;
    ctx.strokeStyle = THEME.ground;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - len / 2, y + 8);
    ctx.lineTo(x + len / 2, y + 8);
    ctx.moveTo(x - len / 3, y + 12);
    ctx.lineTo(x + len / 3, y + 12);
    ctx.moveTo(x - len / 6, y + 16);
    ctx.lineTo(x + len / 6, y + 16);
    ctx.stroke();
  }

  function drawTelemetryBar(ctx, w, h, text) {
    var dashY = h - 38;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(16, dashY, w - 32, 26);
    ctx.strokeRect(16, dashY, w - 32, 26);

    ctx.fillStyle = THEME.text;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, dashY + 17);
  }

  // ==========================================
  // 1. IEEE COMPLETE VOLTAGE CASCADE SLD (ETAP/SCADA CAD)
  // Pure white CAD layout with 4 subtle voltage zones, IEEE symbols,
  // vertical busbars, transformers, reclosers, and customer service.
  // ==========================================
  function drawGridCascade(canvas, cascade, activeNode, activeApparatus) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    // Header Title
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('IEEE COMPLETE VOLTAGE CASCADE SINGLE LINE DIAGRAM (IEEE STD 315 / IEC 60617)', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Voltage Path: Generation (' + cascade.gen.voltage_kV + 'kV) → GSU → Transmission (' + cascade.gsu.secondary_kV + 'kV) → Substation (' + cascade.substation.bus_kV + 'kV) → Service (' + cascade.distTransformer.service_label + ')', 20, 38);

    // ==========================================
    // FOUR SUBTLE VOLTAGE ZONE BANDS (Clean, Light, No Dark Fills)
    // ==========================================
    var zoneY = 48;
    var zoneH = 265;

    // Zone 1: Generation & GSU
    var z1X = 16, z1W = 160;
    ctx.fillStyle = 'rgba(31, 58, 95, 0.02)';
    ctx.fillRect(z1X, zoneY, z1W, zoneH);
    ctx.strokeStyle = 'rgba(31, 58, 95, 0.18)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(z1X, zoneY, z1W, zoneH);
    ctx.setLineDash([]);
    ctx.fillStyle = t.primary;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('ZONE 1: GEN (' + cascade.gen.voltage_kV + ' kV)', z1X + 8, zoneY + 14);

    // Zone 2: HV Transmission (230 kV)
    var z2X = z1X + z1W + 6, z2W = 195;
    ctx.fillStyle = 'rgba(124, 58, 237, 0.02)';
    ctx.fillRect(z2X, zoneY, z2W, zoneH);
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(z2X, zoneY, z2W, zoneH);
    ctx.setLineDash([]);
    ctx.fillStyle = t.transPurple;
    ctx.fillText('ZONE 2: TRANS (' + cascade.gsu.secondary_kV + ' kV)', z2X + 8, zoneY + 14);

    // Zone 3: Primary Distribution (13.2 kV)
    var z3X = z2X + z2W + 6, z3W = 240;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.02)';
    ctx.fillRect(z3X, zoneY, z3W, zoneH);
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(z3X, zoneY, z3W, zoneH);
    ctx.setLineDash([]);
    ctx.fillStyle = t.textBlue;
    ctx.fillText('ZONE 3: PRIMARY (' + cascade.substation.bus_kV + ' kV)', z3X + 8, zoneY + 14);

    // Zone 4: Utilization (120/240 V)
    var z4X = z3X + z3W + 6, z4W = w - z4X - 16;
    ctx.fillStyle = 'rgba(22, 163, 74, 0.02)';
    ctx.fillRect(z4X, zoneY, z4W, zoneH);
    ctx.strokeStyle = 'rgba(22, 163, 74, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(z4X, zoneY, z4W, zoneH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#15803d';
    ctx.fillText('ZONE 4: CUSTOMER', z4X + 8, zoneY + 14);

    var y = 175; // Main horizontal power flow axis

    // ==========================================
    // ZONE 1: GENERATOR G1 & STEP-UP GSU
    // ==========================================
    // Generator G1 Circle
    var genX = z1X + 38;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(genX, y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Internal smooth sine wave
    ctx.beginPath();
    ctx.moveTo(genX - 9, y);
    ctx.bezierCurveTo(genX - 4.5, y - 8, genX, y - 8, genX, y);
    ctx.bezierCurveTo(genX, y + 8, genX + 4.5, y + 8, genX + 9, y);
    ctx.stroke();

    ctx.fillStyle = t.primary;
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('G1 Gen', genX, y - 24);
    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.fillText(cascade.gen.voltage_kV + ' kV (' + cascade.gen.power_MVA + 'MVA)', genX, y + 30);
    ctx.fillText(cascade.gen.current_kA.toFixed(1) + ' kA', genX, y + 42);

    // Wire to Circuit Breaker CB-1
    var cb1X = z1X + 78;
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(genX + 18, y);
    ctx.lineTo(cb1X - 7, y);
    ctx.stroke();

    // Circuit Breaker [X]
    ctx.strokeRect(cb1X - 7, y - 7, 14, 14);
    ctx.beginPath();
    ctx.moveTo(cb1X - 5, y - 5); ctx.lineTo(cb1X + 5, y + 5);
    ctx.moveTo(cb1X + 5, y - 5); ctx.lineTo(cb1X - 5, y + 5);
    ctx.stroke();
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText('CB-1', cb1X, y - 11);

    // Wire to GSU Transformer T1
    var gsuX = z1X + 124;
    ctx.beginPath();
    ctx.moveTo(cb1X + 7, y);
    ctx.lineTo(gsuX - 16, y);
    ctx.stroke();

    // GSU Transformer (Interlocking Circles)
    drawTransformerSymbol(ctx, gsuX, y, 11, t.accent);
    ctx.fillStyle = t.accent;
    ctx.font = '500 9px monospace';
    ctx.fillText('GSU T1', gsuX, y - 24);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText(cascade.gsu.primary_kV + '/' + cascade.gsu.secondary_kV + ' kV', gsuX, y + 30);

    // Wire to Bus 1
    var bus1X = z2X + 14;
    ctx.strokeStyle = t.transPurple;
    ctx.beginPath();
    ctx.moveTo(gsuX + 17, y);
    ctx.lineTo(bus1X, y);
    ctx.stroke();

    // ==========================================
    // ZONE 2: 230 kV TRANSMISSION SYSTEM
    // ==========================================
    // Bus 1 (230 kV High-Voltage Busbar - Solid Slate Bar)
    ctx.strokeStyle = t.transPurple;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bus1X, y - 48);
    ctx.lineTo(bus1X, y + 48);
    ctx.stroke();

    ctx.fillStyle = t.transPurple;
    ctx.font = '500 8px monospace';
    ctx.fillText('BUS 1', bus1X, y - 54);
    ctx.fillText(cascade.gsu.secondary_kV + ' kV', bus1X, y + 60);

    // Transmission Line with Tower Symbol
    var towerX = z2X + 105;
    ctx.strokeStyle = t.transPurple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bus1X, y);
    ctx.lineTo(towerX - 14, y);
    ctx.moveTo(towerX + 14, y);
    ctx.lineTo(z2X + z2W - 10, y);
    ctx.stroke();

    // Transmission Tower Icon
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(towerX, y - 20);
    ctx.lineTo(towerX - 9, y + 4);
    ctx.lineTo(towerX + 9, y + 4);
    ctx.closePath();
    ctx.moveTo(towerX - 11, y - 12);
    ctx.lineTo(towerX + 11, y - 12);
    ctx.moveTo(towerX - 8, y - 4);
    ctx.lineTo(towerX + 8, y - 4);
    ctx.stroke();

    ctx.fillStyle = t.transPurple;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('HV LINE', towerX, y - 25);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText(cascade.transmission.length_miles.toFixed(0) + ' mi ACSR', towerX, y + 26);
    ctx.fillText(cascade.transmission.current_A.toFixed(0) + ' A | -' + cascade.transmission.pct_drop.toFixed(2) + '%', towerX, y + 38);

    drawArrow(ctx, towerX + 18, y, towerX + 45, y, t.transPurple, 6);

    // ==========================================
    // ZONE 3: SUBSTATION & PRIMARY FEEDER (13.2 kV)
    // ==========================================
    // Substation Step-Down Transformer Sub-T
    var subTX = z3X + 32;
    ctx.strokeStyle = t.transPurple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(z2X + z2W - 10, y);
    ctx.lineTo(subTX - 16, y);
    ctx.stroke();

    drawTransformerSymbol(ctx, subTX, y, 11, t.cadBlue);
    ctx.fillStyle = t.textBlue;
    ctx.font = '500 9px monospace';
    ctx.fillText('Sub Xfmr', subTX, y - 24);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText(cascade.gsu.secondary_kV + '/' + cascade.substation.bus_kV + 'kV', subTX, y + 30);

    // Substation Bus 2 (13.2 kV Medium-Voltage Busbar)
    var bus2X = z3X + 76;
    ctx.strokeStyle = t.cadBlue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(subTX + 17, y);
    ctx.lineTo(bus2X, y);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bus2X, y - 48);
    ctx.lineTo(bus2X, y + 48);
    ctx.stroke();

    ctx.fillStyle = t.textBlue;
    ctx.font = '500 8px monospace';
    ctx.fillText('BUS 2', bus2X, y - 54);
    ctx.fillText(cascade.substation.bus_kV + ' kV', bus2X, y + 60);

    // Recloser [R]
    var recX = z3X + 116;
    ctx.strokeStyle = t.cadBlue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bus2X, y);
    ctx.lineTo(recX - 8, y);
    ctx.stroke();

    ctx.strokeRect(recX - 8, y - 8, 16, 16);
    ctx.fillStyle = t.textBlue;
    ctx.font = '500 8px monospace';
    ctx.fillText('R', recX, y + 2.5);
    ctx.font = '7px monospace';
    ctx.fillStyle = t.muted;
    ctx.fillText('Recloser', recX, y - 12);

    // Primary feeder, shown as overhead pole or underground cable
    var poleX = z3X + 180;
    ctx.strokeStyle = t.cadBlue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(recX + 8, y);
    ctx.lineTo(z3X + z3W, y);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (cascade.feeder.type === 'overhead') {
      ctx.moveTo(poleX, y - 18); ctx.lineTo(poleX, y + 8);
      ctx.moveTo(poleX - 10, y - 12); ctx.lineTo(poleX + 10, y - 12);
    } else {
      ctx.moveTo(poleX - 10, y - 5); ctx.lineTo(poleX + 10, y - 5);
      ctx.moveTo(poleX - 10, y + 5); ctx.lineTo(poleX + 10, y + 5);
    }
    ctx.stroke();

    ctx.fillStyle = t.textBlue;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('FEEDER', poleX, y + 38);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText(cascade.feeder.length_miles.toFixed(1) + ' mi ' + (cascade.feeder.type === 'overhead' ? '3φ OH' : '3φ UG'), poleX, y + 50);
    ctx.fillText(cascade.feeder.current_A.toFixed(0) + 'A | ' + cascade.feeder.end_kV.toFixed(2) + 'kV', poleX, y + 62);

    drawArrow(ctx, poleX + 16, y, poleX + 38, y, t.cadBlue, 6);

    // ==========================================
    // ZONE 4: LAST-MILE DISTRIBUTION & CUSTOMER
    // ==========================================
    // Step-Down Distribution Transformer (Pole Can or Padmount)
    var distTX = z4X + 36;
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(z3X + z3W, y);
    ctx.lineTo(distTX - 14, y);
    ctx.stroke();

    drawTransformerSymbol(ctx, distTX, y, 10, t.accent);
    ctx.fillStyle = t.accent;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('Dist Xfmr', distTX, y - 22);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText(cascade.distTransformer.rating_kVA + ' kVA', distTX, y + 26);
    ctx.fillText(cascade.distTransformer.service_label, distTX, y + 38);

    // Service Drop / Lateral to Meter
    var meterX = z4X + 105;
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(distTX + 16, y);
    ctx.lineTo(meterX - 13, y);
    ctx.stroke();

    // Customer Meter [kWh]
    ctx.strokeStyle = cascade.customerMeter.ansi.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(meterX, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = cascade.customerMeter.ansi.color;
    ctx.font = '500 7.5px monospace';
    ctx.fillText('kWh', meterX, y - 2);
    ctx.font = '500 8.5px monospace';
    ctx.fillText(cascade.customerMeter.terminal_V.toFixed(1) + ' V', meterX, y + 24);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText('ANSI ' + cascade.customerMeter.ansi.code, meterX, y + 36);

    // Customer Panel symbol
    var pnlX = z4X + z4W - 14;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(meterX + 12, y);
    ctx.lineTo(pnlX, y);
    ctx.stroke();

    ctx.strokeRect(pnlX - 4, y - 16, 8, 32);
    ctx.fillStyle = t.muted;
    ctx.font = '500 7.5px monospace';
    ctx.fillText('PANEL', pnlX - 1, y - 22);

    ctx.textAlign = 'left';
    ctx.font = '500 8px monospace';
    ctx.fillStyle = t.text;
    ctx.fillText('SERVICE: ' + cascade.serviceDrop.length_ft + ' ft | ' +
      cascade.serviceDrop.size_key.replace('_', ' ') + ' ' + (cascade.serviceDrop.material === 'al' ? 'Al' : 'Cu'), z4X + 8, y + 74);
    ctx.fillText('CUSTOMER LOAD: ' + cascade.customerMeter.load_kW + ' kW', z4X + 8, y + 88);

    // ==========================================
    // ACTIVE EQUIPMENT LOT HIGHLIGHTING (Bid4Grid Interactive Focus)
    // ==========================================
    var apparatusTarget = activeApparatus || activeNode;
    var apparatusMap = {
      gsu_breaker: { x: cb1X, label: 'SUBSTATION BREAKER (IEEE C37.04)', color: t.primary, cardIdx: 0 },
      sub_xfmr: { x: subTX, label: 'SUBSTATION POWER XFMR (IEEE C57.12)', color: t.cadBlue, cardIdx: 0 },
      voltage_regulator: { x: bus2X, label: 'STEP-VOLTAGE REGULATOR (IEEE C57.15)', color: t.cadBlue, cardIdx: 1 },
      feeder_recloser: { x: recX, label: 'AUTOMATIC RECLOSER (IEEE C37.60)', color: t.cadBlue, cardIdx: 1 },
      dist_switchgear: { x: poleX, label: 'PADMOUNT SWITCHGEAR (IEEE C37.20.2)', color: '#059669', cardIdx: 1 },
      dist_xfmr: { x: distTX, label: '3φ PADMOUNT TRANSFORMER (IEEE C57.12.22)', color: t.accent, cardIdx: 2 },
      pole_xfmr: { x: distTX, label: '1φ POLE-MOUNT CAN (IEEE C57.12.20)', color: t.accent, cardIdx: 2 },
      feeder: { x: poleX, label: 'PRIMARY FEEDER APPARATUS', color: t.cadBlue, cardIdx: 1 },
      sub: { x: subTX, label: 'SUBSTATION TRANSFORMER & BUS', color: t.cadBlue, cardIdx: 0 },
      xfmr: { x: distTX, label: 'DISTRIBUTION TRANSFORMER', color: t.accent, cardIdx: 2 }
    };

    var activeTarget = apparatusMap[apparatusTarget];
    if (activeTarget) {
      // 1. Glowing Amber Halo Ring around the target apparatus symbol
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(activeTarget.x, y, 26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(activeTarget.x, y, 22, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Vertical Pointer Arrow down to the apparatus
      drawArrow(ctx, activeTarget.x, y - 50, activeTarget.x, y - 24, '#d97706', 7);

      // 3. Floating Amber Callout Chip above the apparatus (Dynamically Sized with Generous Border)
      var cleanLabel = activeTarget.label.split('(')[0].trim();
      var lotText = '📍 SELECTED LOT: ' + cleanLabel;

      ctx.font = '500 8.5px system-ui, -apple-system, sans-serif';
      var textMetrics = ctx.measureText(lotText);
      var textW = textMetrics ? textMetrics.width : (lotText.length * 6.0);
      var chipW = Math.max(220, Math.ceil(textW) + 30);
      var chipH = 24;
      var chipX = Math.max(16, Math.min(w - chipW - 16, activeTarget.x - chipW / 2));
      var chipY = y - 76;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = '500 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lotText, chipX + chipW / 2, chipY + chipH / 2);
      ctx.textBaseline = 'alphabetic';
    }

    // ==========================================
    // THREE SPECIFICATION CALLOUTS (SUBTLE, LIGHT BARS)
    // ==========================================
    var specY = 320;
    var cardW = (w - 52) / 3;

    var isCard0 = activeTarget && activeTarget.cardIdx === 0;
    var isCard1 = activeTarget && activeTarget.cardIdx === 1;
    var isCard2 = activeTarget && activeTarget.cardIdx === 2;

    // Card 1
    ctx.fillStyle = isCard0 ? '#eff6ff' : '#f8fafc';
    ctx.strokeStyle = isCard0 ? '#d97706' : '#e2e8f0';
    ctx.lineWidth = isCard0 ? 2 : 1;
    ctx.fillRect(16, specY, cardW, 36);
    ctx.strokeRect(16, specY, cardW, 36);
    ctx.fillStyle = isCard0 ? '#d97706' : t.transPurple;
    ctx.font = '500 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SUBSTATION APPARATUS (IEEE C37.04)' + (isCard0 ? ' ★' : ''), 24, specY + 14);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText('Grid: ' + cascade.gsu.secondary_kV + ' kV | Substation: ' + cascade.substation.mva_rating + ' MVA', 24, specY + 27);

    // Card 2
    ctx.fillStyle = isCard1 ? '#eff6ff' : '#f8fafc';
    ctx.strokeStyle = isCard1 ? '#d97706' : '#e2e8f0';
    ctx.lineWidth = isCard1 ? 2 : 1;
    ctx.fillRect(16 + cardW + 8, specY, cardW, 36);
    ctx.strokeRect(16 + cardW + 8, specY, cardW, 36);
    ctx.fillStyle = isCard1 ? '#d97706' : t.textBlue;
    ctx.font = '500 8px monospace';
    ctx.fillText('FEEDER PROTECTION (IEEE C37.60)' + (isCard1 ? ' ★' : ''), 24 + cardW + 8, specY + 14);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText('Feeder: ' + cascade.feeder.conductor, 24 + cardW + 8, specY + 27);

    // Card 3
    ctx.fillStyle = isCard2 ? '#eff6ff' : '#f8fafc';
    ctx.strokeStyle = isCard2 ? '#d97706' : '#e2e8f0';
    ctx.lineWidth = isCard2 ? 2 : 1;
    ctx.fillRect(16 + (cardW + 8) * 2, specY, cardW, 36);
    ctx.strokeRect(16 + (cardW + 8) * 2, specY, cardW, 36);
    ctx.fillStyle = isCard2 ? '#d97706' : '#16a34a';
    ctx.font = '500 8px monospace';
    ctx.fillText('SERVICE COMPLIANCE (ANSI C84.1)' + (isCard2 ? ' ★' : ''), 24 + (cardW + 8) * 2, specY + 14);
    ctx.fillStyle = t.muted;
    ctx.font = '7.5px monospace';
    ctx.fillText('Utility-Grade Xfmr | Drop: ' + cascade.customerMeter.total_pct_drop.toFixed(2) + '% (' + cascade.customerMeter.ansi.code + ')', 24 + (cardW + 8) * 2, specY + 27);

    // Bottom Light Telemetry Bar
    var teleText = 'CASCADE TELEMETRY: Gen ' + cascade.gen.voltage_kV + 'kV → Trans ' + cascade.transmission.voltage_recv_kV.toFixed(1) + 'kV → Feeder ' + cascade.feeder.end_kV.toFixed(2) + 'kV → Meter ' + cascade.customerMeter.terminal_V.toFixed(1) + 'V | ANSI ' + cascade.customerMeter.ansi.code + ' | Total Drop: ' + cascade.customerMeter.total_pct_drop.toFixed(2) + '%';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 2. VOLTAGE PROFILE CURVE & ANSI C84.1 TOLERANCE ENVELOPE
  // =========================================================================
  function drawVoltageProfile(canvas, cascade) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    // Header banner
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ANSI C84.1 FEEDER VOLTAGE PROFILE & REGULATION ENVELOPE', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Normalized per-unit voltage from substation busbar (0 mi) down to customer service meter', 20, 38);

    var gx = 85, gy = 58, gw = w - 145, gh = h - 128;
    var lowest_pu = Math.min(cascade.feeder.end_kV / cascade.feeder.send_kV,
      cascade.distTransformer.voltage_out_V / cascade.distTransformer.secondary_nominal_V,
      cascade.customerMeter.terminal_V / cascade.customerMeter.nominal_V);
    var pu_min = Math.min(0.90, Math.max(0, Math.floor((lowest_pu - 0.02) * 20) / 20));
    var pu_max = 1.06;

    function yForPU(pu) {
      return gy + gh * (1.0 - (pu - pu_min) / (pu_max - pu_min));
    }

    var y_b_top = yForPU(1.058);
    var y_b_bot = yForPU(0.917);
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.fillRect(gx, y_b_top, gw, y_b_bot - y_b_top);

    var y_a_top = yForPU(1.05);
    var y_a_bot = yForPU(0.95);
    ctx.fillStyle = 'rgba(22, 163, 74, 0.12)';
    ctx.fillRect(gx, y_a_top, gw, y_a_bot - y_a_top);

    var y_nom = yForPU(1.0);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(gx, y_nom);
    ctx.lineTo(gx + gw, y_nom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = t.busbar;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    ctx.fillStyle = t.muted;
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'right';
    var ticks = [1.06, 1.05, 1.00, 0.95, 0.917, 0.90];
    if (pu_min < 0.90) ticks.push(pu_min);
    ticks.forEach(function (pu) {
      var y = yForPU(pu);
      ctx.fillText(pu.toFixed(3) + ' pu', gx - 8, y + 3);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(gx - 4, y);
      ctx.lineTo(gx, y);
      ctx.stroke();
    });

    ctx.textAlign = 'right';
    ctx.fillStyle = '#15803d';
    ctx.font = '500 8px monospace';
    ctx.fillText('ANSI Range A (±5%)', gx + gw - 8, 24);
    ctx.fillStyle = '#b45309';
    ctx.fillText('ANSI Range B (-8.3% / +5.8%)', gx + gw - 8, 38);

    var p0 = { x: gx, y: yForPU(1.00), label: 'Substation (1.00 pu)' };
    var feeder_end_pu = cascade.feeder.end_kV / cascade.feeder.send_kV;
    var x_feeder = gx + gw * 0.68;
    var p1 = { x: x_feeder, y: yForPU(feeder_end_pu), label: 'Feeder (' + feeder_end_pu.toFixed(3) + ' pu)' };

    var xfmr_out_pu = cascade.distTransformer.voltage_out_V / cascade.distTransformer.secondary_nominal_V;
    var x_xfmr = gx + gw * 0.76;
    var p2 = { x: x_xfmr, y: yForPU(xfmr_out_pu), label: 'Xfmr (' + xfmr_out_pu.toFixed(3) + ' pu)' };

    var cust_pu = cascade.customerMeter.terminal_V / cascade.customerMeter.nominal_V;
    var x_meter = gx + gw;
    var p3 = { x: x_meter, y: yForPU(cust_pu), label: 'Meter (' + cust_pu.toFixed(3) + ' pu)' };

    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.stroke();

    [p0, p1, p2, p3].forEach(function (pt, idx) {
      ctx.fillStyle = (idx === 3) ? cascade.customerMeter.ansi.color : t.cadBlue;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      var labelX = gx + idx * gw / 4 + 10;
      ctx.fillStyle = (idx === 3) ? cascade.customerMeter.ansi.color : t.cadBlue;
      ctx.beginPath();
      ctx.arc(labelX - 6, gy + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.text;
      ctx.font = '500 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(pt.label, labelX, gy + 11);
    });

    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0.0 mi (Sub)', gx, gy + gh + 14);
    ctx.fillText(cascade.feeder.length_miles.toFixed(1) + ' mi (Primary Feeder)', x_feeder, gy + gh + 14);
    ctx.fillText('Service (' + cascade.serviceDrop.length_ft + 'ft)', (x_xfmr + x_meter) / 2, gy + gh + 14);

    var teleText = 'STATUS: Meter ' + cascade.customerMeter.terminal_V.toFixed(1) + 'V | ' + cascade.customerMeter.ansi.status + ' | Total Drop: ' + cascade.customerMeter.total_pct_drop.toFixed(2) + '% | Loss: ' + cascade.feeder.p_loss_kW.toFixed(1) + 'kW';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 3. RESIDENTIAL 120/240-V SPLIT-PHASE & DYNAMIC PHASOR CAD
  // =========================================================================
  function drawSplitPhaseDiagram(canvas, splitData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    // Header banner
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RESIDENTIAL 120/240-V SPLIT-PHASE SYSTEM & CENTER-TAP PHYSICS', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Single-phase secondary with center-tap: Not 2 phases of 3φ, but 180° center-tapped winding', 20, 38);

    // Left Side: Transformer Winding Schematic (txX = 135 for zero overlap and positive margin)
    var txX = 135, txY = 175;

    // Primary High-Voltage Winding
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(txX - 45, txY - 65);
    ctx.lineTo(txX - 25, txY - 65);
    ctx.lineTo(txX - 25, txY + 65);
    ctx.lineTo(txX - 45, txY + 65);
    ctx.stroke();

    ctx.fillStyle = t.primary;
    ctx.font = '500 8.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('MV (H1)', txX - 50, txY - 62);
    ctx.fillText('Neutral (H2)', txX - 50, txY + 68);

    // Core bars
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(txX - 10, txY - 75);
    ctx.lineTo(txX - 10, txY + 75);
    ctx.moveTo(txX - 4, txY - 75);
    ctx.lineTo(txX - 4, txY + 75);
    ctx.stroke();

    // Secondary Center-Tapped Winding
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(txX + 16, txY - 65);
    ctx.lineTo(txX + 40, txY - 65);
    ctx.lineTo(txX + 40, txY);
    ctx.moveTo(txX + 40, txY);
    ctx.lineTo(txX + 70, txY);
    ctx.lineTo(txX + 40, txY);
    ctx.lineTo(txX + 40, txY + 65);
    ctx.lineTo(txX + 70, txY + 65);
    ctx.stroke();

    drawGroundSymbol(ctx, txX + 70, txY, 12);

    ctx.fillStyle = t.primary;
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('L1 (X1) ── ' + splitData.v_L1_N.toFixed(1) + ' V', txX + 48, txY - 68);
    ctx.fillStyle = t.ground;
    ctx.fillText('N (X2 / MGN)', txX + 78, txY - 4);
    ctx.fillText('I_N=' + splitData.I_N.toFixed(1) + ' A', txX + 78, txY + 18);
    ctx.fillStyle = t.textBlue;
    ctx.fillText('L2 (X3) ── ' + splitData.v_L2_N.toFixed(1) + ' V', txX + 48, txY + 78);

    // 240V Span bracket (Ending at x = 360, leaving 100px gap before phasor diagram)
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(txX + 175, txY - 55);
    ctx.lineTo(txX + 185, txY - 55);
    ctx.lineTo(txX + 185, txY + 55);
    ctx.lineTo(txX + 175, txY + 55);
    ctx.stroke();

    ctx.fillStyle = t.primary;
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('240V = ' + splitData.v_L1_L2.toFixed(1) + 'V', txX + 192, txY - 4);
    ctx.font = '7.5px monospace';
    ctx.fillStyle = t.muted;
    ctx.fillText('(EV/HVAC/Dryer)', txX + 192, txY + 12);

    ctx.fillStyle = t.primary;
    ctx.font = '8px monospace';
    ctx.fillText('L1: ' + splitData.I_L1.toFixed(1) + ' A', txX + 115, txY - 32);
    ctx.fillStyle = t.textBlue;
    ctx.fillText('L2: ' + splitData.I_L2.toFixed(1) + ' A', txX + 115, txY + 40);

    // ==========================================
    // RIGHT SIDE: DYNAMIC PHASOR SUBTRACTION & CURRENT CANCELLATION
    // ==========================================
    var pcX = 615, pcY = 175, rad = 60;

    // Reference Circle
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pcX, pcY, rad, 0, Math.PI * 2);
    ctx.stroke();

    // Axis Lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(pcX - rad - 10, pcY);
    ctx.lineTo(pcX + rad + 10, pcY);
    ctx.moveTo(pcX, pcY - rad - 10);
    ctx.lineTo(pcX, pcY + rad + 10);
    ctx.stroke();

    // Dynamic Voltage Phasors (Lengths scale with actual load voltage!)
    var v1_len = rad * (splitData.v_L1_N / 120.0);
    var v2_len = rad * (splitData.v_L2_N / 120.0);

    // V_L1-N Phasor (Points Right at 0°, Navy)
    drawArrow(ctx, pcX, pcY, pcX + v1_len, pcY, t.primary, 7);
    ctx.fillStyle = t.primary;
    ctx.font = '500 8.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('V_L1=' + splitData.v_L1_N.toFixed(1) + 'V ∠0°', pcX + v1_len + 6, pcY - 4);

    // V_L2-N Phasor (Points Left at 180°, Blue)
    drawArrow(ctx, pcX, pcY, pcX - v2_len, pcY, t.cadBlue, 7);
    ctx.fillStyle = t.textBlue;
    ctx.textAlign = 'right';
    ctx.fillText('V_L2=' + splitData.v_L2_N.toFixed(1) + 'V ∠180°', pcX - v2_len - 6, pcY - 4);

    // Dynamic Current Vectors (Scaling to show phasor cancellation)
    var maxI = Math.max(80.0, Math.max(splitData.I_L1, splitData.I_L2));
    var iScale = 45.0 / maxI;

    var i1_len = splitData.I_L1 * iScale;
    var i2_len = splitData.I_L2 * iScale;

    // I_L1 Vector (Lagging ~23° down-right)
    drawArrow(ctx, pcX, pcY, pcX + i1_len * 0.92, pcY + i1_len * 0.39, t.primary, 5);
    ctx.fillStyle = t.primary;
    ctx.font = '7.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('I_1=' + splitData.I_L1.toFixed(0) + 'A', pcX + i1_len * 0.92 + 3, pcY + i1_len * 0.39 + 8);

    // I_L2 Vector (Lagging ~23° up-left)
    drawArrow(ctx, pcX, pcY, pcX - i2_len * 0.92, pcY - i2_len * 0.39, t.cadBlue, 5);
    ctx.fillStyle = t.textBlue;
    ctx.textAlign = 'right';
    ctx.fillText('I_2=' + splitData.I_L2.toFixed(0) + 'A', pcX - i2_len * 0.92 - 3, pcY - i2_len * 0.39 - 4);

    // Dynamic Neutral Current Vector (Difference / Unbalance)
    var in_len = splitData.I_N * iScale;
    if (splitData.I_N >= 1.0) {
      // Bold green arrow along axis showing net unbalance
      var dirX = (splitData.I_L1 >= splitData.I_L2) ? 1 : -1;
      drawArrow(ctx, pcX, pcY, pcX + dirX * in_len * 0.92, pcY + dirX * in_len * 0.39, '#16a34a', 6);
    }

    // Top Dynamic Equation (Updates live with load changes!)
    ctx.fillStyle = t.text;
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DYNAMIC PHASOR SUBTRACTION:', pcX, pcY - rad - 20);
    ctx.font = '8px monospace';
    ctx.fillStyle = t.muted;
    ctx.fillText('V_L1 - V_L2 = ' + splitData.v_L1_N.toFixed(1) + '∠0° - ' + splitData.v_L2_N.toFixed(1) + '∠180° = ' + splitData.v_L1_L2.toFixed(1) + ' V', pcX, pcY - rad - 7);

    // Bottom Live Neutral Cancellation Status
    if (splitData.I_N < 1.0) {
      ctx.fillStyle = '#16a34a';
      ctx.font = '500 8.5px monospace';
      ctx.fillText('✓ BALANCED: NEUTRAL CURRENT I_N = 0.0 A (100% CANCELLED)', pcX, pcY + rad + 22);
    } else {
      ctx.fillStyle = (splitData.unbalance_A > 20) ? t.warning : '#16a34a';
      ctx.font = '500 8.5px monospace';
      ctx.fillText('NEUTRAL CURRENT I_N = |I_1 - I_2| = ' + splitData.I_N.toFixed(1) + ' A (' + (splitData.I_L1 > splitData.I_L2 ? 'Leg 1 Heavy' : 'Leg 2 Heavy') + ')', pcX, pcY + rad + 22);
    }

    var teleText = 'SPLIT-PHASE: L1 = ' + splitData.v_L1_N.toFixed(1) + 'V | L2 = ' + splitData.v_L2_N.toFixed(1) + 'V | L1-L2 = ' + splitData.v_L1_L2.toFixed(1) + 'V | Neutral: ' + splitData.I_N.toFixed(1) + 'A | ' + splitData.ansiStatus.status;
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 4. OVERHEAD UTILITY POLE FRAMING & HARDWARE CAD ELEVATION (CLEAN CAD)
  // =========================================================================
  function drawPoleFraming(canvas, poleData, activeItem) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    var hasXfmr = (poleData && typeof poleData.hasTransformer === 'boolean') ? poleData.hasTransformer : true;
    var primKV = (poleData && poleData.primary_kV) ? poleData.primary_kV : 13.2;

    // Header banner
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    var headerTitle = hasXfmr
      ? 'OVERHEAD TRANSFORMER POLE FRAMING & NESC CLEARANCE ELEVATION'
      : 'OVERHEAD TANGENT PASS-THROUGH POLE FRAMING (NESC RULE 235/238)';
    ctx.fillText(headerTitle, 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    var headerSubtitle = hasXfmr
      ? 'Class 4 Slender Pole: ' + primKV + ' kV Crossarm, Fused Cutout, 50 kVA Can & Secondary Drop'
      : 'Class 4 Slender Pole: ' + primKV + ' kV Continuous Straight-Through Phases on Pin Insulators & MGN';
    ctx.fillText(headerSubtitle, 20, 38);

    var px = 280;
    var groundY = 350;

    // Earth ground line (Grade 0 ft)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, groundY, 480, 45);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(500, groundY);
    ctx.stroke();

    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('GROUND LEVEL / GRADE (0 ft)', 24, groundY - 6);
    ctx.fillText('Buried Setting (6 ft depth in soil)', 24, groundY + 20);

    // ==========================================
    // 1. ELEVATION & NESC CLEARANCE LADDER (LEFT COLUMN)
    // Cleanly spaced dimensions - zero text/line collisions!
    // ==========================================
    var armY = 68;      // 33 ft (Primary phases)
    var cutY_pos = 114; // 30 ft (Cutout)
    var mgnY = 230;     // 24 ft (System Neutral)
    var commsY = 295;   // 20 ft (Telecom attachment)

    // Vertical datum dimension line
    var dimX = 180;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dimX, armY);
    ctx.lineTo(dimX, groundY);
    ctx.stroke();

    // Elevation ticks & labels (Cleanly placed to the left of dimX)
    function drawDatumTick(y, ftStr, labelStr, color) {
      ctx.strokeStyle = color || '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(dimX - 4, y);
      ctx.lineTo(dimX + 4, y);
      ctx.stroke();

      ctx.fillStyle = color || t.text;
      ctx.font = '500 8.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ftStr, dimX - 8, y + 3);

      ctx.font = '7.5px monospace';
      ctx.fillStyle = t.muted;
      ctx.fillText(labelStr, dimX - 44, y + 3);
    }

    drawDatumTick(armY, '33 ft', 'Primary Phases', t.primary);
    drawDatumTick(mgnY, '24 ft', 'MGN Neutral', t.ground);
    drawDatumTick(commsY, '20 ft', 'Communications', '#1e293b');

    // Rule 235 Dimension Bracket (Primary to Neutral = 48 inches / 4 ft)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    var brkX = dimX - 8;
    ctx.beginPath();
    ctx.moveTo(brkX, armY + 8);
    ctx.lineTo(brkX, mgnY - 8);
    ctx.stroke();
    drawArrow(ctx, brkX, (armY + mgnY) / 2 - 10, brkX, armY + 2, '#0284c7', 4);
    drawArrow(ctx, brkX, (armY + mgnY) / 2 + 10, brkX, mgnY - 2, '#0284c7', 4);

    ctx.fillStyle = t.textBlue;
    ctx.font = '500 7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('↕ 48" Rule 235', brkX - 6, (armY + mgnY) / 2 - 2);
    ctx.font = '6.5px monospace';
    ctx.fillStyle = t.muted;
    ctx.fillText('(Primary-to-Neutral)', brkX - 6, (armY + mgnY) / 2 + 8);

    // Rule 238 Dimension Bracket (Neutral to Comms = 40 inches / 3.33 ft)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(brkX, mgnY + 6);
    ctx.lineTo(brkX, commsY - 6);
    ctx.stroke();
    drawArrow(ctx, brkX, (mgnY + commsY) / 2 - 8, brkX, mgnY + 2, '#d97706', 4);
    drawArrow(ctx, brkX, (mgnY + commsY) / 2 + 8, brkX, commsY - 2, '#d97706', 4);

    ctx.fillStyle = '#d97706';
    ctx.font = '500 7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('↕ 40" Rule 238', brkX - 6, (mgnY + commsY) / 2 - 2);
    ctx.font = '6.5px monospace';
    ctx.fillStyle = '#b45309';
    ctx.fillText('(Worker Safety Zone)', brkX - 6, (mgnY + commsY) / 2 + 8);

    // ==========================================
    // 2. SLENDER WOOD POLE & FRAMING (CENTER)
    // ==========================================
    ctx.fillStyle = '#fef3c7'; // Natural pine
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px - 5, 50);
    ctx.lineTo(px + 5, 50);
    ctx.lineTo(px + 8, groundY + 40);
    ctx.lineTo(px - 8, groundY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crossarm (8-foot fir crossarm atop pole)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px - 90, armY - 3, 180, 7);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 90, armY - 3, 180, 7);

    // Crossarm diagonal braces
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 65, armY + 4);
    ctx.lineTo(px, armY + 36);
    ctx.lineTo(px + 65, armY + 4);
    ctx.stroke();

    // 3 Pin Insulators & Conductors
    var pins = [
      { x: px - 75, phase: 'Phase A (' + primKV + ' kV)', color: t.phaseA },
      { x: px,      phase: 'Phase B (' + primKV + ' kV)', color: t.phaseB },
      { x: px + 75, phase: 'Phase C (' + primKV + ' kV)', color: t.phaseC }
    ];

    pins.forEach(function (pin) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(pin.x - 4, armY - 16, 8, 13);
      ctx.beginPath();
      ctx.arc(pin.x, armY - 16, 5, 0, Math.PI, true);
      ctx.fill();

      ctx.fillStyle = pin.color;
      ctx.beginPath();
      ctx.arc(pin.x, armY - 19, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    var cutX = px - 38;
    var xfX = px + 42, xfY = 168, xfW = 38, xfH = 54;

    if (hasXfmr) {
      // 2. Fused Cutout (Y = 114)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cutX, cutY_pos - 14);
      ctx.lineTo(cutX, cutY_pos + 14);
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(cutX - 1, cutY_pos - 12);
      ctx.lineTo(cutX + 10, cutY_pos + 10);
      ctx.stroke();

      // 3. Lightning Surge Arrester (MOV)
      var arrX = px - 18, arrY = 114;
      ctx.fillStyle = '#475569';
      ctx.fillRect(arrX - 3.5, arrY - 10, 7, 20);

      // Primary Jumper from Phase A to Cutout
      ctx.strokeStyle = t.phaseA;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px - 75, armY - 19);
      ctx.lineTo(cutX, cutY_pos - 14);
      ctx.stroke();

      // Cutout to Transformer Primary Bushing
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cutX + 10, cutY_pos + 10);
      ctx.lineTo(xfX - 12, xfY - xfH / 2 - 12);
      ctx.stroke();

      // 4. Pole-Mount Transformer Can (Sleek light metallic grey #f8fafc with #475569 outline)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(xfX - xfW / 2, xfY - xfH / 2, xfW, xfH);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xfX - xfW / 2, xfY - xfH / 2, xfW, xfH);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(xfX - xfW / 2 - 2, xfY - xfH / 2 - 3, xfW + 4, 4);
      ctx.fillRect(px + 6, xfY - 12, xfX - xfW / 2 - px - 6, 7);

      // Transformer Bushings
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(xfX - 12, xfY - xfH / 2 - 12, 6, 9);
      ctx.fillStyle = '#cbd5e1';
      [-8, 0, 8].forEach(function (ox) {
        ctx.fillRect(xfX + ox - 2, xfY - 5, 4, 7);
      });

      // 5. Secondary Service Triplex (Leaves transformer can heading UP-RIGHT to weatherhead)
      // Safely above neutral — NEVER cuts through the 40" safety space!
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(xfX + xfW / 2, xfY);
      ctx.lineTo(px + 120, xfY - 16);
      ctx.stroke();

      // Leader callout for Secondary Drop
      ctx.fillStyle = t.accent;
      ctx.font = '500 7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('120/240V Service Drop', px + 125, xfY - 16);
      ctx.font = '6.5px monospace';
      ctx.fillStyle = t.muted;
      ctx.fillText('(To Customer Weatherhead)', px + 125, xfY - 6);
    }

    // 6. System Neutral (MGN) Spool (At 24 ft / mgnY = 230)
    // Conductor stays on the pole — NEVER extends left into text!
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px - 10, mgnY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px - 25, mgnY);
    ctx.lineTo(px + 25, mgnY);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '500 7.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('System Neutral (MGN)', px + 30, mgnY + 3);

    // 7. Safety Space Shaded Zone (NESC Rule 238: 40 inches / mgnY to commsY)
    ctx.fillStyle = 'rgba(217, 119, 6, 0.10)';
    ctx.fillRect(px - 16, mgnY + 5, 32, commsY - mgnY - 10);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(px - 16, mgnY + 5, 32, commsY - mgnY - 10);
    ctx.setLineDash([]);

    ctx.fillStyle = '#b45309';
    ctx.font = '500 7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('40" Safety Space (Empty Zone)', px + 22, (mgnY + commsY) / 2);

    // 8. Telecommunications Attachment (At 20 ft / commsY = 295)
    // Conductor stays on the pole — NEVER extends left into text!
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(px - 8, commsY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px - 25, commsY);
    ctx.lineTo(px + 25, commsY);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '500 7.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Telecom Strand (Fiber/Coax)', px + 30, commsY + 3);

    // Pole Ground Wire (Green wire running down right side of pole to earth rod)
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + 6, armY);
    ctx.lineTo(px + 6, groundY + 12);
    ctx.stroke();
    drawGroundSymbol(ctx, px + 6, groundY + 12, 12);

    // Component Callouts on the hardware (Cutout & Can)
    if (hasXfmr) {
      ctx.fillStyle = t.primary;
      ctx.font = '500 7.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('100A Expulsion Cutout →', brkX - 10, cutY_pos);
      ctx.fillText('50 kVA Can (28ft) →', brkX - 10, xfY);
    }

    // ==========================================
    // 3. SPECIFICATION CARD (RIGHT SIDE)
    // ==========================================
    var cardX = 520, cardY = 54, cardW = 310, cardH = 312;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = t.primary;
    ctx.font = '500 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('POLE HARDWARE & SPECIFICATIONS', cardX + 14, cardY + 20);

    var specsList = [
      { label: 'Pole Class', val: 'Class 4 Pine (40ft)' },
      { label: 'Primary Framing', val: 'Fir 8ft Crossarm (' + primKV + ' kV)' },
      { label: 'Framing Style', val: hasXfmr ? 'Transformer Distribution Pole' : 'Tangent Pass-Through Pole' },
      { label: 'Insulators', val: primKV > 20 ? 'ANSI 55-5 (125kV BIL)' : 'ANSI 55-4 (95kV BIL)' },
      { label: 'Protection', val: hasXfmr ? '100A Cutout + MOV 8.4kV' : 'None (Continuous Feeder)' },
      { label: 'Transformer Can', val: hasXfmr ? '50 kVA ' + primKV + 'kV to 120/240V' : 'None (Tangent Pole)' },
      { label: 'Customer Drop', val: hasXfmr ? '#2 AWG Al Triplex' : 'None (No Service Lateral)' },
      { label: 'Neutral Wire', val: 'Multi-Grounded Neutral (MGN)' },
      { label: 'Safety Space', val: '40 in (NESC Rule 238)' }
    ];

    var sy = cardY + 42;
    specsList.forEach(function (sp) {
      ctx.fillStyle = t.muted;
      ctx.font = '8px monospace';
      ctx.fillText(sp.label + ':', cardX + 14, sy);
      ctx.fillStyle = t.text;
      ctx.font = '500 8.5px monospace';
      ctx.fillText(sp.val, cardX + 120, sy);
      sy += 22;
    });

    ctx.fillStyle = t.accent;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('BID4GRID APPARATUS SOURCING:', cardX + 14, cardY + 270);
    ctx.fillStyle = t.text;
    ctx.font = '8px monospace';
    ctx.fillText(hasXfmr ? 'Utility-Grade 50kVA Can (IEEE C57.12.20)' : 'Class 4 Wood Pole Sourcing (ANSI O5.1)', cardX + 14, cardY + 286);
    ctx.fillText(hasXfmr ? 'IEEE C37.42 100A Cutout + MOV Arrester' : 'IEEE C37 Crossarm Pin Insulator Assembly', cardX + 14, cardY + 299);

    var teleText = 'OVERHEAD HARDWARE: ' + primKV + ' kV 3φ Crossarm → ' + (hasXfmr ? '100A Cutout → 50 kVA Can → 120/240V Triplex Service' : 'Tangent Inline Pole (Continuous Feeder, No Service Step-Down)') + ' | NESC Compliant';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 5. PAD-MOUNTED TRANSFORMER, SWITCHGEAR & GA JUNCTION CABINET CAD
  // =========================================================================
  function drawPadmountEnclosure(canvas, padData, mode, encColor) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    mode = mode || (padData && padData.mode) || 'transformer';
    encColor = encColor || (padData && padData.enclosureColor) || 'gray'; // Default to Georgia Power gray

    var isSwitchgear = mode === 'switchgear';
    var isJunction = mode === 'junction';
    var isGray = encColor === 'gray';

    // Header banner
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    var title = isJunction
      ? 'PRIMARY SECTIONALIZING / JUNCTION CABINET (GEORGIA POWER SPEC)'
      : (isSwitchgear
        ? 'PAD-MOUNTED MEDIUM-VOLTAGE SWITCHGEAR ELEVATION (IEEE C37.20.2)'
        : 'PAD-MOUNTED DISTRIBUTION TRANSFORMER DUAL COMPARTMENT (IEEE C57.12.22)');
    ctx.fillText(title, 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    var subtitle = isJunction
      ? 'Subdivision Loop Sectionalizing: 200A 4-Way Junctions & Elbows (No Transformer Inside)'
      : (isSwitchgear
        ? 'Sectionalizing, Vacuum Interrupters, 3-Position Switches (No Voltage Transformation)'
        : 'Padmount Enclosure: Dead-Front Loadbreak Elbows, Bayonet Fuses & LV Spades');
    ctx.fillText(subtitle, 20, 38);

    // Concrete Pad
    var padY = 320;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, padY, 460, 48);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, padY, 460, 48);

    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CONCRETE BOX PAD / VAULT BASE (Conduit Entrances)', 50, padY + 28);

    // Enclosure Outline (Georgia Gray ANSI 70 or Munsell Green)
    var encX = 50, encY = 70, encW = 440, encH = 250;
    var borderCol = isGray ? '#64748b' : '#16a34a';
    var fillCol = isGray ? '#f1f5f9' : '#f0fdf4';

    ctx.fillStyle = fillCol;
    ctx.fillRect(encX, encY, encW, encH);
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 2;
    ctx.strokeRect(encX, encY, encW, encH);

    // Color Badge on Enclosure Top
    ctx.fillStyle = isGray ? '#475569' : '#15803d';
    ctx.font = '500 7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(isGray ? 'FINISH: ANSI 70 LIGHT GRAY (GA POWER SPEC)' : 'FINISH: MUNSELL 7GY 3.29/1.5 GREEN', encX + encW - 12, encY + 16);

    // Divider
    var divX = encX + encW * 0.52;
    ctx.fillStyle = isGray ? '#f8fafc' : '#f0fdf4';
    ctx.fillRect(encX + 2, encY + 2, divX - encX - 2, encH - 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(divX + 2, encY + 2, encX + encW - divX - 4, encH - 4);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(divX, encY);
    ctx.lineTo(divX, encY + encH);
    ctx.stroke();

    if (isJunction) {
      // -------------------------------------------------------------
      // JUNCTION BOX / SECTIONALIZING CABINET MODE (NO TRANSFORMER)
      // -------------------------------------------------------------
      ctx.textAlign = 'left';
      ctx.fillStyle = t.primary;
      ctx.font = '500 9px monospace';
      ctx.fillText('200A 4-WAY JUNCTION BUS (PHASE A/B)', encX + 16, encY + 22);
      ctx.font = '7.5px monospace';
      ctx.fillStyle = t.muted;
      ctx.fillText('Loop-In / Loop-Out / Lateral Taps', encX + 16, encY + 34);

      // 4-Point Junction Bars
      for (var j = 0; j < 3; j++) {
        var jy = encY + 70 + j * 55;
        var jCol = j === 0 ? t.phaseA : (j === 1 ? t.phaseB : t.phaseC);
        var jPhase = j === 0 ? 'PHASE A' : (j === 1 ? 'PHASE B' : 'PHASE C');

        // Copper junction bar
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(encX + 30, jy, 160, 20);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.strokeRect(encX + 30, jy, 160, 20);

        // 4 Bushing points
        [45, 80, 115, 150].forEach(function (ox, idx) {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(encX + ox, jy + 10, 5, 0, Math.PI * 2);
          ctx.fill();

          // Elbow lead heading down
          ctx.strokeStyle = jCol;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(encX + ox, jy + 15);
          ctx.lineTo(encX + ox, encY + encH + 18);
          ctx.stroke();
        });

        ctx.fillStyle = t.primary;
        ctx.font = '500 7px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(jPhase, encX - 5, jy + 13);
      }

      // Right Compartment: Parking Stands & Ground Bus
      ctx.textAlign = 'left';
      ctx.fillStyle = t.primary;
      ctx.font = '500 9px monospace';
      ctx.fillText('PARKING STANDS & MGN BUS', divX + 16, encY + 22);
      ctx.font = '7.5px monospace';
      ctx.fillStyle = t.muted;
      ctx.fillText('Safe Isolation & Test Standoffs', divX + 16, encY + 34);

      for (var p = 0; p < 3; p++) {
        var py = encY + 70 + p * 55;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(divX + 35, py, 130, 36);

        ctx.fillStyle = t.primary;
        ctx.font = '500 7.5px monospace';
        ctx.fillText('STANDBY POST ' + (p + 1), divX + 45, py + 16);
        ctx.fillStyle = t.muted;
        ctx.font = '6.5px monospace';
        ctx.fillText('Insulated Standoff Position', divX + 45, py + 28);
      }
    } else {
      // -------------------------------------------------------------
      // LEFT COMPARTMENT: HIGH-VOLTAGE
      // -------------------------------------------------------------
      var isLoop = padData ? padData.isLoopFeed : true;
      var kvaVal = padData ? padData.rating_kVA : 500;

      ctx.textAlign = 'left';
      ctx.fillStyle = t.primary;
      ctx.font = '500 9px monospace';
      ctx.fillText('HIGH-VOLTAGE (HV) SIDE', encX + 16, encY + 20);
      ctx.font = '7.5px monospace';
      ctx.fillStyle = t.muted;
      ctx.fillText(isLoop ? 'Dead-Front 200A Loop Feed (6 Bushings)' : 'Dead-Front Radial Feed (3 Bushings)', encX + 16, encY + 32);

      var hBushings;
      if (isLoop) {
        hBushings = [
          { x: encX + 50, y: encY + 70, label: 'H1A', col: t.phaseA },
          { x: encX + 95, y: encY + 70, label: 'H1B', col: t.phaseA },
          { x: encX + 50, y: encY + 125, label: 'H2A', col: t.phaseB },
          { x: encX + 95, y: encY + 125, label: 'H2B', col: t.phaseB },
          { x: encX + 50, y: encY + 180, label: 'H3A', col: t.phaseC },
          { x: encX + 95, y: encY + 180, label: 'H3B', col: t.phaseC }
        ];
      } else {
        hBushings = [
          { x: encX + 72, y: encY + 70, label: 'H1', col: t.phaseA },
          { x: encX + 72, y: encY + 125, label: 'H2', col: t.phaseB },
          { x: encX + 72, y: encY + 180, label: 'H3', col: t.phaseC }
        ];
      }

      hBushings.forEach(function (b, i) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(b.x - 14, b.y - 12, 28, 24);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(b.x - 14, b.y - 12, 28, 24);

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(b.x - 10, b.y - 9, 20, 18, 4);
        ctx.fill();

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = b.col;
        ctx.lineWidth = 2.5;
        var row = isLoop ? Math.floor(i / 2) : i;
        var cableX = isLoop ? encX + (i % 2 === 0 ? 10 : 67) + row * 7 : encX + 10 + row * 10;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + 9);
        ctx.lineTo(b.x, b.y + 16);
        ctx.lineTo(cableX, b.y + 16);
        ctx.lineTo(cableX, encY + encH + 20);
        ctx.stroke();

        ctx.fillStyle = t.primary;
        ctx.font = '500 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, b.x, b.y - 14);
      });

      // Bayonet Fuses
      ctx.fillStyle = '#d97706';
      [-15, 15].forEach(function (offset) {
        var bx = encX + 160 + offset, by = encY + 65;
        ctx.fillRect(bx - 3.5, by, 7, 28);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - 3.5, by, 7, 28);
      });
      ctx.fillStyle = t.muted;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Bayonet Fuses', encX + 160, encY + 54);

      // Parking Stand
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(encX + 145, encY + 140, 28, 35);
      ctx.fillStyle = t.muted;
      ctx.fillText('Standby Post', encX + 159, encY + 134);

      // -------------------------------------------------------------
      // RIGHT COMPARTMENT: LOW-VOLTAGE / SWITCHGEAR
      // -------------------------------------------------------------
      ctx.textAlign = 'left';
      ctx.fillStyle = t.primary;
      ctx.font = '500 9px monospace';
      var rightTitle = isSwitchgear ? 'VACUUM INTERRUPTER / SCADA' : 'LOW-VOLTAGE (LV) SIDE';
      ctx.fillText(rightTitle, divX + 16, encY + 20);
      ctx.font = '7.5px monospace';
      ctx.fillStyle = t.muted;
      var rightSub = isSwitchgear ? '600A Vacuum Bottles & Controls' : 'NEMA Spade Terminals & Gauges';
      ctx.fillText(rightSub, divX + 16, encY + 32);

      if (!isSwitchgear) {
        var lvSpades = [
          { x: divX + 45, label: 'X1 (A)', col: t.phaseA },
          { x: divX + 85, label: 'X2 (B)', col: t.phaseB },
          { x: divX + 125, label: 'X3 (C)', col: t.phaseC },
          { x: divX + 165, label: 'X0 (N)', col: t.ground }
        ];

        lvSpades.forEach(function (sp) {
          var sy = encY + 95;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(sp.x - 9, sy - 25, 18, 50);
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1;
          ctx.strokeRect(sp.x - 9, sy - 25, 18, 50);

          ctx.fillStyle = '#ffffff';
          [-15, -5, 5, 15].forEach(function (hy) {
            ctx.beginPath();
            ctx.arc(sp.x, sy + hy, 2, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.strokeStyle = sp.col;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(sp.x, sy + 25);
          ctx.lineTo(sp.x, encY + encH + 20);
          ctx.stroke();

          ctx.fillStyle = t.primary;
          ctx.font = '500 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(sp.label, sp.x, sy - 30);
        });

        // Gauge dial
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(divX + 155, encY + 195, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = t.muted;
        ctx.font = '6.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TEMP', divX + 155, encY + 198);

        // Neutral ground strap
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(divX + 165, encY + 120);
        ctx.lineTo(divX + 185, encY + 220);
        ctx.stroke();
        drawGroundSymbol(ctx, divX + 185, encY + 220, 10);
      } else {
        // Switchgear View
        for (var v = 0; v < 3; v++) {
          var vy = encY + 70 + v * 55;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(divX + 40, vy, 110, 36);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(divX + 40, vy, 110, 36);

          ctx.fillStyle = t.textBlue;
          ctx.font = '500 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VACUUM BOTTLE ' + (v + 1), divX + 95, vy + 16);
          ctx.fillStyle = t.muted;
          ctx.font = '7px monospace';
          ctx.fillText('CLOSED / TRIP READY', divX + 95, vy + 28);
        }
      }
    }

    // Specification Card (Right Side)
    var cardX = 510, cardY = 56, cardW = 320, cardH = 310;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = t.primary;
    ctx.font = '500 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PADMOUNT SPECIFICATIONS & RATINGS', cardX + 14, cardY + 20);

    var padSpecs = isJunction ? [
      { label: 'Apparatus Type', val: 'Sectionalizing Junction Cabinet' },
      { label: 'Voltage Class', val: '15 kV / 25 kV (95/125 kV BIL)' },
      { label: 'Junction Bus', val: '200 A 4-Way Copper Bar' },
      { label: 'Elbow Types', val: 'Loadbreak with Capacitive Test' },
      { label: 'Transformation', val: 'NONE (Zero Core / Coils Inside)' },
      { label: 'Utility Finish', val: isGray ? 'ANSI 70 Gray (GA Power)' : 'Munsell 7GY Green' },
      { label: 'Security Lock', val: 'Pentahead Bolt with Padlock Hasp' },
      { label: 'Application', val: 'Underground Loop Taps & Isolation' }
    ] : (isSwitchgear ? [
      { label: 'Standard', val: 'IEEE C37.20.2 / C37.74' },
      { label: 'Nominal Voltage', val: '15 kV (95 kV BIL)' },
      { label: 'Continuous Current', val: '600 A Main / 200 A Taps' },
      { label: 'Interrupting kA', val: '12.5 kA - 25 kA Sym.' },
      { label: 'Mechanism', val: 'Close - Open - Ground' },
      { label: 'Interrupters', val: 'Vacuum (Solid Dielectric)' },
      { label: 'Cabinet Finish', val: isGray ? 'ANSI 70 Gray (GA Power)' : 'Munsell 7GY Green' },
      { label: 'Automation', val: 'SCADA RTU & Motor Ready' }
    ] : [
      { label: 'Standard', val: 'IEEE C57.12.00 / C57.12.22' },
      { label: 'Power Rating', val: kvaVal + ' kVA (3φ Padmount)' },
      { label: 'Primary Voltage', val: '13200 GrdY / 7620 V' },
      { label: 'Secondary Voltage', val: '480Y/277 V or 208Y/120 V' },
      { label: 'HV Bushings', val: isLoop ? '200A Dead-Front (Loop 6)' : '200A Dead-Front (Radial 3)' },
      { label: 'Fusing System', val: 'Bayonet + CLF Dual Fusing' },
      { label: 'Cabinet Finish', val: isGray ? 'ANSI 70 Gray (GA Power)' : 'Munsell 7GY Green' },
      { label: 'Impedance %Z', val: (kvaVal >= 750 ? '5.75%' : '4.50%') + ' standard rating' }
    ]);

    var py = cardY + 42;
    padSpecs.forEach(function (sp) {
      ctx.fillStyle = t.muted;
      ctx.font = '8px monospace';
      ctx.fillText(sp.label + ':', cardX + 14, py);
      ctx.fillStyle = t.text;
      ctx.font = '500 8.5px monospace';
      ctx.fillText(sp.val, cardX + 115, py);
      py += 22;
    });

    ctx.fillStyle = t.accent;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('BID4GRID PROCUREMENT DATASHEET:', cardX + 14, cardY + 268);
    ctx.fillStyle = t.text;
    ctx.font = '8px monospace';
    var bfgText = isJunction
      ? 'Hubbell / Cooper 200A 4-Way Sectionalizing Cabinet'
      : (isSwitchgear ? 'IEEE C37.20 Metal-Clad Switchgear (15kV)' : 'Utility-Grade ' + kvaVal + 'kVA Padmount Transformer');
    ctx.fillText(bfgText, cardX + 14, cardY + 284);
    ctx.fillText('Certified FAT Reports & Utility Warranty Included', cardX + 14, cardY + 298);

    var teleText = isJunction
      ? 'PRIMARY JUNCTION CABINET: 15 kV | 200A 4-Way Bus | Sectionalizing & Loop Taps | No Transformation | ' + (isGray ? 'ANSI 70 Gray' : 'Munsell Green')
      : (isSwitchgear
        ? 'PADMOUNT SWITCHGEAR: 15 kV | 600A Bus | ' + (isLoop ? 'Loop Feed (Ways 1 & 2)' : 'Radial Feed (Way 1 Only)') + ' | 3-Phase Vacuum Fault Interrupters'
        : 'PADMOUNT TRANSFORMER: ' + kvaVal + ' kVA 3φ | ' + (isLoop ? 'Loop Feed (6 Bushings)' : 'Radial Feed (3 Bushings)') + ' | Dead-Front Loadbreak | IEEE C57.12.22');
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 6. OVERHEAD-TO-UNDERGROUND RISER POLE TRANSITION CAD
  // =========================================================================
  function drawRiserPole(canvas, riserData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    // Header banner
    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OVERHEAD-TO-UNDERGROUND RISER POLE TRANSITION (TOPIC 6)', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Transitioning 3φ Overhead Feeder into Underground Jacketed Shielded Cable via Potheads', 20, 38);

    var rx = 260;
    var groundY = 350;

    // Earth
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, groundY, 460, 45);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, groundY);
    ctx.lineTo(500, groundY);
    ctx.stroke();

    // Slender Wood pole
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx - 5, 50);
    ctx.lineTo(rx + 5, 50);
    ctx.lineTo(rx + 8, groundY + 40);
    ctx.lineTo(rx - 8, groundY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crossarm
    ctx.fillStyle = '#d97706';
    ctx.fillRect(rx - 90, 68, 180, 7);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx - 90, 68, 180, 7);

    // 3 Cutouts & Potheads
    var phases = [
      { x: rx - 70, col: t.phaseA, name: 'A' },
      { x: rx,      col: t.phaseB, name: 'B' },
      { x: rx + 70, col: t.phaseC, name: 'C' }
    ];

    phases.forEach(function (p) {
      ctx.strokeStyle = p.col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 20, 42);
      ctx.lineTo(p.x, 68);
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(p.x, 76);
      ctx.lineTo(p.x, 96);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.x - 4, 105, 8, 35);
      for (var s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.arc(p.x, 112 + s * 9, 7, 0, Math.PI);
        ctx.stroke();
      }

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, 140);
      ctx.lineTo(p.x, 175);
      ctx.lineTo(rx + 12, 195 + (p.name === 'A' ? 0 : (p.name === 'B' ? 10 : 20)));
      ctx.stroke();
    });

    // Conduit Riser
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(rx + 8, 185, 12, groundY - 185 + 30);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(rx + 8, 185, 12, groundY - 185 + 30);

    [210, 260, 310].forEach(function (by) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(rx - 2, by, 12, 4);
    });

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rx + 14, groundY + 30);
    ctx.lineTo(rx + 120, groundY + 30);
    ctx.stroke();

    ctx.fillStyle = t.muted;
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('3φ Feeder Wire (33ft)', rx - 92, 52);
    ctx.fillText('100A Cutouts (30ft)', rx - 92, 86);
    ctx.fillText('Potheads & Cones (28ft)', rx - 92, 122);
    ctx.fillText('Conduit Riser (Pipe)', rx - 10, 235);
    ctx.fillText('To Padmount (Trench)', rx + 115, groundY + 22);

    // Right Card
    var cardX = 515, cardY = 56, cardW = 315, cardH = 310;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = t.primary;
    ctx.font = '500 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RISER POLE PHYSICS & COMPONENTS', cardX + 14, cardY + 20);

    var specsRiser = [
      { h: '1. Stress Cone Purpose', d: 'Flares electrical stress at cable shield cut' },
      { h: '2. Lightning MOV Arrester', d: 'Protects cable against surge reflections' },
      { h: '3. Mechanical Conduit', d: 'Sched 80 PVC / Steel shields from impacts' },
      { h: '4. Grounding Bonding', d: 'Concentric neutral bonded directly to MGN' },
      { h: '5. Direct Padmount Run', d: 'Feeds underground primary into green box' }
    ];

    var ry = cardY + 44;
    specsRiser.forEach(function (sp) {
      ctx.fillStyle = t.primary;
      ctx.font = '500 8.5px monospace';
      ctx.fillText(sp.h + ':', cardX + 14, ry);
      ry += 15;
      ctx.fillStyle = '#334155';
      ctx.font = '8px monospace';
      ctx.fillText(sp.d, cardX + 14, ry);
      ry += 22;
    });

    ctx.fillStyle = t.accent;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('BID4GRID APPARATUS SOURCING:', cardX + 14, cardY + 268);
    ctx.fillStyle = t.text;
    ctx.font = '8px monospace';
    ctx.fillText('IEEE 48 Class 1 Cold-Shrink Silicone Potheads', cardX + 14, cardY + 284);
    ctx.fillText('IEEE C62.11 Heavy-Duty 10kV MOV Arresters', cardX + 14, cardY + 298);

    var teleText = 'RISER POLE: 3φ Overhead Line → Class 1 Potheads with Stress Cones → Conduit Riser → Padmount Primary';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 7. TRANSFORMER BANK WIRING SCHEMATIC
  // =========================================================================
  function drawTransformerBank(canvas, bankData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;
    var wye = [['A', 'N'], ['B', 'N'], ['C', 'N']];
    var connections = {
      wye_wye: { name: 'WYE - WYE', primary: wye, secondary: wye },
      delta_wye: { name: 'DELTA - WYE', primary: [['A', 'C'], ['B', 'A'], ['C', 'B']], secondary: wye },
      open_delta: { name: 'OPEN DELTA - OPEN DELTA', primary: [['A', 'B'], ['B', 'C']], secondary: [['A', 'B'], ['B', 'C']] }
    };
    var selected = connections[bankData.bank_type];
    if (!selected) throw new Error('Unsupported transformer bank diagram: ' + bankData.bank_type);

    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('3-PHASE TRANSFORMER BANK CONNECTIONS: ' + selected.name, 20, 24);
    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.fillText('Matched T numbers are separate windings of the same transformer; H1 and X1 are corresponding polarity ends.', 20, 39);

    function drawSide(x, title, branches, prefix) {
      var busX = { A: x + 26, B: x + 48, C: x + 70, N: x + 340 };
      var colors = { A: t.phaseA, B: t.phaseB, C: t.phaseC };
      var isWye = branches[0][1] === 'N';

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.fillRect(x, 52, 396, 279);
      ctx.strokeRect(x, 52, 396, 279);
      ctx.fillStyle = t.primary;
      ctx.font = '500 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 12, 68);

      ['A', 'B', 'C'].forEach(function (phase) {
        ctx.strokeStyle = colors[phase];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(busX[phase], 86);
        ctx.lineTo(busX[phase], 304);
        ctx.stroke();
        ctx.fillStyle = phase === 'C' ? t.textBlue : colors[phase];
        ctx.font = '500 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(phase, busX[phase], 82);
      });

      if (isWye) {
        ctx.strokeStyle = t.ground;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(busX.N, 105);
        ctx.lineTo(busX.N, 302);
        ctx.stroke();
        ctx.fillStyle = t.ground;
        ctx.font = '500 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(prefix === 'H' ? 'N pri' : 'N sec', busX.N, 99);
        drawGroundSymbol(ctx, busX.N, 302, 12);
      }

      branches.forEach(function (branch, i) {
        var y = 124 + i * 74;
        var start = x + 145, end = x + 205, returnX = x + 330;
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(busX[branch[0]], y);
        ctx.lineTo(start, y);
        for (var loop = 0; loop < 4; loop++) {
          var lx = start + loop * 15;
          ctx.bezierCurveTo(lx, y - 10, lx + 15, y - 10, lx + 15, y);
        }
        ctx.lineTo(isWye ? busX.N : returnX, y);
        if (!isWye) {
          ctx.lineTo(returnX, y + 22);
          ctx.lineTo(busX[branch[1]], y + 22);
        }
        ctx.stroke();

        [ [busX[branch[0]], y], [busX[branch[1]], isWye ? y : y + 22] ].forEach(function (point) {
          ctx.fillStyle = t.primary;
          ctx.beginPath();
          ctx.arc(point[0], point[1], 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = t.primary;
        ctx.font = '500 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('T' + (i + 1), (start + end) / 2, y - 16);
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(prefix + '1 •', start - 4, y - 7);
        ctx.textAlign = 'left';
        ctx.fillText(prefix + '2', end + 4, y - 7);
      });

      if (branches.length === 2) {
        ctx.fillStyle = t.muted;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No third winding (open A-C side)', x + 220, 290);
      }
    }

    drawSide(16, 'PRIMARY  ' + bankData.primary_kV + ' kV L-L', selected.primary, 'H');
    drawSide(438, 'SECONDARY  ' + bankData.sec_VLL.toFixed(0) + ' V L-L', selected.secondary, 'X');

    ctx.fillStyle = t.muted;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Dots on buses are junctions; crossings without dots are not connected. Wye neutrals are grounded.', 20, 348);
    ctx.fillText('Two-terminal windings shown; center taps, delta grounding and protection are not shown.', 20, 363);

    var teleText = bankData.num_cans + ' × ' + bankData.can_kVA + ' kVA | Bank: ' + bankData.total_bank_kVA.toFixed(1) + ' kVA | Load: ' + bankData.load_kW + ' kW | Line current: ' + bankData.line_I_A.toFixed(1) + ' A | Loading: ' + bankData.loading_pct.toFixed(1) + '% | LV shift: ' + bankData.phase_shift_deg + '°';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 8. 240V 4-WIRE HIGH-LEG DELTA CAD
  // =========================================================================
  function drawHighLegDelta(canvas, bankData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('240V 4-WIRE HIGH-LEG (WILD-LEG) DELTA SERVICE (NEC 110.15 / TOPIC 11)', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Center-tapped A-C leg supplies 120V; Phase B is the 208V High-Leg (MUST BE ORANGE)', 20, 38);

    var current_A = (bankData && bankData.line_I_A) ? bankData.line_I_A : 240.6;
    var load_kW = (bankData && bankData.load_kW) ? bankData.load_kW : 90;
    var load_pct = (bankData && bankData.loading_pct) ? bankData.loading_pct : 66.7;
    var bank_kVA = (bankData && bankData.total_bank_kVA) ? bankData.total_bank_kVA : 150;

    var txX = 225, txY = 195, side = 175;
    var halfSide = side / 2;
    var alt = (side * Math.sqrt(3)) / 2;

    var pA = { x: txX - halfSide, y: txY + alt / 3 };
    var pC = { x: txX + halfSide, y: txY + alt / 3 };
    var pB = { x: txX, y: txY - (2 * alt) / 3 };
    var pN = { x: txX, y: txY + alt / 3 };

    // Draw Delta Coils (Clean Navy #1f3a5f)
    ctx.strokeStyle = t.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.closePath();
    ctx.stroke();

    // Center-Tap Neutral (N)
    ctx.fillStyle = t.ground;
    ctx.beginPath();
    ctx.arc(pN.x, pN.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    drawGroundSymbol(ctx, pN.x, pN.y + 6, 12);

    // High-Leg Vector line from Neutral to Phase B (Warm Amber-Orange dashed line)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pN.x, pN.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // ==========================================
    // VERTEX TERMINALS A, B, C & CLEAR AMBER/BLUE TEXT
    // Generous spacing between circles & text, with bold legible letters!
    // ==========================================

    // Terminal Circle A (Navy with crisp white 'A')
    ctx.fillStyle = t.primary;
    ctx.beginPath(); ctx.arc(pA.x, pA.y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 8.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', pA.x, pA.y);

    // Terminal Circle C (Azure Blue with crisp white 'C')
    ctx.fillStyle = t.phaseC;
    ctx.beginPath(); ctx.arc(pC.x, pC.y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 8.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', pC.x, pC.y);

    // Terminal Circle B (High Leg - Designated Utility Orange with crisp white 'B')
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.arc(pB.x, pB.y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 8.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', pB.x, pB.y);

    ctx.textBaseline = 'alphabetic'; // Reset baseline

    // Text for Phase A (Ample room to the left: pA.x - 14)
    ctx.fillStyle = t.primary;
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Phase A (120V to N)', pA.x - 14, pA.y - 4);
    ctx.fillStyle = t.textBlue;
    ctx.font = '500 9px ui-monospace, Menlo, monospace';
    ctx.fillText('I_A = ' + current_A.toFixed(1) + ' A', pA.x - 14, pA.y + 10);

    // Text for Phase C (Ample room to the right: pC.x + 14)
    ctx.fillStyle = t.textBlue;
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Phase C (120V to N)', pC.x + 14, pC.y - 4);
    ctx.font = '500 9px ui-monospace, Menlo, monospace';
    ctx.fillText('I_C = ' + current_A.toFixed(1) + ' A', pC.x + 14, pC.y + 10);

    // Neutral Text
    ctx.fillStyle = t.ground;
    ctx.textAlign = 'center';
    ctx.font = '500 9.5px system-ui, -apple-system, sans-serif';
    ctx.fillText('Neutral N (0V)', pN.x, pN.y + 32);

    // Text for Phase B (Placed comfortably ABOVE the circle)
    ctx.fillStyle = '#b45309';
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHASE B HIGH-LEG = 208 V to Neutral (Orange)', pB.x, pB.y - 27);
    ctx.font = '500 9.5px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#d97706';
    ctx.fillText('I_B = ' + current_A.toFixed(1) + ' A | V_BN = 120 × √3 = 208 V', pB.x, pB.y - 14);

    // Active 3-Phase Commercial Load Readout
    ctx.fillStyle = t.primary;
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3φ LOAD: ' + load_kW + ' kW', 24, pN.y - 45);
    ctx.font = '500 9px ui-monospace, Menlo, monospace';
    ctx.fillStyle = t.muted;
    ctx.fillText(load_pct.toFixed(1) + '% of ' + bank_kVA.toFixed(0) + ' kVA Bank', 24, pN.y - 32);

    // Span Voltage Annotations
    ctx.fillStyle = t.primary;
    ctx.font = '500 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('240V L-L', (pA.x + pB.x) / 2 - 25, (pA.y + pB.y) / 2);
    ctx.fillText('240V L-L', (pC.x + pB.x) / 2 + 25, (pC.y + pB.y) / 2);

    // ==========================================
    // ELEGANT WARNING CARD (NO HARSH RED / PURE WHITE & AMBER)
    // ==========================================
    var cardX = 485, cardY = 52, cardW = 350, cardH = 315;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Subtle Amber Accent Bar on Top of Card (4px)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cardX, cardY, cardW, 4);

    // Header with clean amber chip
    ctx.fillStyle = '#1e293b';
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NEC 110.15 SAFETY & APPLICATION CODE', cardX + 14, cardY + 22);

    var warnings = [
      { h: '1. Orange Marking Rule (NEC 110.15)', d: ['Phase B (208V to neutral) MUST be tagged with orange', 'tape or finish at all disconnects and panelboards.'] },
      { h: '2. 120V Overvoltage Hazard', d: ['Connecting 120V equipment to Phase B applies 208V,', 'causing immediate equipment burnout and fire hazard!'] },
      { h: '3. Allowed Voltage Matrix', d: ['• 120V 1φ: Phase A to Neutral or Phase C to Neutral.', '• 240V 1φ: Across Phase A to Phase C.', '• 240V 3φ: Across all three Phases A, B, and C.'] },
      { h: '4. Commercial Machine Shop Role', d: ['Supplies 240V 3φ motor power (I = ' + current_A.toFixed(1) + ' A)', 'while powering 120V receptacles simultaneously.'] }
    ];

    var wy = cardY + 44;
    warnings.forEach(function (wItem) {
      ctx.fillStyle = '#b45309';
      ctx.font = '500 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(wItem.h, cardX + 14, wy);
      wy += 14;

      ctx.fillStyle = '#334155';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      wItem.d.forEach(function (ln) {
        ctx.fillText(ln, cardX + 14, wy);
        wy += 12;
      });
      wy += 4;
    });

    var teleText = 'HIGH-LEG DELTA: Load = ' + load_kW + ' kW | I_3φ = ' + current_A.toFixed(1) + ' A @ 240V | Bank: ' + bank_kVA.toFixed(0) + ' kVA (' + load_pct.toFixed(1) + '% Loaded) | V_BN = 208V (Orange)';
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // 9. URBAN SECONDARY NETWORK SYSTEM & NETWORK PROTECTORS
  // =========================================================================
  function drawSecondaryNetwork(canvas, netData) {
    var c = initCanvas(canvas);
    var ctx = c.ctx, w = c.w, h = c.h, t = c.t;

    ctx.fillStyle = t.primary;
    ctx.font = '500 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('URBAN SECONDARY NETWORK SYSTEM: MESH GRID & NETWORK PROTECTORS (TOPIC 7)', 20, 24);

    ctx.fillStyle = t.muted;
    ctx.font = '9.5px monospace';
    ctx.fillText('Dual 13.2kV Primary Feeders, Vault Transformers & Reverse-Power Tripping Protection', 20, 38);

    var f1 = netData.feeder1;
    var f2 = netData.feeder2;

    ctx.strokeStyle = f1.active ? t.phaseA : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 75);
    ctx.lineTo(480, 75);
    ctx.stroke();

    ctx.fillStyle = f1.active ? t.phaseA : t.muted;
    ctx.font = '500 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PRIMARY FEEDER 1 (13.2 kV) ── ' + f1.status.toUpperCase(), 40, 68);

    ctx.strokeStyle = f2.active ? t.phaseC : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 125);
    ctx.lineTo(480, 125);
    ctx.stroke();

    ctx.fillStyle = f2.active ? t.textBlue : t.muted;
    ctx.font = '500 8px monospace';
    ctx.fillText('PRIMARY FEEDER 2 (13.2 kV) ── ' + f2.status.toUpperCase(), 220, 118);

    var vXs = [140, 350];
    var vYs = 190, vW = 140, vH = 90;

    for (var v = 0; v < 2; v++) {
      var vx = vXs[v];
      var isFeederActive = v === 0 ? f1.active : f2.active;
      var prot = v === 0 ? netData.protector1 : netData.protector2;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(vx - vW / 2, vYs - vH / 2, vW, vH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx - vW / 2, vYs - vH / 2, vW, vH);

      ctx.fillStyle = t.muted;
      ctx.font = '500 7.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('VAULT ' + (v + 1), vx - vW / 2 + 6, vYs - vH / 2 + 12);

      drawTransformerSymbol(ctx, vx - 25, vYs + 4, 11, isFeederActive ? t.primary : '#94a3b8');

      var px = vx + 30, py = vYs + 4;
      ctx.fillStyle = prot.reverse_power_trip ? '#fee2e2' : '#dcfce7';
      ctx.strokeStyle = prot.reverse_power_trip ? '#b91c1c' : '#15803d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 14, py - 14, 28, 28);
      ctx.fillRect(px - 14, py - 14, 28, 28);

      ctx.fillStyle = prot.reverse_power_trip ? '#b91c1c' : '#15803d';
      ctx.font = '500 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(prot.reverse_power_trip ? 'TRIP' : 'ON', px, py + 2.5);

      ctx.strokeStyle = isFeederActive ? (v === 0 ? t.phaseA : t.phaseC) : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx - 25, v === 0 ? 75 : 125);
      ctx.lineTo(vx - 25, vYs - 7);
      ctx.stroke();

      ctx.strokeStyle = isFeederActive ? t.primary : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(vx - 8, py);
      ctx.lineTo(px - 14, py);
      ctx.stroke();

      ctx.strokeStyle = prot.reverse_power_trip ? '#cbd5e1' : t.activeLine;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px + 14, py);
      ctx.lineTo(px + 30, py);
      ctx.lineTo(px + 30, 310);
      ctx.stroke();
    }

    ctx.strokeStyle = netData.secondary_grid.grid_interrupted ? '#dc2626' : t.busbar;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(35, 310);
    ctx.lineTo(480, 310);
    ctx.stroke();

    ctx.fillStyle = t.text;
    ctx.font = '500 8.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SECONDARY MESH GRID (120/208V REDUNDANT COLLECTOR)', 40, 376);

    var bXs = [80, 245, 420];
    bXs.forEach(function (bx) {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      ctx.fillRect(bx - 22, 336, 44, 28);
      ctx.strokeRect(bx - 22, 336, 44, 28);

      ctx.fillStyle = t.primary;
      ctx.font = '500 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BUILDING', bx, 350);
      ctx.font = '6.5px monospace';
      ctx.fillStyle = netData.secondary_grid.grid_interrupted ? t.danger : t.muted;
      ctx.fillText(netData.secondary_grid.grid_interrupted ? 'OUT' : '100% On', bx, 360);

      ctx.strokeStyle = t.busbar;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, 310);
      ctx.lineTo(bx, 336);
      ctx.stroke();
    });

    var cardX = 510, cardY = 56, cardW = 320, cardH = 310;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = t.primary;
    ctx.font = '500 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SECONDARY NETWORK TELEMETRY', cardX + 14, cardY + 20);

    var g = netData.secondary_grid;
    var netSpecs = [
      { label: 'Grid Architecture', val: 'Downtown Urban Secondary Mesh' },
      { label: 'Secondary Voltage', val: '120/208V 3φ 4-Wire Network' },
      { label: 'Total Grid Load', val: g.total_load_MVA + ' MVA Demand' },
      { label: 'Active Feeders', val: g.active_transformers + ' of 2 Primary Feeders' },
      { label: 'Transformer Load', val: g.load_per_xfmr_kVA.toFixed(0) + ' kVA (' + g.xfmr_load_pct.toFixed(1) + '%)' },
      { label: 'Protector Relay', val: 'Directional Reverse Power (P < 0)' },
      { label: 'Trip Speed', val: '2 to 5 Cycles (Ultra-Fast)' },
      { label: 'Contingency Status', val: g.grid_interrupted ? 'Interrupted (No Active Feeders)' : (g.is_contingency_n_minus_1 ? 'N-1 Active (Zero Outage)' : 'Normal Dual Feed') }
    ];

    var ny = cardY + 42;
    netSpecs.forEach(function (sp) {
      ctx.fillStyle = t.muted;
      ctx.font = '8px monospace';
      ctx.fillText(sp.label + ':', cardX + 14, ny);
      ctx.fillStyle = t.text;
      ctx.font = '500 8.5px monospace';
      ctx.fillText(sp.val, cardX + 120, ny);
      ny += 22;
    });

    ctx.fillStyle = t.accent;
    ctx.font = '500 8.5px monospace';
    ctx.fillText('BID4GRID APPARATUS SOURCING:', cardX + 14, cardY + 268);
    ctx.fillStyle = t.text;
    ctx.font = '8px monospace';
    ctx.fillText('Submersible Transformers (IEEE C57.12.40)', cardX + 14, cardY + 284);
    ctx.fillText('Eaton CM52 / GE Protectors (IEEE C37.51)', cardX + 14, cardY + 298);

    var teleText = 'SECONDARY NETWORK: ' + g.active_transformers + '/2 Feeders Active | ' + g.total_load_MVA + ' MVA Demand | Customer Continuity: ' + (g.grid_interrupted ? '0% (Interrupted)' : '100%') + (g.is_contingency_n_minus_1 ? ' | N-1 Active' : '');
    drawTelemetryBar(ctx, w, h, teleText);
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================
  root.DistDraw = {
    drawGridCascade: drawGridCascade,
    drawVoltageProfile: drawVoltageProfile,
    drawSplitPhaseDiagram: drawSplitPhaseDiagram,
    drawPoleFraming: drawPoleFraming,
    drawPadmountEnclosure: drawPadmountEnclosure,
    drawRiserPole: drawRiserPole,
    drawTransformerBank: drawTransformerBank,
    drawHighLegDelta: drawHighLegDelta,
    drawSecondaryNetwork: drawSecondaryNetwork
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.DistDraw;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
