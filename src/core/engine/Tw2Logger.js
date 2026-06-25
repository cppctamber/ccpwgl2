import { Tw2EventEmitter } from "../Tw2EventEmitter";
import { assignIfExists, isError, isString } from "utils";

/**
 * EventLog
 * @typedef {Object} eventLog
 * @param {String} name
 * @param {String} message
 * @param {String} [_type]
 * @param {Boolean} [hide]
 * @param {String} [detail]
 * @param {String} [path]
 * @param {Number} [time]
 * @param {*} [err]
 * @param {*} [data]
 */

export class Tw2Logger extends Tw2EventEmitter
{

    name = "";
    display = true;

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
    _debugMode = false;

    /**
     * Sets the debug mode
     * @param {Boolean} bool
     */
    SetDebugMode(bool)
    {
        this._debugMode = bool;
    }

    /**
     * Register is the logger configuration entrypoint.
     * It is a partial setter; only provided values are applied.
     * A future decorator/metadata system may mark options that cannot be changed safely after init.
     * @param {*} [opt]
     */
    Register(opt)
    {
        if (!opt) return;
        if ("events" in opt) this.AddEvents(opt.events);
        assignIfExists(this, opt, [ "name", "display", "history", "throttle" ]);

        if (opt.visible)
        {
            assignIfExists(this.visible, opt.visible, [ "log", "info", "debug", "warn", "error" ]);
            if (opt.visible.warning !== undefined)
            {
                this.visible.warn = opt.visible.warning;
            }
        }
    }

    /**
     * Adds a debug log
     * @param {Object|String} log
     * @return {eventLog}
     */
    Debug(log)
    {
        return this.Add("debug", log);
    }

    /**
     * Adds an info log
     * @param {Object|String} log
     * @return {eventLog}
     */
    Info(log)
    {
        return this.Add("info", log);
    }

    /**
     * Adds a warning log
     * @param {Object|String} log
     * @return {eventLog}
     */
    Warning(log)
    {
        return this.Add("warn", log);
    }

    /**
     * Adds an error log
     * @param {Object|String} log
     * @return {eventLog}
     */
    Error(log)
    {
        return this.Add("error", log);
    }

    /**
     * Adds a general log
     * @param {Object|String} log
     * @return {eventLog}
     */
    Log(log)
    {
        return this.Add("log", log);
    }

    /**
     * Adds an event log and outputs it to the console
     * @param {String} type    - Log type
     * @param {*} log          - The eventLog or error to log
     * @returns {eventLog} log
     */
    Add(type = "log", log)
    {
        log = this.NormalizeLog(type, log);

        if (log._logged) return log;

        this.ApplyVisibility(log);
        this.ApplyThrottle(log);

        if (!log.hide || this._debugMode)
        {
            this.Output(log);
        }

        this.PushHistory(log);

        log._logged = true;

        this.EmitEvent("any", log);
        this.EmitEvent(log.type, log);
        return log;
    }

    /**
     * Normalizes an incoming log payload
     * @param {String} type
     * @param {*} log
     * @returns {eventLog}
     */
    NormalizeLog(type, log)
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

        log.type = Tw2Logger.NormalizeType(type);
        log.name = log.name || "Logger";
        log.message = log.message ? log.message.charAt(0).toUpperCase() + log.message.substring(1) : "";
        return log;
    }

    /**
     * Applies log visibility settings
     * @param {eventLog} log
     */
    ApplyVisibility(log)
    {
        if (!this._debugMode && (!this.display || !this.visible[log.type]))
        {
            log.hide = true;
        }
    }

    /**
     * Applies duplicate message throttling
     * @param {eventLog} log
     */
    ApplyThrottle(log)
    {
        if (!this.throttle || this._debugMode)
        {
            this._throttled = null;
            return;
        }

        if (log.hide) return;

        if (!this._throttled) this._throttled = {};
        if (!this._throttled[log.type]) this._throttled[log.type] = [];

        const throttled = this._throttled[log.type];
        if (!throttled.includes(log.message))
        {
            throttled.unshift(log.message);
            throttled.splice(this.throttle);
            return;
        }

        log.hide = true;
    }

    /**
     * Outputs a log to the console
     * @param {eventLog} log
     */
    Output(log)
    {
        let subMessage = "";
        if (log.path && !log.message.includes(log.path)) subMessage += `'${log.path}' `;
        if (log.time) subMessage += `in ${log.time.toFixed(3)} secs `;
        if (log.detail) subMessage += `(${log.detail}) `;

        const
            header = `${this.name} ${log.name}:`,
            consoleType = Tw2Logger.ConsoleType[log.type] || "log";

        if (log.err || log.data)
        {
            console.group(header, log.message, subMessage);
            if (log.err) console.error(log.err.stack || log.err.toString());
            if (log.data) console.debug(JSON.stringify(log.data, null, 4));
            console.groupEnd();
            return;
        }

        console[consoleType](header, log.message, subMessage);
    }

    /**
     * Pushes a log into history
     * @param {eventLog} log
     */
    PushHistory(log)
    {
        const logsToKeep = this._debugMode ? 1000 : this.history;
        if (logsToKeep)
        {
            this._logs.unshift(log);
            this._logs.splice(logsToKeep);
            return;
        }

        this._logs.splice(0);
    }

    /**
     * Normalizes a log type
     * @param {String} type
     * @returns {String}
     */
    static NormalizeType(type)
    {
        return Tw2Logger.LogType[String(type).toUpperCase()] || "log";
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

    /**
     * Console method per log type
     * @type {*}
     */
    static ConsoleType = {
        error: "error",
        warn: "warn",
        info: "info",
        log: "log",
        debug: "debug"
    };

}
