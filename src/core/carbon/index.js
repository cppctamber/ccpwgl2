// These modules are CommonJS so the node test scripts under `scripts/` can
// require them directly. Re-exporting here puts them in the `core` barrel,
// which is what `config.constructors` spreads - so they become registered
// constructors reachable through `tw2.GetClass(...)` like everything else.
// Tw2CarbonData is deliberately absent: it exports packing helpers, not a
// class, and the constructor store is for constructors.
export { Tw2CarbonLightCollector } from "./Tw2CarbonLightCollector";
export { Tw2CarbonLightCuller } from "./Tw2CarbonLightCuller";
export { Tw2CarbonLightList } from "./Tw2CarbonLightList";
export { Tw2CarbonResourceBinder } from "./Tw2CarbonResourceBinder";
// Tw2CarbonShadowData is absent for the same reason as Tw2CarbonData: it is
// maths, not a class, and `scripts/test-carbon-shadow.js` requires it directly.
export { Tw2CarbonShadowProducer } from "./Tw2CarbonShadowProducer";
export { Tw2CarbonShadowRenderer } from "./Tw2CarbonShadowRenderer";
