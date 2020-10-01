import * as stores from "core/store";

export class Tw2Store
{
    constructor(LibraryConstructor)
    {
        let debug = false;
        Object.defineProperty(this, "debug" , {
            get: () => debug,
            set: (bool) =>
            {
                debug = bool;
                this.constructors.debug = bool;
            }
        });

        this.variableTypes = new stores.Tw2VariableTypeStore();
        this.variables = new stores.Tw2VariableStore(this.variableTypes);
        this.paths = new stores.Tw2ResourcePathStore();
        this.dynamicPaths = new stores.Tw2ResourceDynamicPathStore();
        this.extensions = new stores.Tw2ResourceExtensionStore();
        this.constructors = new stores.Tw2ConstructorStore(LibraryConstructor);
    }

    /**
     * Registers store variables from an object
     * @param {Object} opt
     */
    Register(opt)
    {
        if (!opt) return;
        if (opt.variableTypes) this.variableTypes.Register(opt.variableTypes);
        if (opt.constructors) this.constructors.Register(opt.constructors);
        if (opt.variables) this.variables.Register(opt.variables);
        if (opt.paths) this.paths.Register(opt.paths);
        if (opt.dynamicPaths) this.dynamicPaths.Register(opt.dynamicPaths);
        if (opt.extensions) this.extensions.Register(opt.extensions);
    }
}

