import { meta, curve, vec3, quat, mat4, util, resMan } from "global";


@meta.ctor("Tw2TransformTrack")
export class Tw2TransformTrack
{

    @meta.string
    name = "";

    @meta.path
    resPath = "";

    @meta.struct()
    res = null;

    @meta.string
    group = "";

    @meta.boolean
    cycle = false;

    @meta.float
    duration = 0;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scale = vec3.fromValues(0, 0, 0);

    @meta.matrix4
    scaleShear = mat4.create();

    @meta.struct()
    positionCurve = null;

    @meta.struct()
    orientationCurve = null;

    @meta.struct()
    scaleCurve = null;


    _id = util.generateID();

    /**
     * Initializes the Curve
     */
    Initialize()
    {
        if (this.resPath !== "")
        {
            this.res = resMan.GetResource(this.resPath);
        }
    }

    /**
     * Gets curve length
     *
     * @returns {number}
     */
    GetLength()
    {
        return this.duration;
    }

    /**
     * Updates a value at a specific time
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        if (!this.res || !this.res.IsGood()) return;
        if (!this.positionCurve) this.FindTracks();
        if (!this.positionCurve) return;
        if (this.cycle) time = time % this.duration;
        if (time > this.duration || time < 0) return;

        curve.evaluate(this.positionCurve, time, this.translation, this.cycle, this.duration);
        curve.evaluate(this.orientationCurve, time, this.rotation, this.cycle, this.duration);
        quat.normalize(this.rotation, this.rotation);
        curve.evaluate(this.scaleCurve, time, this.scaleShear, this.cycle, this.duration);
        mat4.getScaling(this.scale, this.scaleCurve);
    }

    /**
     * FindTracks
     */
    FindTracks()
    {
        let group = null;
        for (let i = 0; i < this.res.animations.length; ++i)
        {
            for (let j = 0; j < this.res.animations[i].trackGroups.length; ++j)
            {
                if (this.res.animations[i].trackGroups[j].name === this.group)
                {
                    this.duration = this.res.animations[i].duration;
                    group = this.res.animations[i].trackGroups[j];
                    break;
                }
            }
        }

        if (!group) return;

        for (let i = 0; i < group.transformTracks.length; ++i)
        {
            if (this.name === group.transformTracks[i].name)
            {
                this.positionCurve = group.transformTracks[i].position;
                this.orientationCurve = group.transformTracks[i].orientation;
                this.scaleCurve = group.transformTracks[i].scaleShear;
                break;
            }
        }
    }

}
