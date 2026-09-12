// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/IBehavior.h
import { meta } from "utils";
import { EveEntity } from "eve/EveEntity";
import { ProcessPriority, TunnelGroupType } from "./enums";

/**
 * Steering contract and per-agent scratch lifecycle shared by drone behaviors.
 * EveEntity supplies the second Carbon interface used by PlayFX; JavaScript
 * has one prototype chain, so the common base retains that registration state.
 */
@meta.define("IBehavior", true)
export class IBehavior extends EveEntity
{
    static ProcessPriority = ProcessPriority;
    static TunnelGroupType = TunnelGroupType;

    /** Browser notification for the shared tunnel registry being rebuilt. */
    OnSystemTunnelsChanged() {}

    /** Zero means this behavior has no per-agent scratch record. */
    GetScratchMemorySize() { return 0; }

    /** Initializes one agent's scratch record when required by a behavior. */
    InitializeScratch() { return null; }

    /** Returns the authored execution priority. */
    GetProcessPriority() { return ProcessPriority.LEAST_PRIORITY; }

    /** Returns the donor's default lookup name. */
    GetBehaviorName() { return "unnamed"; }

    /** Resets optional behavior state. */
    Reset() {}

    /** Returns the neighbor query radius, or -1 when no query is needed. */
    GetBehaviorSearchRadius() { return -1; }

    /** Receives state changes from another behavior. */
    UpdateState() {}

    /** Most steering behaviors own no loadable resources. */
    GetResources(out = []) { return out; }

    /** Concrete behaviors must implement their steering operation. */
    CalculateBehavior()
    {
        throw new Error("IBehavior.CalculateBehavior requires an implementation");
    }
}
