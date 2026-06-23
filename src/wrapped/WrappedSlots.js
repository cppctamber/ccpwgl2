import { Tw2EventEmitter } from "core/Tw2EventEmitter";
import { EveLocator2, EveTurretSet } from "eve/item";
import { meta, Model } from "global/meta";
import { addToArray, removeFromArray, toArray } from "utils/arr";
import { vec3 } from "math";
import { tw2 } from "global";
import { WrappedClient } from "./WrappedClient";

export class WrappedSlot extends Tw2EventEmitter
{

    name = "";

    lockParentMaterials = true;

    _materialUsage = [ -1,-1,-1,-1 ];

    set materialUsageMtl1(x)
    {
        if (this._materialUsage[0] !== x)
        {
            this._materialUsage[0] = x;
            this.UpdateFaction();
        }
    }

    get materialUsageMtl1()
    {
        return this._materialUsage[0];
    }

    set materialUsageMtl2(x)
    {
        if (this._materialUsage[1] !== x)
        {
            this._materialUsage[1] = x;
            this.UpdateFaction();
        }
    }

    get materialUsageMtl2()
    {
        return this._materialUsage[1];
    }

    set materialUsageMtl3(x)
    {
        if (this._materialUsage[2] !== x)
        {
            this._materialUsage[2] = x;
            this.UpdateFaction();
        }
    }

    get materialUsageMtl3()
    {
        return this._materialUsage[2];
    }

    set materialUsageMtl4(x)
    {
        if (this._materialUsage[3] !== x)
        {
            this._materialUsage[3] = x;
            this.UpdateFaction();
        }
    }

    get materialUsageMtl4()
    {
        return this._materialUsage[3];
    }

    constructor(parent, wrapped, locatorName, locators)
    {
        super();

        let _ = {
            resPath: "",
            promise: null,
            turretSet: null,
            target: vec3.create(),
            state: EveTurretSet.State.INACTIVE,
            locators,
            faction: parent.wrapped.dna.split(":")[1]
        };

        Reflect.defineProperty(this, "locatorName", { value: locatorName });
        Reflect.defineProperty(this, "resPath", { value: _.resPath });

        const that = this;

        /**
         * Gets the turret set
         * @returns {null|EveTurretSet}
         * @constructor
         */
        this.GetTurretSet = function ()
        {
            return _.turretSet;
        };

        /**
         * Sets the turret's target
         * @param {vec3} v
         */
        this.SetTarget = v =>
        {
            vec3.copy(_.target, v);
            if (_.turretSet) _.turretSet.SetTargetPosition(_.target);
        };

        /**
         * Updates the faction colours
         */
        this.UpdateFaction = async () =>
        {
            if (_.turretSet)
            {
                const eveSof = await WrappedClient.fetchEveSOF();
                eveSof.SetupTurretMaterial(
                    _.turretSet, parent.wrapped.dna.split(":")[1],
                    _.faction, this.lockParentMaterials ? parent.wrapped.mesh.opaqueAreas[0].effect.parameters : null,
                    this._materialUsage
                );
            }
        };

        /**
         * Sets the turret's faction
         * @param {String} faction
         * @param {Boolean} force
         * @returns {Promise<void>}
         */
        this.SetFaction = async (faction=_.faction, force) =>
        {
            if (_.faction === faction && !force) return;
            _.faction = faction;
            return this.UpdateFaction();
        };

        /**
         * Moutns a turret
         * @param {String} resPath
         * @return {Promise<Boolean>}
         */
        this.Mount = async resPath =>
        {
            if (_.resPath !== resPath)
            {
                this.Unmount();
                _.resPath = resPath;
                _.promise = await tw2.Fetch(resPath)
                    .then(obj =>
                    {
                        if (_.resPath === resPath)
                        {
                            _.turretSet = obj;
                            _.turretSet.locatorName = locatorName;
                            //console.log("Mounted...");
                            that.Rebuild();
                        }
                    })
                    .catch(err => 
                    {
                        console.log("Mount error...");
                        that.Rebuild();
                    });
            }

            return _.promise;
        };

        /**
         * Unmounts the turret
         */
        this.Unmount = () =>
        {
            if (_.turretSet)
            {
                let array = wrapped.attachments || wrapped.turretSets;
                array.splice(array.indexOf(_.turretSet), 1);
            }
            _.resPath = "";
            _.promise = null;
            _.turretSet = null;
            //console.log("Unmounted...");
        };

        /**
         * State handler
         * @param {Number} state
         */
        function setState(state)
        {
            _.state = state;

            if (!_.turretSet) return;

            switch (state)
            {
                case EveTurretSet.State.FIRING:
                    _.turretSet.EnterStateFiring();
                    break;

                case EveTurretSet.State.IDLE:
                    _.turretSet.EnterStateIdle();
                    break;

                case EveTurretSet.State.INACTIVE:
                    _.turretSet.EnterStateDeactive();
                    break;
            }

            console.log("Set state");
        }

        /**
         * Fires the turret
         */
        this.Fire = () =>
        {
            setState(EveTurretSet.State.FIRING);
        };

        /**
         * Sets the turret to idle
         */
        this.Idle = () =>
        {
            setState(EveTurretSet.State.IDLE);
        };

        /**
         * Sets the turret to pack
         */
        this.Deactivate = () =>
        {
            setState(EveTurretSet.State.INACTIVE);
        };

        /**
         * Rebuilds the turret
         * @param {Array<EveLocator2>} [newLocators]
         */
        this.Rebuild = newLocators =>
        {
            if (newLocators) _.locators = newLocators;
            if (_.turretSet)
            {
                let array = wrapped.attachments || wrapped.turretSets;
                if (!array.includes(_.turretSet))
                {
                    array.push(_.turretSet);
                    //console.log("Added to array");
                }

                _.turretSet.UpdateItemsFromLocators(_.locators);
                //console.log("Updated items");

                _.turretSet.SetTargetPosition(_.target);
                //console.log("Set target position");

                this.UpdateFaction();
                //this.SetFaction(parent.wrapped.dna.split(":")[1], true);
                //setState(_.state);
            }
        };

    }

    /**
     * Rebuilds locator slots
     * @param parent
     * @param wrappedObjects
     * @param type
     * @param targetArray
     * @return {Promise<Array>}
     */
    static async RebuildLocatorSlots(parent, wrappedObjects, type, targetArray)
    {
        const
            re = RegExp(String.raw`^(locator_${type})_([0-9]+)([a-z]+)`, "i"),
            slots = [];

        toArray(wrappedObjects)
            .forEach(wrapped =>
            {
                wrapped.locators.forEach(locator =>
                {
                    var match = re.exec(locator.name);
                    if (!match) return;

                    const
                        index = parseInt(match[2], 10),
                        name = match[1] + "_" + index;

                    let found = slots.find(x => x.name === name);

                    if (!found)
                    {
                        found = {
                            name,
                            index,
                            locators: [],
                            parent,
                            wrapped,
                        };
                        slots.push(found);
                    }

                    // Add new locator
                    addToArray(found.locators, locator);
                });
            });

        // Can't gaurantee locators are ordered
        slots.sort((a, b) => a.index - b.index);

        let notFound = Array.from(targetArray);

        for (let i = 0; i < slots.length; i++)
        {
            let found = targetArray.find(x => x.locatorName === slots[i].name);
            if (found)
            {
                notFound.splice(notFound.indexOf(found), 1);
                found.Rebuild(slots[i].locators);
            }
            else
            {
                const turret = new this(parent, slots[i].wrapped, slots[i].name, slots[i].locators);
                targetArray.push(turret);
            }
        }

        // Remove anything not found
        notFound.forEach(turret =>
        {
            turret.Unmount();
            removeFromArray(targetArray, turret);
        });

        return targetArray.sort((a, b) => a.locatorName - b.locatorName);
    }
}
