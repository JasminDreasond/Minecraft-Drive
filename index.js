const startServer = async function () {

    // Modules
    const path = require('path');
    const fs = require('fs');
    const ini = require('ini');
    const ON_DEATH = require('death');
    const ScriptServer = require('scriptserver');
    const moment = require('moment');
    const backupStatus = { active: false };
    const consoleGenerator = function (name, value) { return `[${moment().format('HH:mm:ss')}] [${name}]: ${value}`; };
    console.log(consoleGenerator('Mine-Drive', 'Starting App...'));

    // Files
    const rootPath = path.dirname(process.execPath);
    console.log(consoleGenerator('Mine-Drive', `App Path: ${rootPath}`));
    console.log(consoleGenerator('Mine-Drive', `Loading Config...`));
    const tinyCfg = ini.parse(fs.readFileSync(path.join(rootPath, './mine-drive.ini'), 'utf-8'));
    if (typeof tinyCfg.autobackupminutes !== "string" && typeof tinyCfg.autobackupminutes !== "number") { tinyCfg.autobackupminutes = 30; }
    tinyCfg.drivepath = tinyCfg.drivepath.replace('{OneDrive}', process.env.OneDrive);
    console.log(consoleGenerator('Mine-Drive', `Config Loaded!`));

    // Module Config
    const config = {
        core: {
            jar: tinyCfg.jar,
            args: tinyCfg.args,
            rcon: tinyCfg.rcon
        }
    };

    console.log(consoleGenerator('Mine-Drive', `Core Config of ScriptServer Loaded!`));

    // Custom Config
    console.log(consoleGenerator('Mine-Drive', `Loading Custom Config...`));
    if (tinyCfg.custom) {

        // String
        if (typeof tinyCfg.custom === "string") {
            tinyCfg.custom = JSON.parse(tinyCfg.custom);
        }

        // Object
        for (const item in tinyCfg.custom) { config[item] = tinyCfg.custom[item]; }

    }

    console.log(consoleGenerator('Mine-Drive', `Custom Config loaded!`));

    // Prepare Minecraft
    const minecraft = { config: config, path: rootPath };
    console.log(consoleGenerator('Mine-Drive', `Minecraft values ready!`));

    // Custom Start
    console.log(consoleGenerator('Mine-Drive', `Starting custom JS File...`));
    let customIndex = null;
    try { customIndex = require(path.join(rootPath, './mine-drive.js')); } catch (err) { customIndex = null; }
    if (typeof customIndex === "function") { customIndex(minecraft); console.log(consoleGenerator('Mine-Drive', `Custom JS File started!`)); } else { console.log(consoleGenerator('Mine-Drive', `Custom JS File not found!`)); }

    // Google Drive Script
    const archiver = require('archiver');
    const createZipBackup = function (callback) {

        // Active Start
        if (!backupStatus.active) {
            backupStatus.active = true;

            // Preparing Backup
            console.log(consoleGenerator('Mine-Drive', 'Starting Backup...'));
            var output = fs.createWriteStream(path.join(tinyCfg.drivepath, './' + tinyCfg.zipname + '.zip'));
            var archive = archiver('zip');

            // This event is fired when the data source is drained no matter what was the data source.
            // It is not part of this library but rather from the NodeJS Stream API.
            output.on('end', function () {
                console.log(consoleGenerator('Mine-Drive', 'Data has been drained'));
                return
            });

            // listen for all archive data to be written
            // 'close' event is fired only when a file descriptor is involved
            output.on('close', function () {
                console.log(consoleGenerator('Mine-Drive', archive.pointer() + ' total bytes'));
                console.log(consoleGenerator('Mine-Drive', 'Archiver has been finalized and the output file descriptor has closed.'));
                backupStatus.active = false;
                if (typeof callback === "function") { callback(); }
                return;
            });

            // good practice to catch this error explicitly
            archive.on('error', function (err) {
                console.log(consoleGenerator('Mine-Drive', 'ERROR!'));
                console.error(err);
                return;
            });

            // good practice to catch warnings (ie stat failures and other non-blocking errors)
            archive.on('warning', function (err) {
                console.log(consoleGenerator('Mine-Drive', 'WARN!'));
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

            // Final
            archive.finalize();

        }

        // Complete
        return;

    };

    // Start Server
    console.log(consoleGenerator('Mine-Drive', `Starting Minecraft Server...`));
    minecraft.server = new ScriptServer(config);
    createZipBackup(function () {

        // Start Auto Backup
        setInterval(function () { createZipBackup(); return; }, Number(60000 * Number(tinyCfg.autobackupminutes)));

        // Starting Server
        minecraft.server.start();
        minecraft.server.spawn.on('close', (code) => {
            console.log(consoleGenerator('Mine-Drive', `Minecraft Server close all stdio with code ${code}.`));
            createZipBackup();
            return;
        });
        minecraft.server.spawn.on('exit', (code) => {
            console.log(consoleGenerator('Mine-Drive', `Minecraft Server exited with code ${code}.`));
            createZipBackup();
            return;
        });

        // Complete
        return;

    });

    // Prepare Close
    const closeAwait = async () => {

        // Wait
        await new Promise(function (resolve) {

            // Wait Backup
            const awaitBackup = function () {
                if (backupStatus.active) { setTimeout(() => { awaitBackup(); }, 1000); } else { resolve(); }
                return;
            };

            // Complete
            return;

        });

        // Complete
        return;

    };

    process.on('exit', closeAwait);
    process.on('close', closeAwait);

    // ON Death
    ON_DEATH(async function (signal, err) {

        // Closing Message
        console.log(consoleGenerator('Mine-Drive', `Closing App: ${signal}`));
        if (err) { console.error(err); }
        await minecraft.server.stop();
        await closeAwait();
        return;

    });

    // Complete
    return;

};

// Start
startServer();