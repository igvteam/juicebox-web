#!/usr/bin/env node
const fs = require('fs-extra');
const templatePath =  __dirname + '/../index.html';
const pj = require.resolve('../package.json');
const jsonText = fs.readFileSync(pj, 'utf-8');
const version = JSON.parse(jsonText).version;

const lines = fs.readFileSync(templatePath, 'utf-8').split(/\r?\n/);

const outputFileName = process.argv[ 3 ]

// node scripts/generateHtml.js ./navbars/aidenlab.html juicebox.html
console.log(`argv ${ process.argv.length } aiden lab additions ${ process.argv[ 2 ] } output file ${ outputFileName }`)

const out = __dirname + '/../dist/' + outputFileName;
const fd = fs.openSync(out, 'w');
let skipAidenLabAdditions = false;
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

    else if (line.includes("<!--AIDEN_LAB-->")) {
        const file = require.resolve(process.argv[ 2 ]);
        const aidenLabAdditions = fs.readFileSync(file, 'utf-8');
        fs.writeSync(fd, aidenLabAdditions, null, 'utf-8');
        skipAidenLabAdditions = true;
    }

    else if(skipAidenLabAdditions) {
        if(line.includes("<!--AIDEN_LAB")) {
            skipAidenLabAdditions = false;
        }
    }

    else {
        fs.writeSync(fd, line + '\n', null, 'utf-8')
    }
}
fs.close(fd);
