// Modules
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const ON_DEATH = require('death');
const ScriptServer = require('scriptserver');
console.log('Starting App...');

// Files
const rootPath = path.dirname(process.execPath);
console.log(`App Path: ${rootPath}`);
console.log(`Loading Config...`);
const tinyCfg = ini.parse(fs.readFileSync(path.join(rootPath, './mine-drive.ini'), 'utf-8'));
console.log(`Config Loaded!`);

// Module Config
const config = {
    core: {
        jar: tinyCfg.jar,
        args: tinyCfg.args,
        rcon: tinyCfg.rcon
    }
};

console.log(`Core Config of ScriptServer Loaded!`);

// Custom Config
console.log(`Loading Custom Config...`);
if (tinyCfg.custom) {

    // String
    if (typeof tinyCfg.custom === "string") {
        tinyCfg.custom = JSON.parse(tinyCfg.custom);
    }

    // Object
    for (const item in tinyCfg.custom) { config[item] = tinyCfg.custom[item]; }

}

console.log(`Custom Config loaded!`);

// Prepare Minecraft
const minecraft = { config: config, path: rootPath };
console.log(`Minecraft values ready!`);

// Custom Start
console.log(`Starting custom JS File...`);
let customIndex = null;
try { customIndex = require(path.join(rootPath, './mine-drive.js')); } catch (err) { customIndex = null; }
if (typeof customIndex === "function") { customIndex(minecraft); console.log(`Custom JS File started!`); } else { console.log(`Custom JS File not found!`); }

// Start Server
console.log(`Starting Minecraft Server...`);
minecraft.server = new ScriptServer(config);
minecraft.server.start();

// ON Death
ON_DEATH(async function (signal, err) {

    // Closing Message
    console.log(`Closing App: ${signal}`);
    if (err) { console.error(err); }
    await minecraft.server.stop();
    return;

});

// Google Drive Script