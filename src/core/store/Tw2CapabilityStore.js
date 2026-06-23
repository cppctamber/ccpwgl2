import { isPlain, isString } from "utils";
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
            data: null
        }, value);
    }

    /**
     * Checks if a value is a valid capability entry
     * @param {*} value
     * @returns {Boolean}
     */
    static isValue(value)
    {
        return !!(value && (isPlain(value) || isString(value.name)));
    }

    static storeName = "Capability";
}
