import {vec3, mat4, util, Tw2BaseClass} from "../../global";

/**
 * EvePerMuzzleData
 *
 * @property {number} constantDelay
 * @property {number} currentStartDelay
 * @property {number} elapsedTime
 * @property muzzlePositionBone
 * @property {mat4} muzzleTransform
 * @property {Boolean} readyToStart
 * @property {Boolean} started
 */
export class EvePerMuzzleData extends Tw2BaseClass
{
    
    //ccpwgl
    constantDelay = 0;
    currentStartDelay = 0;
    elapsedTime = 0;
    muzzlePositionBone = null;
    muzzleTransform = mat4.create();
    readyToStart = false;
    started = false;
    
}

Tw2BaseClass.define(EvePerMuzzleData, Type =>
{
    return {
        type: "EvePerMuzzleData",
        isLeaf: true,
        props: {
            constantDelay: Type.NUMBER,
            currentStartDelay: Type.NUMBER,
            elapsedTime: Type.NUMBER,
            muzzlePositionBone: Type.OBJECT,
            muzzleTransform: Type.MATRIX4,
            readyToStart: Type.BOOLEAN,
            started: Type.BOOLEAN
        }
    };
});


/**
 * EveTurretFiringFX
 * TODO: Implement "boneName",
 * TODO: Implement "destinationObserver",
 * TODO: Implement "firingDurationOverride",
 * TODO: Implement "firingPeakTime",
 * TODO: Implement "maxRadius",
 * TODO: Implement "minRadius",
 * TODO: Implement "scaleEffectTarget",
 * TODO: Implement "sourceObserver",
 * TODO: Implement "startCurveSet",
 * TODO: Implement "stopCurveSet"
 *
 * @property {String} boneName                         -
 * @property {TriObserverLocal} destinationObserver    -
 * @property {Number} firingDelay1                     -
 * @property {Number} firingDelay2                     -
 * @property {Number} firingDelay3                     -
 * @property {Number} firingDelay4                     -
 * @property {Number} firingDurationOverride           -
 * @property {Number} firingPeakTime                   -
 * @property {Boolean} isLoopFiring                    -
 * @property {Number} maxRadius                        -
 * @property {Number} maxScale                         -
 * @property {Number} minRadius                        -
 * @property {Number} minScale                         -
 * @property {Boolean} scaleEffectTarget               -
 * @property {TriObserverLocal} sourceObserver         -
 * @property {TriCurveSet} startCurveSet               -
 * @property {TriCurveSet} stopCurveSet                -
 * @property {Array.<EveStretch|EveStretch2>} stretch  -
 * @property {Boolean} useMuzzleTransform              -
 * @property {Boolean} display                         -
 * @property {Array.<EveStretch>} stretch              -
 * @property {Boolean} useMuzzleTransform              -
 * @property {number} firingDelay5                     -
 * @property {number} firingDelay6                     -
 * @property {number} firingDelay7                     -
 * @property {number} firingDelay8                     -
 * @property {vec3} _endPosition                       -
 * @property {number} _firingDuration                  -
 * @property {Boolean} _isFiring                       - Identifies if the firing fx is firing
 * @property {Array.<EvePerMuzzleData>} _perMuzzleData -
 */
export default class EveTurretFiringFX extends Tw2BaseClass
{

    // ccp
    boneName = "";
    destinationObserver = null;
    firingDelay1 = 0;
    firingDelay2 = 0;
    firingDelay3 = 0;
    firingDelay4 = 0;
    firingDurationOverride = 0;
    firingPeakTime = 0;
    isLoopFiring = false;
    maxRadius = 0;
    maxScale = 0;
    minRadius = 0;
    minScale = 0;
    scaleEffectTarget = false;
    sourceObserver = null;
    startCurveSet = null;
    stopCurveSet = null;
    stretch = [];
    useMuzzleTransform = false;
    
    // ccpwgl
    display = true;
    firingDelay5 = 0;
    firingDelay6 = 0;
    firingDelay7 = 0;
    firingDelay8 = 0;
    _endPosition = vec3.create();
    _firingDuration = 0;
    _isFiring = false;
    _perMuzzleData = [];


    /**
     * Initializes the turret firing fx
     */
    Initialize()
    {
        this._firingDuration = this.GetCurveDuration();
        for (let i = 0; i < this.stretch.length; ++i)
        {
            this._perMuzzleData[i] = new EvePerMuzzleData();
        }

        const data = this._perMuzzleData;
        if (data.length > 0) data[0].constantDelay = this.firingDelay1;
        if (data.length > 1) data[1].constantDelay = this.firingDelay2;
        if (data.length > 2) data[2].constantDelay = this.firingDelay3;
        if (data.length > 3) data[3].constantDelay = this.firingDelay4;
        if (data.length > 4) data[4].constantDelay = this.firingDelay5;
        if (data.length > 5) data[5].constantDelay = this.firingDelay6;
        if (data.length > 6) data[6].constantDelay = this.firingDelay7;
        if (data.length > 7) data[7].constantDelay = this.firingDelay8;
    }

    /**
     * Gets the total curve duration
     * @returns {number}
     */
    GetCurveDuration()
    {
        let maxDuration = 0;
        for (let i = 0; i < this.stretch.length; ++i)
        {
            const stretch = this.stretch[i];
            for (let j = 0; j < stretch.curveSets.length; ++j)
            {
                maxDuration = Math.max(maxDuration, stretch.curveSets[j].GetMaxCurveDuration());
            }
        }
        return maxDuration;
    }

    /**
     * Gets a count of stretch effects
     * @returns {Number}
     */
    GetPerMuzzleEffectCount()
    {
        return this.stretch.length;
    }

    /**
     * Sets the firing fx's end position
     * @param {vec3} v
     */
    SetEndPosition(v)
    {
        this._endPosition[0] = v[0];
        this._endPosition[1] = v[1];
        this._endPosition[2] = v[2];
    }

    /**
     * Sets muzzle bone id
     * @param {number} index
     * @param bone
     */
    SetMuzzleBoneID(index, bone)
    {
        this._perMuzzleData[index].muzzlePositionBone = bone;
    }

    /**
     * Gets a muzzle's transform
     * @param {number} index
     * @returns {mat4}
     */
    GetMuzzleTransform(index)
    {
        return this._perMuzzleData[index].muzzleTransform;
    }

    /**
     * Prepares the firing effect
     * @param {number} delay
     * @param {number} [muzzleID=-1]
     */
    PrepareFiring(delay, muzzleID = -1)
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (muzzleID < 0 || muzzleID === i)
            {
                this._perMuzzleData[i].currentStartDelay = delay + this._perMuzzleData[i].constantDelay;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
            else
            {
                this._perMuzzleData[i].currentStartDelay = Number.MAX_VALUE;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
        }
        this._isFiring = true;
    }

    /**
     * Starts a muzzle effect
     * @param {number} muzzleID
     */
    StartMuzzleEffect(muzzleID)
    {
        const stretch = this.stretch[muzzleID];
        for (let i = 0; i < stretch.curveSets.length; ++i)
        {
            const curveSet = stretch.curveSets[i];
            switch (curveSet.name)
            {
                case "play_start":
                case "play_loop":
                    curveSet.PlayFrom(-this._perMuzzleData[muzzleID].currentStartDelay);
                    break;

                case "play_stop":
                    curveSet.Stop();
                    break;
            }
        }
        this._perMuzzleData[muzzleID].started = true;
        this._perMuzzleData[muzzleID].readyToStart = false;
    }

    /**
     * Stops the firing effect
     */
    StopFiring()
    {
        for (let j = 0; j < this.stretch.length; ++j)
        {
            const stretch = this.stretch[j];
            for (let i = 0; i < stretch.curveSets.length; ++i)
            {
                const curveSet = stretch.curveSets[i];
                switch (curveSet.name)
                {
                    case "play_start":
                    case "play_loop":
                        curveSet.Stop();
                        break;

                    case "play_stop":
                        curveSet.Play();
                        break;
                }
            }
            this._perMuzzleData[j].started = false;
            this._perMuzzleData[j].readyToStart = false;
            this._perMuzzleData[j].currentStartDelay = 0;
            this._perMuzzleData[j].elapsedTime = 0;
        }
        this._isFiring = false;
    }

    /**
     * Updates view dependant data
     */
    UpdateViewDependentData()
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            this.stretch[i].UpdateViewDependentData();
        }
    }

    /**
     * Per frame update
     * @param {number} dt - Delta time
     */
    Update(dt)
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started)
            {
                this._perMuzzleData[i].elapsedTime += dt;
            }

            if (this._perMuzzleData[i].elapsedTime < this._firingDuration || this.isLoopFiring)
            {
                if (this._isFiring)
                {
                    if (!this._perMuzzleData[i].started)
                    {
                        if (this._perMuzzleData[i].readyToStart)
                        {
                            this.StartMuzzleEffect(i);
                            this._perMuzzleData[i].currentStartDelay = 0;
                            this._perMuzzleData[i].elapsedTime = 0;
                        }
                        else
                        {
                            this._perMuzzleData[i].currentStartDelay -= dt;
                        }

                        if (this._perMuzzleData[i].currentStartDelay <= 0)
                        {
                            this._perMuzzleData[i].readyToStart = true;
                        }
                    }
                    else
                    {
                        if (this.useMuzzleTransform)
                        {
                            this.stretch[i].SetSourceTransform(this._perMuzzleData[i].muzzleTransform);
                        }
                        else
                        {
                            this.stretch[i].SetSourcePositionFromTransform(this._perMuzzleData[i].muzzleTransform);
                        }
                        this.stretch[i].SetDestinationPosition(this._endPosition);
                        this.stretch[i].SetIsNegZForward(true);
                    }
                }
            }
            this.stretch[i].Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this._isFiring) return;

        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started && (this._firingDuration >= this._perMuzzleData[i].elapsedTime || this.isLoopFiring))
            {
                this.stretch[i].GetBatches(mode, accumulator, perObjectData);
            }
        }
    }

}

Tw2BaseClass.define(EveTurretFiringFX, Type =>
{
    return {
        isStaging: true,
        type: "EveTurretFiringFX",
        props: {
            boneName: Type.STRING,
            destinationObserver: ["TriObserverLocal"],
            display: Type.BOOLEAN,
            firingDelay1: Type.NUMBER,
            firingDelay2: Type.NUMBER,
            firingDelay3: Type.NUMBER,
            firingDelay4: Type.NUMBER,
            firingDelay5: Type.NUMBER,
            firingDelay6: Type.NUMBER,
            firingDelay7: Type.NUMBER,
            firingDelay8: Type.NUMBER,
            firingDurationOverride: Type.NUMBER,
            firingPeakTime: Type.NUMBER,
            isLoopFiring: Type.BOOLEAN,
            maxRadius: Type.NUMBER,
            maxScale: Type.NUMBER,
            minRadius: Type.NUMBER,
            minScale: Type.NUMBER,
            scaleEffectTarget: Type.BOOLEAN,
            sourceObserver: ["TriObserverLocal"],
            startCurveSet: ["TriCurveSet"],
            stopCurveSet: ["TriCurveSet"],
            stretch: [["EveStretch", "EveStretch2"]],
            useMuzzleTransform: Type.BOOLEAN
        },
        watch: [
            "firingDelay5",
            "firingDelay6",
            "firingDelay7",
            "firingDelay8",
        ],
        notImplemented: [
            "boneName",
            "destinationObserver",
            "firingDurationOverride",
            "firingPeakTime",
            "maxRadius",
            "minRadius",
            "scaleEffectTarget",
            "sourceObserver",
            "startCurveSet",
            "stopCurveSet"
        ]
    };
});
