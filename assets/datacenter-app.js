(function () {
  'use strict';

  var form = document.getElementById('dc-form');
  var results = document.getElementById('dc-results');
  var error = document.getElementById('dc-error');
  var diagram = document.getElementById('diagram-content');
  var diagramUnavailable = document.getElementById('diagram-unavailable');
  var summary = document.getElementById('dc-summary');
  var voltageWarning = document.getElementById('voltage-warning');

  function put(id, value) {
    document.getElementById(id).textContent = value;
  }

  function fmt(value) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function status(adequate) {
    return adequate ? 'Adequate' : 'Insufficient';
  }

  function showInvalid(message) {
    error.textContent = message;
    error.hidden = false;
    results.hidden = true;
    diagram.hidden = true;
    diagramUnavailable.hidden = false;
    summary.hidden = true;
    voltageWarning.hidden = true;
  }

  function update() {
    var values = {};
    for (var i = 0; i < form.elements.length; i++) {
      var field = form.elements[i];
      if (!field.name) continue;
      if (!field.validity.valid || field.value === '') {
        showInvalid('Check ' + field.parentElement.firstChild.textContent.trim() +
          ': enter ' + (field.step === '1' ? 'a whole number ' : 'a number ') +
          'from ' + field.min + ' to ' + field.max + '.');
        return;
      }
      values[field.name] = field.valueAsNumber;
    }
    var r;
    try {
      r = DataCenterCore.calculate(values);
    } catch (e) {
      if (!(e instanceof RangeError)) throw e;
      showInvalid(e.message);
      return;
    }
    error.hidden = true;
    results.hidden = false;
    diagram.hidden = false;
    diagramUnavailable.hidden = true;
    summary.hidden = false;
    voltageWarning.hidden = values.primaryKV * 1000 > values.secondaryV;
    put('tile-it', fmt(r.itKW) + ' kW');
    put('tile-facility', fmt(r.facilityKVA) + ' kVA');
    put('tile-voltage', fmt(values.primaryKV) + ' kV / ' + fmt(values.secondaryV) + ' V');
    put('tile-transformer', status(r.transformer.nMinusOneAdequate));
    put('tile-ups', status(r.ups.nMinusOneAdequate));
    put('tile-battery', fmt(r.battery.runtimeMinutes) + ' min');
    document.getElementById('tile-transformer-card').className = 'dist-tile ' + (r.transformer.nMinusOneAdequate ? 'green' : 'amber');
    document.getElementById('tile-ups-card').className = 'dist-tile' + (r.ups.nMinusOneAdequate ? '' : ' amber');
    document.getElementById('tile-battery-card').className = 'dist-tile ' + (r.battery.targetMet ? 'green' : 'amber');
    put('diagram-primary', fmt(values.primaryKV) + ' kV primary');
    put('diagram-transformer', fmt(values.transformerCount) + ' × ' + fmt(values.transformerKVA) + ' kVA');
    put('diagram-transformer-status', 'N−1 capacity: ' + status(r.transformer.nMinusOneAdequate));
    put('diagram-secondary', fmt(values.secondaryV) + ' V secondary');
    put('diagram-ups', fmt(values.upsCount) + ' × ' + fmt(values.upsKVA) + ' kVA');
    put('diagram-ups-status', 'N−1 kVA: ' + status(r.ups.nMinusOneAdequate));
    put('diagram-racks', fmt(values.racks) + ' racks');
    put('diagram-it', fmt(r.itKW) + ' kW demand');
    put('diagram-other', fmt(values.otherKW) + ' kW non-UPS');
    put('diagram-battery', fmt(values.batteryKWh) + ' kWh usable');
    put('diagram-runtime', fmt(r.battery.runtimeMinutes) + ' min estimated');
    put('itKW', fmt(r.itKW) + ' kW');
    put('upsInput', fmt(r.upsInputKW) + ' / ' + fmt(r.upsLossKW) + ' kW');
    put('facility', fmt(r.facilityKW) + ' kW / ' + fmt(r.facilityKVA) + ' kVA');
    put('currents', fmt(r.primaryCurrentA) + ' A / ' + fmt(r.secondaryCurrentA) + ' A');
    put('transformerCapacity', fmt(r.transformer.required_kVA) + ' / ' + fmt(r.transformer.installed_kVA) + ' kVA');
    put('transformerNormal', status(r.transformer.normalAdequate) + ' (' + fmt(r.transformer.normalLoad_pct) + '% loaded)');
    put('transformerN1', status(r.transformer.nMinusOneAdequate) + ' (' + fmt(r.transformer.afterOneFailure_kVA) + ' kVA available)');
    put('transformerMinimum', fmt(r.transformer.minimumForNMinusOne));
    put('upsCapacity', fmt(r.ups.required_kVA) + ' / ' + fmt(r.ups.installed_kVA) + ' kVA');
    put('upsNormal', status(r.ups.normalAdequate) + ' (' + fmt(r.ups.normalLoad_pct) + '% loaded)');
    put('upsN1', status(r.ups.nMinusOneAdequate) + ' (' + fmt(r.ups.afterOneFailure_kVA) + ' kVA available)');
    put('upsMinimum', fmt(r.ups.minimumForNMinusOne));
    put('runtime', fmt(r.battery.runtimeMinutes) + ' minutes');
    put('batteryRequired', fmt(r.battery.requiredUsableKWh) + ' kWh');
    put('batteryTarget', status(r.battery.targetMet));
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', function (event) { event.preventDefault(); update(); });
  update();
})();
