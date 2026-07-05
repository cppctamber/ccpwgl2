// CewgLightMath is intentionally NOT re-exported here: these index
// exports feed tw2.Register's constructor store, which rejects its
// non-class members (constants/functions). Import it by path instead.
export * from "./Tr2SpotLight";
export * from "./Tr2PointLight";
export * from "./Tr2ShLightingManager";
export * from "./Tr2TexturedPointLight";
export * from "./Tr2FactionLight";