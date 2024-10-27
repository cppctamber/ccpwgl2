import { getKeyFromValue, meta } from "utils";
import { Tw2RenderTarget } from "./Tw2RenderTarget";
import { Tw2BatchAccumulator2 } from "./batch";
import { vec4, vec2 } from "math";
import { tw2 } from "global";
import { PickingBlueChannel, RM_ADDITIVE, RM_OPAQUE, RM_PICKABLE, RM_TRANSPARENT } from "constant";
import { notImplemented } from "global/meta";

/**
 * First pass of a colour picker
 */
export class Tw2Picker
{

    @meta.string
    technique = "ExtendedPicking";

    @meta.boolean
    usePickable = false;

    @meta.boolean
    enabled = true;

    _accumulator = new Tw2BatchAccumulator2();
    _renderTarget = new Tw2RenderTarget();
    _clearColor = vec4.create();
    _buffer = new Uint8Array(4);
    _lastCoords = vec2.create();
    _pickableObjects = [];


    /**
     * Constructor
     * @param {String} [technique]
     */
    constructor(technique)
    {
        if (technique) this.technique = technique;
        this.PreparePicking([], true);
    }

    @notImplemented
    PickCCP()
    {

    }

    /**
     *
     * @param objects
     * @param event
     * @param element
     * @returns {*|null}
     * @constructor
     */
    PickFromEvent(objects, event, element)
    {
        vec2.pixelPositionFromEvent(this._lastCoords, event, element);
        return this.PreparePicking(objects) ? this.Pick(this._lastCoords) : null;
    }

    /**
     * Picks an object from coordinates
     * @param {Array|vec2} coords
     * @returns {null|*} the picked object
     */
    Pick(coords)
    {
        if (!this.enabled) return null;

        this._renderTarget.ReadPixels(this._buffer, coords[0], coords[1], 1, 1);
        const id = ((this._buffer[0] << 8) | (this._buffer[1] & 0xff)) - 1;

        tw2._readPixels = this._buffer;

        if (id === -1) return null;

        for (let i = 0; i < this._pickableObjects.length; i++)
        {
            const
                path = [],
                item = this._pickableObjects[i].FindObjectByID(id, path);

            if (item)
            {
                const result = {
                    id,
                    item,
                    root: this._pickableObjects[i],
                    type: this._buffer[2],
                    typeName: getKeyFromValue(PickingBlueChannel, this._buffer[2], null),
                    alpha: this._buffer[3],
                    path,
                    color: Array.from(this._buffer)
                };
                return result;
            }
        }

        return null;
    }

    transparent = false;
    additive = false;

    /**
     * Prepares picking
     * @param {Array} objects
     * @param {Boolean} [force]
     */
    PreparePicking(objects, force)
    {
        // Don't redraw unless required
        if (!force && !this.enabled) return false;

        const
            ac = this._accumulator,
            rt = this._renderTarget;

        this._pickableObjects.splice(0);

        if (!force && (!objects || !objects.length))
        {
            return false;
        }

        ac.Clear();
        ac.GetObjectArrayBatches(objects, RM_OPAQUE, this.technique);
        if (this.transparent) ac.GetObjectArrayBatches(objects, RM_TRANSPARENT, this.technique);      // Why is this here?
        if (this.additive)
        {
            throw new Error("There is something wrong here, you should fix it!");
            //ac.GetObjectArrayBatches(objects, RM_ADDITIVE, this.technique);
        }
        if (this.usePickable) ac.GetObjectArrayBatches(objects, RM_PICKABLE);
        rt.Update(tw2.width, tw2.height, true);


        return rt.SetCallUnset(() =>
        {
            // Enable alpha
            const colorMask = tw2.GetColorMask([ 1, 1, 1, 1 ]);
            tw2.SetColorMask([ 1, 1, 1, 1 ]);

            tw2.ClearBufferBits(true, true, true);
            tw2.SetClearColor(this._clearColor);
            ac.Render(this._pickableObjects);

            // Disable alpha
            tw2.SetColorMask(colorMask);
        });

    }

}