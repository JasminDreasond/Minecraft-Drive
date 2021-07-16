// Modules
const package = require('./package.json');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const rootPath = path.dirname(process.execPath);

// Custom Start
let customIndex = null;
try { customIndex = require(path.join(rootPath, './mine-drive.js')); } catch (err) { customIndex = null; }
if (typeof customIndex === "function") { customIndex(); }