import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ─── Paper data ──────────────────────────────────────────────────────────────
const SF_PER_PANEL     = 16;           // 4'×4' panel area
const PANELS_PER_TRUCK = 26;           // from paper
const TRUCK_COST_PER_KM = 3.5;          // flatbed rate
const MASS_PC_KG       = 233;          // standard precast (from paper)
const MASS_SC_KG       = 156;          // Second Cast optimized, 25% foam-crete (from paper)
const EC_PC            = 103.32;       // kgCO₂e/panel - mfg + transport (from paper)
const EC_SC            = 73.07;        // kgCO₂e/panel - mfg + transport (from paper)

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0D1117",
  card:    "#161B22",
  border:  "#30363D",
  t1:      "#E6EDF3",   // primary text
  t2:      "#8B949E",   // secondary text
  t3:      "#484F58",   // muted text
  cmu:     "#6E7681",   // gray
  pc:      "#7C84E0",   // periwinkle
  sc:      "#3FB950",   // emerald
  scNet:   "#F0A742",   // amber
};

// ─── Cost engine ─────────────────────────────────────────────────────────────
function buildCosts({ vol, carbonPrice, distKm, plantRate, concPrice, foamPrem }) {
  const siteRate   = plantRate * 1.85;            // mason/install premium
  const foamPrice  = concPrice * (1 + foamPrem / 100);
  const truckRun   = TRUCK_COST_PER_KM * distKm;
  const tBase      = truckRun / PANELS_PER_TRUCK;  // $/panel base transport

  // ── CMU wall system (7 materials, full on-site assembly) ───────────────────
  // Fig 10: finish, WB, hat channel, gyp, furring, CMU block, rigid insulation
  const cmu_block   = SF_PER_PANEL * 10.50;   // CMU + mortar
  const cmu_extra   = SF_PER_PANEL * 5.90;    // insul + furring + gyp + WB: $1.75+1.00+1.25+0.90/sf
  const cmu_finish  = SF_PER_PANEL * 1.50;    // int + ext finish
  const cmu_labor   = SF_PER_PANEL * siteRate * 0.16; // all on-site trades, 0.16 hr/sf
  const cmu_deliver = 18;
  const cmuTotal    = cmu_block + cmu_extra + cmu_finish + cmu_labor + cmu_deliver;

  // ── Standard precast panel + full finish system ────────────────────────────
  // Plain panel still needs insulation, furring, gypsum, WB on-site
  const concVol       = MASS_PC_KG / 2200;                    // m³
  const pc_formwork   = 500 / Math.min(vol, 200);             // $500 form, 200-use life
  const pc_mfg        = concVol * concPrice + 2 + pc_formwork + plantRate * 1.5 + 15;
  const pc_transport  = tBase;
  const pc_site_mat   = SF_PER_PANEL * 5.90 + SF_PER_PANEL * 1.50; // same finishes still needed
  const pc_site_labor = siteRate * 0.45;                       // install + site trades
  const pcTotal       = pc_mfg + pc_transport + pc_site_mat + pc_site_labor;

  // ── Second Cast (4 materials: ext finish + rubble agg + foam-crete + int finish) ──
  // Integrated thermal + acoustic = no separate insulation, furring, gyp, or WB needed
  const sc_concVol   = (MASS_SC_KG * 0.75) / 2200;             // concrete zones, m³
  const sc_foamVol   = (MASS_SC_KG * 0.25) / 800;              // foam-crete zones (~800 kg/m³), m³
  const sc_form_ply  = 800  / Math.min(vol, 200);               // plywood form, 200-use life
  const sc_form_foam = 150  / Math.min(vol, 15);                // foam inserts, 15-use life
  const sc_design    = 2500 / Math.max(vol, 25);                // Grasshopper/Peregrine design amortized
  const sc_mfg       = sc_concVol * concPrice + sc_foamVol * foamPrice + 6.50  // additives
                       + sc_form_ply + sc_form_foam + plantRate * 2.25          // two-part labor
                       + sc_design + 15;                                         // overhead
  const sc_transport  = tBase * (MASS_SC_KG / MASS_PC_KG);    // weight-proportional fuel savings
  const sc_site_mat   = SF_PER_PANEL * 1.50;                   // finishes only
  const sc_site_labor = siteRate * 0.35;                        // lighter panel, simpler erection
  const scTotal       = sc_mfg + sc_transport + sc_site_mat + sc_site_labor;

  // ── Carbon ─────────────────────────────────────────────────────────────────
  const ecSavings    = EC_PC - EC_SC;                           // 30.25 kgCO₂e/panel
  const carbonCredit = (ecSavings / 1000) * carbonPrice;
  const scNet        = scTotal - carbonCredit;

  return {
    cmu:     { total: cmuTotal,   block: cmu_block, extra: cmu_extra, finish: cmu_finish, labor: cmu_labor,       transport: cmu_deliver },
    pc:      { total: pcTotal,    panel: pc_mfg,    extra: pc_site_mat,                  labor: pc_site_labor,    transport: pc_transport },
    sc:      { total: scTotal,    net: scNet,        panel: sc_mfg,   finish: sc_site_mat, labor: sc_site_labor,  transport: sc_transport },
    ecSavings,
    carbonCredit,
    scNet,
    siteRate,
  };
}

// ─── Components ──────────────────────────────────────────────────────────────
function Slider({ label, value, setValue, min, max, step, fmt, note }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: C.t2, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>{label}</span>
        <span style={{ color: C.sc, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{fmt(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(+e.target.value)}
        style={{ width: "100%", cursor: "pointer", accentColor: C.sc, height: 3 }}
      />
      {note && <div style={{ color: C.t3, fontSize: 10, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ color: color || C.t1, fontSize: 21, fontWeight: 700, margin: "6px 0 3px", fontFamily: "monospace", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ color: C.t2, fontSize: 11 }}>{sub}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SecondCastModel() {
  const [vol,        setVol]        = useState(200);
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [distKm,     setDistKm]     = useState(150);
  const [plantRate,  setPlantRate]  = useState(35);
  const [concPrice,  setConcPrice]  = useState(110);
  const [foamPrem,   setFoamPrem]   = useState(20);
  const [projSF,     setProjSF]     = useState(10000);

  const p = { vol, carbonPrice, distKm, plantRate, concPrice, foamPrem };
  const c = useMemo(() => buildCosts(p), [vol, carbonPrice, distKm, plantRate, concPrice, foamPrem]);

  const projPanels    = Math.ceil(projSF / SF_PER_PANEL);
  const savVsCMU      = (c.cmu.total - c.sc.total) * projPanels;
  const savVsPC       = (c.pc.total  - c.sc.total) * projPanels;
  const scPremPct     = ((c.sc.total - c.pc.total) / c.pc.total * 100).toFixed(0);
  const scSavCMUpct   = ((c.cmu.total - c.sc.total) / c.cmu.total * 100).toFixed(0);
  const scBeatsPC     = c.sc.total <= c.pc.total;

  // ── Scale curve data ────────────────────────────────────────────────────────
  const scalePts = [25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000];
  const scaleData = scalePts.map(v => {
    const x = buildCosts({ ...p, vol: v });
    return {
      vol: v,
      "Second Cast":      Math.round(x.sc.total),
      "SC + Carbon":      Math.round(x.scNet),
      "Std Precast":      Math.round(x.pc.total),
    };
  });

  // ── Breakdown chart data ────────────────────────────────────────────────────
  const breakdownData = [
    {
      name: "CMU Wall",
      "Block/Masonry":   Math.round(c.cmu.block),
      "Extra Materials": Math.round(c.cmu.extra + c.cmu.finish),
      "Labor":           Math.round(c.cmu.labor),
      "Delivery":        Math.round(c.cmu.transport),
    },
    {
      name: "Std Precast",
      "Block/Masonry":   Math.round(c.pc.panel),
      "Extra Materials": Math.round(c.pc.extra),
      "Labor":           Math.round(c.pc.labor),
      "Delivery":        Math.round(c.pc.transport),
    },
    {
      name: "Second Cast",
      "Block/Masonry":   Math.round(c.sc.panel),
      "Extra Materials": Math.round(c.sc.finish),
      "Labor":           Math.round(c.sc.labor),
      "Delivery":        Math.round(c.sc.transport),
    },
  ];

  // ── Total bars ──────────────────────────────────────────────────────────────
  const totalData = [
    { name: "CMU Wall",        cost: Math.round(c.cmu.total), fill: C.cmu   },
    { name: "Std Precast",     cost: Math.round(c.pc.total),  fill: C.pc    },
    { name: "Second Cast",     cost: Math.round(c.sc.total),  fill: C.sc    },
    { name: "SC + Carbon Cr.", cost: Math.round(c.scNet),     fill: C.scNet },
  ];

  // ── Tooltip renderers ───────────────────────────────────────────────────────
  const singleTT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    return (
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: payload[0].fill, fontWeight: 700, fontSize: 12 }}>{label}</div>
        <div style={{ color: C.t1, fontSize: 20, fontWeight: 700, fontFamily: "monospace", margin: "4px 0 2px" }}>${Math.round(val)}</div>
        <div style={{ color: C.t2, fontSize: 11 }}>${(val / SF_PER_PANEL).toFixed(2)}/sf installed</div>
      </div>
    );
  };

  const stackedTT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((a, b) => a + (b.value || 0), 0);
    return (
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: C.t1, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{label}</div>
        {payload.map((p2, i) => (
          <div key={i} style={{ color: p2.fill, fontSize: 11, margin: "2px 0" }}>
            {p2.name}: <b>${Math.round(p2.value)}</b>
          </div>
        ))}
        <div style={{ color: C.t2, fontSize: 11, borderTop: `1px solid ${C.border}`, paddingTop: 5, marginTop: 5 }}>
          Total: <b>${Math.round(total)}</b> — ${(total / SF_PER_PANEL).toFixed(2)}/sf
        </div>
      </div>
    );
  };

  const lineTT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ color: C.t2, fontSize: 11, marginBottom: 5 }}>{label} panels/yr</div>
        {payload.map((p2, i) => (
          <div key={i} style={{ color: p2.stroke || C.t1, fontSize: 12, margin: "2px 0" }}>
            {p2.name}: <b>${Math.round(p2.value)}</b>
          </div>
        ))}
      </div>
    );
  };

  // ── Verdict ─────────────────────────────────────────────────────────────────
  const verdictText = scBeatsPC
    ? `At ${vol} panels/yr, Second Cast beats standard precast by ${Math.abs(scPremPct)}% and saves ${scSavCMUpct}% vs CMU.`
    : `At ${vol} panels/yr, Second Cast carries a ${scPremPct}% panel premium over precast — but still saves ${scSavCMUpct}% vs full CMU assembly.`;
  const verdictColor = scBeatsPC ? "#0D3320" : "#1C1507";
  const verdictBorder = scBeatsPC ? C.sc : C.scNet;
  const verdictTextColor = scBeatsPC ? "#3FB950" : "#F0A742";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "22px 26px", color: C.t1, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: C.sc, fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          ACADIA 2026 — Second Cast — Financial Viability Model
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Full Wall System Cost Analysis
        </h1>
        <p style={{ color: C.t2, margin: 0, maxWidth: 580, lineHeight: 1.5, fontSize: 12 }}>
          Three competing wall systems compared on full installed cost per 4'×4' panel equivalent.
          Anchored to paper data (mass, embodied carbon, truck capacity). All other inputs are
          adjustable assumptions — move sliders to stress-test the case.
        </p>
      </div>

      {/* Verdict banner */}
      <div style={{ background: verdictColor, border: `1px solid ${verdictBorder}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20 }}>
        <span style={{ color: verdictTextColor, fontSize: 13, fontWeight: 600 }}>
          {scBeatsPC ? "✓" : "△"} {verdictText}
        </span>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
        <KPI label="Second Cast / Panel" value={`$${Math.round(c.sc.total)}`} sub={`$${(c.sc.total / SF_PER_PANEL).toFixed(2)}/sf total system`} color={C.sc} />
        <KPI
          label="vs CMU Wall"
          value={`-$${Math.round(c.cmu.total - c.sc.total)}`}
          sub={`${scSavCMUpct}% cheaper per panel`}
          color="#3FB950"
        />
        <KPI
          label="vs Std Precast"
          value={`${scBeatsPC ? "-" : "+"}$${Math.round(Math.abs(c.sc.total - c.pc.total))}`}
          sub={`${Math.abs(+scPremPct)}% ${scBeatsPC ? "cheaper" : "premium"} per panel`}
          color={scBeatsPC ? "#3FB950" : C.scNet}
        />
        <KPI label="Carbon Savings" value={`${c.ecSavings.toFixed(0)} kg CO₂e`} sub={`= $${c.carbonCredit.toFixed(2)}/panel at $${carbonPrice}/tonne`} color={C.pc} />
      </div>

      {/* Main two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 14, marginBottom: 14 }}>

        {/* Input panel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
          <div style={{ color: C.sc, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>
            Adjust Assumptions
          </div>

          <Slider label="Production Volume" value={vol} setValue={setVol} min={25} max={2000} step={25}
            fmt={v => `${v} panels/yr`} note="Formwork + design amortization" />
          <Slider label="Carbon Price" value={carbonPrice} setValue={setCarbonPrice} min={0} max={200} step={10}
            fmt={v => `$${v}/tCO₂e`} note="Voluntary market ~$50-80 today" />
          <Slider label="Transport Distance" value={distKm} setValue={setDistKm} min={25} max={500} step={25}
            fmt={v => `${v} km`} note="Plant to site, one-way" />
          <Slider label="Plant Labor Rate" value={plantRate} setValue={setPlantRate} min={20} max={80} step={5}
            fmt={v => `$${v}/hr`} note={`Site/mason ≈ $${Math.round(plantRate * 1.85)}/hr`} />
          <Slider label="Concrete Price" value={concPrice} setValue={setConcPrice} min={60} max={220} step={10}
            fmt={v => `$${v}/m³`} note="Recycled aggregate ready-mix" />
          <Slider label="Foam-Crete Premium" value={foamPrem} setValue={setFoamPrem} min={0} max={100} step={5}
            fmt={v => `+${v}%`} note="vs concrete per m³ (additives)" />

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 6 }}>
            <Slider label="Project Wall Area" value={projSF} setValue={setProjSF} min={1000} max={50000} step={500}
              fmt={v => `${v.toLocaleString()} sf`} />
            <div style={{ background: "#0D2318", border: `1px solid #1A4830`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
              <div style={{ color: C.t2, fontSize: 11, marginBottom: 5 }}>{projPanels} panels required</div>
              <div style={{ color: C.sc, fontSize: 12, fontWeight: 700 }}>vs CMU: save ${(savVsCMU / 1000).toFixed(0)}k</div>
              <div style={{ color: savVsPC >= 0 ? C.sc : C.scNet, fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                vs Precast: {savVsPC >= 0 ? `save $${(savVsPC / 1000).toFixed(0)}k` : `$${(Math.abs(savVsPC) / 1000).toFixed(0)}k premium`}
              </div>
            </div>
          </div>

          {/* Key assumption note */}
          <div style={{ marginTop: 14, padding: "10px 12px", background: "#0D1B2A", border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Why SC avoids site materials
            </div>
            <div style={{ color: C.t2, fontSize: 10, lineHeight: 1.5 }}>
              Foam-crete zones provide integrated thermal, acoustic, and fire resistance (Fig. 10). CMU and standard precast still require separate rigid insulation, wood furring, gypsum, and weather barrier.
            </div>
          </div>
        </div>

        {/* Charts column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Total installed cost */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px 10px" }}>
            <div style={{ color: C.t2, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Total Installed Cost — Per Panel (16 sf)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={totalData} barSize={40} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.t2, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={singleTT} />
                <Bar dataKey="cost" radius={[5, 5, 0, 0]}>
                  {totalData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown stacked */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px 10px" }}>
            <div style={{ color: C.t2, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
              Cost Breakdown — Where the Money Goes
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={breakdownData} barSize={40} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: C.t2, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={stackedTT} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: C.t2 }} />
                <Bar dataKey="Block/Masonry"   stackId="s" fill="#1F3A52" />
                <Bar dataKey="Extra Materials" stackId="s" fill="#2A506E" />
                <Bar dataKey="Labor"           stackId="s" fill="#3868A0" />
                <Bar dataKey="Delivery"        stackId="s" fill="#5085C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scale curve - full width */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px 10px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ color: C.t2, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Scale Effect — Second Cast Cost vs Annual Production Volume
          </div>
          <div style={{ color: C.t3, fontSize: 10 }}>
            Breakeven vs precast at {(() => {
              const pt = scalePts.find(v => buildCosts({ ...p, vol: v }).sc.total <= buildCosts({ ...p, vol: v }).pc.total);
              return pt ? `~${pt} panels/yr` : "requires carbon pricing";
            })()}
          </div>
        </div>
        <div style={{ color: C.t3, fontSize: 10, marginBottom: 12 }}>
          Plywood formwork ($800, 200-use) and computational design ($2,500/panel type) are the primary cost drivers at low volume.
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={scaleData} margin={{ left: -12, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="vol"
              tick={{ fill: C.t2, fontSize: 10, fontFamily: "monospace" }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
              label={{ value: "panels/yr", position: "insideBottom", fill: C.t3, fontSize: 10, dy: 12 }}
            />
            <YAxis
              tick={{ fill: C.t3, fontSize: 10, fontFamily: "monospace" }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${v}`}
              domain={["auto", "auto"]}
            />
            <Tooltip content={lineTT} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: C.t2 }} />
            <ReferenceLine y={Math.round(c.pc.total)} stroke={C.pc} strokeDasharray="4 4" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="Second Cast" stroke={C.sc}    strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="SC + Carbon"  stroke={C.scNet} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
            <Line type="monotone" dataKey="Std Precast"  stroke={C.pc}    strokeWidth={2}   dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Findings + assumptions row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Findings */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Financial Findings
          </div>
          {[
            { label: "vs CMU", text: `Second Cast saves ${scSavCMUpct}% ($${Math.round(c.cmu.total - c.sc.total)}/panel) by eliminating ~$${Math.round(c.cmu.extra + c.cmu.finish)} in site materials and reducing on-site trade labor.`, color: C.sc },
            { label: "vs Precast", text: `Panel manufacturing is ${Math.abs(+scPremPct)}% ${scBeatsPC ? "cheaper" : "more expensive"} vs standard precast — but Second Cast eliminates $${Math.round(c.pc.extra)}/panel in site assembly materials that precast still needs.`, color: scBeatsPC ? C.sc : C.scNet },
            { label: "Scale", text: `At current settings, design and formwork amortization drives cost significantly at <100 panels/yr. The fixed $2,500 design cost dominates at low volume.`, color: C.t2 },
            { label: "Carbon", text: `30.25 kgCO₂e savings per panel (from paper) is worth $${c.carbonCredit.toFixed(2)}/panel at $${carbonPrice}/tonne. Meaningful at >$100/tonne; minor below that.`, color: C.pc },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ color: f.color, fontSize: 10, fontWeight: 700, minWidth: 56, paddingTop: 1, fontFamily: "monospace", textTransform: "uppercase" }}>{f.label}</div>
              <div style={{ color: C.t2, fontSize: 11, lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>

        {/* Assumptions */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Key Model Assumptions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px" }}>
            {[
              "4'×4'×4\" = 16 sf panel (paper)",
              "26 panels/truck (paper)",
              "SC mass 156 kg, Precast 233 kg (paper)",
              "EC: 103.32 vs 73.07 kgCO₂e (paper)",
              "SC: 75% concrete / 25% foam-crete",
              "Foam-crete density ~800 kg/m³",
              "Concrete density ~2,200 kg/m³",
              "Plywood formwork: $800, 200-use life",
              "Foam inserts: $150, 15-use life",
              "Design (Grasshopper/Peregrine): $2,500",
              "Two-part SC labor: 2.25× plant rate/hr",
              "Site labor = 1.85× plant rate (trade premium)",
              "CMU = 7 materials, full on-site (Fig. 10)",
              "SC = 4 materials, 2 are finishes (Fig. 10)",
              "Precast still needs insul + furring + gypsum",
              "Transport = weight-proportional fuel cost",
            ].map((a, i) => (
              <div key={i} style={{ color: C.t3, fontSize: 10, lineHeight: 1.4 }}>• {a}</div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
