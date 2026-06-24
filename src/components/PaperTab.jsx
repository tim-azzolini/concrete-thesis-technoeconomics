import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { C } from "../model/costEngine.js";
import { PAPER_URL, paperReferences } from "../data/paperReferences.js";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PaperTab({ activeRefId, onSelectReference, onOpenInModel }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const cardRefs = useRef({});

  useEffect(() => {
    if (!activeRefId) return;
    const ref = paperReferences.find(r => r.id === activeRefId);
    if (ref) {
      setPageNumber(ref.page);
      cardRefs.current[activeRefId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeRefId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, minHeight: "calc(100vh - 180px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ color: C.t2, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ACADIA 2026 — Second Cast Paper
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              style={navBtnStyle}
            >
              ←
            </button>
            <span style={{ color: C.t1, fontFamily: "monospace", fontSize: 12 }}>
              {pageNumber} / {numPages ?? "…"}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
              disabled={!numPages || pageNumber >= numPages}
              style={navBtnStyle}
            >
              →
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", background: "#0A0E14", borderRadius: 8, padding: 12 }}>
          <Document
            file={PAPER_URL}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<div style={{ color: C.t2, padding: 40 }}>Loading PDF…</div>}
            error={<div style={{ color: "#F85149", padding: 40 }}>Failed to load PDF.</div>}
          >
            <Page
              pageNumber={pageNumber}
              width={640}
              renderTextLayer
              renderAnnotationLayer
            />
          </Document>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, overflowY: "auto", maxHeight: "calc(100vh - 180px)" }}>
        <div style={{ color: C.sc, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          Paper References
        </div>
        <p style={{ color: C.t2, fontSize: 11, lineHeight: 1.5, margin: "0 0 14px" }}>
          Click a reference to jump to its page. Use "View in model" to see where it drives the financial model.
        </p>
        {paperReferences.map(ref => {
          const active = activeRefId === ref.id;
          return (
            <div
              key={ref.id}
              ref={el => { cardRefs.current[ref.id] = el; }}
              onClick={() => {
                onSelectReference(ref.id);
                setPageNumber(ref.page);
              }}
              style={{
                background: active ? "#0D2318" : C.bg,
                border: `1px solid ${active ? C.sc : C.border}`,
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 10,
                padding: "12px 14px",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ color: active ? C.sc : C.t1, fontSize: 12, fontWeight: 600 }}>{ref.title}</span>
                <span style={{ color: C.t3, fontFamily: "monospace", fontSize: 10 }}>p.{ref.page}</span>
              </div>
              <div style={{ color: C.t2, fontSize: 11, lineHeight: 1.45, marginBottom: 8 }}>{ref.excerpt}</div>
              <div style={{ color: C.t3, fontFamily: "monospace", fontSize: 10, marginBottom: 8 }}>
                Model: {ref.modelValue}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onOpenInModel(ref.id, ref.dashboardTarget);
                }}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  color: C.sc,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: 10,
                  padding: "4px 8px",
                }}
              >
                View in model →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  color: C.t1,
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: 14,
  padding: "4px 10px",
};
