/**
 * Installs ccpwgl's Granny state resource for `.gsf` requests made by the
 * character demo.
 *
 * The base ccpwgl configuration still maps GSF through its legacy geometry
 * route. The demo replaces only its live extension-store entry; no global
 * configuration mutation or parallel resource implementation is required.
 *
 * @param {Object} tw2 ccpwgl library facade.
 * @returns {{available:Boolean,Resource:Function|null,previous:Function,Load:Function,Restore:Function}}
 */
export function InstallCharacterDemoGrannyStateResource(tw2)
{
    const Resource = tw2?.Tr2GrannyStateRes;
    if (typeof tw2?.GetExtension !== "function" || typeof tw2?.SetExtension !== "function")
    {
        throw new TypeError("Character demo GState installation requires ccpwgl extension APIs");
    }
    if (typeof tw2?.resMan?.FetchResource !== "function")
    {
        throw new TypeError("Character demo GState installation requires ccpwgl resource loading");
    }

    const previous = tw2.GetExtension("gsf");
    if (typeof Resource !== "function")
    {
        return Object.freeze({
            available: false,
            Resource: null,
            previous,
            async Load()
            {
                throw new TypeError("The ccpwgl bundle does not export Tr2GrannyStateRes");
            },
            Restore() {}
        });
    }
    tw2.SetExtension("gsf", Resource);

    return Object.freeze({
        available: true,
        Resource,
        previous,
        /**
         * Loads one GSF and waits until all referenced animation GR2 files arrive.
         *
         * @param {String} path GSF resource path.
         * @returns {Promise<Tr2GrannyStateRes>} Fully loaded state resource.
         */
        async Load(path)
        {
            const resource = await tw2.resMan.FetchResource(path);
            if (!(resource instanceof Resource))
            {
                throw new TypeError("The requested GSF was not created by Tr2GrannyStateRes");
            }
            return resource.WaitForAnimationResources();
        },
        /** Restores the extension constructor that preceded demo installation. */
        Restore()
        {
            tw2.SetExtension("gsf", previous);
        }
    });
}
