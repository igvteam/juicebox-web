import { Alert } from '../node_modules/igv-ui/src/index.js'
import { TrackUtils, StringUtils, } from '../node_modules/igv-utils/src/index.js'
import { SessionFileLoad } from '../node_modules/igv-widgets/dist/igv-widgets.js';
import ModalTable from '../node_modules/data-modal/js/modalTable.js';
import EncodeDataSource from '../node_modules/data-modal/js/encodeDataSource.js';
import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";
import ContactMapDatasource from "./contactMapDatasource.js";
import QRCode from "./qrcode.js";
import SessionController from "./sessionController.js";

// The igv object. TODO eliminate this dependency
const igv = hic.igv;

let googleEnabled = false;

let lastGenomeId = undefined;
let qrcode = undefined;
let currentContactMapDropdownButtonID = undefined;
let sessionController;

let $hic_share_url_modal;

const encodeModal = new ModalTable({ id: 'hic-encode-modal', title: 'ENCODE', selectionStyle: 'multi', pageLength: 10, selectHandler: selected => loadTracks(selected) });

let contactMapDatasource = undefined;

const contactMapSelectHandler = selectionList => {
    const { url, name } = contactMapDatasource.tableSelectionHandler(selectionList);
    loadHicFile(url, name);
};

const contactMapModal = new ModalTable({ id: 'hic-contact-map-modal', title: 'Contact Map', selectionStyle: 'single', pageLength: 10, selectHandler:contactMapSelectHandler });

const initializationHelper = async (container, config) => {

    const genomeChangeListener = {

        receiveEvent: async event => {
            const { data: genomeId } = event;

            if (lastGenomeId !== genomeId) {
                lastGenomeId = genomeId;
                if (config.trackMenu) {
                    let tracksURL = config.trackMenu.items.replace("$GENOME_ID", genomeId);
                    await loadAnnotationDatalist($(`#${config.trackMenu.id}`), tracksURL, "1D");
                }

                if (config.trackMenu2D) {
                    let annotations2dURL = config.trackMenu2D.items.replace("$GENOME_ID", genomeId);
                    await loadAnnotationDatalist($(`#${config.trackMenu2D.id}`), annotations2dURL, "2D");
                }

                if (EncodeDataSource.supportsGenome(genomeId)) {
                    $('#hic-encode-modal-button').show();
                    createEncodeTable(genomeId);
                } else {
                    $('#hic-encode-modal-button').hide();
                }
            }
        }
    };

    hic.EventBus.globalBus.subscribe("GenomeChange", genomeChangeListener);

    for (let browser of hic.allBrowsers) {
        browser.eventBus.subscribe("MapLoad", checkBDropdown);
        updateBDropdown(browser);
    }


    // session file load config
    const sessionFileLoadConfig =
        {
            localFileInput: document.querySelector('#igv-app-dropdown-local-session-file-input'),
            dropboxButton: document.querySelector('#igv-app-dropdown-dropbox-session-file-button'),
            googleEnabled,
            googleDriveButton: document.querySelector('#igv-app-dropdown-google-drive-session-file-button'),
            loadHandler: config => {
                hic.loadSession(config)
            },
            igvxhr: igv.xhr,
            oauth: igv.oauth
        };

    // Session Controller
    const sessionControllerConfig =
        {
            sessionLoadModal: document.querySelector('#igv-app-session-from-url-modal'),
            sessionSaveModal: document.querySelector('#igv-app-session-save-modal'),
            sessionFileLoad: new SessionFileLoad(sessionFileLoadConfig),
            JSONProvider: () => hic.toJSON()
        };
    sessionController = new SessionController(sessionControllerConfig);

    createDatalistModals(document.querySelector('#hic-main'));

    appendAndConfigureLoadURLModal(document.querySelector('#hic-main'), 'hic-load-url-modal', function (e) {

        if (undefined === hic.HICBrowser.getCurrentBrowser()) {
            Alert.presentAlert('ERROR: you must select a map panel.');
        } else {
            const url = $(this).val();
            loadHicFile( url, undefined );
        }

        $(this).val("");
        $('#hic-load-url-modal').modal('hide');

    });

    appendAndConfigureLoadURLModal(document.querySelector('#hic-main'), 'track-load-url-modal', function (e) {

        if (undefined === hic.HICBrowser.getCurrentBrowser()) {
            Alert.presentAlert('ERROR: you must select a map panel.');
        } else {
            const url = $(this).val();
            loadTracks([ { url } ]);
        }

        $(this).val("");
        $('#track-load-url-modal').modal('hide');

    });

    if (config.mapMenu) {
        const { items: path } = config.mapMenu;

        contactMapDatasource = new ContactMapDatasource(path);
        contactMapModal.setDatasource(contactMapDatasource);
    }

    $hic_share_url_modal = $('#hic-share-url-modal');

    $hic_share_url_modal.on('show.bs.modal', async function (e) {

        let href = new String(window.location.href);

        // This js file is specific to the aidenlab site, and we know we have only juicebox parameters.
        // Strip href of current parameters, if any
        let idx = href.indexOf("?");
        if (idx > 0) href = href.substring(0, idx);

        const jbUrl = await hic.shortJuiceboxURL(href);

        const embedSnippet = await getEmbeddableSnippet($(container), config);
        const $hic_embed_url = $('#hic-embed');
        $hic_embed_url.val(embedSnippet);
        $hic_embed_url.get(0).select();

        let shareUrl = jbUrl;

        // Shorten second time
        // e.g. converts https://aidenlab.org/juicebox?juiceboxURL=https://goo.gl/WUb1mL  to https://goo.gl/ERHp5u

        const $hic_share_url = $('#hic-share-url');
        $hic_share_url.val(shareUrl);
        $hic_share_url.get(0).select();

        const tweetContainer = $('#tweetButtonContainer');
        tweetContainer.empty();

        $('#emailButton').attr('href', 'mailto:?body=' + shareUrl);

        if (shareUrl.length < 100) {

            await window.twttr.widgets.createShareButton(shareUrl, tweetContainer.get(0), { text: 'Contact map: ' });
            console.log("Tweet button updated");

            // QR code generation
            if (qrcode) {
                qrcode.clear();
                $('hic-qr-code-image').empty();
            } else {
                qrcode = new QRCode(document.getElementById("hic-qr-code-image"), { width: 128, height: 128, correctLevel: QRCode.CorrectLevel.H });
            }

            qrcode.makeCode(shareUrl);
        }

    });

    $hic_share_url_modal.on('hidden.bs.modal', function (e) {
        $('#hic-embed-container').hide();
        $('#hic-qr-code-image').hide();
    });

    $('#hic-track-dropdown').parent().on('shown.bs.dropdown', function () {
        var browser;

        browser = hic.HICBrowser.getCurrentBrowser();
        if (undefined === browser || undefined === browser.dataset) {
            Alert.presentAlert('Contact map must be loaded and selected before loading tracks');
        }
    });

    $('#hic-embed-button').on('click', function (e) {
        $('#hic-qr-code-image').hide();
        $('#hic-embed-container').toggle();
    });

    $('#hic-qr-code-button').on('click', function (e) {
        $('#hic-embed-container').hide();
        $('#hic-qr-code-image').toggle();
    });

    $('#hic-load-local-file').on('change', function (e) {

        if (undefined === hic.HICBrowser.getCurrentBrowser()) {
            Alert.presentAlert('ERROR: you must select a map panel.');
        } else {

            const file = ($(this).get(0).files)[0];

            const { name } = file;
            const suffix = name.substr(name.lastIndexOf('.') + 1);

            if ('hic' === suffix) {
                loadHicFile(file, name);
            } else {
                loadTracks([{ url: file, name }]);
            }
        }

        $(this).val("");
        $('#hic-load-local-file-modal').modal('hide');

    });

    $('.juicebox-app-clone-button').on('click', async () => {

        let browser = undefined;
        try {
            browser = await hic.createBrowser(container, { initFromUrl: false, updateHref: false });
        } catch (e) {
            console.error(e);
        }

        if (browser) {
            hic.HICBrowser.setCurrentBrowser(browser);
        }

    });

    $('#hic-copy-link').on('click', function (e) {
        var success;
        $('#hic-share-url')[0].select();
        success = document.execCommand('copy');
        if (success) {
            $('#hic-share-url-modal').modal('hide');
        } else {
            alert("Copy not successful");
        }
    });

    $('#hic-embed-copy-link').on('click', function (e) {
        var success;
        $('#hic-embed')[0].select();
        success = document.execCommand('copy');
        if (success) {
            $('#hic-share-url-modal').modal('hide');
        } else {
            alert("Copy not successful");
        }
    });

    const $e = $('button[id$=-map-dropdown]');
    $e.parent().on('show.bs.dropdown', function () {
        currentContactMapDropdownButtonID = $(this).children('.dropdown-toggle').attr('id');
    });

    $e.parent().on('hide.bs.dropdown', function () {
        console.log("hide contact/control map");
    });

    hic.EventBus.globalBus.subscribe("BrowserSelect", function (event) {
        updateBDropdown(event.data);
    });

    // Must manually trigger the genome change event on initial load
    if (hic.HICBrowser.currentBrowser && hic.HICBrowser.currentBrowser.genome) {
        await genomeChangeListener.receiveEvent({data: hic.HICBrowser.currentBrowser.genome.id})
    }
};

const appendAndConfigureLoadURLModal = (root, id, input_handler) => {

    const html =
        `<div id="${ id }" class="modal fade">
            <div class="modal-dialog  modal-lg">
                <div class="modal-content">

                <div class="modal-header">
                    <div class="modal-title">Load URL</div>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>

                </div>

                <div class="modal-body">

                    <div class="form-group">
                        <input type="text" class="form-control" placeholder="Enter URL">
                    </div>

                </div>

                </div>
            </div>
        </div>`;

    $(root).append(html);

    const $modal = $(root).find(`#${ id }`);
    $modal.find('input').on('change', input_handler);

    return html;
};

const createDatalistModals = root => {

    let modal;

    // Annotation Datalist Modal
    $(root).append(createGenericDataListModal('hic-annotation-datalist-modal', 'annotation-input', 'annotation-datalist', 'Enter annotation file name'));

    modal = root.querySelector('#hic-annotation-datalist-modal');
    modal.querySelector('.modal-title').textContent = 'Annotations';

    const $annotation_input = $('#annotation-input');
    $annotation_input.on('change', function (e) {

        if (undefined === hic.HICBrowser.getCurrentBrowser()) {
            Alert.presentAlert('ERROR: you must select a map panel.');
        } else {

            const name = $annotation_input.val();
            const $option = $('#annotation-datalist option').filter(function () {
                const str = $(this).text().trim();
                return /*str.includes(name)*/str === name;
            });
            const path = $option.data('url');

            let config = { url: path, name };

            if (path.indexOf("hgdownload.cse.ucsc.edu") > 0) {
                config.indexed = false
            }
            loadTracks([config]);
        }

        $('#hic-annotation-datalist-modal').modal('hide');
        $annotation_input.val('');

    });

    // 2D Annotation Datalist Modal
    $(root).append(createGenericDataListModal('hic-annotation-2D-datalist-modal', 'annotation-2D-input', 'annotation-2D-datalist', 'Enter 2D annotation file name'));

    modal = root.querySelector('#hic-annotation-2D-datalist-modal');
    modal.querySelector('.modal-title').textContent = '2D Annotations';

    const $annotation_2D_input = $('#annotation-2D-input');
    $annotation_2D_input.on('change', function (e) {

        if (undefined === hic.HICBrowser.getCurrentBrowser()) {
            Alert.presentAlert('ERROR: you must select a map panel.');
        } else {
            const name = $annotation_2D_input.val();
            const $option = $('#annotation-2D-datalist option').filter(function () {
                const str = $(this).text().trim();
                return /*str.includes(name)*/str === name;
            });
            const path = $option.data('url');
            loadTracks([ { url: path, name } ]);
        }

        $('#hic-annotation-2D-datalist-modal').modal('hide');
        $annotation_2D_input.val('');
    });

};

const createGenericDataListModal = (id, input_id, datalist_id, placeholder) => {

    const generic_select_modal_string =
        `<div id="${ id }" class="modal">

            <div class="modal-dialog modal-lg">

                <div class="modal-content">

                    <div class="modal-header">
                        <div class="modal-title"></div>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
        
                    <div class="modal-body">
                        <div class="form-group">
                            <input type="text" id="${ input_id }" list="${ datalist_id }" placeholder="${ placeholder }" class="form-control">
                            <datalist id="${ datalist_id }"></datalist>
                        </div>
                    </div>

                </div>

            </div>

        </div>`;

    return generic_select_modal_string;
};

const createEncodeTable = genomeId => encodeModal.setDatasource(new EncodeDataSource(genomeId));

const loadAnnotationDatalist = async ($datalist, url, type) => {

    $datalist.empty();

    let data = undefined;

    try {
        data = await igv.xhr.loadString(url);
    } catch (e) {
        if(e.message.includes("404")) {
            //  This is an expected condition, not all assemblies have track menus
            console.log(`No track menu found ${url}`);
        } else {
            console.log(`Error loading track menu: ${url} ${e}`);
            Alert.presentAlert(`Error loading track menu: ${url} ${e}`);
        }
    }

    let lines = data ? StringUtils.splitLines(data) : [];
    if (lines.length > 0) {

        for (let line of lines) {

            const tokens = line.split('\t');

            if (tokens.length > 1 && ("2D" === type || igvSupports(tokens[1]))) {

                const [ label, value ] = tokens;
                $datalist.append($(`<option data-url="${ value }">${ label }</option>`));

            }
        }
    }

};

function igvSupports(path) {

    // For now we will pretend that igv does not support bedpe, we want these loaded as 2D tracks
    if (path.endsWith(".bedpe") || path.endsWith(".bedpe.gz")) {
        return false;
    }

    let config = { url: path };
    TrackUtils.inferTrackTypes(config);
    return config.type !== undefined;

}

function loadTracks(tracks) {
    // Set some juicebox specific defaults
    for(let t of tracks) {
        t.autoscale = true;
        t.displayMode = "COLLAPSED"
    }
    hic.HICBrowser.getCurrentBrowser().loadTracks(tracks);
}

function loadHicFile(url, name) {

    var synchState, browsersWithMaps, isControl, browser, query, config, uriDecode;

    browsersWithMaps = hic.allBrowsers.filter(function (browser) {
        return browser.dataset !== undefined;
    });

    if (browsersWithMaps.length > 0) {
        synchState = browsersWithMaps[0].getSyncState();
    }

    isControl = currentContactMapDropdownButtonID === 'hic-control-map-dropdown';

    browser = hic.HICBrowser.getCurrentBrowser();

    config = {url: url, name: name, isControl: isControl};


    if (StringUtils.isString(url) && url.includes("?")) {
        query = hic.extractQuery(url);
        uriDecode = url.includes("%2C");
        hic.decodeQuery(query, config, uriDecode);
    }


    if (isControl) {
        browser
            .loadHicControlFile(config)
            .then(function (dataset) {

            });
    } else {
        browser.reset();

        browsersWithMaps = hic.allBrowsers.filter(function (browser) {
            return browser.dataset !== undefined;
        });

        if (browsersWithMaps.length > 0) {
            config["synchState"] = browsersWithMaps[0].getSyncState();
        }


        browser
            .loadHicFile(config)
            .then(function (ignore) {
                if (!isControl) {
                    hic.syncBrowsers(hic.allBrowsers);
                }
                $('#hic-control-map-dropdown').removeClass('disabled');
            });
    }
}

async function getEmbeddableSnippet($container, config) {
    const base = (config.embedTarget || getEmbedTarget())
    const embedUrl =  await hic.shortJuiceboxURL(base);
    const height = $container.height();
    return '<iframe src="' + embedUrl + '" width="100%" height="' + height + '" frameborder="0" style="border:0" allowfullscreen></iframe>';
}

/**
 * Get the default embed html target.  Assumes an "embed.html" file in same directory as this page
 */
function getEmbedTarget() {

    var href, idx;
    href = new String(window.location.href);

    idx = href.indexOf("?");
    if (idx > 0) href = href.substring(0, idx);

    idx = href.lastIndexOf("/");
    return href.substring(0, idx) + "/embed.html"

}

const populatePulldown = async menu => {

    const { id, items } = menu;

    let data = undefined;
    try {
        data = await igv.xhr.loadString(items)
    } catch (e) {
        console.error(e);
    }

    if (data) {

        const lines = StringUtils.splitLines(data);

        const parent = $(`#${ id }`);

        for (let line of lines) {

            const tokens = line.split('\t');
            if (tokens.length > 1) {
                const [ value, label ] = tokens;
                parent.append($(`<option data-url="${ value }">${ label }</option>`));
            }

        }

    }

};

function checkBDropdown() {
    updateBDropdown(hic.HICBrowser.getCurrentBrowser());
}

function updateBDropdown(browser) {
    if (browser) {
        if (browser.dataset) {
            $('#hic-control-map-dropdown').removeClass('disabled');
        } else {
            $('#hic-control-map-dropdown').addClass('disabled');
        }
    }
}

export default initializationHelper
