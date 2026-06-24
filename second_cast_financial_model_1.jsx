import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import {
  C, SF_PER_PANEL, buildCosts,
} from "./src/model/costEngine.js";
import { assumptionsList, sliderPaperRefs } from "./src/data/paperReferences.js";
import TabNav from "./src/components/TabNav.jsx";
import PaperTab from "./src/components/PaperTab.jsx";
import MethodologyTab from "./src/components/MethodologyTab.jsx";

function PaperBadge({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#0D2318",
        border: `1px solid ${C.sc}`,
        borderRadius: 3,
        color: C.sc,
        cursor: "pointer",
        fontFamily: "monospace",
        fontSize: 9,
        marginLeft: 6,
        padding: "1px 5px",
        verticalAlign: "middle",
      }}
    >
      Paper
    </button>
  );
}

function Slider({ label, value, setValue, min, max, step, fmt, note, paperRef, onOpenReference, targetId, highlighted }) {
  return (
    <div
      id={targetId}
      style={{
        marginBottom: 16,
        borderRadius: 6,
        outline: highlighted ? `2px solid ${C.sc}` : "none",
        padding: highlighted ? 4 : 0,
        marginLeft: highlighted ? -4 : 0,
        marginRight: highlighted ? -4 : 0,
        transition: "outline 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: C.t2, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>
          {label}
          {paperRef && <PaperBadge onClick={() => onOpenReference(paperRef)} />}
        </span>
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

export default function SecondCastModel() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [activeRefId, setActiveRefId]   = useState(null);
  const [highlightTarget, setHighlightTarget] = useState(null);

  const [vol,         setVol]         = useState(200);
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [distKm,      setDistKm]      = useState(150);
  const [plantRate,   setPlantRate]   = useState(35);
  const [concPrice,   setConcPrice]   = useState(110);
  const [foamPrem,    setFoamPrem]    = useState(20);
  const [projSF,      setProjSF]      = useState(10000);

  const highlightTimer = useRef(null);

  const p = { vol, carbonPrice, distKm, plantRate, concPrice, foamPrem };
  const c = useMemo(() => buildCosts(p), [vol, carbonPrice, distKm, plantRate, concPrice, foamPrem]);

  const openReference = (refId) => {
    setActiveRefId(refId);
    setActiveTab("paper");
  };

  const openInModel = (refId, targetId) => {
    setActiveRefId(refId);
    setActiveTab("dashboard");
    setHighlightTarget(targetId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightTarget(null), 2500);
  };

  useEffect(() => {
    if (activeTab === "dashboard" && highlightTarget) {
      document.getElementById(highlightTarget)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeTab, highlightTarget]);

  const projPanels  = Math.ceil(projSF / SF_PER_PANEL);
  const savVsCMU    = (c.cmu.total - c.sc.total) * projPanels;
  const savVsPC     = (c.pc.total  - c.sc.total) * projPanels;
  const scPremPct   = ((c.sc.total - c.pc.total) / c.pc.total * 100).toFixed(0);
  const scSavCMUpct = ((c.cmu.total - c.sc.total) / c.cmu.total * 100).toFixed(0);
  const scBeatsPC   = c.sc.total <= c.pc.total;

  const scalePts = [25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000];
  const scaleData = scalePts.map(v => {
    const x = buildCosts({ ...p, vol: v });
    return {
      vol: v,
      "Second Cast": Math.round(x.sc.total),
      "SC + Carbon": Math.round(x.scNet),
      "Std Precast": Math.round(x.pc.total),
    };
  });

  const breakdownData = [
    { name: "CMU Wall", "Block/Masonry": Math.round(c.cmu.block), "Extra Materials": Math.round(c.cmu.extra + c.cmu.finish), "Labor": Math.round(c.cmu.labor), "Delivery": Math.round(c.cmu.transport) },
    { name: "Std Precast", "Block/Masonry": Math.round(c.pc.panel), "Extra Materials": Math.round(c.pc.extra), "Labor": Math.round(c.pc.labor), "Delivery": Math.round(c.pc.transport) },
    { name: "Second Cast", "Block/Masonry": Math.round(c.sc.panel), "Extra Materials": Math.round(c.sc.finish), "Labor": Math.round(c.sc.labor), "Delivery": Math.round(c.sc.transport) },
  ];

  const totalData = [
    { name: "CMU Wall",        cost: Math.round(c.cmu.total), fill: C.cmu },
    { name: "Std Precast",     cost: Math.round(c.pc.total),  fill: C.pc },
    { name: "Second Cast",     cost: Math.round(c.sc.total),  fill: C.sc },
    { name: "SC + Carbon Cr.", cost: Math.round(c.scNet),     fill: C.scNet },
  ];

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

  const verdictText = scBeatsPC
    ? `At ${vol} panels/yr, Second Cast beats standard precast by ${Math.abs(scPremPct)}% and saves ${scSavCMUpct}% vs CMU.`
    : `At ${vol} panels/yr, Second Cast carries a ${scPremPct}% panel premium over precast — but still saves ${scSavCMUpct}% vs full CMU assembly.`;
  const verdictColor = scBeatsPC ? "#0D3320" : "#1C1507";
  const verdictBorder = scBeatsPC ? C.sc : C.scNet;
  const verdictTextColor = scBeatsPC ? "#3FB950" : "#F0A742";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "22px 26px", color: C.t1, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13 }}>

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

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "paper" && (
        <PaperTab
          activeRefId={activeRefId}
          onSelectReference={setActiveRefId}
          onOpenInModel={openInModel}
        />
      )}

      {activeTab === "methodology" && (
        <MethodologyTab params={p} costs={c} />
      )}

      {activeTab === "dashboard" && (
        <>
          <div style={{ background: verdictColor, border: `1px solid ${verdictBorder}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20 }}>
            <span style={{ color: verdictTextColor, fontSize: 13, fontWeight: 600 }}>
              {scBeatsPC ? "✓" : "△"} {verdictText}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
            <KPI label="Second Cast / Panel" value={`$${Math.round(c.sc.total)}`} sub={`$${(c.sc.total / SF_PER_PANEL).toFixed(2)}/sf total system`} color={C.sc} />
            <KPI label="vs CMU Wall" value={`-$${Math.round(c.cmu.total - c.sc.total)}`} sub={`${scSavCMUpct}% cheaper per panel`} color="#3FB950" />
            <KPI label="vs Std Precast" value={`${scBeatsPC ? "-" : "+"}$${Math.round(Math.abs(c.sc.total - c.pc.total))}`} sub={`${Math.abs(+scPremPct)}% ${scBeatsPC ? "cheaper" : "premium"} per panel`} color={scBeatsPC ? "#3FB950" : C.scNet} />
            <KPI label="Carbon Savings" value={`${c.ecSavings.toFixed(0)} kg CO₂e`} sub={`= $${c.carbonCredit.toFixed(2)}/panel at $${carbonPrice}/tonne`} color={C.pc} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ color: C.sc, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>
                Adjust Assumptions
              </div>

              <Slider label="Production Volume" value={vol} setValue={setVol} min={25} max={2000} step={25}
                fmt={v => `${v} panels/yr`} note="Formwork + design amortization" onOpenReference={openReference} targetId="slider-vol" highlighted={highlightTarget === "slider-vol"} />
              <Slider label="Carbon Price" value={carbonPrice} setValue={setCarbonPrice} min={0} max={200} step={10}
                fmt={v => `$${v}/tCO₂e`} note="Voluntary market ~$50-80 today" paperRef={sliderPaperRefs.carbonPrice} onOpenReference={openReference} targetId="slider-carbonPrice" highlighted={highlightTarget === "slider-carbonPrice"} />
              <Slider label="Transport Distance" value={distKm} setValue={setDistKm} min={25} max={500} step={25}
                fmt={v => `${v} km`} note="Plant to site, one-way" paperRef={sliderPaperRefs.distKm} onOpenReference={openReference} targetId="slider-distKm" highlighted={highlightTarget === "slider-distKm"} />
              <Slider label="Plant Labor Rate" value={plantRate} setValue={setPlantRate} min={20} max={80} step={5}
                fmt={v => `$${v}/hr`} note={`Site/mason ≈ $${Math.round(plantRate * 1.85)}/hr`} onOpenReference={openReference} targetId="slider-plantRate" highlighted={highlightTarget === "slider-plantRate"} />
              <Slider label="Concrete Price" value={concPrice} setValue={setConcPrice} min={60} max={220} step={10}
                fmt={v => `$${v}/m³`} note="Recycled aggregate ready-mix" onOpenReference={openReference} targetId="slider-concPrice" highlighted={highlightTarget === "slider-concPrice"} />
              <Slider label="Foam-Crete Premium" value={foamPrem} setValue={setFoamPrem} min={0} max={100} step={5}
                fmt={v => `+${v}%`} note="vs concrete per m³ (additives)" paperRef={sliderPaperRefs.foamPrem} onOpenReference={openReference} targetId="slider-foamPrem" highlighted={highlightTarget === "slider-foamPrem"} />

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 6 }}>
                <Slider label="Project Wall Area" value={projSF} setValue={setProjSF} min={1000} max={50000} step={500}
                  fmt={v => `${v.toLocaleString()} sf`} onOpenReference={openReference} targetId="slider-projSF" highlighted={highlightTarget === "slider-projSF"} />
                <div style={{ background: "#0D2318", border: `1px solid #1A4830`, borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
                  <div style={{ color: C.t2, fontSize: 11, marginBottom: 5 }}>{projPanels} panels required</div>
                  <div style={{ color: C.sc, fontSize: 12, fontWeight: 700 }}>vs CMU: save ${(savVsCMU / 1000).toFixed(0)}k</div>
                  <div style={{ color: savVsPC >= 0 ? C.sc : C.scNet, fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                    vs Precast: {savVsPC >= 0 ? `save $${(savVsPC / 1000).toFixed(0)}k` : `$${(Math.abs(savVsPC) / 1000).toFixed(0)}k premium`}
                  </div>
                </div>
              </div>

              <div
                id="note-integrated_performance"
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "#0D1B2A",
                  border: `1px solid ${highlightTarget === "note-integrated_performance" ? C.sc : C.border}`,
                  borderRadius: 8,
                  outline: highlightTarget === "note-integrated_performance" ? `2px solid ${C.sc}` : "none",
                }}
              >
                <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  Why SC avoids site materials
                  <PaperBadge onClick={() => openReference("fig10_integrated_performance")} />
                </div>
                <div style={{ color: C.t2, fontSize: 10, lineHeight: 1.5 }}>
                  Foam-crete zones provide integrated thermal, acoustic, and fire resistance (Fig. 10). CMU and standard precast still require separate rigid insulation, wood furring, gypsum, and weather barrier.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                    <Bar dataKey="Block/Masonry" stackId="s" fill="#1F3A52" />
                    <Bar dataKey="Extra Materials" stackId="s" fill="#2A506E" />
                    <Bar dataKey="Labor" stackId="s" fill="#3868A0" />
                    <Bar dataKey="Delivery" stackId="s" fill="#5085C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={scaleData} margin={{ left: -12, right: 40, top: 8, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="vol" tick={{ fill: C.t2, fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
                  label={{ value: "panels/yr", position: "bottom", fill: C.t3, fontSize: 10, offset: 0 }} />
                <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} domain={["auto", "auto"]} />
                <Tooltip content={lineTT} />
                <Legend verticalAlign="top" align="right" iconSize={10} wrapperStyle={{ fontSize: 11, color: C.t2, top: -4 }} />
                <ReferenceLine y={Math.round(c.pc.total)} stroke={C.pc} strokeDasharray="4 4" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="Second Cast" stroke={C.sc} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="SC + Carbon" stroke={C.scNet} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                <Line type="monotone" dataKey="Std Precast" stroke={C.pc} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: C.t3, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Key Model Assumptions
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 14px" }}>
                {assumptionsList.map(a => (
                  <div
                    key={a.targetId}
                    id={a.targetId}
                    style={{
                      color: C.t3,
                      fontSize: 10,
                      lineHeight: 1.4,
                      borderRadius: 4,
                      outline: highlightTarget === a.targetId ? `2px solid ${C.sc}` : "none",
                      padding: highlightTarget === a.targetId ? 2 : 0,
                    }}
                  >
                    • {a.text}
                    {a.refId && <PaperBadge onClick={() => openReference(a.refId)} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
