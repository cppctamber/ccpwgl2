import { meta } from "utils";


// Pretty sure this just traverses the path, and then returns a normal binding.

@meta.type("Tr2DynamicBinding", "Tr2DynamicBinding")
export class Tr2DynamicBinding extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    destinationAttribute = "";

    @meta.struct()
    destinationPath = null;

    @meta.string
    sourceAttribute = "";

    @meta.struct()
    sourceObject = null;


    /**
     * Initializes the binding
     */
    Initialize()
    {
        // Pretty sure this just traverses the path, and then returns a normal binding.
    }

}