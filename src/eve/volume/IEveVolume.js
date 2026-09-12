// Source: trinity/trinity/Eve/Volume/IEveVolume.h
import { meta } from "utils";


/** Required EVE volume contract. */
@meta.define("IEveVolume", true)
export class IEveVolume extends meta.Model
{

    /** Returns the volume intensity at a position. */
    GetIntensity(_position)
    {
        throw new Error("IEveVolume.GetIntensity must be implemented by a concrete volume.");
    }

    /** Registers a listener for volume changes and returns its identifier. */
    RegisterForChanges(_listener)
    {
        throw new Error("IEveVolume.RegisterForChanges must be implemented by a concrete volume.");
    }

    /** Removes a previously registered volume-change listener. */
    UnregisterForChanges(_listener)
    {
        throw new Error("IEveVolume.UnregisterForChanges must be implemented by a concrete volume.");
    }

    /** Generates caller-owned sample points inside the volume. */
    GeneratePointsInVolume(_count, _out)
    {
        throw new Error("IEveVolume.GeneratePointsInVolume must be implemented by a concrete volume.");
    }

    /** Renders volume debug information through the supplied renderer. */
    RenderDebugInfo(_debugRenderer)
    {
        throw new Error("IEveVolume.RenderDebugInfo must be implemented by a concrete volume.");
    }

    /** Writes the volume's current bounding sphere. */
    GetBoundingSphere(_out)
    {
        throw new Error("IEveVolume.GetBoundingSphere must be implemented by a concrete volume.");
    }

}
