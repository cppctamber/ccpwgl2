// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionAttributeModifiers/EveDistributionModifierProcessLifetime.h
import { meta } from "utils";
import { DistributionEntityLifeTimeEvent } from "./enums.js";


@meta.type("EveDistributionModifierProcessLifetime")
@meta.ccp.define("EveDistributionModifierProcessLifetime")
export class EveDistributionModifierProcessLifetime extends meta.Model
{

    /** m_killEvent (DistributionEntityLifeTimeEvent - enum DistributionEntityLifeTimeEvent) [READWRITE, PERSIST, ENUM] */
    @meta.enums(DistributionEntityLifeTimeEvent)
    killEvent = 1;

    /** m_lifetimeDuration (float) [READWRITE, PERSIST] */
    @meta.float
    lifetimeDuration = -1;

    /**
     * Reports no transform effect, so this modifier alone never forces the
     * distribution into its per-frame transform reset.
     */
    AffectsTransform()
    {
        return false;
    }

    /**
     * Returns the authored kill event once a placement's accumulated lifetime
     * passes lifetimeDuration, and DO_NOTHING otherwise or when no positive
     * duration is authored.
     */
    ProcessDistributionModifier(placement, _deltaTime, _params)
    {
        return placement.lifeTime > this.lifetimeDuration && this.lifetimeDuration > 0
            ? this.killEvent
            : EveDistributionModifierProcessLifetime.DistributionEntityLifeTimeEvent.DO_NOTHING;
    }

    static DistributionEntityLifeTimeEvent = DistributionEntityLifeTimeEvent;

}
