import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { EveObjectSet, EveObjectSetItem } from "eve";
import { EveSpriteSet } from "eve/item/EveSpriteSet";


@meta.notImplemented
export class EveSpriteLineSetBatch
{

    spriteLineSet = null;

    /**
     * Commits the batch for rendering
     * @param {String} technique
     */
    Commit(technique)
    {
        this.spriteLineSet.Render(technique);
    }

}


@meta.partialImplementation
@meta.define("EveSpriteLineSetItem", true)
export class EveSpriteLineSetItem extends EveObjectSetItem
{

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkPhaseShift = 0;

    @meta.float
    blinkRate = 0;

    @meta.int32
    boneIndex = 0;

    @meta.uint
    colorType = 0;

    @meta.float
    falloff = 0;

    @meta.float
    intensity = 0;

    @meta.boolean
    isCircle = false;

    @meta.float
    maxScale = 0;

    @meta.float
    minScale = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    spacing = 0;

    @meta.boolean
    display = true;

    @meta.matrix4
    transform = mat4.create();

    _dirty = true;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

    /** Carbon EveSpriteLineSetItem.cpp:52. These positions also feed its lights. */
    GetPositions()
    {
        const positions = [];
        const count = Math.trunc(this.isCircle ? this.spacing : this.scaling[0]);
        if (this.isCircle)
        {
            let angle = 0;
            for (let i = 0; i < count; i++)
            {
                const position = vec3.fromValues(this.scaling[0] * Math.sin(angle), 0, this.scaling[1] * Math.cos(angle));
                vec3.transformQuat(position, position, this.rotation);
                vec3.add(position, position, this.position);
                positions.push(position);
                angle += 2 * Math.PI / this.spacing;
            }
        }
        else
        {
            const position = vec3.clone(this.position);
            const direction = vec3.transformQuat(vec3.create(), [ 1, 0, 0 ], this.rotation);
            for (let i = 0; i < count; i++)
            {
                positions.push(vec3.clone(position));
                vec3.scaleAndAdd(position, position, direction, this.spacing);
            }
        }
        return positions;
    }

}


@meta.partialImplementation
@meta.define("EveSpriteLineSet", true)
export class EveSpriteLineSet extends EveObjectSet
{
    @meta.list("EveSpriteLight")
    lights = [];

    _activationStrength = 1;

    /** Carbon uses the same EveSpriteLight records and light loops as EveSpriteSet. */
    AddLightFromSOF(light)
    {
        EveSpriteSet.prototype.AddLightFromSOF.call(this, light);
    }

    UpdateLights(parentTransform, bones, boneCount, activationStrength, boosterGain)
    {
        EveSpriteSet.prototype.UpdateLights.call(this, parentTransform, bones, boneCount, activationStrength, boosterGain);
    }

    GetLights(collector, parentContext)
    {
        EveSpriteSet.prototype.GetLights.call(this, collector, parentContext);
    }

    GetResources(out = [])
    {
        return EveSpriteSet.prototype.GetResources.call(this, out);
    }

    /** Sprite-line geometry remains unimplemented. Light visibility is independent. */
    GetBoundingBox(out, force)
    {
        return null;
    }

    GetBatches(mode, accumulator, perObjectData)
    {
        return false;
    }

    static Item = EveSpriteLineSetItem;

}
