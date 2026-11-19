# Power Systems Engineering CAD Calculator (Standalone)

Pure static engineering CAD web application: no server, no build step, no external dependencies. Everything runs directly in the browser.

Comprehensive engineering analysis suite covering fundamental through advanced power systems topics.

---

### Engineering Modules & CAD Schematics

1. **Basics & Balanced 3-Phase Systems**
   * **Calculations:** Complex power triangle ($P, Q, S$), 1-phase & 3-phase power factor correction capacitor sizing ($\Delta Q_{kvar}$), Wye (Y) vs. Delta ($\Delta$) line and phase voltage/current conversions, Delta-Wye impedance conversions.
   * **CAD Diagrams:** Full IEEE/IEC standard Single Line Diagram (SLD), Dynamic Power Triangle diagram with power factor angles, Polar coordinate 3-Phase phasor diagram ($V_a, V_b, V_c, I_a$).

2. **Synchronous Machines (P-δ Stability)**
   * **Calculations:** Cylindrical vs. Salient-Pole rotor generator models (two-reaction theory with $X_d$ and $X_q$), excitation EMF ($E_g \angle \delta$), torque angle, and steady-state stability limit ($P_{max}$).
   * **CAD Diagrams:** Real-time Power-Angle curve ($P$ vs. $\delta$) displaying fundamental power, reluctance torque, stability limit line, and operating point indicator.

3. **Power Transformers**
   * **Calculations:** Open-Circuit (OC) & Short-Circuit (SC) test parameter extraction ($R_c, X_m, R_{eq}, X_{eq}$), dynamic Voltage Regulation (VR%), and Efficiency ($\eta\%$) under variable load fraction and lagging/leading power factors.
   * **CAD Diagrams:** Approximate equivalent circuit with lumped series impedance and shunt branch, referred to the low-voltage side. Enter rated high/low voltages and test readings; full-load losses are scaled from the measured test conditions.

4. **Transmission Lines & Per-Unit System**
   * **Calculations:** Short, Medium Nominal $\pi$, Medium Nominal $T$, and Long Line (Hyperbolic $\sinh/\cosh$) ABCD transmission parameter matrices, Ferranti effect receiving-end no-load voltage rise, Surge Impedance Loading (SIL), and multi-zone Per-Unit base conversions. The line form accepts load power factor and lagging/leading behavior plus per-km shunt conductance and susceptance (in μS/km); defaults are 0.9 lagging, 0 conductance, and 3.3 μS/km susceptance.
   * **CAD Diagrams:** No-load voltage profile from sending end ($x=0$) to receiving end ($x=L$), using the selected model and holding sending voltage fixed. Nominal Pi and T models represent their shunt elements at the ends or midpoint. Length ranges are guidelines; unusual selections are flagged without changing the model.

5. **Power Flow Analysis (Load Flow)**
   * **Calculations:** Bus Admittance Matrix ($Y_{bus}$) formulation, Bus classifications (Slack, PV, PQ), Gauss-Seidel iterative solver, line branch active/reactive power flows ($P_{ij}, Q_{ij}$), and transmission losses.
   * **CAD Diagrams:** The 3-bus network shows calculated net bus injections (positive supplies power; negative consumes it), sending-end MW and direction for each line, and line losses. The bus matrix view displays the calculated bus voltages and injections alongside $Y_{bus}$; the matrix depends on the fixed lines, not the selected powers. Voltages use per-unit values on a 100 MVA system base; 1.00 pu is the reference voltage. Results are marked if the solver does not converge.

6. **Fault Analysis & Symmetrical Components**
   * **Calculations:** Symmetrical 3-phase faults, Fortescue transformation matrix ($A^{-1}$), sequence impedances ($Z_0, Z_1, Z_2$), and unsymmetrical fault currents for Single Line-to-Ground (SLG), Line-to-Line (L-L), and Double Line-to-Ground (DLG) faults.
   * **CAD Diagrams:** Symmetrical Sequence Networks interconnection schematic dynamically wiring $Z_1, Z_2, Z_0$ in Series (SLG), Parallel (L-L), or Series-Parallel (DLG), with calculated sequence magnitudes. Sequence reactances are per unit; zero values are accepted when the selected fault remains solvable. DLG results show total ground current, and equivalent fault MVA is not necessarily a breaker rating.

---

### Distribution Systems CAD

The Cascade and V-Profile tabs share their master inputs, including the substation voltage used by the pole and transformer bank. Changing the master customer load also sets the bank example's load; bank and high-leg controls share that example load but do not change the master load. The padmount, riser, network, and split-phase views are separate examples; padmount and network primary voltages are fixed at 13.2 kV. The neutral-current tile refers to the split-phase example, not the selected commercial service. A note in the master-model banner identifies the sharing behavior for the active tab.

The Cascade diagram distinguishes overhead and underground feeders and displays the selected service length, conductor size, and customer load. Customer service voltage is shown line-to-neutral, and service-drop calculations convert line-to-line drop to line-to-neutral voltage.

The transformer-bank diagram shows idealized two-terminal windings, with matching T numbers and corresponding H1/X1 polarity ends. Wye neutrals are grounded; the open-delta example is three-wire without a center tap. Delta grounding and protective equipment are omitted. Verify actual transformer terminal markings, polarity, grounding, and utility requirements before wiring equipment.

### Quick Start & Testing

* **Run in browser:** Open `index.html` directly or run:
  ```bash
  npx serve .
  # or: python3 -m http.server 8000
  ```
* **Run Headless Core Tests:**
  ```bash
  node tests/run.js
  node tests/run-dist.js
  ```
  *(Automated tests verify calculations and diagram rendering.)*
