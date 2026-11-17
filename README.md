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
   * **CAD Diagrams:** Complete exact T-equivalent electrical circuit diagram labeled with extracted impedances and turns ratio.

4. **Transmission Lines & Per-Unit System**
   * **Calculations:** Short, Medium Nominal $\pi$, Medium Nominal $T$, and Long Line (Hyperbolic $\sinh/\cosh$) ABCD transmission parameter matrices, Ferranti effect receiving-end no-load voltage rise, Surge Impedance Loading (SIL), and multi-zone Per-Unit base conversions.
   * **CAD Diagrams:** Voltage profile along the line from sending end ($x=0$) to receiving end ($x=L$) highlighting no-load Ferranti voltage rise vs. SIL flat profile.

5. **Power Flow Analysis (Load Flow)**
   * **Calculations:** Bus Admittance Matrix ($Y_{bus}$) formulation, Bus classifications (Slack, PV, PQ), Gauss-Seidel iterative solver, line branch active/reactive power flows ($P_{ij}, Q_{ij}$), and transmission losses.
   * **CAD Diagrams:** Interactive 3-bus network Single Line Diagram with busbars, generator/load icons, bus voltage tags, and real-time active power transmission losses.

6. **Fault Analysis & Symmetrical Components**
   * **Calculations:** Symmetrical 3-phase faults, Fortescue transformation matrix ($A^{-1}$), sequence impedances ($Z_0, Z_1, Z_2$), and unsymmetrical fault currents for Single Line-to-Ground (SLG), Line-to-Line (L-L), and Double Line-to-Ground (DLG) faults.
   * **CAD Diagrams:** Symmetrical Sequence Networks interconnection schematic dynamically wiring $Z_1, Z_2, Z_0$ in Series (SLG), Parallel (L-L), or Series-Parallel (DLG).

---

### Quick Start & Testing

* **Run in browser:** Open `index.html` directly or run:
  ```bash
  npx serve .
  # or: python3 -m http.server 8000
  ```
* **Run Headless Core Tests:**
  ```bash
  node tests/run.js
  ```
  *(42 automated test cases verifying mathematical accuracy against textbook standards).*
