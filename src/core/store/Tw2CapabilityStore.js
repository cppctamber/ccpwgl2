import { isArray, isFunction, isPlain, isString } from "utils";
import { Tw2GenericStore, STORE } from "./Tw2GenericStore";


/**
 * Capability report store
 */
export class Tw2CapabilityStore extends Tw2GenericStore
{
    /**
     * Constructor
     * @param {*} context
     */
    constructor(context)
    {
        super();
        this.context = context;
    }

    /**
     * Gets a capability report
     * @param {String} key
     * @param {*} [opt]
     * @returns {*}
     */
    GetReport(key)
    {
        return this.constructor.FormatReport(this.Get(key));
    }

    /**
     * Gets a capability entry's raw report data
     * @param {String} key
     * @param {*} [opt]
     * @returns {*}
     */
    GetData(key)
    {
        return this.Get(key).data;
    }

    /**
     * Gets all capability reports
     * @param {*} [opt]
     * @returns {Object}
     */
    GetReports()
    {
        const out = {};
        STORE.get(this).map.forEach((entry, key) =>
        {
            out[key] = this.constructor.FormatReport(entry);
        });
        return out;
    }

    /**
     * Registers capability providers or keyed entries
     * @param {Object|Array} value
     */
    Register(value)
    {
        if (isArray(value))
        {
            for (let i = 0; i < value.length; i++)
            {
                this.Register(value[i]);
            }
            return;
        }

        if (value && value.key)
        {
            this.Set(value.key, value);
            return;
        }

        super.Register(value);
    }

    /**
     * Processes registered capability providers
     * @param {Object} context
     * @param {Object} [opt]
     * @returns {Promise<Object>}
     */
    async Process(context, opt = {})
    {
        opt = isPlain(opt) ? opt : {};

        const keys = isString(opt.keys) ? [ opt.keys ] : opt.keys || null;
        const entries = this.List();

        for (let i = 0; i < entries.length; i++)
        {
            const { key, entry } = entries[i];
            if (keys && !keys.includes(key)) continue;
            if (!isFunction(entry.resolve)) continue;

            this.SetReport(key, Object.assign({}, isPlain(entry.data) ? entry.data : {}, {
                pending: true
            }));

            try
            {
                const data = await entry.resolve(context, opt);
                this.SetReport(key, data, { pending: false });
            }
            catch (err)
            {
                this.SetReport(key, {
                    supported: false,
                    declared: false,
                    verified: false,
                    pending: false,
                    reason: err && err.message || String(err),
                    error: err
                });
            }
        }

        return this.GetReports();
    }

    /**
     * Sets static report data for a capability
     * @param {String} key
     * @param {*} data
     * @param {Object} [entry]
     * @returns {*}
     */
    SetReport(key, data, entry = {})
    {
        const existing = STORE.get(this).map.get(key) || {};
        return this.Set(key, Object.assign({}, existing, entry, { data }));
    }

    /**
     * Gets all capability entries
     * @returns {Array}
     */
    List()
    {
        const out = [];
        STORE.get(this).map.forEach((entry, key) =>
        {
            out.push({ key, entry });
        });
        return out;
    }

    /**
     * Formats a capability report
     * @param {*} entry
     * @returns {*}
     */
    static FormatReport(entry)
    {
        const
            data = entry.data,
            report = {
                key: entry.key,
                name: entry.name,
                category: entry.category,
                label: entry.label,
                description: entry.description,
                tags: entry.tags,
                supported: null,
                partial: false,
                declared: null,
                verified: null,
                pending: false,
                fallback: null,
                reason: null,
                data
            };

        if (isPlain(data))
        {
            [
                "supported",
                "partial",
                "declared",
                "verified",
                "pending",
                "fallback",
                "reason"
            ].forEach(key =>
            {
                if (data[key] !== undefined) report[key] = data[key];
            });
        }

        return report;
    }

    /**
     * Normalizes a capability entry
     * @param {*} value
     * @param {String} key
     * @returns {Object}
     */
    static onBefore(value, key)
    {
        const parts = key.split(".");

        return Object.assign({
            key,
            name: key,
            category: parts[0],
            label: key,
            description: "",
            tags: [],
            data: null,
            resolve: null
        }, value);
    }

    /**
     * Checks if a value is a valid capability entry
     * @param {*} value
     * @returns {Boolean}
     */
    static isValue(value)
    {
        return !!(value && (isPlain(value) || isString(value.name) || isFunction(value.resolve)));
    }

    static storeName = "Capability";
}
