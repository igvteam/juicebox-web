#!/usr/bin/env node
const fs = require('fs-extra');
const templatePath =  __dirname + '/../index.html';
const pj = require.resolve('../package.json');
const jsonText = fs.readFileSync(pj, 'utf-8');
const version = JSON.parse(jsonText).version;


const lines = fs.readFileSync(templatePath, 'utf-8').split(/\r?\n/);

const outputFileName = process.argv.length > 3 ? process.argv[3] : 'juicebox.html'

const out = __dirname + '/../dist/' + outputFileName;
const fd = fs.openSync(out, 'w');
let skipNavbar = false;
for (let line of lines) {

    if(line.includes("<script") && line.includes("module") && line.includes("app.js")) {
        fs.writeSync(fd, '<script type="application/javascript" src="js/hic-app.min.js"></script>\n', null, 'utf-8');
        //fs.writeSync(fd, '<script src="js/app-bundle.esm.js" type="module"></script>\n', null, 'utf-8');
    }

    else if(line.includes("juicebox.css")) {
        fs.writeSync(fd, '<link rel="stylesheet" href="css/juicebox.css"/>\n', null, 'utf-8');
    }

    else if (line.includes("@VERSION")) {
        line = line.replace("@VERSION", version);
        fs.writeSync(fd, line + '\n', null, 'utf-8');
    }

    // else if (line.includes("<!--NAVBAR-->") && process.argv.length > 2) {
    //     const navbarFile = require.resolve(process.argv[2]);
    //     const navbar = fs.readFileSync(navbarFile, 'utf-8');
    //     fs.writeSync(fd, navbar, null, 'utf-8');
    //     skipNavbar = true;
    // }
    //
    // else if(skipNavbar) {
    //     if(line.includes("<!--NAVBAR")) {
    //         skipNavbar = false;
    //     }
    // }

    else {
        fs.writeSync(fd, line + '\n', null, 'utf-8')
    }
}
fs.close(fd);
