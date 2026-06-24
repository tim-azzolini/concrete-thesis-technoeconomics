import { C, SF_PER_PANEL, PANELS_PER_TRUCK, MASS_PC_KG, MASS_SC_KG, EC_PC, EC_SC, TRUCK_COST_PER_KM } from "../model/costEngine.js";

function Formula({ children }) {
  return (
    <pre style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      color: C.t1,
      fontFamily: "monospace",
      fontSize: 11,
      lineHeight: 1.6,
      margin: "8px 0 14px",
      overflowX: "auto",
      padding: "12px 14px",
      whiteSpace: "pre-wrap",
    }}>
      {children}
    </pre>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ color: C.sc, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ color: C.t2, fontSize: 12, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function ExampleRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11, marginBottom: 4 }}>
      <span style={{ color: C.t2 }}>{label}</span>
      <span style={{ color: C.t1 }}>{value}</span>
    </div>
  );
}

export default function MethodologyTab({ params, costs }) {
  const { vol, carbonPrice, distKm, plantRate, concPrice, foamPrem } = params;
  const c = costs;

  return (
    <div style={{ maxWidth: 900 }}>
      <p style={{ color: C.t2, fontSize: 12, lineHeight: 1.6, margin: "0 0 16px" }}>
        All three wall systems are compared on a common basis: total installed cost per {SF_PER_PANEL} sf panel
        (4'×4' equivalent). The cost engine computes manufacturing, transport, site materials, and labor for each system,
        then applies a carbon credit to Second Cast based on paper-anchored LCA values.
      </p>

      <Section title="1. Normalization unit">
        <p>Every cost output is expressed per panel:</p>
        <Formula>{`panel_area = ${SF_PER_PANEL} sf  (4' × 4')
cost_per_sf = total_cost / ${SF_PER_PANEL}`}</Formula>
      </Section>

      <Section title="2. Shared transport">
        <p>Transport cost is derived from flatbed rate, one-way distance, and truck capacity from the paper (Figure 9):</p>
        <Formula>{`truckRun = TRUCK_COST_PER_KM × distKm
         = ${TRUCK_COST_PER_KM} × ${distKm} = $${c.truckRun.toFixed(2)}

tBase = truckRun / PANELS_PER_TRUCK
      = ${c.truckRun.toFixed(2)} / ${PANELS_PER_TRUCK} = $${c.tBase.toFixed(2)}/panel

SC transport (weight-scaled):
t_SC = tBase × (MASS_SC / MASS_PC)
     = ${c.tBase.toFixed(2)} × (${MASS_SC_KG}/${MASS_PC_KG}) = $${c.sc.transport.toFixed(2)}/panel`}</Formula>
      </Section>

      <Section title="3. CMU wall system">
        <p>Seven-material on-site assembly (Fig. 10). All layers built in the field:</p>
        <Formula>{`cmu_block   = ${SF_PER_PANEL} sf × $10.50/sf
cmu_extra   = ${SF_PER_PANEL} sf × $5.90/sf   (insul + furring + gyp + WB)
cmu_finish  = ${SF_PER_PANEL} sf × $1.50/sf
siteRate    = plantRate × 1.85 = $${plantRate} × 1.85 = $${c.siteRate.toFixed(2)}/hr
cmu_labor   = ${SF_PER_PANEL} sf × siteRate × 0.16 hr/sf
cmuTotal    = block + extra + finish + labor + $18 delivery

→ CMU total = $${Math.round(c.cmu.total)}/panel ($${(c.cmu.total / SF_PER_PANEL).toFixed(2)}/sf)`}</Formula>
      </Section>

      <Section title="4. Standard precast">
        <p>Factory-cast panel still requires full finish system on site:</p>
        <Formula>{`concVol     = MASS_PC / 2200 = ${MASS_PC_KG} / 2200 = ${(MASS_PC_KG / 2200).toFixed(4)} m³
pc_formwork = $500 / min(vol, 200) = $${c.pc_formwork.toFixed(2)}
pc_mfg      = concVol × concPrice + $2 + formwork + plantRate×1.5 + $15
pc_site_mat = ${SF_PER_PANEL} sf × ($5.90 + $1.50)/sf
pc_site_labor = siteRate × 0.45 hr
pcTotal     = mfg + transport + site_mat + site_labor

→ Precast total = $${Math.round(c.pc.total)}/panel ($${(c.pc.total / SF_PER_PANEL).toFixed(2)}/sf)`}</Formula>
      </Section>

      <Section title="5. Second Cast">
        <p>Four-material integrated panel. Foam-crete zones eliminate separate insulation/furring layers:</p>
        <Formula>{`sc_concVol  = (MASS_SC × 0.75) / 2200 = ${c.sc_concVol.toFixed(4)} m³
sc_foamVol  = (MASS_SC × 0.25) / 800  = ${c.sc_foamVol.toFixed(4)} m³
foamPrice   = concPrice × (1 + foamPrem/100) = $${c.foamPrice.toFixed(2)}/m³
sc_form_ply = $800 / min(vol, 200) = $${c.sc_form_ply.toFixed(2)}
sc_form_foam= $150 / min(vol, 15)  = $${c.sc_form_foam.toFixed(2)}
sc_design   = $2500 / max(vol, 25) = $${c.sc_design.toFixed(2)}
sc_mfg      = concVol×concPrice + foamVol×foamPrice + $6.50
              + form_ply + form_foam + plantRate×2.25 + design + $15
sc_site_mat = ${SF_PER_PANEL} sf × $1.50/sf  (finishes only)
sc_site_labor = siteRate × 0.35 hr
scTotal     = mfg + transport + site_mat + site_labor

→ Second Cast total = $${Math.round(c.sc.total)}/panel ($${(c.sc.total / SF_PER_PANEL).toFixed(2)}/sf)`}</Formula>
      </Section>

      <Section title="6. Carbon credit">
        <Formula>{`EC_PC       = ${EC_PC} kgCO₂e/panel  (baseline, from paper)
EC_SC       = ${EC_SC} kgCO₂e/panel  (Second Cast, from paper)
ecSavings   = EC_PC − EC_SC = ${c.ecSavings.toFixed(2)} kgCO₂e/panel
carbonCredit = (ecSavings / 1000) × carbonPrice
             = (${c.ecSavings.toFixed(2)} / 1000) × $${carbonPrice} = $${c.carbonCredit.toFixed(2)}/panel
scNet       = scTotal − carbonCredit = $${Math.round(c.scNet)}/panel`}</Formula>
      </Section>

      <Section title="7. Scale curve">
        <p>Fixed costs amortize over annual production volume. At low volume, per-panel design and formwork dominate:</p>
        <Formula>{`formwork_amort = fixed_cost / min(annual_vol, max_uses)
design_amort   = $2,500 / max(annual_vol, 25)

At vol = ${vol} panels/yr:
  plywood formwork  = $${c.sc_form_ply.toFixed(2)}/panel
  foam inserts      = $${c.sc_form_foam.toFixed(2)}/panel
  computational design = $${c.sc_design.toFixed(2)}/panel`}</Formula>
      </Section>

      <Section title="8. Paper-anchored vs adjustable inputs">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ color: C.t1, fontWeight: 600, marginBottom: 8, fontSize: 11 }}>From paper (locked)</div>
            {[
              `Panel area: ${SF_PER_PANEL} sf`,
              `Truck capacity: ${PANELS_PER_TRUCK} panels`,
              `Mass: ${MASS_SC_KG} kg SC / ${MASS_PC_KG} kg PC`,
              `Embodied carbon: ${EC_PC} / ${EC_SC} kgCO₂e`,
              `Material assemblies: Fig. 10`,
            ].map((item, i) => (
              <div key={i} style={{ color: C.t3, fontSize: 11, marginBottom: 4 }}>• {item}</div>
            ))}
          </div>
          <div>
            <div style={{ color: C.t1, fontWeight: 600, marginBottom: 8, fontSize: 11 }}>Adjustable (sliders)</div>
            <ExampleRow label="Production volume" value={`${vol} panels/yr`} />
            <ExampleRow label="Carbon price" value={`$${carbonPrice}/tCO₂e`} />
            <ExampleRow label="Transport distance" value={`${distKm} km`} />
            <ExampleRow label="Plant labor rate" value={`$${plantRate}/hr`} />
            <ExampleRow label="Concrete price" value={`$${concPrice}/m³`} />
            <ExampleRow label="Foam-crete premium" value={`+${foamPrem}%`} />
          </div>
        </div>
      </Section>
    </div>
  );
}
