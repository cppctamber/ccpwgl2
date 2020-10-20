import { resMan } from "global";
import { meta, toArray } from "utils";


@meta.notImplemented
@meta.type("Tr2LodResource")
export class Tr2LodResource extends meta.Model
{

    @meta.string
    name = "";

    @meta.path
    highDetailResPath = "";

    @meta.path
    lowDetailResPath = "";

    @meta.path
    mediumDetailResPath = "";


    /**
     * Gets the high detail resource
     * @returns {null|Tw2TextureRes}
     */
    get highDetailRes()
    {
        return this.GetLODResource(3);
    }

    /**
     * Gets the medium detail resource
     * @returns {null|Tw2TextureRes}
     */
    get mediumDetailRes()
    {
        return this.GetLODResource(2);
    }

    /**
     * Gets the low detail resource
     * @returns {null|Tw2TextureRes}
     */
    get lowDetailRes()
    {
        return this.GetLODResource(1);
    }

    /**
     * Constructor
     * @param {String} [name]
     * @param {String|Array<String>} [resourcePaths]
     */
    constructor(name = "", resourcePaths)
    {
        super();

        this.name = name;

        if (resourcePaths)
        {
            this.SetPaths(...toArray(resourcePaths));
        }
    }

    /**
     * Sets resource paths
     * @param {String} [highDetail]
     * @param {String} [mediumDetail]
     * @param {String} [lowDetail]
     * @returns {boolean} true if updated
     */
    SetPaths(highDetail = "", mediumDetail = "", lowDetail = "")
    {
        let updated = false;
        if (highDetail !== this.highDetailResPath)
        {
            this.highDetailResPath = highDetail;
            updated = true;
        }
        if (mediumDetail !== this.mediumDetailResPath)
        {
            this.mediumDetailResPath = mediumDetail;
            updated = true;
        }
        if (lowDetail !== this.lowDetailResPath)
        {
            this.lowDetailResPath = lowDetail;
            updated = true;
        }
        return updated;
    }

    /**
     * Requests a resource at the given LOD level
     * @param {Number} lod
     */
    GetLODResource(lod = 3)
    {
        const
            high = this.highDetailResPath,
            med = this.mediumDetailResPath,
            low = this.lowDetailResPath;

        let path;

        if (lod > 2)
        {
            if (high) path = high;
            else if (med) path = med;
            else if (low) path = low;
        }
        else if (lod === 2)
        {
            if (med) path = med;
            else if (high) path = high;
            else if (low) path = low;
        }
        else
        {
            if (low) path = low;
            else if (med) path = med;
            else if (high) path = high;
        }

        return path ? resMan.GetResource(path) : null;
    }

    /**
     * Creates a lod resource from a plain object
     * @param {*} values
     * @returns {Tr2LodResource}
     */
    static from(values)
    {
        const item = new Tr2LodResource();
        if (values)
        {
            item.name = values.name || "";
            item.SetPaths(values.highDetailResPath, values.mediumDetailResPath, values.lowDetailResPath);
        }
        return item;
    }

}
