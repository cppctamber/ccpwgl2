(function () {
  'use strict';

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
      var i = n[a](c),
        u = i.value;
    } catch (n) {
      return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
  }
  function _asyncToGenerator(n) {
    return function () {
      var t = this,
        e = arguments;
      return new Promise(function (r, o) {
        var a = n.apply(t, e);
        function _next(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
        }
        function _throw(n) {
          asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
        }
        _next(void 0);
      });
    };
  }
  function _classPrivateFieldLooseBase(e, t) {
    if (!{}.hasOwnProperty.call(e, t)) throw new TypeError("attempted to use private field on non-instance");
    return e;
  }
  var id = 0;
  function _classPrivateFieldLooseKey(e) {
    return "__private_" + id++ + "_" + e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = true,
        o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = !1;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = true, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _objectWithoutProperties(e, t) {
    if (null == e) return {};
    var o,
      r,
      i = _objectWithoutPropertiesLoose(e, t);
    if (Object.getOwnPropertySymbols) {
      var n = Object.getOwnPropertySymbols(e);
      for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
    }
    return i;
  }
  function _objectWithoutPropertiesLoose(r, e) {
    if (null == r) return {};
    var t = {};
    for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
      if (-1 !== e.indexOf(n)) continue;
      t[n] = r[n];
    }
    return t;
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  /**
   * Canonical high-level media families used by format metadata and resources.
   */
  var MediaType = Object.freeze({
    AUDIO: "audio",
    DATA: "data",
    GEOMETRY: "geometry",
    IMAGE: "image",
    SCHEMA: "schema",
    SHADER: "shader",
    TEXTURE: "texture",
    VIDEO: "video"
  });

  /**
   * Canonical semantic payload roles emitted by format readers.
   */
  var PayloadType = Object.freeze({
    AUDIO: "audio",
    DATA: "data",
    GEOMETRY: "geometry",
    IMAGE: "image",
    RAW: "raw",
    SCHEMA: "schema",
    SHADER: "shader",
    TEXTURE: "texture",
    VIDEO: "video"
  });

  var OUTPUT_ROLE_RUNTIME = "runtime";
  var OUTPUT_ROLE_DEBUG = "debug";
  var READ_MODE_SYNC = "sync";
  var READ_MODE_ASYNC = "async";

  /**
   * Decorator-free base for every concrete format facade.
   *
   * The format subpaths must remain directly importable from authored source, so
   * this base deliberately does not import the decorated CjsResourceProbe model.
   * Formats return plain support reports; CjsResourceProbe.from() is the optional
   * resource-layer normalization boundary.
   */
  class CjsFormat {
    /**
     * Create a format facade with caller-owned default options.
     * @param {object|null} [options] Default read options.
     */
    constructor() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      this.options = {};
      this.options = _objectSpread2({}, options || {});
    }

    /** Apply caller-provided instance defaults. */
    SetValues() {
      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      this.options = _objectSpread2(_objectSpread2({}, this.options), values || {});
      return this;
    }

    /** Return caller-provided instance defaults. */
    GetValues() {
      return _objectSpread2({}, this.options);
    }

    /** Read through the concrete instance implementation. */
    Read(_input) {
      var error = new Error("".concat(this.constructor.name, ".Read is not implemented."));
      error.code = "CJS_FORMAT_READ_NOT_IMPLEMENTED";
      throw error;
    }

    /** Async instance read; synchronous readers inherit this exact fallback. */
    ReadAsync(input) {
      var _arguments = arguments,
        _this = this;
      return _asyncToGenerator(function* () {
        var options = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : null;
        return _this.Read(input, options);
      })();
    }

    /** Inspect with the instance's normalized options when available. */
    Inspect(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var values = typeof this.GetValues === "function" ? this.GetValues(options || {}) : options || {};
      return this.constructor.inspect(input, values);
    }

    /** Return the cheap, unverified support report for this instance profile. */
    GetSupport(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var values = typeof this.GetValues === "function" ? this.GetValues(options || {}) : options || {};
      return this.constructor.getSupport(input, values);
    }

    /** Exercise one exact output through the real asynchronous read path. */
    VerifySupport(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var values = typeof this.GetValues === "function" ? this.GetValues(options || {}) : options || {};
      return this.constructor.verifySupport(input, values);
    }

    /**
     * Static read boundary. Concrete formats normally override this; the base
     * fallback supports the few formats implemented only as instance readers.
     */
    static read(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var reader = new this(options || {});
      if (reader.Read === CjsFormat.prototype.Read) {
        var error = new Error("".concat(this.name, ".read is not implemented."));
        error.code = "CJS_FORMAT_READ_NOT_IMPLEMENTED";
        throw error;
      }
      return reader.Read(input, options || {});
    }

    /** Async read boundary used by support verification and resource loading. */
    static readAsync(input) {
      var _arguments2 = arguments,
        _this2 = this;
      return _asyncToGenerator(function* () {
        var options = _arguments2.length > 1 && _arguments2[1] !== undefined ? _arguments2[1] : null;
        if (Object.hasOwn(_this2, "read")) return _this2.read(input, options || {});
        var reader = new _this2(options || {});
        return reader.ReadAsync(input, options || {});
      })();
    }

    /**
     * Synchronous structural metadata accessor.
     *
     * Inspection answers what the input is. It does not claim that any decoder
     * output works in the current environment.
     */
    static inspect(_input) {
      var error = new Error("".concat(this.name, ".inspect is not implemented."));
      error.code = "CJS_FORMAT_INSPECT_NOT_IMPLEMENTED";
      throw error;
    }

    /** Cheap synchronous identification used only for route selection. */
    static is(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      try {
        if (Object.hasOwn(this, "probeSupport")) {
          return recognizesProbe(this.probeSupport(input, options || {}));
        }
        this.inspect(input, options || {});
        return true;
      } catch (_unused) {
        return false;
      }
    }

    /**
     * Format-specific cheap support probe hook.
     *
     * Concrete formats may override this with header/environment reasoning. The
     * public getSupport() method normalizes its result into the uniform contract.
     */
    static probeSupport(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      try {
        return {
          format: this.id,
          source: typeof input === "string" ? "path" : "buffer",
          recognized: true,
          metadata: this.inspect(input, options || {}),
          reason: "Container structure recognized."
        };
      } catch (error) {
        return {
          format: this.id,
          source: typeof input === "string" ? "path" : "buffer",
          recognized: false,
          metadata: null,
          reason: (error === null || error === void 0 ? void 0 : error.message) || "Input was not recognized.",
          errors: [(error === null || error === void 0 ? void 0 : error.message) || "Input was not recognized."]
        };
      }
    }

    /**
     * Cheap synchronous output support report.
     *
     * This is advisory: it may use headers, structure, and current environment
     * features, but never claims that the decoder ran. Every output entry is
     * therefore returned with verified:false.
     */
    static getSupport(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var values = options && typeof options === "object" ? options : {};
      var report;
      try {
        report = this.probeSupport(input, values);
      } catch (error) {
        report = {
          format: this.id,
          source: typeof input === "string" ? "path" : "buffer",
          recognized: false,
          reason: (error === null || error === void 0 ? void 0 : error.message) || "Support probe failed.",
          errors: [(error === null || error === void 0 ? void 0 : error.message) || "Support probe failed."]
        };
      }
      return normalizeSupportReport(this, report, values);
    }

    /**
     * Prove one exact output by exercising the real asynchronous reader.
     *
     * This is an explicit diagnostic/capability operation. Normal resource
     * loading calls readAsync() once and treats its successful result as proof;
     * it must not verify and then decode the same payload a second time.
     */
    static verifySupport(input) {
      var _arguments3 = arguments,
        _this3 = this;
      return _asyncToGenerator(function* () {
        var options = _arguments3.length > 1 && _arguments3[1] !== undefined ? _arguments3[1] : null;
        var values = options && typeof options === "object" ? options : {};
        var report = _this3.getSupport(input, values);
        var capability = _this3.getOutputCapability(report.output);
        if (!capability) {
          var message = report.output ? "".concat(_this3.name, " declares no output ").concat(JSON.stringify(report.output), ".") : "".concat(_this3.name, " declares no verifiable default output.");
          return _objectSpread2(_objectSpread2({}, report), {}, {
            supported: false,
            verified: true,
            reason: message,
            error: {
              name: "Error",
              code: "CJS_FORMAT_OUTPUT_UNDECLARED",
              message
            }
          });
        }
        try {
          yield _this3.readAsync(input, _objectSpread2(_objectSpread2({}, values), {}, {
            emit: capability.output
          }));
          return freezeVerification(report, capability, true, null);
        } catch (error) {
          return freezeVerification(report, capability, false, error);
        }
      })();
    }

    /** Return the canonical declaration for one output selector. */
    static getOutputCapability() {
      var output = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (!output) {
        return Object.values(this.outputs).find(entry => entry.default) || null;
      }
      var normalized = String(output).toLowerCase();
      return Object.values(this.outputs).find(entry => entry.output.toLowerCase() === normalized) || null;
    }

    /**
     * Whether this format can be written, optionally from one named input.
     *
     * @param {string} [input] Payload name, or omitted for "at all".
     * @returns {boolean} True when a matching input is declared.
     */
    static canWrite() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      return this.getInputCapability(input) !== null;
    }

    /** Look up one declared write input, or the default when none is named. */
    static getInputCapability() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (!input) {
        return Object.values(this.inputs).find(entry => entry.default) || null;
      }
      var normalized = String(input).toLowerCase();
      return Object.values(this.inputs).find(entry => entry.input.toLowerCase() === normalized) || null;
    }

    /**
     * Freeze and validate one format's authoritative input map.
     *
     * Mirrors `defineOutputs`, including the one-default rule: a format that can
     * be written from several payloads still has one obvious answer to "write
     * this", and leaving that to argument order is how a caller ends up writing
     * the wrong thing silently.
     *
     * `lossy` is declared rather than inferred. It is the fact a caller most
     * needs before choosing a writer - a converter that reaches for JPEG to save
     * space and destroys an alpha channel it needed has made a mistake nothing
     * downstream can detect.
     */
    static defineInputs() {
      var definitions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) {
        throw new TypeError("CjsFormat.defineInputs requires an object map.");
      }
      var inputs = {};
      var defaults = 0;
      for (var _ref3 of Object.entries(definitions)) {
        var _ref2 = _slicedToArray(_ref3, 2);
        var input = _ref2[0];
        var definition = _ref2[1];
        if (!input || !definition || typeof definition !== "object" || Array.isArray(definition)) {
          throw new TypeError("Each format input requires a non-empty name and descriptor.");
        }
        var writeMode = definition.writeMode || READ_MODE_SYNC;
        if (![READ_MODE_SYNC, READ_MODE_ASYNC].includes(writeMode)) {
          throw new TypeError("Format input ".concat(input, " has invalid writeMode ").concat(JSON.stringify(writeMode), "."));
        }
        if (definition.default === true) defaults++;
        inputs[input] = {
          input,
          payloadType: definition.payloadType || input,
          writeMode,
          lossy: definition.lossy === true,
          default: definition.default === true,
          options: [...(definition.options || [])]
        };
      }
      if (defaults > 1) throw new TypeError("A format may declare only one default input.");
      if (Object.keys(inputs).length > 0 && defaults !== 1) {
        throw new TypeError("A format with inputs must declare exactly one default input.");
      }
      return Object.freeze(inputs);
    }

    /** Freeze and validate one format's authoritative output map. */
    static defineOutputs() {
      var definitions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) {
        throw new TypeError("CjsFormat.defineOutputs requires an object map.");
      }
      var outputs = {};
      var defaults = 0;
      for (var _ref6 of Object.entries(definitions)) {
        var _ref7, _definition$probes;
        var _ref5 = _slicedToArray(_ref6, 2);
        var output = _ref5[0];
        var definition = _ref5[1];
        if (!output || !definition || typeof definition !== "object" || Array.isArray(definition)) {
          throw new TypeError("Each format output requires a non-empty name and descriptor.");
        }
        var role = definition.role || OUTPUT_ROLE_RUNTIME;
        var readMode = definition.readMode || READ_MODE_SYNC;
        if (![OUTPUT_ROLE_RUNTIME, OUTPUT_ROLE_DEBUG].includes(role)) {
          throw new TypeError("Format output ".concat(output, " has invalid role ").concat(JSON.stringify(role), "."));
        }
        if (![READ_MODE_SYNC, READ_MODE_ASYNC].includes(readMode)) {
          throw new TypeError("Format output ".concat(output, " has invalid readMode ").concat(JSON.stringify(readMode), "."));
        }
        if (definition.default === true) defaults++;
        var probes = (_ref7 = (_definition$probes = definition.probes) != null ? _definition$probes : definition.probe) != null ? _ref7 : output;
        outputs[output] = {
          output,
          payloadType: definition.payloadType || output,
          role,
          readMode,
          decoded: definition.decoded === true,
          passthrough: definition.passthrough === true,
          default: definition.default === true,
          probes: (Array.isArray(probes) ? probes : [probes]).map(String),
          requires: [...(definition.requires || [])]
        };
      }
      if (defaults > 1) throw new TypeError("A format may declare only one default output.");
      if (Object.keys(outputs).length > 0 && defaults !== 1) {
        throw new TypeError("A format with outputs must declare exactly one default output.");
      }
      return outputs;
    }

    /** Assert the canonical format surface without requiring optional outputs. */
    static validateContract(Constructor) {
      if (typeof Constructor !== "function" || !(Constructor.prototype instanceof CjsFormat)) {
        throw new TypeError("CjsFormat.validateContract requires a CjsFormat subclass.");
      }
      if (typeof Constructor.id !== "string" || !Constructor.id) {
        throw new TypeError("".concat(Constructor.name, " must declare a non-empty id."));
      }
      if (!Array.isArray(Constructor.mediaTypes) || Constructor.mediaTypes.length === 0) {
        throw new TypeError("".concat(Constructor.name, " must declare non-empty mediaTypes."));
      }
      for (var mediaType of Constructor.mediaTypes) {
        if (!Object.values(MediaType).includes(mediaType)) {
          throw new TypeError("".concat(Constructor.name, " media type ").concat(JSON.stringify(mediaType), " is not canonical."));
        }
      }
      if (!Array.isArray(Constructor.extensions)) {
        throw new TypeError("".concat(Constructor.name, " must declare extensions."));
      }
      if (!Constructor.outputs || typeof Constructor.outputs !== "object" || Array.isArray(Constructor.outputs)) {
        throw new TypeError("".concat(Constructor.name, " must declare outputs."));
      }
      if (typeof Constructor.requestResponseType !== "string" || !Constructor.requestResponseType) {
        throw new TypeError("".concat(Constructor.name, " must declare a requestResponseType."));
      }
      if (Constructor.worker !== null) {
        if (!Constructor.worker || typeof Constructor.worker !== "object") {
          throw new TypeError("".concat(Constructor.name, ".worker must be null or a descriptor object."));
        }
        if (typeof Constructor.worker.module !== "string" || !Constructor.worker.module || typeof Constructor.worker.exportName !== "string" || !Constructor.worker.exportName || !Array.isArray(Constructor.worker.outputTypes)) {
          throw new TypeError("".concat(Constructor.name, ".worker has an invalid execution descriptor."));
        }
        for (var output of Constructor.worker.outputTypes) {
          if (!Constructor.getOutputCapability(output)) {
            throw new TypeError("".concat(Constructor.name, ".worker names undeclared output ").concat(JSON.stringify(output), "."));
          }
        }
        if (Constructor.worker.defaultOutput && !Constructor.getOutputCapability(Constructor.worker.defaultOutput)) {
          throw new TypeError("".concat(Constructor.name, ".worker names an undeclared default output."));
        }
      }
      for (var retired of ["type", "inputTypes", "outputTypes", "debugOutputTypes", "implementationStatus"]) {
        if (Object.hasOwn(Constructor, retired)) {
          throw new TypeError("".concat(Constructor.name, " must not declare retired static ").concat(retired, "."));
        }
      }
      var defaults = 0;
      for (var _ref0 of Object.entries(Constructor.outputs)) {
        var _ref9 = _slicedToArray(_ref0, 2);
        var _output = _ref9[0];
        var capability = _ref9[1];
        if (capability.output !== _output) {
          throw new TypeError("".concat(Constructor.name, " output ").concat(_output, " has a mismatched descriptor."));
        }
        if (capability.default) defaults++;
      }
      if (Object.keys(Constructor.outputs).length > 0 && defaults !== 1) {
        throw new TypeError("".concat(Constructor.name, " must declare exactly one default output."));
      }
    }
  }
  CjsFormat.Type = MediaType;
  CjsFormat.MediaType = MediaType;
  CjsFormat.OutputType = Object.freeze({
    AUDIO: PayloadType.AUDIO,
    CMF: "cmf",
    DOCUMENT: "document",
    GR2: "gr2",
    IMAGE: PayloadType.IMAGE,
    JSON: "json",
    MEDIA: "media",
    METADATA: "metadata",
    OGG: "ogg",
    PAYLOAD: "payload",
    PCM: "pcm",
    RAW: PayloadType.RAW,
    RGBA: "rgba",
    RUNTIME: "runtime",
    SCHEMA: PayloadType.SCHEMA,
    SHADER: PayloadType.SHADER,
    SHARED: "shared",
    TEXTURE: PayloadType.TEXTURE,
    VIDEO: PayloadType.VIDEO
  });
  CjsFormat.id = "";
  CjsFormat.mediaTypes = Object.freeze([]);
  CjsFormat.extensions = Object.freeze([]);
  CjsFormat.outputs = Object.freeze({});
  /**
   * What this format can be written FROM, empty when it cannot be written.
   *
   * The counterpart of `outputs`, and empty by default so that declaring a
   * writer is a deliberate act and every existing format keeps saying "read
   * only" without being touched. A caller asks `canWrite()` rather than
   * probing for a `write` method, because the presence of a function is not a
   * contract - it says nothing about what payload it takes or whether the
   * result is lossy.
   */
  CjsFormat.inputs = Object.freeze({});
  CjsFormat.requestResponseType = "arraybuffer";
  CjsFormat.worker = null;
  function normalizeSupportReport(Format, rawReport, options) {
    var _options$emit, _outputs$find, _outputs$find2, _raw$metadata;
    var raw = typeof rawReport === "boolean" ? {
      recognized: rawReport,
      supported: rawReport
    } : rawReport && typeof rawReport === "object" ? rawReport : {};
    var requested = (_options$emit = options.emit) != null ? _options$emit : null;
    var capability = Format.getOutputCapability(requested);
    var legacyVariants = Array.isArray(raw.variants) ? raw.variants : [];
    var rawPositive = raw.supported === true || raw.supported === "full" || raw.supported === "partial";
    var recognized = raw.recognized === true || raw.recognized !== false && (raw.metadata != null || rawPositive);
    var outputs = Object.values(Format.outputs).map(entry => {
      var variant = findLegacyVariant(entry, legacyVariants);
      var supported = variant ? variant.supported === true : recognized && (legacyVariants.length === 0 ? raw.supported !== false && raw.supported !== "none" : false);
      return _objectSpread2(_objectSpread2({}, entry), {}, {
        supported,
        verified: false,
        codec: (variant === null || variant === void 0 ? void 0 : variant.codec) || "",
        reason: (variant === null || variant === void 0 ? void 0 : variant.reason) || raw.reason || (supported ? "Output appears usable from structural evidence." : "Output was not supported by the structural probe."),
        requires: [...((variant === null || variant === void 0 ? void 0 : variant.requires) || entry.requires)]
      });
    });
    var selected = capability ? outputs.find(entry => entry.output === capability.output) || null : null;
    var preferredOutput = resolvePreferredOutput(raw.preferredOutput, outputs) || ((_outputs$find = outputs.find(entry => entry.supported && entry.role === OUTPUT_ROLE_RUNTIME)) === null || _outputs$find === void 0 ? void 0 : _outputs$find.output) || ((_outputs$find2 = outputs.find(entry => entry.supported)) === null || _outputs$find2 === void 0 ? void 0 : _outputs$find2.output) || "";
    return {
      format: Format.id || raw.format || Format.name,
      source: raw.source || options.source || "buffer",
      recognized,
      output: (capability === null || capability === void 0 ? void 0 : capability.output) || (requested == null ? "" : String(requested)),
      supported: (selected === null || selected === void 0 ? void 0 : selected.supported) === true,
      verified: false,
      preferredOutput,
      reason: (selected === null || selected === void 0 ? void 0 : selected.reason) || raw.reason || (recognized ? "Input recognized." : "Input not recognized."),
      metadata: (_raw$metadata = raw.metadata) != null ? _raw$metadata : null,
      capability: selected,
      outputs: outputs,
      warnings: [...(raw.warnings || [])],
      errors: [...(raw.errors || [])],
      error: null
    };
  }
  function recognizesProbe(report) {
    if (report === true) return true;
    if (!report || typeof report !== "object" || report.recognized === false) return false;
    return report.recognized === true || report.supported === true || report.supported === "full" || report.supported === "partial" || report.metadata != null;
  }
  function findLegacyVariant(capability, variants) {
    var probes = new Set(capability.probes.map(value => value.toLowerCase()));
    var matches = variants.filter(variant => {
      for (var value of [variant === null || variant === void 0 ? void 0 : variant.output, variant === null || variant === void 0 ? void 0 : variant.kind, variant === null || variant === void 0 ? void 0 : variant.payloadType]) {
        if (value != null && probes.has(String(value).toLowerCase())) return true;
      }
      return false;
    });
    var output = capability.output.toLowerCase();
    return matches.find(variant => String((variant === null || variant === void 0 ? void 0 : variant.output) || "").toLowerCase() === output) || matches.find(variant => String((variant === null || variant === void 0 ? void 0 : variant.kind) || "").toLowerCase() === output) || matches.find(variant => String((variant === null || variant === void 0 ? void 0 : variant.payloadType) || "").toLowerCase() === output) || matches.find(variant => variant.supported === true) || matches[0] || null;
  }
  function resolvePreferredOutput(preferredOutput, outputs) {
    if (!preferredOutput) return "";
    var normalized = String(preferredOutput).toLowerCase();
    var direct = outputs.find(entry => entry.output.toLowerCase() === normalized);
    return (direct === null || direct === void 0 ? void 0 : direct.output) || "";
  }
  function freezeVerification(report, capability, supported, error) {
    var errorReport = error ? serializeError(error) : null;
    var outputs = report.outputs.map(entry => entry.output === capability.output ? _objectSpread2(_objectSpread2({}, entry), {}, {
      supported,
      verified: true,
      reason: supported ? "The real asynchronous read path completed successfully." : errorReport.message
    }) : entry);
    return _objectSpread2(_objectSpread2({}, report), {}, {
      recognized: supported ? true : report.recognized,
      supported,
      verified: true,
      reason: supported ? "The real asynchronous read path completed successfully." : errorReport.message,
      capability: outputs.find(entry => entry.output === capability.output) || null,
      outputs: outputs,
      errors: errorReport ? [...report.errors, errorReport.message] : report.errors,
      error: errorReport
    });
  }
  function serializeError(error) {
    var details = {};
    for (var _ref11 of Object.entries(error || {})) {
      var _ref10 = _slicedToArray(_ref11, 2);
      var key = _ref10[0];
      var value = _ref10[1];
      if (["name", "code", "message", "cause"].includes(key)) continue;
      details[key] = value;
    }
    return {
      name: (error === null || error === void 0 ? void 0 : error.name) || "Error",
      code: (error === null || error === void 0 ? void 0 : error.code) || "CJS_FORMAT_VERIFY_FAILED",
      message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
      details: details,
      cause: error !== null && error !== void 0 && error.cause ? {
        name: error.cause.name || "Error",
        code: error.cause.code || "",
        message: error.cause.message || String(error.cause)
      } : null
    };
  }

  /**
   * Granny animation-curve decompression helpers
   * `decodeCurve(curveJson, dimension)` takes a GR2 JSON curve object in the
   * shape emitted by PrintCurve2 and returns explicit knots and controls.
   */

  /** Format id for raw float keyframes with implicit knots. */
  var FORMAT_DA_KEYFRAMES_32F = 0;

  /** Format id for uncompressed float knots and float controls. */
  var FORMAT_DA_K32F_C32F = 1;

  /** Format id for an identity transform curve. */
  var FORMAT_DA_IDENTITY = 2;

  /** Format id for a constant float control vector. */
  var FORMAT_DA_CONSTANT_32F = 3;

  /** Format id for a constant vec3 control. */
  var FORMAT_D3_CONSTANT_32F = 4;

  /** Format id for a constant quaternion control. */
  var FORMAT_D4_CONSTANT_32F = 5;

  /** Format id for uint16 DaK packed knots and controls. */
  var FORMAT_DA_K16U_C16U = 6;

  /** Format id for uint8 DaK packed knots and controls. */
  var FORMAT_DA_K8U_C8U = 7;

  /** Format id for uint16 normalized quaternion curves with 15-bit controls. */
  var FORMAT_D4N_K16U_C15U = 8;

  /** Format id for uint8 normalized quaternion curves with 7-bit controls. */
  var FORMAT_D4N_K8U_C7U = 9;

  /** Format id for uint16 vec3 position curves. */
  var FORMAT_D3_K16U_C16U = 10;

  /** Format id for uint8 vec3 position curves. */
  var FORMAT_D3_K8U_C8U = 11;

  /** Format id for uint16 uniform scale/shear curves. */
  var FORMAT_D9I1_K16U_C16U = 12;

  /** Format id for uint16 per-axis scale/shear curves. */
  var FORMAT_D9I3_K16U_C16U = 13;

  /** Format id for uint8 uniform scale/shear curves. */
  var FORMAT_D9I1_K8U_C8U = 14;

  /** Format id for uint8 per-axis scale/shear curves. */
  var FORMAT_D9I3_K8U_C8U = 15;

  /** Format id for float D3I1 line-parameterized vec3 curves. */
  var FORMAT_D3I1_K32F_C32F = 16;

  /** Format id for uint16 D3I1 line-parameterized vec3 curves. */
  var FORMAT_D3I1_K16U_C16U = 17;

  /** Format id for uint8 D3I1 line-parameterized vec3 curves. */
  var FORMAT_D3I1_K8U_C8U = 18;

  /**
   * Granny curve format ids keyed by descriptive uppercase names.
   */
  var CURVE_FORMATS$1 = Object.freeze({
    DA_KEYFRAMES_32F: FORMAT_DA_KEYFRAMES_32F,
    DA_K32F_C32F: FORMAT_DA_K32F_C32F,
    DA_IDENTITY: FORMAT_DA_IDENTITY,
    DA_CONSTANT_32F: FORMAT_DA_CONSTANT_32F,
    D3_CONSTANT_32F: FORMAT_D3_CONSTANT_32F,
    D4_CONSTANT_32F: FORMAT_D4_CONSTANT_32F,
    DA_K16U_C16U: FORMAT_DA_K16U_C16U,
    DA_K8U_C8U: FORMAT_DA_K8U_C8U,
    D4N_K16U_C15U: FORMAT_D4N_K16U_C15U,
    D4N_K8U_C7U: FORMAT_D4N_K8U_C7U,
    D3_K16U_C16U: FORMAT_D3_K16U_C16U,
    D3_K8U_C8U: FORMAT_D3_K8U_C8U,
    D9I1_K16U_C16U: FORMAT_D9I1_K16U_C16U,
    D9I3_K16U_C16U: FORMAT_D9I3_K16U_C16U,
    D9I1_K8U_C8U: FORMAT_D9I1_K8U_C8U,
    D9I3_K8U_C8U: FORMAT_D9I3_K8U_C8U,
    D3I1_K32F_C32F: FORMAT_D3I1_K32F_C32F,
    D3I1_K16U_C16U: FORMAT_D3I1_K16U_C16U,
    D3I1_K8U_C8U: FORMAT_D3I1_K8U_C8U
  });

  /**
   * Float32 rounding helper used to mirror the reference curve decoders.
   *
   * The reference implementation stores every decoded value into Float32Array
   * buffers, so this helper applies the same rounding at each write.
   */
  var fr$1 = Math.fround;

  /**
   * Granny stores 1/knotScale as the top 16 bits of the float only
   * ("OneOverKnotScaleTrunc"). Reconstruct the float32.
   * @param {number} oneOverKnotScaleTrunc uint16
   * @returns {number}
   */
  function knotScaleFromTrunc(oneOverKnotScaleTrunc) {
    var u = new Uint32Array([oneOverKnotScaleTrunc << 16]);
    return new Float32Array(u.buffer)[0];
  }

  /**
   * Expand the leading `count` entries of a knotsControls array into knots.
   * @param {ArrayLike<number>} knotsControls
   * @param {number} count
   * @param {number} scale divisor (1/knotScale)
   * @returns {number[]}
   */
  function knotsFromControls(knotsControls, count, scale) {
    var out = new Array(count);
    for (var i = 0; i < count; i++) {
      out[i] = fr$1(knotsControls[i] / scale);
    }
    return out;
  }

  /**
   * Knots via the truncated knot scale.
   *
   * @param {ArrayLike<number>} knotsControls Packed knot/control array.
   * @param {number} count Number of knots at the front of `knotsControls`.
   * @param {number} oneOverKnotScaleTrunc Truncated reciprocal knot scale.
   * @returns {number[]} Decoded knot times.
   */
  function knotsFromControlsTrunc(knotsControls, count, oneOverKnotScaleTrunc) {
    return knotsFromControls(knotsControls, count, knotScaleFromTrunc(oneOverKnotScaleTrunc));
  }

  /**
   * Identity control vector for a track dimension.
   * @param {number} dimension 3 (position), 4 (quaternion) or 9 (mat3)
   * @returns {number[]}
   */
  function identityControls(dimension) {
    switch (dimension) {
      case 3:
        return [0, 0, 0];
      case 4:
        return [0, 0, 0, 1];
      case 9:
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
      default:
        throw new Error("gr2reader: invalid curve dimension ".concat(dimension));
    }
  }

  /**
   * Ensure a divisibility relation holds; throws with a descriptive error.
   *
   * @param {number} numerator Value expected to divide evenly.
   * @param {number} divisor Divisor to check against.
   * @param {string} what Human-readable operation name for the error message.
   * @returns {number} Exact quotient.
   * @throws {Error} If the quotient is not an integer.
   */
  function exactDiv(numerator, divisor, what) {
    var v = numerator / divisor;
    if (!Number.isInteger(v)) {
      throw new Error("gr2reader: curve ".concat(what, ": ").concat(numerator, " is not divisible by ").concat(divisor));
    }
    return v;
  }

  /**
   * Decode raw keyframe controls with implicit knots `0..n-1`.
   *
   * @param {object} c Curve object with `controls` and optional `dimension`.
   * @param {number} dimension Fallback control-vector width.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeDaKeyframes32f(c, dimension) {
    var dim = c.dimension || dimension,
      controls = c.controls || [],
      count = exactDiv(controls.length, dim, "DaKeyframes32f controls/dimension"),
      knots = new Array(count);
    for (var i = 0; i < count; i++) {
      knots[i] = i;
    }
    return {
      knots,
      controls: controls.map(fr$1),
      dimension: dim
    };
  }

  /**
   * Decode uncompressed float knots and float controls.
   *
   * @param {object} c Curve object with `knots` and `controls`.
   * @param {number} dimension Fallback control-vector width when no knots exist.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeDaK32fC32f(c, dimension) {
    var knots = (c.knots || []).map(fr$1),
      controls = (c.controls || []).map(fr$1),
      dim = knots.length ? exactDiv(controls.length, knots.length, "DaK32fC32f controls/knots") : dimension;
    return {
      knots,
      controls,
      dimension: dim
    };
  }

  /**
   * Decode an identity transform curve for the requested track dimension.
   *
   * @param {object} c Curve object with optional `dimension`.
   * @param {number} dimension Fallback control-vector width.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeDaIdentity(c, dimension) {
    var dim = c.dimension || dimension;
    return {
      knots: [0],
      controls: identityControls(dim),
      dimension: dim
    };
  }

  /**
   * Decode a constant float control vector.
   *
   * @param {object} c Curve object with `controls`.
   * @param {number} dimension Fallback control-vector width.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeDaConstant32f(c, dimension) {
    var controls = (c.controls || []).map(fr$1);
    return {
      knots: [0],
      controls,
      dimension: controls.length || dimension
    };
  }

  /**
   * Decode a constant vec3 control.
   *
   * @param {object} c Curve object with optional `controls`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD3Constant32f(c) {
    var controls = (c.controls || [0, 0, 0]).slice(0, 3).map(fr$1);
    return {
      knots: [0],
      controls,
      dimension: 3
    };
  }

  /**
   * Decode a constant quaternion control.
   *
   * @param {object} c Curve object with optional `controls`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD4Constant32f(c) {
    var controls = (c.controls || [0, 0, 0, 1]).slice(0, 4).map(fr$1);
    return {
      knots: [0],
      controls,
      dimension: 4
    };
  }

  /**
   * Decode a DaK packed knot/control curve using uint16 payload values.
   *
   * @param {object} c Curve object with `knotsControls`, `controlScaleOffsets`,
   * and `oneOverKnotScaleTrunc`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeDaK(c) {
    var so = c.controlScaleOffsets || [],
      kc = c.knotsControls || [],
      dim = exactDiv(so.length, 2, "DaK controlScaleOffsets/2"),
      count = exactDiv(kc.length, dim + 1, "DaK knotsControls/(dim+1)"),
      knots = knotsFromControlsTrunc(kc, count, c.oneOverKnotScaleTrunc),
      controls = new Array(count * dim);
    for (var i = 0; i < count; i++) {
      for (var x = 0; x < dim; x++) {
        controls[i * dim + x] = fr$1(kc[count + i * dim + x] * so[x] + so[dim + x]);
      }
    }
    return {
      knots,
      controls,
      dimension: dim
    };
  }

  /** Scale lookup table for D4n normalized quaternion controls. */
  var D4N_SCALE_TABLE = new Float32Array([1.4142135, 0.70710677, 0.35355338, 0.35355338, 0.35355338, 0.17677669, 0.17677669, 0.17677669, -1.4142135, -0.70710677, -0.35355338, -0.35355338, -0.35355338, -0.17677669, -0.17677669, -0.17677669]);

  /** Offset lookup table for D4n normalized quaternion controls. */
  var D4N_OFFSET_TABLE = new Float32Array([-0.70710677, -0.35355338, -0.53033006, -0.17677669, 0.17677669, -0.17677669, -0.088388346, 0.0, 0.70710677, 0.35355338, 0.53033006, 0.17677669, -0.17677669, 0.17677669, 0.088388346, -0]);

  /**
   * Decode one 16-bit control triple into a quaternion (matches ccpwgl
   * Gr2CurveDataD4nK16uC15u.GetQuatFromControl).
   *
   * @param {number[]} out Mutable quaternion output buffer.
   * @param {number} a First packed control value.
   * @param {number} b Second packed control value.
   * @param {number} c Third packed control value.
   * @param {ArrayLike<number>} scales Four scale values selected from the table.
   * @param {ArrayLike<number>} offsets Four offset values selected from the table.
   * @returns {number[]} The same `out` quaternion buffer.
   */
  function quatFromControl16(out, a, b, c, scales, offsets) {
    var swizzle1 = (b & 0x8000) >> 14 | c >> 15,
      swizzle2 = swizzle1 + 1 & 3,
      swizzle3 = swizzle2 + 1 & 3,
      swizzle4 = swizzle3 + 1 & 3;
    var dataA = (a & 0x7fff) * scales[swizzle2] + offsets[swizzle2],
      dataB = (b & 0x7fff) * scales[swizzle3] + offsets[swizzle3],
      dataC = (c & 0x7fff) * scales[swizzle4] + offsets[swizzle4];
    var dataD = Math.sqrt(Math.max(0, 1 - (dataA * dataA + dataB * dataB + dataC * dataC)));
    if ((a & 0x8000) !== 0) dataD = -dataD;
    out[swizzle2] = fr$1(dataA);
    out[swizzle3] = fr$1(dataB);
    out[swizzle4] = fr$1(dataC);
    out[swizzle1] = fr$1(dataD);
    return out;
  }

  /** Scale-table multiplier for D4n 16-bit knot / 15-bit control curves. */
  var D4N_SCALE_TABLE_MULTIPLIER_16 = 0.000030518509;

  /**
   * Decode a D4n normalized quaternion curve using a supplied control decoder.
   *
   * @param {object} c Curve object with `knotsControls`, `scaleOffsetTableEntries`,
   * and `oneOverKnotScale`.
   * @param {Function} quatFromControl Function that expands one packed control
   * triple into a quaternion.
   * @param {number} scaleTableMultiplier Multiplier for selected scale table entries.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD4n(c, quatFromControl, scaleTableMultiplier) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 4, "D4n knotsControls/4"),
      knots = knotsFromControls(kc, count, c.oneOverKnotScale);
    var selector = c.scaleOffsetTableEntries >>> 0,
      scales = new Float32Array([D4N_SCALE_TABLE[selector >> 0 & 0x0f] * scaleTableMultiplier, D4N_SCALE_TABLE[selector >> 4 & 0x0f] * scaleTableMultiplier, D4N_SCALE_TABLE[selector >> 8 & 0x0f] * scaleTableMultiplier, D4N_SCALE_TABLE[selector >> 12 & 0x0f] * scaleTableMultiplier]),
      offsets = new Float32Array([D4N_OFFSET_TABLE[selector >> 0 & 0x0f], D4N_OFFSET_TABLE[selector >> 4 & 0x0f], D4N_OFFSET_TABLE[selector >> 8 & 0x0f], D4N_OFFSET_TABLE[selector >> 12 & 0x0f]]);
    var controls = new Array(count * 4),
      quat = [0, 0, 0, 1];
    for (var i = 0; i < count; i++) {
      quatFromControl(quat, kc[count + i * 3], kc[count + i * 3 + 1], kc[count + i * 3 + 2], scales, offsets);
      controls[i * 4] = quat[0];
      controls[i * 4 + 1] = quat[1];
      controls[i * 4 + 2] = quat[2];
      controls[i * 4 + 3] = quat[3];
    }
    return {
      knots,
      controls,
      dimension: 4
    };
  }

  /**
   * Decode a D4n curve using 16-bit knots and 15-bit quaternion controls.
   *
   * @param {object} c Curve object with packed quaternion data.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD4nK16uC15u(c) {
    return decodeD4n(c, quatFromControl16, D4N_SCALE_TABLE_MULTIPLIER_16);
  }

  /** Scale-table multiplier for D4n 8-bit knot / 7-bit control curves. */
  var D4N_SCALE_TABLE_MULTIPLIER_8 = 0.0078740157;

  /**
   * Decode one 8-bit control triple into a quaternion.
   *
   * @param {number[]} out Mutable quaternion output buffer.
   * @param {number} a First packed control value.
   * @param {number} b Second packed control value.
   * @param {number} c Third packed control value.
   * @param {ArrayLike<number>} scales Four scale values selected from the table.
   * @param {ArrayLike<number>} offsets Four offset values selected from the table.
   * @returns {number[]} The same `out` quaternion buffer.
   */
  function quatFromControl8(out, a, b, c, scales, offsets) {
    var swizzle1 = (b & 0x80) >> 6 | (c & 0x80) >> 7,
      swizzle2 = swizzle1 + 1 & 3,
      swizzle3 = swizzle2 + 1 & 3,
      swizzle4 = swizzle3 + 1 & 3;
    var dataA = (a & 0x7f) * scales[swizzle2] + offsets[swizzle2],
      dataB = (b & 0x7f) * scales[swizzle3] + offsets[swizzle3],
      dataC = (c & 0x7f) * scales[swizzle4] + offsets[swizzle4];
    var dataD = Math.sqrt(Math.max(0, 1 - (dataA * dataA + dataB * dataB + dataC * dataC)));
    if ((a & 0x80) !== 0) dataD = -dataD;
    out[swizzle2] = fr$1(dataA);
    out[swizzle3] = fr$1(dataB);
    out[swizzle4] = fr$1(dataC);
    out[swizzle1] = fr$1(dataD);
    return out;
  }

  /**
   * Decode a D4n curve using 8-bit knots and 7-bit quaternion controls.
   *
   * @param {object} c Curve object with packed quaternion data.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD4nK8uC7u(c) {
    return decodeD4n(c, quatFromControl8, D4N_SCALE_TABLE_MULTIPLIER_8);
  }

  /**
   * Decode a D3K packed vec3 curve using uint16 payload values.
   *
   * @param {object} c Curve object with `knotsControls`, `controlScales`,
   * `controlOffsets`, and `oneOverKnotScaleTrunc`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD3K(c) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 4, "D3K knotsControls/4"),
      knots = knotsFromControlsTrunc(kc, count, c.oneOverKnotScaleTrunc),
      scales = c.controlScales,
      offsets = c.controlOffsets,
      controls = new Array(count * 3);
    for (var i = 0; i < count; i++) {
      for (var x = 0; x < 3; x++) {
        controls[i * 3 + x] = fr$1(kc[count + i * 3 + x] * scales[x] + offsets[x]);
      }
    }
    return {
      knots,
      controls,
      dimension: 3
    };
  }

  /**
   * Decode a D9I1 uniform scale/shear curve.
   *
   * @param {object} c Curve object with `knotsControls`, scalar scale/offset
   * fields, and `oneOverKnotScaleTrunc`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD9I1(c) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 2, "D9I1 knotsControls/2"),
      knots = knotsFromControlsTrunc(kc, count, c.oneOverKnotScaleTrunc);
    var scale = Array.isArray(c.controlScales) ? c.controlScales[0] : c.controlScale,
      offset = Array.isArray(c.controlOffsets) ? c.controlOffsets[0] : c.controlOffset,
      controls = new Array(count * 9).fill(0);
    for (var i = 0; i < count; i++) {
      var s = fr$1(kc[count + i] * scale + offset);
      controls[i * 9] = s;
      controls[i * 9 + 4] = s;
      controls[i * 9 + 8] = s;
    }
    return {
      knots,
      controls,
      dimension: 9
    };
  }

  /**
   * Decode a D9I3 per-axis scale/shear curve.
   *
   * @param {object} c Curve object with `knotsControls`, `controlScales`,
   * `controlOffsets`, and `oneOverKnotScaleTrunc`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD9I3(c) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 4, "D9I3 knotsControls/4"),
      knots = knotsFromControlsTrunc(kc, count, c.oneOverKnotScaleTrunc),
      scales = c.controlScales,
      offsets = c.controlOffsets,
      controls = new Array(count * 9).fill(0);
    for (var i = 0; i < count; i++) {
      controls[i * 9] = fr$1(kc[count + i * 3] * scales[0] + offsets[0]);
      controls[i * 9 + 4] = fr$1(kc[count + i * 3 + 1] * scales[1] + offsets[1]);
      controls[i * 9 + 8] = fr$1(kc[count + i * 3 + 2] * scales[2] + offsets[2]);
    }
    return {
      knots,
      controls,
      dimension: 9
    };
  }

  /**
   * Expand one scalar per knot into vec3 controls for the D3I1 family.
   *
   * @param {ArrayLike<number>} kc Packed knots followed by scalar controls.
   * @param {number} count Number of knots and scalar controls.
   * @param {ArrayLike<number>} scales vec3 component scales.
   * @param {ArrayLike<number>} offsets vec3 component offsets.
   * @returns {number[]} Flat vec3 controls.
   */
  function d3I1Controls(kc, count, scales, offsets) {
    var controls = new Array(count * 3);
    for (var i = 0; i < count; i++) {
      var v = kc[count + i];
      controls[i * 3] = fr$1(v * scales[0] + offsets[0]);
      controls[i * 3 + 1] = fr$1(v * scales[1] + offsets[1]);
      controls[i * 3 + 2] = fr$1(v * scales[2] + offsets[2]);
    }
    return controls;
  }

  /**
   * Decode a D3I1 curve with float knots and scalar float controls.
   *
   * @param {object} c Curve object with `knotsControls`, `controlScales`, and
   * `controlOffsets`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD3I1K32fC32f(c) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 2, "D3I1K32f knotsControls/2"),
      knots = new Array(count);
    for (var i = 0; i < count; i++) {
      knots[i] = fr$1(kc[i]);
    }
    return {
      knots,
      controls: d3I1Controls(kc, count, c.controlScales, c.controlOffsets),
      dimension: 3
    };
  }

  /**
   * Decode a D3I1 curve with uint knots and scalar controls.
   *
   * @param {object} c Curve object with `knotsControls`, `controlScales`,
   * `controlOffsets`, and `oneOverKnotScaleTrunc`.
   * @returns {{knots: number[], controls: number[], dimension: number}} Decoded curve.
   */
  function decodeD3I1u(c) {
    var kc = c.knotsControls || [],
      count = exactDiv(kc.length, 2, "D3I1 knotsControls/2"),
      knots = knotsFromControlsTrunc(kc, count, c.oneOverKnotScaleTrunc);
    return {
      knots,
      controls: d3I1Controls(kc, count, c.controlScales, c.controlOffsets),
      dimension: 3
    };
  }

  /**
   * Decode format 6, DaK16uC16u.
   *
   * @type {typeof decodeDaK}
   */
  var decodeDaK16uC16u = decodeDaK;

  /**
   * Decode format 7, DaK8uC8u.
   *
   * @type {typeof decodeDaK}
   */
  var decodeDaK8uC8u = decodeDaK;

  /**
   * Decode format 10, D3K16uC16u.
   *
   * @type {typeof decodeD3K}
   */
  var decodeD3K16uC16u = decodeD3K;

  /**
   * Decode format 11, D3K8uC8u.
   *
   * @type {typeof decodeD3K}
   */
  var decodeD3K8uC8u = decodeD3K;

  /**
   * Decode format 12, D9I1K16uC16u.
   *
   * @type {typeof decodeD9I1}
   */
  var decodeD9I1K16uC16u = decodeD9I1;

  /**
   * Decode format 14, D9I1K8uC8u.
   *
   * @type {typeof decodeD9I1}
   */
  var decodeD9I1K8uC8u = decodeD9I1;

  /**
   * Decode format 13, D9I3K16uC16u.
   *
   * @type {typeof decodeD9I3}
   */
  var decodeD9I3K16uC16u = decodeD9I3;

  /**
   * Decode format 15, D9I3K8uC8u.
   *
   * @type {typeof decodeD9I3}
   */
  var decodeD9I3K8uC8u = decodeD9I3;

  /**
   * Decode format 17, D3I1K16uC16u.
   *
   * @type {typeof decodeD3I1u}
   */
  var decodeD3I1K16uC16u = decodeD3I1u;

  /**
   * Decode format 18, D3I1K8uC8u.
   *
   * @type {typeof decodeD3I1u}
   */
  var decodeD3I1K8uC8u = decodeD3I1u;

  /**
   * Curve object as emitted inside GR2 JSON transform tracks.
   *
   * @typedef {object} CurveJson
   * @property {number} format Granny animation-curve format id.
   * @property {number} degree Curve degree from the Granny curve header.
   * @property {number[]} [knots] Explicit knot times when already decompressed.
   * @property {number[]} [controls] Explicit control values when already decoded.
   * @property {number} [dimension] Control vector width.
   * @property {string} [error] Emitter error marker for unsupported raw curves.
   */

  /**
   * Explicit curve data returned by {@link decodeCurve}.
   *
   * controls is a flat array in knot-major order:
   * controls[knotIndex * dimension + componentIndex].
   *
   * @typedef {object} DecodedCurve
   * @property {number[]} knots Knot times, non-decreasing.
   * @property {number[]} controls Flat control values.
   * @property {number} degree Curve degree.
   * @property {number} dimension Control vector width.
   */

  /**
   * Track dimension accepted by Granny transform curves.
   *
   * @typedef {1|3|4|9} TransformCurveDimension
   */

  /**
   * Decoder table ordered by Granny curve format id.
   *
   * Each entry exposes the numeric format and the function used by
   * {@link decodeCurve}.
   */
  var CURVE_DECODERS = Object.freeze([Object.freeze({
    format: FORMAT_DA_KEYFRAMES_32F,
    decode: decodeDaKeyframes32f
  }), Object.freeze({
    format: FORMAT_DA_K32F_C32F,
    decode: decodeDaK32fC32f
  }), Object.freeze({
    format: FORMAT_DA_IDENTITY,
    decode: decodeDaIdentity
  }), Object.freeze({
    format: FORMAT_DA_CONSTANT_32F,
    decode: decodeDaConstant32f
  }), Object.freeze({
    format: FORMAT_D3_CONSTANT_32F,
    decode: decodeD3Constant32f
  }), Object.freeze({
    format: FORMAT_D4_CONSTANT_32F,
    decode: decodeD4Constant32f
  }), Object.freeze({
    format: FORMAT_DA_K16U_C16U,
    decode: decodeDaK16uC16u
  }), Object.freeze({
    format: FORMAT_DA_K8U_C8U,
    decode: decodeDaK8uC8u
  }), Object.freeze({
    format: FORMAT_D4N_K16U_C15U,
    decode: decodeD4nK16uC15u
  }), Object.freeze({
    format: FORMAT_D4N_K8U_C7U,
    decode: decodeD4nK8uC7u
  }), Object.freeze({
    format: FORMAT_D3_K16U_C16U,
    decode: decodeD3K16uC16u
  }), Object.freeze({
    format: FORMAT_D3_K8U_C8U,
    decode: decodeD3K8uC8u
  }), Object.freeze({
    format: FORMAT_D9I1_K16U_C16U,
    decode: decodeD9I1K16uC16u
  }), Object.freeze({
    format: FORMAT_D9I3_K16U_C16U,
    decode: decodeD9I3K16uC16u
  }), Object.freeze({
    format: FORMAT_D9I1_K8U_C8U,
    decode: decodeD9I1K8uC8u
  }), Object.freeze({
    format: FORMAT_D9I3_K8U_C8U,
    decode: decodeD9I3K8uC8u
  }), Object.freeze({
    format: FORMAT_D3I1_K32F_C32F,
    decode: decodeD3I1K32fC32f
  }), Object.freeze({
    format: FORMAT_D3I1_K16U_C16U,
    decode: decodeD3I1K16uC16u
  }), Object.freeze({
    format: FORMAT_D3I1_K8U_C8U,
    decode: decodeD3I1K8uC8u
  })]);
  for (var i$1 = 0; i$1 < CURVE_DECODERS.length; i$1++) {
    if (CURVE_DECODERS[i$1].format !== i$1) {
      throw new Error("gr2reader: curve decoder table corrupt at format ".concat(i$1));
    }
  }

  /**
   * Decode a GR2 JSON curve object into explicit knots/controls.
   *
   * @param {CurveJson} curveJson Curve as emitted in GR2 JSON.
   * @param {TransformCurveDimension} dimension Track dimension: position = 3, orientation = 4, scaleShear = 9.
   * @returns {DecodedCurve} Explicit knots and flat control values.
   * @throws {Error} If the curve is missing a numeric format, the format is not
   * supported, or the decoded dimension conflicts with the requested dimension.
   */
  function decodeCurve(curveJson, dimension) {
    if (!curveJson || typeof curveJson.format !== "number") {
      throw new Error("gr2reader: decodeCurve requires a curve object with a numeric format");
    }
    var dec = CURVE_DECODERS[curveJson.format];
    if (!dec) {
      throw new Error("gr2reader: unsupported granny curve format ".concat(curveJson.format));
    }
    var _dec$decode = dec.decode(curveJson, dimension),
      knots = _dec$decode.knots,
      controls = _dec$decode.controls,
      dim = _dec$decode.dimension;
    if (dimension && dim && dim !== dimension) {
      throw new Error("gr2reader: curve format ".concat(curveJson.format, " decoded dimension ").concat(dim, " does not match track dimension ").concat(dimension));
    }
    return {
      knots,
      controls,
      degree: curveJson.degree | 0,
      dimension: dim || dimension
    };
  }

  /**
   * Copy one decoded control point into an output buffer.
   *
   * @param {ArrayLike<number> & { [index: number]: number }} out Mutable output buffer.
   * @param {DecodedCurve} curve Decoded curve.
   * @param {number} index Control point index.
   * @returns {ArrayLike<number>} The same output buffer.
   */
  function copyControl(out, curve, index) {
    var dim = curve.dimension,
      offset = index * dim;
    for (var _i = 0; _i < dim; _i++) {
      out[_i] = curve.controls[offset + _i];
    }
    return out;
  }

  /**
   * Locate the first knot strictly greater than time, matching the existing
   * runtime curve evaluator's step/segment selection.
   *
   * @param {number[]} knots Decoded knot times.
   * @param {number} time Sample time.
   * @returns {number} Knot index.
   */
  function findKnotIndex(knots, time) {
    var low = 0;
    var high = knots.length - 1;
    while (low < high) {
      var mid = low + high >> 1;
      if (knots[mid] > time) high = mid;else low = mid + 1;
    }
    return low;
  }

  /**
   * Sample Carbon's raw keyframed Granny curves (`DaKeyframes32f`).
   *
   * @param {ArrayLike<number> & { [index: number]: number }} out Mutable output buffer.
   * @param {DecodedCurve} curve Decoded curve.
   * @param {number} time Sample time.
   * @param {number} duration Animation duration.
   * @returns {ArrayLike<number>} The same output buffer.
   */
  function sampleKeyframedCurve(out, curve, time, duration) {
    var count = curve.controls.length / curve.dimension;
    var frame = duration > 0 ? Math.trunc(count * time / duration) : 0;
    return copyControl(out, curve, Math.max(0, Math.min(count - 1, frame)));
  }

  /**
   * Sample a decoded degree-one curve.
   *
   * @param {ArrayLike<number> & { [index: number]: number }} out Mutable output buffer.
   * @param {DecodedCurve} curve Decoded curve.
   * @param {number} time Sample time.
   * @param {boolean} cycle Whether the owning track cycles.
   * @param {number} duration Animation duration.
   * @param {number} knot Selected knot index.
   * @returns {ArrayLike<number>} The same output buffer.
   */
  function sampleLinearCurve(out, curve, time, cycle, duration, knot) {
    var knots = curve.knots,
      count = knots.length,
      dim = curve.dimension,
      knot0 = cycle ? (knot + count - 1) % count : knot === 0 ? 0 : knot - 1;
    var start = knots[knot0],
      end = knots[knot],
      localTime = time;
    if (cycle && end < start) {
      end += duration;
    }
    if (cycle && localTime < start) {
      localTime += duration;
    }
    var t = end !== start ? (localTime - start) / (end - start) : 0;
    var p0 = knot0 * dim;
    var p1 = knot * dim;
    for (var _i2 = 0; _i2 < dim; _i2++) {
      out[_i2] = curve.controls[p0 + _i2] * (1 - t) + curve.controls[p1 + _i2] * t;
    }
    return out;
  }

  /**
   * Sample the quadratic decoded curves emitted by modern Granny animation data.
   *
   * @param {ArrayLike<number> & { [index: number]: number }} out Mutable output buffer.
   * @param {DecodedCurve} curve Decoded curve.
   * @param {number} time Sample time.
   * @param {boolean} cycle Whether the owning track cycles.
   * @param {number} duration Animation duration.
   * @param {number} knot Selected knot index.
   * @returns {ArrayLike<number>} The same output buffer.
   */
  function sampleQuadraticCurve(out, curve, time, cycle, duration, knot) {
    var knots = curve.knots,
      count = knots.length,
      dim = curve.dimension,
      k2 = cycle ? (knot + count - 2) % count : knot === 0 ? 0 : Math.max(0, knot - 2),
      k1 = cycle ? (knot + count - 1) % count : knot === 0 ? 0 : knot - 1;
    var ti2 = knots[k2],
      ti1 = knots[k1],
      ti = knots[knot],
      tiNext = knots[(knot + 1) % count],
      localTime = time;
    if (ti2 > ti) {
      ti += duration;
      tiNext += duration;
      localTime += duration;
    }
    if (ti1 > ti) {
      ti += duration;
      tiNext += duration;
      localTime += duration;
    }
    if (tiNext < ti) {
      tiNext += duration;
    }
    var d0 = ti - ti1,
      d1a = ti - ti2,
      d1b = tiNext - ti1,
      l0 = d0 !== 0 ? (localTime - ti1) / d0 : 0,
      l1a = d1a !== 0 ? (localTime - ti2) / d1a : 0,
      l1b = d1b !== 0 ? (localTime - ti1) / d1b : 0;
    var c2 = l1a + l0 - l0 * l1a;
    var ci = l0 * l1b,
      c1 = c2 - ci;
    c2 = 1 - c2;
    var p0 = k2 * dim,
      p1 = k1 * dim,
      p2 = knot * dim;
    for (var _i3 = 0; _i3 < dim; _i3++) {
      out[_i3] = c2 * curve.controls[p0 + _i3] + c1 * curve.controls[p1 + _i3] + ci * curve.controls[p2 + _i3];
    }
    return out;
  }

  /**
   * Sample a decoded Granny curve into a caller-provided output buffer.
   *
   * This works only on decoded `{ knots, controls, degree, dimension }` data.
   * Packed Granny curve parsing remains the responsibility of `decodeCurve`.
   *
   * @param {ArrayLike<number> & { [index: number]: number }} out Mutable output buffer.
   * @param {DecodedCurve} curve Decoded curve.
   * @param {number} time Sample time.
   * @param {boolean} [cycle=false] Whether the owning track cycles.
   * @param {number} [duration=0] Animation duration.
   * @param {{ keyframed?: boolean }} [options] Sampling options.
   * @returns {ArrayLike<number>} The same output buffer.
   */
  function sampleDecodedCurve(out, curve, time) {
    var cycle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var duration = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    if (!curve || !curve.knots || !curve.controls || !curve.dimension) {
      return out;
    }
    var knots = curve.knots,
      count = knots.length,
      dim = curve.dimension,
      controlCount = curve.controls.length / dim;
    if (!count || !controlCount) {
      return out;
    }
    if (options.keyframed) {
      return sampleKeyframedCurve(out, curve, time, duration);
    }
    var knot = findKnotIndex(knots, time);
    if (curve.degree <= 0 || count === 1 || controlCount === 1) {
      return copyControl(out, curve, Math.min(knot, controlCount - 1));
    }
    if (curve.degree === 1) {
      return sampleLinearCurve(out, curve, time, cycle, duration || knots[count - 1], knot);
    }
    return sampleQuadraticCurve(out, curve, time, cycle, duration || knots[count - 1], knot);
  }

  /**
   * Decode the three curves of every transform track of a GR2 JSON object in
   * place. Adds knots, controls and dimension to each curve object; all raw
   * compressed fields are left untouched.
   *
   * @param {object} json GR2 JSON root object to mutate.
   * @returns {object} The same object, for chaining.
   */
  function decompressAnimationCurves(json) {
    for (var anim of json.animations || []) {
      for (var tg of anim.trackGroups || []) {
        for (var tt of tg.transformTracks || []) {
          decorate(tt.orientation, 4);
          decorate(tt.position, 3);
          decorate(tt.scaleShear, 9);
        }
        for (var vt of tg.vectorTracks || []) {
          decorate(vt.valueCurve, vt.dimension | 0);
        }
      }
    }
    return json;
  }

  /**
   * Decode and attach explicit curve data to a transform-track curve object.
   *
   * @param {CurveJson|undefined|null} curve Curve object to decorate in place.
   * @param {TransformCurveDimension} dimension Expected track dimension.
   * @returns {void}
   */
  function decorate(curve, dimension) {
    if (!curve || typeof curve.format !== "number" || curve.error) return;
    var d = decodeCurve(curve, dimension);
    curve.knots = d.knots;
    curve.controls = d.controls;
    curve.dimension = d.dimension;
  }

  /**
   * Frozen convenience namespace for animation-curve decoding helpers.
   *
   * The same constants and functions are also exported directly from curves.js.
   */
  var curves = Object.freeze({
    FORMAT_DA_KEYFRAMES_32F,
    FORMAT_DA_K32F_C32F,
    FORMAT_DA_IDENTITY,
    FORMAT_DA_CONSTANT_32F,
    FORMAT_D3_CONSTANT_32F,
    FORMAT_D4_CONSTANT_32F,
    FORMAT_DA_K16U_C16U,
    FORMAT_DA_K8U_C8U,
    FORMAT_D4N_K16U_C15U,
    FORMAT_D4N_K8U_C7U,
    FORMAT_D3_K16U_C16U,
    FORMAT_D3_K8U_C8U,
    FORMAT_D9I1_K16U_C16U,
    FORMAT_D9I3_K16U_C16U,
    FORMAT_D9I1_K8U_C8U,
    FORMAT_D9I3_K8U_C8U,
    FORMAT_D3I1_K32F_C32F,
    FORMAT_D3I1_K16U_C16U,
    FORMAT_D3I1_K8U_C8U,
    FORMATS: CURVE_FORMATS$1,
    DECODERS: CURVE_DECODERS,
    D4N_SCALE_TABLE,
    D4N_OFFSET_TABLE,
    D4N_SCALE_TABLE_MULTIPLIER_16,
    D4N_SCALE_TABLE_MULTIPLIER_8,
    decode: decodeCurve,
    decodeCurve,
    sample: sampleDecodedCurve,
    sampleDecodedCurve,
    decompress: decompressAnimationCurves,
    decompressAnimationCurves,
    knotScaleFromTrunc,
    knotsFromControls,
    knotsFromControlsTrunc,
    identityControls,
    exactDiv,
    decodeDaKeyframes32f,
    decodeDaK32fC32f,
    decodeDaIdentity,
    decodeDaConstant32f,
    decodeD3Constant32f,
    decodeD4Constant32f,
    decodeDaK,
    decodeDaK16uC16u,
    decodeDaK8uC8u,
    quatFromControl16,
    quatFromControl8,
    decodeD4n,
    decodeD4nK16uC15u,
    decodeD4nK8uC7u,
    decodeD3K,
    decodeD3K16uC16u,
    decodeD3K8uC8u,
    decodeD9I1,
    decodeD9I1K16uC16u,
    decodeD9I1K8uC8u,
    decodeD9I3,
    decodeD9I3K16uC16u,
    decodeD9I3K8uC8u,
    d3I1Controls,
    decodeD3I1K32fC32f,
    decodeD3I1u,
    decodeD3I1K16uC16u,
    decodeD3I1K8uC8u
  });

  // Clean-room BitKnit2 (Granny .gr2 section format 4) codec support.
  //
  // The decoder was written solely from the published format specification
  // (docs/formats/bitknit2.md) by an isolated agent with no access to any other
  // BitKnit implementation, then validated byte-exact against 539 real EVE .gr2
  // streams. The raw-quantum encoder is the direct inverse of the decoder's raw
  // branch and is covered by exact vectors and quantum-boundary tests. Replaced
  // the prior EUPL-derived port on 2026-07-24; see THIRD-PARTY-NOTICES.md.

  var TOTAL = 0x8000;
  var QUANTUM_BYTES = 0x10000;
  var MAGIC = 0x75B1;

  /**
   * Store bytes as a valid BitKnit2 stream made entirely of raw quanta.
   *
   * This supplies Granny format-4 framing without entropy/LZ coding. It is
   * useful for container interoperability, but is deliberately not described as
   * size compression because the magic, quantum markers, and final padding make
   * the result slightly larger than the input.
   *
   * @param {Uint8Array} bytes Raw bytes.
   * @returns {Uint8Array} BitKnit2 raw-quantum stream.
   */
  function encodeBitKnit2Raw(bytes) {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError("BitKnit2 raw encoding requires Uint8Array input");
    }
    if (!bytes.length) return new Uint8Array();
    var quantumCount = Math.ceil(bytes.length / QUANTUM_BYTES);
    var out = new Uint8Array(2 + quantumCount * 2 + bytes.length + (bytes.length & 1));
    out[0] = MAGIC & 0xff;
    out[1] = MAGIC >>> 8;
    var sourceOffset = 0;
    var targetOffset = 2;
    while (sourceOffset < bytes.length) {
      targetOffset += 2; // Zero-filled raw-quantum marker.
      var length = Math.min(QUANTUM_BYTES, bytes.length - sourceOffset);
      out.set(bytes.subarray(sourceOffset, sourceOffset + length), targetOffset);
      sourceOffset += length;
      targetOffset += length;
      if (length & 1) targetOffset++;
    }
    return out;
  }

  // Powers of two as exact doubles, indexed 0..32. All entropy-state values are
  // unsigned 32-bit; floor division by these avoids signed-shift pitfalls.
  var POW2 = new Float64Array(33);
  for (var i = 0; i <= 32; i++) {
    POW2[i] = Math.pow(2, i);
  }

  /**
   * One adaptive frequency model with 15-bit precision (TOTAL = 0x8000).
   * Holds a cumulative table cum[0..V] (cum[V] = TOTAL), per-symbol
   * accumulators, and a 1024-entry lookup table for fast symbol search.
   */
  class FrequencyModel {
    /**
     * @param {number} symbolCount Total symbols V.
     * @param {number} minProbCount Trailing minimum-probability symbols M.
     */
    constructor(symbolCount, minProbCount) {
      var V = symbolCount;
      var E = V - minProbCount;
      var cum = new Uint16Array(V + 1);
      for (var _i = 0; _i < E; _i++) {
        cum[_i] = Math.floor((TOTAL - minProbCount) * _i / E);
      }
      for (var _i2 = E; _i2 <= V; _i2++) {
        cum[_i2] = TOTAL - V + _i2;
      }
      this.symbolCount = V;
      this.cum = cum;
      this.acc = new Uint16Array(V).fill(1);
      this.tick = 0;
      this.inc = Math.floor((TOTAL - V) / 1024);
      this.lastInc = 1 + TOTAL - V - this.inc * 1024;
      this.lookup = new Uint16Array(1024);
      this.rebuildLookup();
    }

    /** Rebuilds lookup used by the current GR2 format reader. */
    rebuildLookup() {
      var cum = this.cum;
      var lookup = this.lookup;
      var s = 0;
      for (var k = 0; k < 1024; k++) {
        var threshold = k * 32;
        while (threshold >= cum[s + 1]) {
          s++;
        }
        lookup[k] = s;
      }
    }

    /**
     * Record one decoded symbol; every 1024th observation folds the
     * accumulators halfway into the cumulative table and resets them.
     * @param {number} sym
     */
    observe(sym) {
      var acc = this.acc;
      acc[sym] += this.inc;
      this.tick = this.tick + 1 & 1023;
      if (this.tick === 0) {
        acc[sym] += this.lastInc;
        var cum = this.cum;
        var V = this.symbolCount;
        var run = 0;
        for (var _i3 = 1; _i3 <= V; _i3++) {
          run += acc[_i3 - 1];
          cum[_i3] += run - cum[_i3] >> 1;
          acc[_i3 - 1] = 1;
        }
        this.rebuildLookup();
      }
    }
  }

  /**
   * Decompress a BitKnit2 stream (Granny .gr2 section format 4).
   *
   * The stream is a sequence of little-endian uint16 words beginning with the
   * magic 0x75B1, producing output in 65,536-byte quanta that are either raw
   * (word-aligned byte copies) or entropy-coded with two interleaved 32-bit
   * range states driving adaptive literal/match commands.
   *
   * @param {Uint8Array} bytes Compressed stream bytes.
   * @param {number} expandedSize Exact decompressed byte length.
   * @returns {Uint8Array} Decompressed output of exactly expandedSize bytes.
   * @throws {Error} On bad magic, word-stream underflow, a match reaching
   *   before output offset 0, or a coded quantum ending with neither entropy
   *   state equal to 0x10000.
   */
  function decompressBitKnit2(bytes, expandedSize) {
    var out = new Uint8Array(expandedSize);
    if (expandedSize === 0) {
      return out;
    }
    var wordCount = bytes.length >>> 1;
    var wordIndex = 0;
    function nextWord() {
      if (wordIndex >= wordCount) {
        throw new Error("BitKnit2: source underflow");
      }
      var p = wordIndex * 2;
      wordIndex++;
      return bytes[p] | bytes[p + 1] << 8;
    }
    if (nextWord() !== MAGIC) {
      throw new Error("BitKnit2: bad magic word");
    }

    // Nine adaptive models, all created at stream start; they persist and
    // keep adapting across quantum boundaries.
    var commandModels = [new FrequencyModel(300, 36), new FrequencyModel(300, 36), new FrequencyModel(300, 36), new FrequencyModel(300, 36)];
    var cacheRefModels = [new FrequencyModel(40, 0), new FrequencyModel(40, 0), new FrequencyModel(40, 0), new FrequencyModel(40, 0)];
    var exponentModel = new FrequencyModel(21, 0);

    // Recent-offset cache: eight entries plus a packed 4-bit-per-rank order
    // word (nibble at bit 4r = slot holding rank r; rank 0 = most recent).
    var recentOffsets = new Float64Array(8).fill(1);
    var recentOrder = 0x76543210;

    // Distance used by literal deltas; replaced by every match distance.
    var deltaOffset = 1;

    // Two interleaved entropy states; swapped after every operation.
    var stateA = 0;
    var stateB = 0;
    function initEntropyStates() {
      var merged = nextWord() * 0x10000 + nextWord();
      var split = merged & 15;
      merged = Math.floor(merged / 16);
      if (merged < 0x10000) {
        merged = merged * 0x10000 + nextWord();
      }
      stateA = split === 0 ? merged : Math.floor(merged / POW2[split]);
      if (stateA < 0x10000) {
        stateA = stateA * 0x10000 + nextWord();
      }
      var modulus = POW2[16 + split];
      stateB = (merged % 0x10000 * 0x10000 + nextWord()) % modulus + modulus;
    }
    function popBits(n) {
      var value = stateA % POW2[n];
      stateA = Math.floor(stateA / POW2[n]);
      if (stateA < 0x10000) {
        stateA = stateA * 0x10000 + nextWord();
      }
      var t = stateA;
      stateA = stateB;
      stateB = t;
      return value;
    }
    function popSymbol(model) {
      var cum = model.cum;
      var code = stateA & TOTAL - 1;
      var sym = model.lookup[code >>> 5];
      while (code >= cum[sym + 1]) {
        sym++;
      }
      stateA = Math.floor(stateA / TOTAL) * (cum[sym + 1] - cum[sym]) + (code - cum[sym]);
      if (stateA < 0x10000) {
        stateA = stateA * 0x10000 + nextWord();
      }
      model.observe(sym);
      var t = stateA;
      stateA = stateB;
      stateB = t;
      return sym;
    }
    var offset = 0;
    while (offset < expandedSize) {
      var quantumEnd = Math.min(expandedSize, offset - offset % QUANTUM_BYTES + QUANTUM_BYTES);
      if (wordIndex >= wordCount) {
        throw new Error("BitKnit2: source underflow");
      }
      var peekPos = wordIndex * 2;
      var peek = bytes[peekPos] | bytes[peekPos + 1] << 8;
      if (peek === 0) {
        // Raw quantum: consume the zero word, then copy bytes straight
        // from the word stream in stream order.
        wordIndex++;
        var remainingWords = wordCount - wordIndex;
        var quantumRemaining = quantumEnd - offset;
        var length = Math.min(remainingWords * 2, quantumRemaining);
        var start = wordIndex * 2;
        out.set(bytes.subarray(start, start + length), offset);
        offset += length;
        // When length is odd, the final word's high byte is NOT consumed
        // and the next quantum begins at that same word.
        wordIndex += length >> 1;
        continue;
      }

      // Coded quantum.
      initEntropyStates();
      if (offset === 0) {
        out[0] = popBits(8);
        offset = 1;
      }
      while (offset < quantumEnd) {
        var phase = offset & 3;
        var command = popSymbol(commandModels[phase]);
        if (command < 256) {
          // Literal: byte delta against the byte one last-match-distance
          // behind.
          out[offset] = command + out[offset - deltaOffset] & 0xFF;
          offset++;
          continue;
        }

        // Match length.
        var copyLength = void 0;
        if (command < 288) {
          copyLength = command - 254;
        } else {
          var n = command - 287;
          copyLength = POW2[n] + popBits(n) + 32;
        }

        // Match distance.
        var ref = popSymbol(cacheRefModels[phase]);
        var copyOffset = void 0;
        if (ref < 8) {
          // Recent-offset cache hit at rank `ref`, then promote to
          // rank 0 (ranks 0..ref-1 shift up one nibble).
          var shift = 4 * ref;
          var slot = recentOrder >>> shift & 15;
          copyOffset = recentOffsets[slot];
          if (ref === 7) {
            recentOrder = (recentOrder << 4 | slot) >>> 0;
          } else if (ref > 0) {
            var mask = (16 << shift) - 1;
            recentOrder = (recentOrder & ~mask | (recentOrder << 4 | slot) & mask) >>> 0;
          }
        } else {
          // Explicit distance: exponent symbol, extra mantissa bits,
          // optionally one raw word appended as the LOW 16 bits.
          var _n = popSymbol(exponentModel);
          var extra = popBits(_n & 15);
          if (_n >= 16) {
            extra = extra * 0x10000 + nextWord();
          }
          copyOffset = 32 * POW2[_n] + extra * 32 + ref - 39;
          // Insert: rank-7 slot takes the rank-6 slot's value, then the
          // rank-6 slot takes the new distance; order is unchanged.
          var slot7 = recentOrder >>> 28 & 15;
          var slot6 = recentOrder >>> 24 & 15;
          recentOffsets[slot7] = recentOffsets[slot6];
          recentOffsets[slot6] = copyOffset;
        }
        deltaOffset = copyOffset;
        var src = offset - copyOffset;
        if (src < 0) {
          throw new Error("BitKnit2: match source before output start");
        }
        // Byte-by-byte ascending copy; self-overlap replicates.
        for (var _i4 = 0; _i4 < copyLength; _i4++) {
          out[offset + _i4] = out[src + _i4];
        }
        offset += copyLength;
      }
      if (stateA !== 0x10000 && stateB !== 0x10000) {
        throw new Error("BitKnit2: corrupt quantum end state");
      }
    }
    return out;
  }

  /**
   * Granny Oodle1 section decompressor.
   *
   * Ported from nwn2mdk gr2_decompress.cpp (Boost licence), derived from
   * berenm/xoreos-tools granny-decoder, and cross-checked against opengr2. The
   * codec uses an adaptive arithmetic coder over a 7-bit-per-byte stream, drives
   * adaptive frequency windows, and emits an LZ token stream. Sections decode in
   * up to three consecutive segments with fresh dictionaries sharing one bitstream.
   */

  /** Large back-reference sizes selected by Oodle1 size codes 61..64. */
  var OODLE1_BACKREF_SIZES = Object.freeze([128, 192, 256, 512]);

  /** Number of bytes occupied by the three Oodle1 parameter blocks. */
  var OODLE1_PARAMETER_BYTES = 36;

  /** Extra bytes appended to the arithmetic stream for decoder lookahead safety. */
  var OODLE1_STREAM_PADDING = 8;

  /** Extra output bytes reserved because final Oodle1 back-references may overshoot. */
  var OODLE1_OUTPUT_SLACK = 512;

  /**
   * Arithmetic decoder for the Oodle1 7-bit-per-byte bitstream.
   */
  class Decoder {
    /**
     * Create an arithmetic decoder over a padded compressed stream.
     *
     * @param {Uint8Array} stream Compressed payload after the parameter header.
     */
    constructor(stream) {
      this.stream = stream;
      this.pos = 0;
      this.numer = stream[0] >> 1;
      this.denom = 0x80;
      this.nextDenom = 0;
    }

    /**
     * Decode a cumulative value in the range [0, max).
     *
     * @param {number} max Exclusive upper bound for the decoded value.
     * @returns {number} Arithmetic-coded cumulative value.
     */
    decode(max) {
      while (this.denom <= 0x800000) {
        this.denom = this.denom << 8 >>> 0;
        this.numer = (this.numer << 8 | this.stream[this.pos] << 7 & 0x80 | this.stream[this.pos + 1] >> 1 & 0x7f) >>> 0;
        this.pos++;
      }
      this.nextDenom = Math.floor(this.denom / max);
      return Math.min(Math.floor(this.numer / this.nextDenom), max - 1);
    }

    /**
     * Commit a decoded range and shrink the arithmetic interval.
     *
     * @param {number} max Original range size.
     * @param {number} val Range start to commit.
     * @param {number} err Range width to commit.
     * @returns {number} The committed value.
     */
    commit(max, val, err) {
      this.numer -= this.nextDenom * val;
      if (val + err < max) this.denom = this.nextDenom * err;else this.denom -= this.nextDenom * val;
      return val;
    }

    /**
     * Decode and immediately commit a single-value range.
     *
     * @param {number} max Exclusive upper bound for the decoded value.
     * @returns {number} Decoded value.
     */
    decodeCommit(max) {
      return this.commit(max, this.decode(max), 1);
    }
  }

  /**
   * Adaptive weighted symbol window used by Oodle1 dictionaries.
   */
  class WeighWindow {
    /**
     * Create an adaptive window for values up to a maximum symbol.
     *
     * @param {number} maxValue Maximum symbol value represented by the window.
     * @param {number} countCap Maximum number of weighted entries to retain.
     */
    constructor(maxValue, countCap) {
      this.weightTotal = 4;
      this.countCap = countCap + 1 & 0xffff;
      this.ranges = [0, 0x4000];
      this.weights = [4];
      this.values = [0];

      /**
       * Reusable result carrier for {@link WeighWindow#tryDecode}, owned by
       * this instance so repeated decode calls don't allocate a fresh object
       * per symbol (the hottest allocation site in this decoder). Safe to
       * reuse across calls: each result is fully consumed (read, and any
       * `storeValue` follow-up applied) before this same instance's next
       * `tryDecode` call, and every `decompressBlock` call site that needs
       * more than one decoded value at once (`d3`/`d4`/`d5`) always reads
       * from three distinct `WeighWindow` instances, never this one twice.
       */
      this.result = {
        newIndex: -1,
        value: 0
      };
      this.threshIncrease = 4;
      this.threshRangeRebuild = 8;
      this.threshWeightRebuild = Math.max(256, Math.min(32 * maxValue, 15160));
      this.threshIncreaseCap = maxValue > 64 ? Math.min(2 * maxValue, (this.threshWeightRebuild >> 1) - 32) : 128;
    }

    /**
     * Recompute arithmetic ranges from the current symbol weights.
     *
     * @returns {void}
     */
    rebuildRanges() {
      var w = this.weights;
      this.ranges.length = w.length + 1;
      var rangeWeight = Math.floor(8 * 0x4000 / this.weightTotal);
      var start = 0;
      for (var i = 0; i < w.length; i++) {
        this.ranges[i] = start;
        start += Math.floor(w[i] * rangeWeight / 8);
      }
      this.ranges[w.length] = 0x4000;
      if (this.threshIncrease > this.threshIncreaseCap >> 1) {
        this.threshRangeRebuild = this.weightTotal + this.threshIncreaseCap;
      } else {
        this.threshIncrease *= 2;
        this.threshRangeRebuild = this.weightTotal + this.threshIncrease;
      }
    }

    /**
     * Decay, compact, and reorder adaptive weights when the table grows stale.
     *
     * @returns {void}
     */
    rebuildWeights() {
      var w = this.weights,
        v = this.values;
      var total = 0;
      for (var i = 0; i < w.length; i++) {
        w[i] >>= 1;
        total += w[i];
      }
      this.weightTotal = total;
      for (var _i = 1; _i < w.length; _i++) {
        while (_i < w.length && w[_i] === 0) {
          w[_i] = w[w.length - 1];
          w.pop();
          v[_i] = v[v.length - 1];
          v.pop();
        }
      }
      if (w.length > 1) {
        var mi = 1,
          mw = 0;
        for (var _i2 = 1; _i2 < w.length; _i2++) {
          if (w[_i2] > mw) {
            mw = w[_i2];
            mi = _i2;
          }
        }
        var l = w.length - 1;
        var _ref = [w[l], w[mi]];
        w[mi] = _ref[0];
        w[l] = _ref[1];
        var _ref2 = [v[l], v[mi]];
        v[mi] = _ref2[0];
        v[l] = _ref2[1];
      }
      if (w.length < this.countCap && w[0] === 0) {
        w[0] = 1;
        this.weightTotal++;
      }
    }

    /**
     * Decode a symbol through this adaptive window.
     *
     * When `newIndex` is non-negative, the caller must decode and store a
     * fresh literal value with {@link WeighWindow#storeValue}. Otherwise `value`
     * is final.
     *
     * @param {Decoder} dec Arithmetic decoder to read from.
     * @returns {{newIndex: number, value: number}} Decoded value or slot requiring a fresh literal.
     */
    tryDecode(dec) {
      if (this.weightTotal >= this.threshRangeRebuild) {
        if (this.threshRangeRebuild >= this.threshWeightRebuild) this.rebuildWeights();
        this.rebuildRanges();
      }
      var value = dec.decode(0x4000),
        r = this.ranges;
      var lo = 0,
        hi = r.length;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if (r[mid] <= value) lo = mid + 1;else hi = mid;
      }
      var index = lo - 1;
      dec.commit(0x4000, r[index], r[index + 1] - r[index]);
      this.weights[index]++;
      this.weightTotal++;
      var result = this.result;
      if (index > 0) {
        result.newIndex = -1;
        result.value = this.values[index];
        return result;
      }
      if (this.weights.length >= this.ranges.length && dec.decodeCommit(2) === 1) {
        var i = this.ranges.length + dec.decodeCommit(this.weights.length - this.ranges.length + 1) - 1;
        this.weights[i] += 2;
        this.weightTotal += 2;
        result.newIndex = -1;
        result.value = this.values[i];
        return result;
      }
      this.values.push(0);
      this.weights.push(2);
      this.weightTotal += 2;
      if (this.weights.length === this.countCap) {
        this.weightTotal -= this.weights[0];
        this.weights[0] = 0;
      }
      result.newIndex = this.values.length - 1;
      result.value = 0;
      return result;
    }

    /**
     * Store a freshly decoded escape value in an adaptive window slot.
     *
     * @param {number} index Slot index returned by {@link WeighWindow#tryDecode}.
     * @param {number} value Value to store.
     * @returns {number} Stored value.
     */
    storeValue(index, value) {
      this.values[index] = value;
      return value;
    }
  }
  var BACKREF_SIZES = OODLE1_BACKREF_SIZES;

  /**
   * Per-segment Oodle1 dictionary and adaptive symbol windows.
   */
  class Dictionary {
    /**
     * Create a dictionary from one decoded Oodle1 parameter block.
     *
     * @param {{decodedValueMax: number, backrefValueMax: number, decodedCount: number, highbitCount: number, sizesCount: number[]}} p Parameter block.
     */
    constructor(p) {
      this.decodedSize = 0;
      this.backrefSize = 0;
      this.decodedValueMax = p.decodedValueMax;
      this.backrefValueMax = p.backrefValueMax;
      this.lowbitValueMax = Math.min(p.backrefValueMax + 1, 4);
      this.midbitValueMax = Math.min(Math.floor(p.backrefValueMax / 4) + 1, 256);
      this.highbitValueMax = Math.floor(p.backrefValueMax / 1024) + 1;
      this.lowbitWindow = new WeighWindow(this.lowbitValueMax - 1, this.lowbitValueMax);
      this.highbitWindow = new WeighWindow(this.highbitValueMax - 1, p.highbitCount + 1);
      this.midbitWindows = [];
      for (var i = 0; i < this.highbitValueMax; i++) {
        this.midbitWindows.push(new WeighWindow(this.midbitValueMax - 1, this.midbitValueMax));
      }
      this.decodedWindows = [];
      for (var _i3 = 0; _i3 < 4; _i3++) {
        this.decodedWindows.push(new WeighWindow(this.decodedValueMax - 1, p.decodedCount));
      }
      this.sizeWindows = [];
      for (var _i4 = 0; _i4 < 4; _i4++) {
        for (var j = 0; j < 16; j++) {
          this.sizeWindows.push(new WeighWindow(64, p.sizesCount[3 - _i4]));
        }
      }
      this.sizeWindows.push(new WeighWindow(64, p.sizesCount[0]));
    }

    /**
     * Decode one literal or back-reference block into the output buffer.
     *
     * Back-references use byte-by-byte overlapping copies so offsets smaller than
     * the copy length behave like the original LZ stream.
     *
     * @param {Decoder} dec Arithmetic decoder shared across all segments.
     * @param {Uint8Array} out Output buffer with slack for overshoot copies.
     * @param {number} pos Current output write offset.
     * @returns {number} Number of bytes produced.
     */
    decompressBlock(dec, out, pos) {
      var sw = this.sizeWindows[this.backrefSize];
      var d1 = sw.tryDecode(dec);
      if (d1.newIndex >= 0) d1.value = sw.storeValue(d1.newIndex, dec.decodeCommit(65));
      this.backrefSize = d1.value;
      if (this.backrefSize > 0) {
        var size = this.backrefSize < 61 ? this.backrefSize + 1 : BACKREF_SIZES[this.backrefSize - 61],
          range = Math.min(this.backrefValueMax, this.decodedSize);
        var d3 = this.lowbitWindow.tryDecode(dec);
        if (d3.newIndex >= 0) d3.value = this.lowbitWindow.storeValue(d3.newIndex, dec.decodeCommit(this.lowbitValueMax));
        var d4 = this.highbitWindow.tryDecode(dec);
        if (d4.newIndex >= 0) d4.value = this.highbitWindow.storeValue(d4.newIndex, dec.decodeCommit(Math.floor(range / 1024) + 1));
        var mw = this.midbitWindows[d4.value];
        var d5 = mw.tryDecode(dec);
        if (d5.newIndex >= 0) d5.value = mw.storeValue(d5.newIndex, dec.decodeCommit(Math.min(Math.floor(range / 4) + 1, 256)));
        var offset = (d4.value << 10) + (d5.value << 2) + d3.value + 1;
        this.decodedSize += size;
        var src = pos - offset;
        for (var i = 0; i < size; i++) {
          out[pos + i] = out[src + i];
        }
        return size;
      } else {
        var dw = this.decodedWindows[pos & 3];
        var d2 = dw.tryDecode(dec);
        if (d2.newIndex >= 0) d2.value = dw.storeValue(d2.newIndex, dec.decodeCommit(this.decodedValueMax));
        out[pos] = d2.value & 0xff;
        this.decodedSize++;
        return 1;
      }
    }
  }

  /**
   * Read the three Oodle1 parameter blocks from the compressed section header.
   *
   * Each block is a 12-byte little-endian C bitfield record.
   *
   * @param {Uint8Array} bytes Compressed Oodle1 section bytes.
   * @returns {{decodedValueMax: number, backrefValueMax: number, decodedCount: number, highbitCount: number, sizesCount: number[]}[]} Parsed parameter blocks.
   */
  function readOodle1Parameters(bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      params = [];
    for (var i = 0; i < 3; i++) {
      var b = i * 12,
        a = dv.getUint32(b, true),
        c = dv.getUint32(b + 4, true);
      params.push({
        decodedValueMax: a & 0x1ff,
        backrefValueMax: a >>> 9,
        decodedCount: c & 0x1ff,
        highbitCount: c >>> 19 & 0x1fff,
        sizesCount: [bytes[b + 8], bytes[b + 9], bytes[b + 10], bytes[b + 11]]
      });
    }
    return params;
  }

  /**
   * Decompress a Granny Oodle1 (section format 2) block.
   *
   * The compressed stream is padded so the arithmetic decoder's one-byte lookahead
   * never reads out of bounds. Output is allocated with slack because a final
   * back-reference may overshoot before the returned view is trimmed.
   *
   * @param {Uint8Array} bytes Compressed section bytes.
   * @param {number} expandedSize Decompressed byte length.
   * @param {{first16:number, first8:number}} stops Segment stop offsets from the section directory.
   * @returns {Uint8Array} Exactly `expandedSize` bytes.
   */
  function decompressOodle1(bytes, expandedSize, _ref3) {
    var first16 = _ref3.first16,
      first8 = _ref3.first8;
    var out = new Uint8Array(expandedSize + OODLE1_OUTPUT_SLACK);
    if (bytes.length === 0 || expandedSize === 0) return out.subarray(0, expandedSize);
    if (bytes.length < OODLE1_PARAMETER_BYTES) throw new Error("Oodle1 block too small for parameter header");
    var params = readOodle1Parameters(bytes);
    var stream = new Uint8Array(bytes.length - OODLE1_PARAMETER_BYTES + OODLE1_STREAM_PADDING);
    stream.set(bytes.subarray(OODLE1_PARAMETER_BYTES));
    var dec = new Decoder(stream);
    var steps = [first16, first8, expandedSize];
    var pos = 0;
    for (var s = 0; s < 3; s++) {
      var dict = new Dictionary(params[s]);
      while (pos < steps[s]) pos += dict.decompressBlock(dec, out, pos);
    }
    return expandedSize === out.length ? out : out.subarray(0, expandedSize);
  }

  /**
   * Low-level pure-JavaScript Granny .gr2 reader.
   *
   * The reader walks Granny's embedded reflection type tree, applies pointer
   * fixups, decompresses sections through {@link decompressGr2Section}, and
   * reconstructs a shared object graph.
   */

  /**
   * Granny member type ids used by the reflected type tree.
   *
   * These values mirror the granny_member_type enum and are exposed for callers
   * that need to inspect raw type metadata.
   */
  var GRANNY_MEMBER_TYPES = Object.freeze({
    End: 0,
    Inline: 1,
    Reference: 2,
    ReferenceToArray: 3,
    ArrayOfReferences: 4,
    VariantReference: 5,
    UnsupportedRemove: 6,
    ReferenceToVariantArray: 7,
    String: 8,
    Transform: 9,
    Real32: 10,
    Int8: 11,
    UInt8: 12,
    BinormalInt8: 13,
    NormalUInt8: 14,
    Int16: 15,
    UInt16: 16,
    BinormalInt16: 17,
    NormalUInt16: 18,
    Int32: 19,
    UInt32: 20,
    Real16: 21,
    EmptyReference: 22
  });
  var M$1 = GRANNY_MEMBER_TYPES;
  /** Size in bytes of a reflected Granny transform member. */
  var GRANNY_TRANSFORM_SIZE = 68;
  var TRANSFORM_SIZE = GRANNY_TRANSFORM_SIZE;

  /**
   * Known GR2 file magic values mapped to their pointer size in bytes.
   *
   * The reader currently supports little-endian 32-bit and 64-bit Granny files.
   */
  var GR2_MAGICS = Object.freeze({
    "29de6cc0baa4532b25f5b7a5f666e2ee": 4,
    "e59b495e6f631f141e13eba990beedc4": 8
  });
  var MAGICS = GR2_MAGICS;
  var HEX_BYTES = Array.from({
    length: 256
  }, (_, value) => value.toString(16).padStart(2, "0"));
  var UTF8_DECODER = new TextDecoder("utf-8");
  // Valid GState graphs in the pinned EVE corpus reach 210 unique reflected
  // objects along one path. Keep a substantially higher finite guard so malformed
  // input cannot exhaust the JavaScript stack while legitimate SDK-readable
  // state resources remain readable.
  var MAX_OBJECT_GRAPH_DEPTH = 512;

  /**
   * Convert bytes to a lowercase hexadecimal string without relying on Node's Buffer.
   *
   * @param {Uint8Array} bytes Source bytes.
   * @returns {string} Two hexadecimal characters per byte.
   */
  function bytesToHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) out += HEX_BYTES[bytes[i]];
    return out;
  }

  /**
   * Decode UTF-8 bytes using the browser and Node standard Encoding API.
   *
   * @param {Uint8Array} bytes UTF-8 encoded bytes.
   * @returns {string} Decoded text.
   */
  function decodeUtf8(bytes) {
    return UTF8_DECODER.decode(bytes);
  }

  /**
   * Convert an IEEE 754 binary16 value to a JavaScript number.
   *
   * @param {number} h Unsigned 16-bit half-float bits.
   * @returns {number} Decoded floating-point value.
   */
  function half2float(h) {
    var s = (h & 0x8000) >> 15,
      e = (h & 0x7c00) >> 10,
      f = h & 0x03ff;
    if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
    if (e === 0x1f) return f ? NaN : s ? -Infinity : Infinity;
    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
  }

  /** Compression format id for uncompressed GR2 sections. */
  var GR2_COMPRESSION_NONE = 0;

  /** Compression format id for legacy Granny Oodle0 sections. */
  var GR2_COMPRESSION_OODLE0 = 1;

  /** Compression format id for legacy Granny Oodle1 sections. */
  var GR2_COMPRESSION_OODLE1 = 2;

  /** Compression format id for Granny BitKnit2 sections. */
  var GR2_COMPRESSION_BITKNIT2 = 4;

  /**
   * Decompress one GR2 section payload according to its section-directory format.
   *
   * @param {number} format Section compression format id.
   * @param {Uint8Array} bytes Compressed section payload.
   * @param {number} expandedSize Expected decompressed byte length.
   * @param {{first16: number, first8: number}} sec Section metadata used by Oodle1 streams.
   * @returns {Uint8Array} Raw section bytes, decompressed when needed.
   * @throws {Error} If the format is not supported or the codec rejects the stream.
   */
  function decompressGr2Section(format, bytes, expandedSize, sec) {
    if (format === GR2_COMPRESSION_NONE) return bytes;
    if (format === GR2_COMPRESSION_OODLE0 || format === GR2_COMPRESSION_OODLE1) return decompressOodle1(bytes, expandedSize, {
      first16: sec.first16,
      first8: sec.first8
    });
    if (format === GR2_COMPRESSION_BITKNIT2) return decompressBitKnit2(bytes, expandedSize);
    throw new Error("section needs codec: format ".concat(format, " (0=None,2=Oodle1,4=BitKnit2)"));
  }

  /**
   * Reflected Granny file graph produced by the low-level reader.
   *
   * @typedef {object} RawGr2ReadResult
   * @property {number} version Granny file format revision from the file header.
   * @property {number} secCount Number of sections in the source file.
   * @property {object} fileInfo Reflected `granny_file_info` object graph with
   * references resolved to shared JavaScript objects.
   */

  /**
   * Parse raw `.gr2` bytes into the reflected Granny object graph.
   *
   * This is the low-level reader used by the package entry point. It decompresses
   * sections, applies pointer fixups, walks the embedded type tree, and preserves
   * pointer identity for repeated references in the resulting object graph.
   *
   * @param {Uint8Array|Buffer} buf Raw `.gr2` file bytes.
   * @returns {RawGr2ReadResult} Parsed Granny file metadata and object graph.
   * @throws {Error} If the file magic, compression format, or reflected graph is
   * unsupported or malformed.
   */
  function readGr2Raw(buf) {
    var dv0 = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    /**
     * Read a little-endian uint32 from the original file bytes.
     *
     * @param {number} o Byte offset in the file buffer.
     * @returns {number} Unsigned 32-bit integer.
     */
    var fu32 = o => dv0.getUint32(o, true),
      magic = bytesToHex(buf.subarray(0, 16)),
      P = MAGICS[magic];
    if (!P) throw new Error("unknown gr2 magic " + magic);
    var MEMBER_DEF_SIZE = 20 + 3 * P,
      H = 32,
      version = fu32(H),
      secBase = H + fu32(H + 12),
      secCount = fu32(H + 16),
      rootTypeSec = fu32(H + 20),
      rootTypeOff = fu32(H + 24),
      rootObjSec = fu32(H + 28),
      rootObjOff = fu32(H + 32);
    var secs = [];
    for (var i = 0; i < secCount; i++) {
      var b = secBase + i * 44;
      secs.push({
        format: fu32(b),
        dataOffset: fu32(b + 4),
        dataSize: fu32(b + 8),
        expandedSize: fu32(b + 12),
        first16: fu32(b + 20),
        first8: fu32(b + 24),
        pFixOff: fu32(b + 28),
        pFixCnt: fu32(b + 32)
      });
    }
    var sectionBase = new Array(secCount);
    var total = 0;
    var datas = secs.map(s => {
      var raw = buf.subarray(s.dataOffset, s.dataOffset + s.dataSize);
      return decompressGr2Section(s.format, raw, s.expandedSize, s);
    });
    for (var _i = 0; _i < secCount; _i++) {
      sectionBase[_i] = total;
      total += secs[_i].expandedSize;
    }
    var mem = new Uint8Array(total);
    for (var _i2 = 0; _i2 < secCount; _i2++) {
      mem.set(datas[_i2], sectionBase[_i2]);
    }
    var dv = new DataView(mem.buffer);

    /**
     * Read a little-endian uint32 from the relocated section memory.
     *
     * @param {number} o Byte offset in relocated section memory.
     * @returns {number} Unsigned 32-bit integer.
     */
    var u32 = o => dv.getUint32(o, true);

    /**
     * Read a little-endian int32 from the relocated section memory.
     *
     * @param {number} o Byte offset in relocated section memory.
     * @returns {number} Signed 32-bit integer.
     */
    var i32 = o => dv.getInt32(o, true);

    /**
     * Read a little-endian float32 from the relocated section memory.
     *
     * @param {number} o Byte offset in relocated section memory.
     * @returns {number} Float32 value widened to a JavaScript number.
     */
    var f32 = o => dv.getFloat32(o, true);
    var reloc = new Map();
    for (var _i3 = 0; _i3 < secCount; _i3++) {
      var s = secs[_i3];
      if (s.pFixCnt === 0) continue;
      var rel = void 0;
      if (s.format === 4) {
        var csz = fu32(s.pFixOff);
        rel = decompressBitKnit2(buf.subarray(s.pFixOff + 4, s.pFixOff + 4 + csz), s.pFixCnt * 12);
      } else {
        rel = buf.subarray(s.pFixOff, s.pFixOff + s.pFixCnt * 12);
      }
      var rdv = new DataView(rel.buffer, rel.byteOffset, rel.byteLength);
      for (var k = 0; k < s.pFixCnt; k++) {
        var _b = k * 12,
          from = rdv.getUint32(_b, true),
          toSec = rdv.getUint32(_b + 4, true),
          toOff = rdv.getUint32(_b + 8, true);
        reloc.set(sectionBase[_i3] + from, sectionBase[toSec] + toOff);
      }
    }
    var NULL = -1;

    /**
     * Resolve a relocated pointer field from a global section-memory offset.
     *
     * @param {number} g Global offset of the pointer field.
     * @returns {number} Global target offset, or the null sentinel when absent.
     */
    var ptr = g => reloc.has(g) ? reloc.get(g) : NULL;

    /**
     * Read a null-terminated UTF-8 string from relocated section memory.
     *
     * @param {number} g Global string offset, or the null sentinel.
     * @returns {string|null} Decoded string, or null for absent references.
     */
    function readString(g) {
      if (g < 0) return null;
      var end = g;
      while (end < mem.length && mem[end] !== 0) end++;
      return decodeUtf8(mem.subarray(g, end));
    }
    var typeCache = new Map();

    /**
     * Read and cache a reflected Granny type definition.
     *
     * @param {number} g Global offset of the first member definition.
     * @returns {{type: number, name: string|null, refType: number, arrayWidth: number}[]} Member descriptors.
     */
    function readType(g) {
      if (typeCache.has(g)) return typeCache.get(g);
      var members = [];
      var t = g;
      while (true) {
        var type = u32(t);
        if (type === M$1.End) break;
        members.push({
          type,
          name: readString(ptr(t + 4)),
          refType: ptr(t + 4 + P),
          arrayWidth: i32(t + 4 + 2 * P)
        });
        t += MEMBER_DEF_SIZE;
        if (members.length > 4096) throw new Error("type member overflow");
      }
      typeCache.set(g, members);
      return members;
    }
    var sizeCache = new Map();

    /**
     * Compute the byte size of an object for a reflected Granny type.
     *
     * @param {number} typeOff Global type-definition offset.
     * @returns {number} Object size in bytes.
     */
    function objectSize(typeOff) {
      if (sizeCache.has(typeOff)) return sizeCache.get(typeOff);
      sizeCache.set(typeOff, 0);
      var sz = 0;
      for (var m of readType(typeOff)) {
        sz += memberSize(m);
      }
      sizeCache.set(typeOff, sz);
      return sz;
    }

    /**
     * Compute the byte width of one reflected member.
     *
     * @param {{type: number, refType: number, arrayWidth: number}} m Member descriptor.
     * @returns {number} Member size in bytes.
     */
    function memberSize(m) {
      var w = m.arrayWidth > 0 ? m.arrayWidth : 1;
      switch (m.type) {
        case M$1.Inline:
          return objectSize(m.refType) * w;
        case M$1.Reference:
        case M$1.String:
          return P;
        case M$1.EmptyReference:
          return 4;
        case M$1.ReferenceToArray:
        case M$1.ArrayOfReferences:
          return 4 + P;
        case M$1.VariantReference:
          return 2 * P;
        case M$1.ReferenceToVariantArray:
          return 2 * P + 4;
        case M$1.Transform:
          return TRANSFORM_SIZE;
        case M$1.Real32:
        case M$1.Int32:
        case M$1.UInt32:
          return 4 * w;
        case M$1.Int16:
        case M$1.UInt16:
        case M$1.BinormalInt16:
        case M$1.NormalUInt16:
        case M$1.Real16:
          return 2 * w;
        case M$1.Int8:
        case M$1.UInt8:
        case M$1.BinormalInt8:
        case M$1.NormalUInt8:
          return 1 * w;
        default:
          return 0;
      }
    }
    var layoutCache = new Map();

    /**
     * Compute and cache the fixed per-member byte layout of a reflected type.
     *
     * Granny types are static structural definitions, so every instance of a
     * given type has an identical member layout; this only needs to run once
     * per type instead of once per object instance (as recomputing offsets
     * with {@link memberSize} inside {@link readObject} would).
     *
     * @param {number} typeOff Global type-definition offset.
     * @returns {{members: object[], offsets: number[]}} Cached member list and
     * each member's byte offset relative to the start of the object.
     */
    function typeLayout(typeOff) {
      if (layoutCache.has(typeOff)) return layoutCache.get(typeOff);
      var members = readType(typeOff),
        offsets = new Array(members.length);
      var size = 0;
      for (var _i4 = 0; _i4 < members.length; _i4++) {
        offsets[_i4] = size;
        size += memberSize(members[_i4]);
      }
      var layout = {
        members,
        offsets
      };
      layoutCache.set(typeOff, layout);
      return layout;
    }

    /**
     * Byte stride between consecutive elements of a fixed-width numeric member type.
     *
     * @param {number} type Granny member type id.
     * @returns {number} Element stride in bytes.
     */
    function numericStride(type) {
      switch (type) {
        case M$1.Real32:
        case M$1.Int32:
        case M$1.UInt32:
          return 4;
        case M$1.Int16:
        case M$1.UInt16:
        case M$1.BinormalInt16:
        case M$1.NormalUInt16:
        case M$1.Real16:
          return 2;
        default:
          // Int8, UInt8, BinormalInt8, NormalUInt8
          return 1;
      }
    }

    /**
     * Read one fixed-width numeric value from relocated memory.
     *
     * @param {number} type Granny member type id.
     * @param {number} o Global byte offset of the value.
     * @returns {number} Decoded value.
     */
    function numericAt(type, o) {
      switch (type) {
        case M$1.Real32:
          return f32(o);
        case M$1.Int32:
          return i32(o);
        case M$1.UInt32:
          return u32(o);
        case M$1.Int16:
        case M$1.BinormalInt16:
          return dv.getInt16(o, true);
        case M$1.UInt16:
        case M$1.NormalUInt16:
          return dv.getUint16(o, true);
        case M$1.Real16:
          return half2float(dv.getUint16(o, true));
        case M$1.Int8:
        case M$1.BinormalInt8:
          return dv.getInt8(o);
        case M$1.UInt8:
        case M$1.NormalUInt8:
          return mem[o];
      }
    }

    /**
     * Read a scalar or fixed-width numeric member from relocated memory.
     *
     * @param {{type: number, arrayWidth: number}} m Numeric member descriptor.
     * @param {number} off Global offset of the numeric field.
     * @returns {number|number[]} Decoded scalar or array.
     */
    function numeric(m, off) {
      var w = m.arrayWidth > 0 ? m.arrayWidth : 1;
      if (w === 1) return numericAt(m.type, off);
      var stride = numericStride(m.type),
        out = new Array(w);
      for (var _i5 = 0; _i5 < w; _i5++) {
        out[_i5] = numericAt(m.type, off + _i5 * stride);
      }
      return out;
    }

    /**
     * Read a Granny transform struct from relocated memory.
     *
     * @param {number} o Global offset of the transform bytes.
     * @returns {{flags: number, position: number[], orientation: number[], scaleShear: number[]}} Decoded transform.
     */
    function readTransform(o) {
      return {
        flags: u32(o),
        position: [f32(o + 4), f32(o + 8), f32(o + 12)],
        orientation: [f32(o + 16), f32(o + 20), f32(o + 24), f32(o + 28)],
        scaleShear: [f32(o + 32), f32(o + 36), f32(o + 40), f32(o + 44), f32(o + 48), f32(o + 52), f32(o + 56), f32(o + 60), f32(o + 64)]
      };
    }
    var depth = 0;
    var objCache = new Map(); // typeOff -> Map<objOff, object>

    /**
     * Read a reflected object graph node, preserving pointer identity and cycles.
     *
     * @param {number} typeOff Global type-definition offset.
     * @param {number} objOff Global object-data offset.
     * @returns {object|null} Decoded object, or null for absent references.
     */
    function readObject(typeOff, objOff) {
      if (typeOff < 0 || objOff < 0) return null;
      var byOff = objCache.get(typeOff);
      if (byOff === undefined) {
        byOff = new Map();
        objCache.set(typeOff, byOff);
      } else {
        var cached = byOff.get(objOff);
        if (cached !== undefined) return cached;
      }
      if (++depth > MAX_OBJECT_GRAPH_DEPTH) {
        depth--;
        throw new Error("recursion too deep");
      }
      var obj = {};
      byOff.set(objOff, obj);
      var _typeLayout = typeLayout(typeOff),
        members = _typeLayout.members,
        offsets = _typeLayout.offsets;
      for (var idx = 0; idx < members.length; idx++) {
        var m = members[idx],
          field = objOff + offsets[idx];
        var name = m.name || "_";
        if (Object.prototype.hasOwnProperty.call(obj, name)) {
          var n = 2;
          while (Object.prototype.hasOwnProperty.call(obj, name + " " + n)) n++;
          name = name + " " + n;
        }
        switch (m.type) {
          case M$1.String:
            obj[name] = readString(ptr(field));
            break;
          case M$1.Reference:
            obj[name] = readObject(m.refType, ptr(field));
            break;
          case M$1.Transform:
            obj[name] = readTransform(field);
            break;
          case M$1.Inline:
            {
              var w = m.arrayWidth > 0 ? m.arrayWidth : 1,
                os = objectSize(m.refType);
              if (m.arrayWidth > 1) {
                obj[name] = [];
                for (var _i6 = 0; _i6 < w; _i6++) {
                  obj[name].push(readObject(m.refType, field + _i6 * os));
                }
              } else {
                obj[name] = readObject(m.refType, field);
              }
              break;
            }
          case M$1.ReferenceToArray:
            {
              var count = i32(field),
                p = ptr(field + 4),
                _os = objectSize(m.refType),
                a = [];
              for (var _i7 = 0; _i7 < count; _i7++) {
                a.push(readObject(m.refType, p + _i7 * _os));
              }
              obj[name] = a;
              break;
            }
          case M$1.ArrayOfReferences:
            {
              var _count = i32(field),
                _p = ptr(field + 4),
                _a = [];
              for (var _i8 = 0; _i8 < _count; _i8++) {
                _a.push(readObject(m.refType, ptr(_p + _i8 * P)));
              }
              obj[name] = _a;
              break;
            }
          case M$1.VariantReference:
            obj[name] = readObject(ptr(field), ptr(field + P));
            break;
          case M$1.ReferenceToVariantArray:
            {
              var vt = ptr(field),
                _count2 = i32(field + P),
                _p2 = ptr(field + P + 4),
                _a2 = [],
                _os2 = vt >= 0 ? objectSize(vt) : 0;
              for (var _i9 = 0; _i9 < _count2; _i9++) {
                _a2.push(readObject(vt, _p2 + _i9 * _os2));
              }
              if (vt >= 0) Object.defineProperty(_a2, "__type", {
                value: readType(vt),
                enumerable: false
              });
              obj[name] = _a2;
              break;
            }
          case M$1.Real32:
          case M$1.Int8:
          case M$1.UInt8:
          case M$1.BinormalInt8:
          case M$1.NormalUInt8:
          case M$1.Int16:
          case M$1.UInt16:
          case M$1.BinormalInt16:
          case M$1.NormalUInt16:
          case M$1.Int32:
          case M$1.UInt32:
          case M$1.Real16:
            obj[name] = numeric(m, field);
            break;
          default:
            obj[name] = null;
        }
      }
      depth--;
      return obj;
    }
    var rootTypeG = sectionBase[rootTypeSec] + rootTypeOff,
      rootObjG = sectionBase[rootObjSec] + rootObjOff,
      fileInfo = readObject(rootTypeG, rootObjG);
    return {
      version,
      secCount,
      fileInfo
    };
  }

  /**
   * Common utilities
   * @module glMatrix
   */

  // Configuration Constants
  var EPSILON$1 = 0.000001;
  var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
  var RANDOM = Math.random;

  /**
   * Symmetric round
   * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
   *
   * @param {Number} a value to round
   */
  function round$1(a) {
    if (a >= 0) return Math.round(a);
    return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
  }

  /**
   * 3 Dimensional Vector
   * @module vec3
   */

  /**
   * Creates a new, empty vec3
   *
   * @returns {vec3} a new 3D vector
   */
  function create$1() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }

  /**
   * Creates a new vec3 initialized with values from an existing vector
   *
   * @param {ReadonlyVec3} a vector to clone
   * @returns {vec3} a new 3D vector
   */
  function clone(a) {
    var out = new ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }

  /**
   * Calculates the length of a vec3
   *
   * @param {ReadonlyVec3} a vector to calculate length of
   * @returns {Number} length of a
   */
  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Creates a new vec3 initialized with the given values
   *
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} a new 3D vector
   */
  function fromValues(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }

  /**
   * Copy the values from one vec3 to another
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the source vector
   * @returns {vec3} out
   */
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }

  /**
   * Set the components of a vec3 to the given values
   *
   * @param {vec3} out the receiving vector
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} out
   */
  function set(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }

  /**
   * Adds two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }

  /**
   * Subtracts vector b from vector a
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }

  /**
   * Multiplies two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }

  /**
   * Divides two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }

  /**
   * Math.ceil the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to ceil
   * @returns {vec3} out
   */
  function ceil(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
  }

  /**
   * Math.floor the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to floor
   * @returns {vec3} out
   */
  function floor(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
  }

  /**
   * Returns the minimum of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
  }

  /**
   * Returns the maximum of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
  }

  /**
   * symmetric round the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to round
   * @returns {vec3} out
   */
  function round(out, a) {
    out[0] = round$1(a[0]);
    out[1] = round$1(a[1]);
    out[2] = round$1(a[2]);
    return out;
  }

  /**
   * Scales a vec3 by a scalar number
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to scale
   * @param {Number} b amount to scale the vector by
   * @returns {vec3} out
   */
  function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }

  /**
   * Adds two vec3's after scaling the second operand by a scalar value
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @param {Number} scale the amount to scale b by before adding
   * @returns {vec3} out
   */
  function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    return out;
  }

  /**
   * Calculates the euclidian distance between two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} distance between a and b
   */
  function distance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Calculates the squared euclidian distance between two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} squared distance between a and b
   */
  function squaredDistance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return x * x + y * y + z * z;
  }

  /**
   * Calculates the squared length of a vec3
   *
   * @param {ReadonlyVec3} a vector to calculate squared length of
   * @returns {Number} squared length of a
   */
  function squaredLength(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return x * x + y * y + z * z;
  }

  /**
   * Negates the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to negate
   * @returns {vec3} out
   */
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }

  /**
   * Returns the inverse of the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to invert
   * @returns {vec3} out
   */
  function inverse(out, a) {
    out[0] = 1.0 / a[0];
    out[1] = 1.0 / a[1];
    out[2] = 1.0 / a[2];
    return out;
  }

  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to normalize
   * @returns {vec3} out
   */
  function normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len = x * x + y * y + z * z;
    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }

  /**
   * Calculates the dot product of two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} dot product of a and b
   */
  function dot$1(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */
  function cross$2(out, a, b) {
    var ax = a[0],
      ay = a[1],
      az = a[2];
    var bx = b[0],
      by = b[1],
      bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }

  /**
   * Performs a linear interpolation between two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {vec3} out
   */
  function lerp(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }

  /**
   * Performs a spherical linear interpolation between two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {vec3} out
   */
  function slerp(out, a, b, t) {
    var angle = Math.acos(Math.min(Math.max(dot$1(a, b), -1), 1));
    var sinTotal = Math.sin(angle);
    var ratioA = Math.sin((1 - t) * angle) / sinTotal;
    var ratioB = Math.sin(t * angle) / sinTotal;
    out[0] = ratioA * a[0] + ratioB * b[0];
    out[1] = ratioA * a[1] + ratioB * b[1];
    out[2] = ratioA * a[2] + ratioB * b[2];
    return out;
  }

  /**
   * Performs a hermite interpolation with two control points
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @param {ReadonlyVec3} c the third operand
   * @param {ReadonlyVec3} d the fourth operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {vec3} out
   */
  function hermite(out, a, b, c, d, t) {
    var factorTimes2 = t * t;
    var factor1 = factorTimes2 * (2 * t - 3) + 1;
    var factor2 = factorTimes2 * (t - 2) + t;
    var factor3 = factorTimes2 * (t - 1);
    var factor4 = factorTimes2 * (3 - 2 * t);
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }

  /**
   * Performs a bezier interpolation with two control points
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @param {ReadonlyVec3} c the third operand
   * @param {ReadonlyVec3} d the fourth operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {vec3} out
   */
  function bezier(out, a, b, c, d, t) {
    var inverseFactor = 1 - t;
    var inverseFactorTimesTwo = inverseFactor * inverseFactor;
    var factorTimes2 = t * t;
    var factor1 = inverseFactorTimesTwo * inverseFactor;
    var factor2 = 3 * t * inverseFactorTimesTwo;
    var factor3 = 3 * factorTimes2 * inverseFactor;
    var factor4 = factorTimes2 * t;
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }

  /**
   * Generates a random vector with the given scale
   *
   * @param {vec3} out the receiving vector
   * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
   * @returns {vec3} out
   */
  function random(out, scale) {
    scale = scale === undefined ? 1.0 : scale;
    var r = RANDOM() * 2.0 * Math.PI;
    var z = RANDOM() * 2.0 - 1.0;
    var zScale = Math.sqrt(1.0 - z * z) * scale;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
  }

  /**
   * Transforms the vec3 with a mat4.
   * 4th vector component is implicitly '1'
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to transform
   * @param {ReadonlyMat4} m matrix to transform with
   * @returns {vec3} out
   */
  function transformMat4$1(out, a, m) {
    var x = a[0],
      y = a[1],
      z = a[2];
    var w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }

  /**
   * Transforms the vec3 with a mat3.
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to transform
   * @param {ReadonlyMat3} m the 3x3 matrix to transform with
   * @returns {vec3} out
   */
  function transformMat3(out, a, m) {
    var x = a[0],
      y = a[1],
      z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }

  /**
   * Transforms the vec3 with a quat
   * Can also be used for dual quaternions. (Multiply it with the real part)
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to transform
   * @param {ReadonlyQuat} q normalized quaternion to transform with
   * @returns {vec3} out
   */
  function transformQuat(out, a, q) {
    // Fast Vector Rotation using Quaternions by Robert Eisele
    // https://raw.org/proof/vector-rotation-using-quaternions/

    var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
    var vx = a[0],
      vy = a[1],
      vz = a[2];

    // t = q x v
    var tx = qy * vz - qz * vy;
    var ty = qz * vx - qx * vz;
    var tz = qx * vy - qy * vx;

    // t = 2t
    tx = tx + tx;
    ty = ty + ty;
    tz = tz + tz;

    // v + w t + q x t
    out[0] = vx + qw * tx + qy * tz - qz * ty;
    out[1] = vy + qw * ty + qz * tx - qx * tz;
    out[2] = vz + qw * tz + qx * ty - qy * tx;
    return out;
  }

  /**
   * Rotate a 3D vector around the x-axis
   * @param {vec3} out The receiving vec3
   * @param {ReadonlyVec3} a The vec3 point to rotate
   * @param {ReadonlyVec3} b The origin of the rotation
   * @param {Number} rad The angle of rotation in radians
   * @returns {vec3} out
   */
  function rotateX(out, a, b, rad) {
    var p = [],
      r = [];
    //Translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    //perform rotation
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);

    //translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }

  /**
   * Rotate a 3D vector around the y-axis
   * @param {vec3} out The receiving vec3
   * @param {ReadonlyVec3} a The vec3 point to rotate
   * @param {ReadonlyVec3} b The origin of the rotation
   * @param {Number} rad The angle of rotation in radians
   * @returns {vec3} out
   */
  function rotateY(out, a, b, rad) {
    var p = [],
      r = [];
    //Translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    //perform rotation
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);

    //translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }

  /**
   * Rotate a 3D vector around the z-axis
   * @param {vec3} out The receiving vec3
   * @param {ReadonlyVec3} a The vec3 point to rotate
   * @param {ReadonlyVec3} b The origin of the rotation
   * @param {Number} rad The angle of rotation in radians
   * @returns {vec3} out
   */
  function rotateZ(out, a, b, rad) {
    var p = [],
      r = [];
    //Translate point to the origin
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];

    //perform rotation
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];

    //translate to correct position
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }

  /**
   * Get the angle between two 3D vectors
   * @param {ReadonlyVec3} a The first operand
   * @param {ReadonlyVec3} b The second operand
   * @returns {Number} The angle in radians
   */
  function angle(a, b) {
    var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)),
      cosine = mag && dot$1(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
  }

  /**
   * Set the components of a vec3 to zero
   *
   * @param {vec3} out the receiving vector
   * @returns {vec3} out
   */
  function zero(out) {
    out[0] = 0.0;
    out[1] = 0.0;
    out[2] = 0.0;
    return out;
  }

  /**
   * Returns a string representation of a vector
   *
   * @param {ReadonlyVec3} a vector to represent as a string
   * @returns {String} string representation of the vector
   */
  function str(a) {
    return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  }

  /**
   * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
   *
   * @param {ReadonlyVec3} a The first vector.
   * @param {ReadonlyVec3} b The second vector.
   * @returns {Boolean} True if the vectors are equal, false otherwise.
   */
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  /**
   * Returns whether or not the vectors have approximately the same elements in the same position.
   *
   * @param {ReadonlyVec3} a The first vector.
   * @param {ReadonlyVec3} b The second vector.
   * @returns {Boolean} True if the vectors are equal, false otherwise.
   */
  function equals(a, b) {
    var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
    var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
    return Math.abs(a0 - b0) <= EPSILON$1 * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON$1 * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON$1 * Math.max(1.0, Math.abs(a2), Math.abs(b2));
  }

  /**
   * Alias for {@link vec3.subtract}
   * @function
   */
  var sub = subtract;

  /**
   * Alias for {@link vec3.multiply}
   * @function
   */
  var mul = multiply;

  /**
   * Alias for {@link vec3.divide}
   * @function
   */
  var div = divide;

  /**
   * Alias for {@link vec3.distance}
   * @function
   */
  var dist = distance;

  /**
   * Alias for {@link vec3.squaredDistance}
   * @function
   */
  var sqrDist = squaredDistance;

  /**
   * Alias for {@link vec3.length}
   * @function
   */
  var len = length;

  /**
   * Alias for {@link vec3.squaredLength}
   * @function
   */
  var sqrLen = squaredLength;

  /**
   * Perform some operation over an array of vec3s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */
  var forEach = function () {
    var vec = create$1();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }
      return a;
    };
  }();

  var glVec3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    add: add,
    angle: angle,
    bezier: bezier,
    ceil: ceil,
    clone: clone,
    copy: copy,
    create: create$1,
    cross: cross$2,
    dist: dist,
    distance: distance,
    div: div,
    divide: divide,
    dot: dot$1,
    equals: equals,
    exactEquals: exactEquals,
    floor: floor,
    forEach: forEach,
    fromValues: fromValues,
    hermite: hermite,
    inverse: inverse,
    len: len,
    length: length,
    lerp: lerp,
    max: max,
    min: min,
    mul: mul,
    multiply: multiply,
    negate: negate,
    normalize: normalize,
    random: random,
    rotateX: rotateX,
    rotateY: rotateY,
    rotateZ: rotateZ,
    round: round,
    scale: scale,
    scaleAndAdd: scaleAndAdd,
    set: set,
    slerp: slerp,
    sqrDist: sqrDist,
    sqrLen: sqrLen,
    squaredDistance: squaredDistance,
    squaredLength: squaredLength,
    str: str,
    sub: sub,
    subtract: subtract,
    transformMat3: transformMat3,
    transformMat4: transformMat4$1,
    transformQuat: transformQuat,
    zero: zero
  });

  /**
   * Small mesh rebuild helpers for shared CarbonEngineJS mesh JSON.
   *
   * These helpers are deliberately framework-free and browser-safe. They accept
   * plain arrays or typed arrays and return plain arrays unless otherwise noted.
   */

  function validatePositions(positions) {
    if (!positions || positions.length % 3 !== 0) {
      throw new Error("Positions must contain complete xyz vertices");
    }
  }
  function validateIndices(indices, vertexCount) {
    if (!indices || indices.length % 3 !== 0) {
      throw new Error("Indices must contain complete triangles");
    }
    for (var i = 0; i < indices.length; i++) {
      if (!Number.isInteger(indices[i]) || indices[i] < 0 || indices[i] >= vertexCount) {
        throw new Error("Invalid vertex index at ".concat(i));
      }
    }
  }

  /**
   * Generate area-weighted vertex normals from positions and triangle indices.
   *
   * @param {ArrayLike<number>} positions Flat xyz positions.
   * @param {ArrayLike<number>} indices Flat triangle indices.
   * @returns {Float32Array} Flat xyz normals.
   */
  function generateNormals(positions, indices) {
    validatePositions(positions);
    validateIndices(indices, positions.length / 3);
    var vertexCount = positions.length / 3,
      normals = new Float32Array(positions.length);
    for (var t = 0; t < indices.length; t += 3) {
      var ia = indices[t] * 3,
        ib = indices[t + 1] * 3,
        ic = indices[t + 2] * 3,
        ax = positions[ia],
        ay = positions[ia + 1],
        az = positions[ia + 2],
        faceNormal = [0, 0, 0];
      cross$2(faceNormal, [positions[ib] - ax, positions[ib + 1] - ay, positions[ib + 2] - az], [positions[ic] - ax, positions[ic + 1] - ay, positions[ic + 2] - az]);
      for (var offset of [ia, ib, ic]) {
        normals[offset] += faceNormal[0];
        normals[offset + 1] += faceNormal[1];
        normals[offset + 2] += faceNormal[2];
      }
    }
    for (var i = 0; i < vertexCount; i++) {
      var _offset = i * 3,
        _length = Math.hypot(normals[_offset], normals[_offset + 1], normals[_offset + 2]) || 1;
      normals[_offset] /= _length;
      normals[_offset + 1] /= _length;
      normals[_offset + 2] /= _length;
    }
    return normals;
  }

  /**
   * Generate per-vertex tangents from positions, normals, UVs and indices.
   *
   * @param {ArrayLike<number>} positions Flat xyz positions.
   * @param {ArrayLike<number>} normals Flat xyz normals.
   * @param {ArrayLike<number>} uvs Flat uv coordinates.
   * @param {ArrayLike<number>} indices Flat triangle indices.
   * @returns {Float32Array} Flat xyz tangents.
   */
  function generateTangents(positions, normals, uvs, indices) {
    validatePositions(positions);
    var vertexCount = positions.length / 3,
      tan1 = new Float32Array(vertexCount * 3),
      tan2 = new Float32Array(vertexCount * 3);
    if (!normals || normals.length !== positions.length || !uvs || uvs.length !== vertexCount * 2) {
      throw new Error("Tangent channels do not match the vertex count");
    }
    validateIndices(indices, vertexCount);
    for (var t = 0; t < indices.length; t += 3) {
      var i0 = indices[t],
        i1 = indices[t + 1],
        i2 = indices[t + 2],
        p0 = i0 * 3,
        p1 = i1 * 3,
        p2 = i2 * 3,
        t0 = i0 * 2,
        t1 = i1 * 2,
        t2 = i2 * 2,
        x1 = positions[p1] - positions[p0],
        y1 = positions[p1 + 1] - positions[p0 + 1],
        z1 = positions[p1 + 2] - positions[p0 + 2],
        x2 = positions[p2] - positions[p0],
        y2 = positions[p2 + 1] - positions[p0 + 1],
        z2 = positions[p2 + 2] - positions[p0 + 2],
        s1 = uvs[t1] - uvs[t0],
        v1 = uvs[t1 + 1] - uvs[t0 + 1],
        s2 = uvs[t2] - uvs[t0],
        v2 = uvs[t2 + 1] - uvs[t0 + 1],
        divisor = s1 * v2 - s2 * v1,
        scale = divisor ? 1 / divisor : 0,
        sx = (v2 * x1 - v1 * x2) * scale,
        sy = (v2 * y1 - v1 * y2) * scale,
        sz = (v2 * z1 - v1 * z2) * scale,
        tx = (s1 * x2 - s2 * x1) * scale,
        ty = (s1 * y2 - s2 * y1) * scale,
        tz = (s1 * z2 - s2 * z1) * scale;
      for (var offset of [p0, p1, p2]) {
        tan1[offset] += sx;
        tan1[offset + 1] += sy;
        tan1[offset + 2] += sz;
        tan2[offset] += tx;
        tan2[offset + 1] += ty;
        tan2[offset + 2] += tz;
      }
    }
    var tangents = new Float32Array(vertexCount * 3),
      handedness = new Float32Array(vertexCount);
    for (var i = 0; i < vertexCount; i++) {
      var _offset2 = i * 3,
        nx = normals[_offset2],
        ny = normals[_offset2 + 1],
        nz = normals[_offset2 + 2],
        _tx = tan1[_offset2],
        _ty = tan1[_offset2 + 1],
        _tz = tan1[_offset2 + 2],
        normalDotTangent = nx * _tx + ny * _ty + nz * _tz;
      var ox = _tx - nx * normalDotTangent,
        oy = _ty - ny * normalDotTangent,
        oz = _tz - nz * normalDotTangent;
      var _length2 = Math.hypot(ox, oy, oz) || 1;
      ox /= _length2;
      oy /= _length2;
      oz /= _length2;
      tangents[_offset2] = ox;
      tangents[_offset2 + 1] = oy;
      tangents[_offset2 + 2] = oz;
      handedness[i] = (ny * oz - nz * oy) * tan2[_offset2] + (nz * ox - nx * oz) * tan2[_offset2 + 1] + (nx * oy - ny * ox) * tan2[_offset2 + 2] < 0 ? -1 : 1;
    }
    Object.defineProperty(tangents, "handedness", {
      value: handedness
    });
    return tangents;
  }

  /**
   * Generate binormals as normalized `normal x tangent`.
   *
   * @param {ArrayLike<number>} normals Flat xyz normals.
   * @param {ArrayLike<number>} tangents Flat xyz tangents.
   * @param {object} [options] Generation options.
   * @param {"right"|"left"} [options.uvHandedness] Handedness of generated basis.
   * @returns {number[]} Flat xyz binormals.
   */
  function generateBiNormals(normals, tangents) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (normals.length !== tangents.length || normals.length % 3 !== 0) {
      throw new Error("generateBiNormals requires matching complete xyz channels");
    }
    var conventionSign = options.uvHandedness === "left" ? -1 : 1,
      binormals = new Array(normals.length);
    for (var i = 0; i < normals.length; i += 3) {
      var _ref, _options$handedness, _options$handedness2, _tangents$handedness;
      var vertexSign = (_ref = (_options$handedness = (_options$handedness2 = options.handedness) === null || _options$handedness2 === void 0 ? void 0 : _options$handedness2[i / 3]) != null ? _options$handedness : (_tangents$handedness = tangents.handedness) === null || _tangents$handedness === void 0 ? void 0 : _tangents$handedness[i / 3]) != null ? _ref : 1,
        sign = conventionSign * vertexSign;
      var b = normalize([0, 0, 0], [normals[i + 1] * tangents[i + 2] - normals[i + 2] * tangents[i + 1], normals[i + 2] * tangents[i] - normals[i] * tangents[i + 2], normals[i] * tangents[i + 1] - normals[i + 1] * tangents[i]]);
      binormals[i] = b[0] * sign;
      binormals[i + 1] = b[1] * sign;
      binormals[i + 2] = b[2] * sign;
    }
    return binormals;
  }

  var num = {};
  num.EPSILON = 0.000001;
  num.RAD2DEG = 180 / Math.PI;
  num.DEG2RAD = Math.PI / 180;
  num.TWO_PI = Math.PI * 2;
  num.PI = Math.PI;
  num.INV_TWO_PI = 1 / num.TWO_PI;

  /**
   * biCumulative
   *
   * @param {number} t
   * @param {number} order
   * @returns {number}
   */
  num.biCumulative = function (t, order) {
    if (order === 1) {
      var some = 1.0 - t;
      return 1.0 - some * some * some;
    } else if (order === 2) {
      return 3.0 * t * t - 2.0 * t * t * t;
    } else {
      return t * t * t;
    }
  };

  /**
   * @alias Math.ceil
   */
  num.ceil = Math.ceil;

  /**
   * Clamps a number
   *
   * @param {number} a
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  num.clamp = function (a, min, max) {
    return Math.max(min, Math.min(max, a));
  };

  /**
   * Returns how many decimal places a number has
   *
   * @param {number} a
   * @returns {number}
   */
  num.decimalPlaces = function (a) {
    var match = ("" + a).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    return match ? Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)) : 0;
  };

  /**
   * Converts from radians to degrees
   *
   * @param {number} a
   * @returns {number}
   */
  num.degrees = function (a) {
    return a * num.RAD2DEG;
  };

  /**
   * Converts from radians to unwrapped degrees
   *
   * @param {number} a
   * @returns {number}
   */
  num.degreesUnwrapped = function (a) {
    return num.unwrapDegrees(a * num.RAD2DEG);
  };

  /**
   * Converts a Dword to Float
   * @param value
   * @return {Number}
   */
  num.dwordToFloat = function () {
    var words = new Uint32Array(1),
      floats = new Float32Array(words.buffer);
    return function (value) {
      words[0] = value >>> 0;
      return floats[0];
    };
  }();

  /**
   * Checks if a number equals another
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  num.equals = function (a, b) {
    return Math.abs(a - b) <= num.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
  };

  /**
   * Checks if a number exactly equals another
   * - included for library consistency
   *
   * @param {number} a
   * @param {number} b
   * @returns {boolean}
   */
  num.exactEquals = function (a, b) {
    return a === b;
  };

  /**
   * Exponential decay
   *
   * @param {number} omega0
   * @param {number} torque
   * @param {number} I - inertia
   * @param {number} d - drag
   * @param {number} time - time
   * @returns {number}
   */
  num.exponentialDecay = function (omega0, torque, I, d, time) {
    return torque * time / d + I * (omega0 * d - torque) / (d * d) * (1.0 - Math.pow(Math.E, -d * time / I));
  };

  /**
   * Gets the fractional components of a number
   *
   * @param {number} a
   * @returns {number}
   */
  num.fract = function (a) {
    return a - Math.floor(a);
  };

  /**
   * Gets a value from a half float
   * @author Babylon
   * @param {number} a
   * @returns {number}
   */
  num.fromHalfFloat = function (a) {
    var s = (a & 0x8000) >> 15,
      e = (a & 0x7C00) >> 10,
      f = a & 0x03FF;
    if (e === 0) {
      return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    } else if (e === 0x1F) {
      return f ? NaN : (s ? -1 : 1) * Infinity;
    }
    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10));
  };

  /**
   * @alias Math.floor
   */
  num.floor = Math.floor;

  /**
   * Gets long word order
   * @author Babylon
   * @param {number} a
   * @returns {number}
   */
  num.getLongWordOrder = function (a) {
    var value = a >>> 0,
      order = 0;
    while (order < 3 && value !== 0 && (value & 0xff) === 0) {
      value >>>= 8;
      order++;
    }
    return order;
  };

  /**
   *
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.greaterThan = function (a, b) {
    return a > b ? 1 : 0;
  };

  /**
   *
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.greaterThanEqual = function (a, b) {
    return a === b || num.equals(a, b) || a > b ? 1 : 0;
  };

  /**
   *
   * - included for library consistency
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.greaterThanExactEqual = function (a, b) {
    return a >= b ? 1 : 0;
  };

  /**
   * Checks if a number is even
   *
   * @param {number} a
   * @returns {boolean}
   */
  num.isEven = function (a) {
    return Math.abs(a) % 2 === 0;
  };

  /**
   * Checks if a number is a float
   *
   * @param {number} a
   * @returns {boolean}
   */
  num.isFloat = function (a) {
    return a % 1 !== 0;
  };

  /**
   * @alias Number.isFinite
   */
  num.isFinite = Number.isFinite;
  // return (typeof v === "number" && !isNaN(v) && v !== Infinity && v !== -Infinity);

  /**
   * Checks if a number is an integer
   *
   * @param {number} a
   * @returns {boolean}
   */
  num.isInt = function (a) {
    return a % 1 === 0;
  };

  /**
   * @alias Number.isNaN
   */
  num.isNaN = Number.isNaN;

  /**
   * Checks if a number is odd
   *
   * @param {number} a
   * @returns {boolean}
   */
  num.isOdd = function (a) {
    return Math.abs(a) % 2 === 1;
  };

  /**
   * Checks if a number is to the power of two
   *
   * @param {number} a
   * @returns {boolean}
   */
  num.isPowerOfTwo = function (a) {
    return Number.isSafeInteger(a) && a > 0 && Number.isInteger(Math.log2(a));
  };

  /**
   *
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.lessThan = function (a, b) {
    return a < b ? 1 : 0;
  };

  /**
   *
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.lessThanEqual = function (a, b) {
    return a === b || num.equals(a, b) || a < b ? 1 : 0;
  };

  /**
   *
   * - included for library consistency
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  num.lessThanExactEqual = function (a, b) {
    return a <= b ? 1 : 0;
  };

  /**
   * Gets the log2 of a number
   * @param {number} a
   * @returns {number}
   */
  num.log2 = function (a) {
    return Math.log(a) * Math.LOG2E;
  };

  /**
   * @alias Math.max
   */
  num.max = Math.max;

  /**
   * @alias Math.min
   */
  num.min = Math.min;

  /**
   * Gets the nearest power of two value to a number
   *
   * @param {number} a
   * @returns {number}
   */
  num.nearestPowerOfTwo = function (a) {
    return Math.pow(2, Math.round(Math.log(a) / Math.LN2));
  };

  /**
   *
   *
   * @param {number} value
   * @param {number} start
   * @param {number} end
   * @param {number} precision
   * @returns {number}
   */
  num.normalizeInt = function (value, start, end, precision) {
    var width = end - start;
    var offsetValue = value - start;
    var result = offsetValue - Math.floor(offsetValue / width) * width + start;
    return precision === undefined ? result : Number(result.toFixed(precision));
  };

  /**
   *
   *
   * @param {number} value
   * @param {number} start
   * @param {number} end
   * @param {number} precision
   * @returns {number}
   */
  num.normalizeFloat = function (value, start, end, precision) {
    var width = end - start;
    var offsetValue = value - start;
    var result = offsetValue - Math.floor(offsetValue / width) * width + start;
    return precision === undefined ? result : Number(result.toFixed(precision));
  };

  /**
   * Converts from degrees to radians
   *
   * @param {number} a
   * @returns {number}
   */
  num.radians = function (a) {
    return a * num.DEG2RAD;
  };

  /**
   * Converts from degrees to unwrapped radians
   *
   * @param {number} a
   * @returns {number}
   */
  num.radiansUnwrapped = function (a) {
    return num.unwrapRadians(a *= num.DEG2RAD);
  };

  /**
   * Creates a random integer
   *
   * @param {number} low
   * @param {number} high
   * @returns {number}
   */
  num.randomInt = function (low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
  };

  /**
   * Creates a random float
   *
   * @param {number} low
   * @param {number} high
   * @returns {number}
   */
  num.randomFloat = function (low, high) {
    return low + Math.random() * (high - low);
  };

  /**
   * @alias for Math.round
   */
  num.round = Math.round;

  /**
   * Rounds a number to the closest zero
   *
   * @param {number} a
   * @returns {number}
   */
  num.roundToZero = function (a) {
    return a < 0 ? Math.ceil(a) : Math.floor(a);
  };

  /**
   * @alias for num.greaterThan
   */
  num.step = num.greaterThan;

  /**
   * Force positive number (excluding 0)
   * @param {Number} s
   * @returns {Number}
   */
  num.strictPositive = function (s) {
    return Math.max(num.EPSILON, Math.abs(s));
  };

  /**
   * Force negative number (excluding 0)
   * @param {Number} s
   * @returns {Number}
   */
  num.strictNegative = function (s) {
    return -Math.max(num.EPSILON, Math.abs(s));
  };

  /**
   * Evaluates cubic Hermite interpolation using Carbon argument order.
   *
   * @param {number} startValue
   * @param {number} startTangent
   * @param {number} endValue
   * @param {number} endTangent
   * @param {number} amount
   * @returns {number}
   */
  // USE THIS: Carbon order is start value, start tangent, end value, end tangent.
  num.cubicHermite = function (startValue, startTangent, endValue, endTangent, amount) {
    var amountSquared = amount * amount,
      amountCubed = amountSquared * amount,
      startFactor = 2 * amountCubed - 3 * amountSquared + 1,
      startTangentFactor = amountCubed - 2 * amountSquared + amount,
      endFactor = -2 * amountCubed + 3 * amountSquared,
      endTangentFactor = amountCubed - amountSquared;
    return startValue * startFactor + startTangent * startTangentFactor + endValue * endFactor + endTangent * endTangentFactor;
  };

  /**
   * Evaluates the derivative of cubic Hermite interpolation using Carbon
   * argument order.
   *
   * @param {number} startValue
   * @param {number} startTangent
   * @param {number} endValue
   * @param {number} endTangent
   * @param {number} amount
   * @returns {number}
   */
  // USE THIS: Carbon order is start value, start tangent, end value, end tangent.
  num.cubicHermiteDerivative = function (startValue, startTangent, endValue, endTangent, amount) {
    var amountSquared = amount * amount,
      startFactor = 6 * amountSquared - 6 * amount,
      startTangentFactor = 3 * amountSquared - 4 * amount + 1,
      endFactor = -startFactor,
      endTangentFactor = 3 * amountSquared - 2 * amount;
    return startValue * startFactor + startTangent * startTangentFactor + endValue * endFactor + endTangent * endTangentFactor;
  };

  /**
   *
   * @param a
   * @param min
   * @param max
   * @returns {number}
   */
  num.smoothStep = function (a, min, max) {
    if (a <= min) return 0;
    if (a >= max) return 1;
    a = (a - min) / (max - min);
    return a * a * (3 - 2 * a);
  };

  /**
   *
   * @param a
   * @param min
   * @param max
   * @returns {number}
   */
  num.smootherStep = function (a, min, max) {
    if (a <= min) return 0;
    if (a >= max) return 1;
    a = (a - min) / (max - min);
    return a * a * a * (a * (a * 6 - 15) + 10);
  };

  /**
   * Converts a number to a half float
   * @author http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
   * @param {number} a
   * @returns {number}
   */
  num.toHalfFloat = function () {
    var floats = new Float32Array(1),
      words = new Uint32Array(floats.buffer);
    return function (a) {
      floats[0] = a;
      var word = words[0],
        sign = word >>> 16 & 0x8000,
        exponent = word >>> 23 & 0xff;
      var mantissa = word & 0x7fffff;
      if (exponent === 0xff) {
        return sign | 0x7c00 | (mantissa ? 0x0200 : 0);
      }
      var halfExponent = exponent - 127 + 15;
      if (halfExponent >= 0x1f) {
        return sign | 0x7c00;
      }
      if (halfExponent <= 0) {
        if (halfExponent < -10) return sign;
        mantissa |= 0x800000;
        var shift = 14 - halfExponent,
          halfway = 1 << shift - 1,
          _remainder = mantissa & (1 << shift) - 1;
        var _halfMantissa = mantissa >>> shift;
        if (_remainder > halfway || _remainder === halfway && _halfMantissa & 1) {
          _halfMantissa++;
        }
        return sign | _halfMantissa;
      }
      var halfMantissa = mantissa >>> 13;
      var remainder = mantissa & 0x1fff;
      if (remainder > 0x1000 || remainder === 0x1000 && halfMantissa & 1) {
        halfMantissa++;
        if (halfMantissa === 0x400) {
          halfMantissa = 0;
          halfExponent++;
          if (halfExponent >= 0x1f) return sign | 0x7c00;
        }
      }
      return sign | halfExponent << 10 | halfMantissa;
    };
  }();

  /**
   * Converts linear color to rgba/rgb color
   * @param {Number} a
   * @returns {Number}
   */
  num.colorFromLinear = function (a) {
    return Math.max(0, Math.min(Math.floor(a * 255), 255));
  };

  /**
   * Converts linear color to rgba/rgb color
   * @param {Number} a
   * @returns {Number}
   */
  num.linearFromColor = function (a) {
    return a / 255;
  };

  /**
   * Converts linear color to hex string
   * @param {Number} a
   * @returns {String}
   */
  num.hexFromLinear = function (a) {
    return num.hexFromColor(num.colorFromLinear(a));
  };

  /**
   * Converts rgb/rgba color to hex string
   * @param {Number} a
   * @returns {String}
   */
  num.hexFromColor = function (a) {
    return (a | 1 << 8).toString(16).slice(1);
  };

  /**
   * Unwraps degrees
   *
   * @param {number} d
   * @returns {number}
   */
  num.unwrapDegrees = function (d) {
    d = d % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };

  /**
   * Unwraps radians
   *
   * @param {number} r
   * @returns {number}
   */
  num.unwrapRadians = function (r) {
    r = r % num.TWO_PI;
    if (r > num.PI) r -= num.TWO_PI;
    if (r < -num.PI) r += num.TWO_PI;
    return r;
  };

  /**
   * Converts srgb to linear colour
   * @param {Number} a
   * @returns {Number}
   */
  num.linearFromSRGB = function (a) {
    return a < 0.04045 ? a * 0.0773993808 : Math.pow(a * 0.9478672986 + 0.0521327014, 2.4);
  };

  /**
   * Converts from linear color space to Carbon gamma 2.2 color space
   * @param {Number} a
   * @returns {Number}
   */
  num.linearToGamma = function (a) {
    return Math.pow(a, 0.454545);
  };

  /**
   * Converts from Carbon gamma 2.2 color space to linear color space
   * @param {Number} a
   * @returns {Number}
   */
  num.gammaToLinear = function (a) {
    return Math.pow(a, 2.2);
  };

  /**
   * Converts linear colour to srgb
   * @param {Number} a
   * @returns {Number}
   */
  num.srgbFromLinear = function (a) {
    return a < 0.0031308 ? a * 12.92 : 1.055 * Math.pow(a, 1.0 / 2.4) - 0.055;
  };
  var EPSILON = num.EPSILON;
    num.RAD2DEG;
    num.DEG2RAD;
    num.TWO_PI;
    num.PI;
    num.INV_TWO_PI;
    num.biCumulative;
    num.ceil;
    var clamp = num.clamp;
    num.decimalPlaces;
    num.degrees;
    num.degreesUnwrapped;
    num.dwordToFloat;
    num.equals;
    num.exactEquals;
    num.exponentialDecay;
    num.fract;
    num.fromHalfFloat;
    num.floor;
    num.getLongWordOrder;
    num.greaterThan;
    num.greaterThanEqual;
    num.greaterThanExactEqual;
    num.isEven;
    num.isFloat;
    num.isFinite;
    num.isInt;
    num.isNaN;
    num.isOdd;
    num.isPowerOfTwo;
    num.lessThan;
    num.lessThanEqual;
    num.lessThanExactEqual;
    num.log2;
    num.max;
    num.min;
    num.nearestPowerOfTwo;
    num.normalizeInt;
    num.normalizeFloat;
    num.radians;
    num.radiansUnwrapped;
    num.randomInt;
    num.randomFloat;
    num.round;
    num.roundToZero;
    num.step;
    num.strictPositive;
    num.strictNegative;
    num.cubicHermite;
    num.cubicHermiteDerivative;
    num.smoothStep;
    num.smootherStep;
    num.toHalfFloat;
    num.colorFromLinear;
    num.linearFromColor;
    num.hexFromLinear;
    num.hexFromColor;
    num.unwrapDegrees;
    num.unwrapRadians;
    num.linearFromSRGB;
    num.linearToGamma;
    num.gammaToLinear;
    num.srgbFromLinear;

  /**
   * Packed tangent-frame helpers for CarbonEngineJS/GR2-style mesh data.
   *
   * The packed-frame constants and decode/encode behavior are based on observed
   * Fenris Creations (CCP Games) shader behavior for EVE/Carbon packed tangent
   * frames. No shader source is included here.
   */

  /** Full-turn float32 constant used by the CCP tangent-frame shader. */
  var TANGENT_TAU = 6.28318548;

  /** Half-turn float32 constant used by the CCP tangent-frame shader. */
  var TANGENT_PI = 3.14159274;
  var TAU = TANGENT_TAU,
    PI = TANGENT_PI,
    POLAR_EPSILON = 1e-6;

  /**
   * Packed UNorm sentinel used for vertices with no authored tangent frame.
   *
   * @type {number[]}
   */
  var NULL_TANGENT_UNORM = Object.freeze([0, 1, 0, 1]);

  /**
   * Test whether a packed tangent payload is the null-frame sentinel.
   *
   * @param {ArrayLike<number>} u Four UNorm values.
   * @returns {boolean} Whether the payload marks a missing authored frame.
   */
  function isNullTangent(u) {
    var e1 = u[1],
      e3 = u[3];
    return (e1 <= 1e-3 || e1 >= 1 - 1e-3) && (e3 <= 1e-3 || e3 >= 1 - 1e-3);
  }
  var scratchT = new Float64Array(3),
    scratchB = new Float64Array(3),
    scratchN = new Float64Array(3);
  function decodeTangentFrameInto(u0, u1, u2, u3, outT, outB, outN) {
    var a0 = u0 * TAU - PI,
      a1 = u1 * TAU - PI,
      a2 = u2 * TAU - PI,
      a3 = u3 * TAU - PI,
      s1 = Math.abs(Math.sin(a1)),
      s3 = Math.abs(Math.sin(a3));
    outT[0] = s1 * Math.cos(a0);
    outT[1] = s1 * Math.sin(a0);
    outT[2] = Math.cos(a1);
    outB[0] = s3 * Math.cos(a2);
    outB[1] = s3 * Math.sin(a2);
    outB[2] = Math.cos(a3);
    var sign = a1 > 0 && a3 > 0 ? 1 : -1;
    outN[0] = (outT[1] * outB[2] - outT[2] * outB[1]) * sign;
    outN[1] = (outT[2] * outB[0] - outT[0] * outB[2]) * sign;
    outN[2] = (outT[0] * outB[1] - outT[1] * outB[0]) * sign;
    return s1 < 1e-6 && s3 < 1e-6;
  }

  /**
   * Decode a packed tangent frame.
   *
   * @param {ArrayLike<number>} u Four UNorm values in `[0, 1]`.
   * @returns {{T: number[], B: number[], N: number[], null: boolean}} Decoded basis.
   */
  function decodeTangentFrame(u) {
    var isNull = decodeTangentFrameInto(u[0], u[1], u[2], u[3], scratchT, scratchB, scratchN);
    return {
      T: Array.from(scratchT),
      B: Array.from(scratchB),
      N: Array.from(scratchN),
      null: isNull
    };
  }

  /**
   * Encode a tangent frame back to four UNorm angles.
   *
   * @param {ArrayLike<number>} T Unit tangent.
   * @param {ArrayLike<number>} B Unit binormal.
   * @param {ArrayLike<number>} [N] Unit normal; only handedness is used.
   * @returns {number[]} Four UNorm values in `[0, 1]`.
   */
  function encodeTangentFrame(T, B, N) {
    var a0 = Math.atan2(T[1], T[0]),
      a1 = Math.acos(clamp(T[2], -1, 1));
    var a2 = Math.atan2(B[1], B[0]);
    var a3 = Math.acos(clamp(B[2], -1, 1));
    var negativeHandedness = N && dot$1(N, cross$2([0, 0, 0], T, B)) < 0;
    if (negativeHandedness) {
      a1 = a1 === 0 ? -POLAR_EPSILON : -a1;
    } else {
      if (a1 === 0) a1 = POLAR_EPSILON;
      if (a3 === 0) a3 = POLAR_EPSILON;
    }
    var enc = angle => clamp((angle + PI) / TAU, 0, 1);
    return [enc(a0), enc(a1), enc(a2), enc(a3)];
  }
  function vertexCount(mesh, count) {
    if (count !== undefined) return count;
    var p = mesh.vertex && mesh.vertex.position;
    return p ? p.length / 3 | 0 : 0;
  }

  /**
   * Is this shared mesh's tangent frame packed?
   *
   * @param {object} mesh Shared mesh.
   * @param {number} [count] Vertex count when the payload has no position channel.
   * @returns {boolean} Whether the mesh has packed tangent frames.
   */
  function isPacked(mesh, count) {
    var v = mesh.vertex;
    if (!v || !v.tangent || !v.tangent.length) return false;
    var n = vertexCount(mesh, count);
    if (!n) return false;
    var comps = v.tangent.length / n,
      empty = value => !value || value.length === 0;
    return comps === 4 && empty(v.normal) && empty(v.binormal);
  }

  /**
   * Unpack a packed shared mesh in place.
   *
   * @param {object} mesh Shared mesh to mutate.
   * @param {number} [count] Vertex count when the payload has no position channel.
   * @returns {boolean} Whether unpacking happened.
   */
  function unpackMeshTangents$1(mesh, count) {
    if (!isPacked(mesh, count)) return false;
    var v = mesh.vertex,
      n = vertexCount(mesh, count),
      src = v.tangent,
      normal = new Array(n * 3),
      tangent = new Array(n * 3),
      binormal = new Array(n * 3);
    for (var i = 0; i < n; i++) {
      var s = i * 4,
        o = i * 3,
        isNull = decodeTangentFrameInto(src[s], src[s + 1], src[s + 2], src[s + 3], scratchT, scratchB, scratchN);
      if (isNull) {
        normal[o] = normal[o + 1] = normal[o + 2] = 0;
        tangent[o] = tangent[o + 1] = tangent[o + 2] = 0;
        binormal[o] = binormal[o + 1] = binormal[o + 2] = 0;
      } else {
        normal[o] = scratchN[0];
        normal[o + 1] = scratchN[1];
        normal[o + 2] = scratchN[2];
        tangent[o] = scratchT[0];
        tangent[o + 1] = scratchT[1];
        tangent[o + 2] = scratchT[2];
        binormal[o] = scratchB[0];
        binormal[o + 1] = scratchB[1];
        binormal[o + 2] = scratchB[2];
      }
    }
    v.normal = normal;
    v.tangent = tangent;
    v.binormal = binormal;
    return true;
  }

  /**
   * Pack explicit tangent frames into GR2-style four-component tangent data.
   *
   * @param {ArrayLike<number>} normals Flat xyz normals.
   * @param {ArrayLike<number>} tangents Flat xyz tangents.
   * @param {ArrayLike<number>} binormals Flat xyz binormals.
   * @returns {number[]} Flat xyzw packed tangent-frame values.
   */
  function packTangentFrames(normals, tangents, binormals) {
    if (normals.length !== tangents.length || normals.length !== binormals.length || normals.length % 3 !== 0) {
      throw new Error("packTangentFrames requires matching complete xyz channels");
    }
    var packed = new Array(normals.length / 3 * 4);
    for (var i = 0, o = 0; i < normals.length; i += 3, o += 4) {
      var components = [normals[i], normals[i + 1], normals[i + 2], tangents[i], tangents[i + 1], tangents[i + 2], binormals[i], binormals[i + 1], binormals[i + 2]];
      if (!components.every(Number.isFinite)) {
        throw new Error("packTangentFrames received non-finite data at vertex ".concat(i / 3));
      }
      var normal = normalize([0, 0, 0], components.slice(0, 3)),
        _tangent = normalize([0, 0, 0], components.slice(3, 6)),
        binormal = normalize([0, 0, 0], components.slice(6, 9)),
        frameNormalLength = length(cross$2([0, 0, 0], _tangent, binormal));
      if (length(normal) <= EPSILON || length(_tangent) <= EPSILON || length(binormal) <= EPSILON || frameNormalLength <= EPSILON) {
        packed[o] = NULL_TANGENT_UNORM[0];
        packed[o + 1] = NULL_TANGENT_UNORM[1];
        packed[o + 2] = NULL_TANGENT_UNORM[2];
        packed[o + 3] = NULL_TANGENT_UNORM[3];
        continue;
      }
      var encoded = encodeTangentFrame(_tangent, binormal, normal);
      packed[o] = encoded[0];
      packed[o + 1] = encoded[1];
      packed[o + 2] = encoded[2];
      packed[o + 3] = encoded[3];
    }
    return packed;
  }

  /**
   * Returns the scaling factor component of a transformation
   *  matrix. If a matrix is built with fromRotationTranslationScale
   *  with a normalized Quaternion parameter, the returned vector will be
   *  the same as the scaling vector
   *  originally supplied.
   * @param  {vec3} out Vector to receive scaling factor component
   * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
   * @return {vec3} out
   */
  function getScaling(out, mat) {
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    return out;
  }

  /**
   * Returns a quaternion representing the rotational component
   *  of a transformation matrix. If a matrix is built with
   *  fromRotationTranslation, the returned quaternion will be the
   *  same as the quaternion originally supplied.
   * @param {quat} out Quaternion to receive the rotation component
   * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
   * @return {quat} out
   */
  function getRotation(out, mat) {
    var scaling = new ARRAY_TYPE(3);
    getScaling(scaling, mat);
    var is1 = 1 / scaling[0];
    var is2 = 1 / scaling[1];
    var is3 = 1 / scaling[2];
    var sm11 = mat[0] * is1;
    var sm12 = mat[1] * is2;
    var sm13 = mat[2] * is3;
    var sm21 = mat[4] * is1;
    var sm22 = mat[5] * is2;
    var sm23 = mat[6] * is3;
    var sm31 = mat[8] * is1;
    var sm32 = mat[9] * is2;
    var sm33 = mat[10] * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1.0) * 2;
      out[3] = 0.25 * S;
      out[0] = (sm23 - sm32) / S;
      out[1] = (sm31 - sm13) / S;
      out[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
      out[3] = (sm23 - sm32) / S;
      out[0] = 0.25 * S;
      out[1] = (sm12 + sm21) / S;
      out[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
      out[3] = (sm31 - sm13) / S;
      out[0] = (sm12 + sm21) / S;
      out[1] = 0.25 * S;
      out[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
      out[3] = (sm12 - sm21) / S;
      out[0] = (sm31 + sm13) / S;
      out[1] = (sm23 + sm32) / S;
      out[2] = 0.25 * S;
    }
    return out;
  }

  /**
   * Calculates a 4x4 matrix from the given quaternion
   *
   * @param {mat4} out mat4 receiving operation result
   * @param {ReadonlyQuat} q Quaternion to create matrix from
   *
   * @returns {mat4} out
   */
  function fromQuat(out, q) {
    var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }

  /**
   * 4 Dimensional Vector
   * @module vec4
   */

  /**
   * Creates a new, empty vec4
   *
   * @returns {vec4} a new 4D vector
   */
  function create() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }
    return out;
  }

  /**
   * Transforms the vec4 with a mat4.
   *
   * @param {vec4} out the receiving vector
   * @param {ReadonlyVec4} a the vector to transform
   * @param {ReadonlyMat4} m matrix to transform with
   * @returns {vec4} out
   */
  function transformMat4(out, a, m) {
    var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
  }

  /**
   * Perform some operation over an array of vec4s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */
  (function () {
    var vec = create();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 4;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
        a[i + 3] = vec[3];
      }
      return a;
    };
  })();

  /**
   * Small WebGL numeric constants used by the typed-array pool helpers.
   *
   * These stay local to keep the math subpaths independently browser-friendly:
   * importing the old ccpwgl `constant` alias would pull the package back toward
   * an application-specific module graph.
   */

  var GL_BYTE = 5120;
  var GL_UNSIGNED_BYTE = 5121;
  var GL_SHORT = 5122;
  var GL_UNSIGNED_SHORT = 5123;
  var GL_INT = 5124;
  var GL_UNSIGNED_INT = 5125;
  var GL_FLOAT = 5126;

  function loop(n, f) {
    var result = Array(n);
    for (var i = 0; i < n; ++i) result[i] = f(i);
    return result;
  }
  function nextPow16(v) {
    for (var i = 16; i <= 1 << 28; i *= 16) {
      if (v <= i) return i;
    }
    return 0;
  }
  function log2(v) {
    var r, shift;
    r = (v > 0xFFFF) << 4;
    v >>>= r;
    shift = (v > 0xFF) << 3;
    v >>>= shift;
    r |= shift;
    shift = (v > 0xF) << 2;
    v >>>= shift;
    r |= shift;
    shift = (v > 0x3) << 1;
    v >>>= shift;
    r |= shift;
    return r | v >> 1;
  }

  /** Creates a reusable typed-array pool for a supported graphics scalar type. */
  function createPool() {
    var bufferPool = loop(8, function () {
      return [];
    });
    function free(buf) {
      bufferPool[log2(buf.byteLength) >> 2].push(buf);
    }
    function alloc(n) {
      var sz = nextPow16(n),
        bin = bufferPool[log2(sz) >> 2];
      if (bin.length > 0) return bin.pop();
      return new ArrayBuffer(sz);
    }

    /**
     * Shortcut to allocating a float 32 array
     * @param {Number} length
     * @returns {Float32Array}
     */
    function allocF32(length) {
      var result = new Float32Array(alloc(4 * length), 0, length);
      return result.length !== length ? result.subarray(0, length) : result;
    }

    /**
     * Allocated a typed array of a given size
     * @param {Number|Function}type
     * @param {Number} n
     * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|null}
     */
    function allocType(type, n) {
      var result = null;
      switch (type) {
        case GL_BYTE:
        case Int8Array:
          result = new Int8Array(alloc(n), 0, n);
          break;
        case GL_UNSIGNED_BYTE:
        case Uint8Array:
          result = new Uint8Array(alloc(n), 0, n);
          break;
        case GL_SHORT:
        case Int16Array:
          result = new Int16Array(alloc(2 * n), 0, n);
          break;
        case GL_UNSIGNED_SHORT:
        case Uint16Array:
          result = new Uint16Array(alloc(2 * n), 0, n);
          break;
        case GL_INT:
        case Int32Array:
          result = new Int32Array(alloc(4 * n), 0, n);
          break;
        case GL_UNSIGNED_INT:
        case Uint32Array:
          result = new Uint32Array(alloc(4 * n), 0, n);
          break;
        case GL_FLOAT:
        case Float32Array:
          result = new Float32Array(alloc(4 * n), 0, n);
          break;
        default:
          return null;
      }
      if (result.length !== n) {
        return result.subarray(0, n);
      }
      return result;
    }
    function freeType(array) {
      free(array.buffer);
    }
    return {
      allocF32,
      allocType,
      unalloc: freeType,
      freeType,
      free
    };
  }
  var pool = createPool();

  var vec3 = _objectSpread2({}, glVec3);

  /**
   * Vector 3
   * @typedef {Float32Array} vec3
   */

  /**
   * Allocates a pooled vec3
   * @returns {Float32Array|vec3}
   */
  vec3.alloc = function () {
    return pool.allocF32(3);
  };

  /**
   * Unallocates a pooled vec3
   * @param {vec3|Float32Array} a
   */
  vec3.unalloc = function (a) {
    pool.freeType(a);
  };
  vec3.unallocMany = function (arr) {
    for (var i = 0; i < arr.length; i++) {
      pool.freeType(arr[i]);
    }
  };

  /**
   * X_AXIS
   * @type {vec3}
   */
  vec3.X_AXIS = vec3.fromValues(1, 0, 0);

  /**
   * Y Axis
   * @type {vec3}
   */
  vec3.Y_AXIS = vec3.fromValues(0, 1, 0);

  /**
   * Z Axis
   * @type {vec3}
   */
  vec3.Z_AXIS = vec3.fromValues(0, 0, 1);

  /**
   * Adds a scalar to a vec3
   *
   * @param {vec3} out
   * @param {vec3} a
   * @param {Number} s
   * @returns {vec3} out
   */
  vec3.addScalar = function (out, a, s) {
    out[0] = a[0] + s;
    out[1] = a[1] + s;
    out[2] = a[2] + s;
    return out;
  };

  /**
   * Converts radians to degrees
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.degrees = function (out, a) {
    out[0] = num.degrees(a[0]);
    out[1] = num.degrees(a[1]);
    out[2] = num.degrees(a[2]);
    return out;
  };

  /**
   * Converts radians to unwrapped degrees
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.degreesUnwrapped = function (out, a) {
    out[0] = num.degreesUnwrapped(a[0]);
    out[1] = num.degreesUnwrapped(a[1]);
    out[2] = num.degreesUnwrapped(a[2]);
    return out;
  };

  /**
   * Gets normalized direction between two points
   * @param {vec3} out
   * @param {vec3} a
   * @param {vec3} b
   * @returns {vec3}
   */
  vec3.direction = function (out, a, b) {
    vec3.subtract(out, a, b);
    vec3.normalize(out, out);
    return out;
  };

  /**
   * Gets the direction from a quat
   * @param {vec3} out
   * @param {vec3} axis
   * @param {quat} q
   * @returns {vec3} out
   */
  vec3.directionFromQuat = function (out, axis, q) {
    return vec3.transformQuat(out, axis, q);
  };

  /**
   * Gets the direction from a mat4's axis
   * @param {vec3} out
   * @param {vec3} axis
   * @param {mat4} m
   * @returns {vec3} out
   */
  vec3.directionFromMat4 = function (out, axis, m) {
    var quat_0 = getRotation(pool.allocF32(4), m);
    vec3.transformQuat(out, axis, quat_0);
    pool.freeType(quat_0);
    return out;
  };

  /**
   * Divides a vec3 by a scalar
   *
   * @param {vec3} out
   * @param {vec3} a
   * @param {Number} s
   * @returns {vec3} out
   */
  vec3.divideScalar = function (out, a, s) {
    return vec3.multiplyScalar(out, a, 1 / s);
  };

  /**
   * Euler functions
   * @type {{*}}
   */
  vec3.euler = {};

  /**
   * Default euler order
   * @type {string}
   */
  vec3.euler.DEFAULT_ORDER = "XYZ";

  /**
   * Sets a euler from a quat
   *
   * @param {vec3} out
   * @param {quat} q
   * @param {string} [order=vec3.euler.DEFAULT_ORDER]
   * @returns {vec3} out
   */
  vec3.euler.fromQuat = function (out, q) {
    var order = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : vec3.euler.DEFAULT_ORDER;
    // mat4.alloc
    var mat4_0 = fromQuat(pool.allocF32(16), q);
    vec3.euler.fromMat4(out, mat4_0, order);
    pool.unalloc(mat4_0);
    return out;
  };

  /**
   * Sets a euler from a mat4
   *
   * @author three.js (converted)
   * @param {vec3} out
   * @param {mat4} m
   * @param {string} [order=vec3.euler.DEFAULT_ORDER]
   * @returns {vec3} out
   */
  vec3.euler.fromMat4 = function (out, m) {
    var order = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : vec3.euler.DEFAULT_ORDER;
    var m11 = m[0],
      m12 = m[4],
      m13 = m[8],
      m21 = m[1],
      m22 = m[5],
      m23 = m[9],
      m31 = m[2],
      m32 = m[6],
      m33 = m[10];
    var clamp = num.clamp;
    if (order === "XYZ") {
      out[1] = Math.asin(clamp(m13, -1, 1));
      if (Math.abs(m13) < 0.99999) {
        out[0] = Math.atan2(-m23, m33);
        out[2] = Math.atan2(-m12, m11);
      } else {
        out[0] = Math.atan2(m32, m22);
        out[2] = 0;
      }
    } else if (order === "YXZ") {
      out[0] = Math.asin(-clamp(m23, -1, 1));
      if (Math.abs(m23) < 0.99999) {
        out[1] = Math.atan2(m13, m33);
        out[2] = Math.atan2(m21, m22);
      } else {
        out[1] = Math.atan2(-m31, m11);
        out[2] = 0;
      }
    } else if (order === "ZXY") {
      out[0] = Math.asin(clamp(m32, -1, 1));
      if (Math.abs(m32) < 0.99999) {
        out[1] = Math.atan2(-m31, m33);
        out[2] = Math.atan2(-m12, m22);
      } else {
        out[1] = 0;
        out[2] = Math.atan2(m21, m11);
      }
    } else if (order === "ZYX") {
      out[1] = Math.asin(-clamp(m31, -1, 1));
      if (Math.abs(m31) < 0.99999) {
        out[0] = Math.atan2(m32, m33);
        out[2] = Math.atan2(m21, m11);
      } else {
        out[0] = 0;
        out[2] = Math.atan2(-m12, m22);
      }
    } else if (order === "YZX") {
      out[2] = Math.asin(clamp(m21, -1, 1));
      if (Math.abs(m21) < 0.99999) {
        out[0] = Math.atan2(-m23, m22);
        out[1] = Math.atan2(-m31, m11);
      } else {
        out[0] = 0;
        out[1] = Math.atan2(m13, m33);
      }
    } else if (order === "XZY") {
      out[2] = Math.asin(-clamp(m12, -1, 1));
      if (Math.abs(m12) < 0.99999) {
        out[0] = Math.atan2(m32, m22);
        out[1] = Math.atan2(m13, m11);
      } else {
        out[0] = Math.atan2(-m23, m33);
        out[1] = 0;
      }
    } else {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      throw new Error("Unrecognised euler order: " + order);
    }
    return out;
  };

  /**
   * Gets a quat from a euler
   * - Differs from quat.getEuler as it allows for different euler ordering
   *
   * - http://www.mathworks.com/matlabcentral/fileexchange/
   * - 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
   * - content/SpinCalc.m
   *
   * @param {quat} out
   * @param {vec3} euler
   * @param [order=vec3.euler.DEFAULT_ORDER]
   * @returns {quat} out
   */
  vec3.euler.getQuat = function (out, euler) {
    var order = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : vec3.euler.DEFAULT_ORDER;
    var x = euler[0],
      y = euler[1],
      z = euler[2];
    var cosYaw = Math.cos(x / 2),
      cosPitch = Math.cos(y / 2),
      cosRoll = Math.cos(z / 2),
      sinYaw = Math.sin(x / 2),
      sinPitch = Math.sin(y / 2),
      sinRoll = Math.sin(z / 2);
    if (order === "XYZ") {
      out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    } else if (order === "YXZ") {
      out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    } else if (order === "ZXY") {
      out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    } else if (order === "ZYX") {
      out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    } else if (order === "YZX") {
      out[0] = sinYaw * cosPitch * cosRoll + cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll - sinYaw * sinPitch * sinRoll;
    } else if (order === "XZY") {
      out[0] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
      out[1] = cosYaw * sinPitch * cosRoll - sinYaw * cosPitch * sinRoll;
      out[2] = cosYaw * cosPitch * sinRoll + sinYaw * sinPitch * cosRoll;
      out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    } else {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      throw new Error("Unrecognised euler order: " + order);
    }
    return out;
  };

  /**
   * Gets a quat from a euler values
   *
   * @param {quat} out
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {String} [order]
   * @return {quat} out
   */
  vec3.euler.getQuatFromValues = function (out, x, y, z, order) {
    var vec3_0 = vec3.set(vec3.alloc(), x, y, z);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
  };

  /**
   * Gets a quat from a euler that uses degrees
   *
   * @param {quat} out
   * @param {vec3} v
   * @param {String} [order]
   * @return {quat} out
   */
  vec3.euler.getQuatFromDegrees = function (out, v, order) {
    var vec3_0 = vec3.radians(vec3.alloc(), v);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
  };

  /**
   * Gets a quat from euler degree values
   *
   * @param {quat} out
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {String} [order]
   * @return {quat} out
   */
  vec3.euler.getQuatFromDegreeValues = function (out, x, y, z, order) {
    var vec3_0 = vec3.set(vec3.alloc(), x, y, z);
    vec3.radians(vec3_0, vec3_0);
    vec3.euler.getQuat(out, vec3_0, order);
    vec3.unalloc(vec3_0);
    return out;
  };

  /**
   * Sets a euler from quat, and stores in degrees
   *
   * @param {vec3} out
   * @param {quat} q
   * @param {String} [order]
   * @return {vec3} out
   */
  vec3.euler.fromQuatInDegrees = function (out, q, order) {
    vec3.euler.fromQuat(out, q, order);
    return vec3.degrees(out, out);
  };

  /**
   * Exponential decay
   *
   * @param {vec3} out
   * @param {vec3} omega0
   * @param {vec3} torque
   * @param {number} I
   * @param {number} drag
   * @param {number} time
   * @returns {vec3} out
   */
  vec3.exponentialDecay = function (out, omega0, torque, I, drag, time) {
    out[0] = num.exponentialDecay(omega0[0], torque[0], I, drag, time);
    out[1] = num.exponentialDecay(omega0[1], torque[1], I, drag, time);
    out[2] = num.exponentialDecay(omega0[2], torque[2], I, drag, time);
    return out;
  };

  /**
   * Creates a spherical
   * @returns {vec3}
   */
  vec3.createSpherical = function () {
    return vec3.fromValues(0, 0, 1);
  };

  /**
   * Sets a vec3 with cartesian coordinates from spherical coordinates and an optional center point
   * @param {vec3} out       - receiving vec3
   * @param {vec3} spherical - source vec3 with spherical coordinates (phi, theta, radius)
   * @param {vec3} [center]  - Optional center
   * @returns {vec3} out     - receiving vec3
   */
  vec3.fromSpherical = function (out, spherical, center) {
    var phi = spherical[0],
      theta = spherical[1],
      radius = spherical[2];
    var sinPhi = Math.sin(phi);
    out[0] = radius * sinPhi * Math.sin(theta); // x
    out[1] = radius * Math.cos(phi); // y
    out[2] = radius * sinPhi * Math.cos(theta); // z

    if (center) {
      out[0] += center[0];
      out[1] += center[1];
      out[2] += center[2];
    }
    return out;
  };

  /**
   * Gets spherical coordinates from a vector
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.getSpherical = function (out, a) {
    var phi = 0,
      theta = 0,
      radius = vec3.length(a);
    if (radius !== 0) {
      phi = Math.acos(num.clamp(a[1] / radius, -1, 1));
      theta = Math.atan2(a[0], a[2]);
    }
    out[0] = phi;
    out[1] = theta;
    out[2] = radius;
    return out;
  };

  /**
   * Makes a spherical value "safe"
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.makeSphericalSafe = function (out, a) {
    out[0] = Math.max(num.EPSILON, Math.min(Math.PI - num.EPSILON, a[0]));
    out[1] = a[1];
    out[2] = a[2];
    return out;
  };

  /**
   * Checks if all elements are 0
   * @param {vec3} a
   * @returns {boolean}
   */
  vec3.isEmpty = function (a) {
    return a[0] === 0 && a[1] === 0 && a[2] === 0;
  };

  /**
   * The largest of the three components.
   *
   * A reduction to one number, unlike `max`, which is the component-wise maximum
   * of two vectors. Carbon spells it `MaxVectorComponent`, and uses it to reduce a
   * colour to the single value that decides how bright it counts as.
   *
   * @param {vec3} a
   * @returns {Number}
   */
  vec3.maxComponent = function (a) {
    return Math.max(a[0], a[1], a[2]);
  };

  /**
   * Multiplies a vec3 by a scalar
   *
   * @param {vec3} out
   * @param {vec3} a
   * @param {Number} s
   * @returns {vec3} out
   */
  vec3.multiplyScalar = function (out, a, s) {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
  };

  /**
   * Converts from long, lat and radius to a vector
   * @param {vec3} out
   * @param {Number} radius
   * @param {Number} latitude
   * @param {Number} longitude
   * @returns {vec3} out
   */
  vec3.polarToCartesian = function (out, radius, latitude, longitude) {
    out[0] = radius * Math.cos(latitude) * Math.sin(longitude);
    out[1] = radius * Math.sin(latitude);
    out[2] = radius * Math.cos(latitude) * Math.cos(longitude);
    return out;
  };

  /**
   * Projects a world vec3 to screen space with viewport settings
   * @param {vec3} out           - receiving vec3
   * @param {vec3} a             - local vec3
   * @param {mat4} m             - model view projection matrix
   * @param {vec4} viewport      - view port settings (x, y, width, height)
   * @returns {vec3} out         - receiving vec3 (x, y, perspectiveDivide)
   */
  vec3.project = function (out, a, m, viewport) {
    var x = a[0],
      y = a[1],
      z = a[2];
    var outX = m[0] * x + m[4] * y + m[8] * z + m[12],
      outY = m[1] * x + m[5] * y + m[9] * z + m[13],
      perD = m[3] * x + m[7] * y + m[11] * z + m[15];
    var projectionX = (outX / perD + 1) / 2;
    var projectionY = 1 - (outY / perD + 1) / 2;
    out[0] = projectionX * viewport[2] + viewport[0];
    out[1] = projectionY * viewport[3] + viewport[1];
    out[2] = perD;
    return out;
  };

  /**
   * Converts degrees to radians
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.radians = function (out, a) {
    out[0] = num.radians(a[0]);
    out[1] = num.radians(a[1]);
    out[2] = num.radians(a[2]);
    return out;
  };

  /**
   * Converts degrees to unwrapped radians
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3} out
   */
  vec3.radiansUnwrapped = function (out, a) {
    out[0] = num.radiansUnwrapped(a[0]);
    out[1] = num.radiansUnwrapped(a[1]);
    out[2] = num.radiansUnwrapped(a[2]);
    return out;
  };

  /**
   * Sets a vec3 from a scalar
   *
   * @param {vec3} out
   * @param {Number} s
   * @returns {vec3} out
   */
  vec3.setScalar = function (out, s) {
    out[0] = s;
    out[1] = s;
    out[2] = s;
    return out;
  };

  /**
   * Subtracts a scalar from a vec3
   *
   * @param {vec3} out
   * @param {vec3} a
   * @param {Number} s
   * @returns {vec3} out
   */
  vec3.subtractScalar = function (out, a, s) {
    out[0] = a[0] - s;
    out[1] = a[1] - s;
    out[2] = a[2] - s;
    return out;
  };

  /**
   * Unprojects a vec3 with canvas coordinates to world space
   *
   * @param {vec3} out            - receiving vec3
   * @param {vec3} a              - vec3 to unproject
   * @param {mat4} invViewProj    - inverse view projection matrix
   * @param {vec4|Array} viewport - [ x, y, width, height ]
   * @returns {vec3} out
   * @throw On perspective divide error
   */
  vec3.unproject = function (out, a, invViewProj, viewport) {
    var vec4_0 = pool.allocF32(4);
    var x = a[0],
      y = a[1],
      z = a[2];
    vec4_0[0] = (x - viewport[0]) * 2.0 / viewport[2] - 1.0;
    vec4_0[1] = (y - viewport[1]) * 2.0 / viewport[3] - 1.0;
    vec4_0[2] = 2.0 * z - 1.0;
    vec4_0[3] = 1.0;
    transformMat4(vec4_0, vec4_0, invViewProj);
    if (vec4_0[3] === 0.0) {
      pool.freeType(vec4_0);
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      throw new Error("Perspective divide error");
    }
    out[0] = vec4_0[0] / vec4_0[3];
    out[1] = vec4_0[1] / vec4_0[3];
    out[2] = vec4_0[2] / vec4_0[3];
    pool.freeType(vec4_0);
    return out;
  };

  /**
   * Unwraps degrees
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3}
   */
  vec3.unwrapDegrees = function (out, a) {
    out[0] = num.unwrapDegrees(a[0]);
    out[1] = num.unwrapDegrees(a[1]);
    out[2] = num.unwrapDegrees(a[2]);
    return out;
  };

  /**
   * Unwraps radians
   *
   * @param {vec3} out
   * @param {vec3} a
   * @returns {vec3}
   */
  vec3.unwrapRadians = function (out, a) {
    out[0] = num.unwrapRadians(a[0]);
    out[1] = num.unwrapRadians(a[1]);
    out[2] = num.unwrapRadians(a[2]);
    return out;
  };

  /**
   * Sets a vec3 from an array with an optional offset
   * @param {vec3} out
   * @param {TypedArray|Array} array
   * @param {Number} [offset=0]
   * @returns {vec3} out
   */
  vec3.fromArray = function (out, array) {
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    out[0] = array[offset];
    out[1] = array[offset + 1];
    out[2] = array[offset + 2];
    return out;
  };

  /**
   * Sets a vec3 from a mat4 column
   * @param {vec3} out
   * @param {mat4} m
   * @param {Number} index
   * @returns {vec3} out
   */
  vec3.fromMat4Column = function (out, m, index) {
    return vec3.fromArray(out, m, index * 4);
  };

  /**
   * Sets a vec3 from a mat3 column
   * @param {vec3} out
   * @param {mat4} m
   * @param {Number} index
   * @returns {vec3} out
   */
  vec3.fromMat3Column = function (out, m, index) {
    return vec3.fromArray(out, m, index * 3);
  };

  /**
   * Three js
   * Todo: replace with glMatrix
   */
  vec3.applyQuaternion = function (out, a, q) {
    var x = a[0],
      y = a[1],
      z = a[2],
      qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];

    // calculate quat * vector
    var ix = qw * x + qy * z - qz * y,
      iy = qw * y + qz * x - qx * z,
      iz = qw * z + qx * y - qy * x,
      iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
  };
  vec3.add;
    vec3.angle;
    vec3.bezier;
    vec3.ceil;
    vec3.clone;
    vec3.copy;
    vec3.create;
    var cross$1 = vec3.cross;
    vec3.dist;
    vec3.distance;
    vec3.div;
    vec3.divide;
    var dot = vec3.dot;
    vec3.equals;
    vec3.exactEquals;
    vec3.floor;
    vec3.forEach;
    vec3.fromValues;
    vec3.hermite;
    vec3.inverse;
    vec3.len;
    vec3.length;
    vec3.lerp;
    vec3.max;
    vec3.maxComponent;
    vec3.min;
    vec3.mul;
    vec3.multiply;
    vec3.negate;
    vec3.normalize;
    vec3.random;
    vec3.rotateX;
    vec3.rotateY;
    vec3.rotateZ;
    vec3.round;
    vec3.scale;
    vec3.scaleAndAdd;
    vec3.set;
    vec3.slerp;
    vec3.sqrDist;
    vec3.sqrLen;
    vec3.squaredDistance;
    vec3.squaredLength;
    vec3.str;
    vec3.sub;
    vec3.subtract;
    vec3.transformMat3;
    vec3.transformMat4;
    vec3.transformQuat;
    vec3.zero;
    vec3.alloc;
    vec3.unalloc;
    vec3.unallocMany;
    vec3.X_AXIS;
    vec3.Y_AXIS;
    vec3.Z_AXIS;
    vec3.addScalar;
    vec3.degrees;
    vec3.degreesUnwrapped;
    vec3.direction;
    vec3.directionFromQuat;
    vec3.directionFromMat4;
    vec3.divideScalar;
    vec3.euler;
    vec3.exponentialDecay;
    vec3.createSpherical;
    vec3.fromSpherical;
    vec3.getSpherical;
    vec3.makeSphericalSafe;
    vec3.isEmpty;
    vec3.multiplyScalar;
    vec3.polarToCartesian;
    vec3.project;
    vec3.radians;
    vec3.radiansUnwrapped;
    vec3.setScalar;
    vec3.subtractScalar;
    vec3.unproject;
    vec3.unwrapDegrees;
    vec3.unwrapRadians;
    vec3.fromArray;
    vec3.fromMat4Column;
    vec3.fromMat3Column;
    vec3.applyQuaternion;

  /**
   * Tangent-frame helpers backed by @carbonenginejs/runtime/math.
   */

  /**
   * Cross product of two vec3 values.
   *
   * @param {ArrayLike<number>} a Left-hand vector.
   * @param {ArrayLike<number>} b Right-hand vector.
   * @returns {number[]} `a x b`.
   */
  function cross(a, b) {
    return cross$1([0, 0, 0], a, b);
  }
  var tangents = Object.freeze({
    TAU: TANGENT_TAU,
    PI: TANGENT_PI,
    NULL_TANGENT_UNORM,
    cross,
    dot,
    clamp,
    isNull: isNullTangent,
    isNullTangent,
    decode: decodeTangentFrame,
    decodeTangentFrame,
    pack: encodeTangentFrame,
    encode: encodeTangentFrame,
    encodeTangentFrame,
    unpack: unpackMeshTangents$1,
    unpackMeshTangents: unpackMeshTangents$1,
    isPacked,
    generateNormals,
    generateTangents,
    generateBiNormals
  });

  /**
   * Granny State semantic helpers.
   *
   * GSF uses the ordinary Granny container and reflected type tree. These
   * helpers classify and project the reflected GState root without introducing
   * a second container reader.
   */

  function collectGr2References(value) {
    var seen = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
    var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();
    if (!value || typeof value !== "object" || seen.has(value)) return output;
    seen.add(value);
    for (var _ref3 of Object.entries(value)) {
      var _ref2 = _slicedToArray(_ref3, 2);
      var key = _ref2[0];
      var child = _ref2[1];
      if (typeof child === "string" && /file|path|source/i.test(key) && /\.gr2(?:;|$)/i.test(child)) {
        output.add(child);
      } else if (child && typeof child === "object") {
        collectGr2References(child, seen, output);
      }
    }
    return output;
  }

  /** Whether a reflected Granny result has the GState root schema. */
  function isGsfRaw(raw) {
    var _raw$fileInfo, _raw$fileInfo2;
    return !!(raw !== null && raw !== void 0 && (_raw$fileInfo = raw.fileInfo) !== null && _raw$fileInfo !== void 0 && _raw$fileInfo.StateMachine) && Array.isArray((_raw$fileInfo2 = raw.fileInfo) === null || _raw$fileInfo2 === void 0 ? void 0 : _raw$fileInfo2.AnimationSets);
  }

  /** Project a reflected Granny result into a stable GSF-facing document. */
  function projectGsf(raw) {
    var _root$ModelNameHint, _root$ModelIndexHint, _root$RetargetSourceM, _root$RetargetSourceM2, _root$NumUniqueTokeni, _root$EditorData, _root$ExtendedData;
    if (!isGsfRaw(raw)) throw new Error("format-gr2: expected Granny State root schema");
    var root = raw.fileInfo;
    return {
      format: "gsf",
      container: {
        family: "granny",
        revision: raw.version,
        sectionCount: raw.secCount
      },
      character: {
        modelNameHint: (_root$ModelNameHint = root.ModelNameHint) != null ? _root$ModelNameHint : null,
        modelIndexHint: (_root$ModelIndexHint = root.ModelIndexHint) != null ? _root$ModelIndexHint : -1,
        retargetSourceModelNameHint: (_root$RetargetSourceM = root.RetargetSourceModelNameHint) != null ? _root$RetargetSourceM : null,
        retargetSourceModelIndexHint: (_root$RetargetSourceM2 = root.RetargetSourceModelIndexHint) != null ? _root$RetargetSourceM2 : -1
      },
      stateMachine: root.StateMachine,
      animationSlots: root.AnimationSlots,
      animationSets: root.AnimationSets.map((set, index) => ({
        index,
        sourceFileReferences: [...collectGr2References(set)],
        raw: set
      })),
      uniqueTokenCount: (_root$NumUniqueTokeni = root.NumUniqueTokenized) != null ? _root$NumUniqueTokeni : 0,
      editorData: (_root$EditorData = root.EditorData) != null ? _root$EditorData : null,
      extendedData: (_root$ExtendedData = root.ExtendedData) != null ? _root$ExtendedData : null
    };
  }

  /** Build a lightweight GSF support and dependency summary. */
  function inspectGsfRaw(raw) {
    var value = projectGsf(raw);
    return {
      format: "gsf",
      supported: true,
      revision: value.container.revision,
      sectionCount: value.container.sectionCount,
      animationSlotCount: value.animationSlots.length,
      animationSetCount: value.animationSets.length,
      animationFileReferences: [...new Set(value.animationSets.flatMap(set => set.sourceFileReferences))]
    };
  }

  /**
   * Error raised when shared binary format bytes cannot be decoded safely.
   *
   * Format-specific readers substitute their own error class through the
   * `ReadError` static on `CjsByteReader`, so this type is the fallback for
   * readers that do not need a distinguishable name.
   */

  /**
   * Error raised when shared binary format bytes cannot be encoded safely.
   */
  class CjsFormatWriteError extends Error {
    /**
     * Creates a write error with structured writer-state details.
     *
     * @param {string} message Human-readable failure reason.
     * @param {object} [details] Extra writer state such as offset or value.
     */
    constructor(message) {
      var details = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      super(message);
      this.name = "CjsFormatWriteError";
      this.code = "CJS_FORMAT_WRITE_ERROR";
      this.details = details;
    }
  }

  /** Normalize one xyzw quaternion and canonicalize signed zeroes. */
  function normalizeQuaternion(value) {
    var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "quaternion";
    var length = Math.hypot(value[0], value[1], value[2], value[3]);
    if (!(length > 0)) throw new Error("".concat(label, " contains a zero quaternion"));
    return value.slice(0, 4).map(component => {
      var normalized = component / length;
      return normalized === 0 ? 0 : normalized;
    });
  }

  /** Normalize flat xyzw controls and keep adjacent keys in one hemisphere. */
  function normalizeQuaternionSeries(values) {
    var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "quaternion curve";
    var previous = null;
    var _loop = function () {
      var current = normalizeQuaternion(values.slice(index, index + 4), label);
      if (previous) {
        var dot = previous.reduce((sum, value, component) => sum + value * current[component], 0);
        if (dot < 0) {
          for (var component = 0; component < 4; component++) current[component] *= -1;
        }
      }
      for (var _component = 0; _component < 4; _component++) {
        if (current[_component] === 0) current[_component] = 0;
      }
      for (var _component2 = 0; _component2 < 4; _component2++) values[index + _component2] = current[_component2];
      previous = current;
    };
    for (var index = 0; index < values.length; index += 4) {
      _loop();
    }
    return values;
  }

  /** Return the shortest angular distance between two normalized xyzw quaternions. */
  function quaternionAngularDifference(a, b) {
    var dot = Math.min(1, Math.abs(a.reduce((sum, value, index) => sum + value * b[index], 0)));
    return 2 * Math.acos(dot);
  }
  function polynomialValue(coefficients, value) {
    var result = 0;
    for (var index = coefficients.length - 1; index >= 0; index--) {
      result = result * value + coefficients[index];
    }
    return result;
  }
  function normalizedPolynomial(coefficients) {
    var scale = 0;
    for (var coefficient of coefficients) scale = Math.max(scale, Math.abs(coefficient));
    if (!(scale > 0)) return [0];
    var result = coefficients.map(value => value / scale);
    while (result.length > 1 && Math.abs(result.at(-1)) <= 1e-12) result.pop();
    return result;
  }
  function multiplyPolynomials(left, right) {
    var result = new Array(left.length + right.length - 1).fill(0);
    for (var l = 0; l < left.length; l++) {
      for (var r = 0; r < right.length; r++) result[l + r] += left[l] * right[r];
    }
    return result;
  }
  function addPolynomials(left, right) {
    var rightScale = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var result = new Array(Math.max(left.length, right.length)).fill(0);
    for (var index = 0; index < result.length; index++) {
      var _left$index, _right$index;
      result[index] = ((_left$index = left[index]) != null ? _left$index : 0) + ((_right$index = right[index]) != null ? _right$index : 0) * rightScale;
    }
    return result;
  }
  function derivativePolynomial(coefficients) {
    return coefficients.slice(1).map((value, index) => value * (index + 1));
  }
  function polynomialRootsInUnitInterval(coefficients) {
    var polynomial = normalizedPolynomial(coefficients);
    var degree = polynomial.length - 1;
    if (degree <= 0) return [];
    if (degree === 1) {
      var root = -polynomial[0] / polynomial[1];
      return root >= 0 && root <= 1 ? [root] : [];
    }
    var critical = polynomialRootsInUnitInterval(derivativePolynomial(polynomial));
    var boundaries = [0, ...critical.filter(value => value > 0 && value < 1), 1].sort((a, b) => a - b);
    var roots = [];
    var append = value => {
      if (!roots.some(existing => Math.abs(existing - value) <= 1e-9)) roots.push(value);
    };
    for (var boundary of boundaries) {
      if (Math.abs(polynomialValue(polynomial, boundary)) <= 1e-9) append(boundary);
    }
    for (var index = 1; index < boundaries.length; index++) {
      var left = boundaries[index - 1];
      var right = boundaries[index];
      var leftValue = polynomialValue(polynomial, left);
      var rightValue = polynomialValue(polynomial, right);
      if (leftValue === 0 || rightValue === 0 || Math.sign(leftValue) === Math.sign(rightValue)) continue;
      for (var iteration = 0; iteration < 64; iteration++) {
        var middle = (left + right) * 0.5;
        var middleValue = polynomialValue(polynomial, middle);
        if (Math.sign(leftValue) === Math.sign(middleValue)) {
          left = middle;
          leftValue = middleValue;
        } else {
          right = middle;
        }
      }
      append((left + right) * 0.5);
    }
    return roots;
  }
  function dotPolynomial(startA, deltaA, startB, deltaB) {
    var constant = 0;
    var linear = 0;
    var quadratic = 0;
    for (var index = 0; index < 4; index++) {
      constant += startA[index] * startB[index];
      linear += deltaA[index] * startB[index] + startA[index] * deltaB[index];
      quadratic += deltaA[index] * deltaB[index];
    }
    return [constant, linear, quadratic];
  }
  function scaledQuaternionSegment(start, end) {
    var scale = 0;
    for (var value of start) scale = Math.max(scale, Math.abs(value));
    for (var _value of end) scale = Math.max(scale, Math.abs(_value));
    if (!(scale > 0)) throw new Error("quaternion segment contains only zero quaternions");
    var scaledStart = start.map(value => value / scale);
    return {
      start: scaledStart,
      delta: end.map((value, index) => value / scale - scaledStart[index])
    };
  }

  /**
   * Find the maximum angular error between two normalized-linear quaternion segments.
   *
   * The stationary points come from the exact derivative polynomial of the
   * squared normalized dot product, avoiding fixed-grid tolerance gaps.
   *
   * @param {number[]} startA First segment start quaternion.
   * @param {number[]} endA First segment end quaternion.
   * @param {number[]} startB Second segment start quaternion.
   * @param {number[]} endB Second segment end quaternion.
   * @returns {number} Maximum shortest angular difference in radians.
   */
  function maximumQuaternionLerpAngularDifference(startA, endA, startB, endB) {
    var a = scaledQuaternionSegment(startA, endA);
    var b = scaledQuaternionSegment(startB, endB);
    var n = dotPolynomial(a.start, a.delta, b.start, b.delta);
    var aa = dotPolynomial(a.start, a.delta, a.start, a.delta);
    var bb = dotPolynomial(b.start, b.delta, b.start, b.delta);
    var aabb = multiplyPolynomials(aa, bb);
    var derivativeNumerator = addPolynomials(multiplyPolynomials(derivativePolynomial(n), aabb).map(value => value * 2), multiplyPolynomials(n, addPolynomials(multiplyPolynomials(derivativePolynomial(aa), bb), multiplyPolynomials(aa, derivativePolynomial(bb)))), -1);
    var candidates = [0, 1, ...polynomialRootsInUnitInterval(n), ...polynomialRootsInUnitInterval(derivativeNumerator)];
    var maximum = 0;
    var _loop2 = function (time) {
      var qa = a.start.map((value, index) => value + a.delta[index] * time);
      var qb = b.start.map((value, index) => value + b.delta[index] * time);
      maximum = Math.max(maximum, quaternionAngularDifference(normalizeQuaternion(qa, "first quaternion segment"), normalizeQuaternion(qb, "second quaternion segment")));
    };
    for (var time of candidates) {
      _loop2(time);
    }
    return maximum;
  }

  /** Representative interior fractions used to validate quaternion segments. */
  var QUATERNION_SEGMENT_SAMPLE_FRACTIONS = Object.freeze([0.25, 0.5, 0.75]);

  /** Invert a finite 4x4 row-major matrix with Gauss-Jordan elimination. */
  function invertMatrix4(matrix) {
    if (!Array.isArray(matrix) || matrix.length !== 16 || matrix.some(value => !Number.isFinite(value))) {
      throw new Error("CMF matrix must contain 16 finite values");
    }
    var source = [matrix.slice(0, 4), matrix.slice(4, 8), matrix.slice(8, 12), matrix.slice(12, 16)];
    var inverse = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    for (var column = 0; column < 4; column++) {
      var pivotRow = column;
      for (var row = column + 1; row < 4; row++) {
        if (Math.abs(source[row][column]) > Math.abs(source[pivotRow][column])) pivotRow = row;
      }
      var pivot = source[pivotRow][column];
      if (Math.abs(pivot) < Number.EPSILON) throw new Error("CMF matrix is not invertible");
      if (pivotRow !== column) {
        var _ref = [source[pivotRow], source[column]];
        source[column] = _ref[0];
        source[pivotRow] = _ref[1];
        var _ref2 = [inverse[pivotRow], inverse[column]];
        inverse[column] = _ref2[0];
        inverse[pivotRow] = _ref2[1];
      }
      for (var index = 0; index < 4; index++) {
        source[column][index] /= pivot;
        inverse[column][index] /= pivot;
      }
      for (var _row = 0; _row < 4; _row++) {
        if (_row === column) continue;
        var factor = source[_row][column];
        for (var _index = 0; _index < 4; _index++) {
          source[_row][_index] -= factor * source[column][_index];
          inverse[_row][_index] -= factor * inverse[column][_index];
        }
      }
    }
    return inverse.flat().map(value => Math.abs(value) < 1e-12 ? 0 : value);
  }

  /** Multiply two flat row-major 4x4 matrices. */
  function multiplyMatrix4(a, b) {
    if (!Array.isArray(a) || a.length !== 16 || !Array.isArray(b) || b.length !== 16) {
      throw new Error("CMF matrix multiplication requires two 4x4 matrices");
    }
    var output = new Array(16).fill(0);
    for (var row = 0; row < 4; row++) {
      for (var column = 0; column < 4; column++) {
        for (var index = 0; index < 4; index++) {
          output[row * 4 + column] += a[row * 4 + index] * b[index * 4 + column];
        }
      }
    }
    return output;
  }

  /** Compose CMF row-vector TRS with translation in elements 12..14. */
  function composeCmfTransform(position, rotation, scale) {
    if (![position, scale].every(value => Array.isArray(value) && value.length === 3) || [...position, ...scale].some(value => !Number.isFinite(value))) {
      throw new Error("CMF transform position and scale must contain three finite values");
    }
    var _normalizeQuaternion = normalizeQuaternion(rotation, "CMF transform rotation"),
      _normalizeQuaternion2 = _slicedToArray(_normalizeQuaternion, 4),
      x = _normalizeQuaternion2[0],
      y = _normalizeQuaternion2[1],
      z = _normalizeQuaternion2[2],
      w = _normalizeQuaternion2[3];
    var x2 = x + x,
      y2 = y + y,
      z2 = z + z,
      xx = x * x2,
      xy = x * y2,
      xz = x * z2,
      yy = y * y2,
      yz = y * z2,
      zz = z * z2,
      wx = w * x2,
      wy = w * y2,
      wz = w * z2,
      _scale = _slicedToArray(scale, 3),
      sx = _scale[0],
      sy = _scale[1],
      sz = _scale[2];
    return [(1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0, (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0, (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0, position[0], position[1], position[2], 1];
  }

  /** Resolve a mesh morph name to its animation channel name using Carbon's Shape suffix convention. */
  function morphAnimationTargetName(name) {
    // AddMorphWeightChannels strips one suffix only when a non-empty name remains.
    return name.length > 5 && name.endsWith("Shape") ? name.slice(0, -5) : name;
  }
  function vertexCountOf(vertex) {
    for (var _ref3 of [["position", 3], ["normal", 3], ["tangent", 3], ["binormal", 3], ["texcoord0", 2], ["texcoord1", 2], ["color0", 4], ["blendIndice", 4], ["blendWeight", 4]]) {
      var _vertex$name;
      var _ref2 = _slicedToArray(_ref3, 2);
      var name = _ref2[0];
      var width = _ref2[1];
      var values = (_vertex$name = vertex === null || vertex === void 0 ? void 0 : vertex[name]) != null ? _vertex$name : [];
      if (values.length) return Math.floor(values.length / width);
    }
    return 0;
  }
  function sourceCountOf(target, fallback) {
    return Array.isArray(target.vertexIndices) ? target.vertexIndices.length : vertexCountOf(target.vertex) || fallback;
  }
  function channelWidth(values, count, channel) {
    if (!values.length) return 0;
    if (!count || values.length % count) {
      throw new Error("CMF morph ".concat(channel, " length ").concat(values.length, " does not match ").concat(count, " vertices"));
    }
    return values.length / count;
  }
  function baseChannelValues(baseVertex, channel, vertexCount, width) {
    var _baseVertex$channel;
    var base = (_baseVertex$channel = baseVertex === null || baseVertex === void 0 ? void 0 : baseVertex[channel]) != null ? _baseVertex$channel : [];
    if (!base.length) return new Array(vertexCount * width).fill(0);
    var baseWidth = channelWidth(base, vertexCount, channel);
    var values = new Array(vertexCount * width).fill(0);
    for (var row = 0; row < vertexCount; row++) {
      for (var component = 0; component < width; component++) {
        var _base;
        values[row * width + component] = (_base = base[row * baseWidth + component]) != null ? _base : 0;
      }
    }
    return values;
  }

  /** Canonicalize a shared morph target to full per-vertex CMF absolute channels. */
  function canonicalMorphVertex(baseVertex, target) {
    var _target$vertex, _baseVertex$position;
    var specs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var explicitVertexCount = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var vertexCount = explicitVertexCount != null ? explicitVertexCount : vertexCountOf(baseVertex);
    var sourceVertex = (_target$vertex = target.vertex) != null ? _target$vertex : {};
    var sourceCount = sourceCountOf(target, vertexCount);
    var indices = Array.isArray(target.vertexIndices) ? target.vertexIndices : null;
    var output = {};
    var channels = specs != null ? specs : [...(baseVertex !== null && baseVertex !== void 0 && (_baseVertex$position = baseVertex.position) !== null && _baseVertex$position !== void 0 && _baseVertex$position.length ? [{
      name: "position",
      elementCount: 3
    }] : []), ...Object.keys(sourceVertex).filter(name => name !== "position").map(name => ({
      name
    }))];
    for (var spec of channels) {
      var _sourceVertex$channel, _baseVertex$channel2, _spec$elementCount;
      var channel = spec.name;
      var source = (_sourceVertex$channel = sourceVertex[channel]) != null ? _sourceVertex$channel : [];
      var base = (_baseVertex$channel2 = baseVertex === null || baseVertex === void 0 ? void 0 : baseVertex[channel]) != null ? _baseVertex$channel2 : [];
      if (!base.length && source.length) {
        throw new Error("CMF morph ".concat(channel, " is absent from the base vertex declaration"));
      }
      if (!Array.isArray(source)) throw new TypeError("CMF morph ".concat(channel, " must be an array"));
      var width = (_spec$elementCount = spec.elementCount) != null ? _spec$elementCount : source.length ? channelWidth(source, sourceCount, channel) : channelWidth(base, vertexCount, channel);
      var values = baseChannelValues(baseVertex, channel, vertexCount, width);
      if (!source.length) {
        output[channel] = values;
        continue;
      }
      if (source.length !== sourceCount * width) {
        throw new Error("CMF morph ".concat(channel, " length ").concat(source.length, " does not match ").concat(sourceCount, " vec").concat(width, " values"));
      }
      var baseWidth = base.length ? channelWidth(base, vertexCount, channel) : width;
      for (var row = 0; row < sourceCount; row++) {
        var vertexIndex = indices ? indices[row] : row;
        if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= vertexCount) {
          throw new Error("CMF morph ".concat(channel, " vertex index ").concat(vertexIndex, " is outside 0..").concat(vertexCount - 1));
        }
        for (var component = 0; component < width; component++) {
          var _base2;
          var sourceValue = source[row * width + component];
          var baseValue = (_base2 = base[vertexIndex * baseWidth + component]) != null ? _base2 : 0;
          values[vertexIndex * width + component] = target.dataIsDeltas === false ? sourceValue : sourceValue + baseValue;
        }
      }
      output[channel] = values;
    }
    return output;
  }

  /** Maximum Euclidean displacement between flat vec3 absolute and base channels. */
  function maxMorphDisplacement() {
    var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var basePosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var maximum = 0;
    for (var index = 0; index < position.length; index += 3) {
      var _position$index, _basePosition$index, _position, _basePosition, _position2, _basePosition2;
      maximum = Math.max(maximum, Math.hypot(((_position$index = position[index]) != null ? _position$index : 0) - ((_basePosition$index = basePosition[index]) != null ? _basePosition$index : 0), ((_position = position[index + 1]) != null ? _position : 0) - ((_basePosition = basePosition[index + 1]) != null ? _basePosition : 0), ((_position2 = position[index + 2]) != null ? _position2 : 0) - ((_basePosition2 = basePosition[index + 2]) != null ? _basePosition2 : 0)));
    }
    return maximum;
  }

  /**
   * GR2-shaped skeleton/animation conversion into CMF-native data.
   *
   * Input is the GR2 JSON shape emitted by the GR2 reader. Packed Granny curves
   * and already-decoded `{ knots, controls, dimension, degree }` curves are both
   * accepted without mutating the source graph.
   *
   * CMF curves support Step/Linear interpolation only, so Granny curves of
   * degree 2 are resampled (non-uniform quadratic B-spline evaluated via de
   * Boor) at a uniform rate; degree ≤ 1 knots/controls convert exactly.
   * CMF has no shear channel, so authored Granny shear is rejected rather than
   * discarded. Inverse bind matrices are rebuilt from the rest pose hierarchy
   * in the row-major, translation-in-elements-12..14 layout Granny uses.
   */

  function convertError(message) {
    var error = new Error("CMF gr2 convert: ".concat(message));
    error.code = "CJS_FORMAT_WRITE_ERROR";
    return error;
  }

  /**
   * Test for a GR2-shaped skeleton (bones as objects with name/parentIndex).
   *
   * @param {object} skeleton Candidate skeleton.
   * @returns {boolean} True when GR2-shaped.
   */
  function isGr2Skeleton(skeleton) {
    return !!skeleton && Array.isArray(skeleton.bones) && skeleton.bones.length > 0 && typeof skeleton.bones[0] === "object" && skeleton.bones[0] !== null && typeof skeleton.bones[0].name === "string";
  }

  /**
   * Test for a GR2-shaped animation (carries trackGroups).
   *
   * @param {object} animation Candidate animation.
   * @returns {boolean} True when GR2-shaped.
   */
  function isGr2Animation(animation) {
    return !!animation && Array.isArray(animation.trackGroups);
  }
  var FLOAT32_EPSILON = 2 ** -23;
  var SCALE_SHEAR_RELATIVE_EPSILONS = 4;
  var SCALE_SHEAR_OFF_DIAGONALS = Object.freeze([1, 2, 3, 5, 6, 7]);
  function containsScaleShear(values) {
    var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var magnitude = 1;
    for (var component = 0; component < 9; component++) {
      var _values;
      magnitude = Math.max(magnitude, Math.abs((_values = values[offset + component]) != null ? _values : 0));
    }
    var tolerance = SCALE_SHEAR_RELATIVE_EPSILONS * FLOAT32_EPSILON * magnitude;
    return SCALE_SHEAR_OFF_DIAGONALS.some(component => {
      var _values2;
      return Math.abs((_values2 = values[offset + component]) != null ? _values2 : 0) > tolerance;
    });
  }
  function boneRestTransform(bone) {
    var scaleShear = bone.scaleShear || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    // Granny stores Float32 scale/shear. Transform decomposition leaves a few
    // relative ULPs off-diagonal even when the authored result is diagonal.
    if (containsScaleShear(scaleShear)) {
      throw convertError("bone \"".concat(bone.name || "", "\" rest transform contains shear"));
    }
    return {
      position: (bone.position || [0, 0, 0]).slice(0, 3),
      rotation: (bone.orientation || [0, 0, 0, 1]).slice(0, 4),
      scale: [scaleShear[0], scaleShear[4], scaleShear[8]]
    };
  }

  /**
   * Convert a GR2-shaped skeleton into a CMF-native skeleton.
   *
   * @param {object} skeleton GR2 skeleton `{ name, bones: [{ name, parentIndex, position?, orientation?, scaleShear? }] }`.
   * @returns {object} CMF-native skeleton with rebuilt inverse bind matrices.
   */
  function convertGr2Skeleton(skeleton) {
    var bones = skeleton.bones || [];
    var boneNames = bones.map(bone => bone.name || "");
    if (new Set(boneNames).size !== boneNames.length) {
      throw convertError("skeleton \"".concat(skeleton.name || "", "\" contains duplicate bone names"));
    }
    var worldTransforms = new Array(bones.length);
    var restTransforms = new Array(bones.length);
    var parents = new Array(bones.length);
    for (var i = 0; i < bones.length; i++) {
      var bone = bones[i];
      var parentIndex = typeof bone.parentIndex === "number" ? bone.parentIndex : -1;
      if (parentIndex >= i && parentIndex !== 0xffffffff) {
        throw convertError("bone ".concat(i, " (").concat(bone.name, ") has forward parent index ").concat(parentIndex));
      }
      parents[i] = parentIndex < 0 || parentIndex === 0xffffffff ? 0xffffffff : parentIndex;
      var rest = boneRestTransform(bone);
      restTransforms[i] = rest;
      var local = composeCmfTransform(rest.position, rest.rotation, rest.scale);
      worldTransforms[i] = parents[i] === 0xffffffff ? local : multiplyMatrix4(local, worldTransforms[parents[i]]);
    }
    var suppliedInverseBinds = Array.isArray(skeleton.invBindTransforms) ? skeleton.invBindTransforms : [];
    if (suppliedInverseBinds.length && suppliedInverseBinds.length !== bones.length) {
      throw convertError("skeleton \"".concat(skeleton.name || "", "\" inverse bind count does not match its bones"));
    }
    var invBindTransforms = worldTransforms.map((world, index) => {
      var supplied = suppliedInverseBinds[index];
      if (supplied === null || supplied === undefined) return invertMatrix4(world);
      if (!Array.isArray(supplied) || supplied.length !== 16 || supplied.some(value => !Number.isFinite(value))) {
        throw convertError("skeleton \"".concat(skeleton.name || "", "\" inverse bind ").concat(index, " is not a finite matrix"));
      }
      return supplied.slice();
    });
    return {
      name: skeleton.name || "",
      bones: boneNames,
      parents,
      restTransforms,
      invBindTransforms,
      boneMasks: []
    };
  }

  /**
   * Evaluate a decoded Granny curve at `time` (clamped, non-cycling).
   *
   * Degree ≤ 0 steps, degree 1 lerps, degree 2 evaluates the non-uniform
   * quadratic B-spline via de Boor over the Granny knot convention, including
   * the reference evaluator's next-knot wrap at the final segment (the segment
   * after the last knot borrows the first knot advanced by `duration`).
   *
   * @param {object} curve Decoded curve `{ knots, controls, dimension, degree }`.
   * @param {number} time Sample time.
   * @param {Array<number>} out Output vector (dimension entries).
   * @param {number} [duration] Animation duration for the final-segment wrap;
   *   defaults to the last knot.
   * @returns {Array<number>} The `out` vector.
   */
  function evaluateDecodedCurve(curve, time, out) {
    var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    return sampleDecodedCurve(out, curve, time, false, duration, {
      keyframed: curve.keyframed === true || curve.format === FORMAT_DA_KEYFRAMES_32F
    });
  }
  function validateScaleShearCurve(curve, track) {
    for (var offset = 0; offset < curve.controls.length; offset += 9) {
      if (containsScaleShear(curve.controls, offset)) {
        throw convertError("track \"".concat(track, "\" scaleShear curve contains shear"));
      }
    }
  }
  function skeletonBoneNames(skeleton) {
    return new Set(((skeleton === null || skeleton === void 0 ? void 0 : skeleton.bones) || []).map(bone => typeof bone === "string" ? bone : (bone === null || bone === void 0 ? void 0 : bone.name) || ""));
  }
  function meshBoneBindingNames(mesh) {
    return ((mesh === null || mesh === void 0 ? void 0 : mesh.boneBindings) || []).map(binding => (binding === null || binding === void 0 ? void 0 : binding.name) || "");
  }
  function meshHasBoneIndices(mesh) {
    var _mesh$vertex$blendInd, _mesh$vertex, _mesh$lods;
    if (((_mesh$vertex$blendInd = mesh === null || mesh === void 0 || (_mesh$vertex = mesh.vertex) === null || _mesh$vertex === void 0 ? void 0 : _mesh$vertex.blendIndice) != null ? _mesh$vertex$blendInd : []).length) return true;
    return ((_mesh$lods = mesh === null || mesh === void 0 ? void 0 : mesh.lods) != null ? _mesh$lods : []).some(lod => {
      var _lod$vertex$blendIndi, _lod$vertex;
      return ((_lod$vertex$blendIndi = lod === null || lod === void 0 || (_lod$vertex = lod.vertex) === null || _lod$vertex === void 0 ? void 0 : _lod$vertex.blendIndice) != null ? _lod$vertex$blendIndi : []).length > 0;
    });
  }
  function skeletonContainsBindings(names, bindings) {
    return bindings.every(name => names.has(name));
  }
  function floatBytes(values) {
    return Array.from(new Uint8Array(new Float32Array(values).buffer));
  }
  function isIdentityValue(values, dimension) {
    var identity = [0, 0, 0, 1];
    if (!identity) return false;
    return values.every((value, index) => Math.abs(value - identity[index % 4]) < 1e-7);
  }
  function diagonalFromScaleShear(controls, knotIndex) {
    return [controls[knotIndex * 9], controls[knotIndex * 9 + 4], controls[knotIndex * 9 + 8]];
  }
  function decodeTrackCurve(curve, expectedDimension, track, kind) {
    var _curve$error;
    if (!curve) return null;
    var curveError = (_curve$error = curve.error) != null ? _curve$error : curve.Error;
    if (curveError === "no curve data") return null;
    if (curveError) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve: ").concat(curveError));
    }
    var decoded;
    try {
      if (Array.isArray(curve.knots) && Array.isArray(curve.controls) && curve.dimension) {
        decoded = {
          knots: curve.knots.slice(),
          controls: curve.controls.slice(),
          degree: curve.degree | 0,
          dimension: curve.dimension | 0,
          preserveIdentity: curve.preserveIdentity === true
        };
      } else if (typeof curve.format === "number") {
        decoded = decodeCurve(curve, expectedDimension);
      } else {
        throw new Error("curve has neither decoded values nor a packed format");
      }
    } catch (error) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve: ").concat(error.message));
    }
    if (decoded.dimension !== expectedDimension) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve dimension ").concat(decoded.dimension, " does not match ").concat(expectedDimension));
    }
    if (!decoded.knots.length || !decoded.controls.length || decoded.controls.length % decoded.dimension) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve decoded to invalid control data"));
    }
    if (decoded.knots.some(value => !Number.isFinite(value)) || decoded.controls.some(value => !Number.isFinite(value))) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve contains non-finite values"));
    }
    for (var index = 1; index < decoded.knots.length; index++) {
      if (decoded.knots[index] < decoded.knots[index - 1] || decoded.degree <= 1 && decoded.knots[index] === decoded.knots[index - 1]) {
        throw convertError("track \"".concat(track, "\" ").concat(kind, " curve knots have invalid ordering"));
      }
    }
    if (curve.format !== FORMAT_DA_KEYFRAMES_32F && decoded.knots.length !== decoded.controls.length / decoded.dimension) {
      throw convertError("track \"".concat(track, "\" ").concat(kind, " curve knot and control counts differ"));
    }
    return _objectSpread2(_objectSpread2({}, decoded), {}, {
      format: curve.format,
      keyframed: curve.format === FORMAT_DA_KEYFRAMES_32F
    });
  }
  function normalizeQuaternionValues(values) {
    try {
      return normalizeQuaternionSeries(values, "rotation curve");
    } catch (error) {
      throw convertError(error.message);
    }
  }
  function convertCurve$1(curve, targetDimension, duration, sampleRate) {
    var quaternion = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var dimension = curve.dimension;
    var degree = curve.degree | 0;
    var knotCount = curve.knots.length;
    var controlCount = curve.controls.length / dimension;
    var extract = targetDimension === 3 && dimension === 9 ? index => diagonalFromScaleShear(curve.controls, index) : index => curve.controls.slice(index * dimension, index * dimension + targetDimension);
    if (curve.keyframed) {
      var count = duration > 0 ? controlCount : 1;
      var knots = new Array(count);
      var _values3 = [];
      for (var i = 0; i < count; i++) {
        knots[i] = i * duration / controlCount;
        _values3.push(...extract(i));
      }
      if (quaternion) normalizeQuaternionValues(_values3);
      return {
        valueDimension: targetDimension,
        interpolation: "Step",
        knotType: "Float32",
        valueType: "Float32",
        knotCount: count,
        knots: floatBytes(knots),
        values: floatBytes(_values3),
        plainValues: _values3
      };
    }
    if (knotCount <= 1 || controlCount <= 1) {
      var _curve$knots$;
      var _values4 = extract(0);
      if (quaternion) normalizeQuaternionValues(_values4);
      return {
        valueDimension: targetDimension,
        interpolation: "Step",
        knotType: "Float32",
        valueType: "Float32",
        knotCount: 1,
        knots: floatBytes([(_curve$knots$ = curve.knots[0]) != null ? _curve$knots$ : 0]),
        values: floatBytes(_values4),
        plainValues: _values4
      };
    }
    if (degree <= 1) {
      var _values5 = [];
      for (var _i = 0; _i < knotCount; _i++) _values5.push(...extract(_i));
      if (quaternion) normalizeQuaternionValues(_values5);
      return {
        valueDimension: targetDimension,
        interpolation: degree === 0 ? "Step" : "Linear",
        knotType: "Float32",
        valueType: "Float32",
        knotCount,
        knots: floatBytes(curve.knots),
        values: floatBytes(_values5),
        plainValues: _values5
      };
    }

    // degree 2: adaptive resample — seed with the original knots plus a
    // uniform grid, recursively subdividing each interval until linear
    // interpolation tracks the quadratic within `tolerance`; intervals that
    // never converge are true discontinuities and snap to one float32 ULP
    // before the jump knot
    var start = Math.max(curve.knots[0], 0);
    // Quantized Granny degree-2 knots can land slightly beyond the authored
    // animation duration. Those keys shape the visible final segment but are
    // not themselves playable CMF times, so sample through duration and clip
    // the emitted linear approximation there.
    var end = duration > 0 ? duration : curve.knots[knotCount - 1];
    var span = Math.max(end - start, 0);
    var tolerance = 1e-3;
    var minStep = 4e-6;
    var maxDepth = 24;
    var seedTimes = new Set(curve.knots.map(knot => Math.min(Math.max(knot, start), end)));
    var gridCount = Math.max(1, Math.ceil(span * sampleRate));
    for (var _i2 = 0; _i2 <= gridCount; _i2++) seedTimes.add(start + span * _i2 / gridCount);
    var seeds = [...seedTimes].sort((a, b) => a - b);
    var sample = new Array(dimension).fill(0);
    var evaluateAt = time => {
      evaluateDecodedCurve(curve, time, sample, duration);
      return targetDimension === 3 && dimension === 9 ? [sample[0], sample[4], sample[8]] : sample.slice(0, targetDimension);
    };
    var outTimes = [];
    var outValues = [];
    var emit = (time, value) => {
      outTimes.push(time);
      outValues.push(value);
    };
    var fitsLinear = (v0, v1, actual) => {
      if (quaternion) {
        var expected = [(v0[0] + v1[0]) / 2, (v0[1] + v1[1]) / 2, (v0[2] + v1[2]) / 2, (v0[3] + v1[3]) / 2];
        normalizeQuaternionValues(expected);
        var normalizedActual = actual.slice();
        normalizeQuaternionValues(normalizedActual);
        var dot = Math.min(1, Math.abs(expected[0] * normalizedActual[0] + expected[1] * normalizedActual[1] + expected[2] * normalizedActual[2] + expected[3] * normalizedActual[3]));
        return 2 * Math.acos(dot) <= tolerance;
      }
      for (var c = 0; c < targetDimension; c++) {
        if (Math.abs(actual[c] - (v0[c] + v1[c]) / 2) > tolerance) return false;
      }
      return true;
    };
    var refine = (t0, v0, t1, v1, depth) => {
      if (t1 - t0 <= minStep || depth >= maxDepth) {
        var differs = false;
        for (var c = 0; c < targetDimension; c++) {
          if (Math.abs(v0[c] - v1[c]) > tolerance) differs = true;
        }
        if (differs) {
          // discontinuity at the right endpoint (an original knot):
          // hold the left value until one float32 ULP before the jump
          var snapped = float32UlpBefore(t1);
          if (snapped > t0) emit(snapped, v0.slice());
        }
        return;
      }
      var mid = (t0 + t1) / 2;
      var vm = evaluateAt(mid);
      if (fitsLinear(v0, v1, vm)) return;
      refine(t0, v0, mid, vm, depth + 1);
      emit(mid, vm);
      refine(mid, vm, t1, v1, depth + 1);
    };
    var previousValue = evaluateAt(seeds[0]);
    emit(seeds[0], previousValue);
    for (var _i3 = 1; _i3 < seeds.length; _i3++) {
      var value = evaluateAt(seeds[_i3]);
      refine(seeds[_i3 - 1], previousValue, seeds[_i3], value, 0);
      emit(seeds[_i3], value);
      previousValue = value;
    }
    var quantizedTimes = [];
    var quantizedValues = [];
    for (var index = 0; index < outTimes.length; index++) {
      var time = Math.fround(outTimes[index]);
      if (quantizedTimes.length && time === quantizedTimes[quantizedTimes.length - 1]) {
        quantizedValues[quantizedValues.length - 1] = outValues[index];
      } else {
        quantizedTimes.push(time);
        quantizedValues.push(outValues[index]);
      }
    }
    var values = [];
    for (var entry of quantizedValues) values.push(...entry);
    if (quaternion) normalizeQuaternionValues(values);
    return {
      valueDimension: targetDimension,
      interpolation: "Linear",
      knotType: "Float32",
      valueType: "Float32",
      knotCount: quantizedTimes.length,
      knots: floatBytes(quantizedTimes),
      values: floatBytes(values),
      plainValues: values
    };
  }
  var ulpScratch = new Float32Array(1);
  var ulpScratchBits = new Uint32Array(ulpScratch.buffer);
  function float32UlpBefore(value) {
    if (!(value > 0)) return value;
    ulpScratch[0] = value;
    ulpScratchBits[0] -= 1;
    return ulpScratch[0];
  }

  /**
   * Convert a GR2-shaped animation into a CMF-native animation.
   *
   * @param {object} animation GR2 animation with decoded curves.
   * @param {object} [options] `sampleRate` (Hz, default 30) for degree-2 resampling;
   * `dropEmpty` returns null when filtering leaves no channels.
   * @returns {object|null} CMF-native animation with channels and curves, or null when requested.
   */
  function convertGr2Animation(animation) {
    var _options$sampleRate, _animation$duration;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var sampleRate = (_options$sampleRate = options.sampleRate) != null ? _options$sampleRate : 30;
    var morphTargetNames = options.morphTargetNames;
    var duration = (_animation$duration = animation.duration) != null ? _animation$duration : 0;
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
      throw convertError("sampleRate must be a positive finite number");
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw convertError("animation \"".concat(animation.name || "", "\" duration must be positive and finite"));
    }
    var channels = [];
    var curves = [];
    var channelKeys = new Set();
    var addChannel = function (target, targetType, decoded, targetDimension) {
      var tolerateDuplicate = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      // Granny's truncated reciprocal knot scale can decode the terminal
      // knot slightly past a positive animation duration. Carbon treats the
      // duration as the playable boundary and CMF permits such finite,
      // ascending knots, so preserve them for exact degree-0/1 conversion.
      // A curve that starts outside the playable interval is still invalid;
      // zero-duration curves cannot carry a later knot.
      if (!decoded.keyframed && (decoded.knots[0] < 0 || decoded.knots[0] > duration || duration === 0 && decoded.knots[decoded.knots.length - 1] > duration)) {
        throw convertError("animation \"".concat(animation.name || "", "\" ").concat(targetType, " target \"").concat(target, "\" has keys outside its duration"));
      }
      if (decoded.keyframed && duration === 0 && decoded.controls.length > decoded.dimension) {
        throw convertError("animation \"".concat(animation.name || "", "\" keyframed target \"").concat(target, "\" has multiple controls at zero duration"));
      }
      var key = "".concat(targetType, "\0").concat(target);
      if (channelKeys.has(key)) {
        // A repeated name is a genuine conflict for a bone channel: two
        // curves would drive one bone and neither wins.
        //
        // It is NORMAL for a Granny vector track. Those carry rig driver
        // channels - real ship hulls ship `ikRotateX` sixteen times and
        // `blendAim1` twice, one per driven bone - and the name is a
        // channel label rather than a key. Carbon simply scans for the
        // first match and returns
        // (trinity/trinity/Curves/Tr2GrannyVectorTrack.cpp:41-54), never
        // reaching the later ones, so keeping the first reproduces its
        // behaviour exactly.
        //
        // Rejecting them cost five real hull variants - cc1_t1, conf5_t1,
        // mc2_t2c, mf2_t1 and mf2_t2b, each with its _lowdetail sibling -
        // which could not be decoded at all.
        if (tolerateDuplicate) return;
        throw convertError("animation \"".concat(animation.name || "", "\" contains duplicate ").concat(targetType, " target \"").concat(target, "\""));
      }
      var converted = convertCurve$1(decoded, targetDimension, duration, sampleRate, targetType === "BoneRotation");
      // constant identity channels carry no information
      if (!options.preserveIdentity && !decoded.preserveIdentity && converted.knotCount === 1 && targetType === "BoneRotation" && isIdentityValue(converted.plainValues)) return;
      if (!options.preserveIdentity && !decoded.preserveIdentity && converted.knotCount === 1 && targetType === "BoneScale" && converted.plainValues.every(value => Math.abs(value - 1) < 1e-7)) return;
      delete converted.plainValues;
      channelKeys.add(key);
      channels.push({
        target,
        targetType,
        curveIndex: curves.length
      });
      curves.push(converted);
    };
    for (var trackGroup of animation.trackGroups || []) {
      for (var track of trackGroup.transformTracks || []) {
        var position = decodeTrackCurve(track.position, 3, track.name, "position");
        var orientation = decodeTrackCurve(track.orientation, 4, track.name, "orientation");
        var scaleShear = decodeTrackCurve(track.scaleShear, 9, track.name, "scaleShear");
        if (position) addChannel(track.name, "BonePosition", position, 3);
        if (orientation) addChannel(track.name, "BoneRotation", orientation, 4);
        if (scaleShear) {
          validateScaleShearCurve(scaleShear, track.name);
          addChannel(track.name, "BoneScale", scaleShear, 3);
        }
      }
      for (var _track of trackGroup.vectorTracks || []) {
        var _track$name, _track$dimension, _track$valueCurve;
        // A Granny vector track is a generic numeric-property carrier.
        // Only a name resolving to geometry in this conversion is a CMF
        // MorphTarget channel; Maya bind/camera metadata is not.
        if (morphTargetNames && !morphTargetNames.has((_track$name = _track.name) != null ? _track$name : "")) continue;
        var dimension = Number((_track$dimension = _track.dimension) != null ? _track$dimension : (_track$valueCurve = _track.valueCurve) === null || _track$valueCurve === void 0 ? void 0 : _track$valueCurve.dimension);
        if (dimension !== 1) {
          throw convertError("vector track \"".concat(_track.name || "", "\" has unsupported dimension ").concat(dimension));
        }
        var value = decodeTrackCurve(_track.valueCurve, 1, _track.name, "value");
        if (value) addChannel(_track.name, "MorphTarget", value, 1, true);
      }
    }
    if (!channels.length) {
      if (options.dropEmpty) return null;
      throw convertError("animation \"".concat(animation.name || "", "\" contains no non-identity channels"));
    }
    return {
      name: animation.name || "",
      channels,
      curves,
      duration
    };
  }

  /**
   * Convert any GR2-shaped skeletons/animations in a shared root, leaving
   * CMF-native ones untouched.
   *
   * GR2 files frequently carry their skeleton under `models[].skeleton` rather
   * than a root skeleton list. Model skeletons are unioned by object identity.
   * Model mesh bindings select among skeletons compatible with the mesh's bone
   * palette; a unique palette match resolves otherwise-unbound skinned meshes.
   *
   * @param {object} root Shared geometry root.
   * @param {object} [options] Conversion options (`sampleRate`).
   * @returns {object} Root with converted skeletons/animations.
   */
  function convertGr2SkeletonsAndAnimations(root) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var projectedFromGr2 = Number.isInteger(root === null || root === void 0 ? void 0 : root.grannyFileFormatRevision);
    var sourceSkeletons = Array.isArray(root.skeletons) ? [...root.skeletons] : [];
    var skeletonIndexByIdentity = new Map();
    for (var index = 0; index < sourceSkeletons.length; index++) {
      var skeleton = sourceSkeletons[index];
      if (skeleton && typeof skeleton === "object" && !skeletonIndexByIdentity.has(skeleton)) {
        skeletonIndexByIdentity.set(skeleton, index);
      }
    }
    var models = Array.isArray(root.models) ? root.models : [];
    var modelSkeletonIndices = new Array(models.length).fill(null);
    for (var modelIndex = 0; modelIndex < models.length; modelIndex++) {
      var _models$modelIndex;
      var _skeleton = (_models$modelIndex = models[modelIndex]) === null || _models$modelIndex === void 0 ? void 0 : _models$modelIndex.skeleton;
      if (!isGr2Skeleton(_skeleton)) continue;
      if (!skeletonIndexByIdentity.has(_skeleton)) {
        skeletonIndexByIdentity.set(_skeleton, sourceSkeletons.length);
        sourceSkeletons.push(_skeleton);
      }
      modelSkeletonIndices[modelIndex] = skeletonIndexByIdentity.get(_skeleton);
    }
    var sourceMeshes = Array.isArray(root.meshes) ? root.meshes : [];
    var boneNamesBySkeleton = sourceSkeletons.map(skeletonBoneNames);
    var bindingNamesByMesh = sourceMeshes.map(meshBoneBindingNames);
    var compatibleSkeletonsByMesh = bindingNamesByMesh.map(bindings => {
      if (!bindings.length) return [];
      var compatible = [];
      for (var skeletonIndex = 0; skeletonIndex < boneNamesBySkeleton.length; skeletonIndex++) {
        if (skeletonContainsBindings(boneNamesBySkeleton[skeletonIndex], bindings)) {
          compatible.push(skeletonIndex);
        }
      }
      return compatible;
    });
    var modelAssignments = new Array(sourceMeshes.length).fill(null);
    var assignmentModels = new Array(sourceMeshes.length).fill(null);
    for (var _modelIndex = 0; _modelIndex < models.length; _modelIndex++) {
      var _models$_modelIndex;
      var bindings = Array.isArray((_models$_modelIndex = models[_modelIndex]) === null || _models$_modelIndex === void 0 ? void 0 : _models$_modelIndex.meshBindings) ? models[_modelIndex].meshBindings : [];
      for (var bindingIndex = 0; bindingIndex < bindings.length; bindingIndex++) {
        var meshIndex = bindings[bindingIndex];
        // The GR2 JSON emitter uses -1 when a model binding points at a
        // mesh omitted from this file, as EVE low-detail hull files do.
        if (meshIndex === -1) continue;
        if (!Number.isInteger(meshIndex) || meshIndex < 0 || meshIndex >= sourceMeshes.length) {
          throw convertError("model ".concat(_modelIndex, " mesh binding ").concat(bindingIndex, " references mesh ").concat(meshIndex, " outside 0..").concat(sourceMeshes.length - 1));
        }
        var skeletonIndex = modelSkeletonIndices[_modelIndex];
        if (skeletonIndex === null) continue;
        // A model list expresses scene membership, not a usable skin by
        // itself. CMF can bind only a skeleton containing every palette
        // name, so stale or duplicate incompatible model claims are not
        // candidates for this mesh.
        if (bindingNamesByMesh[meshIndex].length && !compatibleSkeletonsByMesh[meshIndex].includes(skeletonIndex)) continue;
        if (modelAssignments[meshIndex] !== null && modelAssignments[meshIndex] !== skeletonIndex) {
          throw convertError("mesh ".concat(meshIndex, " is bound to skeleton ").concat(modelAssignments[meshIndex], " by model ").concat(assignmentModels[meshIndex], " ") + "and skeleton ".concat(skeletonIndex, " by model ").concat(_modelIndex));
        }
        modelAssignments[meshIndex] = skeletonIndex;
        assignmentModels[meshIndex] = _modelIndex;
      }
    }
    var meshes = sourceMeshes.map((mesh, meshIndex) => {
      var authored = mesh === null || mesh === void 0 ? void 0 : mesh.skeleton;
      var assigned = modelAssignments[meshIndex];
      var bindings = bindingNamesByMesh[meshIndex];
      var compatible = compatibleSkeletonsByMesh[meshIndex];
      var skeleton = authored;
      if (authored !== null && authored !== undefined) {
        if (!Number.isInteger(authored) || authored < 0 || authored >= sourceSkeletons.length) {
          throw convertError("mesh ".concat(meshIndex, " has skeleton index ").concat(authored, " outside 0..").concat(sourceSkeletons.length - 1));
        }
        if (bindings.length && !compatible.includes(authored)) {
          throw convertError("mesh ".concat(meshIndex, " declares skeleton ").concat(authored, " which does not contain all bone bindings"));
        }
        if (assigned !== null && assigned !== authored) {
          throw convertError("mesh ".concat(meshIndex, " declares skeleton ").concat(authored, " but model ").concat(assignmentModels[meshIndex], " binds skeleton ").concat(assigned));
        }
      } else if (assigned !== null) {
        skeleton = assigned;
      } else if (bindings.length) {
        if (compatible.length === 1) skeleton = compatible[0];else if (compatible.length > 1) {
          throw convertError("mesh ".concat(meshIndex, " has bone bindings but no unambiguous compatible skeleton"));
        } else if (sourceSkeletons.length) {
          throw convertError("mesh ".concat(meshIndex, " has bone bindings but no compatible skeleton"));
        }
      }
      var converted = skeleton === authored ? mesh : _objectSpread2(_objectSpread2({}, mesh), {}, {
        skeleton
      });
      if (projectedFromGr2 && bindings.length && !meshHasBoneIndices(mesh)) {
        // Granny permits a rigid mesh to carry a one-bone palette even
        // though its vertices have no BoneIndices. Carbon's published CMF
        // keeps the model/skeleton relationship but omits that palette;
        // CMF requires BoneBindings and BoneIndices to appear together.
        converted = _objectSpread2(_objectSpread2({}, converted), {}, {
          boneBindings: []
        });
      }
      return converted;
    });
    var skeletons = sourceSkeletons.map(skeleton => isGr2Skeleton(skeleton) ? convertGr2Skeleton(skeleton) : skeleton);
    // Compare channel names, not mesh names: Carbon resolves SmileShape to
    // the Smile channel. Filtering the raw names drops valid morph-only clips.
    var morphTargetNames = new Set(sourceMeshes.flatMap(mesh => {
      var _mesh$morphTargets;
      return ((_mesh$morphTargets = mesh === null || mesh === void 0 ? void 0 : mesh.morphTargets) != null ? _mesh$morphTargets : []).map(target => {
        var _target$name;
        return morphAnimationTargetName((_target$name = target === null || target === void 0 ? void 0 : target.name) != null ? _target$name : "");
      });
    }));
    // Carbon's Granny-to-CMF publishing path writes one P/R/S channel for
    // every authored transform track, including constant identity components.
    var animationOptions = _objectSpread2(_objectSpread2({}, options), {}, {
      morphTargetNames,
      preserveIdentity: projectedFromGr2,
      dropEmpty: projectedFromGr2
    });
    var animations = (root.animations || []).map(animation => isGr2Animation(animation) ? convertGr2Animation(animation, animationOptions) : animation).filter(Boolean);
    var boneTargetCounts = new Map();
    for (var _skeleton2 of skeletons) {
      for (var name of (_skeleton2$bones = _skeleton2.bones) != null ? _skeleton2$bones : []) {
        var _skeleton2$bones, _boneTargetCounts$get;
        boneTargetCounts.set(name, ((_boneTargetCounts$get = boneTargetCounts.get(name)) != null ? _boneTargetCounts$get : 0) + 1);
      }
    }
    for (var animation of animations) {
      for (var channel of (_animation$channels = animation.channels) != null ? _animation$channels : []) {
        var _animation$channels, _boneTargetCounts$get2;
        if (channel.targetType !== "MorphTarget" && ((_boneTargetCounts$get2 = boneTargetCounts.get(channel.target)) != null ? _boneTargetCounts$get2 : 0) > 1) {
          throw convertError("bone animation target \"".concat(channel.target, "\" is ambiguous across skeletons"));
        }
      }
    }
    return _objectSpread2(_objectSpread2({}, root), {}, {
      meshes,
      skeletons,
      animations
    });
  }

  var Usage = Object.freeze(["Position", "Normal", "Tangent", "Binormal", "TexCoord", "Color", "BoneIndices", "BoneWeights", "PackedTangent", "PackedTangentLegacy"]);
  var CMF_CLASS_KEYS = Object.freeze(["Root", "Section", "Metadata", "MetadataEntry", "Mesh", "IndexGroup", "VertexElement", "MeshLod", "MeshArea", "LodMeshArea", "BoneBinding", "MorphTargets", "MorphTarget", "LodMorphTarget", "AudioOcclusionMesh", "Skeleton", "BoneMask", "BoneWeight", "Animation", "AnimationChannel", "AnimationCurve"]);
  var GR2_CLASS_KEYS = Object.freeze(["Root", "Mesh", "BoneBinding", "IndexGroup", "MorphTarget", "Model", "Skeleton", "Bone", "Animation", "TrackGroup", "TransformTrack", "VectorTrack", "Curve"]);
  Object.freeze(Array.from(new Set([...CMF_CLASS_KEYS, ...GR2_CLASS_KEYS])));

  /**
   * Count all indices stored by shared geometry index groups.
   *
   * @param {Array<object>} groups Shared geometry index groups.
   * @returns {number} Total index count.
   */
  function totalIndexCount() {
    var groups = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var total = 0;
    for (var group of groups) {
      var _group$faces$length, _group$faces;
      total += (_group$faces$length = (_group$faces = group.faces) === null || _group$faces === void 0 ? void 0 : _group$faces.length) != null ? _group$faces$length : 0;
    }
    return total;
  }

  /**
   * Select the encoded CMF index width needed by shared geometry groups.
   *
   * @param {Array<object>} groups Shared geometry index groups.
   * @returns {number} Two or four bytes per index.
   */
  function bytesPerIndex() {
    var groups = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    for (var group of groups) {
      if (group.bytesPerIndex === 4) {
        return 4;
      }
      for (var index of (_group$faces2 = group.faces) != null ? _group$faces2 : []) {
        var _group$faces2;
        if (index > 0xffff) {
          return 4;
        }
      }
    }
    return 2;
  }

  /**
   * Find the first triangle occupied by one shared geometry index group.
   *
   * @param {Array<object>} groups Shared geometry index groups.
   * @param {number} groupIndex Target group index.
   * @returns {number} Triangle offset.
   */
  function firstTriangle() {
    var groups = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var groupIndex = arguments.length > 1 ? arguments[1] : undefined;
    var first = 0;
    for (var i = 0; i < groupIndex; i++) {
      var _groups$i$faces;
      first += Math.floor(((_groups$i$faces = groups[i].faces) != null ? _groups$i$faces : []).length / 3);
    }
    return first;
  }

  function f32(value) {
    return Math.fround(value);
  }
  function length3(x, y, z) {
    var xx = f32(f32(x) * f32(x)),
      yy = f32(f32(y) * f32(y)),
      zz = f32(f32(z) * f32(z)),
      squared = f32(f32(xx + yy) + zz);
    return f32(Math.sqrt(squared));
  }
  function meshDiameter(position) {
    if (!position.length) return 0;
    var min = [f32(position[0]), f32(position[1]), f32(position[2])];
    var max = min.slice();
    for (var offset = 3; offset < position.length; offset += 3) {
      for (var component = 0; component < 3; component++) {
        var value = f32(position[offset + component]);
        if (value < min[component]) min[component] = value;
        if (value > max[component]) max[component] = value;
      }
    }
    return length3(f32(max[0] - min[0]), f32(max[1] - min[1]), f32(max[2] - min[2]));
  }
  function edgeLength(position, leftIndex, rightIndex) {
    var left = leftIndex * 3;
    var right = rightIndex * 3;
    return length3(f32(f32(position[left]) - f32(position[right])), f32(f32(position[left + 1]) - f32(position[right + 1])), f32(f32(position[left + 2]) - f32(position[right + 2])));
  }
  function uvDistanceSquared(uv, width, leftIndex, rightIndex) {
    var squared = 0;
    var left = leftIndex * width;
    var right = rightIndex * width;
    for (var component = 0; component < 4; component++) {
      var difference = component < width ? f32(f32(uv[left + component]) - f32(uv[right + component])) : 0;
      squared = f32(squared + f32(difference * difference));
    }
    return squared;
  }
  function calculateUvDensity(position, uv, indices) {
    var vertexCount = Math.floor(position.length / 3);
    if (!vertexCount || !uv.length || uv.length % vertexCount) return 0;
    var uvWidth = uv.length / vertexCount,
      diameter = meshDiameter(position),
      densities = [];
    var totalArea = 0;
    if (indices.length % 3) {
      throw new Error("CMF UV density triangle index count must be divisible by 3");
    }
    for (var _offset = 0; _offset < indices.length; _offset += 3) {
      var triangle = [indices[_offset], indices[_offset + 1], indices[_offset + 2]];
      if (triangle.some(index => !Number.isInteger(index) || index < 0 || index >= vertexCount)) {
        throw new Error("CMF UV density index is outside the vertex range");
      }
      var edges = new Array(3);
      var density = 0;
      var valid = true;
      for (var edge = 0; edge < 3; edge++) {
        var left = triangle[edge],
          right = triangle[(edge + 1) % 3],
          dx = edgeLength(position, left, right);
        if (dx === 0) {
          valid = false;
          break;
        }
        edges[edge] = dx;
        var dy = uvDistanceSquared(uv, uvWidth, left, right);
        if (dy !== 0) {
          dy = f32(f32(Math.sqrt(dy)) * diameter);
          var ratio = f32(dy / dx);
          density = edge === 0 ? ratio : Math.min(density, ratio);
        }
      }
      if (!valid) continue;
      var perimeter = f32(f32(f32(edges[0] + edges[1]) + edges[2]) * 0.5),
        area = Math.sqrt(Math.max(perimeter * (perimeter - edges[0]) * (perimeter - edges[1]) * (perimeter - edges[2]), 0));
      totalArea += area;
      densities.push([f32(area), density]);
    }
    if (!densities.length) return 0;
    densities.sort((left, right) => left[1] - right[1]);
    var discardArea = totalArea * f32(0.03);
    var discarded = 0;
    var offset = 0;
    while (discarded < discardArea && offset < densities.length) {
      discarded = f32(discarded + densities[offset][0]);
      offset++;
    }

    // Carbon indexes one past the vector when the discarded prefix consumes
    // every triangle (mesh/src/cmf/uvdensity.cpp:77-89). That is undefined
    // native behavior for single triangles and some small meshes. CMF output
    // must stay deterministic, so clamp to the last measured density.
    return densities[Math.min(offset, densities.length - 1)][1];
  }

  /**
   * Calculate CMF UV-density entries from shared vertex and index channels.
   *
   * @param {object} vertex Shared vertex channels.
   * @param {object[]} groups Shared triangle index groups.
   * @param {object[]} declaration CMF vertex declaration.
   * @returns {number[]} One value for every TexCoord usage index through the maximum.
   */
  function calculateUvDensities(vertex, groups, declaration) {
    var _vertex$position;
    var uvSetCount = 0;
    for (var element of declaration) {
      if (element.usage === "TexCoord") {
        uvSetCount = Math.max(uvSetCount, element.usageIndex + 1);
      }
    }
    if (!uvSetCount || !((_vertex$position = vertex.position) != null ? _vertex$position : []).length) return [];
    var indices = [];
    for (var group of groups != null ? groups : []) {
      for (var index of (_group$faces = group.faces) != null ? _group$faces : []) {
        var _group$faces;
        indices.push(index);
      }
    }
    var densities = new Array(uvSetCount).fill(0);
    for (var _element of declaration) {
      var _vertex;
      if (_element.usage !== "TexCoord") continue;
      densities[_element.usageIndex] = calculateUvDensity(vertex.position, (_vertex = vertex["texcoord".concat(_element.usageIndex)]) != null ? _vertex : [], indices);
    }
    return densities;
  }

  /**
   * Return the encoded byte width of one CMF vertex element component.
   *
   * @param {string} type CMF ElementType name.
   * @returns {number} Encoded component size in bytes.
   */
  function elementTypeSize(type) {
    switch (type) {
      case "Float32":
        return 4;
      case "Float16":
      case "UInt16Norm":
      case "UInt16":
      case "Int16Norm":
      case "Int16":
        return 2;
      case "UInt8Norm":
      case "UInt8":
      case "Int8Norm":
      case "Int8":
        return 1;
      default:
        throw new Error("Unsupported CMF vertex element type \"".concat(type, "\""));
    }
  }

  /**
   * Calculate the byte stride required by a CMF vertex declaration.
   *
   * @param {Array<object>} decl CMF vertex elements.
   * @returns {number} Required stride in bytes.
   */
  function estimateStrideFromDecl() {
    var decl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var stride = 0;
    for (var element of decl) {
      stride = Math.max(stride, (element.offset || 0) + element.elementCount * elementTypeSize(element.type));
    }
    return stride;
  }

  /** Decode one IEEE-754 binary16 value. */
  function halfToFloat(value) {
    var sign = value & 0x8000 ? -1 : 1,
      exponent = value >> 10 & 0x1f,
      fraction = value & 0x03ff;
    if (exponent === 0) return sign * Math.pow(2, -14) * (fraction / 1024);
    if (exponent === 31) return fraction ? NaN : sign * Infinity;
    return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
  }

  /** Decode one CMF element component from a DataView. */
  function readElementComponent(view, offset, type) {
    switch (type) {
      case "Float32":
        return view.getFloat32(offset, true);
      case "Float16":
        return halfToFloat(view.getUint16(offset, true));
      case "UInt16Norm":
        return view.getUint16(offset, true) / 65535;
      case "UInt16":
        return view.getUint16(offset, true);
      case "Int16Norm":
        return Math.max(view.getInt16(offset, true) / 32767, -1);
      case "Int16":
        return view.getInt16(offset, true);
      case "UInt8Norm":
        return view.getUint8(offset) / 255;
      case "UInt8":
        return view.getUint8(offset);
      case "Int8Norm":
        return Math.max(view.getInt8(offset) / 127, -1);
      case "Int8":
        return view.getInt8(offset);
      default:
        throw new Error("Unsupported CMF vertex element type \"".concat(type, "\""));
    }
  }

  /** Decode a tightly-packed CMF element byte array to JavaScript numbers. */
  function decodeElementArray(input, type) {
    var bytes = input instanceof Uint8Array ? input : ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : input instanceof ArrayBuffer ? new Uint8Array(input) : Uint8Array.from(input || []);
    var size = elementTypeSize(type);
    if (bytes.byteLength % size) {
      throw new Error("CMF ".concat(type, " byte array length ").concat(bytes.byteLength, " is not divisible by ").concat(size));
    }
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var values = new Array(bytes.byteLength / size);
    for (var i = 0; i < values.length; i++) values[i] = readElementComponent(view, i * size, type);
    return values;
  }

  var _excluded$1 = ["decl", "topology", "morphTargetSet"];
  var VERTEX_CHANNELS$1 = Object.freeze([["position", "Position", 3], ["normal", "Normal", 3], ["tangent", "Tangent", 3], ["binormal", "Binormal", 3], ["texcoord0", "TexCoord", 2, 0], ["texcoord1", "TexCoord", 2, 1], ["color0", "Color", 4, 0], ["blendIndice", "BoneIndices", 4, 0, "UInt16"], ["blendWeight", "BoneWeights", 4, 0], ["packedTangent", "PackedTangent", 4, 0, "Int16Norm"], ["packedTangentLegacy", "PackedTangentLegacy", 4, 0, "UInt16Norm"]]);

  /**
   * Builds a CMF document from normalized shared geometry for the CMF format
   * reader.
   */
  function buildCmfFromShared(input) {
    var _root$meshes, _root$skeletons, _root$animations;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var source = input && input.meshes ? input : {
      meshes: [input]
    };
    var root = convertGr2SkeletonsAndAnimations(source, options);
    return {
      version: 1,
      metadata: normalizeMetadata(root.metadata),
      meshes: ((_root$meshes = root.meshes) != null ? _root$meshes : []).map(mesh => buildMesh(mesh, options)),
      skeletons: (_root$skeletons = root.skeletons) != null ? _root$skeletons : [],
      animations: (_root$animations = root.animations) != null ? _root$animations : []
    };
  }

  /**
   * Builds normalized shared geometry from a CMF document for the CMF format
   * reader.
   */
  function buildSharedFromCmf(raw, classes) {
    var hydrationOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var hydrationClasses = createHydrationClasses(classes, hydrationOptions);
    return hydrate("Root", {
      cmfVersion: raw.version,
      metadata: raw.metadata ? hydrateMetadata$1(raw.metadata, hydrationClasses) : null,
      meshes: raw.meshes.map(mesh => hydrateSharedMesh(mesh, hydrationClasses)),
      skeletons: raw.skeletons.map(skeleton => hydrateSkeleton$1(skeleton, hydrationClasses)),
      animations: raw.animations.map(animation => hydrateAnimation$1(animation, hydrationClasses))
    }, hydrationClasses, hydrationOptions);
  }
  function buildMesh(mesh, options) {
    var _mesh$boneBindings, _mesh$name, _mesh$audioOcclusionM, _mesh$skeleton;
    var lodSources = sharedLodSources(mesh);
    var builtLods = lodSources.map((source, index) => buildLod(source, index, options));
    var base = builtLods[0];
    assertCompatibleLods(builtLods);
    var vertex = base.vertex,
      boneBindings = ((_mesh$boneBindings = mesh.boneBindings) != null ? _mesh$boneBindings : []).map(binding => buildBoneBinding(binding)),
      affectedByBones = boneBindings.length > 0,
      morphTargets = _objectSpread2(_objectSpread2({}, base.morphTargetSet), {}, {
        targets: base.morphTargetSet.targets.map((target, targetIndex) => _objectSpread2(_objectSpread2({}, target), {}, {
          maxDisplacement: Math.max(...builtLods.map(lod => lod.morphTargetSet.targets[targetIndex].maxDisplacement))
        }))
      }),
      decl = base.decl,
      topology = base.topology,
      areas = base.indices.map((group, areaIndex) => buildMeshArea(mesh, builtLods, group, areaIndex));
    if (affectedByBones !== decl.some(element => element.usage === "BoneIndices")) {
      throw new Error("CMF bone bindings and BoneIndices must either both be present or both be absent");
    }
    return {
      name: (_mesh$name = mesh.name) != null ? _mesh$name : "",
      decl,
      lods: builtLods.map(_ref => {
        _ref.decl;
          _ref.topology;
          _ref.morphTargetSet;
          var lod = _objectWithoutProperties(_ref, _excluded$1);
        return lod;
      }),
      areas,
      boneBindings,
      morphTargets: {
        decl: morphTargets.decl,
        targets: morphTargets.targets
      },
      uvDensities: calculateUvDensities(vertex, base.indices, decl),
      bounds: boundsFromShared(mesh),
      audioOcclusionMesh: (_mesh$audioOcclusionM = mesh.audioOcclusionMesh) != null ? _mesh$audioOcclusionM : {
        vertices: [],
        indices: [],
        bounds: {
          min: [0, 0, 0],
          max: [0, 0, 0]
        }
      },
      topology,
      skeleton: (_mesh$skeleton = mesh.skeleton) != null ? _mesh$skeleton : null,
      vertex,
      indices: base.indices
    };
  }
  function sharedLodSources(mesh) {
    var lods = Array.isArray(mesh.lods) && mesh.lods.length ? mesh.lods : [mesh];
    return lods.map((lod, index) => {
      var _mesh$morphTargets, _lod$morphTargets;
      var baseTargets = (_mesh$morphTargets = mesh.morphTargets) != null ? _mesh$morphTargets : [];
      var lodTargets = (_lod$morphTargets = lod.morphTargets) != null ? _lod$morphTargets : index === 0 ? baseTargets : [];
      var morphTargets = lodTargets.map((target, targetIndex) => {
        var _baseTargets$targetIn, _ref2, _target$vertex, _baseTargets$targetIn2;
        return _objectSpread2(_objectSpread2(_objectSpread2({}, (_baseTargets$targetIn = baseTargets[targetIndex]) != null ? _baseTargets$targetIn : {}), target), {}, {
          vertex: (_ref2 = (_target$vertex = target.vertex) != null ? _target$vertex : (_baseTargets$targetIn2 = baseTargets[targetIndex]) === null || _baseTargets$targetIn2 === void 0 ? void 0 : _baseTargets$targetIn2.vertex) != null ? _ref2 : {}
        });
      });
      return normalizeSharedMeshTangents(_objectSpread2(_objectSpread2(_objectSpread2({}, mesh), lod), {}, {
        name: mesh.name,
        boneBindings: mesh.boneBindings,
        skeleton: mesh.skeleton,
        morphTargets
      }));
    });
  }
  function buildLod(mesh, index, options) {
    var _mesh$vertex, _vertex$position, _mesh$indices, _mesh$topology;
    var vertex = (_mesh$vertex = mesh.vertex) != null ? _mesh$vertex : {},
      position = (_vertex$position = vertex.position) != null ? _vertex$position : [],
      decl = buildDecl(vertex, options),
      stride = estimateStrideFromDecl(decl),
      vertexCount = stride === 0 ? 0 : Math.floor(position.length / 3),
      indices = (_mesh$indices = mesh.indices) != null ? _mesh$indices : [],
      topology = (_mesh$topology = mesh.topology) != null ? _mesh$topology : "TriangleList",
      pointList = topology === "PointList",
      morphTargets = buildMorphTargets(mesh),
      indexStride = pointList ? 0 : bytesPerIndex(indices);
    if (position.length % 3) {
      throw new Error("CMF Position channel length must be divisible by three");
    }
    if (topology !== "TriangleList" && !pointList) {
      throw new Error("CMF shared geometry topology ".concat(JSON.stringify(topology), " is not supported"));
    }
    if (pointList && totalIndexCount(indices)) {
      throw new Error("CMF PointList geometry cannot contain an index buffer");
    }
    for (var group of indices) {
      var _group$faces;
      var faces = (_group$faces = group.faces) != null ? _group$faces : [];
      if (!pointList && faces.length % 3) {
        throw new Error("CMF triangle index groups must contain complete triangles");
      }
      if (faces.some(value => !Number.isInteger(value) || value < 0 || value >= vertexCount)) {
        throw new Error("CMF index is outside the vertex range");
      }
    }
    return {
      decl,
      topology,
      vb: {
        index: 1,
        offset: 0,
        size: vertexCount * stride,
        stride
      },
      ib: pointList ? {
        index: 0,
        offset: 0,
        size: 0,
        stride: 0
      } : {
        index: 2,
        offset: 0,
        size: totalIndexCount(indices) * indexStride,
        stride: indexStride
      },
      areas: buildLodAreas(indices, topology, vertexCount),
      morphTargets: morphTargets.lods,
      morphTargetSet: morphTargets,
      threshold: lodThreshold(mesh, index),
      vertex,
      indices
    };
  }
  function lodThreshold(mesh, index) {
    if (mesh.threshold !== undefined && mesh.threshold !== null) return mesh.threshold;
    if (index === 0) return 0xffffffff;
    throw new Error("CMF LOD ".concat(index, " requires an explicit descending threshold"));
  }
  function buildMeshArea(mesh, lods, group, areaIndex) {
    var _mesh$areas$areaIndex, _mesh$areas, _source$bones, _source$affectedByMor, _ref3, _source$name, _source$bounds, _source$affectedByBon;
    var source = (_mesh$areas$areaIndex = (_mesh$areas = mesh.areas) === null || _mesh$areas === void 0 ? void 0 : _mesh$areas[areaIndex]) != null ? _mesh$areas$areaIndex : group;
    var bones = (_source$bones = source.bones) != null ? _source$bones : Array.from(new Set(lods.flatMap(lod => areaBones(lod.indices[areaIndex], lod.vertex, lod.topology))));
    var affectedByMorphTargets = (_source$affectedByMor = source.affectedByMorphTargets) != null ? _source$affectedByMor : lods.some(lod => {
      var _lod$vertex$position, _lod$vertex;
      return areaAffectedByMorphTargets(lod.indices[areaIndex], (_lod$vertex$position = (_lod$vertex = lod.vertex) === null || _lod$vertex === void 0 ? void 0 : _lod$vertex.position) != null ? _lod$vertex$position : [], lod.morphTargetSet.lods, lod.topology);
    });
    return {
      name: (_ref3 = (_source$name = source.name) != null ? _source$name : group.name) != null ? _ref3 : "",
      bounds: (_source$bounds = source.bounds) != null ? _source$bounds : boundsForArea(group, lods[0].vertex, mesh),
      bones,
      affectedByBones: (_source$affectedByBon = source.affectedByBones) != null ? _source$affectedByBon : bones.length > 0,
      affectedByMorphTargets
    };
  }
  function areaVertexIndices(group, topology, vertexCount) {
    var _group$faces2, _group$firstElement, _ref4, _group$pointCount;
    if (topology !== "PointList") return (_group$faces2 = group === null || group === void 0 ? void 0 : group.faces) != null ? _group$faces2 : [];
    var first = (_group$firstElement = group === null || group === void 0 ? void 0 : group.firstElement) != null ? _group$firstElement : 0;
    var count = (_ref4 = (_group$pointCount = group === null || group === void 0 ? void 0 : group.pointCount) != null ? _group$pointCount : group === null || group === void 0 ? void 0 : group.elementCount) != null ? _ref4 : vertexCount;
    return Array.from({
      length: count
    }, (_, index) => first + index);
  }
  function areaBones(group, vertex, topology) {
    var _vertex$blendIndice, _vertex$blendWeight, _vertex$position2;
    var boneIndices = (_vertex$blendIndice = vertex === null || vertex === void 0 ? void 0 : vertex.blendIndice) != null ? _vertex$blendIndice : [];
    if (!boneIndices.length) return [];
    var boneWeights = (_vertex$blendWeight = vertex === null || vertex === void 0 ? void 0 : vertex.blendWeight) != null ? _vertex$blendWeight : [];
    var vertexCount = ((_vertex$position2 = vertex === null || vertex === void 0 ? void 0 : vertex.position) != null ? _vertex$position2 : []).length / 3;
    var bones = new Set();
    for (var vertexIndex of areaVertexIndices(group, topology, vertexCount)) {
      var offset = vertexIndex * 4;
      for (var component = 0; component < 4; component++) {
        var _boneWeights, _boneIndices;
        var weight = boneWeights.length ? (_boneWeights = boneWeights[offset + component]) != null ? _boneWeights : 0 : component === 0 ? 1 : 0;
        if (weight > 0) bones.add((_boneIndices = boneIndices[offset + component]) != null ? _boneIndices : 0);
      }
    }
    return Array.from(bones);
  }
  function areaAffectedByMorphTargets(group, basePositions, morphLods, topology) {
    var vertexCount = basePositions.length / 3;
    for (var morph of morphLods) {
      var _morph$vertex$positio, _morph$vertex;
      var positions = (_morph$vertex$positio = (_morph$vertex = morph.vertex) === null || _morph$vertex === void 0 ? void 0 : _morph$vertex.position) != null ? _morph$vertex$positio : [];
      for (var vertexIndex of areaVertexIndices(group, topology, vertexCount)) {
        var offset = vertexIndex * 3;
        if (positions[offset] !== basePositions[offset] || positions[offset + 1] !== basePositions[offset + 1] || positions[offset + 2] !== basePositions[offset + 2]) return true;
      }
    }
    return false;
  }
  function boundsForArea(group, vertex, mesh) {
    var _vertex$position3;
    var positions = (_vertex$position3 = vertex === null || vertex === void 0 ? void 0 : vertex.position) != null ? _vertex$position3 : [];
    var selected = [];
    for (var vertexIndex of areaVertexIndices(group, (_mesh$topology2 = mesh.topology) != null ? _mesh$topology2 : "TriangleList", positions.length / 3)) {
      var _mesh$topology2;
      var offset = vertexIndex * 3;
      if (offset + 2 < positions.length) selected.push(positions[offset], positions[offset + 1], positions[offset + 2]);
    }
    if (!selected.length) return boundsFromShared(mesh);
    var min = [Infinity, Infinity, Infinity];
    var max = [-Infinity, -Infinity, -Infinity];
    for (var _offset = 0; _offset < selected.length; _offset += 3) {
      for (var axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], selected[_offset + axis]);
        max[axis] = Math.max(max[axis], selected[_offset + axis]);
      }
    }
    return {
      min,
      max
    };
  }
  function buildLodAreas(groups, topology, vertexCount) {
    if (topology === "PointList") {
      var firstElement = 0;
      return groups.map((group, index) => {
        var _group$pointCount2;
        var elementCount = (_group$pointCount2 = group.pointCount) != null ? _group$pointCount2 : index === 0 ? vertexCount : 0;
        var area = {
          firstElement,
          elementCount
        };
        firstElement += elementCount;
        return area;
      });
    }
    return groups.map((group, index) => {
      var _group$faces3;
      return {
        firstElement: firstTriangle(groups, index),
        elementCount: Math.floor(((_group$faces3 = group.faces) != null ? _group$faces3 : []).length / 3)
      };
    });
  }
  function sameDeclaration(left, right) {
    return left.length === right.length && left.every((element, index) => {
      var other = right[index];
      return element.usage === other.usage && element.usageIndex === other.usageIndex && element.type === other.type && element.elementCount === other.elementCount && element.offset === other.offset;
    });
  }
  function assertCompatibleLods(lods) {
    var base = lods[0];
    for (var index = 1; index < lods.length; index++) {
      var lod = lods[index];
      if (lod.topology !== base.topology || !sameDeclaration(lod.decl, base.decl)) {
        throw new Error("CMF LOD ".concat(index, " must use the base LOD topology and vertex declaration"));
      }
      if (lod.areas.length !== base.areas.length) {
        throw new Error("CMF LOD ".concat(index, " must contain ").concat(base.areas.length, " material areas"));
      }
      if (!sameDeclaration(lod.morphTargetSet.decl, base.morphTargetSet.decl) || lod.morphTargetSet.targets.length !== base.morphTargetSet.targets.length || lod.morphTargetSet.targets.some((target, targetIndex) => target.name !== base.morphTargetSet.targets[targetIndex].name)) {
        throw new Error("CMF LOD ".concat(index, " must use the base LOD morph declaration and target count"));
      }
      if (lod.threshold >= lods[index - 1].threshold) {
        throw new Error("CMF LOD thresholds must be strictly descending");
      }
    }
  }
  function normalizeSharedMeshTangents(mesh) {
    var _mesh$vertex2, _mesh$morphTargets2;
    var vertex = normalizeSharedVertex((_mesh$vertex2 = mesh.vertex) != null ? _mesh$vertex2 : {});
    var morphTargets = ((_mesh$morphTargets2 = mesh.morphTargets) != null ? _mesh$morphTargets2 : []).map(target => {
      var _target$vertex2;
      return _objectSpread2(_objectSpread2({}, target), {}, {
        vertex: normalizeSharedVertexTangents((_target$vertex2 = target.vertex) != null ? _target$vertex2 : {}, morphTargetVertexCount(mesh, target))
      });
    });
    return _objectSpread2(_objectSpread2({}, mesh), {}, {
      vertex,
      morphTargets
    });
  }
  function morphTargetVertexCount(mesh, target) {
    var _target$vertexIndices, _target$vertex$positi, _target$vertex3, _mesh$vertex$position, _mesh$vertex3;
    var indices = (_target$vertexIndices = target.vertexIndices) != null ? _target$vertexIndices : [];
    if (indices.length) return indices.length;
    var position = (_target$vertex$positi = (_target$vertex3 = target.vertex) === null || _target$vertex3 === void 0 ? void 0 : _target$vertex3.position) != null ? _target$vertex$positi : [];
    if (position.length) return Math.floor(position.length / 3);
    return Math.floor(((_mesh$vertex$position = (_mesh$vertex3 = mesh.vertex) === null || _mesh$vertex3 === void 0 ? void 0 : _mesh$vertex3.position) != null ? _mesh$vertex$position : []).length / 3);
  }
  function normalizeSharedVertex(vertex) {
    return normalizeSharedVertexSkin(normalizeSharedVertexTangents(vertex));
  }
  function normalizeSharedVertexTangents(vertex, vertexCount) {
    var _vertex$position4, _vertex$tangent, _vertex$normal, _vertex$binormal;
    var positionCount = vertexCount != null ? vertexCount : ((_vertex$position4 = vertex.position) != null ? _vertex$position4 : []).length / 3,
      tangent = (_vertex$tangent = vertex.tangent) != null ? _vertex$tangent : [];
    if (!positionCount || tangent.length !== positionCount * 4 || ((_vertex$normal = vertex.normal) != null ? _vertex$normal : []).length || ((_vertex$binormal = vertex.binormal) != null ? _vertex$binormal : []).length) {
      return vertex;
    }
    // The source channels are the layout authority. GR2's explicit
    // `unpackTangents` conversion runs before this boundary when requested;
    // CMF construction must not silently expand an otherwise packed frame.
    return _objectSpread2(_objectSpread2({}, vertex), {}, {
      tangent: [],
      packedTangentLegacy: tangent.slice()
    });
  }
  function normalizeSharedVertexSkin(vertex) {
    var _vertex$position5, _vertex$blendIndice2, _vertex$blendWeight2;
    var positionCount = ((_vertex$position5 = vertex.position) != null ? _vertex$position5 : []).length / 3,
      blendIndice = (_vertex$blendIndice2 = vertex.blendIndice) != null ? _vertex$blendIndice2 : [],
      blendWeight = (_vertex$blendWeight2 = vertex.blendWeight) != null ? _vertex$blendWeight2 : [];
    if (!positionCount || blendIndice.length !== positionCount * 4 || blendWeight.length) {
      return vertex;
    }

    // Carbon CMF treats BoneIndices without BoneWeights as rigid skinning.
    // Its geometry exporters synthesize (1, 0, 0, 0) before targeting formats
    // such as glTF/FBX that require explicit weights.
    var normalized = _objectSpread2(_objectSpread2({}, vertex), {}, {
      blendWeight: new Array(positionCount * 4).fill(0)
    });
    for (var i = 0; i < positionCount; i++) normalized.blendWeight[i * 4] = 1;
    return normalized;
  }
  function buildMorphTargets(mesh) {
    var _mesh$morphTargets3, _mesh$vertex$position2, _mesh$vertex4, _mesh$vertex5;
    var targets = (_mesh$morphTargets3 = mesh.morphTargets) != null ? _mesh$morphTargets3 : [];
    if (!targets.length) {
      return {
        decl: [],
        targets: [],
        lods: []
      };
    }
    if (!((_mesh$vertex$position2 = (_mesh$vertex4 = mesh.vertex) === null || _mesh$vertex4 === void 0 ? void 0 : _mesh$vertex4.position) != null ? _mesh$vertex$position2 : []).length) {
      throw new Error("CMF morph targets require a base position channel");
    }
    var targetNames = targets.map(target => {
      var _target$name;
      return (_target$name = target.name) != null ? _target$name : "";
    });
    if (new Set(targetNames).size !== targetNames.length) {
      throw new Error("CMF morph target names must be unique within a mesh");
    }
    var channelSpecs = morphChannelSpecs((_mesh$vertex5 = mesh.vertex) != null ? _mesh$vertex5 : {}, targets);
    for (var target of targets) {
      for (var _ref7 of channelSpecs) {
        var _target$vertex$name, _target$vertex4, _mesh$vertex$name, _mesh$vertex6;
        var _ref6 = _slicedToArray(_ref7, 1);
        var name = _ref6[0];
        if (((_target$vertex$name = (_target$vertex4 = target.vertex) === null || _target$vertex4 === void 0 ? void 0 : _target$vertex4[name]) != null ? _target$vertex$name : []).length && !((_mesh$vertex$name = (_mesh$vertex6 = mesh.vertex) === null || _mesh$vertex6 === void 0 ? void 0 : _mesh$vertex6[name]) != null ? _mesh$vertex$name : []).length) {
          throw new Error("CMF morph ".concat(name, " is absent from the base vertex declaration"));
        }
      }
    }
    var morphSpecs = channelSpecs.filter(_ref8 => {
        var _ref9 = _slicedToArray(_ref8, 1),
          name = _ref9[0];
        return name === "position" || targets.some(target => {
          var _target$vertex$name2, _target$vertex5;
          return ((_target$vertex$name2 = (_target$vertex5 = target.vertex) === null || _target$vertex5 === void 0 ? void 0 : _target$vertex5[name]) != null ? _target$vertex$name2 : []).length;
        });
      }).filter(_ref0 => {
        var _mesh$vertex$name2, _mesh$vertex7;
        var _ref1 = _slicedToArray(_ref0, 1),
          name = _ref1[0];
        return ((_mesh$vertex$name2 = (_mesh$vertex7 = mesh.vertex) === null || _mesh$vertex7 === void 0 ? void 0 : _mesh$vertex7[name]) != null ? _mesh$vertex$name2 : []).length;
      }).map(_ref10 => {
        var _ref11 = _slicedToArray(_ref10, 5),
          name = _ref11[0],
          usage = _ref11[1],
          defaultCount = _ref11[2],
          _ref11$ = _ref11[3],
          usageIndex = _ref11$ === void 0 ? 0 : _ref11$,
          _ref11$2 = _ref11[4],
          type = _ref11$2 === void 0 ? "Float32" : _ref11$2;
        return {
          name,
          usage,
          usageIndex,
          elementCount: morphChannelElementCount(mesh, targets, name, defaultCount),
          type
        };
      }),
      vertices = targets.map(target => {
        var _mesh$vertex8;
        return canonicalMorphVertex((_mesh$vertex8 = mesh.vertex) != null ? _mesh$vertex8 : {}, target, morphSpecs);
      }),
      decl = buildMorphDecl(morphSpecs),
      stride = estimateStrideFromDecl(decl);
    var targetRecords = targets.map((target, index) => {
      var _target$name2, _target$maxDisplaceme, _mesh$vertex9;
      return {
        name: (_target$name2 = target.name) != null ? _target$name2 : "",
        maxDisplacement: (_target$maxDisplaceme = target.maxDisplacement) != null ? _target$maxDisplaceme : maxMorphDisplacement(vertices[index].position, (_mesh$vertex9 = mesh.vertex) === null || _mesh$vertex9 === void 0 ? void 0 : _mesh$vertex9.position)
      };
    });
    if (targetRecords.some(target => !Number.isFinite(target.maxDisplacement) || target.maxDisplacement < 0)) {
      throw new Error("CMF morph target maxDisplacement values must be finite and non-negative");
    }
    return {
      decl,
      targets: targetRecords,
      lods: targets.map((target, index) => {
        var morphVertex = vertices[index],
          vertexCount = morphSpecs.reduce((count, spec) => {
            var _morphVertex$spec$nam;
            return Math.max(count, Math.floor(((_morphVertex$spec$nam = morphVertex[spec.name]) != null ? _morphVertex$spec$nam : []).length / spec.elementCount));
          }, 0);
        return {
          vb: {
            index: 0,
            offset: 0,
            size: vertexCount * stride,
            stride
          },
          vertex: morphVertex
        };
      })
    };
  }
  function morphChannelSpecs(baseVertex, targets) {
    var specs = [...VERTEX_CHANNELS$1];
    var known = new Set(specs.map(_ref12 => {
      var _ref13 = _slicedToArray(_ref12, 1),
        name = _ref13[0];
      return name;
    }));
    for (var vertex of [baseVertex, ...targets.map(target => {
      var _target$vertex6;
      return (_target$vertex6 = target.vertex) != null ? _target$vertex6 : {};
    })]) {
      for (var name of Object.keys(vertex)) {
        if (known.has(name)) continue;
        var match = /^(normal|tangent|binormal)([1-9][0-9]*)$/.exec(name);
        if (!match) continue;
        var usage = match[1][0].toUpperCase() + match[1].slice(1);
        specs.push([name, usage, 3, Number(match[2])]);
        known.add(name);
      }
    }
    return specs.sort((left, right) => {
      var _left$, _right$;
      return Usage.indexOf(left[1]) - Usage.indexOf(right[1]) || ((_left$ = left[3]) != null ? _left$ : 0) - ((_right$ = right[3]) != null ? _right$ : 0);
    });
  }
  function buildMorphDecl(specs) {
    var offset = 0;
    return specs.map(_ref14 => {
      var usage = _ref14.usage,
        usageIndex = _ref14.usageIndex,
        type = _ref14.type,
        elementCount = _ref14.elementCount;
      var element = {
        usage,
        usageIndex,
        type,
        elementCount,
        offset
      };
      offset += elementCount * elementTypeSize(type);
      return element;
    });
  }
  function morphChannelElementCount(mesh, targets, name, defaultCount) {
    if (!/^tangent(?:[1-9][0-9]*)?$/.test(name) && !/^binormal(?:[1-9][0-9]*)?$/.test(name)) return defaultCount;
    for (var target of targets) {
      var _target$vertex$name3, _target$vertex7;
      var values = (_target$vertex$name3 = (_target$vertex7 = target.vertex) === null || _target$vertex7 === void 0 ? void 0 : _target$vertex7[name]) != null ? _target$vertex$name3 : [];
      var vertexCount = morphTargetVertexCount(mesh, target);
      if (!values.length || !vertexCount || values.length % vertexCount) continue;
      var width = values.length / vertexCount;
      if (width === 3 || width === 4) return width;
    }
    return defaultCount;
  }
  function buildBoneBinding(binding) {
    var _binding$name, _ref15, _binding$minBounds, _binding$bounds, _ref16, _binding$maxBounds, _binding$bounds2;
    return {
      name: (_binding$name = binding.name) != null ? _binding$name : "",
      bounds: {
        min: (_ref15 = (_binding$minBounds = binding.minBounds) != null ? _binding$minBounds : (_binding$bounds = binding.bounds) === null || _binding$bounds === void 0 ? void 0 : _binding$bounds.min) != null ? _ref15 : [0, 0, 0],
        max: (_ref16 = (_binding$maxBounds = binding.maxBounds) != null ? _binding$maxBounds : (_binding$bounds2 = binding.bounds) === null || _binding$bounds2 === void 0 ? void 0 : _binding$bounds2.max) != null ? _ref16 : [0, 0, 0]
      }
    };
  }
  function buildDecl(vertex) {
    var _vertex$position6;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var decl = [];
    var offset = 0;
    var vertexCount = ((_vertex$position6 = vertex.position) != null ? _vertex$position6 : []).length / 3;
    var dynamicChannels = [];
    for (var name of Object.keys(vertex)) {
      var match = /^(normal|tangent|binormal|texcoord|color)([0-9]+)$/.exec(name);
      if (match) {
        var usage = {
          normal: "Normal",
          tangent: "Tangent",
          binormal: "Binormal",
          texcoord: "TexCoord",
          color: "Color"
        }[match[1]];
        var defaultCount = usage === "TexCoord" ? 2 : usage === "Color" ? 4 : 3;
        dynamicChannels.push([name, usage, defaultCount, Number(match[2])]);
      }
    }
    dynamicChannels.sort((left, right) => Usage.indexOf(left[1]) - Usage.indexOf(right[1]) || left[3] - right[3]);
    for (var channel of [["position", "Position", 3], ["normal", "Normal", 3], ["tangent", "Tangent", 3], ["binormal", "Binormal", 3], ...dynamicChannels, ["blendIndice", "BoneIndices", 4, 0, (_options$boneIndexTyp = options.boneIndexType) != null ? _options$boneIndexTyp : "UInt16"], ["blendWeight", "BoneWeights", 4, 0], ["packedTangent", "PackedTangent", 4, 0, "Int16Norm"], ["packedTangentLegacy", "PackedTangentLegacy", 4, 0, "UInt16Norm"]]) {
      var _options$boneIndexTyp;
      var _channel = _slicedToArray(channel, 5),
        _name = _channel[0],
        _usage = _channel[1],
        _defaultCount = _channel[2],
        _channel$ = _channel[3],
        usageIndex = _channel$ === void 0 ? 0 : _channel$,
        _channel$2 = _channel[4],
        type = _channel$2 === void 0 ? "Float32" : _channel$2;
      if (!Array.isArray(vertex[_name]) || vertex[_name].length === 0) {
        continue;
      }
      var direction4 = /^(?:tangent|binormal)(?:[1-9][0-9]*)?$/.test(_name);
      var count = (direction4 || _usage === "Color") && vertexCount > 0 && vertex[_name].length === vertexCount * 4 ? 4 : _usage === "Color" && vertexCount > 0 && vertex[_name].length === vertexCount * 3 ? 3 : _defaultCount;
      decl.push({
        usage: _usage,
        usageIndex,
        type,
        elementCount: count,
        offset
      });
      offset += count * elementTypeSize(type);
    }
    return decl;
  }
  function boundsFromShared(mesh) {
    var _ref17, _mesh$minBounds, _mesh$bounds, _ref18, _mesh$maxBounds, _mesh$bounds2;
    return {
      min: (_ref17 = (_mesh$minBounds = mesh.minBounds) != null ? _mesh$minBounds : (_mesh$bounds = mesh.bounds) === null || _mesh$bounds === void 0 ? void 0 : _mesh$bounds.min) != null ? _ref17 : [0, 0, 0],
      max: (_ref18 = (_mesh$maxBounds = mesh.maxBounds) != null ? _mesh$maxBounds : (_mesh$bounds2 = mesh.bounds) === null || _mesh$bounds2 === void 0 ? void 0 : _mesh$bounds2.max) != null ? _ref18 : [0, 0, 0]
    };
  }
  function normalizeMetadata(metadata) {
    if (!metadata) return null;
    if (Array.isArray(metadata.entries)) return metadata;
    return {
      entries: Object.entries(metadata).map(_ref19 => {
        var _ref20 = _slicedToArray(_ref19, 2),
          key = _ref20[0],
          value = _ref20[1];
        return {
          key,
          value: String(value)
        };
      })
    };
  }
  function hydrateSharedMesh(mesh, classes) {
    var _mesh$vertex0, _mesh$indices2;
    return hydrate("Mesh", {
      name: mesh.name,
      morphTargets: mesh.morphTargets.targets.map((target, index) => {
        var _mesh$lods$0$morphTar, _mesh$lods$;
        return hydrate("MorphTarget", _objectSpread2(_objectSpread2({}, target), {}, {
          dataIsDeltas: false,
          vertex: (_mesh$lods$0$morphTar = (_mesh$lods$ = mesh.lods[0]) === null || _mesh$lods$ === void 0 || (_mesh$lods$ = _mesh$lods$.morphTargets[index]) === null || _mesh$lods$ === void 0 ? void 0 : _mesh$lods$.vertex) != null ? _mesh$lods$0$morphTar : null
        }), classes);
      }),
      minBounds: mesh.bounds.min,
      maxBounds: mesh.bounds.max,
      boneBindings: mesh.boneBindings.map(binding => hydrate("BoneBinding", {
        name: binding.name,
        minBounds: binding.bounds.min,
        maxBounds: binding.bounds.max
      }, classes)),
      vertex: (_mesh$vertex0 = mesh.vertex) != null ? _mesh$vertex0 : emptyVertex(),
      indices: ((_mesh$indices2 = mesh.indices) != null ? _mesh$indices2 : []).map(group => hydrate("IndexGroup", {
        name: group.name,
        bytesPerIndex: group.bytesPerIndex,
        firstElement: group.firstElement,
        elementCount: group.elementCount,
        pointCount: group.pointCount,
        faces: group.faces
      }, classes)),
      lods: mesh.lods,
      topology: mesh.topology,
      skeleton: mesh.skeleton
    }, classes);
  }
  function hydrateMetadata$1(metadata, classes) {
    return hydrate("Metadata", {
      entries: metadata.entries.map(entry => hydrate("MetadataEntry", entry, classes))
    }, classes);
  }
  function hydrateSkeleton$1(skeleton, classes) {
    return hydrate("Skeleton", skeleton, classes);
  }
  function hydrateAnimation$1(animation, classes) {
    return hydrate("Animation", animation, classes);
  }
  function emptyVertex() {
    return {
      position: [],
      normal: [],
      tangent: [],
      binormal: [],
      texcoord0: [],
      texcoord1: [],
      color0: [],
      blendIndice: [],
      blendWeight: [],
      packedTangent: [],
      packedTangentLegacy: []
    };
  }
  function hydrate(type, fields, classes) {
    var hydrationOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var Class = classes === null || classes === void 0 ? void 0 : classes[type];
    var options = Object.keys(hydrationOptions).length > 0 ? hydrationOptions : (classes === null || classes === void 0 ? void 0 : classes.__hydrationOptions) || {};
    return Class ? populate$1(new Class(), fields, options) : fields;
  }
  function populate$1(instance, fields) {
    var hydrationOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!instance || typeof instance.SetValues !== "function") {
      throw new TypeError("CjsCmfFormat shared class population requires classes to implement SetValues(values)");
    }
    instance.SetValues(fields, _objectSpread2(_objectSpread2({}, hydrationOptions), {}, {
      skipUpdate: true,
      skipEvents: true
    }));
    return instance;
  }
  function createHydrationClasses(classes, hydrationOptions) {
    var map = Object.create(classes || null);
    Object.defineProperty(map, "__hydrationOptions", {
      value: hydrationOptions,
      enumerable: false
    });
    return map;
  }

  var NO_CURVE = Object.freeze({
    format: 0,
    degree: 0,
    error: "no curve data"
  });
  function copyNoCurve() {
    return _objectSpread2({}, NO_CURVE);
  }
  function expandScaleControls(values) {
    var expanded = [];
    for (var i = 0; i < values.length; i += 3) {
      expanded.push(values[i], 0, 0, 0, values[i + 1], 0, 0, 0, values[i + 2]);
    }
    return expanded;
  }
  function decodeCurveArray(input, type, expectedLength) {
    if (Array.isArray(input) && input.length === expectedLength && input.every(Number.isFinite)) {
      return input.slice();
    }
    return decodeElementArray(input, type);
  }
  function convertCurve(curve, targetDimension) {
    var expandScale = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var normalizeRotation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (!curve) return copyNoCurve();
    if (curve.interpolation !== "Step" && curve.interpolation !== "Linear") {
      throw new Error("CMF to GR2: unsupported animation interpolation \"".concat(curve.interpolation, "\""));
    }
    var knots = decodeCurveArray(curve.knots, curve.knotType, curve.knotCount);
    var controls = decodeCurveArray(curve.values, curve.valueType, curve.knotCount * curve.valueDimension);
    if (knots.length !== curve.knotCount) {
      throw new Error("CMF to GR2: curve declares ".concat(curve.knotCount, " knots but contains ").concat(knots.length));
    }
    if (controls.length !== curve.knotCount * curve.valueDimension) {
      throw new Error("CMF to GR2: curve expects ".concat(curve.knotCount * curve.valueDimension, " values but contains ").concat(controls.length));
    }
    if (curve.valueDimension !== targetDimension) {
      throw new Error("CMF to GR2: curve dimension ".concat(curve.valueDimension, " does not match target dimension ").concat(targetDimension));
    }
    if (normalizeRotation) {
      controls = normalizeQuaternionSeries(controls, "CMF to GR2 rotation curve");
    }
    if (expandScale) controls = expandScaleControls(controls);
    return {
      format: 1,
      degree: curve.interpolation === "Step" ? 0 : 1,
      knots,
      controls
    };
  }
  function makeTransformTrack(name) {
    return {
      name,
      flags: 0,
      orientation: copyNoCurve(),
      position: copyNoCurve(),
      scaleShear: copyNoCurve()
    };
  }
  function animationGroups(animation, skeletons) {
    var boneChannels = new Map();
    var vectorTracks = [];
    var channelKeys = new Set();
    for (var channel of (_animation$channels = animation.channels) != null ? _animation$channels : []) {
      var _animation$channels, _channel$target, _animation$curves;
      if (!["MorphTarget", "BonePosition", "BoneRotation", "BoneScale"].includes(channel.targetType)) {
        var _channel$targetType;
        throw new Error("CMF to GR2: unsupported animation target type \"".concat((_channel$targetType = channel.targetType) != null ? _channel$targetType : "", "\""));
      }
      var key = "".concat(channel.targetType, "\0").concat((_channel$target = channel.target) != null ? _channel$target : "");
      if (channelKeys.has(key)) {
        var _channel$target2;
        throw new Error("CMF to GR2: duplicate ".concat(channel.targetType, " target \"").concat((_channel$target2 = channel.target) != null ? _channel$target2 : "", "\""));
      }
      channelKeys.add(key);
      if (!Number.isInteger(channel.curveIndex) || !((_animation$curves = animation.curves) !== null && _animation$curves !== void 0 && _animation$curves[channel.curveIndex])) {
        var _channel$target3;
        throw new Error("CMF to GR2: channel \"".concat((_channel$target3 = channel.target) != null ? _channel$target3 : "", "\" references a missing curve"));
      }
      var curve = animation.curves[channel.curveIndex];
      if (channel.targetType === "MorphTarget") {
        var _channel$target4;
        vectorTracks.push({
          name: (_channel$target4 = channel.target) != null ? _channel$target4 : "",
          dimension: 1,
          valueCurve: convertCurve(curve, 1)
        });
        continue;
      }
      var track = boneChannels.get(channel.target);
      if (!track) {
        var _channel$target5;
        track = makeTransformTrack((_channel$target5 = channel.target) != null ? _channel$target5 : "");
        boneChannels.set(channel.target, track);
      }
      if (channel.targetType === "BonePosition") track.position = convertCurve(curve, 3);else if (channel.targetType === "BoneRotation") track.orientation = convertCurve(curve, 4, false, true);else if (channel.targetType === "BoneScale") {
        track.scaleShear = convertCurve(curve, 3, true);
      }
    }
    var _loop = function (_track) {
      var matches = (skeletons != null ? skeletons : []).filter(skeleton => {
        var _skeleton$bones3;
        return ((_skeleton$bones3 = skeleton.bones) != null ? _skeleton$bones3 : []).includes(_track.name);
      });
      if (matches.length !== 1) {
        var reason = matches.length ? "is ambiguous across skeletons" : "does not resolve to a skeleton";
        throw new Error("CMF to GR2: bone animation target \"".concat(_track.name, "\" ").concat(reason));
      }
    };
    for (var _track of boneChannels.values()) {
      _loop(_track);
    }
    var groups = [];
    var claimedTargets = new Set();
    var _loop2 = function () {
      var _skeleton$bones4, _skeleton$name4;
      var boneNames = new Set((_skeleton$bones4 = skeleton.bones) != null ? _skeleton$bones4 : []);
      var transformTracks = [...boneChannels.values()].filter(track => boneNames.has(track.name));
      if (!transformTracks.length) return 1; // continue
      for (var _track2 of transformTracks) claimedTargets.add(_track2.name);
      groups.push({
        name: (_skeleton$name4 = skeleton.name) != null ? _skeleton$name4 : "",
        transformTracks,
        vectorTracks: []
      });
    };
    for (var skeleton of skeletons != null ? skeletons : []) {
      if (_loop2()) continue;
    }
    var unclaimed = [...boneChannels.values()].filter(track => !claimedTargets.has(track.name));
    if (unclaimed.length) groups.push({
      name: "",
      transformTracks: unclaimed,
      vectorTracks: []
    });
    if (vectorTracks.length) groups.push({
      name: "root",
      transformTracks: [],
      vectorTracks
    });
    return groups;
  }

  /** Build GR2-shaped animations from CMF native animations. */
  function buildGr2Animations(raw) {
    var _raw$animations;
    return ((_raw$animations = raw.animations) != null ? _raw$animations : []).map(animation => {
      var _animation$name, _animation$duration;
      return {
        name: (_animation$name = animation.name) != null ? _animation$name : "",
        duration: (_animation$duration = animation.duration) != null ? _animation$duration : 0,
        timeStep: 0,
        oversampling: 0,
        defaultLoopCount: 0,
        flags: 0,
        trackGroups: animationGroups(animation, raw.skeletons)
      };
    });
  }

  var DEFAULT_LINEAR_TOLERANCE = 0.1;
  var DEFAULT_ORIENTATION_TOLERANCE = Math.PI / 1800;
  var UINT16_MAX = 0xffff;
  var UINT8_MAX = 0xff;
  var CONTROL15_MAX = 0x7fff;
  var CONTROL7_MAX = 0x7f;
  var FLOAT_BITS = new DataView(new ArrayBuffer(4));
  function assertCurve(curve, dimension) {
    if (!curve || !Array.isArray(curve.knots) || !Array.isArray(curve.controls)) {
      throw new TypeError("GR2 curve compression requires explicit knots and controls");
    }
    if (!Number.isInteger(dimension) || dimension <= 0) {
      throw new TypeError("GR2 curve compression requires a positive control dimension");
    }
    if (curve.controls.length !== curve.knots.length * dimension) {
      throw new Error("GR2 curve compression control count does not match its knots and dimension");
    }
    if (!curve.knots.length || curve.knots.some(value => !Number.isFinite(value)) || curve.controls.some(value => !Number.isFinite(value))) {
      throw new Error("GR2 curve compression requires finite non-empty curve data");
    }
    if (curve.knots[0] < 0) {
      throw new Error("GR2 curve compression requires non-negative knots");
    }
    for (var index = 1; index < curve.knots.length; index++) {
      if (curve.knots[index] < curve.knots[index - 1]) {
        throw new Error("GR2 curve compression requires non-decreasing knots");
      }
      if ((curve.degree | 0) <= 1 && curve.knots[index] === curve.knots[index - 1]) {
        throw new Error("GR2 degree-zero and degree-one curves require distinct knots");
      }
    }
  }
  function uncompressedCurve(curve) {
    return {
      format: FORMAT_DA_K32F_C32F,
      degree: curve.degree | 0,
      knots: curve.knots.map(Math.fround),
      controls: curve.controls.map(Math.fround)
    };
  }
  function alignedPayloadBytes(length, componentSize) {
    return Math.ceil(length * componentSize / 4) * 4;
  }
  function estimatedCurveBytes(curve) {
    var _curve$knotsControls$, _curve$knotsControls;
    var count = (_curve$knotsControls$ = (_curve$knotsControls = curve.knotsControls) === null || _curve$knotsControls === void 0 ? void 0 : _curve$knotsControls.length) != null ? _curve$knotsControls$ : 0;
    switch (curve.format) {
      case FORMAT_DA_K32F_C32F:
        return 44 + curve.knots.length * 4 + curve.controls.length * 4;
      case FORMAT_DA_IDENTITY:
        return 4;
      case FORMAT_DA_CONSTANT_32F:
        return 24 + curve.controls.length * 4;
      case FORMAT_D3_CONSTANT_32F:
        return 16;
      case FORMAT_D4_CONSTANT_32F:
        return 20;
      case FORMAT_DA_K16U_C16U:
        return 44 + curve.controlScaleOffsets.length * 4 + alignedPayloadBytes(count, 2);
      case FORMAT_DA_K8U_C8U:
        return 44 + curve.controlScaleOffsets.length * 4 + alignedPayloadBytes(count, 1);
      case FORMAT_D4N_K16U_C15U:
        return 28 + alignedPayloadBytes(count, 2);
      case FORMAT_D4N_K8U_C7U:
        return 28 + alignedPayloadBytes(count, 1);
      case FORMAT_D3_K16U_C16U:
      case FORMAT_D3I1_K16U_C16U:
      case FORMAT_D9I3_K16U_C16U:
        return 48 + alignedPayloadBytes(count, 2);
      case FORMAT_D3_K8U_C8U:
      case FORMAT_D3I1_K8U_C8U:
      case FORMAT_D9I3_K8U_C8U:
        return 48 + alignedPayloadBytes(count, 1);
      case FORMAT_D9I1_K16U_C16U:
        return 32 + alignedPayloadBytes(count, 2);
      case FORMAT_D9I1_K8U_C8U:
        return 32 + alignedPayloadBytes(count, 1);
      case FORMAT_D3I1_K32F_C32F:
        return 48 + count * 4;
      default:
        return Infinity;
    }
  }
  function valuesWithinTolerance(source, decoded, dimension, tolerance, asQuaternion) {
    if (asQuaternion) {
      return quaternionAngularDifference(normalizeQuaternion(source, "source GR2 orientation"), normalizeQuaternion(decoded, "decoded GR2 orientation")) <= tolerance;
    }
    var squareError = 0;
    for (var component = 0; component < dimension; component++) {
      var difference = source[component] - decoded[component];
      squareError += difference * difference;
    }
    return Math.sqrt(squareError) <= tolerance;
  }
  function candidateWithinTolerance(source, candidate, dimension, tolerance, duration, asQuaternion) {
    var decoded = decodeCurve(candidate, dimension);
    if (decoded.knots.length !== source.knots.length || decoded.controls.length !== source.controls.length) {
      return false;
    }
    for (var index = 1; index < decoded.knots.length; index++) {
      if ((source.degree | 0) <= 1 && decoded.knots[index] <= decoded.knots[index - 1]) return false;
    }
    for (var key = 0; key < source.knots.length; key++) {
      var offset = key * dimension;
      if (!valuesWithinTolerance(source.controls.slice(offset, offset + dimension), decoded.controls.slice(offset, offset + dimension), dimension, tolerance, asQuaternion)) return false;
    }
    var boundaries = [0, ...source.knots, ...decoded.knots];
    if (Number.isFinite(duration) && duration >= 0) boundaries.push(duration);
    boundaries.sort((a, b) => a - b);
    var uniqueBoundaries = boundaries.filter((time, index) => index === 0 || time !== boundaries[index - 1]);
    var fractions = asQuaternion ? QUATERNION_SEGMENT_SAMPLE_FRACTIONS : [0.5];
    var sampleTimes = [];
    for (var _index = 0; _index < uniqueBoundaries.length; _index++) {
      var time = uniqueBoundaries[_index];
      if (_index) {
        var previous = uniqueBoundaries[_index - 1];
        for (var fraction of fractions) sampleTimes.push(previous + (time - previous) * fraction);
      }
      sampleTimes.push(time);
    }
    var sourceCurve = _objectSpread2(_objectSpread2({}, source), {}, {
      dimension
    });
    var sourceValue = new Array(dimension);
    var decodedValue = new Array(dimension);
    var curveDuration = duration != null ? duration : source.knots[source.knots.length - 1];
    for (var _time of sampleTimes) {
      sampleDecodedCurve(sourceValue, sourceCurve, _time, false, curveDuration);
      sampleDecodedCurve(decodedValue, decoded, _time, false, curveDuration);
      if (!valuesWithinTolerance(sourceValue, decodedValue, dimension, tolerance, asQuaternion)) return false;
    }
    if (asQuaternion && (source.degree | 0) === 1) {
      var sourceStart = new Array(4);
      var sourceEnd = new Array(4);
      var decodedStart = new Array(4);
      var decodedEnd = new Array(4);
      for (var _index2 = 1; _index2 < uniqueBoundaries.length; _index2++) {
        var start = uniqueBoundaries[_index2 - 1];
        var end = uniqueBoundaries[_index2];
        sampleDecodedCurve(sourceStart, sourceCurve, start, false, curveDuration);
        sampleDecodedCurve(sourceEnd, sourceCurve, end, false, curveDuration);
        sampleDecodedCurve(decodedStart, decoded, start, false, curveDuration);
        sampleDecodedCurve(decodedEnd, decoded, end, false, curveDuration);
        try {
          if (maximumQuaternionLerpAngularDifference(sourceStart, sourceEnd, decodedStart, decodedEnd) > tolerance) return false;
        } catch (_unused) {
          return false;
        }
      }
    }
    return true;
  }
  function selectSmallestCandidate(source, candidates, dimension, tolerance, duration) {
    var asQuaternion = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    var best = uncompressedCurve(source);
    var bestSize = estimatedCurveBytes(best);
    for (var candidate of candidates) {
      if (!candidate || !candidateWithinTolerance(source, candidate, dimension, tolerance, duration, asQuaternion)) continue;
      var size = estimatedCurveBytes(candidate);
      if (size < bestSize) {
        best = candidate;
        bestSize = size;
      }
    }
    return best;
  }
  function high16(value) {
    FLOAT_BITS.setFloat32(0, Math.fround(value), true);
    return FLOAT_BITS.getUint16(2, true);
  }
  function knotPacking(knots, maximum) {
    var last = knots[knots.length - 1];
    var requestedScale = last > 0 ? maximum / last : 1;
    var oneOverKnotScaleTrunc = high16(requestedScale);
    var scale = knotScaleFromTrunc(oneOverKnotScaleTrunc);
    if (!(scale > 0)) {
      oneOverKnotScaleTrunc = high16(1);
      scale = 1;
    }
    return {
      oneOverKnotScaleTrunc,
      values: knots.map(value => Math.max(0, Math.min(maximum, Math.floor(value * scale))))
    };
  }
  function floatKnotPacking(knots, maximum) {
    var last = knots[knots.length - 1];
    var oneOverKnotScale = Math.fround(last > 0 ? maximum / last : 1);
    return {
      oneOverKnotScale,
      values: knots.map(value => Math.max(0, Math.min(maximum, Math.floor(value * oneOverKnotScale))))
    };
  }
  function componentPacking(controls, dimension, maximum) {
    var components = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : dimension;
    var scales = new Array(components);
    var offsets = new Array(components);
    var values = new Array(controls.length / dimension * components);
    for (var component = 0; component < components; component++) {
      var minimum = Infinity;
      var maximumValue = -Infinity;
      for (var index = component; index < controls.length; index += dimension) {
        minimum = Math.min(minimum, controls[index]);
        maximumValue = Math.max(maximumValue, controls[index]);
      }
      var scale = Math.fround(maximumValue === minimum ? 0 : (maximumValue - minimum) / maximum);
      scales[component] = scale;
      offsets[component] = Math.fround(minimum);
      for (var key = 0; key < controls.length / dimension; key++) {
        var value = controls[key * dimension + component];
        values[key * components + component] = scale === 0 ? 0 : Math.max(0, Math.min(maximum, Math.round((value - offsets[component]) / scale)));
      }
    }
    return {
      scales,
      offsets,
      values
    };
  }
  function allControlsEqual(controls, dimension) {
    for (var index = dimension; index < controls.length; index++) {
      if (controls[index] !== controls[index % dimension]) return false;
    }
    return true;
  }
  function isIdentity(controls, identity) {
    return Array.isArray(identity) && identity.length === controls.length && identity.every((value, index) => controls[index] === value);
  }
  function constantCurve(curve, dimension, identity) {
    var controls = curve.controls.slice(0, dimension).map(Math.fround);
    if (isIdentity(controls, identity)) {
      return {
        format: FORMAT_DA_IDENTITY,
        degree: 0,
        dimension
      };
    }
    if (dimension === 3) return {
      format: FORMAT_D3_CONSTANT_32F,
      degree: 0,
      controls
    };
    if (dimension === 4) return {
      format: FORMAT_D4_CONSTANT_32F,
      degree: 0,
      controls
    };
    return {
      format: FORMAT_DA_CONSTANT_32F,
      degree: 0,
      controls
    };
  }
  function encodeDaK(curve, dimension, maximum, format) {
    var knots = knotPacking(curve.knots, maximum);
    var controls = componentPacking(curve.controls, dimension, maximum);
    return {
      format,
      degree: curve.degree | 0,
      oneOverKnotScaleTrunc: knots.oneOverKnotScaleTrunc,
      controlScaleOffsets: [...controls.scales, ...controls.offsets],
      knotsControls: [...knots.values, ...controls.values]
    };
  }
  function encodeD3K(curve, maximum, format) {
    var knots = knotPacking(curve.knots, maximum);
    var controls = componentPacking(curve.controls, 3, maximum);
    return {
      format,
      degree: curve.degree | 0,
      oneOverKnotScaleTrunc: knots.oneOverKnotScaleTrunc,
      controlScales: controls.scales,
      controlOffsets: controls.offsets,
      knotsControls: [...knots.values, ...controls.values]
    };
  }
  function d3I1Shape(controls) {
    var count = controls.length / 3;
    var dominant = 0;
    var dominantMinimum = Infinity;
    var dominantMaximum = -Infinity;
    var dominantRange = -Infinity;
    var minimumIndex = 0;
    var maximumIndex = 0;
    for (var component = 0; component < 3; component++) {
      var minimum = Infinity;
      var maximum = -Infinity;
      var lowIndex = 0;
      var highIndex = 0;
      for (var key = 0; key < count; key++) {
        var value = controls[key * 3 + component];
        if (value < minimum) {
          minimum = value;
          lowIndex = key;
        }
        if (value > maximum) {
          maximum = value;
          highIndex = key;
        }
      }
      var range = maximum - minimum;
      if (range > dominantRange) {
        dominant = component;
        dominantMinimum = minimum;
        dominantMaximum = maximum;
        dominantRange = range;
        minimumIndex = lowIndex;
        maximumIndex = highIndex;
      }
    }
    var span = dominantMaximum - dominantMinimum;
    if (!(span > 0)) return null;
    var offsets = controls.slice(minimumIndex * 3, minimumIndex * 3 + 3).map(Math.fround);
    var maximumControl = controls.slice(maximumIndex * 3, maximumIndex * 3 + 3);
    var scales = maximumControl.map((value, component) => Math.fround(value - offsets[component]));
    var parameters = new Array(count);
    for (var _key = 0; _key < count; _key++) {
      parameters[_key] = (controls[_key * 3 + dominant] - dominantMinimum) / span;
    }
    return {
      offsets,
      scales,
      parameters
    };
  }
  function encodeD3I1Float(curve, shape) {
    return {
      format: FORMAT_D3I1_K32F_C32F,
      degree: curve.degree | 0,
      controlScales: shape.scales,
      controlOffsets: shape.offsets,
      knotsControls: [...curve.knots.map(Math.fround), ...shape.parameters.map(Math.fround)]
    };
  }
  function encodeD3I1(curve, shape, maximum, format) {
    var knots = knotPacking(curve.knots, maximum);
    return {
      format,
      degree: curve.degree | 0,
      oneOverKnotScaleTrunc: knots.oneOverKnotScaleTrunc,
      controlScales: shape.scales.map(value => Math.fround(value / maximum)),
      controlOffsets: shape.offsets,
      knotsControls: [...knots.values, ...shape.parameters.map(value => Math.max(0, Math.min(maximum, Math.round(value * maximum))))]
    };
  }
  function scaleCurveShape(controls) {
    var uniform = true;
    for (var index = 0; index < controls.length; index += 9) {
      for (var offDiagonal of [1, 2, 3, 5, 6, 7]) {
        if (Math.abs(controls[index + offDiagonal]) > 1e-7) return null;
      }
      if (Math.abs(controls[index] - controls[index + 4]) > 1e-7 || Math.abs(controls[index] - controls[index + 8]) > 1e-7) {
        uniform = false;
      }
    }
    return uniform ? "uniform" : "diagonal";
  }
  function encodeD9I(curve, shape, maximum, uniformFormat, diagonalFormat) {
    var knots = knotPacking(curve.knots, maximum);
    if (shape === "uniform") {
      var _diagonal = [];
      for (var index = 0; index < curve.controls.length; index += 9) _diagonal.push(curve.controls[index]);
      var _packed = componentPacking(_diagonal, 1, maximum);
      return {
        format: uniformFormat,
        degree: curve.degree | 0,
        oneOverKnotScaleTrunc: knots.oneOverKnotScaleTrunc,
        controlScales: _packed.scales,
        controlOffsets: _packed.offsets,
        knotsControls: [...knots.values, ..._packed.values]
      };
    }
    var diagonal = [];
    for (var _index3 = 0; _index3 < curve.controls.length; _index3 += 9) {
      diagonal.push(curve.controls[_index3], curve.controls[_index3 + 4], curve.controls[_index3 + 8]);
    }
    var packed = componentPacking(diagonal, 3, maximum);
    return {
      format: diagonalFormat,
      degree: curve.degree | 0,
      oneOverKnotScaleTrunc: knots.oneOverKnotScaleTrunc,
      controlScales: packed.scales,
      controlOffsets: packed.offsets,
      knotsControls: [...knots.values, ...packed.values]
    };
  }
  function selectorForRange(minimum, maximum, multiplier, controlMaximum) {
    var best = null;
    for (var selector = 0; selector < D4N_SCALE_TABLE.length; selector++) {
      var scale = Math.fround(D4N_SCALE_TABLE[selector] * multiplier),
        offset = D4N_OFFSET_TABLE[selector],
        end = controlMaximum * scale + offset,
        lower = Math.min(offset, end) - Math.abs(scale) * 0.51,
        upper = Math.max(offset, end) + Math.abs(scale) * 0.51;
      if (minimum < lower || maximum > upper) continue;
      if (!best || Math.abs(scale) < Math.abs(best.scale)) best = {
        selector,
        scale,
        offset
      };
    }
    return best;
  }
  function encodeD4n(curve, tolerance, maximum, controlMaximum, multiplier, format) {
    var controls = normalizeQuaternionSeries(curve.controls.slice(), "GR2 orientation compression");
    var omitted = new Array(controls.length / 4);
    var ranges = Array.from({
      length: 4
    }, () => ({
      minimum: Infinity,
      maximum: -Infinity
    }));
    for (var key = 0; key < omitted.length; key++) {
      var offset = key * 4;
      var largest = 0;
      for (var component = 1; component < 4; component++) {
        if (Math.abs(controls[offset + component]) > Math.abs(controls[offset + largest])) largest = component;
      }
      omitted[key] = largest;
      for (var _component = 0; _component < 4; _component++) {
        if (_component === largest) continue;
        ranges[_component].minimum = Math.min(ranges[_component].minimum, controls[offset + _component]);
        ranges[_component].maximum = Math.max(ranges[_component].maximum, controls[offset + _component]);
      }
    }
    var selectors = ranges.map(range => range.minimum === Infinity ? {
      selector: 7,
      scale: Math.fround(D4N_SCALE_TABLE[7] * multiplier),
      offset: D4N_OFFSET_TABLE[7]
    } : selectorForRange(range.minimum, range.maximum, multiplier, controlMaximum));
    if (selectors.some(selector => !selector)) return null;
    var knots = floatKnotPacking(curve.knots, maximum);
    var packedControls = new Array(omitted.length * 3);
    var _loop = function () {
      var controlOffset = _key2 * 4,
        packedOffset = _key2 * 3,
        swizzle1 = omitted[_key2],
        swizzle2 = swizzle1 + 1 & 3,
        swizzle3 = swizzle2 + 1 & 3,
        swizzle4 = swizzle3 + 1 & 3;
      var quantize = component => {
        var entry = selectors[component];
        return Math.max(0, Math.min(controlMaximum, Math.round((controls[controlOffset + component] - entry.offset) / entry.scale)));
      };
      var signBit = maximum === UINT8_MAX ? 0x80 : 0x8000;
      var selectorShift = maximum === UINT8_MAX ? 6 : 14;
      var lowSelectorShift = maximum === UINT8_MAX ? 7 : 15;
      packedControls[packedOffset] = quantize(swizzle2) | (controls[controlOffset + swizzle1] < 0 ? signBit : 0);
      packedControls[packedOffset + 1] = quantize(swizzle3) | (swizzle1 & 2) << selectorShift;
      packedControls[packedOffset + 2] = quantize(swizzle4) | (swizzle1 & 1) << lowSelectorShift;
    };
    for (var _key2 = 0; _key2 < omitted.length; _key2++) {
      _loop();
    }
    var candidate = {
      format,
      degree: curve.degree | 0,
      scaleOffsetTableEntries: selectors.reduce((value, entry, component) => value | entry.selector << component * 4, 0),
      oneOverKnotScale: knots.oneOverKnotScale,
      knotsControls: [...knots.values, ...packedControls]
    };
    var decoded = decodeCurve(candidate, 4);
    for (var _key3 = 1; _key3 < decoded.knots.length; _key3++) {
      if ((curve.degree | 0) <= 1 && decoded.knots[_key3] <= decoded.knots[_key3 - 1]) return null;
    }
    for (var _key4 = 0; _key4 < omitted.length; _key4++) {
      var _offset = _key4 * 4;
      if (quaternionAngularDifference(controls.slice(_offset, _offset + 4), normalizeQuaternion(decoded.controls.slice(_offset, _offset + 4), "decoded GR2 orientation")) > tolerance) {
        return null;
      }
    }
    return candidate;
  }

  /**
   * Compress one explicit Granny curve using browser-safe JavaScript only.
   *
   * The first writer pass keeps the authored degree and knot count. It performs
   * format packing and quantization, while curve fitting/reduction remains a
   * separate optimization that can use this function's decoder validation.
   */
  function compressGr2Curve(curve, dimension) {
    var _options$tolerance;
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    assertCurve(curve, dimension);
    var asQuaternion = options.asQuaternion === true;
    if (asQuaternion && dimension !== 4) {
      throw new TypeError("GR2 quaternion compression requires dimension 4");
    }
    var source = asQuaternion ? _objectSpread2(_objectSpread2({}, curve), {}, {
      controls: normalizeQuaternionSeries(curve.controls.slice(), "GR2 orientation compression")
    }) : curve;
    if (source.knots.length === 1 || allControlsEqual(source.controls, dimension)) {
      return constantCurve(source, dimension, options.identity);
    }
    if (options.compressed === false || (source.degree | 0) > 1) {
      return uncompressedCurve(source);
    }
    if (asQuaternion) {
      var _options$orientationT;
      var _tolerance = (_options$orientationT = options.orientationTolerance) != null ? _options$orientationT : DEFAULT_ORIENTATION_TOLERANCE;
      return selectSmallestCandidate(source, [encodeD4n(source, _tolerance, UINT8_MAX, CONTROL7_MAX, D4N_SCALE_TABLE_MULTIPLIER_8, FORMAT_D4N_K8U_C7U), encodeD4n(source, _tolerance, UINT16_MAX, CONTROL15_MAX, D4N_SCALE_TABLE_MULTIPLIER_16, FORMAT_D4N_K16U_C15U)], dimension, _tolerance, options.duration, true);
    }
    if (dimension === 3) {
      var _options$positionTole;
      var _tolerance2 = (_options$positionTole = options.positionTolerance) != null ? _options$positionTole : DEFAULT_LINEAR_TOLERANCE;
      var shape = d3I1Shape(source.controls);
      return selectSmallestCandidate(source, [shape && encodeD3I1(source, shape, UINT8_MAX, FORMAT_D3I1_K8U_C8U), shape && encodeD3I1(source, shape, UINT16_MAX, FORMAT_D3I1_K16U_C16U), encodeD3K(source, UINT8_MAX, FORMAT_D3_K8U_C8U), encodeD3K(source, UINT16_MAX, FORMAT_D3_K16U_C16U), shape && encodeD3I1Float(source, shape)], dimension, _tolerance2, options.duration);
    }
    if (dimension === 9) {
      var _options$scaleShearTo;
      var _shape = scaleCurveShape(source.controls);
      var _tolerance3 = (_options$scaleShearTo = options.scaleShearTolerance) != null ? _options$scaleShearTo : DEFAULT_LINEAR_TOLERANCE;
      return selectSmallestCandidate(source, [_shape && encodeD9I(source, _shape, UINT8_MAX, FORMAT_D9I1_K8U_C8U, FORMAT_D9I3_K8U_C8U), _shape && encodeD9I(source, _shape, UINT16_MAX, FORMAT_D9I1_K16U_C16U, FORMAT_D9I3_K16U_C16U), encodeDaK(source, dimension, UINT8_MAX, FORMAT_DA_K8U_C8U), encodeDaK(source, dimension, UINT16_MAX, FORMAT_DA_K16U_C16U)], dimension, _tolerance3, options.duration);
    }
    var tolerance = (_options$tolerance = options.tolerance) != null ? _options$tolerance : DEFAULT_LINEAR_TOLERANCE;
    return selectSmallestCandidate(source, [encodeDaK(source, dimension, UINT8_MAX, FORMAT_DA_K8U_C8U), encodeDaK(source, dimension, UINT16_MAX, FORMAT_DA_K16U_C16U)], dimension, tolerance, options.duration);
  }

  var textEncoder = new TextEncoder();

  /**
   * Growable little-endian append cursor with reserve-and-patch support.
   *
   * `formats/cmf/core/writer.js` already has a growable buffer, but it is
   * patch-style throughout: every write takes an explicit offset produced by a
   * prior `reserve`. Container assembly wants the opposite default — append in
   * field order — with patching kept for the one case that needs it, an offset
   * table whose values are only known after the payload it points at has been
   * measured.
   *
   * Every append returns the offset it wrote at, so the reserve-and-patch case is
   * just "keep the offset an append returned".
   */
  var _bytes = /*#__PURE__*/_classPrivateFieldLooseKey("bytes");
  var _view = /*#__PURE__*/_classPrivateFieldLooseKey("view");
  var _length = /*#__PURE__*/_classPrivateFieldLooseKey("length");
  var _ensure = /*#__PURE__*/_classPrivateFieldLooseKey("ensure");
  var _advance = /*#__PURE__*/_classPrivateFieldLooseKey("advance");
  var _requireWritten = /*#__PURE__*/_classPrivateFieldLooseKey("requireWritten");
  class CjsByteWriter {
    /**
     * Creates an empty writer with an initial capacity.
     *
     * @param {number} [initialCapacity] Starting buffer size in bytes.
     */
    constructor() {
      var initialCapacity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1024;
      /**
       * Rejects a patch that falls outside the bytes already written.
       *
       * @param {number} offset Target offset.
       * @param {number} size Patch byte count.
       */
      Object.defineProperty(this, _requireWritten, {
        value: _requireWritten2
      });
      /**
       * Reserves space for one append and returns the offset it starts at.
       *
       * @param {number} size Byte count for this append.
       * @returns {number} Offset of the appended run.
       */
      Object.defineProperty(this, _advance, {
        value: _advance2
      });
      /**
       * Grows the buffer when a write would exceed capacity.
       *
       * @param {number} capacity Required total capacity.
       */
      Object.defineProperty(this, _ensure, {
        value: _ensure2
      });
      Object.defineProperty(this, _bytes, {
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, _view, {
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, _length, {
        writable: true,
        value: 0
      });
      var _capacity = Number.isInteger(initialCapacity) && initialCapacity > 0 ? initialCapacity : 1024;
      _classPrivateFieldLooseBase(this, _bytes)[_bytes] = new Uint8Array(_capacity);
      _classPrivateFieldLooseBase(this, _view)[_view] = new DataView(_classPrivateFieldLooseBase(this, _bytes)[_bytes].buffer);
    }

    /**
     * Returns the number of bytes written so far.
     *
     * @returns {number} Written byte count.
     */
    get length() {
      return _classPrivateFieldLooseBase(this, _length)[_length];
    }

    /**
     * Appends an unsigned 8-bit integer.
     *
     * @param {number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    u8(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](1);
      _classPrivateFieldLooseBase(this, _view)[_view].setUint8(offset, value & 0xff);
      return offset;
    }

    /**
     * Appends a little-endian unsigned 16-bit integer.
     *
     * @param {number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    u16(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](2);
      _classPrivateFieldLooseBase(this, _view)[_view].setUint16(offset, value & 0xffff, true);
      return offset;
    }

    /**
     * Appends a little-endian signed 16-bit integer.
     *
     * @param {number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    i16(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](2);
      _classPrivateFieldLooseBase(this, _view)[_view].setInt16(offset, value | 0, true);
      return offset;
    }

    /**
     * Appends a little-endian unsigned 32-bit integer.
     *
     * @param {number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    u32(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](4);
      _classPrivateFieldLooseBase(this, _view)[_view].setUint32(offset, value >>> 0, true);
      return offset;
    }

    /**
     * Appends a little-endian signed 32-bit integer.
     *
     * @param {number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    i32(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](4);
      _classPrivateFieldLooseBase(this, _view)[_view].setInt32(offset, value | 0, true);
      return offset;
    }

    /**
     * Appends a little-endian signed 64-bit integer.
     *
     * @param {bigint|number} value Integer value.
     * @returns {number} Offset the value was written at.
     */
    i64(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](8);
      _classPrivateFieldLooseBase(this, _view)[_view].setBigInt64(offset, BigInt(value), true);
      return offset;
    }

    /**
     * Appends a little-endian 32-bit float.
     *
     * @param {number} value Float value.
     * @returns {number} Offset the value was written at.
     */
    f32(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](4);
      _classPrivateFieldLooseBase(this, _view)[_view].setFloat32(offset, Number(value) || 0, true);
      return offset;
    }

    /**
     * Appends a little-endian 64-bit float.
     *
     * @param {number} value Float value.
     * @returns {number} Offset the value was written at.
     */
    f64(value) {
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](8);
      _classPrivateFieldLooseBase(this, _view)[_view].setFloat64(offset, Number(value) || 0, true);
      return offset;
    }

    /**
     * Appends Carbon's byte-sized boolean encoding.
     *
     * @param {boolean} value Boolean value.
     * @returns {number} Offset the value was written at.
     */
    bool(value) {
      return this.u8(value ? 1 : 0);
    }

    /**
     * Appends raw bytes.
     *
     * @param {ArrayBufferView|Uint8Array} value Bytes to append.
     * @returns {number} Offset the bytes were written at.
     */
    bytes(value) {
      var source = value instanceof Uint8Array ? value : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](source.byteLength);
      _classPrivateFieldLooseBase(this, _bytes)[_bytes].set(source, offset);
      return offset;
    }

    /**
     * Appends UTF-8 text without a terminator.
     *
     * @param {string} value Text to append.
     * @returns {number} Offset the text was written at.
     */
    utf8(value) {
      return this.bytes(textEncoder.encode(String(value)));
    }

    /**
     * Appends a run of zero bytes and returns its offset, for later patching.
     *
     * @param {number} count Byte count to reserve.
     * @returns {number} Offset of the reserved run.
     */
    reserve(count) {
      if (!Number.isInteger(count) || count < 0) {
        throw new CjsFormatWriteError("Reserve count must be a non-negative integer", {
          count
        });
      }
      var offset = _classPrivateFieldLooseBase(this, _advance)[_advance](count);
      _classPrivateFieldLooseBase(this, _bytes)[_bytes].fill(0, offset, offset + count);
      return offset;
    }

    /**
     * Overwrites a previously written unsigned 8-bit integer.
     *
     * @param {number} offset Target offset.
     * @param {number} value Integer value.
     */
    patchU8(offset, value) {
      _classPrivateFieldLooseBase(this, _requireWritten)[_requireWritten](offset, 1);
      _classPrivateFieldLooseBase(this, _view)[_view].setUint8(offset, value & 0xff);
    }

    /**
     * Overwrites a previously written little-endian unsigned 32-bit integer.
     *
     * @param {number} offset Target offset.
     * @param {number} value Integer value.
     */
    patchU32(offset, value) {
      _classPrivateFieldLooseBase(this, _requireWritten)[_requireWritten](offset, 4);
      _classPrivateFieldLooseBase(this, _view)[_view].setUint32(offset, value >>> 0, true);
    }

    /**
     * Overwrites a previously written byte range.
     *
     * @param {number} offset Target offset.
     * @param {ArrayBufferView|Uint8Array} value Replacement bytes.
     */
    patchBytes(offset, value) {
      var source = value instanceof Uint8Array ? value : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      _classPrivateFieldLooseBase(this, _requireWritten)[_requireWritten](offset, source.byteLength);
      _classPrivateFieldLooseBase(this, _bytes)[_bytes].set(source, offset);
    }

    /**
     * Returns an owned copy of the written bytes.
     *
     * @returns {Uint8Array} Written payload.
     */
    toBytes() {
      return _classPrivateFieldLooseBase(this, _bytes)[_bytes].slice(0, _classPrivateFieldLooseBase(this, _length)[_length]);
    }
  }
  function _ensure2(capacity) {
    if (capacity <= _classPrivateFieldLooseBase(this, _bytes)[_bytes].length) return;
    var next = _classPrivateFieldLooseBase(this, _bytes)[_bytes].length * 2;
    while (next < capacity) next *= 2;
    var grown = new Uint8Array(next);
    grown.set(_classPrivateFieldLooseBase(this, _bytes)[_bytes].subarray(0, _classPrivateFieldLooseBase(this, _length)[_length]));
    _classPrivateFieldLooseBase(this, _bytes)[_bytes] = grown;
    _classPrivateFieldLooseBase(this, _view)[_view] = new DataView(grown.buffer);
  }
  function _advance2(size) {
    var offset = _classPrivateFieldLooseBase(this, _length)[_length];
    _classPrivateFieldLooseBase(this, _ensure)[_ensure](offset + size);
    _classPrivateFieldLooseBase(this, _length)[_length] = offset + size;
    return offset;
  }
  function _requireWritten2(offset, size) {
    if (!Number.isInteger(offset) || offset < 0 || offset + size > _classPrivateFieldLooseBase(this, _length)[_length]) {
      throw new CjsFormatWriteError("Patch target is outside the written range", {
        offset,
        size,
        length: _classPrivateFieldLooseBase(this, _length)[_length]
      });
    }
  }

  var M = GRANNY_MEMBER_TYPES;
  var MAGIC_32_LE = new Uint8Array([0x29, 0xde, 0x6c, 0xc0, 0xba, 0xa4, 0x53, 0x2b, 0x25, 0xf5, 0xb7, 0xa5, 0xf6, 0x66, 0xe2, 0xee]);
  var MEMBER_SIZE = 32;
  var FILE_HEADER_OFFSET = 32;
  var SECTION_DIRECTORY_OFFSET = 104;
  var SECTION_RECORD_SIZE = 44;
  var TYPE_TAG_2_12 = 0x80000039;
  var UTF8 = new TextEncoder();
  var GR2_SECTION_COMPRESSION_NONE = "none";
  var GR2_SECTION_COMPRESSION_BITKNIT2_RAW = "bitknit2Raw";
  function align(value, alignment) {
    return Math.ceil(value / alignment) * alignment;
  }
  function bytesWith(size, write) {
    var bytes = new Uint8Array(size);
    write(new DataView(bytes.buffer));
    return bytes;
  }
  function crc32(bytes) {
    var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var crc = 0xffffffff;
    for (var index = start; index < bytes.length; index++) {
      crc ^= bytes[index];
      for (var bit = 0; bit < 8; bit++) {
        crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function primitiveSize(type) {
    switch (type) {
      case M.Real32:
      case M.Int32:
      case M.UInt32:
        return 4;
      case M.Int16:
      case M.UInt16:
      case M.BinormalInt16:
      case M.NormalUInt16:
      case M.Real16:
        return 2;
      case M.Int8:
      case M.UInt8:
      case M.BinormalInt8:
      case M.NormalUInt8:
        return 1;
      default:
        return 0;
    }
  }
  function memberSize(member, sizeOf) {
    var width = member.arrayWidth > 0 ? member.arrayWidth : 1;
    switch (member.type) {
      case M.Inline:
        return sizeOf(member.ref) * width;
      case M.Reference:
      case M.String:
        return 4;
      case M.EmptyReference:
        return 4;
      case M.ReferenceToArray:
      case M.ArrayOfReferences:
        return 8;
      case M.VariantReference:
        return 8;
      case M.ReferenceToVariantArray:
        return 12;
      case M.Transform:
        return 68;
      default:
        return primitiveSize(member.type) * width;
    }
  }

  /** Define one reflected Granny type used by the pure-JavaScript writer. */
  function gr2Type(name, members) {
    return {
      name,
      members: members.map(member => _objectSpread2({
        arrayWidth: 0,
        ref: null
      }, member))
    };
  }

  /** Wrap a dynamic object or array with its reflected Granny type. */
  function gr2Variant(type, value) {
    return {
      type,
      value
    };
  }

  /** Serializes one reflected Granny object graph into relocatable section data. */
  class SectionSerializer {
    /** Create a serializer for a closed set of reflected types. */
    constructor(types) {
      this.types = types;
      this.writer = new CjsByteWriter();
      this.typeOffsets = new Map();
      this.stringOffsets = new Map();
      this.objectOffsets = new Map();
      this.sizeCache = new Map();
      this.fixups = [];
      this.mixedFixups = [];
    }

    /** Serialize the root graph and return section bytes plus relocation metadata. */
    Serialize(rootType, root) {
      for (var type of this.types) {
        this.typeOffsets.set(type, this.Allocate((type.members.length + 1) * MEMBER_SIZE));
      }
      for (var _type of this.types) this.WriteType(_type);
      var rootOffset = this.WriteObject(rootType, root);
      this.Align(4);
      this.fixups.sort((a, b) => a.from - b.from);
      this.mixedFixups.sort((a, b) => a.offset - b.offset);
      return {
        bytes: this.writer.toBytes(),
        fixups: this.fixups,
        mixedFixups: this.mixedFixups,
        rootTypeOffset: this.TypeOffset(rootType),
        rootOffset
      };
    }

    /** Advance the section cursor to the requested byte alignment. */
    Align(alignment) {
      var size = align(this.writer.length, alignment) - this.writer.length;
      if (size) this.writer.reserve(size);
    }

    /** Allocate a four-byte-aligned zeroed section block. */
    Allocate(size) {
      this.Align(4);
      return this.writer.reserve(size);
    }

    /** Resolve the section offset of a registered reflected type. */
    TypeOffset(type) {
      var offset = this.typeOffsets.get(type);
      if (offset === undefined) {
        var _type$name;
        throw new CjsFormatWriteError("GR2 writer did not register reflected type \"".concat((_type$name = type === null || type === void 0 ? void 0 : type.name) != null ? _type$name : "", "\""));
      }
      return offset;
    }

    /** Compute the tightly packed 32-bit object size of a reflected type. */
    ObjectSize(type) {
      if (this.sizeCache.has(type)) return this.sizeCache.get(type);
      this.sizeCache.set(type, 0);
      var size = 0;
      for (var member of type.members) size += memberSize(member, ref => this.ObjectSize(ref));
      this.sizeCache.set(type, size);
      return size;
    }

    /** Record a non-null pointer relocation. */
    FixPointer(from, target) {
      if (target === null || target === undefined) return;
      this.fixups.push({
        from,
        target
      });
    }

    /** Patch a signed 16-bit section value. */
    PatchI16(offset, value) {
      this.writer.patchBytes(offset, bytesWith(2, view => view.setInt16(0, value | 0, true)));
    }

    /** Patch an unsigned 16-bit section value. */
    PatchU16(offset, value) {
      this.writer.patchBytes(offset, bytesWith(2, view => view.setUint16(0, value & 0xffff, true)));
    }

    /** Patch a float32 section value. */
    PatchF32(offset, value) {
      this.writer.patchBytes(offset, bytesWith(4, view => view.setFloat32(0, Number(value) || 0, true)));
    }

    /** Deduplicate and write a null-terminated UTF-8 string. */
    WriteString(value) {
      var text = String(value != null ? value : "");
      if (this.stringOffsets.has(text)) return this.stringOffsets.get(text);
      var encoded = UTF8.encode(text);
      var offset = this.writer.reserve(encoded.length + 1);
      this.writer.patchBytes(offset, encoded);
      this.stringOffsets.set(text, offset);
      return offset;
    }

    /** Write one reflected member-definition array. */
    WriteType(type) {
      var base = this.TypeOffset(type);
      for (var index = 0; index < type.members.length; index++) {
        var member = type.members[index];
        var offset = base + index * MEMBER_SIZE;
        this.writer.patchU32(offset, member.type);
        this.FixPointer(offset + 4, this.WriteString(member.name));
        if (member.ref) this.FixPointer(offset + 8, this.TypeOffset(member.ref));
        this.writer.patchU32(offset + 12, member.arrayWidth >>> 0);
      }
    }

    /** Get the identity cache for one reflected object type. */
    ObjectMap(type) {
      var map = this.objectOffsets.get(type);
      if (!map) {
        map = new WeakMap();
        this.objectOffsets.set(type, map);
      }
      return map;
    }

    /** Write or reuse one referenced object. */
    WriteObject(type, value) {
      if (value === null || value === undefined) return null;
      if (typeof value === "object") {
        var map = this.ObjectMap(type);
        if (map.has(value)) return map.get(value);
        var _offset = this.Allocate(this.ObjectSize(type));
        map.set(value, _offset);
        this.WriteObjectAt(type, value, _offset);
        return _offset;
      }
      var offset = this.Allocate(this.ObjectSize(type));
      this.WriteObjectAt(type, value, offset);
      return offset;
    }

    /** Resolve a member value, including scalar-wrapper shorthand. */
    MemberValue(type, value, member) {
      if (value && typeof value === "object" && Object.hasOwn(value, member.name)) return value[member.name];
      if (type.members.length === 1 && primitiveSize(member.type)) return value;
      return undefined;
    }

    /** Write an object into an already allocated section block. */
    WriteObjectAt(type, value, base) {
      var offset = base;
      for (var member of type.members) {
        this.WriteMember(member, this.MemberValue(type, value, member), offset);
        offset += memberSize(member, ref => this.ObjectSize(ref));
      }
    }

    /** Write a contiguous reflected object array. */
    WriteArray(type, values) {
      if (!values.length) return null;
      var stride = this.ObjectSize(type);
      var offset = this.Allocate(stride * values.length);
      for (var index = 0; index < values.length; index++) {
        this.WriteObjectAt(type, values[index], offset + index * stride);
      }
      return offset;
    }

    /** Write a contiguous array of relocated object pointers. */
    WriteReferences(type, values) {
      if (!values.length) return null;
      var offset = this.Allocate(values.length * 4);
      for (var index = 0; index < values.length; index++) {
        this.FixPointer(offset + index * 4, this.WriteObject(type, values[index]));
      }
      return offset;
    }

    /** Encode one member according to its reflected Granny member type. */
    WriteMember(member, value, offset) {
      switch (member.type) {
        case M.Inline:
          {
            var width = member.arrayWidth > 0 ? member.arrayWidth : 1;
            var values = width === 1 ? [value != null ? value : {}] : value != null ? value : [];
            var stride = this.ObjectSize(member.ref);
            for (var index = 0; index < width; index++) {
              var _values$index;
              this.WriteObjectAt(member.ref, (_values$index = values[index]) != null ? _values$index : {}, offset + index * stride);
            }
            return;
          }
        case M.Reference:
          this.FixPointer(offset, this.WriteObject(member.ref, value));
          return;
        case M.String:
          if (value !== null && value !== undefined) this.FixPointer(offset, this.WriteString(value));
          return;
        case M.ReferenceToArray:
          {
            var _values = Array.isArray(value) ? value : [];
            this.writer.patchU32(offset, _values.length);
            this.FixPointer(offset + 4, this.WriteArray(member.ref, _values));
            return;
          }
        case M.ArrayOfReferences:
          {
            var _values2 = Array.isArray(value) ? value : [];
            this.writer.patchU32(offset, _values2.length);
            this.FixPointer(offset + 4, this.WriteReferences(member.ref, _values2));
            return;
          }
        case M.VariantReference:
          if (value) {
            var target = this.WriteObject(value.type, value.value);
            this.FixPointer(offset, this.TypeOffset(value.type));
            this.FixPointer(offset + 4, target);
            this.mixedFixups.push({
              count: 1,
              offset: target,
              typeOffset: this.TypeOffset(value.type)
            });
          }
          return;
        case M.ReferenceToVariantArray:
          if (value) {
            var _values3 = Array.isArray(value.value) ? value.value : [];
            var _target = this.WriteArray(value.type, _values3);
            this.FixPointer(offset, this.TypeOffset(value.type));
            this.writer.patchU32(offset + 4, _values3.length);
            this.FixPointer(offset + 8, _target);
            if (_values3.length) {
              this.mixedFixups.push({
                count: _values3.length,
                offset: _target,
                typeOffset: this.TypeOffset(value.type)
              });
            }
          }
          return;
        case M.Transform:
          this.WriteTransform(offset, value);
          return;
        case M.EmptyReference:
          return;
        default:
          this.WriteNumeric(member, value, offset);
      }
    }

    /** Encode Granny's fixed 68-byte transform value. */
    WriteTransform(offset) {
      var _ref, _value$position, _ref2, _value$orientation, _ref3, _value$scaleShear, _ref4, _value$flags;
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var position = (_ref = (_value$position = value === null || value === void 0 ? void 0 : value.position) != null ? _value$position : value === null || value === void 0 ? void 0 : value.Position) != null ? _ref : [0, 0, 0],
        orientation = (_ref2 = (_value$orientation = value === null || value === void 0 ? void 0 : value.orientation) != null ? _value$orientation : value === null || value === void 0 ? void 0 : value.Orientation) != null ? _ref2 : [0, 0, 0, 1],
        scaleShear = (_ref3 = (_value$scaleShear = value === null || value === void 0 ? void 0 : value.scaleShear) != null ? _value$scaleShear : value === null || value === void 0 ? void 0 : value.ScaleShear) != null ? _ref3 : [1, 0, 0, 0, 1, 0, 0, 0, 1];
      this.writer.patchU32(offset, (_ref4 = (_value$flags = value === null || value === void 0 ? void 0 : value.flags) != null ? _value$flags : value === null || value === void 0 ? void 0 : value.Flags) != null ? _ref4 : 7);
      var cursor = offset + 4;
      for (var component of position) {
        this.PatchF32(cursor, component);
        cursor += 4;
      }
      for (var _component of orientation) {
        this.PatchF32(cursor, _component);
        cursor += 4;
      }
      for (var _component2 of scaleShear) {
        this.PatchF32(cursor, _component2);
        cursor += 4;
      }
    }

    /** Encode a scalar or fixed-width numeric member. */
    WriteNumeric(member, value, offset) {
      var _this = this;
      var width = member.arrayWidth > 0 ? member.arrayWidth : 1;
      var values = width === 1 ? [value != null ? value : 0] : value != null ? value : [];
      var stride = primitiveSize(member.type);
      var _loop = function () {
        var _values$index2;
        var item = (_values$index2 = values[index]) != null ? _values$index2 : 0;
        switch (member.type) {
          case M.Real32:
            _this.PatchF32(offset + index * stride, item);
            break;
          case M.Int32:
            _this.writer.patchBytes(offset + index * stride, bytesWith(4, view => view.setInt32(0, item | 0, true)));
            break;
          case M.UInt32:
            _this.writer.patchU32(offset + index * stride, item);
            break;
          case M.Int16:
          case M.BinormalInt16:
            _this.PatchI16(offset + index * stride, item);
            break;
          case M.UInt16:
          case M.NormalUInt16:
          case M.Real16:
            _this.PatchU16(offset + index * stride, item);
            break;
          case M.Int8:
          case M.BinormalInt8:
            _this.writer.patchU8(offset + index, item);
            break;
          case M.UInt8:
          case M.NormalUInt8:
            _this.writer.patchU8(offset + index, item);
            break;
          default:
            throw new CjsFormatWriteError("GR2 writer cannot encode member type ".concat(member.type));
        }
      };
      for (var index = 0; index < width; index++) {
        _loop();
      }
    }
  }
  function pointerFixupBytes(fixups) {
    var writer = new CjsByteWriter(fixups.length * 12);
    for (var fixup of fixups) {
      writer.u32(fixup.from);
      writer.u32(0);
      writer.u32(fixup.target);
    }
    return writer.toBytes();
  }
  function mixedFixupBytes(fixups) {
    var writer = new CjsByteWriter(fixups.length * 16);
    for (var fixup of fixups) {
      writer.u32(fixup.count);
      writer.u32(fixup.offset);
      writer.u32(0);
      writer.u32(fixup.typeOffset);
    }
    return writer.toBytes();
  }
  function alignWriter(writer, alignment) {
    writer.reserve(align(writer.length, alignment) - writer.length);
  }
  function appendFixups(writer, bytes, compressed) {
    if (!bytes.length) return 0;
    alignWriter(writer, 4);
    var offset = writer.length;
    if (compressed) {
      var packed = encodeBitKnit2Raw(bytes);
      writer.u32(packed.length);
      writer.bytes(packed);
    } else {
      writer.bytes(bytes);
    }
    return offset;
  }

  /**
   * Serialize one standard reflected graph as a 32-bit little-endian GR2 file.
   *
   * @param {object} rootType Reflected root type.
   * @param {object} root Root object graph.
   * @param {object[]} types Closed reflected type set.
   * @param {{sectionCompression?: "none"|"bitknit2Raw"}} [options] Outer-section storage.
   * @returns {Uint8Array} Complete GR2 file bytes.
   */
  function writeGr2Container(rootType, root, types) {
    var _options$sectionCompr;
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var section = new SectionSerializer(types).Serialize(rootType, root);
    var headerSize = SECTION_DIRECTORY_OFFSET + SECTION_RECORD_SIZE;
    var sectionCompression = (_options$sectionCompr = options.sectionCompression) != null ? _options$sectionCompr : GR2_SECTION_COMPRESSION_NONE;
    if (![GR2_SECTION_COMPRESSION_NONE, GR2_SECTION_COMPRESSION_BITKNIT2_RAW].includes(sectionCompression)) {
      throw new CjsFormatWriteError("GR2 container unknown sectionCompression \"".concat(sectionCompression, "\""));
    }
    var compressed = sectionCompression === GR2_SECTION_COMPRESSION_BITKNIT2_RAW;
    var sectionBytes = compressed ? encodeBitKnit2Raw(section.bytes) : section.bytes;
    var writer = new CjsByteWriter(headerSize + sectionBytes.length);
    writer.reserve(headerSize);
    writer.bytes(sectionBytes);
    var pointerFixupOffset = appendFixups(writer, pointerFixupBytes(section.fixups), compressed);
    var mixedFixupOffset = appendFixups(writer, mixedFixupBytes(section.mixedFixups), compressed);
    var totalSize = writer.length;
    writer.patchBytes(0, MAGIC_32_LE);
    writer.patchU32(16, headerSize);
    writer.patchU32(FILE_HEADER_OFFSET, 7);
    writer.patchU32(FILE_HEADER_OFFSET + 4, totalSize);
    writer.patchU32(FILE_HEADER_OFFSET + 12, SECTION_DIRECTORY_OFFSET - FILE_HEADER_OFFSET);
    writer.patchU32(FILE_HEADER_OFFSET + 16, 1);
    writer.patchU32(FILE_HEADER_OFFSET + 20, 0);
    writer.patchU32(FILE_HEADER_OFFSET + 24, section.rootTypeOffset);
    writer.patchU32(FILE_HEADER_OFFSET + 28, 0);
    writer.patchU32(FILE_HEADER_OFFSET + 32, section.rootOffset);
    writer.patchU32(FILE_HEADER_OFFSET + 36, TYPE_TAG_2_12);
    writer.patchU32(SECTION_DIRECTORY_OFFSET, compressed ? 4 : 0);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 4, headerSize);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 8, sectionBytes.length);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 12, section.bytes.length);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 16, 4);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 28, section.fixups.length ? pointerFixupOffset : 0);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 32, section.fixups.length);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 36, section.mixedFixups.length ? mixedFixupOffset : 0);
    writer.patchU32(SECTION_DIRECTORY_OFFSET + 40, section.mixedFixups.length);
    var bytes = writer.toBytes();
    new DataView(bytes.buffer).setUint32(FILE_HEADER_OFFSET + 8, crc32(bytes, SECTION_DIRECTORY_OFFSET), true);
    return bytes;
  }

  var POSITION_IDENTITY = Object.freeze([0, 0, 0]);
  var ORIENTATION_IDENTITY = Object.freeze([0, 0, 0, 1]);
  var SCALE_SHEAR_IDENTITY = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  var member = function (type, name) {
    var ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var arrayWidth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    return {
      type,
      name,
      ref,
      arrayWidth
    };
  };
  var identityTransform = () => ({
    flags: 7,
    position: [...POSITION_IDENTITY],
    orientation: [...ORIENTATION_IDENTITY],
    scaleShear: [...SCALE_SHEAR_IDENTITY]
  });
  var Int32Element = gr2Type("Int32Element", [member(GRANNY_MEMBER_TYPES.Int32, "Int32")]);
  var Int16Element = gr2Type("Int16Element", [member(GRANNY_MEMBER_TYPES.Int16, "Int16")]);
  var UInt16Element = gr2Type("UInt16Element", [member(GRANNY_MEMBER_TYPES.UInt16, "UInt16")]);
  var UInt8Element = gr2Type("UInt8Element", [member(GRANNY_MEMBER_TYPES.UInt8, "UInt8")]);
  var Real32Element = gr2Type("Real32Element", [member(GRANNY_MEMBER_TYPES.Real32, "Real32")]);
  var StringElement = gr2Type("StringElement", [member(GRANNY_MEMBER_TYPES.String, "String")]);
  var CurveDataHeader = gr2Type("CurveDataHeader", [member(GRANNY_MEMBER_TYPES.UInt8, "Format"), member(GRANNY_MEMBER_TYPES.UInt8, "Degree")]);
  var CurveDataDaKeyframes32f = gr2Type("CurveDataDaKeyframes32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaKeyframes32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Dimension"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Controls", Real32Element)]);
  var CurveDataDaIdentity = gr2Type("CurveDataDaIdentity", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaIdentity", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Dimension")]);
  var CurveDataDaConstant32f = gr2Type("CurveDataDaConstant32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaConstant32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Padding"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Controls", Real32Element)]);
  var CurveDataD3Constant32f = gr2Type("CurveDataD3Constant32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3Constant32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Padding"), member(GRANNY_MEMBER_TYPES.Real32, "Controls", null, 3)]);
  var CurveDataD4Constant32f = gr2Type("CurveDataD4Constant32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D4Constant32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Padding"), member(GRANNY_MEMBER_TYPES.Real32, "Controls", null, 4)]);
  var CurveDataDaK32fC32f = gr2Type("CurveDataDaK32fC32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaK32fC32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Padding"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Knots", Real32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Controls", Real32Element)]);
  var CurveDataDaK16uC16u = gr2Type("CurveDataDaK16uC16u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaK16uC16u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "ControlScaleOffsets", Real32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataDaK8uC8u = gr2Type("CurveDataDaK8uC8u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_DaK8uC8u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "ControlScaleOffsets", Real32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var CurveDataD4nK16uC15u = gr2Type("CurveDataD4nK16uC15u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D4nK16uC15u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "ScaleOffsetTableEntries"), member(GRANNY_MEMBER_TYPES.Real32, "OneOverKnotScale"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataD4nK8uC7u = gr2Type("CurveDataD4nK8uC7u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D4nK8uC7u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "ScaleOffsetTableEntries"), member(GRANNY_MEMBER_TYPES.Real32, "OneOverKnotScale"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var CurveDataD3K16uC16u = gr2Type("CurveDataD3K16uC16u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3K16uC16u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataD3K8uC8u = gr2Type("CurveDataD3K8uC8u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3K8uC8u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var CurveDataD9I1K16uC16u = gr2Type("CurveDataD9I1K16uC16u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D9I1K16uC16u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScale"), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffset"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataD9I1K8uC8u = gr2Type("CurveDataD9I1K8uC8u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D9I1K8uC8u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScale"), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffset"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var CurveDataD9I3K16uC16u = gr2Type("CurveDataD9I3K16uC16u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D9I3K16uC16u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataD9I3K8uC8u = gr2Type("CurveDataD9I3K8uC8u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D9I3K8uC8u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var CurveDataD3I1K32fC32f = gr2Type("CurveDataD3I1K32fC32f", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3I1K32fC32f", CurveDataHeader), member(GRANNY_MEMBER_TYPES.Int16, "Padding"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", Real32Element)]);
  var CurveDataD3I1K16uC16u = gr2Type("CurveDataD3I1K16uC16u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3I1K16uC16u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt16Element)]);
  var CurveDataD3I1K8uC8u = gr2Type("CurveDataD3I1K8uC8u", [member(GRANNY_MEMBER_TYPES.Inline, "CurveDataHeader_D3I1K8uC8u", CurveDataHeader), member(GRANNY_MEMBER_TYPES.UInt16, "OneOverKnotScaleTrunc"), member(GRANNY_MEMBER_TYPES.Real32, "ControlScales", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "ControlOffsets", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "KnotsControls", UInt8Element)]);
  var Curve = gr2Type("Curve", [member(GRANNY_MEMBER_TYPES.VariantReference, "CurveData")]);
  var TransformTrack = gr2Type("TransformTrack", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.Int32, "Flags"), member(GRANNY_MEMBER_TYPES.Inline, "OrientationCurve", Curve), member(GRANNY_MEMBER_TYPES.Inline, "PositionCurve", Curve), member(GRANNY_MEMBER_TYPES.Inline, "ScaleShearCurve", Curve)]);
  var VectorTrack = gr2Type("VectorTrack", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.UInt32, "TrackKey"), member(GRANNY_MEMBER_TYPES.Int32, "Dimension"), member(GRANNY_MEMBER_TYPES.Inline, "ValueCurve", Curve)]);
  var TransformLodError = gr2Type("TransformLodError", [member(GRANNY_MEMBER_TYPES.Real32, "Real32")]);
  var TextTrackEntry = gr2Type("TextTrackEntry", [member(GRANNY_MEMBER_TYPES.Real32, "TimeStamp"), member(GRANNY_MEMBER_TYPES.String, "Text")]);
  var TextTrack = gr2Type("TextTrack", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Entries", TextTrackEntry)]);
  var PeriodicLoop = gr2Type("PeriodicLoop", [member(GRANNY_MEMBER_TYPES.Real32, "Radius"), member(GRANNY_MEMBER_TYPES.Real32, "dAngle"), member(GRANNY_MEMBER_TYPES.Real32, "dZ"), member(GRANNY_MEMBER_TYPES.Real32, "BasisX", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "BasisY", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "Axis", null, 3)]);
  var TrackGroup = gr2Type("TrackGroup", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VectorTracks", VectorTrack), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TransformTracks", TransformTrack), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TransformLODErrors", TransformLodError), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TextTracks", TextTrack), member(GRANNY_MEMBER_TYPES.Transform, "InitialPlacement"), member(GRANNY_MEMBER_TYPES.Int32, "AccumulationFlags"), member(GRANNY_MEMBER_TYPES.Real32, "LoopTranslation", null, 3), member(GRANNY_MEMBER_TYPES.Reference, "PeriodicLoop", PeriodicLoop), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var Animation = gr2Type("Animation", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.Real32, "Duration"), member(GRANNY_MEMBER_TYPES.Real32, "TimeStep"), member(GRANNY_MEMBER_TYPES.Real32, "Oversampling"), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "TrackGroups", TrackGroup), member(GRANNY_MEMBER_TYPES.Int32, "DefaultLoopCount"), member(GRANNY_MEMBER_TYPES.Int32, "Flags"), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var ArtToolInfo = gr2Type("ArtToolInfo", [member(GRANNY_MEMBER_TYPES.String, "FromArtToolName"), member(GRANNY_MEMBER_TYPES.Int32, "ArtToolMajorRevision"), member(GRANNY_MEMBER_TYPES.Int32, "ArtToolMinorRevision"), member(GRANNY_MEMBER_TYPES.Int32, "ArtToolPointerSize"), member(GRANNY_MEMBER_TYPES.Real32, "UnitsPerMeter"), member(GRANNY_MEMBER_TYPES.Real32, "Origin", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "RightVector", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "UpVector", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "BackVector", null, 3), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var ExporterInfo = gr2Type("ExporterInfo", [member(GRANNY_MEMBER_TYPES.String, "ExporterName"), member(GRANNY_MEMBER_TYPES.Int32, "ExporterMajorRevision"), member(GRANNY_MEMBER_TYPES.Int32, "ExporterMinorRevision"), member(GRANNY_MEMBER_TYPES.Int32, "ExporterCustomization"), member(GRANNY_MEMBER_TYPES.Int32, "ExporterBuildNumber"), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var TextureLayout = gr2Type("TextureLayout", [member(GRANNY_MEMBER_TYPES.Int32, "BytesPerPixel"), member(GRANNY_MEMBER_TYPES.Int32, "ShiftForComponent", null, 4), member(GRANNY_MEMBER_TYPES.Int32, "BitsForComponent", null, 4)]);
  var TextureMipLevel = gr2Type("TextureMipLevel", [member(GRANNY_MEMBER_TYPES.Int32, "Stride"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "PixelBytes", UInt8Element)]);
  var TextureImage = gr2Type("TextureImage", [member(GRANNY_MEMBER_TYPES.ReferenceToArray, "MIPLevels", TextureMipLevel)]);
  var Texture = gr2Type("Texture", [member(GRANNY_MEMBER_TYPES.String, "FromFileName"), member(GRANNY_MEMBER_TYPES.Int32, "TextureType"), member(GRANNY_MEMBER_TYPES.Int32, "Width"), member(GRANNY_MEMBER_TYPES.Int32, "Height"), member(GRANNY_MEMBER_TYPES.Int32, "Encoding"), member(GRANNY_MEMBER_TYPES.Int32, "SubFormat"), member(GRANNY_MEMBER_TYPES.Inline, "Layout", TextureLayout), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Images", TextureImage), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var Material;
  var MaterialMap = gr2Type("MaterialMap", [member(GRANNY_MEMBER_TYPES.String, "Usage"), member(GRANNY_MEMBER_TYPES.Reference, "Map", null)]);
  Material = gr2Type("Material", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Maps", MaterialMap), member(GRANNY_MEMBER_TYPES.Reference, "Texture", Texture), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  // Resolve the recursive material-map reference after both type objects exist.
  MaterialMap.members[1] = _objectSpread2(_objectSpread2({}, MaterialMap.members[1]), {}, {
    ref: Material
  });
  var Bone = gr2Type("Bone", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.Int32, "ParentIndex"), member(GRANNY_MEMBER_TYPES.Transform, "Transform"), member(GRANNY_MEMBER_TYPES.Real32, "InverseWorldTransform", null, 16), member(GRANNY_MEMBER_TYPES.Real32, "LODError"), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var Skeleton = gr2Type("Skeleton", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Bones", Bone), member(GRANNY_MEMBER_TYPES.Int32, "LODType"), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var VertexAnnotationSet = gr2Type("VertexAnnotationSet", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToVariantArray, "VertexAnnotations"), member(GRANNY_MEMBER_TYPES.Int32, "IndicesMapFromVertexToAnnotation"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VertexAnnotationIndices", Int32Element)]);
  var VertexData = gr2Type("VertexData", [member(GRANNY_MEMBER_TYPES.ReferenceToVariantArray, "Vertices"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VertexComponentNames", StringElement), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VertexAnnotationSets", VertexAnnotationSet)]);
  var TriMaterialGroup = gr2Type("TriMaterialGroup", [member(GRANNY_MEMBER_TYPES.Int32, "MaterialIndex"), member(GRANNY_MEMBER_TYPES.Int32, "TriFirst"), member(GRANNY_MEMBER_TYPES.Int32, "TriCount")]);
  var TriAnnotationSet = gr2Type("TriAnnotationSet", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.ReferenceToVariantArray, "TriAnnotations"), member(GRANNY_MEMBER_TYPES.Int32, "IndicesMapFromTriToAnnotation"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TriAnnotationIndices", Int32Element)]);
  var TriTopology = gr2Type("TriTopology", [member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Groups", TriMaterialGroup), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Indices", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "Indices16", Int16Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VertexToVertexMap", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "VertexToTriangleMap", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "SideToNeighborMap", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "PolygonIndexStarts", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "PolygonIndices", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "BonesForTriangle", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TriangleToBoneIndices", Int32Element), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TriAnnotationSets", TriAnnotationSet)]);
  var MorphTarget = gr2Type("MorphTarget", [member(GRANNY_MEMBER_TYPES.String, "ScalarName"), member(GRANNY_MEMBER_TYPES.Reference, "VertexData", VertexData), member(GRANNY_MEMBER_TYPES.Int32, "DataIsDeltas")]);
  var MaterialBinding = gr2Type("MaterialBinding", [member(GRANNY_MEMBER_TYPES.Reference, "Material", Material)]);
  var BoneBinding = gr2Type("BoneBinding", [member(GRANNY_MEMBER_TYPES.String, "BoneName"), member(GRANNY_MEMBER_TYPES.Real32, "OBBMin", null, 3), member(GRANNY_MEMBER_TYPES.Real32, "OBBMax", null, 3), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "TriangleIndices", Int32Element)]);
  var Mesh = gr2Type("Mesh", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.Reference, "PrimaryVertexData", VertexData), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "MorphTargets", MorphTarget), member(GRANNY_MEMBER_TYPES.Reference, "PrimaryTopology", TriTopology), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "MaterialBindings", MaterialBinding), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "BoneBindings", BoneBinding), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var MeshBinding = gr2Type("MeshBinding", [member(GRANNY_MEMBER_TYPES.Reference, "Mesh", Mesh)]);
  var Model = gr2Type("Model", [member(GRANNY_MEMBER_TYPES.String, "Name"), member(GRANNY_MEMBER_TYPES.Reference, "Skeleton", Skeleton), member(GRANNY_MEMBER_TYPES.Transform, "InitialPlacement"), member(GRANNY_MEMBER_TYPES.ReferenceToArray, "MeshBindings", MeshBinding), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var FileInfo = gr2Type("FileInfo", [member(GRANNY_MEMBER_TYPES.Reference, "ArtToolInfo", ArtToolInfo), member(GRANNY_MEMBER_TYPES.Reference, "ExporterInfo", ExporterInfo), member(GRANNY_MEMBER_TYPES.String, "FromFileName"), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Textures", Texture), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Materials", Material), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Skeletons", Skeleton), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "VertexDatas", VertexData), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "TriTopologies", TriTopology), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Meshes", Mesh), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Models", Model), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "TrackGroups", TrackGroup), member(GRANNY_MEMBER_TYPES.ArrayOfReferences, "Animations", Animation), member(GRANNY_MEMBER_TYPES.VariantReference, "ExtendedData")]);
  var STATIC_TYPES = [Int32Element, Int16Element, UInt16Element, UInt8Element, Real32Element, StringElement, CurveDataHeader, Curve, TransformTrack, VectorTrack, TransformLodError, TextTrackEntry, TextTrack, PeriodicLoop, TrackGroup, Animation, ArtToolInfo, ExporterInfo, TextureLayout, TextureMipLevel, TextureImage, Texture, MaterialMap, Material, Bone, Skeleton, VertexAnnotationSet, VertexData, TriMaterialGroup, TriAnnotationSet, TriTopology, MorphTarget, MaterialBinding, BoneBinding, Mesh, MeshBinding, Model, FileInfo];
  function validateOptions(options) {
    var _options$tangentMode, _options$sectionCompr, _options$sourceName;
    var tangentMode = (_options$tangentMode = options.tangentMode) != null ? _options$tangentMode : "preserve";
    if (!["preserve", "packed", "unpacked"].includes(tangentMode)) {
      throw new CjsFormatWriteError("GR2 writer unknown tangentMode \"".concat(tangentMode, "\""));
    }
    var sectionCompression = (_options$sectionCompr = options.sectionCompression) != null ? _options$sectionCompr : GR2_SECTION_COMPRESSION_NONE;
    if (![GR2_SECTION_COMPRESSION_NONE, GR2_SECTION_COMPRESSION_BITKNIT2_RAW].includes(sectionCompression)) {
      throw new CjsFormatWriteError("GR2 writer unknown sectionCompression \"".concat(sectionCompression, "\""));
    }
    return {
      tangentMode,
      sectionCompression,
      compressedCurves: options.compressedCurves !== false,
      tolerance: options.tolerance,
      positionTolerance: options.positionTolerance,
      orientationTolerance: options.orientationTolerance,
      scaleShearTolerance: options.scaleShearTolerance,
      sourceName: (_options$sourceName = options.sourceName) != null ? _options$sourceName : ""
    };
  }
  function unpackQuaternionFrames(values) {
    var result = {
      normal: [],
      tangent: [],
      binormal: []
    };
    for (var offset = 0; offset < values.length; offset += 4) {
      var x = values[offset],
        y = values[offset + 1],
        z = values[offset + 2],
        sign = values[offset + 3] < 0 ? -1 : 1,
        w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z)),
        x2 = x * x,
        y2 = y * y,
        z2 = z * z,
        xy = 2 * x * y,
        xz = 2 * x * z,
        yz = 2 * y * z,
        xw = 2 * x * w,
        yw = 2 * y * w,
        zw = 2 * z * w;
      result.tangent.push(1 - 2 * y2 - 2 * z2, xy + zw, xz - yw);
      result.binormal.push(xy - zw, 1 - 2 * x2 - 2 * z2, yz + xw);
      result.normal.push((xz + yw) * sign, (yz - xw) * sign, (1 - 2 * x2 - 2 * y2) * sign);
    }
    return result;
  }
  function unpackLegacyFrames(values) {
    var result = {
      normal: [],
      tangent: [],
      binormal: []
    };
    for (var offset = 0; offset < values.length; offset += 4) {
      var frame = decodeTangentFrame(values.slice(offset, offset + 4));
      result.normal.push(...frame.N);
      result.tangent.push(...frame.T);
      result.binormal.push(...frame.B);
    }
    return result;
  }
  function tangentData(vertex, count, tangentMode) {
    var _vertex$packedTangent, _vertex$tangent, _vertex$normal, _vertex$binormal, _vertex$packedTangent2, _vertex$normal2, _vertex$tangent2, _vertex$binormal2;
    var legacy = ((_vertex$packedTangent = vertex.packedTangentLegacy) === null || _vertex$packedTangent === void 0 ? void 0 : _vertex$packedTangent.length) === count * 4 ? vertex.packedTangentLegacy : ((_vertex$tangent = vertex.tangent) === null || _vertex$tangent === void 0 ? void 0 : _vertex$tangent.length) === count * 4 && !((_vertex$normal = vertex.normal) !== null && _vertex$normal !== void 0 && _vertex$normal.length) && !((_vertex$binormal = vertex.binormal) !== null && _vertex$binormal !== void 0 && _vertex$binormal.length) ? vertex.tangent : null,
      quaternion = ((_vertex$packedTangent2 = vertex.packedTangent) === null || _vertex$packedTangent2 === void 0 ? void 0 : _vertex$packedTangent2.length) === count * 4 ? vertex.packedTangent : null,
      explicit = ((_vertex$normal2 = vertex.normal) === null || _vertex$normal2 === void 0 ? void 0 : _vertex$normal2.length) === count * 3 && ((_vertex$tangent2 = vertex.tangent) === null || _vertex$tangent2 === void 0 ? void 0 : _vertex$tangent2.length) === count * 3 && ((_vertex$binormal2 = vertex.binormal) === null || _vertex$binormal2 === void 0 ? void 0 : _vertex$binormal2.length) === count * 3 ? {
        normal: vertex.normal,
        tangent: vertex.tangent,
        binormal: vertex.binormal
      } : null,
      packed = tangentMode === "packed" || tangentMode === "preserve" && !!(legacy || quaternion);
    if (!legacy && !quaternion && !explicit) return {
      packed,
      values: null
    };
    if (packed) {
      if (legacy) return {
        packed: true,
        values: legacy
      };
      var frame = explicit != null ? explicit : unpackQuaternionFrames(quaternion);
      return {
        packed: true,
        values: packTangentFrames(frame.normal, frame.tangent, frame.binormal)
      };
    }
    return {
      packed: false,
      values: explicit != null ? explicit : legacy ? unpackLegacyFrames(legacy) : unpackQuaternionFrames(quaternion)
    };
  }
  function channel(values, width, count, name) {
    if (!(values !== null && values !== void 0 && values.length)) return null;
    if (values.length !== width * count) {
      throw new CjsFormatWriteError("GR2 writer vertex channel ".concat(name, " has ").concat(values.length, " values, expected ").concat(width * count));
    }
    return values;
  }
  function vertexData(vertex, options, typeSuffix) {
    var _vertex$position, _vertex$blendIndice;
    var positions = (_vertex$position = vertex.position) != null ? _vertex$position : [];
    if (positions.length % 3 !== 0) {
      throw new CjsFormatWriteError("GR2 writer positions must contain complete xyz values");
    }
    var count = positions.length / 3;
    var fields = [member(GRANNY_MEMBER_TYPES.Real32, "Position", null, 3)];
    var sources = [["Position", positions, 3, value => value]];
    var add = function (name, values, width, type) {
      var encode = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : value => value;
      if (!channel(values, width, count, name)) return;
      fields.push(member(type, name, null, width));
      sources.push([name, values, width, encode]);
    };
    add("BoneWeights", vertex.blendWeight, 4, GRANNY_MEMBER_TYPES.NormalUInt8, value => Math.round(Math.max(0, Math.min(1, value)) * 255));
    var maxBoneIndex = ((_vertex$blendIndice = vertex.blendIndice) != null ? _vertex$blendIndice : []).reduce((maximum, value) => Math.max(maximum, value), 0);
    add("BoneIndices", vertex.blendIndice, 4, maxBoneIndex > 255 ? GRANNY_MEMBER_TYPES.UInt16 : GRANNY_MEMBER_TYPES.UInt8, value => value);
    var tangents = tangentData(vertex, count, options.tangentMode);
    if (tangents.values) {
      if (tangents.packed) {
        add("Tangent", tangents.values, 4, GRANNY_MEMBER_TYPES.NormalUInt8, value => Math.round(Math.max(0, Math.min(1, value)) * 255));
      } else {
        add("Normal", tangents.values.normal, 3, GRANNY_MEMBER_TYPES.Real32);
        add("Tangent", tangents.values.tangent, 3, GRANNY_MEMBER_TYPES.Real32);
        add("Binormal", tangents.values.binormal, 3, GRANNY_MEMBER_TYPES.Real32);
      }
    }
    add("DiffuseColor0", vertex.color0, 4, GRANNY_MEMBER_TYPES.NormalUInt8, value => Math.round(Math.max(0, Math.min(1, value)) * 255));
    add("TextureCoordinates0", vertex.texcoord0, 2, GRANNY_MEMBER_TYPES.Real32);
    add("TextureCoordinates1", vertex.texcoord1, 2, GRANNY_MEMBER_TYPES.Real32);
    var type = gr2Type("Vertex_".concat(typeSuffix), fields);
    var vertices = new Array(count);
    for (var index = 0; index < count; index++) {
      var item = {};
      for (var _ref3 of sources) {
        var _ref2 = _slicedToArray(_ref3, 4);
        var name = _ref2[0];
        var values = _ref2[1];
        var width = _ref2[2];
        var encode = _ref2[3];
        var output = new Array(width);
        for (var component = 0; component < width; component++) {
          output[component] = encode(values[index * width + component]);
        }
        item[name] = output;
      }
      vertices[index] = item;
    }
    return {
      type,
      value: {
        Vertices: gr2Variant(type, vertices),
        VertexComponentNames: fields.map(field => field.name),
        VertexAnnotationSets: []
      }
    };
  }
  function buildTopology(groups) {
    var indices = [];
    var topologyGroups = [];
    var triangle = 0;
    for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      var _groups$groupIndex$fa;
      var faces = (_groups$groupIndex$fa = groups[groupIndex].faces) != null ? _groups$groupIndex$fa : [];
      if (faces.length % 3 !== 0) {
        throw new CjsFormatWriteError("GR2 writer index group ".concat(groupIndex, " is not a triangle list"));
      }
      for (var index of faces) {
        if (!Number.isInteger(index) || index < 0) throw new CjsFormatWriteError("GR2 writer indices must be non-negative integers");
        indices.push(index);
      }
      var triangleCount = faces.length / 3;
      topologyGroups.push({
        MaterialIndex: groupIndex,
        TriFirst: triangle,
        TriCount: triangleCount
      });
      triangle += triangleCount;
    }
    var use16 = indices.every(index => index <= 0x7fff);
    return {
      Groups: topologyGroups,
      Indices: use16 ? [] : indices,
      Indices16: use16 ? indices : [],
      VertexToVertexMap: [],
      VertexToTriangleMap: [],
      SideToNeighborMap: [],
      PolygonIndexStarts: [],
      PolygonIndices: [],
      BonesForTriangle: [],
      TriangleToBoneIndices: [],
      TriAnnotationSets: []
    };
  }
  function lodSources(mesh) {
    var _mesh$lods, _mesh$vertex, _mesh$indices, _mesh$morphTargets;
    var lods = ((_mesh$lods = mesh.lods) != null ? _mesh$lods : []).filter(lod => (lod === null || lod === void 0 ? void 0 : lod.vertex) && (lod === null || lod === void 0 ? void 0 : lod.indices));
    if (!lods.length) return [{
      vertex: (_mesh$vertex = mesh.vertex) != null ? _mesh$vertex : {},
      indices: (_mesh$indices = mesh.indices) != null ? _mesh$indices : [],
      morphTargets: (_mesh$morphTargets = mesh.morphTargets) != null ? _mesh$morphTargets : []
    }];
    return lods.map((lod, index) => {
      var _lod$morphTargets;
      return {
        vertex: lod.vertex,
        indices: lod.indices,
        threshold: lod.threshold,
        morphTargets: ((_lod$morphTargets = lod.morphTargets) != null ? _lod$morphTargets : []).map((target, targetIndex) => {
          var _mesh$morphTargets$ta, _mesh$morphTargets2;
          return _objectSpread2(_objectSpread2({}, (_mesh$morphTargets$ta = (_mesh$morphTargets2 = mesh.morphTargets) === null || _mesh$morphTargets2 === void 0 ? void 0 : _mesh$morphTargets2[targetIndex]) != null ? _mesh$morphTargets$ta : {}), target);
        }),
        index
      };
    });
  }
  function buildMeshes(shared, options, dynamicTypes) {
    var meshes = [];
    var vertexDatas = [];
    var topologies = [];
    var materials = [];
    var sourceIndices = [];
    for (var meshIndex = 0; meshIndex < ((_shared$meshes = shared.meshes) != null ? _shared$meshes : []).length; meshIndex++) {
      var _shared$meshes;
      var source = shared.meshes[meshIndex];
      var lods = lodSources(source);
      for (var lodIndex = 0; lodIndex < lods.length; lodIndex++) {
        var _lod$vertex, _lod$indices, _lod$indices2, _source$name, _source$name2, _lod$threshold, _source$boneBindings, _source$skeleton;
        var lod = lods[lodIndex];
        var primary = vertexData((_lod$vertex = lod.vertex) != null ? _lod$vertex : {}, options, "".concat(meshIndex, "_").concat(lodIndex));
        dynamicTypes.push(primary.type);
        vertexDatas.push(primary.value);
        var topology = buildTopology((_lod$indices = lod.indices) != null ? _lod$indices : []);
        topologies.push(topology);
        var meshMaterials = ((_lod$indices2 = lod.indices) != null ? _lod$indices2 : []).map((group, groupIndex) => {
          var _group$name;
          return {
            Name: (_group$name = group.name) != null ? _group$name : "area_".concat(groupIndex),
            Maps: [],
            Texture: null,
            ExtendedData: null
          };
        });
        for (var material of meshMaterials) materials.push(material);
        var morphTargets = [];
        for (var targetIndex = 0; targetIndex < ((_lod$morphTargets2 = lod.morphTargets) != null ? _lod$morphTargets2 : []).length; targetIndex++) {
          var _lod$morphTargets2, _target$vertex, _target$name;
          var target = lod.morphTargets[targetIndex];
          var data = vertexData((_target$vertex = target.vertex) != null ? _target$vertex : {}, options, "".concat(meshIndex, "_").concat(lodIndex, "_m").concat(targetIndex));
          dynamicTypes.push(data.type);
          vertexDatas.push(data.value);
          morphTargets.push({
            ScalarName: (_target$name = target.name) != null ? _target$name : "morph_".concat(targetIndex),
            VertexData: data.value,
            DataIsDeltas: target.dataIsDeltas === false ? 0 : 1
          });
        }
        var name = lodIndex === 0 ? (_source$name = source.name) != null ? _source$name : "" : "".concat((_source$name2 = source.name) != null ? _source$name2 : "", " LOD ").concat((_lod$threshold = lod.threshold) != null ? _lod$threshold : lodIndex);
        meshes.push({
          Name: name,
          PrimaryVertexData: primary.value,
          MorphTargets: morphTargets,
          PrimaryTopology: topology,
          MaterialBindings: meshMaterials.map(material => ({
            Material: material
          })),
          BoneBindings: ((_source$boneBindings = source.boneBindings) != null ? _source$boneBindings : []).map(binding => {
            var _binding$name, _ref4, _binding$minBounds, _binding$bounds, _ref5, _binding$maxBounds, _binding$bounds2;
            return {
              BoneName: (_binding$name = binding.name) != null ? _binding$name : "",
              OBBMin: (_ref4 = (_binding$minBounds = binding.minBounds) != null ? _binding$minBounds : (_binding$bounds = binding.bounds) === null || _binding$bounds === void 0 ? void 0 : _binding$bounds.min) != null ? _ref4 : [0, 0, 0],
              OBBMax: (_ref5 = (_binding$maxBounds = binding.maxBounds) != null ? _binding$maxBounds : (_binding$bounds2 = binding.bounds) === null || _binding$bounds2 === void 0 ? void 0 : _binding$bounds2.max) != null ? _ref5 : [0, 0, 0],
              TriangleIndices: []
            };
          }),
          ExtendedData: null,
          skeletonIndex: (_source$skeleton = source.skeleton) != null ? _source$skeleton : null
        });
        sourceIndices.push(meshIndex);
      }
    }
    return {
      meshes,
      vertexDatas,
      topologies,
      materials,
      sourceIndices
    };
  }
  function buildSkeletons(cmf) {
    var _cmf$skeletons;
    return ((_cmf$skeletons = cmf.skeletons) != null ? _cmf$skeletons : []).map(skeleton => {
      var _skeleton$bones, _skeleton$name, _skeleton$bones2;
      var world = new Array(((_skeleton$bones = skeleton.bones) != null ? _skeleton$bones : []).length);
      return {
        Name: (_skeleton$name = skeleton.name) != null ? _skeleton$name : "",
        Bones: ((_skeleton$bones2 = skeleton.bones) != null ? _skeleton$bones2 : []).map((name, index) => {
          var _skeleton$restTransfo, _skeleton$restTransfo2, _rest$position, _rest$rotation, _rest$scale, _skeleton$parents$ind, _skeleton$parents, _skeleton$invBindTran, _skeleton$invBindTran2;
          var rest = (_skeleton$restTransfo = (_skeleton$restTransfo2 = skeleton.restTransforms) === null || _skeleton$restTransfo2 === void 0 ? void 0 : _skeleton$restTransfo2[index]) != null ? _skeleton$restTransfo : {},
            position = (_rest$position = rest.position) != null ? _rest$position : [0, 0, 0],
            orientation = (_rest$rotation = rest.rotation) != null ? _rest$rotation : [0, 0, 0, 1],
            scale = (_rest$scale = rest.scale) != null ? _rest$scale : [1, 1, 1],
            local = composeCmfTransform(position, orientation, scale),
            parent = (_skeleton$parents$ind = (_skeleton$parents = skeleton.parents) === null || _skeleton$parents === void 0 ? void 0 : _skeleton$parents[index]) != null ? _skeleton$parents$ind : 0xffffffff;
          world[index] = parent === 0xffffffff || parent < 0 ? local : multiplyMatrix4(local, world[parent]);
          return {
            Name: name,
            ParentIndex: parent === 0xffffffff ? -1 : parent,
            Transform: {
              flags: 7,
              position,
              orientation,
              scaleShear: [scale[0], 0, 0, 0, scale[1], 0, 0, 0, scale[2]]
            },
            InverseWorldTransform: (_skeleton$invBindTran = (_skeleton$invBindTran2 = skeleton.invBindTransforms) === null || _skeleton$invBindTran2 === void 0 ? void 0 : _skeleton$invBindTran2[index]) != null ? _skeleton$invBindTran : invertMatrix4(world[index]),
            LODError: 0,
            ExtendedData: null
          };
        }),
        LODType: 0,
        ExtendedData: null
      };
    });
  }
  function curveVariant(curve, dynamicTypes) {
    var header = {
      Format: curve.format,
      Degree: curve.degree | 0
    };
    var variant = (type, value) => {
      if (!dynamicTypes.includes(type)) dynamicTypes.push(type);
      return gr2Variant(type, value);
    };
    switch (curve.format) {
      case CURVE_FORMATS$1.DA_KEYFRAMES_32F:
        return variant(CurveDataDaKeyframes32f, {
          CurveDataHeader_DaKeyframes32f: header,
          Dimension: curve.dimension,
          Controls: curve.controls
        });
      case CURVE_FORMATS$1.DA_K32F_C32F:
        return variant(CurveDataDaK32fC32f, {
          CurveDataHeader_DaK32fC32f: header,
          Padding: 0,
          Knots: curve.knots,
          Controls: curve.controls
        });
      case CURVE_FORMATS$1.DA_IDENTITY:
        return variant(CurveDataDaIdentity, {
          CurveDataHeader_DaIdentity: header,
          Dimension: curve.dimension
        });
      case CURVE_FORMATS$1.DA_CONSTANT_32F:
        return variant(CurveDataDaConstant32f, {
          CurveDataHeader_DaConstant32f: header,
          Padding: 0,
          Controls: curve.controls
        });
      case CURVE_FORMATS$1.D3_CONSTANT_32F:
        return variant(CurveDataD3Constant32f, {
          CurveDataHeader_D3Constant32f: header,
          Padding: 0,
          Controls: curve.controls
        });
      case CURVE_FORMATS$1.D4_CONSTANT_32F:
        return variant(CurveDataD4Constant32f, {
          CurveDataHeader_D4Constant32f: header,
          Padding: 0,
          Controls: curve.controls
        });
      case CURVE_FORMATS$1.DA_K16U_C16U:
        return variant(CurveDataDaK16uC16u, {
          CurveDataHeader_DaK16uC16u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScaleOffsets: curve.controlScaleOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.DA_K8U_C8U:
        return variant(CurveDataDaK8uC8u, {
          CurveDataHeader_DaK8uC8u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScaleOffsets: curve.controlScaleOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D4N_K16U_C15U:
        return variant(CurveDataD4nK16uC15u, {
          CurveDataHeader_D4nK16uC15u: header,
          ScaleOffsetTableEntries: curve.scaleOffsetTableEntries,
          OneOverKnotScale: curve.oneOverKnotScale,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D4N_K8U_C7U:
        return variant(CurveDataD4nK8uC7u, {
          CurveDataHeader_D4nK8uC7u: header,
          ScaleOffsetTableEntries: curve.scaleOffsetTableEntries,
          OneOverKnotScale: curve.oneOverKnotScale,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D3_K16U_C16U:
        return variant(CurveDataD3K16uC16u, {
          CurveDataHeader_D3K16uC16u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D3_K8U_C8U:
        return variant(CurveDataD3K8uC8u, {
          CurveDataHeader_D3K8uC8u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D9I1_K16U_C16U:
        return variant(CurveDataD9I1K16uC16u, {
          CurveDataHeader_D9I1K16uC16u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScale: curve.controlScales[0],
          ControlOffset: curve.controlOffsets[0],
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D9I3_K16U_C16U:
        return variant(CurveDataD9I3K16uC16u, {
          CurveDataHeader_D9I3K16uC16u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D9I1_K8U_C8U:
        return variant(CurveDataD9I1K8uC8u, {
          CurveDataHeader_D9I1K8uC8u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScale: curve.controlScales[0],
          ControlOffset: curve.controlOffsets[0],
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D9I3_K8U_C8U:
        return variant(CurveDataD9I3K8uC8u, {
          CurveDataHeader_D9I3K8uC8u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D3I1_K32F_C32F:
        return variant(CurveDataD3I1K32fC32f, {
          CurveDataHeader_D3I1K32fC32f: header,
          Padding: 0,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D3I1_K16U_C16U:
        return variant(CurveDataD3I1K16uC16u, {
          CurveDataHeader_D3I1K16uC16u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      case CURVE_FORMATS$1.D3I1_K8U_C8U:
        return variant(CurveDataD3I1K8uC8u, {
          CurveDataHeader_D3I1K8uC8u: header,
          OneOverKnotScaleTrunc: curve.oneOverKnotScaleTrunc,
          ControlScales: curve.controlScales,
          ControlOffsets: curve.controlOffsets,
          KnotsControls: curve.knotsControls
        });
      default:
        throw new CjsFormatWriteError("GR2 writer cannot serialize curve format ".concat(curve.format));
    }
  }
  function writeCurve(source, dimension, duration, options, dynamicTypes) {
    var _curveOptions$identit;
    var curveOptions = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    var explicit = source !== null && source !== void 0 && source.error ? {
      degree: 0,
      knots: [0],
      controls: [...((_curveOptions$identit = curveOptions.identity) != null ? _curveOptions$identit : new Array(dimension).fill(0))]
    } : source;
    var packed = compressGr2Curve(explicit, dimension, {
      compressed: options.compressedCurves,
      duration,
      tolerance: options.tolerance,
      positionTolerance: options.positionTolerance,
      orientationTolerance: options.orientationTolerance,
      scaleShearTolerance: options.scaleShearTolerance,
      asQuaternion: curveOptions.asQuaternion === true,
      identity: curveOptions.identity
    });
    return {
      CurveData: curveVariant(packed, dynamicTypes)
    };
  }
  function buildAnimations(cmf, options, dynamicTypes) {
    var animations = buildGr2Animations(cmf).map(animation => ({
      Name: animation.name,
      Duration: animation.duration,
      TimeStep: animation.timeStep,
      Oversampling: animation.oversampling,
      TrackGroups: animation.trackGroups.map(group => ({
        Name: group.name,
        VectorTracks: group.vectorTracks.map(track => ({
          Name: track.name,
          TrackKey: 0,
          Dimension: track.dimension,
          ValueCurve: writeCurve(track.valueCurve, track.dimension, animation.duration, options, dynamicTypes)
        })),
        TransformTracks: group.transformTracks.map(track => ({
          Name: track.name,
          Flags: track.flags,
          OrientationCurve: writeCurve(track.orientation, 4, animation.duration, options, dynamicTypes, {
            asQuaternion: true,
            identity: ORIENTATION_IDENTITY
          }),
          PositionCurve: writeCurve(track.position, 3, animation.duration, options, dynamicTypes, {
            identity: POSITION_IDENTITY
          }),
          ScaleShearCurve: writeCurve(track.scaleShear, 9, animation.duration, options, dynamicTypes, {
            identity: SCALE_SHEAR_IDENTITY
          })
        })),
        TransformLODErrors: [],
        TextTracks: [],
        InitialPlacement: identityTransform(),
        AccumulationFlags: 0,
        LoopTranslation: [0, 0, 0],
        PeriodicLoop: null,
        ExtendedData: null
      })),
      DefaultLoopCount: animation.defaultLoopCount,
      Flags: animation.flags,
      ExtendedData: null
    }));
    var trackGroups = [];
    for (var animation of animations) {
      for (var group of animation.TrackGroups) trackGroups.push(group);
    }
    return {
      animations,
      trackGroups
    };
  }
  function buildFileInfo(cmf, shared, options) {
    var dynamicTypes = [];
    var geometry = buildMeshes(shared, options, dynamicTypes);
    var skeletons = buildSkeletons(cmf);
    var models = skeletons.map((skeleton, skeletonIndex) => ({
      Name: skeleton.Name,
      Skeleton: skeleton,
      InitialPlacement: identityTransform(),
      MeshBindings: geometry.meshes.filter(mesh => mesh.skeletonIndex === skeletonIndex).map(mesh => ({
        Mesh: mesh
      })),
      ExtendedData: null
    }));
    var animation = buildAnimations(cmf, options, dynamicTypes);
    return {
      types: [...STATIC_TYPES, ...dynamicTypes],
      root: {
        ArtToolInfo: null,
        ExporterInfo: {
          ExporterName: "CarbonEngineJS",
          ExporterMajorRevision: 1,
          ExporterMinorRevision: 0,
          ExporterCustomization: 0,
          ExporterBuildNumber: 0,
          ExtendedData: null
        },
        FromFileName: options.sourceName,
        Textures: [],
        Materials: geometry.materials,
        Skeletons: skeletons,
        VertexDatas: geometry.vertexDatas,
        TriTopologies: geometry.topologies,
        Meshes: geometry.meshes,
        Models: models,
        TrackGroups: animation.trackGroups,
        Animations: animation.animations,
        ExtendedData: null
      }
    };
  }

  /** Serialize a native CMF graph to a canonical 32-bit little-endian GR2 file. */
  function writeGr2(input) {
    var writerOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = validateOptions(writerOptions);
    if (!input || input.version !== 1 || !Array.isArray(input.meshes)) {
      throw new CjsFormatWriteError("CjsGr2Format.write expects a native CMF v1 graph");
    }
    var shared = buildSharedFromCmf(input, {});
    var fileInfo = buildFileInfo(input, shared, options);
    return writeGr2Container(FileInfo, fileInfo.root, fileInfo.types, {
      sectionCompression: options.sectionCompression
    });
  }

  /** Convert shared or GR2-shaped geometry through CMF, then serialize GR2. */
  function writeSharedGr2(input) {
    var writerOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = validateOptions(writerOptions);
    var cmf = buildCmfFromShared(input, writerOptions);
    return writeGr2(cmf, options);
  }

  var _excluded = ["classes", "rebuildMissingBounds"];
  /**
   * GR2 shared projection.
   * @author cppctamber
   * `projectShared(fileInfo, version)` returns the normalized plain-object graph
   * consumed independently by GR2 JSON and CMF output.
   * Normalized integer values are dequantized with float32 reciprocals, Real16
   * values are already converted by reader.js, and non-finite floats use zero
   * except for typed transform components, which use the corresponding Granny
   * identity value.
   */

  var fr = Math.fround;

  /**
   * Member type ids whose numeric values need conversion for the shared output.
   */
  var MEMBER_TYPES = Object.freeze({
    Real32: 10,
    Int8: 11,
    UInt8: 12,
    BinormalInt8: 13,
    NormalUInt8: 14,
    Int16: 15,
    UInt16: 16,
    BinormalInt16: 17,
    NormalUInt16: 18,
    Int32: 19,
    UInt32: 20,
    Real16: 21
  });
  var T = MEMBER_TYPES;

  /** Float32 reciprocal used to dequantize NormalUInt8 values. */
  var INV255_VALUE = fr(1 / 255);

  /** Float32 reciprocal used to dequantize NormalUInt16 values. */
  var INV65535_VALUE = fr(1 / 65535);

  /** Float32 reciprocal used to dequantize BinormalInt8 values. */
  var INV127_VALUE = fr(1 / 127);

  /** Float32 reciprocal used to dequantize BinormalInt16 values. */
  var INV32767_VALUE = fr(1 / 32767);
  var INV255 = INV255_VALUE,
    INV65535 = INV65535_VALUE,
    INV127 = INV127_VALUE,
    INV32767 = INV32767_VALUE;

  /**
   * Node keys accepted by {@link projectShared}'s `options.classes` map.
   *
   * Each key names one shared projection node shape; the mapped constructor is
   * instantiated with `new` and populated with that node's usual fields instead
   * of a plain object literal.
   */
  var CLASS_KEYS$1 = Object.freeze(["Root", "Mesh", "BoneBinding", "IndexGroup", "MorphTarget", "Model", "Skeleton", "Bone", "Animation", "TrackGroup", "TransformTrack", "VectorTrack", "Curve"]);

  /**
   * Constructors used to hydrate shared projection nodes as class instances.
   *
   * Every key is optional; node types with no matching constructor keep the
   * default plain-object shape. See {@link CLASS_KEYS} for valid keys.
   *
   * @typedef {{[key: string]: new () => object}} Gr2NodeClasses
   */

  /**
   * Instantiate and populate a node class, or return the plain props unchanged.
   *
   * @param {Gr2NodeClasses} classes Opt-in node class map.
   * @param {string} key Node key to look up in `classes`.
   * @param {object} props Fields to populate onto the instance.
   * @returns {object} A populated class instance, or `props` when no
   * constructor is registered for `key`.
   */
  function build(classes, key, props) {
    var hydrationOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var Ctor = classes[key];
    return Ctor ? populate(new Ctor(), props, hydrationOptions) : props;
  }
  function populate(instance, props) {
    var hydrationOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!instance || typeof instance.SetValues !== "function") {
      throw new TypeError("CjsGr2Format class population requires classes to implement SetValues(values)");
    }
    instance.SetValues(props, _objectSpread2(_objectSpread2({}, hydrationOptions), {}, {
      skipUpdate: true,
      skipEvents: true
    }));
    return instance;
  }

  /**
   * Root object emitted in the shared GR2 shape.
   *
   * @typedef {object} Gr2SharedRoot
   * @property {number} grannyFileFormatRevision Granny file format revision.
   * @property {string} grannyFileSource Original source filename, or an empty string.
   * @property {object[]} meshes Mesh records with deinterleaved vertex channels.
   * @property {object[]} models Model records with skeleton and mesh bindings.
   * @property {object[]} animations Animation records and transform tracks.
   */

  /**
   * Convert a reflected numeric value to the shared float convention.
   *
   * @param {number} v Raw reflected numeric value.
   * @param {number} memberType Granny member type id.
   * @returns {number} Converted and float32-rounded value.
   */
  function convert(v, memberType) {
    switch (memberType) {
      case T.NormalUInt8:
        return fr(v * INV255);
      case T.NormalUInt16:
        return fr(v * INV65535);
      case T.BinormalInt8:
        return fr(v * INV127);
      case T.BinormalInt16:
        return fr(v * INV32767);
      default:
        return fr(v);
    }
  }

  /**
   * Replace non-finite untyped numbers with zero.
   *
   * @param {number} v Candidate numeric value.
   * @returns {number} The original finite value, or zero.
   */
  function sf(v) {
    return Number.isFinite(v) ? v : 0;
  }

  /**
   * Copy and dequantize one vertex channel from reflected vertex objects.
   *
   * Missing Granny members return an empty channel.
   *
   * @param {object[]} vertices Reflected vertex array with non-enumerable type metadata.
   * @param {string} memberName Granny vertex member name to copy.
   * @param {number} destWidth Number of components in the emitted channel.
   * @param {boolean} [preserveWidth] Retain an authored three- or four-component width.
   * @returns {number[]} Flat deinterleaved channel values.
   */
  function copyChannel(vertices, memberName, destWidth) {
    var preserveWidth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var type = vertices.__type || [],
      m = type.find(x => x.name === memberName);
    if (!m) return [];
    var srcWidth = m.arrayWidth > 1 ? m.arrayWidth : 1,
      width = preserveWidth && (srcWidth === 3 || srcWidth === 4) ? srcWidth : destWidth,
      n = Math.min(srcWidth, width),
      out = new Array(vertices.length * width).fill(0);
    for (var i = 0; i < vertices.length; i++) {
      var raw = vertices[i][memberName],
        arr = Array.isArray(raw) ? raw : [raw],
        base = i * width;
      for (var k = 0; k < n; k++) {
        out[base + k] = sf(convert(arr[k], m.type));
      }
    }
    return out;
  }
  var VERTEX_CHANNELS = Object.freeze([["position", "Position", 3], ["blendIndice", "BoneIndices", 4], ["tangent", "Tangent", 4, true], ["normal", "Normal", 3], ["texcoord0", "TextureCoordinates0", 2], ["texcoord1", "TextureCoordinates1", 2], ["binormal", "Binormal", 4, true], ["blendWeight", "BoneWeights", 4]]);
  function emitVertexChannels(vertices) {
    var channels = {};
    for (var _ref3 of VERTEX_CHANNELS) {
      var _ref2 = _slicedToArray(_ref3, 4);
      var name = _ref2[0];
      var memberName = _ref2[1];
      var width = _ref2[2];
      var preserveWidth = _ref2[3];
      channels[name] = copyChannel(vertices, memberName, width, preserveWidth);
    }
    return channels;
  }

  /**
   * Flatten reflected scalar-array wrappers into plain JavaScript values.
   *
   * @param {ArrayLike<any>} a Reflected scalar array or already-flat array.
   * @returns {any[]} Plain scalar values.
   */
  function scalarArray(a) {
    if (!a || !a.length) return [];
    if (typeof a[0] === "object" && a[0] !== null) {
      var k = Object.keys(a[0])[0];
      return a.map(x => x[k]);
    }
    return a;
  }

  /**
   * Granny curve format ids emitted by the shared curve projector.
   */
  var CURVE_FORMATS = Object.freeze({
    DaKeyframes32f: 0,
    DaK32fC32f: 1,
    DaIdentity: 2,
    DaConstant32f: 3,
    D3Constant32f: 4,
    D4Constant32f: 5,
    DaK16uC16u: 6,
    DaK8uC8u: 7,
    D4nK16uC15u: 8,
    D4nK8uC7u: 9,
    D3K16uC16u: 10,
    D3K8uC8u: 11,
    D9I1K16uC16u: 12,
    D9I3K16uC16u: 13,
    D9I1K8uC8u: 14,
    D9I3K8uC8u: 15,
    D3I1K32fC32f: 16,
    D3I1K16uC16u: 17,
    D3I1K8uC8u: 18
  });
  var F = CURVE_FORMATS;

  /**
   * Locate the inline curve-data header inside a reflected curve-data object.
   *
   * @param {object} cd Reflected Granny curve-data object.
   * @returns {{Format: number, Degree: number}|null} Header object when present.
   */
  function curveHeader(cd) {
    for (var k of Object.keys(cd)) {
      if (k.startsWith("CurveDataHeader")) return cd[k];
    }
    return null;
  }

  /**
   * Convert a reflected scalar array to float32-rounded finite numbers.
   *
   * @param {ArrayLike<any>} a Reflected scalar array.
   * @param {number[]} [fallback] Semantic values used cyclically for non-finite
   *   components; defaults to zero for untyped data.
   * @returns {number[]} Float array.
   */
  function farr(a) {
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    return scalarArray(a).map((x, index) => {
      var _fallback;
      var value = fr(x);
      return Number.isFinite(value) ? value : (_fallback = fallback === null || fallback === void 0 ? void 0 : fallback[index % fallback.length]) != null ? _fallback : 0;
    });
  }

  /**
   * Convert a reflected scalar array to unsigned 32-bit integer values.
   *
   * @param {ArrayLike<any>} a Reflected scalar array.
   * @returns {number[]} Unsigned integer array.
   */
  function uarr(a) {
    return scalarArray(a).map(x => x >>> 0);
  }

  /**
   * Project one Granny Curve2 object into shared form.
   *
   * @param {object} curve2 Reflected Granny curve object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Compact curve record with format-specific fields.
   */
  function emitCurve(curve2) {
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var controlFallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [0];
    var cd = curve2 && curve2.CurveData;
    if (!cd) return build(classes, "Curve", {
      format: 0,
      degree: 0,
      error: "no curve data"
    });
    var h = curveHeader(cd) || {
        Format: 0,
        Degree: 0
      },
      format = h.Format,
      degree = h.Degree,
      o = {
        format,
        degree
      };
    switch (format) {
      case F.DaIdentity:
        break;
      case F.DaKeyframes32f:
        o.dimension = cd.Dimension;
        o.controls = farr(cd.Controls, controlFallback);
        break;
      case F.DaConstant32f:
        o.controls = farr(cd.Controls, controlFallback);
        break;
      case F.D3Constant32f:
        o.controls = farr((cd.Controls || [0, 0, 0]).slice(0, 3), controlFallback);
        break;
      case F.D4Constant32f:
        o.controls = farr((cd.Controls || [0, 0, 0, 1]).slice(0, 4), controlFallback);
        break;
      case F.DaK32fC32f:
        o.knots = farr(cd.Knots);
        o.controls = farr(cd.Controls, controlFallback);
        break;
      case F.DaK16uC16u:
      case F.DaK8uC8u:
        o.oneOverKnotScaleTrunc = cd.OneOverKnotScaleTrunc;
        o.controlScaleOffsets = farr(cd.ControlScaleOffsets);
        o.knotsControls = uarr(cd.KnotsControls);
        break;
      case F.D4nK16uC15u:
      case F.D4nK8uC7u:
        o.scaleOffsetTableEntries = cd.ScaleOffsetTableEntries;
        o.oneOverKnotScale = sf(fr(cd.OneOverKnotScale));
        o.knotsControls = uarr(cd.KnotsControls);
        break;
      case F.D3K16uC16u:
      case F.D3K8uC8u:
      case F.D3I1K16uC16u:
      case F.D3I1K8uC8u:
      case F.D9I3K16uC16u:
      case F.D9I3K8uC8u:
        o.oneOverKnotScaleTrunc = cd.OneOverKnotScaleTrunc;
        o.controlScales = (cd.ControlScales || [0, 0, 0]).map(x => sf(fr(x)));
        o.controlOffsets = (cd.ControlOffsets || [0, 0, 0]).map(x => sf(fr(x)));
        o.knotsControls = uarr(cd.KnotsControls);
        break;
      case F.D3I1K32fC32f:
        o.controlScales = (cd.ControlScales || [0, 0, 0]).map(x => sf(fr(x)));
        o.controlOffsets = (cd.ControlOffsets || [0, 0, 0]).map(x => sf(fr(x)));
        o.knotsControls = farr(cd.KnotsControls);
        break;
      case F.D9I1K16uC16u:
      case F.D9I1K8uC8u:
        o.oneOverKnotScaleTrunc = cd.OneOverKnotScaleTrunc;
        o.controlScales = [sf(fr(cd.ControlScale))];
        o.controlOffsets = [sf(fr(cd.ControlOffset))];
        o.knotsControls = uarr(cd.KnotsControls);
        break;
      default:
        o.error = "Unknown format ".concat(format);
    }
    return build(classes, "Curve", o);
  }

  /**
   * Convert arbitrary reflected variant data to JSON-safe plain values.
   *
   * @param {any} v Reflected variant value.
   * @returns {JsonValue} JSON-compatible value.
   */
  function emitVariant(v) {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) return v.map(emitVariant);
    if (typeof v === "object") {
      var o = {};
      for (var k of Object.keys(v)) {
        o[k] = emitVariant(v[k]);
      }
      return o;
    }
    if (typeof v === "number") return Number.isInteger(v) ? v : sf(fr(v));
    return v;
  }

  /**
   * Attach converted extended data when the reflected variant is present.
   *
   * @param {object} target Projected GR2 object to mutate.
   * @param {object|null|undefined} ext Reflected extended-data variant.
   * @returns {void}
   */
  function addExtendedData(target, ext) {
    if (ext !== null && ext !== undefined && typeof ext === "object") {
      target.extendedData = emitVariant(ext);
    }
  }

  /**
   * Project one reflected Granny morph target (blend shape).
   *
   * Morph target vertex data uses the same deinterleaved channel layout as a
   * mesh's primary vertex data.
   *
   * @param {object} mt Reflected Granny `granny_morph_target` object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted morph-target record.
   */
  function emitMorphTarget(mt) {
    var _mt$ScalarName;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var vd = mt.VertexData,
      verts = vd && vd.Vertices || [];
    return build(classes, "MorphTarget", {
      name: (_mt$ScalarName = mt.ScalarName) != null ? _mt$ScalarName : "",
      dataIsDeltas: !!mt.DataIsDeltas,
      vertex: emitVertexChannels(verts)
    });
  }
  function mappedAnnotationRows(set, vertexCount) {
    var annotations = set.VertexAnnotations || [],
      map = scalarArray(set.VertexAnnotationIndices),
      rows = [],
      vertexIndices = [];
    if (set.IndicesMapFromVertexToAnnotation) {
      for (var vertexIndex = 0; vertexIndex < Math.min(map.length, vertexCount); vertexIndex++) {
        var annotationIndex = map[vertexIndex];
        if (!Number.isInteger(annotationIndex) || annotationIndex < 0 || annotationIndex >= annotations.length) continue;
        rows.push(annotations[annotationIndex]);
        vertexIndices.push(vertexIndex);
      }
    } else {
      var count = map.length ? Math.min(map.length, annotations.length) : annotations.length;
      for (var _annotationIndex = 0; _annotationIndex < count; _annotationIndex++) {
        var _vertexIndex = map.length ? map[_annotationIndex] : _annotationIndex;
        if (!Number.isInteger(_vertexIndex) || _vertexIndex < 0 || _vertexIndex >= vertexCount) continue;
        rows.push(annotations[_annotationIndex]);
        vertexIndices.push(_vertexIndex);
      }
    }
    Object.defineProperty(rows, "__type", {
      value: annotations.__type || [],
      configurable: true
    });
    var identity = rows.length === vertexCount && vertexIndices.every((value, index) => value === index);
    return {
      rows,
      vertexIndices: identity ? null : vertexIndices
    };
  }
  function emitVertexAnnotationTarget(set, vertexCount) {
    var _set$VertexAnnotation, _set$Name;
    var classes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (!set || !((_set$VertexAnnotation = set.VertexAnnotations) !== null && _set$VertexAnnotation !== void 0 && _set$VertexAnnotation.length)) return null;
    var mapped = mappedAnnotationRows(set, vertexCount);
    if (!mapped.rows.length) return null;
    var target = {
      name: (_set$Name = set.Name) != null ? _set$Name : "",
      dataIsDeltas: true,
      vertex: emitVertexChannels(mapped.rows)
    };
    if (mapped.vertexIndices) target.vertexIndices = mapped.vertexIndices;
    return build(classes, "MorphTarget", target);
  }

  /**
   * Project a reflected Granny mesh.
   *
   * @param {object} mesh Reflected Granny mesh object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted mesh record.
   */
  function emitMesh(mesh) {
    var _mesh$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var rebuildMissingBounds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var o = {};
    o.name = (_mesh$Name = mesh.Name) != null ? _mesh$Name : "";
    // Granny files carry no mesh-level AABB (only per-bone OBBs), so these
    // stay zeros unless the caller opts into `rebuildMissingBounds` -
    // then real bounds are computed from the position channel below, per
    // group and for the mesh. Zeros starved every consumer that treats
    // bounds as load-bearing: ccpwgl's logical LOD size-culled every
    // gr2-sourced mesh to nothing the day its visibility gate armed. The
    // old gr2_json path always regenerated from vertices; here it is an
    // option because it walks every referenced vertex once per group.
    o.minBounds = [0, 0, 0];
    o.maxBounds = [0, 0, 0];
    o.boneBindings = (mesh.BoneBindings || []).map(bb => {
      var _bb$BoneName;
      return build(classes, "BoneBinding", {
        name: (_bb$BoneName = bb.BoneName) != null ? _bb$BoneName : "",
        minBounds: (bb.OBBMin || [0, 0, 0]).map(x => sf(fr(x))),
        maxBounds: (bb.OBBMax || [0, 0, 0]).map(x => sf(fr(x)))
      });
    });
    var vd = mesh.PrimaryVertexData,
      verts = vd && vd.Vertices || [];
    o.vertex = emitVertexChannels(verts);
    o.morphTargets = (mesh.MorphTargets || []).map(mt => emitMorphTarget(mt, classes));
    o.morphTargets.push(...((vd === null || vd === void 0 ? void 0 : vd.VertexAnnotationSets) || []).map(set => emitVertexAnnotationTarget(set, verts.length, classes)).filter(Boolean));
    var topo = mesh.PrimaryTopology || {},
      i32arr = scalarArray(topo.Indices),
      i16arr = scalarArray(topo.Indices16),
      groups = topo.Groups || [];
    o.indices = [];
    var indices = null,
      bpi = 0,
      meshBounds = null;
    if (i32arr.length) {
      indices = i32arr;
      bpi = 4;
    } else if (i16arr.length) {
      indices = i16arr.map(x => x & 0xffff);
      bpi = 2;
    }
    if (indices) {
      for (var g of groups) {
        var faces = new Array(g.TriCount * 3),
          start = g.TriFirst * 3;
        for (var i = 0; i < g.TriCount * 3; i++) {
          faces[i] = indices[start + i] >>> 0;
        }
        var group = {
          name: "area_".concat(g.MaterialIndex),
          bytesPerIndex: bpi,
          faces
        };
        if (rebuildMissingBounds) {
          var bounds = boundsFromFaces(o.vertex.position, faces);
          if (bounds) {
            group.minBounds = bounds.min;
            group.maxBounds = bounds.max;
            if (!meshBounds) {
              meshBounds = {
                min: [...bounds.min],
                max: [...bounds.max]
              };
            } else {
              for (var k = 0; k < 3; k++) {
                if (bounds.min[k] < meshBounds.min[k]) meshBounds.min[k] = bounds.min[k];
                if (bounds.max[k] > meshBounds.max[k]) meshBounds.max[k] = bounds.max[k];
              }
            }
          }
        }
        o.indices.push(build(classes, "IndexGroup", group));
      }
    }
    if (meshBounds) {
      o.minBounds = meshBounds.min;
      o.maxBounds = meshBounds.max;
    }
    return build(classes, "Mesh", o);
  }

  /**
   * Axis-aligned bounds of the positions a face list references.
   *
   * @param {number[]} positions Flat xyz position channel.
   * @param {number[]} faces Vertex indices.
   * @returns {{min: number[], max: number[]}|null} Bounds, or null without data.
   */
  function boundsFromFaces(positions, faces) {
    if (!positions || !positions.length || !faces.length) return null;
    var min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (var i = 0; i < faces.length; i++) {
      var base = faces[i] * 3;
      for (var k = 0; k < 3; k++) {
        var v = positions[base + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
    return Number.isFinite(min[0]) ? {
      min,
      max
    } : null;
  }

  /**
   * Project a reflected Granny skeleton bone.
   *
   * @param {object} bone Reflected Granny bone object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted bone record.
   */
  function emitBone(bone) {
    var _bone$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var t = bone.LocalTransform || bone.Transform || {
        flags: 0,
        position: [0, 0, 0],
        orientation: [0, 0, 0, 1],
        scaleShear: [1, 0, 0, 0, 1, 0, 0, 0, 1]
      },
      o = {};
    o.name = (_bone$Name = bone.Name) != null ? _bone$Name : "";
    o.parentIndex = bone.ParentIndex | 0;
    o.flag = t.flags;
    if (t.flags & 1) o.position = farr(t.position, [0, 0, 0]);
    if (t.flags & 2) o.orientation = farr(t.orientation, [0, 0, 0, 1]);
    if (t.flags & 4) o.scaleShear = farr(t.scaleShear, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    addExtendedData(o, bone.ExtendedData);
    return build(classes, "Bone", o);
  }

  /**
   * Project a reflected Granny skeleton.
   *
   * @param {object|null} skel Reflected Granny skeleton object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted skeleton record.
   */
  function emitSkeleton(skel) {
    var _skel$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var o = {};
    o.name = skel ? (_skel$Name = skel.Name) != null ? _skel$Name : "" : "";
    o.bones = skel ? (skel.Bones || []).map(b => emitBone(b, classes)) : [];
    if (skel) addExtendedData(o, skel.ExtendedData);
    return build(classes, "Skeleton", o);
  }

  /**
   * Project a reflected Granny model.
   *
   * @param {object} model Reflected Granny model object.
   * @param {object} fileInfo Root reflected Granny file-info object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @param {WeakMap<object, object>} [skeletonCache] Emitted skeleton identity cache.
   * @returns {object} Emitted model record.
   */
  function emitModel(model, fileInfo) {
    var _model$Name;
    var classes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var skeletonCache = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new WeakMap();
    var o = {};
    o.name = (_model$Name = model.Name) != null ? _model$Name : "";
    if (model.Skeleton && skeletonCache.has(model.Skeleton)) {
      o.skeleton = skeletonCache.get(model.Skeleton);
    } else {
      o.skeleton = emitSkeleton(model.Skeleton, classes);
      if (model.Skeleton) skeletonCache.set(model.Skeleton, o.skeleton);
    }
    var meshes = fileInfo.Meshes || [];
    o.meshBindings = (model.MeshBindings || []).map(mb => {
      var idx = meshes.indexOf(mb && mb.Mesh);
      return idx;
    });
    addExtendedData(o, model.ExtendedData);
    return build(classes, "Model", o);
  }

  /**
   * Project a reflected Granny transform track.
   *
   * @param {object} tt Reflected Granny transform-track object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted transform-track record.
   */
  function emitTransformTrack(tt) {
    var _tt$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // Neither runtime transform consumers nor JSON can use Granny's non-finite
    // controls. Preserve each channel's meaning with Granny's corresponding
    // identity rather than the scalar zero used for untyped data. Knot times
    // remain on the strict finite-zero projection path above.
    return build(classes, "TransformTrack", {
      name: (_tt$Name = tt.Name) != null ? _tt$Name : "",
      flags: tt.Flags | 0,
      orientation: emitCurve(tt.OrientationCurve, classes, [0, 0, 0, 1]),
      position: emitCurve(tt.PositionCurve, classes, [0, 0, 0]),
      scaleShear: emitCurve(tt.ScaleShearCurve, classes, [1, 0, 0, 0, 1, 0, 0, 0, 1])
    });
  }

  /**
   * Project a reflected Granny vector track.
   *
   * @param {object} vt Reflected Granny vector-track object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted vector-track record.
   */
  function emitVectorTrack(vt) {
    var _vt$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return build(classes, "VectorTrack", {
      name: (_vt$Name = vt.Name) != null ? _vt$Name : "",
      dimension: vt.Dimension | 0,
      valueCurve: emitCurve(vt.ValueCurve, classes)
    });
  }

  /**
   * Project a reflected Granny track group.
   *
   * @param {object} tg Reflected Granny track-group object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted track-group record.
   */
  function emitTrackGroup(tg) {
    var _tg$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return build(classes, "TrackGroup", {
      name: (_tg$Name = tg.Name) != null ? _tg$Name : "",
      transformTracks: (tg.TransformTracks || []).map(tt => emitTransformTrack(tt, classes)),
      vectorTracks: (tg.VectorTracks || []).map(vt => emitVectorTrack(vt, classes))
    });
  }

  /**
   * Project a reflected Granny animation.
   *
   * @param {object} anim Reflected Granny animation object.
   * @param {Gr2NodeClasses} [classes] Opt-in node class map.
   * @returns {object} Emitted animation record.
   */
  function emitAnimation(anim) {
    var _anim$Name;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var o = {};
    o.name = (_anim$Name = anim.Name) != null ? _anim$Name : "";
    o.duration = sf(fr(anim.Duration));
    o.timeStep = sf(fr(anim.TimeStep));
    o.oversampling = sf(fr(anim.Oversampling));
    o.defaultLoopCount = anim.DefaultLoopCount | 0;
    o.flags = anim.Flags | 0;
    o.trackGroups = (anim.TrackGroups || []).filter(t => t).map(tg => emitTrackGroup(tg, classes));
    addExtendedData(o, anim.ExtendedData);
    return build(classes, "Animation", o);
  }

  /**
   * Convert a reflected `granny_file_info` graph into the shared GR2 projection.
   *
   * The key order and numeric conversion rules are stable so downstream tools can
   * compare emitted data.
   *
   * When `options.classes` is given, matching node types are instantiated and
   * populated as class instances instead of plain object literals; an opt-in
   * alternative to walking the returned projection into application-specific
   * classes by hand. See {@link CLASS_KEYS} for the recognized keys.
   *
   * @param {object} fileInfo Reflected `granny_file_info` object from `reader.js`.
   * @param {number} version Granny file format revision.
   * @param {object} [options] Emission options.
   * @param {Gr2NodeClasses} [options.classes] Opt-in node class map.
   * @returns {Gr2SharedRoot} Plain shared projection, or a
   * populated `classes.Root` instance when provided.
   */
  function projectShared(fileInfo, version) {
    var _fileInfo$FromFileNam;
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _options$classes = options.classes,
      classes = _options$classes === void 0 ? {} : _options$classes,
      _options$rebuildMissi = options.rebuildMissingBounds,
      rebuildMissingBounds = _options$rebuildMissi === void 0 ? false : _options$rebuildMissi,
      hydrationOptions = _objectWithoutProperties(options, _excluded);
    var skeletonCache = new WeakMap();
    return build(classes, "Root", {
      grannyFileFormatRevision: version | 0,
      grannyFileSource: (_fileInfo$FromFileNam = fileInfo.FromFileName) != null ? _fileInfo$FromFileNam : "",
      meshes: (fileInfo.Meshes || []).filter(m => m).map(m => emitMesh(m, classes, rebuildMissingBounds)),
      models: (fileInfo.Models || []).filter(m => m).map(m => emitModel(m, fileInfo, classes, skeletonCache)),
      animations: (fileInfo.Animations || []).filter(a => a).map(a => emitAnimation(a, classes))
    }, hydrationOptions);
  }

  /**
   * GR2 JSON output adapter.
   * @author cppctamber
   */

  /**
   * Convert a reflected `granny_file_info` graph into the stable GR2 JSON shape.
   *
   * @param {object} fileInfo Reflected `granny_file_info` object from `reader.js`.
   * @param {number} version Granny file format revision.
   * @param {object} [options] Emission options.
   * @returns {object} JSON-compatible GR2 output.
   */
  function emitJson(fileInfo, version) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return projectShared(fileInfo, version, options);
  }

  function parsedLodName(name) {
    var match = /^((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?) LOD ([0-9]+)$/.exec(String(name != null ? name : ""));
    return match ? {
      base: match[1],
      threshold: Number(match[2])
    } : null;
  }

  /**
   * Reassemble Granny's separate `BaseName LOD <threshold>` meshes for CMF.
   *
   * Carbon publishes those siblings as LODs inside the unique unsuffixed base
   * mesh. Names without a unique exact base are left untouched; `_lowdetail`
   * resource paths are unrelated to this in-file convention.
   */
  function reassembleGr2Lods(root) {
    var _root$meshes, _root$models;
    var meshes = (_root$meshes = root === null || root === void 0 ? void 0 : root.meshes) != null ? _root$meshes : [];
    var baseIndices = new Map();
    for (var index = 0; index < meshes.length; index++) {
      var _meshes$index$name, _meshes$index, _baseIndices$get;
      var name = (_meshes$index$name = (_meshes$index = meshes[index]) === null || _meshes$index === void 0 ? void 0 : _meshes$index.name) != null ? _meshes$index$name : "";
      if (parsedLodName(name)) continue;
      var indices = (_baseIndices$get = baseIndices.get(name)) != null ? _baseIndices$get : [];
      indices.push(index);
      baseIndices.set(name, indices);
    }
    var siblings = new Map();
    for (var _index = 0; _index < meshes.length; _index++) {
      var _meshes$_index, _baseIndices$get2, _siblings$get;
      var parsed = parsedLodName((_meshes$_index = meshes[_index]) === null || _meshes$_index === void 0 ? void 0 : _meshes$_index.name);
      if (!parsed || ((_baseIndices$get2 = baseIndices.get(parsed.base)) === null || _baseIndices$get2 === void 0 ? void 0 : _baseIndices$get2.length) !== 1) continue;
      var values = (_siblings$get = siblings.get(parsed.base)) != null ? _siblings$get : [];
      values.push({
        index: _index,
        threshold: parsed.threshold,
        mesh: meshes[_index]
      });
      siblings.set(parsed.base, values);
    }
    var combinable = new Set([...siblings].filter(_ref => {
      var _ref2 = _slicedToArray(_ref, 2),
        values = _ref2[1];
      return new Set(values.map(value => value.threshold)).size === values.length;
    }).map(_ref3 => {
      var _ref4 = _slicedToArray(_ref3, 1),
        name = _ref4[0];
      return name;
    }));
    var oldToNew = new Array(meshes.length);
    var output = [];
    for (var _index2 = 0; _index2 < meshes.length; _index2++) {
      var _siblings$get2, _mesh$name, _mesh$name2;
      var mesh = meshes[_index2];
      var _parsed = parsedLodName(mesh === null || mesh === void 0 ? void 0 : mesh.name);
      if (_parsed && combinable.has(_parsed.base)) {
        // Its unique base emits the combined mesh.
        continue;
      }
      var group = (_siblings$get2 = siblings.get((_mesh$name = mesh === null || mesh === void 0 ? void 0 : mesh.name) != null ? _mesh$name : "")) != null ? _siblings$get2 : [];
      var thresholds = new Set(group.map(value => value.threshold));
      var canCombine = combinable.has((_mesh$name2 = mesh === null || mesh === void 0 ? void 0 : mesh.name) != null ? _mesh$name2 : "") && group.length > 0 && thresholds.size === group.length;
      var newIndex = output.length;
      oldToNew[_index2] = newIndex;
      if (!canCombine) {
        output.push(mesh);
        continue;
      }
      var ordered = group.slice().sort((left, right) => right.threshold - left.threshold);
      output.push(_objectSpread2(_objectSpread2({}, mesh), {}, {
        lods: [_objectSpread2(_objectSpread2({}, mesh), {}, {
          threshold: 0xffffffff
        }), ...ordered.map(value => _objectSpread2(_objectSpread2({}, value.mesh), {}, {
          threshold: value.threshold
        }))]
      }));
      for (var value of ordered) oldToNew[value.index] = newIndex;
    }
    var models = ((_root$models = root === null || root === void 0 ? void 0 : root.models) != null ? _root$models : []).map(model => {
      var seen = new Set();
      var meshBindings = [];
      for (var oldIndex of (_model$meshBindings = model.meshBindings) != null ? _model$meshBindings : []) {
        var _model$meshBindings;
        var _newIndex = oldIndex === -1 ? -1 : oldToNew[oldIndex];
        if (_newIndex === undefined || seen.has(_newIndex)) continue;
        seen.add(_newIndex);
        meshBindings.push(_newIndex);
      }
      return _objectSpread2(_objectSpread2({}, model), {}, {
        meshBindings
      });
    });
    return _objectSpread2(_objectSpread2({}, root), {}, {
      meshes: output,
      models
    });
  }

  /**
   * Hydrate a native CMF graph through caller-provided node constructors.
   *
   * @param {object} root Native CMF graph.
   * @param {object} [classes] CMF class-key to constructor map.
   * @param {object} [hydrationOptions] Values forwarded to SetValues.
   * @param {string} [populationLabel] Reader label used by population errors.
   * @returns {object} Hydrated CMF root or the original plain node shapes.
   */
  function hydrateCmf(root) {
    var _root$meshes, _root$skeletons, _root$animations;
    var classes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var hydrationOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var populationLabel = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "CjsCmfFormat";
    var fields = _objectSpread2(_objectSpread2({}, root), {}, {
      metadata: root.metadata ? hydrateMetadata(root.metadata, classes, hydrationOptions, populationLabel) : null,
      meshes: ((_root$meshes = root.meshes) != null ? _root$meshes : []).map(mesh => hydrateMesh(mesh, classes, hydrationOptions, populationLabel)),
      skeletons: ((_root$skeletons = root.skeletons) != null ? _root$skeletons : []).map(skeleton => hydrateSkeleton(skeleton, classes, hydrationOptions, populationLabel)),
      animations: ((_root$animations = root.animations) != null ? _root$animations : []).map(animation => hydrateAnimation(animation, classes, hydrationOptions, populationLabel))
    });
    if (Array.isArray(root.sections)) {
      fields.sections = root.sections.map(section => hydrateNode("Section", section, classes, hydrationOptions, populationLabel));
    }
    return hydrateNode("Root", fields, classes, hydrationOptions, populationLabel);
  }
  function hydrateMetadata(metadata, classes, hydrationOptions, populationLabel) {
    var _metadata$entries;
    return hydrateNode("Metadata", _objectSpread2(_objectSpread2({}, metadata), {}, {
      entries: ((_metadata$entries = metadata.entries) != null ? _metadata$entries : []).map(entry => hydrateNode("MetadataEntry", entry, classes, hydrationOptions, populationLabel))
    }), classes, hydrationOptions, populationLabel);
  }
  function hydrateMesh(mesh, classes, hydrationOptions, populationLabel) {
    var _mesh$morphTargets, _mesh$lods, _lods$, _mesh$indices, _lods$0$vertex, _lods$2, _mesh$decl, _mesh$areas, _mesh$boneBindings, _morphTargets$decl, _morphTargets$targets, _mesh$audioOcclusionM;
    var morphTargets = (_mesh$morphTargets = mesh.morphTargets) != null ? _mesh$morphTargets : {
        decl: [],
        targets: []
      },
      lods = ((_mesh$lods = mesh.lods) != null ? _mesh$lods : []).map(lod => hydrateLod(lod, classes, hydrationOptions, populationLabel)),
      indices = Array.isArray((_lods$ = lods[0]) === null || _lods$ === void 0 ? void 0 : _lods$.indices) ? lods[0].indices : ((_mesh$indices = mesh.indices) != null ? _mesh$indices : []).map(group => hydrateNode("IndexGroup", group, classes, hydrationOptions, populationLabel)),
      vertex = (_lods$0$vertex = (_lods$2 = lods[0]) === null || _lods$2 === void 0 ? void 0 : _lods$2.vertex) != null ? _lods$0$vertex : mesh.vertex;
    return hydrateNode("Mesh", _objectSpread2(_objectSpread2({}, mesh), {}, {
      vertex,
      indices,
      decl: ((_mesh$decl = mesh.decl) != null ? _mesh$decl : []).map(element => hydrateNode("VertexElement", element, classes, hydrationOptions, populationLabel)),
      lods,
      areas: ((_mesh$areas = mesh.areas) != null ? _mesh$areas : []).map(area => hydrateNode("MeshArea", area, classes, hydrationOptions, populationLabel)),
      boneBindings: ((_mesh$boneBindings = mesh.boneBindings) != null ? _mesh$boneBindings : []).map(binding => hydrateNode("BoneBinding", binding, classes, hydrationOptions, populationLabel)),
      morphTargets: hydrateNode("MorphTargets", _objectSpread2(_objectSpread2({}, morphTargets), {}, {
        decl: ((_morphTargets$decl = morphTargets.decl) != null ? _morphTargets$decl : []).map(element => hydrateNode("VertexElement", element, classes, hydrationOptions, populationLabel)),
        targets: ((_morphTargets$targets = morphTargets.targets) != null ? _morphTargets$targets : []).map(target => hydrateNode("MorphTarget", target, classes, hydrationOptions, populationLabel))
      }), classes, hydrationOptions, populationLabel),
      audioOcclusionMesh: hydrateNode("AudioOcclusionMesh", (_mesh$audioOcclusionM = mesh.audioOcclusionMesh) != null ? _mesh$audioOcclusionM : {
        vertices: [],
        indices: [],
        bounds: {
          min: [0, 0, 0],
          max: [0, 0, 0]
        }
      }, classes, hydrationOptions, populationLabel)
    }), classes, hydrationOptions, populationLabel);
  }
  function hydrateLod(lod, classes, hydrationOptions, populationLabel) {
    var _lod$areas, _lod$morphTargets;
    var fields = _objectSpread2(_objectSpread2({}, lod), {}, {
      areas: ((_lod$areas = lod.areas) != null ? _lod$areas : []).map(area => hydrateNode("LodMeshArea", area, classes, hydrationOptions, populationLabel)),
      morphTargets: ((_lod$morphTargets = lod.morphTargets) != null ? _lod$morphTargets : []).map(target => hydrateNode("LodMorphTarget", target, classes, hydrationOptions, populationLabel))
    });
    if (Array.isArray(lod.indices)) {
      fields.indices = lod.indices.map(group => hydrateNode("IndexGroup", group, classes, hydrationOptions, populationLabel));
    }
    return hydrateNode("MeshLod", fields, classes, hydrationOptions, populationLabel);
  }
  function hydrateSkeleton(skeleton, classes, hydrationOptions, populationLabel) {
    var _skeleton$boneMasks;
    return hydrateNode("Skeleton", _objectSpread2(_objectSpread2({}, skeleton), {}, {
      boneMasks: ((_skeleton$boneMasks = skeleton.boneMasks) != null ? _skeleton$boneMasks : []).map(mask => {
        var _mask$weights;
        return hydrateNode("BoneMask", _objectSpread2(_objectSpread2({}, mask), {}, {
          weights: ((_mask$weights = mask.weights) != null ? _mask$weights : []).map(weight => hydrateNode("BoneWeight", weight, classes, hydrationOptions, populationLabel))
        }), classes, hydrationOptions, populationLabel);
      })
    }), classes, hydrationOptions, populationLabel);
  }
  function hydrateAnimation(animation, classes, hydrationOptions, populationLabel) {
    var _animation$channels, _animation$curves;
    return hydrateNode("Animation", _objectSpread2(_objectSpread2({}, animation), {}, {
      channels: ((_animation$channels = animation.channels) != null ? _animation$channels : []).map(channel => hydrateNode("AnimationChannel", channel, classes, hydrationOptions, populationLabel)),
      curves: ((_animation$curves = animation.curves) != null ? _animation$curves : []).map(curve => hydrateNode("AnimationCurve", curve, classes, hydrationOptions, populationLabel))
    }), classes, hydrationOptions, populationLabel);
  }
  function hydrateNode(type, fields, classes, hydrationOptions, populationLabel) {
    var Class = classes === null || classes === void 0 ? void 0 : classes[type];
    if (!Class) {
      return fields;
    }
    var instance = new Class();
    if (!instance || typeof instance.SetValues !== "function") {
      throw new TypeError("".concat(populationLabel, " class population requires classes to implement SetValues(values)"));
    }
    instance.SetValues(fields, _objectSpread2(_objectSpread2({}, hydrationOptions), {}, {
      skipUpdate: true,
      skipEvents: true
    }));
    return instance;
  }

  var CLASS_KEYS = Object.freeze(Array.from(new Set([...CLASS_KEYS$1, ...CMF_CLASS_KEYS])));
  var OUTPUT_JSON = "json";
  var OUTPUT_GR2 = "gr2";
  var OUTPUT_GR2_JSON = "gr2Json";
  var OUTPUT_CMF = "cmf";
  var OUTPUT_RAW = "raw";
  var DEFAULT_VALUES = Object.freeze({
    emit: OUTPUT_JSON,
    decompressCurves: false,
    unpackTangents: false,
    rebuildMissingNormals: false,
    rebuildMissingTangents: false,
    rebuildMissingBiNormals: false,
    rebuildMissingBounds: false,
    classes: Object.freeze({})
  });
  var OPTION_KEYS = new Set(["emit", "decompressCurves", "unpackTangents", "rebuildMissingNormals", "rebuildMissingTangents", "rebuildMissingBiNormals", "rebuildMissingBounds", "classes"]);
  function normalizeEmit(emit) {
    if (emit === undefined || emit === OUTPUT_JSON) return OUTPUT_JSON;
    if (emit === OUTPUT_GR2_JSON) return OUTPUT_GR2_JSON;
    if (emit === OUTPUT_GR2) return OUTPUT_GR2;
    if (emit === OUTPUT_CMF) return OUTPUT_CMF;
    if (emit === OUTPUT_RAW) return OUTPUT_RAW;
    throw new Error("CjsGr2Format unknown emit value \"".concat(emit, "\""));
  }
  function classMap(values) {
    return values && values.classes ? values.classes : {};
  }
  function cloneValues(values) {
    return {
      emit: values.emit,
      decompressCurves: values.decompressCurves,
      unpackTangents: values.unpackTangents,
      rebuildMissingNormals: values.rebuildMissingNormals,
      rebuildMissingTangents: values.rebuildMissingTangents,
      rebuildMissingBiNormals: values.rebuildMissingBiNormals,
      rebuildMissingBounds: values.rebuildMissingBounds,
      classes: _objectSpread2({}, classMap(values))
    };
  }
  function assertKnownOptions(options) {
    for (var key of Object.keys(options)) {
      if (!OPTION_KEYS.has(key)) {
        throw new TypeError("CjsGr2Format unknown option \"".concat(key, "\""));
      }
    }
  }
  function validateBoolean(name, value) {
    if (typeof value !== "boolean") {
      throw new TypeError("CjsGr2Format ".concat(name, " option must be true or false"));
    }
    return value;
  }
  function validateRule(name, value) {
    if (typeof value === "boolean" || typeof value === "function") return value;
    throw new TypeError("CjsGr2Format ".concat(name, " option must be true, false, or a function"));
  }

  /** Validates a requested runtime class key for the GR2 format reader. */
  function validateClassKey(key) {
    if (!CLASS_KEYS.includes(key)) {
      throw new Error("CjsGr2Format unknown class type \"".concat(key, "\""));
    }
  }

  /** Validates a resolved runtime class constructor for the GR2 format reader. */
  function validateClass(type, Class) {
    validateClassKey(type);
    if (typeof Class !== "function") {
      throw new TypeError("CjsGr2Format class \"".concat(type, "\" must be a constructor"));
    }
  }
  function mergeClasses(values, classes) {
    if (!classes || typeof classes !== "object") {
      throw new TypeError("CjsGr2Format classes option must be an object");
    }
    var next = _objectSpread2({}, values.classes);
    for (var _ref3 of Object.entries(classes)) {
      var _ref2 = _slicedToArray(_ref3, 2);
      var type = _ref2[0];
      var Class = _ref2[1];
      validateClass(type, Class);
      next[type] = Class;
    }
    values.classes = next;
  }
  function optionValue(options, keys) {
    for (var key of keys) {
      if (Object.hasOwn(options, key)) return options[key];
    }
    return undefined;
  }

  /**
   * Normalizes reader options against their supported defaults for the GR2 format
   * reader.
   */
  function normalizeValues() {
    var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_VALUES;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (!options || typeof options !== "object") {
      throw new TypeError("CjsGr2Format options must be an object");
    }
    assertKnownOptions(options);
    var values = cloneValues(base);
    if (Object.hasOwn(options, "emit")) values.emit = normalizeEmit(options.emit);
    if (Object.hasOwn(options, "decompressCurves")) {
      values.decompressCurves = validateBoolean("decompressCurves", options.decompressCurves);
    }
    var unpackTangents = optionValue(options, ["unpackTangents"]);
    if (unpackTangents !== undefined) {
      values.unpackTangents = validateRule("unpackTangents", unpackTangents);
    }
    var rebuildMissingNormals = optionValue(options, ["rebuildMissingNormals"]);
    if (rebuildMissingNormals !== undefined) {
      values.rebuildMissingNormals = validateRule("rebuildMissingNormals", rebuildMissingNormals);
    }
    var rebuildMissingTangents = optionValue(options, ["rebuildMissingTangents"]);
    if (rebuildMissingTangents !== undefined) {
      values.rebuildMissingTangents = validateRule("rebuildMissingTangents", rebuildMissingTangents);
    }
    var rebuildMissingBiNormals = optionValue(options, ["rebuildMissingBiNormals"]);
    if (rebuildMissingBiNormals !== undefined) {
      values.rebuildMissingBiNormals = validateRule("rebuildMissingBiNormals", rebuildMissingBiNormals);
    }
    var rebuildMissingBounds = optionValue(options, ["rebuildMissingBounds"]);
    if (rebuildMissingBounds !== undefined) {
      if (typeof rebuildMissingBounds !== "boolean") {
        throw new TypeError("CjsGr2Format rebuildMissingBounds option must be true or false");
      }
      values.rebuildMissingBounds = rebuildMissingBounds;
    }
    if (Object.hasOwn(options, "classes")) {
      mergeClasses(values, options.classes);
    }
    if ((values.emit === OUTPUT_GR2 || values.emit === OUTPUT_CMF) && !hasClasses(values.classes)) {
      throw new TypeError("CjsGr2Format emit \"".concat(values.emit, "\" requires explicit classes"));
    }
    return values;
  }
  function hasClasses(classes) {
    return !!classes && Object.values(classes).some(Class => typeof Class === "function");
  }
  function isRawGr2Result(value) {
    return !!value && typeof value === "object" && "fileInfo" in value && typeof value.version === "number";
  }

  /**
   * Normalizes GR2 input into a Uint8Array. readGr2Raw indexes `.buffer`,
   * `.byteOffset`, `.byteLength` and calls `.subarray()`, so a raw
   * ArrayBuffer (e.g. from `fetch(...).then(r => r.arrayBuffer())`, which
   * is how ccpwgl's resource loader supplies bytes) must be wrapped in a
   * view before it reaches readGr2Raw, not passed straight through.
   *
   * @param {Uint8Array|ArrayBuffer|Buffer|DataView} input GR2 bytes.
   * @returns {Uint8Array} A Uint8Array view over the same bytes.
   */
  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    throw new TypeError("CjsGr2Format: input must be GR2 bytes (Uint8Array, Buffer, DataView or ArrayBuffer)");
  }

  /** Reads and validates raw input bytes for the GR2 format reader. */
  function readRawInput(input) {
    return isRawGr2Result(input) ? input : readGr2Raw(toBytes(input));
  }
  function meshName(mesh, meshIndex) {
    return mesh && mesh.name ? "\"".concat(mesh.name, "\"") : "#".concat(meshIndex);
  }
  function vertexChannel(mesh, channel) {
    return mesh && mesh.vertex && mesh.vertex[channel];
  }
  function hasVertexChannel(mesh, channel) {
    var value = vertexChannel(mesh, channel);
    return !!value && value.length > 0;
  }
  function requireVertexChannel(mesh, meshIndex, channel, feature) {
    var value = vertexChannel(mesh, channel);
    if (!value || value.length === 0) {
      throw new Error("CjsGr2Format ".concat(feature, " requires mesh.vertex.").concat(channel, " for mesh ").concat(meshName(mesh, meshIndex)));
    }
    return value;
  }
  function triangleFaces(mesh, meshIndex, feature) {
    var faces = [];
    for (var group of mesh.indices || []) {
      for (var index of (_group$faces = group === null || group === void 0 ? void 0 : group.faces) != null ? _group$faces : []) {
        var _group$faces;
        faces.push(index);
      }
    }
    if (faces.length === 0) {
      throw new Error("CjsGr2Format ".concat(feature, " requires triangle indices for mesh ").concat(meshName(mesh, meshIndex)));
    }
    return faces;
  }
  function shouldApplyMeshRule(reader, rule, context) {
    var fullContext = _objectSpread2({
      reader
    }, context);
    if (typeof rule === "function") {
      var result = rule(fullContext);
      if (typeof result !== "boolean") {
        throw new TypeError("CjsGr2Format ".concat(context.feature, " rule must return true or false"));
      }
      return result;
    }
    return rule;
  }
  function unpackMeshTangents(reader, json, raw, values) {
    for (var meshIndex = 0; meshIndex < (json.meshes || []).length; meshIndex++) {
      var mesh = json.meshes[meshIndex];
      if (shouldApplyMeshRule(reader, values.unpackTangents, {
        options: values,
        raw,
        json,
        mesh,
        meshIndex,
        feature: "unpackTangents",
        channel: "tangent"
      })) {
        tangents.unpack(mesh);
        for (var target of (_mesh$morphTargets = mesh.morphTargets) != null ? _mesh$morphTargets : []) {
          var _mesh$morphTargets, _target$vertexIndices, _target$vertex$positi, _target$vertex, _mesh$vertex$position, _mesh$vertex;
          var indices = (_target$vertexIndices = target.vertexIndices) != null ? _target$vertexIndices : [],
            positions = (_target$vertex$positi = (_target$vertex = target.vertex) === null || _target$vertex === void 0 ? void 0 : _target$vertex.position) != null ? _target$vertex$positi : [],
            count = indices.length || Math.floor(positions.length / 3) || Math.floor(((_mesh$vertex$position = (_mesh$vertex = mesh.vertex) === null || _mesh$vertex === void 0 ? void 0 : _mesh$vertex.position) != null ? _mesh$vertex$position : []).length / 3);
          tangents.unpack({
            vertex: target.vertex
          }, count);
        }
      }
    }
  }
  function rebuildMeshNormals(mesh, meshIndex) {
    var positions = requireVertexChannel(mesh, meshIndex, "position", "rebuildMissingNormals"),
      faces = triangleFaces(mesh, meshIndex, "rebuildMissingNormals");
    mesh.vertex.normal = Array.from(tangents.generateNormals(positions, faces));
  }
  function rebuildMeshTangents(mesh, meshIndex) {
    var positions = requireVertexChannel(mesh, meshIndex, "position", "rebuildMissingTangents"),
      normals = requireVertexChannel(mesh, meshIndex, "normal", "rebuildMissingTangents"),
      uvs = requireVertexChannel(mesh, meshIndex, "texcoord0", "rebuildMissingTangents"),
      faces = triangleFaces(mesh, meshIndex, "rebuildMissingTangents");
    mesh.vertex.tangent = Array.from(tangents.generateTangents(positions, normals, uvs, faces));
  }
  function rebuildMeshBiNormals(mesh, meshIndex) {
    var normals = requireVertexChannel(mesh, meshIndex, "normal", "rebuildMissingBiNormals"),
      tangentValues = requireVertexChannel(mesh, meshIndex, "tangent", "rebuildMissingBiNormals");
    mesh.vertex.binormal = tangents.generateBiNormals(normals, tangentValues);
  }
  function rebuildMissingMeshData(reader, json, raw, values) {
    for (var meshIndex = 0; meshIndex < (json.meshes || []).length; meshIndex++) {
      var mesh = json.meshes[meshIndex];
      if (!hasVertexChannel(mesh, "normal") && shouldApplyMeshRule(reader, values.rebuildMissingNormals, {
        options: values,
        raw,
        json,
        mesh,
        meshIndex,
        feature: "rebuildMissingNormals",
        channel: "normal"
      })) {
        rebuildMeshNormals(mesh, meshIndex);
      }
      if (!hasVertexChannel(mesh, "tangent") && shouldApplyMeshRule(reader, values.rebuildMissingTangents, {
        options: values,
        raw,
        json,
        mesh,
        meshIndex,
        feature: "rebuildMissingTangents",
        channel: "tangent"
      })) {
        rebuildMeshTangents(mesh, meshIndex);
      }
      if (!hasVertexChannel(mesh, "binormal") && shouldApplyMeshRule(reader, values.rebuildMissingBiNormals, {
        options: values,
        raw,
        json,
        mesh,
        meshIndex,
        feature: "rebuildMissingBiNormals",
        channel: "binormal"
      })) {
        rebuildMeshBiNormals(mesh, meshIndex);
      }
    }
  }
  function processMeshData(reader, json, raw, values) {
    unpackMeshTangents(reader, json, raw, values);
    rebuildMissingMeshData(reader, json, raw, values);
  }
  function finishProjection(reader, projected, raw, values) {
    if (values.decompressCurves) {
      decompressAnimationCurves(projected);
    }
    processMeshData(reader, projected, raw, values);
    return projected;
  }
  function buildJson(reader, raw, values) {
    return finishProjection(reader, emitJson(raw.fileInfo, raw.version, {
      classes: values.emit === OUTPUT_GR2 || (values.emit === OUTPUT_JSON || values.emit === OUTPUT_GR2_JSON) && hasClasses(values.classes) ? values.classes : {},
      rebuildMissingBounds: values.rebuildMissingBounds
    }), raw, values);
  }
  function buildCmf(reader, raw, values) {
    var shared = finishProjection(reader, projectShared(raw.fileInfo, raw.version, {
      rebuildMissingBounds: values.rebuildMissingBounds
    }), raw, values);
    return hydrateCmf(buildCmfFromShared(reassembleGr2Lods(shared)), values.classes, {
      source: values.source
    }, "CjsGr2Format CMF");
  }

  /** Reads input using normalized format options for the GR2 format reader. */
  function readWithValues(reader, input, values) {
    var parsed = readRawInput(input);
    if (values.emit === OUTPUT_RAW) return parsed;
    if (values.emit === OUTPUT_CMF) return buildCmf(reader, parsed, values);
    return buildJson(reader, parsed, values);
  }

  /** Converts a parsed payload into a JSON-safe value for the GR2 format reader. */
  function toJsonValue(value) {
    var seen = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new WeakSet();
    if (value === null || typeof value !== "object") return value;
    if (ArrayBuffer.isView(value)) return Array.from(value, item => toJsonValue(item, seen));
    if (Array.isArray(value)) return value.map(item => toJsonValue(item, seen));
    if (seen.has(value)) {
      throw new TypeError("CjsGr2Format.toJSON cannot convert circular data");
    }
    if (typeof value.toJSON === "function") {
      seen.add(value);
      var json = toJsonValue(value.toJSON(), seen);
      seen.delete(value);
      return json;
    }
    seen.add(value);
    var out = {};
    for (var key of Object.keys(value)) {
      out[key] = toJsonValue(value[key], seen);
    }
    seen.delete(value);
    return out;
  }

  /**
   * Inspects raw GR2 result without materializing the full GR2 format reader
   * payload.
   */
  function inspectRawGr2Result(parsed) {
    var _fileInfo$FromFileNam;
    var fileInfo = parsed.fileInfo || {},
      count = value => Array.isArray(value) ? value.filter(Boolean).length : 0;
    return {
      reader: "CjsGr2Format",
      format: "gr2",
      version: parsed.version | 0,
      sectionCount: parsed.secCount | 0,
      source: (_fileInfo$FromFileNam = fileInfo.FromFileName) != null ? _fileInfo$FromFileNam : "",
      counts: {
        meshes: count(fileInfo.Meshes),
        models: count(fileInfo.Models),
        animations: count(fileInfo.Animations),
        materials: count(fileInfo.Materials),
        textures: count(fileInfo.Textures)
      }
    };
  }

  /**
   * CarbonEngineJS-facing GR2/GSF reader and CMF-first GR2 geometry writer.
   *
   * The Cjs prefix marks this as a JavaScript format/construction boundary. It
   * reads `.gr2` geometry/skeleton/animation graphs and `.gsf` state profiles,
   * emits GR2 JSON, hydrated caller-supplied classes, or CMF-shaped output, and
   * writes pure-JavaScript GR2 geometry from CMF without pretending those
   * classes are the engine runtime itself.
   */
  var _emit = /*#__PURE__*/_classPrivateFieldLooseKey("emit");
  var _decompressCurves = /*#__PURE__*/_classPrivateFieldLooseKey("decompressCurves");
  var _unpackTangents = /*#__PURE__*/_classPrivateFieldLooseKey("unpackTangents");
  var _rebuildMissingNormals = /*#__PURE__*/_classPrivateFieldLooseKey("rebuildMissingNormals");
  var _rebuildMissingTangents = /*#__PURE__*/_classPrivateFieldLooseKey("rebuildMissingTangents");
  var _rebuildMissingBiNormals = /*#__PURE__*/_classPrivateFieldLooseKey("rebuildMissingBiNormals");
  var _classes = /*#__PURE__*/_classPrivateFieldLooseKey("classes");
  class CjsGr2Format extends CjsFormat {
    /**
     * Create a reusable format profile.
     *
     * @param {object} [options] Default format/build values.
     */
    constructor() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      super();
      Object.defineProperty(this, _emit, {
        writable: true,
        value: DEFAULT_VALUES.emit
      });
      Object.defineProperty(this, _decompressCurves, {
        writable: true,
        value: DEFAULT_VALUES.decompressCurves
      });
      Object.defineProperty(this, _unpackTangents, {
        writable: true,
        value: DEFAULT_VALUES.unpackTangents
      });
      Object.defineProperty(this, _rebuildMissingNormals, {
        writable: true,
        value: DEFAULT_VALUES.rebuildMissingNormals
      });
      Object.defineProperty(this, _rebuildMissingTangents, {
        writable: true,
        value: DEFAULT_VALUES.rebuildMissingTangents
      });
      Object.defineProperty(this, _rebuildMissingBiNormals, {
        writable: true,
        value: DEFAULT_VALUES.rebuildMissingBiNormals
      });
      Object.defineProperty(this, _classes, {
        writable: true,
        value: {}
      });
      this.SetValues(options);
    }

    /**
     * Set format values for this reusable profile.
     *
     * @param {object} [options] Values to merge into the profile.
     * @returns {CjsGr2Format} This format profile.
     */
    SetValues() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var values = normalizeValues(this.GetValues(), options);
      _classPrivateFieldLooseBase(this, _emit)[_emit] = values.emit;
      _classPrivateFieldLooseBase(this, _decompressCurves)[_decompressCurves] = values.decompressCurves;
      _classPrivateFieldLooseBase(this, _unpackTangents)[_unpackTangents] = values.unpackTangents;
      _classPrivateFieldLooseBase(this, _rebuildMissingNormals)[_rebuildMissingNormals] = values.rebuildMissingNormals;
      _classPrivateFieldLooseBase(this, _rebuildMissingTangents)[_rebuildMissingTangents] = values.rebuildMissingTangents;
      _classPrivateFieldLooseBase(this, _rebuildMissingBiNormals)[_rebuildMissingBiNormals] = values.rebuildMissingBiNormals;
      _classPrivateFieldLooseBase(this, _classes)[_classes] = values.classes;
      return this;
    }

    /**
     * Get this profile's current values, optionally with per-call overrides.
     *
     * @param {object} [options] Optional values to merge into a copy.
     * @returns {object} A copy of the effective values.
     */
    GetValues() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return normalizeValues({
        emit: _classPrivateFieldLooseBase(this, _emit)[_emit],
        decompressCurves: _classPrivateFieldLooseBase(this, _decompressCurves)[_decompressCurves],
        unpackTangents: _classPrivateFieldLooseBase(this, _unpackTangents)[_unpackTangents],
        rebuildMissingNormals: _classPrivateFieldLooseBase(this, _rebuildMissingNormals)[_rebuildMissingNormals],
        rebuildMissingTangents: _classPrivateFieldLooseBase(this, _rebuildMissingTangents)[_rebuildMissingTangents],
        rebuildMissingBiNormals: _classPrivateFieldLooseBase(this, _rebuildMissingBiNormals)[_rebuildMissingBiNormals],
        classes: _classPrivateFieldLooseBase(this, _classes)[_classes]
      }, options);
    }

    /**
     * Set multiple GR2 JSON node constructors for this profile.
     *
     * @param {object} [classes] Map of node class keys to constructors.
     * @returns {CjsGr2Format} This format profile.
     */
    SetClasses() {
      var classes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return this.SetValues({
        classes
      });
    }

    /**
     * Set a GR2 JSON node constructor for this profile.
     *
     * @param {string} type Node class key.
     * @param {Function|null|undefined} Class Constructor to use, or nullish to delete.
     * @returns {CjsGr2Format} This format profile.
     */
    SetClass(type, Class) {
      validateClassKey(type);
      if (Class === null || Class === undefined) {
        delete _classPrivateFieldLooseBase(this, _classes)[_classes][type];
        return this;
      }
      validateClass(type, Class);
      _classPrivateFieldLooseBase(this, _classes)[_classes] = _objectSpread2(_objectSpread2({}, _classPrivateFieldLooseBase(this, _classes)[_classes]), {}, {
        [type]: Class
      });
      return this;
    }

    /**
     * Get a configured GR2 JSON node constructor.
     *
     * @param {string} type Node class key.
     * @returns {Function|undefined}
     */
    GetClass(type) {
      validateClassKey(type);
      return _classPrivateFieldLooseBase(this, _classes)[_classes][type];
    }

    /**
     * Whether this reader has a constructor for a GR2 JSON node key.
     *
     * @param {string} type Node class key.
     * @returns {boolean}
     */
    HasClass(type) {
      return !!this.GetClass(type);
    }

    /**
     * Parse a .gr2 buffer and return JSON by default, classes when configured,
     * or raw reflection data when `emit` is "raw".
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @param {object} [options] Per-call values.
     * @returns {object}
     */
    Read(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return readWithValues(this, input, this.GetValues(options));
    }

    /**
     * Serialize a native CMF graph as 32-bit little-endian GR2 bytes.
     *
     * @param {object} input Native CMF v1 graph.
     * @param {object} [options] Tangent, curve-packing, and section-storage options.
     * @returns {Uint8Array} Complete GR2 file bytes.
     */
    Write(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return writeGr2(input, options);
    }

    /**
     * Convert shared or GR2-shaped geometry through CMF and serialize GR2.
     *
     * @param {object} input Shared geometry root or GR2 JSON graph.
     * @param {object} [options] Tangent, curve-packing, and section-storage options.
     * @returns {Uint8Array} Complete GR2 file bytes.
     */
    WriteShared(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return writeSharedGr2(input, options);
    }

    /**
     * Parse a .gr2 buffer into the reflected Granny object graph.
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @returns {object}
     */
    ReadRaw(input) {
      return readRawInput(input);
    }

    /**
     * Return a stable, lightweight summary for a GR2 buffer or raw result.
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @returns {object}
     */
    Inspect(input) {
      return inspectRawGr2Result(this.ReadRaw(input));
    }

    /** Whether input is a Granny State document carried by the GR2 container. */
    IsGSF(input) {
      return isGsfRaw(this.ReadRaw(input));
    }

    /** Read the GState semantic projection, or raw reflected data with `emit: "raw"`. */
    ReadGSF(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var raw = this.ReadRaw(input);
      return options.emit === "raw" ? raw : projectGsf(raw);
    }

    /** Inspect a GSF document and its referenced GR2 animations. */
    InspectGSF(input) {
      return inspectGsfRaw(this.ReadRaw(input));
    }

    /**
     * Convert format output to plain JSON-compatible data.
     *
     * @param {object} value Format output to convert.
     * @returns {any} Plain JSON-compatible data.
     */
    ToJSON(value) {
      return toJsonValue(value);
    }

    /**
     * Static one-shot read. Static methods use camelCase by convention.
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @param {object} [options] Reader and post-processing values.
     * @returns {object}
     */
    static read(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return readWithValues(CjsGr2Format, input, normalizeValues(DEFAULT_VALUES, options));
    }

    /**
     * Serialize a native CMF graph as 32-bit little-endian GR2 bytes.
     *
     * @param {object} input Native CMF v1 graph.
     * @param {object} [options] Tangent, curve-packing, and section-storage options.
     * @returns {Uint8Array} Complete GR2 file bytes.
     */
    static write(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return writeGr2(input, options);
    }

    /**
     * Convert shared or GR2-shaped geometry through CMF and serialize GR2.
     *
     * @param {object} input Shared geometry root or GR2 JSON graph.
     * @param {object} [options] Tangent, curve-packing, and section-storage options.
     * @returns {Uint8Array} Complete GR2 file bytes.
     */
    static writeShared(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return writeSharedGr2(input, options);
    }

    /**
     * Static one-shot raw read.
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @returns {object}
     */
    static readRaw(input) {
      return readRawInput(input);
    }

    /**
     * Static one-shot inspection.
     *
     * @param {Uint8Array|Buffer|object} input Raw .gr2 bytes or an existing raw read result.
     * @returns {object}
     */
    static inspect(input) {
      return inspectRawGr2Result(readRawInput(input));
    }

    /** Whether input is a Granny State document carried by the GR2 container. */
    static isGsf(input) {
      try {
        return isGsfRaw(readRawInput(input));
      } catch (_unused) {
        return false;
      }
    }

    /** Read the GState semantic projection, or raw reflected data with `emit: "raw"`. */
    static readGsf(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var raw = readRawInput(input);
      return options.emit === "raw" ? raw : projectGsf(raw);
    }

    /** Async one-shot GSF read for standard format API compatibility. */
    static readGsfAsync(input) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return Promise.resolve(this.readGsf(input, options));
    }

    /** Inspect a GSF document and its referenced GR2 animations. */
    static inspectGsf(input) {
      return inspectGsfRaw(readRawInput(input));
    }

    /**
     * Static JSON-compatible conversion.
     *
     * @param {object} value Format output to convert.
     * @returns {any} Plain JSON-compatible data.
     */
    static toJSON(value) {
      return toJsonValue(value);
    }
    /**
     * Cheap magic probe for GR2/GSF byte streams.
     *
     * @param {Uint8Array} bytes Candidate source bytes.
     * @returns {boolean} True when the 16-byte Granny magic is recognized.
     */
    static probeSupport(bytes) {
      if (!bytes || bytes.length < 16) return false;
      return bytesToHex(bytes.subarray(0, 16)) in GR2_MAGICS;
    }

    /**
     * Async read entrypoint for the resource-manager contract.
     *
     * @param {Uint8Array} bytes Source bytes.
     * @param {object} [options] Read options (emit, classes, conversions).
     * @returns {Promise<object>} The emitted GR2/GSF result.
     */
    static readAsync(bytes) {
      var _arguments = arguments;
      return _asyncToGenerator(function* () {
        var options = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : {};
        return CjsGr2Format.read(bytes, options);
      })();
    }
  }
  CjsGr2Format.OUTPUT_JSON = OUTPUT_JSON;
  CjsGr2Format.OUTPUT_GR2 = OUTPUT_GR2;
  CjsGr2Format.OUTPUT_GR2_JSON = OUTPUT_GR2_JSON;
  CjsGr2Format.OUTPUT_CMF = OUTPUT_CMF;
  CjsGr2Format.OUTPUT_RAW = OUTPUT_RAW;
  CjsGr2Format.CLASS_KEYS = CLASS_KEYS;
  CjsGr2Format.id = "gr2";
  CjsGr2Format.mediaTypes = Object.freeze(["geometry"]);
  CjsGr2Format.outputs = CjsFormat.defineOutputs({
    gr2: {
      decoded: true
    },
    cmf: {
      decoded: true
    },
    json: {
      role: "debug",
      default: true,
      decoded: true
    },
    gr2Json: {
      role: "debug",
      decoded: true
    },
    raw: {
      role: "debug",
      decoded: true
    }
  });
  CjsGr2Format.extensions = Object.freeze([".gr2", ".gsf"]);
  CjsGr2Format.curves = curves;
  CjsGr2Format.tangents = tangents;
  CjsGr2Format.gsf = Object.freeze({
    isRaw: isGsfRaw,
    project: projectGsf,
    inspectRaw: inspectGsfRaw
  });

  /** Pure data preparation shared by the worker and main-thread fallback. */
  function prepareGr2(data) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var raw = CjsGr2Format.readRaw(data);
    if (CjsGr2Format.gsf.isRaw(raw)) throw Object.assign(new Error("Granny State files are not render geometry"), {
      name: "ErrGr2GeometryExpected"
    });
    var json = CjsGr2Format.read(raw, {
      emit: "json",
      unpackTangents: !!options.unpackTangents,
      decompressCurves: true
    });
    restoreGr2VertexChannels(raw, json);
    return prepareGr2JSON(json, options);
  }
  function normalizeGrannyKeys(obj) {
    if (!obj || typeof obj !== "object" || ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) return obj;
    var names = {
      controlscaleoffsets: "controlScaleOffsets",
      knotscontrols: "knotsControls",
      scaleshear: "scaleShear"
    };
    for (var key of Object.keys(obj)) {
      var name = names[key.toLowerCase()] || key;
      var value = normalizeGrannyKeys(obj[key]);
      if (name !== key) delete obj[key];
      obj[name] = value;
    }
    return obj;
  }
  function normalizeGr2Curve(curve, dimension) {
    var _curve$uncompressed, _curve$uncompressed2;
    if (!curve) throw new Error("Missing GR2 curve");
    if (((_curve$uncompressed = curve.uncompressed) === null || _curve$uncompressed === void 0 ? void 0 : _curve$uncompressed.knots) instanceof Float32Array && ((_curve$uncompressed2 = curve.uncompressed) === null || _curve$uncompressed2 === void 0 ? void 0 : _curve$uncompressed2.controls) instanceof Float32Array) return curve;
    var input = curve.source ? _objectSpread2(_objectSpread2({}, curve.source), curve.compressed) : curve;
    var decoded = curve.uncompressed || (curve.knots && curve.controls ? curve : CjsGr2Format.curves.decodeCurve(input, dimension));
    return {
      format: input.format,
      degree: input.degree || 0,
      uncompressed: {
        dimension: decoded.dimension || dimension,
        knots: Float32Array.from(decoded.knots),
        controls: Float32Array.from(decoded.controls)
      }
    };
  }
  function prepareGr2JSON(json) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    normalizeGrannyKeys(json);
    if (options.firstMeshOnly !== false) {
      var _json$meshes;
      (_json$meshes = json.meshes) === null || _json$meshes === void 0 || _json$meshes.splice(1);
      for (var model of json.models || []) model.meshBindings = (model.meshBindings || []).filter(index => index === 0);
    }
    for (var mesh of json.meshes || []) {
      var _mesh$vertexCount, _vertex$position;
      if (mesh._prepared) continue;
      var vertex = mesh.vertex || {},
        channels = [];
      var count = (_mesh$vertexCount = mesh.vertexCount) != null ? _mesh$vertexCount : (((_vertex$position = vertex.position) === null || _vertex$position === void 0 ? void 0 : _vertex$position.length) || 0) / 3;
      var size = 0;
      for (var key of Object.keys(vertex)) {
        var values = vertex[key];
        if (!(values !== null && values !== void 0 && values.length)) continue;
        var elements = values.length / count;
        if (!Number.isInteger(elements) || elements < 1 || elements > 4) throw new Error("Invalid GR2 vertex channel: " + key);
        channels.push({
          key,
          elements,
          offset: size * 4
        });
        size += elements;
      }
      // Preserve the legacy white stream until its remaining consumers are audited.
      var stride = size + 1,
        vertices = new Float32Array(count * stride);
      for (var v = 0; v < count; v++) {
        var _offset = v * stride;
        for (var channel of channels) {
          var _values = vertex[channel.key];
          for (var e = 0; e < channel.elements; e++) vertices[_offset++] = _values[v * channel.elements + e];
        }
        vertices[_offset] = 1;
      }
      var areas = mesh.indices || [];
      var indices = new Uint32Array(areas.reduce((n, area) => {
        var _area$faces;
        return n + (((_area$faces = area.faces) === null || _area$faces === void 0 ? void 0 : _area$faces.length) || 0);
      }, 0));
      var offset = 0;
      for (var area of areas) {
        var faces = area.faces || [];
        indices.set(faces, offset);
        area.faces = indices.subarray(offset, offset + faces.length);
        offset += faces.length;
      }
      mesh._prepared = {
        channels,
        vertexCount: count,
        vertexSize: stride,
        vertices,
        indices
      };
      delete mesh.vertex;
    }
    for (var animation of json.animations || []) {
      for (var group of animation.trackGroups || []) {
        for (var track of group.transformTracks || []) {
          track.orientation = normalizeGr2Curve(track.orientation, 4);
          track.position = normalizeGr2Curve(track.position, 3);
          track.scaleShear = normalizeGr2Curve(track.scaleShear, 9);
        }
        for (var _track of group.vectorTracks || []) _track.valueCurve = normalizeGr2Curve(_track.valueCurve, _track.dimension);
      }
    }
    return json;
  }

  /** Collect unique transferable buffers, preserving aliases between typed views. */
  function gr2Transfers(value) {
    var buffers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Set();
    var seen = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();
    if (!value || typeof value !== "object" || seen.has(value)) return buffers;
    seen.add(value);
    if (ArrayBuffer.isView(value)) buffers.add(value.buffer);else if (value instanceof ArrayBuffer) buffers.add(value);else for (var child of Object.values(value)) gr2Transfers(child, buffers, seen);
    return buffers;
  }

  /** Retains float4 instance channels omitted by runtime alpha.0 JSON projection. */
  function restoreGr2VertexChannels(raw, json) {
    // Compatibility with runtime alpha.0: its JSON projector truncates
    // Position to xyz and UVs to xy. Traffic uses float4 streams; recover
    // their already-decoded floats from the same raw graph (no second read).
    for (var i = 0; i < (json.meshes || []).length; i++) {
      var _raw$fileInfo$Meshes$;
      var vertices = (_raw$fileInfo$Meshes$ = raw.fileInfo.Meshes[i].PrimaryVertexData) === null || _raw$fileInfo$Meshes$ === void 0 ? void 0 : _raw$fileInfo$Meshes$.Vertices;
      if (!(vertices !== null && vertices !== void 0 && vertices.length)) continue;
      var mesh = json.meshes[i];
      var _loop = function () {
          var _vertices$__type, _mesh$vertex$name;
          _ref2 = _slicedToArray(_ref3, 2);
          var name = _ref2[0];
          var member = _ref2[1];
          var type = (_vertices$__type = vertices.__type) === null || _vertices$__type === void 0 ? void 0 : _vertices$__type.find(x => x.name === member);
          if (!type || type.arrayWidth !== 4 || ((_mesh$vertex$name = mesh.vertex[name]) === null || _mesh$vertex$name === void 0 ? void 0 : _mesh$vertex$name.length) === vertices.length * 4) return 1; // continue
          // Granny Real32/Real16 are decoded to JS numbers by readRaw.
          if (type.type !== 10 && type.type !== 21) throw new Error("Unsupported four-component traffic channel: " + member);
          mesh.vertex[name] = vertices.flatMap(vertex => vertex[member].map(Math.fround));
          if (name === "position") mesh.vertexCount = vertices.length;
        },
        _ref2;
      for (var _ref3 of [["position", "Position"], ["texcoord0", "TextureCoordinates0"], ["texcoord1", "TextureCoordinates1"]]) {
        if (_loop()) continue;
      }
    }
  }

  self.onmessage = _ref => {
    var data = _ref.data;
    try {
      var result = prepareGr2(data.buffer, data.options);
      self.postMessage({
        id: data.id,
        result
      }, Array.from(gr2Transfers(result)));
    } catch (error) {
      self.postMessage({
        id: data.id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
    }
  };
  self.postMessage({
    ready: true
  });

})();
