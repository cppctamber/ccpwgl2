import { Tw2EventEmitter } from "../class/Tw2EventEmitter";
import { assignIfExists, isError, isString } from "global/util";

/**
 * eventLog
 * @typedef {{}} eventLog
 * @property {String} eventLog.type       - The log's type
 * @property {String} eventLog.name       - The log's name
 * @property {String} eventLog.message    - The log's message
 * @property {String} [eventLog.path]     - optional related resource path
 * @property {String} [eventLog.detail]   - optional extra detail
 * @property {String} [eventLog.time]     - optional time taken
 * @property {Boolean} [eventLog.hide]    - optional visibility
 * @property {Boolean} [eventLog._logged] - Identifies if the log has been logged
 * @property {Error} [eventLog.err]       - Optional error (output to the console)
 * @property {*} [eventLog.data]          - Optional data (output to the console)
 */


export class Tw2Logger extends Tw2EventEmitter
{

    name = "";
    display = true;
    debug = false;
    history = 100;
    throttle = 20;
    visible = {
        log: false,
        info: false,
        debug: false,
        warn: false,
        error: true
    };
    
    _logs = [];
    _throttled = null;
    
    /**
     * Sets the logger's properties
     * @param {*} [opt]
     */
    Register(opt)
    {
        if (!opt) return;
        assignIfExists(this, opt, [ "name", "display", "history", "throttle" ]);
        assignIfExists(this.visible, opt.visible, [ "log", "info", "debug", "warn", "error" ]);
    }

    /**
     * Adds an event log and outputs it to the console
     * @param {String}    type       - Log type
     * @param {*} log                - The eventLog or error to log
     * @param {String} [defaultName] - Default message name/ title
     * @returns {eventLog} log
     */
    Log(type = "log", log, defaultName)
    {
        if (!log)
        {
            log = { message: "" };
        }
        else if (isString(log))
        {
            log = { message: log };
        }
        else if (isError(log))
        {
            log = { message: log.message, err: log };
        }

        if (log._logged) return log;

        // Normalize logs
        log.type = type.toLowerCase();
        log.name = log.name || defaultName || Tw2Logger.constructor.category;
        log.message = log.message ? log.message.charAt(0).toUpperCase() + log.message.substring(1) : "";

        if (!Tw2Logger.LogType[log.type.toUpperCase()])
        {
            log.type = "log";
        }

        // Set visibility
        if (!this.display || !this.visible[log.type])
        {
            log.hide = true;
        }

        // Throttle excessive output
        if (!this.throttle || this.debug)
        {
            this._throttled = null;
        }
        else
        {
            if (!log.hide)
            {
                if (!this._throttled) this._throttled = {};
                if (!this._throttled[log.type]) this._throttled[log.type] = [];
                const t = this._throttled[log.type];
                if (!t.includes(log.message))
                {
                    t.unshift(log.message);
                    t.splice(this.throttle);
                }
                else
                {
                    log.hide = true;
                }
            }
        }

        // Output to the console
        if (!log.hide || this.debug)
        {
            // Optional details
            let subMessage = "";
            if (log.path && !log.message.includes(log.path)) subMessage += `'${log.path}' `;
            if (log.time) subMessage += `in ${log.time.toFixed(3)} secs `;
            if (log.detail) subMessage += `(${log.detail}) `;

            let header = `${this.name} ${log.name}:`;
            if (log.err || log.data)
            {
                console.group(header, log.message, subMessage);
                if (log.err) console.error(log.err.stack || log.err.toString());
                if (log.data) console.debug(JSON.stringify(log.data, null, 4));
                console.groupEnd();
            }
            else
            {
                console[log.type](header, log.message, subMessage);
            }
        }

        // Manage log history
        const logsToKeep = this.debug ? 1000 : this.history;
        if (logsToKeep)
        {
            this._logs.unshift(log);
            this._logs.splice(logsToKeep);
        }
        else
        {
            this._logs = [];
        }

        log._logged = true;

        this.emit(log.type, log);
        return log;
    }

    /**
     * Log types
     * @type {*}
     */
    static LogType = {
        ERROR: "error",
        WARNING: "warn",
        WARN: "warn",
        INFO: "info",
        LOG: "log",
        DEBUG: "debug"
    };

}
