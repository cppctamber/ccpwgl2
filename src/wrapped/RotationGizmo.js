import { EveCurveLineSet } from "eve/item";
import { Tw2Transform } from "core/Tw2Transform";
import { Model } from "global/meta";
import { vec3, mat4, quat } from "math";


export class RotationGizmo extends Model
{

    display = true;
    name = "Rotation Gizmo";

    rotation = quat.create();
    translation = vec3.create();
    scale = 1;

    //scaling = vec3.fromValues(1, 1, 1);

    _lines = [];
    _localTransform = mat4.create();
    _worldTransform = mat4.create();
    _parentTransform = null;

    get x()
    {
        return this._lines[0] || null;
    }

    get y()
    {
        return this._lines[1] || null;
    }

    get z()
    {
        return this._lines[2] || null;
    }

    get w()
    {
        return this._lines[3] || null;
    }

    constructor(dim=0)
    {
        super();
        const Ctor = this.constructor;
        for (let i = 0; i < 4; i++)
        {
            let scale = 1 + (i * 0.01);
            if (i == 3) scale +=0.03;

            const line = EveCurveLineSet.CreateCircle({
                name: Ctor.DefaultNames[i],
                color: Ctor.DefaultColors[i],
                radius: 1,
                dots: Ctor.DefaultSteps,
                width: Ctor.DefaultWidth,
                enableZ: Ctor.DefaultEnableZ,
                lookAtCamera: i === 3,
                rotation: Ctor.DefaultRotation[i],
                direction: i !== 3 ? Ctor.DefaultDirection : 0,
                scaling: [ scale, scale, scale ],
                xWidth: i === 3 ? 0 : dim,
                xHeight: i === 3 ? dim : 0
            });

            this._lines.push(line);
        }

    }

    EnableZ(bool)
    {
        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].enableZ = bool;
        }
    }

    /**
     * Sets the x axis color
     * @param color
     */
    SetXColor(color)
    {
        this.x.ChangeAllItemColors(color, color);
    }

    /**
     * Sets the y axis color
     * @param color
     */
    SetYColor(color)
    {
        this.y.ChangeAllItemColors(color, color);
    }

    /**
     * Sets the z axis color
     * @param color
     */
    SetZColor(color)
    {
        this.z.ChangeAllItemColors(color, color);
    }

    /**
     * Sets the w axis color
     * @param color
     */
    SetWColor(color)
    {
        this.w.ChangeAllItemColors(color, color);
    }

    /**
     * Sets the gizmo's line width
     * @param width
     */
    SetWidth(width)
    {
        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].ChangeAllItemWidths(width);
        }
    }


    Unload(opt)
    {
        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].Unload(opt);
        }
    }


    Rebuild(opt)
    {
        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].Rebuild(opt);
        }
    }


    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display) return;

        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].GetBatches(mode, accumulator, perObjectData);
        }
    }

    Update(dt)
    {
        if (!this.display) return;

        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].Update(dt);
        }
    }

    UpdateViewDependentData(parentTransform)
    {
        if (!this.display) return;

        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.translation, [ this.scale, this.scale, this.scale ]);

        // Allow binding a parent transform
        if (this._parentTransform)
        {
            parentTransform = this._parentTransform;
        }

        if (parentTransform)
        {
            mat4.multiply(this._worldTransform, parentTransform, this._localTransform);
        }
        else
        {
            mat4.copy(this._worldTransform, this._localTransform);
        }

        for (let i = 0; i < this._lines.length; i++)
        {
            this._lines[i].UpdateViewDependentData(this._worldTransform);
        }
    }

    static DefaultNames = [ "xAxis", "yAxis", "zAxis", "wAxis" ];
    static DefaultColors = [ [ 1, 0, 0, 1 ], [ 0, 1, 0, 1 ], [ 0, 0, 1, 1 ], [ 1, .5, 0, 1 ] ];
    static DefaultRotation = [
        quat.rotateX([], [ 0, 0, 0, 1 ], Math.PI / 2),
        quat.rotateY([], [ 0, 0, 0, 1 ], Math.PI / 2),
        quat.rotateZ([], [ 0, 0, 0, 1 ], Math.PI / 2),
        [ 0, 0, 0, 1 ]
    ];
    static DefaultSteps = 360;
    static DefaultEnableZ = true;
    static DefaultWidth = 3;
    static DefaultDirection = 0.05;

    static global = {
        mat4_0: mat4.create()
    };
}
