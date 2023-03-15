/**
 * Object mimics two methods from the igvxhr interface, purpose is to break dependency on igvxhr.
 * Widgets do not need the services provided by that object *
 */

async function loadJson (url) {
    const result = await this.loadString(url)
    if (result) {
        return JSON.parse(result)
    } else {
        return result
    }
}

async function loadString (path) {
    if (path instanceof File) {
        return loadStringFromFile(path)
    } else {
        return loadStringFromUrl(path)
    }
}

async function loadStringFromFile(localfile) {

    const blob = localfile
    const arrayBuffer = await blob.arrayBuffer()
    return arrayBufferToString(arrayBuffer)
}


async function loadStringFromUrl(url) {
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return arrayBufferToString(data)
}

function arrayBufferToString(arraybuffer) {
    let plain= new Uint8Array(arraybuffer)
    return new TextDecoder().decode(plain)
}


export {loadString, loadJson}
