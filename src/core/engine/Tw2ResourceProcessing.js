/** Schedules cooperative resource work on the rendering thread. */
export class Tw2ResourceProcessing
{
    jobs = new Map();
    ready = [];
    head = 0;
    polling = new Set();

    get size() { return this.jobs.size; }

    Queue(resource, data, options)
    {
        this.Cancel(resource);
        // A new build invalidates readiness even when it reuses loaded data.
        resource.OnProcessing?.();
        const job = { resource, data, options, iterator: null, waiting: null, value: undefined };
        this.jobs.set(resource, job);
        this.ready.push(job);
    }

    Cancel(resource, error)
    {
        const job = this.jobs.get(resource);
        if (!job) return;
        this.jobs.delete(resource);
        this.polling.delete(job);
        try { job.waiting?.cancel?.(); }
        finally
        {
            job.iterator?.return?.();
            job.data = job.options = job.value = job.iterator = job.waiting = null;
            resource.OnProcessingCancelled?.(error);
        }
    }

    Clear()
    {
        for (const resource of this.jobs.keys()) this.Cancel(resource);
        this.ready.length = this.head = 0;
    }

    /** A step yields nothing to continue later, or a promise to wait without polling. */
    Pump(now, budgetMs)
    {
        const start = now();
        // Poll only jobs parked before this tick. A false result never re-enters
        // the runnable queue and therefore cannot spin within the same frame.
        for (const job of this.polling)
        {
            try
            {
                if (!job.waiting.poll()) continue;
                this.polling.delete(job);
                job.waiting = null;
                this.ready.push(job);
            }
            catch (error) { this.Fail(job, error); }
        }
        let steps = 0;
        while (this.head < this.ready.length && (!steps || now() - start < budgetMs))
        {
            const job = this.ready[this.head];
            this.ready[this.head++] = null;
            const resource = job.resource;
            if (this.jobs.get(resource) !== job) continue;
            steps++;
            try
            {
                if (!job.iterator)
                {
                    job.iterator = resource.Process(job.data, job.options);
                    job.data = job.options = null;
                }
                const result = job.iterator.next(job.value);
                job.value = undefined;
                if (this.jobs.get(resource) !== job) continue;
                if (result.done)
                {
                    this.jobs.delete(resource);
                    try { resource.OnPrepared(); }
                    catch (error) { resource.OnError(error); }
                }
                else if (result.value && typeof result.value.poll === "function")
                {
                    job.waiting = result.value;
                    this.polling.add(job);
                }
                else if (result.value && typeof result.value.then === "function")
                {
                    job.waiting = result.value;
                    Promise.resolve(result.value).then(value =>
                    {
                        if (this.jobs.get(resource) !== job) return;
                        job.waiting = null;
                        job.value = value;
                        this.ready.push(job);
                    }, error => this.Fail(job, error));
                }
                else
                {
                    this.ready.push(job);
                }
            }
            catch (error) { this.Fail(job, error); }
        }
        if (this.head === this.ready.length || this.head > 256)
        {
            this.ready = this.ready.slice(this.head);
            this.head = 0;
        }
    }

    Fail(job, error)
    {
        if (this.jobs.get(job.resource) !== job) return;
        this.Cancel(job.resource, error);
        job.resource.OnError(error);
    }
}
