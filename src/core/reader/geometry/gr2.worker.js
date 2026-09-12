import { prepareGr2, gr2Transfers } from "./Gr2Preparation";

self.onmessage = ({ data }) =>
{
    try
    {
        const result = prepareGr2(data.buffer, data.options);
        self.postMessage({ id: data.id, result }, Array.from(gr2Transfers(result)));
    }
    catch (error)
    {
        self.postMessage({ id: data.id, error: { name: error.name, message: error.message, stack: error.stack } });
    }
};
self.postMessage({ ready: true });
