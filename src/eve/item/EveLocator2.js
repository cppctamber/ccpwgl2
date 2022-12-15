import { meta } from "utils";
import { vec3, quat, mat4, box3, sph3 } from "math";


@meta.type("EveLocator2")
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

    _bone = null;
    _meshIndex = -1;
    _parentTransform = null;

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
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetWorldTransform(m)
    {
        this.GetTransform(m);
        return mat4.multiply(m, this._parentTransform, m);
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
     * Gets the locator's world transform
     * @param {box3} box
     * @returns {box3} box
     */
    GetWorldBoundingBox(box)
    {
        this.GetBoundingBox(box);
        return box3.transformMat4(box, box, this._parentTransform);
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
     * Gets the locator's world transform
     * @param {sph3} sph
     * @returns {sph3} sph
     */
    GetWorldBoundingSphere(sph)
    {
        const box3_0 = box3.alloc();
        sph3.fromBox3(sph, this.GetWorldBoundingBox(box3_0));
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
            const intersect = ray.IntersectWorldSph3(this.GetWorldBoundingSphere(EveLocator.global.sph3_0));
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
        mat4.getTranslation(out, this.transform);
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
        vec3.set(out, this.transform[8], this.transform[9], this.transform[10]);
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
        this._meshIndex = meshIndex;
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

@meta.type("EveLocator")
export class EveLocator extends EveLocator2
{

}
