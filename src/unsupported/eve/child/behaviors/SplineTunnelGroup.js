// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SplineTunnelGroup.cpp
// Maintained CarbonEngineJS implementation; generated schema is reference-only.
import { meta } from "utils";
import { mat4 } from "math";
import { vec3 } from "math";
import {
    BELIST_EVENTMASK,
    BELIST_INSERTED,
    BELIST_LOADFINISHED,
    BELIST_REMOVED
} from "./listEvents";
import { TunnelGroupType } from "./enums";
import { SplineTunnel } from "./SplineTunnel";
import { SplineTunnelPoint } from "./SplineTunnelPoint";

const DEBUG_TRANSFORM = mat4.create();
const DEBUG_START = vec3.create();
const DEBUG_END = vec3.create();

/** SplineTunnelGroup (eve/child/behaviors) - generated from schema shapeHash da595535.... */

@meta.define("SplineTunnelGroup", true)
export class SplineTunnelGroup extends meta.Model
{
    static TunnelGroupType = TunnelGroupType;

    /** CPU spline tunnel records rebuilt from the authored curve sets. */
    tunnels = [];

    /** m_tunnelGroupType (TunnelGroupType - enum TunnelGroupType) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    tunnelGroupType = 2;

    /** m_curveSets (PTr2CurveVector3Vector) [READ, PERSIST, NOTIFY] */
    @meta.list("Tr2CurveVector3")
    curveSets = [];

    /** m_numBreakPoints (int32_t) [READWRITE, PERSIST, NOTIFY] */
    @meta.int32
    breakPoints = 2;

    /** m_tunnelWidth (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    tunnelWidth = 15;

    /** m_entrancePullSize (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    entrancePullSize = 50;

    /** m_entrySize (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    entrySize = 20;

    // Owner callback into the system/behavior tunnel registry (Carbon
    // m_changeSystemTunnelRegistry) and its debug color.
    _changeSystemTunnelRegistry = null;

    _debugColor = 0xffffff00;

    // Re-entrancy guard: the registry callback may ask for the tunnels while
    // they are being rebuilt.
    _creatingTunnels = false;
    _knownCurves = [];

    /** Carbon SplineTunnelGroup::GetTunnelGroupType (cpp:24-27). */
    GetTunnelGroupType()
    {
        return this.tunnelGroupType;
    }

    /**
      * Stores the owner's tunnel-registry callback and debug color, then
      * rebuilds the tunnels (Carbon SetSystemTunnelFunctionReferenceAndColor,
      * cpp:30-35).
      * @param {Function} callback
      * @param {Number} color - debug color (retained for parity; debug rendering is omitted)
      */
    SetSystemTunnelFunctionReferenceAndColor(callback, color = 0xffffff00)
    {
        this._changeSystemTunnelRegistry = typeof callback === "function" ? callback : null;
        this._debugColor = color >>> 0;
        this.createSplineTunnels();
    }

    /** Carbon method createSplineTunnels -> CreateSplineTunnels (cpp:37-79). */
    // Browser adaptation: Samples portable vector curves into CPU tunnel records and reports registry changes through an injected callback.
    createSplineTunnels()
    {
        if (this._creatingTunnels)
        {
            return this.tunnels;
        }
        this._creatingTunnels = true;
        try
        {
            this._knownCurves = this.curveSets.slice();
            this.tunnels.length = 0;
            const breakPoints = this.GetNumBreakPoints();
            for (const curve of this.curveSets)
            {
                if (!curve?.Length || !curve?.GetValue)
                {
                    continue;
                }
                const duration = curve.Length();
                const step = duration / (breakPoints + 1);
                const positions = [];
                for (let index = 0; index < breakPoints + 2; index++)
                {
                    const out = vec3.create();
                    positions.push(curve.GetValue(index * step, out) ?? out);
                }

                const tunnel = new SplineTunnel();
                for (let index = 0; index < positions.length; index++)
                {
                    const point = new SplineTunnelPoint();
                    vec3.copy(point.pos, positions[index]);
                    const previous = index === positions.length - 1 ? positions[index - 1] : positions[index];
                    const next = index === positions.length - 1 ? positions[index] : positions[index + 1];
                    vec3.subtract(point.rot, next, previous);
                    tunnel.splinePoints.push(point);
                }
                tunnel.cylWidth = this.tunnelWidth;
                tunnel.pullSize = this.entrancePullSize;
                tunnel.pointOfNoReturnSize = this.entrySize;
                tunnel.tunnelGroupType = this.tunnelGroupType;
                this.tunnels.push(tunnel);
            }
        }
        finally
        {
            this._creatingTunnels = false;
        }
        this._changeSystemTunnelRegistry?.();
        return this.tunnels;
    }

    /** Carbon SplineTunnelGroup::OnListModified. */
    OnListModified(event, _key = 0, _key2 = 0, _value = null, list = null)
    {
        if (list !== this.curveSets) return;
        const maskedEvent = Number(event) & BELIST_EVENTMASK;
        if ([ BELIST_INSERTED, BELIST_REMOVED, BELIST_LOADFINISHED ].includes(maskedEvent))
        {
            this.createSplineTunnels();
        }
    }

    /**
      * Returns the tunnel records (Carbon GetTunnels, cpp:81-84), building them
      * lazily when curves are present - the JS load path has no Blue notify to
      * trigger the first CreateSplineTunnels.
      */
    // Browser adaptation: Lazily builds the tunnels on first access because the Blue curve-set list notify does not exist in JS.
    GetTunnels()
    {
        if (!this._creatingTunnels && (this._knownCurves.length !== this.curveSets.length || this.curveSets.some((curve, i) => curve !== this._knownCurves[i])))
        {
            this.createSplineTunnels();
        }
        return this.tunnels;
    }

    /** Carbon SplineTunnelGroup::GetCurveSets (cpp:86-89). */
    GetCurveSets()
    {
        return this.curveSets;
    }

    /** Carbon SplineTunnelGroup::SetNumBreakPoints (cpp:91-94). */
    SetNumBreakPoints(value)
    {
        this.breakPoints = Number(value) | 0;
    }

    /** Carbon SplineTunnelGroup::GetNumBreakPoints (cpp:96-99). */
    GetNumBreakPoints()
    {
        return Math.max(this.breakPoints, 0);
    }

    /** Carbon SplineTunnelGroup::Initialize (cpp:104-107). */
    Initialize()
    {
        this.createSplineTunnels();
        return true;
    }

    /** Carbon SplineTunnelGroup::OnModified (cpp:112-117): any property change
      * rebuilds the tunnels. */
    OnValueChanged(_value = null)
    {
        this.createSplineTunnels();
        return true;
    }

    /**
      * Registers this group's "SplineTunnels" debug option in the caller's option
      * bag (Set-like add or insert) and returns that bag.
      */
    // Browser adaptation: Tr2DebugRendererOptions is represented by an injected Set-like option bag.
    GetDebugOptions(options = new Set())
    {
        if (options?.add) options.add("SplineTunnels");
        else options?.insert?.("SplineTunnels");
        return options;
    }

    /**
      * Draws every tunnel's shape: pull and point-of-no-return spheres at its first spline point, a marker sphere at its last, and a cylWidth cylinder along each point's direction vector.
      * @param {Object} renderer - injected debug renderer capability
      * @param {Float32Array} [parentWorldLocation] - places the tunnel geometry in world space
      */
    // Browser adaptation: Emits Carbon's tunnel primitives through an injected ITr2DebugRenderer2-compatible capability.
    RenderDebugInfo(renderer, parentWorldLocation = mat4.create())
    {
        for (const tunnel of this.tunnels)
        {
            const points = tunnel?.splinePoints ?? [];
            if (!points.length) continue;
            const first = points[0];
            const last = points[points.length - 1];
            mat4.translate(DEBUG_TRANSFORM, parentWorldLocation, first.pos);
            renderer?.DrawSphere?.(this, DEBUG_TRANSFORM, tunnel.pullSize, 6, 0, 0xff551111);
            renderer?.DrawSphere?.(this, DEBUG_TRANSFORM, tunnel.pointOfNoReturnSize, 6, 0, 0xff551111);
            mat4.translate(DEBUG_TRANSFORM, parentWorldLocation, last.pos);
            renderer?.DrawSphere?.(this, DEBUG_TRANSFORM, 5, 6, 0, 0xff335555);
            for (const point of points)
            {
                mat4.translate(DEBUG_TRANSFORM, parentWorldLocation, point.pos);
                renderer?.DrawSphere?.(this, DEBUG_TRANSFORM, tunnel.cylWidth, 6, 0, 0xff555555);
                vec3.add(DEBUG_END, point.pos, point.rot);
                vec3.transformMat4(DEBUG_START, point.pos, parentWorldLocation);
                vec3.transformMat4(DEBUG_END, DEBUG_END, parentWorldLocation);
                renderer?.DrawCylinder?.(this, DEBUG_START, DEBUG_END, tunnel.cylWidth, 8, 0, this._debugColor);
            }
        }
    }

}
