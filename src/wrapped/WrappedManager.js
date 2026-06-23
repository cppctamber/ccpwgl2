import { tw2 } from "global";

const emitter = new tw2.Tw2EventEmitter();

/**
 * Adds a listener to an event
 * @type {Tw2EventEmitter.OnEvent}
 */
export const on = emitter.OnEvent;

/**
 * Removes a listener from an event
 * @type {Tw2EventEmitter.OffEvent}
 */
export const off = emitter.OffEvent;

/**
 * Adds a listener to an event once
 * @type {Tw2EventEmitter.OnceEvent}
 */
export const once = emitter.OnceEvent;


