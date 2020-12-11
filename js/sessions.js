/**
 * Augment session json with caption text
 */


import hic from "../node_modules/juicebox.js/dist/js/juicebox.esm.js"

async function restoreSession(container, session) {

    if (session.hasOwnProperty("caption")) {
        const captionText = session.caption;
        var captionDiv = document.getElementById("hic-caption");
        if (captionDiv) {
            captionDiv.textContent = captionText;
        }
    }

    hic.restoreSession(container, session);

}


function toJSON() {

    const jsonOBJ = hic.toJSON();
    const captionDiv = document.getElementById('hic-caption');
    if (captionDiv) {
        var captionText = captionDiv.textContent;
        if (captionText) {
            captionText = captionText.trim();
            if (captionText) {
                jsonOBJ.caption = captionText;
            }
        }
    }
    return jsonOBJ;
}


export {restoreSession, toJSON}