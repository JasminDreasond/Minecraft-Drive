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

// Google Drive Script
const archiver = require('archiver');
const createZipBackup = function (callback) {

    // Preparing Backup
    console.log('Backup - Starting Backup...');
    var output = fs.createWriteStream(path.join(tinyCfg.drivepath, './' + tinyCfg.zipname + '.zip'));
    var archive = archiver('zip');

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    output.on('end', function () {
        console.log('Backup - Data has been drained');
        return
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
        console.log('Backup - ' + archive.pointer() + ' total bytes');
        console.log('Backup - archiver has been finalized and the output file descriptor has closed.');
        if (typeof callback === "function") { callback(); }
        return;
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        console.log('Backup - ERROR!');
        console.error(err);
        return;
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        console.log('Backup - WARN!');
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            console.error(err);
        }
    });

    // Pipe
    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(rootPath, false);

    // Complete
    archive.finalize();
    return;

};

// Start Server
console.log(`Starting Minecraft Server...`);
minecraft.server = new ScriptServer(config);
createZipBackup(function () { minecraft.server.start(); return; });

// ON Death
ON_DEATH(async function (signal, err) {

    // Closing Message
    console.log(`Closing App: ${signal}`);
    if (err) { console.error(err); }
    await minecraft.server.stop();
    return;

});

