import { meta } from "utils";
import { box3, sph3, mat4 } from "math";
import { EveShip, EveShip2 } from "eve/object";
import { TnyShip } from "./TnyShip";


@meta.tny.type("TnyStrategicCruiser")
@meta.tny.define("TnyStrategicCruiser")
export class TnyStrategicCruiser extends TnyShip
{

    @meta.list([ "EveShip2", "EveShip" ])
    subsystems = [];

    get isStrategicCruiser()
    {
        return true;
    }

    get subsystemCount()
    {
        return this.subsystems.length;
    }

    GetPart(key = 0)
    {
        const index = this.GetPartIndex(key);
        if (index === 0)
        {
            return this.wrapped;
        }

        return index > 0 ? this.subsystems[index - 1] || null : null;
    }

    GetPartIndex(key)
    {
        if (key === undefined || key === null)
        {
            return 0;
        }

        if (typeof key === "number")
        {
            return key;
        }

        const name = String(key).toLowerCase();
        if (name === "primary" || name === "wrapped" || name === "hull")
        {
            return 0;
        }

        const index = this.constructor.SUBSYSTEM_ORDER.indexOf(name);
        return index === -1 ? -1 : index;
    }

    GetPartSlot(index)
    {
        return this.constructor.SUBSYSTEM_ORDER[index] || "";
    }

    ForEachPart(callback)
    {
        if (!callback)
        {
            return this;
        }

        if (this.wrapped)
        {
            callback(this.wrapped, 0, this.GetPartSlot(0) || "wrapped");
        }

        for (let i = 0; i < this.subsystems.length; i++)
        {
            if (this.subsystems[i])
            {
                callback(this.subsystems[i], i + 1, this.GetPartSlot(i + 1));
            }
        }

        return this;
    }

    ApplyToParts(callback, key)
    {
        if (!callback)
        {
            return 0;
        }

        if (key !== undefined && key !== null)
        {
            const index = this.GetPartIndex(key),
                part = this.GetPart(index);

            if (!part)
            {
                return 0;
            }

            callback(part, index, this.GetPartSlot(index));
            return 1;
        }

        let count = 0;
        this.ForEachPart((part, index, slot) =>
        {
            callback(part, index, slot);
            count++;
        });

        return count;
    }

    GetPartValue(key, name, fallback)
    {
        const part = this.GetPart(key);
        return part && name in part ? part[name] : fallback;
    }

    GetPartValues(key, out = {}, opt)
    {
        const part = this.GetPart(key);
        return part && part.GetValues ? part.GetValues(out, opt) : out;
    }

    SetPartValue(key, name, value)
    {
        const part = this.GetPart(key);
        if (!part || !(name in part))
        {
            return false;
        }

        part[name] = value;
        return true;
    }

    SetPartValues(key, values, opt)
    {
        if (!values)
        {
            return false;
        }

        const part = this.GetPart(key);
        if (!part)
        {
            return false;
        }

        if (part.SetValues)
        {
            return !!part.SetValues(values, opt);
        }

        let updated = false;
        for (const name in values)
        {
            if (values.hasOwnProperty(name))
            {
                updated = this.SetPartValue(key, name, values[name]) || updated;
            }
        }

        return updated;
    }

    SetAllPartValues(values, opt)
    {
        if (!values)
        {
            return false;
        }

        let updated = false;
        this.ApplyToParts(part =>
        {
            if (part.SetValues)
            {
                updated = !!part.SetValues(values, opt) || updated;
                return;
            }

            for (const name in values)
            {
                if (values.hasOwnProperty(name) && name in part)
                {
                    part[name] = values[name];
                    updated = true;
                }
            }
        });

        return updated;
    }

    SetAllPartValue(name, value)
    {
        let updated = false;
        this.ApplyToParts(part =>
        {
            if (name in part)
            {
                part[name] = value;
                updated = true;
            }
        });

        return updated;
    }

    SetWrapped(wrapped)
    {
        if (Array.isArray(wrapped))
        {
            return this.SetParts(wrapped);
        }

        this._AssertShip(wrapped, "Invalid wrapped strategic cruiser");
        return super.SetWrapped(wrapped);
    }

    SetParts(parts)
    {
        if (!Array.isArray(parts))
        {
            throw new TypeError("Invalid strategic cruiser parts");
        }

        const primary = parts.length ? parts[0] : null;
        this._AssertShip(primary, "Invalid wrapped strategic cruiser");

        this.subsystems.splice(0);
        for (let i = 1; i < parts.length; i++)
        {
            this.AddSubsystem(parts[i], true);
        }

        super.SetWrapped(primary);
        this._UpdatePartTransforms();
        return this;
    }

    GetParts(out = [])
    {
        if (this.wrapped)
        {
            out.push(this.wrapped);
        }

        for (let i = 0; i < this.subsystems.length; i++)
        {
            out.push(this.subsystems[i]);
        }

        return out;
    }

    SetPart(key, part)
    {
        if (!part)
        {
            throw new TypeError("Invalid strategic cruiser part");
        }

        this._AssertShip(part, "Invalid strategic cruiser part");

        const index = this.GetPartIndex(key);
        if (index < 0)
        {
            return false;
        }

        if (index === 0)
        {
            super.SetWrapped(part);
        }
        else if (index - 1 < this.subsystems.length)
        {
            this.subsystems[index - 1] = part;
            this._boundsDirty = true;
        }
        else if (index - 1 === this.subsystems.length)
        {
            this.subsystems.push(part);
            this._boundsDirty = true;
        }
        else
        {
            return false;
        }

        this._UpdatePartTransform(part);
        return true;
    }

    AddSubsystem(subsystem, skipTransform)
    {
        if (!subsystem)
        {
            throw new TypeError("Invalid strategic cruiser subsystem");
        }

        this._AssertShip(subsystem, "Invalid strategic cruiser subsystem");

        this.subsystems.push(subsystem);
        this._boundsDirty = true;

        if (!skipTransform)
        {
            this._UpdatePartTransform(subsystem);
        }

        return this;
    }

    RemoveSubsystem(subsystem)
    {
        const index = this.subsystems.indexOf(subsystem);
        if (index === -1)
        {
            return false;
        }

        this.subsystems.splice(index, 1);
        this._boundsDirty = true;
        return true;
    }

    ClearSubsystems()
    {
        if (this.subsystems.length)
        {
            this.subsystems.splice(0);
            this._boundsDirty = true;
        }

        return this;
    }

    ClearWrapped()
    {
        this.ClearSubsystems();
        return this.SetWrapped(null);
    }

    GetBatches(mode, accumulator)
    {
        const count = accumulator.length;

        super.GetBatches(mode, accumulator);

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (subsystem.GetBatches)
            {
                subsystem.GetBatches(mode, accumulator);
            }
        }

        return accumulator.length !== count;
    }

    Intersect(ray, intersects)
    {
        let result = super.Intersect(ray, intersects);

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (subsystem.Intersect && subsystem.Intersect(ray, intersects, { root: this }))
            {
                result = true;
            }
        }

        return !!result;
    }

    GetResources(out = [])
    {
        super.GetResources(out);

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (subsystem.GetResources)
            {
                subsystem.GetResources(out);
            }
        }

        return out;
    }

    SetVisibility(name, value, key)
    {
        let updated = false;
        this.ApplyToParts(part =>
        {
            if (name === "display" && "display" in part)
            {
                part.display = value;
                updated = true;
                return;
            }

            if (part.visible && name in part.visible)
            {
                part.visible[name] = value;
                updated = true;
            }
        }, key);

        return updated;
    }

    GetVisibility(name, fallback = true, key)
    {
        const part = this.GetPart(key);
        if (!part)
        {
            return fallback;
        }

        if (name === "display")
        {
            return "display" in part ? part.display : fallback;
        }

        return part.visible && name in part.visible ? part.visible[name] : fallback;
    }

    SetParameter(name, value, key)
    {
        let updated = false;

        this.ApplyToParts(part =>
        {
            const mesh = part.mesh;
            if (!mesh || !mesh.FindParameters) return;

            const parameters = mesh.FindParameters(name);
            for (let i = 0; i < parameters.length; i++)
            {
                if (parameters[i].SetValue)
                {
                    parameters[i].SetValue(value);
                }
                else
                {
                    parameters[i].value = value;
                }
            }

            updated = updated || parameters.length > 0;
        }, key);

        return updated;
    }

    SetBoosterStrength(value, key)
    {
        const part = this.GetBoosterPart(key);
        if (!part)
        {
            return false;
        }

        part.boosterGain = value;
        return true;
    }

    GetBoosterPart(key)
    {
        if (key !== undefined && key !== null)
        {
            return TnyShip.GetBoosterPart(this.GetPart(key));
        }

        for (let i = this.subsystems.length - 1; i >= 0; i--)
        {
            const part = TnyShip.GetBoosterPart(this.subsystems[i]);
            if (part)
            {
                return part;
            }
        }

        return TnyShip.GetBoosterPart(this.wrapped);
    }

    GetBoosterParts(out = [])
    {
        this.ForEachPart(part =>
        {
            if (TnyShip.GetBoosterPart(part))
            {
                out.push(part);
            }
        });

        return out;
    }

    Update(dt)
    {
        super.Update(dt);

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (subsystem.Update)
            {
                subsystem.Update(dt);
            }
        }

        return true;
    }

    UpdateLod(frustum)
    {
        this._ForEachPart("UpdateLod", frustum);
    }

    ResetLod()
    {
        this._ForEachPart("ResetLod");
    }

    UpdateViewDependentData(parentTransform, dt)
    {
        this.SetParentTransform(parentTransform || null);
        this.RebuildTransforms({ skipUpdate: true });
        this._ForEachPart("UpdateViewDependentData", TnyStrategicCruiser.global.mat4_ID, dt);
    }

    OnWorldTransformModified(world)
    {
        this._UpdatePartTransforms(world);
        this.EmitEvent("transform_modified", this, world);
    }

    OnRebuildBounds()
    {
        const { box3_0 } = TnyStrategicCruiser.global;
        let hasBounds = false;

        if (this.wrapped && this.wrapped.GetBoundingBox && this.wrapped.GetBoundingBox(box3_0, true))
        {
            box3.copy(this._boundingBox, box3_0);
            hasBounds = true;
        }

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (!subsystem.GetBoundingBox || !subsystem.GetBoundingBox(box3_0, true)) continue;

            if (hasBounds)
            {
                box3.union(this._boundingBox, this._boundingBox, box3_0);
            }
            else
            {
                box3.copy(this._boundingBox, box3_0);
                hasBounds = true;
            }
        }

        if (hasBounds)
        {
            sph3.fromBox3(this._boundingSphere, this._boundingBox);
            this._boundsDirty = false;
            return;
        }

        super.OnRebuildBounds();
    }

    _OnTransformUpdated(world)
    {
        this._UpdatePartTransforms(world);
    }

    _UpdatePartTransforms(world)
    {
        const transform = world || this.GetWorldTransform(TnyStrategicCruiser.global.mat4_0);

        if (this.wrapped)
        {
            this._UpdatePartTransform(this.wrapped, transform);
        }

        for (let i = 0; i < this.subsystems.length; i++)
        {
            this._UpdatePartTransform(this.subsystems[i], transform);
        }
    }

    _UpdatePartTransform(part, transform)
    {
        if (part && part.SetTransform)
        {
            part.SetTransform(transform || this.GetWorldTransform(TnyStrategicCruiser.global.mat4_0));
        }
    }

    _ForEachPart(methodName, arg0, arg1)
    {
        if (this.wrapped && this.wrapped[methodName])
        {
            this.wrapped[methodName](arg0, arg1);
        }

        for (let i = 0; i < this.subsystems.length; i++)
        {
            const subsystem = this.subsystems[i];
            if (subsystem[methodName])
            {
                subsystem[methodName](arg0, arg1);
            }
        }
    }

    _AssertShip(ship, message)
    {
        if (ship && !(ship instanceof EveShip2 || ship instanceof EveShip))
        {
            throw new TypeError(message);
        }
    }

    static OFFSET_CENTER = false;

    // Tech3 SOF parts are ordered by slot and race-locked by hull prefix.
    static SOF_HULL_ROOT = "res:/dx9/model/spaceobjectfactory/hulls";

    static HULLS_BY_RACE = {
        amarr: "asc1_t3",
        caldari: "csc1_t3",
        gallente: "gsc1_t3",
        minmatar: "msc1_t3"
    };

    static SUBSYSTEM_ORDER = [ "s1", "s2", "s3", "s4" ];

    static SUBSYSTEM_VARIANTS = [ "v1", "v2", "v3" ];

    static GetHullNameForRace(race)
    {
        const key = race ? String(race).toLowerCase() : "";
        return this.HULLS_BY_RACE[key] || "";
    }

    static GetSofHullPath(hullName)
    {
        return hullName ? `${this.SOF_HULL_ROOT}/${hullName}.black` : "";
    }

    static GetSofSubsystemPath(hullName, subsystem, variant)
    {
        if (!hullName || !subsystem || !variant)
        {
            return "";
        }

        return `${this.SOF_HULL_ROOT}/${hullName}_${subsystem}${variant}.black`;
    }

    static global = {
        box3_0: box3.create(),
        mat4_0: mat4.create(),
        mat4_ID: mat4.create()
    };

}
