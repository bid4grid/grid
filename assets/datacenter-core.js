(function (root) {
  'use strict';

  function numberInRange(value, name, min, max, integer) {
    if (typeof value !== 'number' || !Number.isFinite(value) ||
        value < min || value > max || (integer && !Number.isInteger(value))) {
      throw new RangeError(name + ' must be ' + (integer ? 'a whole number ' : '') +
        'between ' + min + ' and ' + max + '.');
    }
    return value;
  }

  function capacity(load, count, rating) {
    var normal = count * rating;
    var afterOneFailure = (count - 1) * rating;
    return {
      required_kVA: load,
      installed_kVA: normal,
      afterOneFailure_kVA: afterOneFailure,
      normalLoad_pct: load / normal * 100,
      normalAdequate: normal >= load,
      nMinusOneAdequate: afterOneFailure >= load,
      minimumForNMinusOne: Math.ceil(load / rating) + 1
    };
  }

  function calculate(input) {
    var racks = numberInRange(input.racks, 'Rack count', 1, 100000, true);
    var rackKW = numberInRange(input.rackKW, 'kW per rack', 0.01, 1000);
    var demand = numberInRange(input.demandPct, 'IT demand', 1, 100) / 100;
    var otherKW = numberInRange(input.otherKW, 'Non-UPS load', 0, 10000000);
    var upsEfficiency = numberInRange(input.upsEfficiencyPct, 'UPS efficiency', 1, 100) / 100;
    var upsPF = numberInRange(input.upsPF, 'UPS output power factor', 0.1, 1);
    var facilityPF = numberInRange(input.facilityPF, 'Facility power factor', 0.1, 1);
    var primaryKV = numberInRange(input.primaryKV, 'Primary voltage', 0.1, 500);
    var secondaryV = numberInRange(input.secondaryV, 'Secondary voltage', 100, 35000);
    var transformerCount = numberInRange(input.transformerCount, 'Transformer count', 1, 100, true);
    var transformerKVA = numberInRange(input.transformerKVA, 'Transformer rating', 1, 1000000);
    var upsCount = numberInRange(input.upsCount, 'UPS module count', 1, 100, true);
    var upsKVA = numberInRange(input.upsKVA, 'UPS module rating', 1, 1000000);
    var batteryKWh = numberInRange(input.batteryKWh, 'Usable battery energy', 0, 10000000);
    var batteryEfficiency = numberInRange(input.batteryEfficiencyPct, 'Battery-to-load efficiency', 1, 100) / 100;
    var targetMinutes = numberInRange(input.targetMinutes, 'Target runtime', 0, 10080);

    var itKW = racks * rackKW * demand;
    var upsInputKW = itKW / upsEfficiency;
    var facilityKW = upsInputKW + otherKW;
    var facilityKVA = facilityKW / facilityPF;
    var runtimeMinutes = batteryKWh * batteryEfficiency / itKW * 60;

    return {
      itKW: itKW,
      upsInputKW: upsInputKW,
      upsLossKW: upsInputKW - itKW,
      facilityKW: facilityKW,
      facilityKVA: facilityKVA,
      primaryCurrentA: facilityKVA / (Math.sqrt(3) * primaryKV),
      secondaryCurrentA: facilityKVA * 1000 / (Math.sqrt(3) * secondaryV),
      transformer: capacity(facilityKVA, transformerCount, transformerKVA),
      ups: capacity(itKW / upsPF, upsCount, upsKVA),
      battery: {
        runtimeMinutes: runtimeMinutes,
        requiredUsableKWh: itKW * targetMinutes / 60 / batteryEfficiency,
        targetMet: runtimeMinutes >= targetMinutes
      }
    };
  }

  var api = { calculate: calculate };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.DataCenterCore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
