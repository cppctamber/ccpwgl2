export function formatCommittedStage(details = {})
{
    const configured = details?.configuredPartCount ?? 0;
    const composition = details?.composition;

    if (!composition || !Number.isInteger(composition.contributionCount))
    {
        return `${configured} exact configured part(s) attached; ${details?.deferredContributionCount ?? 0} contribution(s) retained/deferred`;
    }

    return `${configured} exact configured part(s) attached; body diffuse applied ${composition.composedContributionCount ?? 0}/${composition.contributionCount} contribution(s); ${composition.deferredContributionCount ?? 0} retained/deferred`;
}
