export function formatCommittedStage(details = {})
{
    const configured = details?.configuredPartCount ?? 0;
    const composition = details?.composition;

    if (!composition || !Number.isInteger(composition.contributionCount))
    {
        return `${configured} exact configured part(s) attached; ${details?.deferredContributionCount ?? 0} contribution(s) retained/deferred`;
    }

    const applicable = composition.applicableContributionCount
        ?? composition.contributionCount;
    const notApplicable = composition.notApplicableContributionCount ?? 0;
    return `${configured} exact configured part(s) attached; body diffuse applied ${composition.composedContributionCount ?? 0}/${applicable} applicable contribution(s); ${composition.deferredContributionCount ?? 0} retained/deferred; ${notApplicable} retained for other channels`;
}
