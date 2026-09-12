// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/EveKDdroneManagementTree.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/EveKDdroneManagementTree.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { PlaneType } from "./enums";
import { vec3 } from "math";

/** A spatial index that builds and incrementally rebalances a k-d tree over a group's drone agents and answers nearest-neighbour and multi-radius range queries against it. */

@meta.define("EveKDdroneManagementTree", true)
export class EveKDdroneManagementTree extends meta.Model
{

    /** m_tree (AgentRef) */
    @meta.struct("Agent")
    tree = null;

    /** m_debugSquareSize (float) */
    @meta.float
    debugSquareSize = 0;

    /** m_updateTimeCounter (float) */
    @meta.float
    updateTimeCounter = 0;

    /** m_maxFoundPerAgent (size_t) */
    @meta.uint
    maxFoundPerAgent = 5;

    /** m_timeBetweenUpdate (float) */
    @meta.float
    timeBetweenUpdate = 1;

    /** m_agentRefs (std::vector<AgentRef>) */
    @meta.list("Agent")
    agentRefs = [];

    /** m_groupSearchReturnInfoBlock (std::vector<std::vector<std::vector<DroneAgent*>>>) */
    @meta.list("std::vector<std::vector<DroneAgent>>")
    groupSearchReturnInfoBlock = [];

    /** agents (std::vector<DroneAgent> &) */
    @meta.list("DroneAgent")
    agents = [];

    /** behaviorNbr (int) */
    @meta.int32
    behaviorNbr = 0;

    /** radius (float) */
    @meta.float
    radius = 0;

    /** agent (DroneAgent*) */
    @meta.struct("DroneAgent")
    agent = null;

    /** rangeBetween (float) */
    @meta.float
    rangeBetween = 0;

    /** planeType (PlaneType - enum PlaneType) */
    @meta.int32
    planeType = 0;

    /** b (int) */
    @meta.int32
    b = 0;

    /** e (int) */
    @meta.int32
    e = 0;

    /** left (AgentRef*) */
    @meta.struct("Agent")
    left = null;

    /** right (AgentRef*) */
    @meta.struct("Agent")
    right = null;

    // Reused SearchRange records ({behaviorNbr, radius}) - rebuilt each
    // FindDronesInRange call without reallocating the array shell.
    _searchRanges = [];

    // Carbon threads activeRange as an int& through the recursive search; the
    // JS port carries it as instance state reset per agent.
    _activeRange = 0;

    /**
      * Builds the k-d tree over the agents and sizes the per-behavior search
      * result block (Carbon EveKDdroneManagementTree::CreateTree, cpp:18-42).
      * @param {Array} agents - DroneAgent records
      * @param {Number} numberOfBehaviors
      */
    // Browser adaptation: Carbon copies the root AgentRef by value into m_tree; the JS port keeps a reference into agentRefs (same fields, shared identity).
    CreateTree(agents, numberOfBehaviors)
    {
        if (!agents || agents.length === 0)
        {
            return;
        }

        this._ChangeAgentsIntoAgentRefs(agents);
        this.tree = this._SplitSort(0, agents.length - 1, EveKDdroneManagementTree.PlaneType.Z);

        const infoBlock = this.groupSearchReturnInfoBlock;
        infoBlock.length = 0;
        for (let j = 0; j < numberOfBehaviors; j++)
        {
            const perAgentData = [];
            for (let i = 0; i < agents.length; i++)
            {
                perAgentData.push([]);
            }
            infoBlock.push(perAgentData);
        }
    }

    /**
      * Throttled incremental rebalance: every timeBetweenUpdate seconds each node
      * is checked against its children and locally re-sorted when the splitting
      * invariant broke (Carbon UpdateTree, cpp:44-55).
      * @param {Number} dt - delta time in seconds
      */
    UpdateTree(dt)
    {
        if (this.timeBetweenUpdate !== -1 && this.updateTimeCounter >= this.timeBetweenUpdate)
        {
            this.updateTimeCounter = 0;
            this.tree = this._CompareNodeToChildren(this.tree);
        }
        else
        {
            this.updateTimeCounter += dt;
        }
    }

    /**
      * Standard nearest-neighbour tree search for callers outside the behavior
      * group (Carbon FindClosestAgent, cpp:276-289).
      * @param {Float32Array} pos
      * @returns {Object|null} the closest DroneAgent record
      */
    FindClosestAgent(pos)
    {
        if (!this.tree || !this.tree.agent)
        {
            return null;
        }

        const closest = {
            agent: this.tree.agent,
            rangeBetween: vec3.distance(this.tree.agent.position, pos)
        };
        this._FindClosestAgentRecursive(pos, this.tree, closest);
        return closest.agent;
    }

    /**
      * Batched range search for every agent against every behavior's search
      * radius at once (Carbon FindDronesInRange, cpp:374-430). The result is
      * indexed [behaviorIndex][agentIndex] -> agents in range (up to
      * maxFoundPerAgent per Carbon's early-out bookkeeping).
      * @param {Array} agents - DroneAgent records
      * @param {Array<Number>} ranges - per-behavior search radii (-1 = don't care)
      * @param {Number} behaviorGroupBoundingSphereRadius
      * @returns {Array} groupSearchReturnInfoBlock
      */
    FindDronesInRange(agents, ranges, behaviorGroupBoundingSphereRadius)
    {
        const searchRanges = this._searchRanges;
        searchRanges.length = 0;
        for (let behaviorNumber = 0; behaviorNumber < ranges.length; behaviorNumber++)
        {
            const radius = ranges[behaviorNumber];
            searchRanges.push({
                behaviorNbr: behaviorNumber,
                radius: radius === -1 ? -1 : radius + behaviorGroupBoundingSphereRadius
            });
        }
        searchRanges.sort(EveKDdroneManagementTree._CompareSearchRanges);

        const infoBlock = this.groupSearchReturnInfoBlock;
        if (infoBlock.length)
        {
            for (let j = 0; j < ranges.length && j < infoBlock.length; j++)
            {
                for (let i = 0; i < agents.length && i < infoBlock[j].length; i++)
                {
                    infoBlock[j][i].length = 0;
                }
            }
        }

        if (searchRanges.length === 0)
        {
            return infoBlock;
        }
        if (searchRanges[0].radius === -1)
        {
            return infoBlock;
        }

        this._SearchThroughTree(infoBlock, this.tree, agents, searchRanges);

        return infoBlock;
    }

    /**
      * Carbon SearchThroughTree (cpp:432-441): the per-agent driver - reset the
      * active range for each agent and run the recursive helper with the
      * agent's running index into the neighbour buckets.
      */
    _SearchThroughTree(infoBlock, node, agents, searchRanges)
    {
        for (let c = 0; c < agents.length; c++)
        {
            this._activeRange = 0;
            this._SearchThroughTreeHelperFunction(infoBlock, node, agents[c], searchRanges, c);
        }
    }

    // Rebuilds the AgentRef shells over the live agents (Carbon
    // ChangeAgentsIntoAgentRefs, cpp:232-242).
    /**
      * Rebuilds the node shells, with default plane, bounds and null children, over the current live agents.
      */
    _ChangeAgentsIntoAgentRefs(agents)
    {
        const refs = this.agentRefs;
        refs.length = 0;
        for (const agent of agents)
        {
            refs.push({
                agent,
                planeType: EveKDdroneManagementTree.PlaneType.X,
                b: 0,
                e: 0,
                left: null,
                right: null
            });
        }
    }

    // Recursive median split over agentRefs[b..e] (Carbon SplitSort,
    // cpp:202-230).
    /**
      * Recursively median-splits a range of agent references along an axis, building the tree node by node and cycling the split axis at each level.
      */
    _SplitSort(b, e, planeType)
    {
        const refs = this.agentRefs;
        if (b === e)
        {
            refs[b].b = b;
            refs[b].e = e;
            refs[b].left = null;
            refs[b].right = null;
            return refs[b];
        }

        if (b > e)
        {
            return null;
        }

        this._SortByAxis(refs, b, e + 1, planeType);

        const m = b + ((e - b) >> 1);
        refs[m].b = b;
        refs[m].e = e;

        const nextPlane = EveKDdroneManagementTree._FindNextSplitAxis(planeType);
        refs[m].left = this._SplitSort(b, m - 1, nextPlane);
        refs[m].right = this._SplitSort(m + 1, e, nextPlane);

        return refs[m];
    }

    // Stamps planeType on the range then sorts it by that axis (Carbon
    // SortByAxis, cpp:261-271); the temporary subrange copy replaces
    // std::sort's in-place range sort and only allocates on the throttled
    // rebuild path.
    /**
      * Stamps the given split plane on a subrange of agent references and sorts that subrange along that axis.
      */
    _SortByAxis(refs, b, endExclusive, planeType)
    {
        for (let i = b; i < endExclusive; i++)
        {
            refs[i].planeType = planeType;
        }

        const range = refs.slice(b, endExclusive);
        range.sort((lhs, rhs) => lhs.agent.position[planeType] - rhs.agent.position[planeType]);
        for (let i = 0; i < range.length; i++)
        {
            refs[b + i] = range[i];
        }
    }

    // Checks each split invariant and locally re-sorts broken subtrees (Carbon
    // CompareNodeToChildren, cpp:58-110; the three per-axis cases collapse to
    // one indexed body on the shared vec3 layout).
    /**
      * Recursively checks a node's split invariant against its children and re-splits that subtree from scratch when it no longer holds.
      */
    _CompareNodeToChildren(node)
    {
        if (node === null)
        {
            return null;
        }

        if (node.left === null && node.right === null)
        {
            return node;
        }

        const axis = node.planeType;
        if (this._IsBiggestOnAxis(node.left, node.agent.position[axis], axis) &&
            this._IsSmallestOnAxis(node.right, node.agent.position[axis], axis))
        {
            node.left = this._CompareNodeToChildren(node.left);
            node.right = this._CompareNodeToChildren(node.right);
            return node;
        }
        return this._SplitSort(node.b, node.e, axis);
    }

    // Carbon IsBiggestOnAxis (cpp:112-154): on the node's own split axis only
    // the bigger side needs checking; on other axes both sides do.
    /**
      * Whether a node and its relevant subtree all sit at or below a coordinate on an axis.
      */
    _IsBiggestOnAxis(node, n, planeType)
    {
        if (node === null)
        {
            return true;
        }

        const axis = node.planeType;
        if (planeType === axis)
        {
            return n >= node.agent.position[axis] && this._IsBiggestOnAxis(node.right, n, axis);
        }
        return n >= node.agent.position[axis] &&
            this._IsBiggestOnAxis(node.left, n, axis) &&
            this._IsBiggestOnAxis(node.right, n, axis);
    }

    // Carbon IsSmallestOnAxis (cpp:157-199): mirror of IsBiggestOnAxis.
    /**
      * Whether a node and its relevant subtree all sit at or above a coordinate on an axis.
      */
    _IsSmallestOnAxis(node, n, planeType)
    {
        if (node === null)
        {
            return true;
        }

        const axis = node.planeType;
        if (planeType === axis)
        {
            return n <= node.agent.position[axis] && this._IsSmallestOnAxis(node.left, n, axis);
        }
        return n <= node.agent.position[axis] &&
            this._IsSmallestOnAxis(node.left, n, axis) &&
            this._IsSmallestOnAxis(node.right, n, axis);
    }

    // Carbon FindClosestAgentRecursive (cpp:291-371): digs through the tree,
    // pruning half-spaces the best-so-far sphere cannot reach.
    /**
      * Recursively searches for the agent closest to a position, pruning subtrees that cannot beat the current best distance.
      */
    _FindClosestAgentRecursive(pos, node, closest)
    {
        if (node === null)
        {
            return;
        }

        const distToPoint = vec3.distance(node.agent.position, pos);
        if (closest.rangeBetween > distToPoint)
        {
            closest.rangeBetween = distToPoint;
            closest.agent = node.agent;
        }

        const axis = node.planeType;
        if (node.agent.position[axis] < pos[axis])
        {
            this._FindClosestAgentRecursive(pos, node.right, closest);
            if (node.agent.position[axis] + closest.rangeBetween > pos[axis])
            {
                this._FindClosestAgentRecursive(pos, node.left, closest);
            }
        }
        else
        {
            this._FindClosestAgentRecursive(pos, node.left, closest);
            if (node.agent.position[axis] - closest.rangeBetween < pos[axis])
            {
                this._FindClosestAgentRecursive(pos, node.right, closest);
            }
        }
    }

    // Per-agent range search body (Carbon SearchThroughTreeHelperFunction,
    // cpp:443-517), kept bug-compatible: a found agent is appended once, then
    // once or twice more depending on the fill state, and activeRange advances
    // when the widest range saturates.
    /**
      * Recursively collects one agent's neighbours into the per-behaviour result lists for each configured radius, narrowing the active range as the widest one fills.
      */
    _SearchThroughTreeHelperFunction(closeAgents, node, agent, ranges, c)
    {
        if (node === null)
        {
            return;
        }

        if (this._activeRange > ranges.length - 1)
        {
            return;
        }

        if (ranges[this._activeRange].radius === -1)
        {
            return;
        }

        const dist = vec3.squaredDistance(node.agent.position, agent.position);
        const range = ranges[this._activeRange].radius;

        if (dist < range * range)
        {
            EveKDdroneManagementTree._AddAgentToSearchLists(closeAgents, node, dist, ranges, this._activeRange, c);

            const found = closeAgents[ranges[this._activeRange].behaviorNbr][c].length;
            if (found < this.maxFoundPerAgent)
            {
                EveKDdroneManagementTree._AddAgentToSearchLists(closeAgents, node, dist, ranges, this._activeRange, c);
            }
            else if (found === this.maxFoundPerAgent)
            {
                EveKDdroneManagementTree._AddAgentToSearchLists(closeAgents, node, dist, ranges, this._activeRange, c);
                this._activeRange++;
            }
        }

        const axis = node.planeType;
        const delta = node.agent.position[axis] - agent.position[axis];
        if (delta <= range)
        {
            this._SearchThroughTreeHelperFunction(closeAgents, node.right, agent, ranges, c);
        }
        if (delta >= range)
        {
            this._SearchThroughTreeHelperFunction(closeAgents, node.left, agent, ranges, c);
        }
    }

    // Descending-radius ordering (Carbon compareRef for SearchRange, h:81-84).
    /**
      * Orders search ranges by descending radius.
      */
    static _CompareSearchRanges(lhs, rhs)
    {
        return rhs.radius - lhs.radius;
    }

    // Carbon AddAgentToSearchLists (cpp:519-532): the ranges are sorted
    // descending, so appending stops at the first range the agent falls out of.
    /**
      * Appends a found neighbour to every behaviour's result list whose radius it still falls within, stopping at the first it falls outside.
      */
    static _AddAgentToSearchLists(closeAgents, node, dist, ranges, activeRange, agentNbr)
    {
        for (let i = activeRange; i < ranges.length; i++)
        {
            if (dist < ranges[i].radius * ranges[i].radius)
            {
                closeAgents[ranges[i].behaviorNbr][agentNbr].push(node.agent);
            }
            else
            {
                break;
            }
        }
    }

    // X -> Y -> Z -> X (Carbon FindNextSplitAxis, cpp:244-259).
    /**
      * Cycles the split axis in the order X, Y, Z and back to X.
      */
    static _FindNextSplitAxis(planeType)
    {
        switch (planeType)
        {
            case EveKDdroneManagementTree.PlaneType.X:
                return EveKDdroneManagementTree.PlaneType.Y;
            case EveKDdroneManagementTree.PlaneType.Y:
                return EveKDdroneManagementTree.PlaneType.Z;
            default:
                return EveKDdroneManagementTree.PlaneType.X;
        }
    }

    static PlaneType = PlaneType;

}
