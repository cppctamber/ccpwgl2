import { isNumber, isString, meta, toArray } from "utils/index";
import { api } from "./api";
import { WrappedGenericObject } from "./WrappedGenericObject";
import { WrappedSlot } from "./WrappedSlots";


@meta.type("WrappedSpaceObject")
export class WrappedSpaceObject extends WrappedGenericObject
{

    turrets = [];
    xlTurrets = [];
    atomics = [];
    chains = [];
    launchers = [];
    bombs = [];


    /**
     * Constructor
     * @param {*} wrapped
     * @param {Object} [values]
     */
    constructor(wrapped, values)
    {
        if (!wrapped)
        {
            throw new TypeError("Invalid wrapped object");
        }

        super();
        this.wrapped = wrapped;

        if (values) this.SetValues(values);
    }

    /**
     * Centers the object from its bounds
     */
    CenterFromBounds()
    {
        // Offset the object from its bounds so its better centered
        try
        {
            const offset = this.GetOffsetFromBounds([]);
            this.SetTranslation(offset).UpdateValues;
        }
        catch(err)
        {
            // Don't do anything
        }

    }

    /**
     * Sets any parameter with a given name
     * @param name
     * @param value
     */
    SetParameter(name, value)
    {
        this.wrapped.mesh.FindParameters(name).forEach(x=>x.SetValue(value));
    }

    /**
     * Fetches space object async
     * @param {Object} options
     * @param {EveSOFData} eveSof
     * @return {Promise<WrappedSpaceObject>}
     */
    static async fetch(options = {}, eveSof)
    {
        if (isString(options))
        {
            options = { resPath: options };
        }
        else if (isNumber(options))
        {
            options = { typeID: options };
        }

        let { resPath, typeID, skinID, skinMaterialID, dna, ...values } = options;

        if (typeID)
        {
            if (skinID)
            {
                const skin = await api.getResPathFromTypeIDAndSkinID(typeID, skinID);
                if (!values.name) values.name = skin.name;
                resPath = skin.dna;
            }
            else if (skinMaterialID)
            {
                const material = await api.getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID);
                if (!values.name) values.name = material.name; // DUMB....
                resPath = material.dna;
            }
            else
            {
                const type = await api.getTypeID(typeID);
                if (!values.name) values.name = type.name;
                resPath = await api.getResPathFromTypeID(typeID);
            }
        }
        else if (dna)
        {
            resPath = dna;
        }

        if (resPath)
        {
            const wrapped = await eveSof.Build(resPath);
            wrapped._resPath = resPath;
            const thing = new this(wrapped);
            await this.PrepareObject(thing, wrapped);
            thing.SetValues(values);
            return thing;
        }

        if (!resPath) throw new ReferenceError("Could not identify resource path");
    }

    /**
     * Prepares the object
     * @param obj
     * @param wrapped
     * @return {Promise<void>}
     */
    static async PrepareObject(obj, wrapped)
    {
        await Promise.all([
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "chain", obj.chains),
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "atomic", obj.atomics),
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "launcher", obj.launchers),
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "turret", obj.turrets),
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "xl", obj.xlTurrets),
            WrappedSlot.RebuildLocatorSlots(obj, wrapped, "bomb", obj.bombs)
        ]);
    }

}
