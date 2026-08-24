import { meta } from "utils";
import { vec3, vec4, quat, mat4, box3, sph3 } from "math";


@meta.define("EveLocator2", true)
@meta.stage(1)
export class EveLocator2 extends meta.Model
{

    @meta.string
    name = "";

    @meta.matrix4
    transform = mat4.create();

    @meta.uint
    @meta.todo("Move to EveLocator only?")
    atlasIndex0 = 0;

    @meta.uint
    @meta.todo("Move to EveLocator only?")
    atlasIndex1 = 0;

    /**
     * The three booster properties a hull's booster item carries that the
     * first generation set had no use for. `EveBoosterSet2` reads them off the
     * locator, so the locator is the only thing SOF has to populate.
     */
    @meta.vector4
    @meta.todo("Move to EveLocator only?")
    functionality = vec4.fromValues(0, 1, 1, 1);

    @meta.boolean
    @meta.todo("Move to EveLocator only?")
    hasTrail = false;

    @meta.float
    @meta.todo("Move to EveLocator only?")
    lightScale = 1;

    _bone = null;
    _meshIndex = -1;

    /**
     * Alias for _bone
     * todo: Remove all uses of this.bone
     * @returns {null}
     */
    get bone()
    {
        return this._bone;
    }

    /**
     * Checks if the locator is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return this._bone !== null;
    }

    /**
     * Gets the locator type
     * @return {Number}
     */
    get type()
    {
        const type = this.name.split("_")[1];
        return EveLocator2.LocatorType[type.toUpperCase()] || -1;
    }

    /**
     * Gets the locator's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        mat4.copy(m, this.transform);
        if (this._bone) mat4.multiply(m, this._bone.offsetTransform, m);
        return m;
    }

    /**
     * Gets the locator's world transform
     *
     * The parent's matrix is PASSED IN. It used to be pushed onto the locator
     * every frame as `_parentTransform` and read back here, which made a
     * locator's answer depend on whether its owner had updated yet - and left
     * this method throwing on a locator nobody had pushed to. The only caller
     * is Intersect, which is handed the owner's world transform as an argument
     * already.
     *
     * Model space when there is no parent, which is the honest answer for a
     * locator considered on its own.
     *
     * @param {mat4} m
     * @param {mat4} [worldTransform]
     * @returns {mat4} m
     */
    GetWorldTransform(m, worldTransform)
    {
        this.GetTransform(m);
        return worldTransform ? mat4.multiply(m, worldTransform, m) : m;
    }

    /**
     * Gets the locator's local transform
     * @param {box3} box
     * @returns {box3} box
     */
    GetBoundingBox(box)
    {

        box[0] = box[1] = box[2] = -0.5;
        box[3] = box[4] = box[5] = 0.5;

        const
            scaling = vec3.alloc(),
            translation = vec3.alloc(),
            rotation = quat.alloc(),
            transform = mat4.alloc();

        this.GetWeaponRotationTranslation(rotation, translation);
        //mat4.getRotation(rotation, this.transform);
        //mat4.getTranslation(translation, this.transform);
        scaling[0] = scaling[1] = scaling[2] = this.GetScale() * 2;
        mat4.fromRotationTranslationScale(transform, rotation, translation, scaling);
        box3.transformMat4(box, box, transform);
        if (this._bone) box3.transformMat4(box, box, this._bone.offsetTransform);

        vec3.unalloc(scaling);
        vec3.unalloc(translation);
        quat.unalloc(rotation);
        mat4.unalloc(transform);

        return box;
    }

    /**
     * Gets the locator's world bounding box
     * @param {box3} box
     * @param {mat4} [worldTransform]
     * @returns {box3} box
     */
    GetWorldBoundingBox(box, worldTransform)
    {
        this.GetBoundingBox(box);
        return worldTransform ? box3.transformMat4(box, box, worldTransform) : box;
    }

    /**
     * Gets the locator's local bounding sphere
     * @param {sph3} sph
     * @returns {sph3} sph
     */
    GetBoundingSphere(sph)
    {
        const box3_0 = box3.alloc();
        sph3.fromBox3(sph, this.GetBoundingBox(box3_0));
        box3.unalloc(box3_0);
        return sph;
    }

    /**
     * Gets the locator's world bounding sphere
     * @param {sph3} sph
     * @param {mat4} [worldTransform]
     * @returns {sph3} sph
     */
    GetWorldBoundingSphere(sph, worldTransform)
    {
        const box3_0 = box3.alloc();
        sph3.fromBox3(sph, this.GetWorldBoundingBox(box3_0, worldTransform));
        box3.unalloc(box3_0);
        return sph;
    }

    /**
     * Intersects the locator
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @return {{distance: (number|*), point: vec3}}
     */
    Intersect(ray, intersects, worldTransform)
    {
        if (!ray.GetOption("locators", "skip"))
        {
            const intersect = ray.IntersectWorldSph3(this.GetWorldBoundingSphere(EveLocator.global.sph3_0, worldTransform));
            if (intersect)
            {
                intersect.name = this.name;
                intersect.item = this;
                intersects.push(intersect);
                return intersect;
            }
        }
    }

    /**
     * Gets glow translation
     * @param {vec3} out
     * @param {Number} [offset=0]
     * @param {mat4} [worldTransform]
     * @returns {vec3}
     */
    GetGlowTranslation(out, offset, worldTransform)
    {
        this.GetDirection(out);
        if (offset) vec3.scale(out, out, offset);
        vec3.subtract(out, out, this.GetTranslation(EveLocator.global.vec3_0));
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        return out;
    }

    /**
     * Gets a weapon's rotation and translation
     * @param {quat} outRotation
     * @param {vec3} outTranslation
     * @param {mat4} [worldTransform]
     */
    GetWeaponRotationTranslation(outRotation, outTranslation, worldTransform)
    {
        const mat4_0 = EveLocator.global.mat4_0;
        mat4.copy(mat4_0, this.transform);
        vec3.normalize(mat4_0.subarray(0, 3), mat4_0.subarray(0, 3));
        vec3.normalize(mat4_0.subarray(4, 7), mat4_0.subarray(4, 7));
        vec3.normalize(mat4_0.subarray(8, 11), mat4_0.subarray(8, 11));
        if (worldTransform) mat4.multiply(mat4_0, worldTransform, mat4_0);
        mat4.getRotation(outRotation, mat4_0);
        mat4.getTranslation(outTranslation, mat4_0);
    }

    /**
     * Gets the item's position
     * @param {vec3} out
     * @param {mat4} [worldTransform]
     * @returns {vec3} out
     */
    GetTranslation(out, worldTransform)
    {
        // The bone, like GetTransform and GetBoundingBox already do. Without it a
        // locator on an animated bone reported a bone-correct BOX and a stale
        // POSITION, so anything placed here sat where the locator was authored
        // rather than where it is.
        mat4.getTranslation(out, this.GetTransform(EveLocator2.global.mat4_0));
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        return out;
    }

    /**
     * Gets the item's direction
     * @param {vec3} out
     * @param {mat4} [worldTransform]
     * @returns {vec3} out
     */
    GetDirection(out, worldTransform)
    {
        // Same as GetTranslation: read the direction off the bone-aware transform,
        // not the authored one, or a locator on a moving bone points the way it
        // was authored to point.
        const m = this.GetTransform(EveLocator2.global.mat4_0);
        vec3.set(out, m[8], m[9], m[10]);
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        vec3.normalize(out, out);
        const scale = this.GetScale();
        if (scale < 3) vec3.scale(out, out, scale / 3);
        return out;
    }

    /**
     * Gets the item's scale
     * @returns {Number}
     */
    GetScale()
    {
        const vec3_0 = EveLocator.global.vec3_0;
        const tr = this.transform;
        vec3.set(vec3_0, tr[0], tr[1], tr[2]);
        const l1 = vec3.length(vec3_0);
        vec3.set(vec3_0, tr[4], tr[5], tr[6]);
        const l2 = vec3.length(vec3_0);
        return Math.max(l1,l2);
    }


    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @param {Number} [meshIndex=0]
     * @returns {null|Tw2Bone}
     */
    FindBone(animationController, meshIndex=0)
    {
        this._bone = animationController.FindMeshBoneByName(this.name, meshIndex);

        // `_meshIndex` is the LATCH - callers skip the lookup while it matches,
        // and it exists for a good reason: a rigid hull has no bones at all, so
        // without it every locator would search by name every frame forever.
        //
        // But latching on a null treats "not ready yet" as "no such bone". A
        // locator resolved before its geometry finished loading would then stay
        // boneless for the life of the ship while a neighbour resolved a moment
        // later got its bone - one hull, half its hardpoints stuck at the bind
        // pose, and nothing in the geometry to explain which half.
        //
        // So latch on a definitive answer only: either a bone was found, or the
        // geometry is loaded and genuinely has no bone of this name.
        //
        // NOT FindModelForMesh, which was the first thing tried here and is
        // wrong: it returns null for a RIGID hull too - geometry loaded, no
        // model binding that mesh - so a rigid hull never latched and every
        // locator on it searched by name every frame, which is the whole cost
        // the latch exists to avoid.
        if (this._bone || animationController.IsGeometryGood())
        {
            this._meshIndex = meshIndex;
        }

        return this._bone;
    }

    /**
     * Bounding scale multipler
     * @type {number}
     */
    static boundsScaleMultiplier = 2;

    /**
     * Global and static variables
     * @type {{vec3_0: vec3, mat4_0: mat4}}
     */
    static global = {
        vec3_0: vec3.create(),
        sph3_0: sph3.create(),
        mat4_0: mat4.create()
    };

    /**
     * Locator type
     * @type {{CHAIN: number, XL_TURRET: number, ATTACH: number, ATOMIC: number, BOOSTER: number, TURRET: number, AUDIO: number}}
     */
    static LocatorType = {
        UNKNOWN: 0,
        AUDIO: 1,
        ATTACH: 2,
        BOOSTER: 3,
        TURRET: 100,
        XL_TURRET: 101,
        LAUNCHER: 102,
        CHAIN: 103,
        ATOMIC: 104
    };

    /**
     * Locator types
     * todo: Change to prefix
     * @type {{AUDIO: string, ATTACH: string, BOOSTER: string, TURRET: string, XL_TURRET: string}}
     */
    static Type = {
        AUDIO: "locator_audio",
        ATTACH: "locator_attach",
        BOOSTER: "locator_booster",
        TURRET: "locator_turret",
        XL_TURRET: "locator_xl",
        CHAIN: "locator_chain",
        ATOMIC: "locator_atomic",
        LAUNCHER: "locator_launcher"
    };

}

@meta.define("EveLocator", true)
export class EveLocator extends EveLocator2
{

}
