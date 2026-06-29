import { meta } from "utils";
import { Tr2CurveKey } from "./Tr2CurveKeys";


const Tw2EventCurveExtrapolation = {
    NONE: 0,
    CYCLE: 1
};


@meta.define({
    wgl: "Tw2EventKey",
    ccp: "TriEventKey"
})
export class Tw2EventKey extends Tr2CurveKey
{
    @meta.string
    value = "";

    callable = null;
    callableArgs = null;

    constructor(options)
    {
        super();
        if (options) this.SetValues(options);
    }

    SetValues(options, opt)
    {
        const { callable, callableArgs, ...values } = options || {};
        if (values.value === null || values.value === undefined) values.value = "";

        super.SetValues(values, opt);

        if (options && "callable" in options) this.callable = callable;
        if (options && "callableArgs" in options) this.callableArgs = callableArgs;
        return this;
    }

    ToDefinition()
    {
        return {
            time: this.time,
            value: this.value
        };
    }
}


@meta.define({
    wgl: "Tw2EventCurve",
    ccp: "TriEventCurve"
})
export class Tw2EventCurve extends meta.Model
{
    @meta.string
    name = "";

    @meta.float
    length = 0;

    @meta.float
    time = 0;

    @meta.float
    localTime = 0;

    @meta.string
    value = "";

    @meta.uint
    extrapolation = 0;

    @meta.list("Tw2EventKey", "TriEventKey")
    keys = [];

    @meta.struct()
    eventListener = null;

    _currentKeyIndex = 0;

    Initialize()
    {
        this.Sort();
        return true;
    }

    UpdateValue(time)
    {
        if (this.length === 0)
        {
            return;
        }

        const before = this.time;
        this.time = time;
        const rewound = this.time < before;

        if (this.extrapolation === Tw2EventCurveExtrapolation.CYCLE || this.extrapolation === "cycle")
        {
            const localNow = PositiveModulo(this.time, this.length);
            if (rewound || localNow < this.localTime)
            {
                this._currentKeyIndex = 0;
            }
            this.localTime = localNow;
        }
        else
        {
            if (rewound)
            {
                this._currentKeyIndex = 0;
            }
            this.localTime = this.time;
        }

        while (this._currentKeyIndex < this.keys.length && this.localTime >= this.keys[this._currentKeyIndex].time)
        {
            this.FireKey(this.keys[this._currentKeyIndex]);
            this._currentKeyIndex++;
        }
    }

    Update(time)
    {
        this.UpdateValue(time);
        return this.value;
    }

    GetLength()
    {
        return this.length;
    }

    Length()
    {
        return this.length;
    }

    Sort()
    {
        this.keys = this.keys
            .map((key, index) => ({ key: key instanceof Tw2EventKey ? key : new Tw2EventKey(key), index }))
            .sort((a, b) => Tw2EventKey.Compare(a.key, b.key) || a.index - b.index)
            .map(entry => entry.key);
        this._currentKeyIndex = 0;
        this.length = this.keys.length ? this.keys[this.keys.length - 1].time : 0;
        return this;
    }

    AddKey(time, eventName)
    {
        const key = new Tw2EventKey({
            time,
            value: eventName
        });
        this.InsertKey(key);
        return key;
    }

    AddCallableKey(time, callable, args)
    {
        const key = new Tw2EventKey({
            time,
            callable,
            callableArgs: Array.isArray(args) ? args : args === undefined ? [] : [ args ]
        });
        this.InsertKey(key);
        return key;
    }

    InsertKey(key)
    {
        this.keys.push(key instanceof Tw2EventKey ? key : new Tw2EventKey(key));
        this.Sort();
    }

    RemoveKey(index)
    {
        if (index >= 0 && index < this.keys.length)
        {
            this.keys.splice(index, 1);
            this.Sort();
        }
    }

    GetKeyCount()
    {
        return this.keys.length;
    }

    GetKeyTime(index)
    {
        return this.keys[index] ? this.keys[index].time : 0;
    }

    GetKeyValue(index)
    {
        return this.keys[index] ? this.keys[index].value : "";
    }

    SetKeyTime(index, time)
    {
        if (this.keys[index])
        {
            this.keys[index].time = time;
            this.Sort();
        }
    }

    SetKeyValue(index, value)
    {
        if (this.keys[index])
        {
            this.keys[index].value = value || "";
        }
    }

    GetCallableKeyValue(index)
    {
        return this.keys[index] ? this.keys[index].callable : null;
    }

    GetCallableKeyArgs(index)
    {
        return this.keys[index] ? this.keys[index].callableArgs : null;
    }

    FireKey(key)
    {
        this.value = key.value || "";

        if (typeof key.callable === "function")
        {
            const args = Array.isArray(key.callableArgs) ? key.callableArgs : key.callableArgs === undefined || key.callableArgs === null ? [] : [ key.callableArgs ];
            key.callable(...args);
            return;
        }

        if (this.eventListener && this.value)
        {
            if (typeof this.eventListener.HandleEvent === "function")
            {
                this.eventListener.HandleEvent(this.value);
            }
            else if (typeof this.eventListener.handleEvent === "function")
            {
                this.eventListener.handleEvent(this.value);
            }
            else if (typeof this.eventListener.OnEvent === "function")
            {
                this.eventListener.OnEvent(this.value);
            }
            else if (typeof this.eventListener === "function")
            {
                this.eventListener(this.value);
            }
        }
    }

}

export { Tw2EventKey as TriEventKey, Tw2EventCurve as TriEventCurve };

function PositiveModulo(value, length)
{
    const result = value % length;
    return result < 0 ? result + length : result;
}
