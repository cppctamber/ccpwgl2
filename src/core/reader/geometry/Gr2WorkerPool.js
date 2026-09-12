import { prepareGr2 } from "./Gr2Preparation";

const script = typeof document !== "undefined" ? document.currentScript?.src : null;
const defaultUrl = script ? new URL("ccpwgl2_gr2.worker.js", script).href : null;

/** Two lazy workers; no decoded-result cache or resource references. */
export class Gr2WorkerPool
{
    workers = [];
    queue = [];
    serial = 0;
    failed = false;

    Decode(buffer, options, url = defaultUrl)
    {
        if (!url || typeof Worker === "undefined" || this.failed) return Promise.resolve().then(() => prepareGr2(buffer, options));
        let job;
        const promise = new Promise((resolve, reject) =>
        {
            job = { id: ++this.serial, buffer, options, resolve, reject };
            this.queue.push(job);
            this.Pump(url);
        });
        promise.cancel = () =>
        {
            const index = this.queue.indexOf(job);
            if (index !== -1) this.queue.splice(index, 1);
            else
            {
                const slot = this.workers.find(item => item.job === job);
                if (!slot) return;
                clearTimeout(slot.timer);
                slot.worker.terminate();
                this.workers.splice(this.workers.indexOf(slot), 1);
            }
            job.buffer = null;
            job.reject(new Error("GR2 decode cancelled"));
            this.Pump(url);
        };
        return promise;
    }

    Pump(url)
    {
        while (!this.failed && this.workers.length < 2 && this.workers.length < this.queue.length + this.workers.filter(slot => slot.job).length)
        {
            let worker;
            try { worker = new Worker(url); }
            catch (error) { this.Fail(error); break; }
            const slot = { worker, ready: false, job: null, timer: null };
            this.workers.push(slot);
            slot.timer = setTimeout(() => this.Fail(new Error("GR2 worker startup timed out")), 10000);
            worker.onerror = event => this.Fail(new Error(event.message || "GR2 worker failed"));
            worker.onmessageerror = () => this.Fail(new Error("GR2 worker message failed"));
            worker.onmessage = ({ data }) =>
            {
                if (data.ready)
                {
                    clearTimeout(slot.timer);
                    slot.ready = true;
                }
                else if (slot.job && data.id === slot.job.id)
                {
                    clearTimeout(slot.timer);
                    const job = slot.job;
                    slot.job = null;
                    if (data.error) job.reject(Object.assign(new Error(data.error.message), data.error));
                    else job.resolve(data.result);
                }
                this.Pump(url);
            };
        }
        for (const slot of this.workers)
        {
            if (!slot.ready || slot.job || !this.queue.length) continue;
            const job = this.queue.shift();
            slot.job = job;
            try
            {
                slot.worker.postMessage({ id: job.id, buffer: job.buffer, options: job.options }, [ job.buffer ]);
                // The worker owns the bytes now. Do not retain even the detached wrapper.
                job.buffer = null;
                slot.timer = setTimeout(() => this.Fail(new Error("GR2 worker decode timed out")), 180000);
            }
            catch (error)
            {
                slot.job = null;
                job.reject(error);
                Promise.resolve().then(() => this.Pump(url));
            }
        }
    }

    Fail(error)
    {
        this.failed = true;
        for (const slot of this.workers)
        {
            clearTimeout(slot.timer);
            slot.worker.terminate();
            if (slot.job) slot.job.reject(error);
        }
        this.workers.length = 0;
        // Startup failures leave queued input buffers intact, so fallback is safe.
        for (const job of this.queue.splice(0)) Promise.resolve().then(() => prepareGr2(job.buffer, job.options)).then(job.resolve, job.reject);
    }
}

export const gr2WorkerPool = new Gr2WorkerPool();
