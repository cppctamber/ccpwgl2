// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightSpotLight.h
import { meta } from "utils";
// TODO(port): ccpwgl has no shared Tr2Light base (see the doc comment on
// src/core/lighting/Tr2PointLight.js - "ccpwgl has no shared Tr2Light base
// class file"). Kept as the faithful import path for the SPOT_LIGHT type
// constant; unresolved until a shared Tr2Light module (or equivalent enum)
// is ported.
import { Tr2Light } from "../lights/Tr2Light.js";
import { EveSmartLightPointLight } from "./EveSmartLightPointLight.js";

/** EveSmartLightSpotLight (eve/smartLights) - generated from schema shapeHash e98199f3.... */
@meta.type("EveSmartLightSpotLight")
@meta.ccp.define("EveSmartLightSpotLight")
export class EveSmartLightSpotLight extends EveSmartLightPointLight
{

    /** m_lightGroupData.innerAngle (float) [READWRITE, PERSIST] */
    @meta.float
    innerAngle = 0;

    /** m_lightGroupData.outerAngle (float) [READWRITE, PERSIST] */
    @meta.float
    outerAngle = 0;

    /** m_lightType override - the constructor's only job (EveSmartLightSpotLight.cpp:7-11). */
    lightType = Tr2Light.SPOT_LIGHT;

    /**
     * Carbon method RenderDebugInfo (EveSmartLightSpotLight.cpp:13-56).
     * RenderDebugInfo is deliberately unported org-wide.
     */
    RenderDebugInfo(..._args)
    {
        throw new Error("EveSmartLightSpotLight.RenderDebugInfo is not implemented in ccpwgl.");
    }

    static LightDataFields = [
        ...EveSmartLightPointLight.LightDataFields,
        "innerAngle",
        "outerAngle"
    ];

}
