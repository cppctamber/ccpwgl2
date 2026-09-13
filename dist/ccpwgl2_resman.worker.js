(function () {
    'use strict';

    /**
     * Data-only worker body for resource fetches.
     *
     * Self-contained on purpose - no imports, no closures - because it runs two
     * ways: bundled as `dist/ccpwgl2_resman.worker.js` (see resman.worker.js), and
     * serialised with `toString()` into a blob worker when that file is missing.
     */
    function Tw2ResourceLoaderWorker() {
      self.onmessage = function (event) {
        var data = event.data;
        fetch(data.url, data.fetchOptions).then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              var statusText = response.statusText;
              var json = null;
              try {
                json = JSON.parse(text);
                statusText = json.message || json.msg || json.error || json.err || statusText;
              } catch (err) {
                statusText = statusText || "Failed to fetch resource";
              }
              throw {
                name: "ErrHTTPStatus",
                message: statusText,
                status: response.status,
                statusText,
                json
              };
            });
          }
          switch (data.responseType) {
            case "arraybuffer":
              return response.arrayBuffer();
            case "text":
              return response.text();
            case "json":
              return response.json();
            case "blob":
              return response.blob();
            default:
              throw {
                name: "ErrResourceLoaderType",
                message: "Invalid fetch type: " + data.responseType
              };
          }
        }).then(function (result) {
          var transfer = result instanceof ArrayBuffer ? [result] : [];
          self.postMessage({
            id: data.id,
            ok: true,
            result
          }, transfer);
        }).catch(function (err) {
          self.postMessage({
            id: data.id,
            ok: false,
            error: {
              name: err && err.name || "WorkerResourceLoadError",
              message: err && err.message || String(err),
              status: err && err.status,
              statusText: err && err.statusText,
              json: err && err.json
            }
          });
        });
      };
    }

    // Entry for dist/ccpwgl2_resman.worker.js - the resource manager's fetch worker.
    Tw2ResourceLoaderWorker();

})();
