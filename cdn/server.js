const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

/**
 * Gets terminal arguments
 * @param {{}} CommandList - Allowed commands and their default values
 * @returns {{}} results
 */
function getArguments(CommandList)
{
    const args = process.argv.splice(2);
    const results = Object.assign({}, CommandList);

    for (let i = 0; i < args.length; i++)
    {
        const value = args[i];
        const nextValue = args[i + 1];

        if (value.indexOf("-") === 0)
        {
            const flag = value.substring(1).toLowerCase();
            if (flag in CommandList)
            {
                if (nextValue && nextValue.charAt(0) !== "-")
                {
                    results[flag] = nextValue;
                    i++;
                }
            }
        }
    }

    return results;
}

const args = getArguments({
    port: 3000,                             // server port
    index: "./resfileindex.txt",            // source resfileindex.txt
    dest: "./cache/",                       // cache destination
    cdn: "http://resources.eveonline.com/", // ccp's cdn
    json: false,                            // outputs the current resfileindex to json
    dir: null                               // local res directory
});

// Default mime type
const DEFAULT_CONTENT_TYPE = "binary/octet-stream";

/**
 * Content types
 * @type {{}}
 */
const ContentTypes = {
    ".black": "binary/octet-stream",
    ".json": "application/json",
    ".yaml": "application/yaml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".dds": "image/x-dds"
};

/**
 * Gets a filename's extension
 * @param {String} fileName
 * @returns {null|String}
 */
function getExtension(fileName)
{
    const dot = fileName.lastIndexOf(".");
    if (dot === -1) return null;
    return fileName.substr(dot + 1).toLowerCase();
}

/**
 * Gets an extension's content type
 * @param {String} ext
 * @returns {string}
 */
function getContentType(ext)
{
    return ext in ContentTypes ? ContentTypes[ext] : DEFAULT_CONTENT_TYPE;
}

/**
 * Logs stuff
 * @param {String} fileName
 * @param {String} message
 * @param {Boolean} [isError]
 */
function log(fileName, message, isError)
{
    console.log(`[${fileName}] ${isError ? "ERR:" : "OK!:"} ${message}`);
}

/**
 * Converts a resfileindex into json
 * @param {String} resFileIndex - res file index file path
 * @returns {{}} the result as json
 */
function readResFileIndex(resFileIndex)
{
    if (!fs.existsSync(resFileIndex))
    {
        throw new Error(`Could not find "${resFileIndex}"`);
    }

    const
        array = fs.readFileSync(resFileIndex).toString().split("\n"),
        json = {};

    // Read each line and split into file path and remove the "res:/" prefix
    // When we only use the eve cdn then we can add the "res" back, if we
    // don't we could have collision with ccpwgl's "res:/" prefix
    array.forEach(line =>
    {
        const split = line.split(",");
        // Remove "res:/" from file name
        const fileName = split[0].substring(5);
        json[fileName] = split[1];
    });

    if (args.json)
    {
        // Ensure cache root exists
        if (!fs.existsSync(args.dest))
        {
            fs.mkdirSync(args.dest);
        }

        fs.writeFileSync(`${args.dest}/resfileindex.json`, JSON.stringify(json, null, 4));
    }

    return json;
}

// Convert the resfileindex.txt into json and then store in memory
const resMapping = readResFileIndex(args.index);

// File extensions affected by quality
const AffectedByQuality = [ "dds", "png", "gr2" ];

/**
 * Converts a filename from ccpwgl format to ccp format
 * @param {String} fileName
 * @returns {String}
 */
function fromCCPWGL(fileName)
{
    const ext = getExtension(fileName);

    // No red files anymore...
    if (ext === "red")
    {
        fileName = fileName.replace(".red", ".black");
        log(fileName, `Remapping red file to: ${fileName}`);
    }

    if (AffectedByQuality.indexOf(ext) === -1) return fileName;

    let newFileName = fileName;

    const highQuality = `.0.${ext}`;
    if (fileName.indexOf(highQuality) !== -1)
    {
        newFileName = fileName.replace(highQuality, `.${ext}`);
    }

    if (newFileName === fileName)
    {
        const mediumQuality = `.1.${ext}`;
        if (fileName.indexOf(mediumQuality) !== -1)
        {
            newFileName = fileName.replace(mediumQuality, `_mediumdetail.${ext}`);
            // handle files without medium quality settings
            if (!resMapping[newFileName])
            {
                newFileName = fileName.replace(mediumQuality, `.${ext}`);
            }
        }
    }

    if (newFileName === fileName)
    {
        const lowQuality = `.2.${ext}`;
        if (fileName.indexOf(lowQuality) !== -1)
        {
            newFileName = fileName.replace(lowQuality, `_lowdetail.${ext}`);
            // handle files without low quality settings
            if (!resMapping[newFileName])
            {
                newFileName = fileName.replace(lowQuality, `.${ext}`);
            }
        }
    }

    if (newFileName !== fileName)
    {
        log(fileName, `Remapping texture to: ${newFileName}`);
    }

    return newFileName;
}

/**
 * Gets a filename's hash from the resfileindex
 * @param {String} fileName
 * @returns {String} hash file path
 */
function getHash(fileName)
{
    const hash = resMapping[fileName];
    if (hash) return hash;
    throw new Error("Invalid file name");
}

/**
 * Gets a file from the ccp cdn and then stores locally
 * @param {String} fileName
 * @param {Function} cb
 */
function getFromCDN(fileName, cb)
{
    const hash = getHash(fileName);
    const url = args.cdn + hash;
    const localFile = `${args.dest}${hash}`;
    const localDir = localFile.substring(0, localFile.lastIndexOf("/"));

    log(fileName, `Retrieving from cdn: ${url}`);

    // Ensure cache root exists
    if (!fs.existsSync(args.dest))
    {
        fs.mkdirSync(args.dest);
    }

    // Ensure the local directory exists
    if (!fs.existsSync(localDir))
    {
        fs.mkdirSync(localDir);
    }

    // Create the file
    const file = fs.createWriteStream(localFile);
    const request = http.get(url, response =>
    {
        response.pipe(file);
        // close() is async, call cb after close completes.
        file.on("finish", () => file.close(cb));

    }).on("error", err =>
    {
        // Delete the file async. (But we don't check the result)
        fs.unlink(file);
        if (cb) cb(err.message);
    });
}

/**
 * Gets a local file
 * - Tries to get from local res first, then local cache
 * @param {String} fileName
 * @param {Function} cb
 */
function getFromLocal(fileName, cb, skipLog)
{
    const
        hash = getHash(fileName),
        cache = args.dest + hash;

    function get(localFile, cb, skipLog)
    {
        fs.exists(localFile, exist =>
        {
            if (exist)
            {
                if (!skipLog)
                {
                    log(fileName, `Retrieving from local: ${localFile}`);
                }
                fs.readFile(localFile, cb);
            }
            else
            {
                cb("File not found");
            }
        });
    }

    // No local res directory
    if (!args.dir)
    {
        get(cache, cb, skipLog);
    }
    else
    {
        // Try local res directory first
        get(args.dir + hash, (err, data) =>
        {
            if (data)
            {
                cb(null, data, true);
            }
            else
            {
                // Fallback to local res cache
                get(cache, cb, skipLog);
            }
        }, skipLog);
    }
}

/**
 * Because why not.
 * @param {String} txt
 */
function cookies(txt)
{
    if (txt.indexOf("cookie") !== -1 && !cookies.had)
    {
        console.log(`
        
                                           88         88                       
                                           88         ""                       
                                           88                                 
         ,adPPYba,  ,adPPYba,   ,adPPYba,  88   ,d8   88  ,adPPYba, ,adPPYba,  
        a8"     "" a8"     "8a a8"     "8a 88 ,a8"    88 a8P_____88 I8[    ""  
        8b         8b       d8 8b       d8 8888[      88 8PP"""""""   "Y8ba,   
        "8a,   ,aa "8a,   ,a8" "8a,   ,a8" 88  "Yba,  88 "8b,   ,aa aa    ]8I  
          "Ybbd8"'   "YbbdP"'   '"YbbdP"'  88    'Y8a 88  '"Ybbd8"' '"YbbdP"'  
                                                                      
        
        
        `);

        cookies.had = true;
    }
}

cookies.had = false;

/**
 * Gets a file
 * @param {String} fileName
 * @param {Function} cb
 */
function getFrom(fileName, cb)
{
    // Try local first
    getFromLocal(fileName, (err, data, local) =>
    {
        if (!err)
        {
            cb(null, data, local);
        }
        else
        {
            // Download from cdn
            getFromCDN(fileName, (err, data) =>
            {
                if (err)
                {
                    cb(err);
                }
                else
                {
                    getFromLocal(fileName, cb, true);
                }
            });
        }
    });
}

/**
 * Adds cors headers to a response
 * @param {Response} res
 * @returns {Response}
 */
function addCors(res)
{
    res.setHeader("Access-Control-Allow-Origin", "*"); // allow requests from any other server
    res.setHeader("Access-Control-Allow-Methods", "GET"); // allow these verbs
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
    return res;
}

function pretty(obj)
{
    return JSON.stringify(obj, null, 4);
}

/**
 * Temporary method to get static files
 * @param {String} fileName
 * @param {Response} res
 */
function getStaticJSONFile(fileName, res)
{
    addCors(res);

    const
        paths = fileName.split("/"),
        type = paths[1],
        id = String(paths.pop());

    fileName = "./" + paths.join("/") + ".json";
    log(fileName, `Retrieving from local: ${fileName} (id: ${id})`);

    let err;
    if (fs.existsSync(fileName))
    {
        const data = JSON.parse(fs.readFileSync(fileName));

        if (id in data)
        {
            res.setHeader("Context-type", getContentType("json"));
            res.end(pretty(data[id]));
            log(fileName, "Success");
            return;
        }
        err = `Invalid id for ${type}: ${id}`;
    }
    else
    {
        err = `Invalid static type: ${type}`;
    }

    res.statusCode = 404;
    res.end(pretty({error: true, message: err}));
    log(fileName, err, true);
    cookies(fileName);
}

/**
 * Gets a file
 * @param {String} fileName
 * @param {Response} res
 * @param {Request} req
 */
function getFile(fileName, req, res)
{
    fileName = fileName.toLowerCase();

    // Remove backslash
    if (fileName.indexOf("/") === 0)
    {
        fileName = fileName.substring(1);
    }

    // Temporary method to get static json files
    if (fileName.indexOf("static/") === 0)
    {
        return getStaticJSONFile(fileName, res);
    }

    // Convert from ccpwgl formats
    fileName = fromCCPWGL(fileName);


    // Ensure valid file name
    if (!resMapping[fileName])
    {
        res.statusCode = 404;
        res.end(`Invalid file name: ${fileName}`);
        log(fileName, "Invalid file name", true);
        cookies(fileName);
        return;
    }

    // Get mime type (Don't think we actually care)
    const contentType = getContentType(path.parse(fileName).ext);
    log(fileName, `Mimetype: ${contentType}`);

    getFrom(fileName, (err, data, local) =>
    {
        if (err)
        {
            cookies(fileName);
            res.statusCode = 500;
            res.end(pretty({error: true, message: err}));
            log(fileName, err, true);
        }
        else
        {
            res.setHeader("Content-type", contentType);
            if (!local) res.setHeader("Content-Encoding", "gzip");
            addCors(res);
            res.end(data);
            log(fileName, "Success");
        }
    });
}

// Create server
http.createServer((req, res) =>
{
    log(req.url.substring(1), `${req.method} ${req.url}`);

    if (req.method === "OPTIONS")
    {
        addCors(res);
        res.end();
    }

    var resfilePath = url.parse(req.url).pathname;
    if (resfilePath !== "/")
    {
        getFile(resfilePath, req, res);
    }
    else
    {
        res.end("usage: /%filename%");
    }

}).listen(parseInt(args.port));

// Boot message
const BOOT_MESSAGE = `Server listening on port ${args.port}`;
console.log("");
console.log(BOOT_MESSAGE);
console.log("=".repeat(BOOT_MESSAGE.length));
console.log(JSON.stringify(args, null, 4));
console.log("");




