// Shared behavior enums declared by Carbon's IBehavior contracts.

export const LocatorType = Object.freeze({
    LOCAL_LOCATORS: 0,
    PARENT_LOCATORS: 1,
    TARGET_LOCATORS: 2,
});

export const PlaneType = Object.freeze({
    X: 0,
    Y: 1,
    Z: 2,
});

export const ProcessPriority = Object.freeze({
    LEAST_PRIORITY: 0,
    LESS_PRIORITY: 1,
    MORE_PRIORITY: 3,
    MOST_PRIORITY: 4,
    COUNT: 5,
});

export const TunnelGroupType = Object.freeze({
    EXIT_TUNNELS: 0,
    ENTRANCE_TUNNELS: 1,
    OTHER_TUNNELS: 2,
});
