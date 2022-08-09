import { meta } from "utils";
import { vec3, mat4, quat, box3, sph3 } from "math";


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

    @meta.struct("Tw2Bone")
    @meta.isPrivate
    bone = null;

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
        return mat4.copy(m, this.transform);
    }

    /**
     * Gets a bounding box for the locator
     * @param {box3} out
     */
    GetBoundingBox(out)
    {
        return box3.fromPositionRadius(out, this.GetTranslation(vec3.create()), this.GetScale() * 2);
    }

    /**
     * Gets a bounding sphere for the locator
     * @param {sph3} out
     */
    GetBoundingSphere(out)
    {
        return sph3.fromPositionRadius(out, this.GetTranslation(vec3.create()), this.GetScale() * 2);
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
            const intersect = ray.IntersectSph3(this.GetBoundingSphere(vec3.create()), worldTransform);
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
        vec3.subtract(out, out, this.GetTranslation(EveLocator2.global.vec3_0));
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
        const transform = mat4.copy(EveLocator2.global.mat4_0, this.transform);
        vec3.normalize(transform.subarray(0, 3), transform.subarray(0, 3));
        vec3.normalize(transform.subarray(4, 7), transform.subarray(4, 7));
        vec3.normalize(transform.subarray(8, 11), transform.subarray(8, 11));
        if (worldTransform) mat4.multiply(transform, worldTransform, transform);
        mat4.getRotation(outRotation, transform);
        mat4.getTranslation(outTranslation, transform);
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
        const tr = this.transform;
        return Math.max(vec3.length([ tr[0], tr[1], tr[2] ]), vec3.length([ tr[4], tr[5], tr[6] ]));
    }


    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @param {Number} [meshIndex=0]
     * @returns {null|Tw2Bone}
     */
    FindBone(animationController, meshIndex=0)
    {
        this.bone = animationController.FindBoneForMesh(this.name, meshIndex);
        return this.bone;
    }

    /**
     * Global and static variables
     * @type {{vec3_0: vec3, mat4_0: mat4}}
     */
    static global = {
        vec3_0: vec3.create(),
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
