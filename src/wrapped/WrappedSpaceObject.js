import { isNumber, isString, meta } from "utils/index";
import {
    getResPathFromTypeID,
    getResPathFromTypeIDAndSkinID,
    getResPathFromTypeIDAndSkinMaterialID,
    getTypeID
} from "./APIManager";
import { WrappedGenericObject } from "./WrappedGenericObject";


@meta.type("WrappedSpaceObject")
export class WrappedSpaceObject extends WrappedGenericObject
{

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
            if (!skinID || !skinMaterialID)
            {
                const type = await getTypeID(typeID);
                if (!values.name) values.name = type.name;
                resPath = await getResPathFromTypeID(typeID);
            }
            else if (skinID)
            {
                const skin = await getResPathFromTypeIDAndSkinID(typeID, skinID);
                if (!values.name) values.name = skin.name;
                resPath = skin.dna;
            }
            else if (skinMaterialID)
            {
                const material = await getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID);
                if (!values.name) values.name = material.name; // DUMB....
                resPath = material.name;
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
            return new this(wrapped, values);
        }

        if (!resPath) throw new ReferenceError("Could not identify resource path");
    }

}
