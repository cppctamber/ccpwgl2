// Source: trinity/trinity/Eve/EveUpdateContext.h

/**
 * Carries the frame inputs shared by Carbon-style visibility and logical LOD.
 *
 * This is the CPU scene subset ccpwgl consumes. It owns no renderer or
 * resource state and selecting an LOD never selects alternate geometry.
 */
export class EveUpdateContext
{

    currentTime = 0;
    lastTime = 0;
    visibilityThreshold = 5;
    highDetailThreshold = 800;
    mediumDetailThreshold = 400;
    lowDetailThreshold = 100;
    lodFactor = 1;
    invLodFactor = 1;
    frustum = null;

    /** @returns {Number} */
    GetTime()
    {
        return this.currentTime;
    }

    /** @param {Number} time */
    SetTime(time)
    {
        this.lastTime = this.currentTime;
        this.currentTime = time;
    }

    /** @returns {Number} */
    GetDeltaT()
    {
        return this.lastTime !== 0 ? this.currentTime - this.lastTime : 0;
    }

    /** @param {Number} value */
    SetVisibilityThreshold(value)
    {
        this.visibilityThreshold = value;
    }

    /** @returns {Number} */
    GetVisibilityThreshold()
    {
        return this.visibilityThreshold;
    }

    /** @param {Number} value */
    SetHighDetailThreshold(value)
    {
        this.highDetailThreshold = value;
    }

    /** @returns {Number} */
    GetHighDetailThreshold()
    {
        return this.highDetailThreshold;
    }

    /** @param {Number} value */
    SetMediumDetailThreshold(value)
    {
        this.mediumDetailThreshold = value;
    }

    /** @returns {Number} */
    GetMediumDetailThreshold()
    {
        return this.mediumDetailThreshold;
    }

    /** @param {Number} value */
    SetLowDetailThreshold(value)
    {
        this.lowDetailThreshold = value;
    }

    /** @returns {Number} */
    GetLowDetailThreshold()
    {
        return this.lowDetailThreshold;
    }

    /** @param {Number} value */
    SetLodFactor(value)
    {
        this.lodFactor = value;
        this.invLodFactor = 1 / value;
    }

    /** @returns {Number} */
    GetLodFactor()
    {
        return this.lodFactor;
    }

    /** @returns {Number} */
    GetInvLodFactor()
    {
        return this.invLodFactor;
    }

    /** @param {Tw2Frustum} frustum */
    SetFrustum(frustum)
    {
        this.frustum = frustum;
    }

    /** @returns {Tw2Frustum} */
    GetFrustum()
    {
        return this.frustum;
    }

}
