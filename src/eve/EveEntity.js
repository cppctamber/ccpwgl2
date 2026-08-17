// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/EveEntity.h
//   trinity/trinity/Eve/EveEntity.cpp
import { meta } from "utils";

/**
 * Base for Eve objects that publish themselves to a scene's component registry,
 * tracking which registry they belong to and the slot index the registry
 * assigned for each component type.
 */
@meta.type("EveEntity")
@meta.ccp.define("EveEntity")
export class EveEntity extends meta.Model
{

    _componentIndexLookup = new Map();

    // Carbon keeps m_registry/m_indexInRegistry PRIVATE (EveEntity.h:57-61) -
    // they are runtime registration state, never Blue-exposed. Schema typing
    // removed 2026-07-23: exporting them via GetValues leaked indexInRegistry
    // into values interchange and poisoned re-registration of hydrated
    // entities (Register() refuses when indexInRegistry !== -1).

    /** m_registry (EveComponentRegistry*) - runtime-only. */
    registry = null;

    /** m_indexInRegistry (size_t) - runtime-only. */
    indexInRegistry = -1;

    /** Whether this entity currently belongs to a component registry. */
    IsInRegistry()
    {
        return this.registry !== null;
    }

    /**
     * Joins a component registry, leaving the previous one first, then lets the
     * subclass publish the components it owns through RegisterComponents. Passing
     * nothing only leaves the current registry; re-registering with the same
     * registry is a no-op.
     */
    Register(registry)
    {
        if (this.registry === registry)
        {
            return;
        }
        if (this.registry)
        {
            this.UnRegister(this.registry);
        }
        if (!registry)
        {
            return;
        }
        registry.Register(this);
        this.RegisterComponents();
    }

    /**
     * Leaves the given registry, dropping every component it holds for this
     * entity, but only when it is the registry this entity is actually in.
     */
    UnRegister(registry)
    {
        if (!registry || this.registry !== registry)
        {
            return;
        }
        registry.UnRegisterAllComponents(this);
        this.UnRegisterComponents();
        registry.UnRegister(this);
    }

    /**
     * Asks the current registry to re-evaluate this entity's component
     * registrations, for use after state that gates them changes.
     */
    ReRegister()
    {
        this.registry?.ReRegister(this);
    }

    /**
     * The registry this entity belongs to, or null; subclasses read it in
     * RegisterComponents to decide what to publish.
     */
    GetComponentRegistry()
    {
        return this.registry;
    }

    /**
     * The registry slot index recorded for a component bit, or undefined when this
     * entity has no component of that type.
     */
    GetComponentIndex(componentBit)
    {
        return this._componentIndexLookup.get(componentBit);
    }

    /**
     * Records the slot index a registry assigned for a component bit; called by
     * the registry, not by entities.
     */
    SetComponentState(componentBit, index)
    {
        this._componentIndexLookup.set(componentBit, index);
    }

    /**
     * Drops the recorded slot index for a component bit; called by the registry
     * when that component is released.
     */
    RemoveComponentState(componentBit)
    {
        this._componentIndexLookup.delete(componentBit);
    }

    /** Drops every recorded component slot index without touching the registry. */
    ClearComponentState()
    {
        this._componentIndexLookup.clear();
    }

    /**
     * Override point where a subclass publishes the components it owns; called
     * after joining a registry, and again on ReRegister.
     */
    RegisterComponents()
    {
    }

    /**
     * Override point where a subclass releases components it published itself;
     * called while leaving a registry, after the registry has dropped its own
     * records.
     */
    UnRegisterComponents()
    {
    }

}
