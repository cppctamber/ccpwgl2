import { meta, vec4 } from "global";


@meta.type("EveSOFDataParameter", true)
export class EveSOFDataParameter
{

    @meta.black.string
    name = "";

    @meta.black.vector4
    value = vec4.create();


    /**
     * Assigns the parameter's values to an object
     * @param {{}} [out]
     * @param {String} [prefix]
     * @return {{}} out
     */
    Assign(out = {}, prefix)
    {
        out[prefix ? prefix + this.name : this.name] = Array.from(this.value);
        return out;
    }

}
