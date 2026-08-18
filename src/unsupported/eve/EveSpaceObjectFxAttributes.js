import { meta } from "utils";
import { mat4, quat, vec3 } from "math";

/**
 * EveSpaceObjectFxAttributes
 *
 */
@meta.type("EveSpaceObjectFxAttributes")
@meta.define({
    wgl: "EveSpaceObjectFxAttributes",
    ccp: true
})
export class EveSpaceObjectFxAttributes extends meta.Model
{

    @meta.string
    name = "";

    source = null;
    activationStrength = 1;
    boundingSphereRadius = 0;
    generatedShapeEllipsoidCenter = vec3.create();
    generatedShapeEllipsoidRadius = vec3.create();
    activeTurretCount = 0;
    parentWorldTranslation = vec3.create();
    parentWorldRotation = quat.fromValues(0, 0, 0, 0);
    ship = 0;
    childParent = 0;
    killCount = 0;

    /**
     * Drives the attributes from the ROOT space object.
     *
     * Carbon `EveSpaceObjectFxAttributes::UpdateAsyncronous`
     * (`EveSpaceObject/Utils/fxAttributes/EveSpaceObjectFxAttributes.cpp:27`).
     * The parent is the ROOT, not the containing child - a nested container
     * forwards the same object down, so an attribute five levels deep still
     * reads the ship.
     *
     * Every read is guarded. ccpwgl exposes none of Carbon's accessors
     * (`GetModelCenterWorldPosition`, `GetKillCounterValue`, ...) on
     * EveShip2, so each falls back to the equivalent property and is simply
     * left alone when neither exists. An attribute on an object that cannot
     * supply a value keeps its previous one rather than being zeroed.
     * @param {*} [updateContext]
     * @param {Object} [params]
     * @param {*} [params.spaceObjectParent] - the root space object
     * @param {Number} [params.activationStrength]
     */
    UpdateAsyncronous(updateContext, params)
    {
        const parent = params && params.spaceObjectParent;
        if (!parent) return;

        if (!this._initialized)
        {
            if (typeof parent.GetShapeEllipsoid === "function")
            {
                parent.GetShapeEllipsoid(this.generatedShapeEllipsoidCenter, this.generatedShapeEllipsoidRadius);
            }
            this._initialized = true;
        }

        // Model centre in world space. Carbon asks the object; ccpwgl keeps it
        // as a local bounding-sphere centre, so it has to be taken through the
        // world transform rather than read directly.
        const transform = typeof parent.GetWorldTransform === "function"
            ? parent.GetWorldTransform(EveSpaceObjectFxAttributes.global.mat4_0)
            : parent._worldTransform || null;

        const position = EveSpaceObjectFxAttributes.global.vec3_0;
        if (typeof parent.GetModelCenterWorldPosition === "function")
        {
            parent.GetModelCenterWorldPosition(position);
        }
        else if (parent.boundingSphereCenter && transform)
        {
            vec3.transformMat4(position, parent.boundingSphereCenter, transform);
        }
        else if (transform)
        {
            vec3.set(position, transform[12], transform[13], transform[14]);
        }
        else
        {
            vec3.set(position, 0, 0, 0);
        }

        vec3.copy(this.parentWorldTranslation, position);
        // mat4.getRotation, not quat.fromMat4 - the latter does not exist here.
        if (transform) mat4.getRotation(this.parentWorldRotation, transform);

        this.activationStrength = Number(params.activationStrength !== undefined ? params.activationStrength : 1);

        // Carbon computes the distance BEFORE replacing the cached radius, so
        // it is one frame stale by construction. Reproduced, not corrected.
        this.ship = vec3.length(position) - this.boundingSphereRadius;

        if (typeof parent.GetBoundingSphere === "function")
        {
            const sphere = parent.GetBoundingSphere(EveSpaceObjectFxAttributes.global.sph3_0);
            if (sphere && sphere.length >= 4) this.boundingSphereRadius = sphere[3];
        }
        else if (parent.boundingSphereRadius !== undefined)
        {
            this.boundingSphereRadius = parent.boundingSphereRadius;
        }

        // Carbon gates these on the root being an EveShip2. Duck-typed here so
        // this module stays free of an import cycle back into eve/object.
        if (typeof parent.GetActiveTurretCount === "function")
        {
            this.activeTurretCount = Number(parent.GetActiveTurretCount());
        }
        else if (parent.activeTurretCount !== undefined)
        {
            this.activeTurretCount = Number(parent.activeTurretCount);
        }

        if (typeof parent.GetKillCounterValue === "function")
        {
            this.killCount = Number(parent.GetKillCounterValue());
        }
        else if (parent.killCount !== undefined)
        {
            this.killCount = Number(parent.killCount);
        }
    }

    _initialized = false;

    /**
     * Scratch
     * @type {Object}
     */
    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create(),
        sph3_0: new Float32Array(4)
    };

}
