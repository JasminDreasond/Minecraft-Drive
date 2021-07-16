// Modules
const package = require('./package.json');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const ScriptServer = require('scriptserver');
const rootPath = path.dirname(process.execPath);
const tinyCfg = ini.parse(fs.readFileSync(path.join(rootPath, './mine-drive.ini'), 'utf-8'));

const config = {
    core: {
        jar: tinyCfg.jar,
        args: tinyCfg.args,
        rcon: tinyCfg.rcon
    }
};

// Server
const server = new ScriptServer(config);

// Custom Start
let customIndex = null;
try { customIndex = require(path.join(rootPath, './mine-drive.js')); } catch (err) { customIndex = null; }
if (typeof customIndex === "function") { customIndex(server); }