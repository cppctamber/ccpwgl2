import { meta } from "utils";
import { vec3, vec4, quat, mat4, box3 } from "math";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";
import { EveSpriteSet, EveSpriteSetItem } from "./EveSpriteSet";


/**
 * Carbon EveSpriteLineSetItem: a line or circle of evenly spaced sprites that
 * share one colour, blink and scale.
 */
@meta.define("EveSpriteLineSetItem", true)
export class EveSpriteLineSetItem extends EveObjectSetItem
{

    @meta.string
    name = "";

    @meta.boolean
    isCircle = false;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    spacing = 0;

    @meta.float
    blinkRate = 0;

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkPhaseShift = 0;

    @meta.float
    minScale = 0;

    @meta.float
    maxScale = 0;

    @meta.float
    falloff = 0;

    @meta.color
    color = vec4.create();

    @meta.int32
    boneIndex = 0;

    /**
     * Carbon EveSpriteLineSetItem::GetPositions (EveSpriteLineSetItem.cpp:52).
     * A line puts `scaling[0]` sprites `spacing` apart along the item's local
     * x axis; a circle puts `spacing` sprites on an ellipse of radii
     * `scaling[0]` and `scaling[1]`. These positions also feed the set's lights.
     * @returns {Array<vec3>}
     */
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

    /**
     * A line's local transform
     * @param {mat4} out
     * @returns {mat4} out
     */
    GetTransform(out)
    {
        return mat4.fromRotationTranslation(out, this.rotation, this.position);
    }

    /**
     * The box around every sprite the line places, each grown by its largest
     * rendered extent - the same test EveSpriteSetItem uses.
     * @param {box3} out
     * @returns {box3} out
     */
    GetBoundingBox(out)
    {
        box3.empty(out);
        const radius = this.maxScale * EveSpriteSet.itemBoundsScaleMultiplier;
        const { vec3_0 } = EveObjectSet.global;
        for (const position of this.GetPositions())
        {
            box3.addPoint(out, out, vec3.set(vec3_0, position[0] - radius, position[1] - radius, position[2] - radius));
            box3.addPoint(out, out, vec3.set(vec3_0, position[0] + radius, position[1] + radius, position[2] + radius));
        }
        return out;
    }

}


/**
 * Carbon EveSpriteLineSet: blinking sprites laid out along lines and circles.
 *
 * Carbon draws them as ordinary sprites: ReallocateResources
 * (EveSpriteLineSet.cpp:84-138) expands every line into EveSpriteSet's own
 * pool vertices and AddToQuadRenderer (:192-240) submits them with the set's
 * effect, which the SOF gives the sprite-set effect. ccpwgl does the same by
 * expanding the lines into EveSpriteSetItems held by an internal EveSpriteSet,
 * which already owns sprite buffers, quads and bones.
 */
@meta.define("EveSpriteLineSet", true)
export class EveSpriteLineSet extends EveObjectSet
{

    @meta.string
    name = "";

    @meta.boolean
    skinned = false;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.list("EveSpriteLight")
    lights = [];

    _activationStrength = 1;
    _boosterGain = 0;
    _sprites = new EveSpriteSet();

    /**
     * Alias for this.items
     * @returns {Array}
     */
    @meta.list("EveSpriteLineSetItem")
    get spriteLines()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set spriteLines(arr)
    {
        this.items = arr;
    }

    /**
     * Carbon EveSpriteLineSet::Setup
     * @param {Tw2Effect} effect
     * @param {Boolean} isSkinned
     */
    Setup(effect, isSkinned)
    {
        this.effect = effect;
        this.skinned = isSkinned;
        this._dirty = true;
    }

    /**
     * Initializes the set
     */
    Initialize()
    {
        // Carbon's sprite pool is the CPU-transformed quad path.
        this._sprites.UseQuads(true);
        this.Rebuild();
    }

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

    /** Carbon EveSpriteLineSet::SetShaderOption */
    SetShaderOption(name, value)
    {
        if (this.effect) this.effect.SetOption(name, value);
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        return EveSpriteSet.prototype.GetResources.call(this, out);
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     * @param {Number} spriteScale
     */
    UpdateViewDependentData(parentTransform, bones, spriteScale)
    {
        if (!this.display) return;
        super.UpdateViewDependentData(parentTransform, bones);
        // Carbon (:199-231) transforms by the bone only when the set is skinned.
        this._sprites.UpdateViewDependentData(parentTransform, this.skinned ? bones : null, spriteScale);
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        super.Update(dt);
        this._sprites.Update(dt);
    }

    /**
     * Rebuilds the sprites the lines describe.
     *
     * Carbon EveSpriteLineSet::ReallocateResources (EveSpriteLineSet.cpp:84-138):
     * every position of every line becomes one sprite carrying the line's
     * colour, blink rate, scale and falloff, its blink phase advanced by
     * `blinkPhaseShift` per sprite along the line.
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this.RebuildItems(opt);

        const sprites = this._sprites;
        sprites.effect = this.effect;
        sprites.skinned = this.skinned;
        sprites.display = this.display;
        sprites.ClearItems({ skipEvents: true });

        for (let i = 0; i < this._visibleItems.length; i++)
        {
            const line = this._visibleItems[i];
            const color = EveSpriteLineSet.PackedColor(line.color, vec4.create());
            let index = 0;
            for (const position of line.GetPositions())
            {
                sprites.items.push(EveSpriteSetItem.from({
                    position,
                    color,
                    blinkPhase: line.blinkPhase + line.blinkPhaseShift * index++,
                    blinkRate: line.blinkRate,
                    minScale: line.minScale,
                    maxScale: line.maxScale,
                    falloff: line.falloff,
                    boneIndex: this.skinned ? line.boneIndex : -1
                }));
            }
        }

        sprites.Rebuild(opt);
        super.Rebuild(opt);
    }

    /**
     * Unloads the set's buffers
     * @param {Object} [opt]
     */
    Unload(opt)
    {
        this._sprites.Unload(opt);
        super.Unload(opt);
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, world)
    {
        if (!this.display) return false;
        return this._sprites.GetBatches(mode, accumulator, perObjectData, world);
    }

    /**
     * A line's colour as Carbon's sprite pool stores it: the `Color` converts to
     * an 8-bit-per-channel uint (Color_inline.h:43-51) when copied into the
     * vertex, so each channel clamps to 0..1 and rounds to 1/255.
     *
     * Donor quirk: SOF sets the colour to `intensity * colorSet[colorType]`
     * (EveSOF.cpp:1373), so an intensity above 1 saturates at white here where
     * an EveSpriteSet item keeps it.
     * @param {vec4} color
     * @param {vec4} out
     * @returns {vec4} out
     */
    static PackedColor(color, out)
    {
        for (let i = 0; i < 4; i++)
        {
            const c = color[i];
            out[i] = (c >= 1 ? 255 : c <= 0 ? 0 : Math.trunc(c * 255 + 0.5)) / 255;
        }
        return out;
    }

    static Item = EveSpriteLineSetItem;

}
