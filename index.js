// Modules
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const ScriptServer = require('scriptserver');
const rootPath = path.dirname(process.execPath);
const tinyCfg = ini.parse(fs.readFileSync(path.join(rootPath, './mine-drive.ini'), 'utf-8'));

// Module Config
const config = {
    core: {
        jar: tinyCfg.jar,
        args: tinyCfg.args,
        rcon: tinyCfg.rcon
    }
};

// Custom Config
if (tinyCfg.custom) {

    // String
    if (typeof tinyCfg.custom === "string") {
        tinyCfg.custom = JSON.parse(tinyCfg.custom);
    }

    // Object
    for (const item in tinyCfg.custom) { config[item] = tinyCfg.custom[item]; }

}

// Prepare Minecraft
const minecraft = {};

// Custom Start
let customIndex = null;
try { customIndex = require(path.join(rootPath, './mine-drive.js')); } catch (err) { customIndex = null; }
if (typeof customIndex === "function") { customIndex(minecraft); }

// Start Server
minecraft.server = new ScriptServer(config);
