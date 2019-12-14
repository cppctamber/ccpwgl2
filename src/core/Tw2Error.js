import { isFunction, template } from "global/util";

const HAS_CAPTURE_STACK_TRACE = isFunction(Error["captureStackTrace"]);

/**
 * Tw2Error
 *
 * @property {String} name    - The error's name
 * @property {String} message - The error's message
 * @property {Object} data    - Optional error data
 */
export class Tw2Error extends Error
{
    /**
     * Constructor
     * @param {String|Object} [data={}]                   - Error message or an object containing relevant data
     * @param {String} [defaultMessage='Undefined Error'] - The default error message
     */
    constructor(data = {}, defaultMessage = "Undefined error")
    {
        let message = defaultMessage;
        if (typeof data === "string")
        {
            message = data;
            data = {};
        }
        else if (data.message)
        {
            message = data.message;
            delete data.message;
        }

        super();
        this.message = template(message, data);
        this.name = this.constructor.name;
        this.data = data;

        if (HAS_CAPTURE_STACK_TRACE)
        {
            Error["captureStackTrace"](this, Tw2Error);
        }
        else
        {
            this.stack = (new Error(this.message)).stack;
        }
    }

    /**
     * Emits an event on a target emitter
     * @param {*} emitter
     * @param {String} [eventName='error']
     * @returns {Tw2Error}
     */
    emitOn(emitter, eventName = "error")
    {
        if (emitter && emitter.emit)
        {
            emitter.emit(eventName, this);
        }
        return this;
    }

    /**
     * Class category
     * @type {String}
     */
    static __category = "error";

}

/**
 * Throws when unable to create a webgl context
 */
export class ErrWebglContext extends Tw2Error
{
    constructor(data)
    {
        super(data, "Unable to create webgl context (%version%)");
    }
}

/**
 * Throws when webxr is not supported
 */
export class ErrWebxrNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Webxr not supported");
    }
}

/**
 * Throws when a webxr device is not found
 */
export class ErrWebxrDeviceNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "Webxr device not found");
    }
}

/**
 * Throws when there is an error requesting a webxr device
 */
export class ErrWebxrRequestFailed extends Tw2Error
{
    constructor(data)
    {
        super(data, "Webxr request failed (%err%)");
    }
}

/**
 * Throws when a webxr session type is not supported
 */
export class ErrWebxrSessionNotSupported extends Tw2Error
{
    constructor(data)
    {
        super(data, "Webxr session not supported (%err%)");
    }
}

/**
 * Throws when trying to register a reserved store key
 */
export class ErrStoreKeyReserved extends Tw2Error
{
    constructor(data)
    {
        super(data, "Reserved key for '%store%' store (%key%)");
    }
}

/**
 * Throws when trying to register an invalid store value
 */
export class ErrStoreValueInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid value for '%store%' store key (%key%)");
    }
}

/**
 * Throws when trying to retrieve a store value that doesn't exist
 */
export class ErrStoreValueMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, "Missing '%store%' store key (%key%)");
    }
}

/**
 * Throws when trying to do something with an invalid store
 */
export class ErrStoreInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid store");
    }
}

/**
 * Throws on http request errors
 */
export class ErrHTTPRequest extends Tw2Error
{
    constructor(data)
    {
        super(data, "Communication error while requesting resource");
    }
}

/**
 * Throws on http status errors
 */
export class ErrHTTPStatus extends Tw2Error
{
    constructor(data)
    {
        super(data, "%statusText=Communication status error while loading resource% (%status%)");
    }
}

/**
 * Throws when xml is not a valid format
 */
export class ErrBinaryFormat extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid binary format (%formatError=undefined%)");
    }
}

/**
 * Throws on binary reader read errors
 */
export class ErrBinaryReaderReadError extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error reading binary (%readError=undefined%)");
    }
}

/**
 * Throws when an xml object type is undefined
 */
export class ErrBinaryObjectTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "Binary object type not found (%type%)");
    }
}


/**
 * Throws when a geometry mesh lacks an element required for a particle system
 */
export class ErrGeometryMeshMissingParticleElement extends Tw2Error
{
    constructor(data)
    {
        super(data, "Input geometry mesh lacks element required by particle system");
    }
}


/**
 * Throws when a geometry mesh element doesn't have the required number of components
 */
export class ErrGeometryMeshElementComponentsMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, "Input geometry mesh elements do not have the required number of components");
    }
}

/**
 * Throws when a geometry mesh area is missing
 */
export class ErrGeometryMeshAreaMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, "Geometry mesh missing expected area at index %areaIndex%");
    }
}

/**
 * Throws when a geometry mesh has an invalid bone name for a model
 */
export class ErrGeometryMeshBoneNameInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Geometry mesh has invalid bone name for model");
    }
}


/**
 * Throws when there is an error binding a geometry mesh to an effect
 */
export class ErrGeometryMeshEffectBinding extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding geometry mesh to effect");
    }
}


/**
 * Throws when a geometry mesh has an invalid file type
 */
export class ErrGeometryFileType extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid geometry file type (%fileType%)");
    }
}


/**
 * Throws when a resource path has an unregistered prefix
 */
export class ErrResourcePrefixUnregistered extends Tw2Error
{
    constructor(data)
    {
        super(data, "Unregistered resource prefix (%prefix%)");
    }
}


/**
 * Throws when a resource path has no prefix
 */
export class ErrResourcePrefixUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Undefined resource prefix");
    }
}


/**
 * Throws when a resource path has an unregistered file extension
 */
export class ErrResourceExtensionUnregistered extends Tw2Error
{
    constructor(data)
    {
        super(data, "Unregistered resource extension (%extension%)");
    }
}


/**
 * Throws when a resource path has no file extension
 */
export class ErrResourceExtensionUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Undefined resource extension");
    }
}


/**
 * Throws in invalid resource formats
 */
export class ErrResourceFormat extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid resource format");
    }
}


/**
 * Throws when an effect has an invalid shader version
 */
export class ErrShaderVersion extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid version of effect file (%version%)");
    }
}


/**
 * Throws when an effect has no header
 */
export class ErrShaderHeaderSize extends Tw2Error
{
    constructor(data)
    {
        super(data, "Effect file contains no compiled effects");
    }
}


/**
 * Throws when a shader has an invalid permutation value
 */
export class ErrShaderPermutationValue extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid shader permutation value");
    }
}


/**
 * Throws when a shader cannot compile
 */
export class ErrShaderCompile extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error compiling %shaderType% shader (%infoLog%)");
    }
}


/**
 * Throws when unable to link a vertex shader and fragment shader
 */
export class ErrShaderLink extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error linking shaders");
    }
}


/**
 * Throws on invalid raw data declaration types
 */
export class ErrDeclarationValueType extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid declaration value type (%declaration%:%valueType%)");
    }
}


/**
 * Throws when a class can only be instantiated once
 */
export class ErrSingletonInstantiation extends Tw2Error
{
    constructor(data)
    {
        super(data, "Cannot re-instantiate singleton (%class%)");
    }
}

/**
 * Throws when a decorators usage is invalid
 */
export class ErrInvalidDecoratorUsage extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid decorator usage (%reason%)");
    }
}

/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class ErrAbstractClass extends Tw2Error
{
    constructor(data)
    {
        super(data, "Abstract class cannot be directly instantiated (%class%)");
    }
}

/**
 * Throws when an abstract classes' method is not implemented directly on a child class
 */
export class ErrAbstractMethod extends Tw2Error
{
    constructor(data)
    {
        super(data, "Abstract class method not implemented on class '%class%': (%method%)");
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrFeatureNotImplemented extends Tw2Error
{
    constructor(data)
    {
        super(data, "%feature=Feature% not implemented");
    }
}

/**
 * Throws when an index is out of bounds
 */
export class ErrIndexBounds extends Tw2Error
{
    constructor(data)
    {
        super(data, "Array index out of bounds");
    }
}

/**
 * Throws when there's an error binding an object
 */
export class ErrBindingValueUndefined extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', '%object%' property is undefined (%property%)");
    }
}

/**
 * Throws when there's an error binding a value
 */
export class ErrBindingType extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', cannot identify binding type");
    }
}

/**
 * Throws when trying to bind an object by it's id and it can't be found
 */
export class ErrBindingReference extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding '%name=unknown%', could not find '%object%' object reference");
    }
}


/**
 * Fires when a sof hull is not found
 */
export class ErrSOFHullNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Hull not found (%name%)");
    }
}

/**
 * Fires when a sof faction is not found
 */
export class ErrSOFFactionNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Faction not found (%name%)");
    }
}

/**
 * Fires when a sof race is not found
 */
export class ErrSOFRaceNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Race not found (%name%)");
    }
}

/**
 * Fires when a sof material is not found
 */
export class ErrSOFMaterialNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Material not found (%name%)");
    }
}

/**
 * Fires when a sof pattern is not found
 */
export class ErrSOFPatternNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern not found (%name%)");
    }
}

/**
 * Throws when invalid wrapped objects are passed as arguments
 */
export class ErrWrapped extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid wrapped object(s) (%reason%)");
    }
}
