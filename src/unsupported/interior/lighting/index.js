// TriColorFromKelvin is intentionally NOT re-exported here: these index
// exports feed tw2.Register's constructor store, which rejects its
// non-class members (functions/tables). Import it by path instead.
export * from "./Tr2InteriorLightSource";
export * from "./Tr2KelvinColor";

