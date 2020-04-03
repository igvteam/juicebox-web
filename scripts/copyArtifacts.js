#!/usr/bin/env node

const fs = require('fs-extra');
const indexPath =  __dirname + '/../juicebox.html';
const pj = require.resolve('../package.json');
const jsonText = fs.readFileSync(pj, 'utf-8');
const version = JSON.parse(jsonText).version;

let ping = fs.readFileSync(indexPath, 'utf-8');
const lines = ping.split(/\r?\n/);

const out = __dirname + '/../dist/juicebox.html';
var fd = fs.openSync(out, 'w');

for (let line of lines) {

    if(line.includes("<script") && line.includes("module") && line.includes("app.js")) {
        fs.writeSync(fd, '<script src="js/app-bundle.esm.js" type="module"></script>\n', null, 'utf-8');
    } else   if(line.includes("juicebox.css")) {
        fs.writeSync(fd, '<link rel="stylesheet" href="css/juicebox.css"/>\n', null, 'utf-8');
    } else if (line.includes("@VERSION")) {
        line = line.replace("@VERSION", version);
        fs.writeSync(fd, line + '\n', null, 'utf-8');
    }
    else {
        fs.writeSync(fd, line + '\n', null, 'utf-8')
    }
}
