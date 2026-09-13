import { TriSettings } from "@carbonenginejs/runtime/trinity/core";


/**
 * The library's named engine settings, with ccpwgl's plain-object accessors.
 *
 * Wraps runtime's `TriSettings`, the port of Carbon's `Tr2Renderer::GetSettings()`
 * registry (`TRI_REGISTER_SETTING`, `TriSettingsRegistrar.h`), and adds ccpwgl's
 * model convention on top: `SetValues(values)` / `GetValues(out)` over plain
 * objects. The Carbon port keeps Carbon's singular `SetValue` / `GetValue`,
 * which stay available here for single hot-path reads.
 *
 * Wrapped rather than subclassed: a `CjsModel` subclass must carry its own
 * runtime schema class name, which ccpwgl classes do not have.
 *
 * Registration sets each setting's name, type and default; `SetValues` then
 * changes them, type-checked. Settings read when effects load (depthMode,
 * clipControl, carbonRenderStates, forceUberDepthOff) must be set before
 * anything loads; the rest apply on the next frame.
 */
export class Tw2Settings
{

    _settings = new TriSettings();
    _names = [];

    /**
     * Registers a setting with its default value; the value's type is latched.
     * @param {String} name
     * @param {Boolean|Number|String} value
     * @returns {Tw2Settings} this, for chaining
     */
    RegisterSetting(name, value)
    {
        this._settings.RegisterSetting(name, value);
        if (!this._names.includes(name)) this._names.push(name);
        return this;
    }

    /**
     * Gets one setting. Throws for an unregistered name.
     * @param {String} name
     * @returns {Boolean|Number|String}
     */
    GetValue(name)
    {
        return this._settings.GetValue(name);
    }

    /**
     * Sets one setting. Throws for an unregistered name or a wrong type.
     * @param {String} name
     * @param {Boolean|Number|String} value
     */
    SetValue(name, value)
    {
        this._settings.SetValue(name, value);
    }

    /**
     * Sets settings from a plain object of `{ name: value }`.
     * @param {Object} values
     * @returns {Tw2Settings} this
     */
    SetValues(values)
    {
        for (const name in values)
        {
            if (values.hasOwnProperty(name)) this._settings.SetValue(name, values[name]);
        }
        return this;
    }

    /**
     * Gets every registered setting as a plain object.
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    GetValues(out = {})
    {
        for (let i = 0; i < this._names.length; i++)
        {
            out[this._names[i]] = this._settings.GetValue(this._names[i]);
        }
        return out;
    }

    /**
     * Whether a setting is registered.
     * @param {String} name
     * @returns {Boolean}
     */
    HasSetting(name)
    {
        return this._settings.FindSetting(name) !== null;
    }

    /**
     * Python-style dump of every setting, from the Carbon port.
     * @returns {String}
     */
    GetReprString()
    {
        return this._settings.GetReprString();
    }

}
