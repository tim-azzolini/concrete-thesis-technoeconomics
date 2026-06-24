import { C } from "../model/costEngine.js";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "paper", label: "Paper" },
  { id: "methodology", label: "Methodology" },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: active ? C.card : "transparent",
              border: `1px solid ${active ? C.sc : "transparent"}`,
              borderBottom: active ? `1px solid ${C.card}` : `1px solid transparent`,
              borderRadius: "8px 8px 0 0",
              color: active ? C.sc : C.t2,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: active ? 700 : 400,
              letterSpacing: "0.08em",
              marginBottom: -1,
              padding: "10px 18px",
              textTransform: "uppercase",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
