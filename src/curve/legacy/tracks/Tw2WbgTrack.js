import { generateID, defineMetadata } from "utils";
import { tw2 } from "global";
import { vec3, quat, mat4, curve } from "math";

/**
 * Tw2WbgTrack
 *
 * @property {String|number} _id
 * @property {String} name
 * @property {String} geometryResPath
 * @property {Object} geometryRes
 * @property {String} group
 * @property {number} duration
 * @property {Boolean} cycle
 */
export function Tw2WbgTrack()
{

    this.name = "";
    this.geometryResPath = "";
    this.geometryRes = null;
    this.group = "";
    this.duration = 0;
    this.cycle = false;

    this._id = generateID();

    /**
     * SetCurves
     * @param self
     * @private
     */
    function SetCurves(self)
    {
        if (!self.name || !self.group || !self.geometryRes)
        {
            return;
        }

        for (let i = 0; i < self.geometryRes.animations.length; ++i)
        {
            let animation = self.geometryRes.animations[i];
            for (let j = 0; j < animation.trackGroups.length; ++j)
            {
                if (animation.trackGroups[j].name === self.group)
                {
                    self._ApplyTracks(animation.trackGroups[j], animation.duration);
                }
            }
        }
    }

    /**
     * Initialize
     */
    this.Initialize = function()
    {
        if (this.geometryResPath)
        {
            this.geometryRes = tw2.GetResource(this.geometryResPath, res => SetCurves(this));
        }
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     */
    this.UpdateValue = function(time)
    {
        if (!this._TracksReady()) return;
        if (this.cycle) time = time % this.duration;
        if (time <= this.duration && time >= 0) this._UpdateValue(time);
    };
}

defineMetadata("type", "Tw2WbgTrack", Tw2WbgTrack);

/**
 * Tw2WbgTransformTrack
 *
 * @property {String|number} _id
 * @property {vec3} translation
 * @property {quat} rotation
 * @property {vec3} scale
 */
export function Tw2WbgTransformTrack()
{
    this._id = generateID();
    this.translation = vec3.create();
    this.rotation = quat.create();
    this.rotation[3] = 1;
    this.scale = vec3.create();

    let positionCurve = null;
    let rotationCurve = null;
    let scaleCurve = null;
    let scaleShear = mat4.create();

    /**
     * _TracksReady
     * @returns {*}
     * @private
     */
    this._TracksReady = function()
    {
        return positionCurve || rotationCurve || scaleCurve;
    };

    /**
     * _ApplyTracks
     * @param trackGroup
     * @param duration
     * @private
     */
    this._ApplyTracks = function(trackGroup, duration)
    {
        for (let i = 0; i < trackGroup.transformTracks.length; ++i)
        {
            let track = trackGroup.transformTracks[i];
            if (track.name === this.name)
            {
                this.duration = duration;
                positionCurve = track.position;
                rotationCurve = track.orientation;
                scaleCurve = track.scaleShear;
            }
        }
        this.UpdateValue(0);
    };

    /**
     * Updates a value at a specific time
     * @param {number} time
     * @prototype
     */
    this._UpdateValue = function(time)
    {
        if (positionCurve)
        {
            curve.evaluate(positionCurve, time, this.translation, this.cycle, this.duration);
        }

        if (rotationCurve)
        {
            curve.evaluate(rotationCurve, time, this.rotation, this.cycle, this.duration);
            quat.normalize(this.rotation, this.rotation);
        }

        if (scaleCurve)
        {
            curve.evaluate(scaleCurve, time, scaleShear, this.cycle, this.duration);
        }

        this.scale[0] = scaleShear[0];
        this.scale[1] = scaleShear[5];
        this.scale[2] = scaleShear[10];
    };
}

/**
 * @type {Tw2WbgTrack}
 * @prototype
 */
Tw2WbgTransformTrack.prototype = new Tw2WbgTrack();

defineMetadata("type", "Tw2WbgTransformTrack", Tw2WbgTransformTrack);
