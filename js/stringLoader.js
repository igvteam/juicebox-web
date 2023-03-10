/**
 * Object mimics two methods from the igvxhr interface, purpose is to break dependency on igvxhr.
 * Widgets do not need the services provided by that object *
 */

async function loadJson (url, options) {
    options = options || {}
    const method = options.method || (options.sendData ? "POST" : "GET")
    if (method === "POST") {
        options.contentType = "application/json"
    }
    const result = await this.loadString(url, options)
    if (result) {
        return JSON.parse(result)
    } else {
        return result
    }
}

async function loadString (path, options) {
    options = options || {}
    if (path instanceof File) {
        return loadStringFromFile(path, options)
    } else {
        return loadStringFromUrl(path, options)
    }
}

async function loadStringFromFile(localfile, options) {

    const blob = localfile
    const arrayBuffer = await blob.arrayBuffer()
    return arrayBufferToString(arrayBuffer)
}


async function loadStringFromUrl(url) {
    options.responseType = "arraybuffer"
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    return arrayBufferToString(data)
}

function arrayBufferToString(arraybuffer) {
    let plain= new Uint8Array(arraybuffer)
    return new TextDecoder().decode(plain)
}


export {loadString, loadJson}
