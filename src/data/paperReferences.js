export const PAPER_URL = "/second-cast-paper.pdf";

export const paperReferences = [
  {
    id: "panel_geometry",
    title: "Panel geometry",
    page: 2,
    excerpt: "The wall design explores a 4'-0\" × 4'-0\" × 0'-4\" panel with an offset rectangular opening — the normalization unit for all per-panel costs in the model (16 sf).",
    dashboardTarget: "assumption-panel_geometry",
    modelValue: "16 sf per panel",
  },
  {
    id: "truck_capacity",
    title: "Truck load capacity",
    page: 8,
    excerpt: "Figure 9 assumes a production batch of 26 precast panels — equivalent to a single flatbed truck load arranged in one layer — transported 150 km to site.",
    dashboardTarget: "slider-distKm",
    modelValue: "26 panels/truck",
  },
  {
    id: "panel_mass",
    title: "Panel mass comparison",
    page: 7,
    excerpt: "The optimized composite wall panel weighs approximately 156 kg. The model uses 233 kg for a baseline solid precast panel (no topology optimization) per the ~33% mass reduction cited in Section 4.",
    dashboardTarget: "assumption-panel_mass",
    modelValue: "156 kg SC / 233 kg PC",
  },
  {
    id: "embodied_carbon",
    title: "Embodied carbon (LCA)",
    page: 8,
    excerpt: "Figure 9 evaluates embodied carbon under manufacturing and transportation assumptions. The model anchors to 103.32 kgCO₂e/panel (baseline) vs 73.07 kgCO₂e/panel (Second Cast) — a ~30% reduction aligned with Section 4.",
    dashboardTarget: "slider-carbonPrice",
    modelValue: "103.32 vs 73.07 kgCO₂e/panel",
  },
  {
    id: "foam_crete_fraction",
    title: "Foam-crete material split",
    page: 7,
    excerpt: "Non-structural filler zones of foam-crete replace monolithic concrete where compression paths are not required. The model assumes 75% concrete / 25% foam-crete by mass for the optimized panel.",
    dashboardTarget: "slider-foamPrem",
    modelValue: "75% concrete / 25% foam-crete",
  },
  {
    id: "fig10_cmu_assembly",
    title: "CMU wall assembly (Fig. 10)",
    page: 9,
    excerpt: "Figure 10 compares a typical concrete block wall assembly — requiring multiple on-site layers (block, insulation, furring, gypsum, weather barrier, finishes) — against the composite panel approach.",
    dashboardTarget: "assumption-fig10_cmu",
    modelValue: "7 materials, full on-site assembly",
  },
  {
    id: "fig10_sc_assembly",
    title: "Second Cast assembly (Fig. 10)",
    page: 9,
    excerpt: "The optimized precast composite wall integrates structure and enclosure: external finish, recycled aggregate concrete, foam-crete zones, and internal finish — four material layers total.",
    dashboardTarget: "assumption-fig10_sc",
    modelValue: "4 materials, 2 are finishes",
  },
  {
    id: "fig10_integrated_performance",
    title: "Integrated foam-crete performance",
    page: 1,
    excerpt: "Foam mechanically mixed with concrete integrates acoustic, thermal, and fire-resistance properties — eliminating separate rigid insulation, furring, gypsum, and weather barrier on site.",
    dashboardTarget: "note-integrated_performance",
    modelValue: "No separate site insulation/furring",
  },
  {
    id: "transport_weight",
    title: "Weight-proportional transport",
    page: 8,
    excerpt: "Transport embodied carbon scales with panel mass and trip distance. The model applies fuel cost proportional to mass ratio (156/233) for Second Cast vs standard precast on the same 26-panel truck load.",
    dashboardTarget: "slider-distKm",
    modelValue: "t_SC = t_base × (156/233)",
  },
];

export const assumptionsList = [
  { text: "4'×4'×4\" = 16 sf panel", refId: "panel_geometry", targetId: "assumption-panel_geometry" },
  { text: "26 panels/truck", refId: "truck_capacity", targetId: "assumption-truck_capacity" },
  { text: "SC mass 156 kg, Precast 233 kg", refId: "panel_mass", targetId: "assumption-panel_mass" },
  { text: "EC: 103.32 vs 73.07 kgCO₂e", refId: "embodied_carbon", targetId: "assumption-embodied_carbon" },
  { text: "SC: 75% concrete / 25% foam-crete", refId: "foam_crete_fraction", targetId: "assumption-foam_split" },
  { text: "Foam-crete density ~800 kg/m³", refId: null, targetId: "assumption-foam_density" },
  { text: "Concrete density ~2,200 kg/m³", refId: null, targetId: "assumption-conc_density" },
  { text: "Plywood formwork: $800, 200-use life", refId: null, targetId: "assumption-form_ply" },
  { text: "Foam inserts: $150, 15-use life", refId: null, targetId: "assumption-form_foam" },
  { text: "Design (Grasshopper/Peregrine): $2,500", refId: null, targetId: "assumption-design" },
  { text: "Two-part SC labor: 2.25× plant rate/hr", refId: null, targetId: "assumption-sc_labor" },
  { text: "Site labor = 1.85× plant rate (trade premium)", refId: null, targetId: "assumption-site_labor" },
  { text: "CMU = 7 materials, full on-site (Fig. 10)", refId: "fig10_cmu_assembly", targetId: "assumption-fig10_cmu" },
  { text: "SC = 4 materials, 2 are finishes (Fig. 10)", refId: "fig10_sc_assembly", targetId: "assumption-fig10_sc" },
  { text: "Precast still needs insul + furring + gypsum", refId: "fig10_integrated_performance", targetId: "assumption-precast_site" },
  { text: "Transport = weight-proportional fuel cost", refId: "transport_weight", targetId: "assumption-transport" },
];

export const sliderPaperRefs = {
  carbonPrice: "embodied_carbon",
  distKm: "transport_weight",
  foamPrem: "foam_crete_fraction",
};

export function getReferenceById(id) {
  return paperReferences.find(r => r.id === id);
}
