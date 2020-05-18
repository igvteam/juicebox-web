import {Alert} from '../node_modules/igv-ui/src/index.js'
import {StringUtils, TrackUtils} from '../node_modules/igv-utils/src/index.js'
import { ModalTable } from '../node_modules/data-modal/js/index.js';
import { EncodeTrackDatasource, encodeTrackDatasourceConfigurator } from '../node_modules/data-modal/js/index.js';
import hic from "../node_modules/juicebox.js/dist/juicebox.esm.js";
import QRCode from "./qrcode.js";
import SessionController, {sessionControllerConfigurator} from "./sessionController.js";
import {googleEnabled} from './app.js';
import ContactMapLoad from "./contactMapLoad.js";
import TrackLoad from "./trackLoad.js";

// The igv object. TODO eliminate this dependency
const igv = hic.igv;

let currentGenomeId;
let sessionController;
let contactMapLoad;
let trackLoad;

const encodeModal = new ModalTable({
    id: 'hic-encode-modal', title: 'ENCODE', selectionStyle: 'multi', pageLength: 10, selectHandler: selected => {
        loadTracks(selected)
    }
});

async function initializationHelper(container, config) {

    Alert.init(container);

    $('.juicebox-app-clone-button').on('click', async () => {

        let browser = undefined;
        try {
            browser = await hic.createBrowser(container, {initFromUrl: false, updateHref: false});
        } catch (e) {
            console.error(e);
        }

        if (browser) {
            hic.HICBrowser.setCurrentBrowser(browser);
        }

    });

    const genomeChangeListener = {

        receiveEvent: async event => {
            const {data: genomeId} = event;

            if (currentGenomeId !== genomeId) {
                currentGenomeId = genomeId;
                if (config.trackMenu) {
                    let tracksURL = config.trackMenu.items.replace("$GENOME_ID", genomeId);
                    await loadAnnotationDatalist($(`#${config.trackMenu.id}`), tracksURL, "1D");
                }

                if (config.trackMenu2D) {
                    let annotations2dURL = config.trackMenu2D.items.replace("$GENOME_ID", genomeId);
                    await loadAnnotationDatalist($(`#${config.trackMenu2D.id}`), annotations2dURL, "2D");
                }

                if (EncodeTrackDatasource.supportsGenome(genomeId)) {
                    $('#hic-encode-modal-button').show();
                    encodeModal.setDatasource(new EncodeTrackDatasource(encodeTrackDatasourceConfigurator(genomeId)));
                } else {
                    $('#hic-encode-modal-button').hide();
                }
            }
        }
    };

    for (let browser of hic.allBrowsers) {
        browser.eventBus.subscribe("MapLoad", checkBDropdown);
        updateBDropdown(browser);
    }

    sessionController = new SessionController(sessionControllerConfigurator());

    $('#hic-track-dropdown-menu').parent().on('shown.bs.dropdown', function () {
        const browser = hic.HICBrowser.getCurrentBrowser();
        if (undefined === browser || undefined === browser.dataset) {
            Alert.presentAlert('Contact map must be loaded and selected before loading tracks');
        }
    });

    $('#hic-control-map-dropdown-menu').parent().on('shown.bs.dropdown', function () {
        const browser = hic.HICBrowser.getCurrentBrowser();
        if (undefined === browser || undefined === browser.dataset) {
            Alert.presentAlert('Contact map must be loaded and selected before loading "B" map"');
        }
    });



    const trackLoadConfig =
        {
            rootContainer: document.querySelector('#hic-main'),
            $localFileInput: $('#hic-local-track-file-input'),
            urlLoadModalId: 'track-load-url-modal',
            $dropboxButtons: $('#hic-track-dropdown-dropbox-button'),
            $googleDriveButtons: $('#hic-track-dropdown-google-drive-button'),
            googleEnabled,
            loadHandler: (configurations) => loadTracks(configurations)
        };

    trackLoad = new TrackLoad(trackLoadConfig);


    const $dropdownButtons = $('button[id$=-map-dropdown]');
    const $dropdowns = $dropdownButtons.parent();

    const contactMapLoadConfig =
        {
            rootContainer: document.querySelector('#hic-main'),
            $dropdowns,
            $localFileInputs: $dropdowns.find('input'),
            urlLoadModalId: 'hic-load-url-modal',
            dataModalId: 'hic-contact-map-modal',
            $encodeHostedModalPresentationButton: $('#hic-encode-hosted-contact-map-presentation-button'),
            encodeHostedModalId: 'hic-encode-hosted-contact-map-modal',
            $dropboxButtons: $dropdowns.find('div[id$="-map-dropdown-dropbox-button"]'),
            $googleDriveButtons: $dropdowns.find('div[id$="-map-dropdown-google-drive-button"]'),
            googleEnabled,
            mapMenu: config.mapMenu,
            loadHandler: (path, name, mapType) => loadHicFile(path, name, mapType)
        };

    contactMapLoad = new ContactMapLoad(contactMapLoadConfig);

    configureShareModal();

    hic.EventBus.globalBus.subscribe("GenomeChange", genomeChangeListener);

    hic.EventBus.globalBus.subscribe("BrowserSelect", function (event) {
        updateBDropdown(event.data);
    });

    // Must manually trigger the genome change event on initial load
    if (hic.HICBrowser.currentBrowser && hic.HICBrowser.currentBrowser.genome) {
        await genomeChangeListener.receiveEvent({data: hic.HICBrowser.currentBrowser.genome.id})
    }


    let qrcode = undefined;

    function configureShareModal() {

        const $hic_share_url_modal = $('#hic-share-url-modal');

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

                await window.twttr.widgets.createShareButton(shareUrl, tweetContainer.get(0), {text: 'Contact map: '});
                console.log("Tweet button updated");

                // QR code generation
                if (qrcode) {
                    qrcode.clear();
                    $('hic-qr-code-image').empty();
                } else {
                    qrcode = new QRCode(document.getElementById("hic-qr-code-image"), {
                        width: 128,
                        height: 128,
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }

                qrcode.makeCode(shareUrl);
            }

        });

        $hic_share_url_modal.on('hidden.bs.modal', function (e) {
            $('#hic-embed-container').hide();
            $('#hic-qr-code-image').hide();
        });

        $('#hic-qr-code-button').on('click', function (e) {
            $('#hic-embed-container').hide();
            $('#hic-qr-code-image').toggle();
        });

        $('#hic-embed-button').on('click', function (e) {
            $('#hic-qr-code-image').hide();
            $('#hic-embed-container').toggle();
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
    }
}

const appendAndConfigureLoadURLModal = (root, id, input_handler) => {

    const html =
        `<div id="${id}" class="modal fade">
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

    const $modal = $(root).find(`#${id}`);
    $modal.find('input').on('change', function () {

        const path = $(this).val();
        $(this).val("");

        $(`#${id}`).modal('hide');

        input_handler(path);


    });

    return html;
};

const createAnnotationDatalistModals = root => {

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

            let config = {url: path, name};

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
            loadTracks([{url: path, name}]);
        }

        $('#hic-annotation-2D-datalist-modal').modal('hide');
        $annotation_2D_input.val('');
    });

};

const createGenericDataListModal = (id, input_id, datalist_id, placeholder) => {

    const generic_select_modal_string =
        `<div id="${id}" class="modal">

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
                            <input type="text" id="${input_id}" list="${datalist_id}" placeholder="${placeholder}" class="form-control">
                            <datalist id="${datalist_id}"></datalist>
                        </div>
                    </div>

                </div>

            </div>

        </div>`;

    return generic_select_modal_string;
};

const loadAnnotationDatalist = async ($datalist, url, type) => {

    $datalist.empty();

    let data = undefined;

    try {
        data = await igv.xhr.loadString(url);
    } catch (e) {
        if (e.message.includes("404")) {
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

                const [label, value] = tokens;
                $datalist.append($(`<option data-url="${value}">${label}</option>`));

            }
        }
    }

};

function igvSupports(path) {

    // For now we will pretend that igv does not support bedpe, we want these loaded as 2D tracks
    if (path.endsWith(".bedpe") || path.endsWith(".bedpe.gz")) {
        return false;
    }

    let config = {url: path};
    TrackUtils.inferTrackTypes(config);
    return config.type !== undefined;

}

function loadTracks(tracks) {
    // Set some juicebox specific defaults
    for (let t of tracks) {
        t.autoscale = true;
        t.displayMode = "COLLAPSED"
    }
    hic.HICBrowser.getCurrentBrowser().loadTracks(tracks);
}

async function loadHicFile(url, name, mapType) {

    try {
        let browsersWithMaps = hic.allBrowsers.filter(browser => browser.dataset !== undefined);
        const isControl = ('control-map' === mapType);
        const browser = hic.HICBrowser.getCurrentBrowser();
        const config = {url, name, isControl};

        if (StringUtils.isString(url) && url.includes("?")) {
            const query = hic.extractQuery(url);
            const uriDecode = url.includes("%2C");
            hic.decodeQuery(query, config, uriDecode);
        }

        if (isControl) {
            await browser.loadHicControlFile(config)
        } else {
            browser.reset();
            browsersWithMaps = hic.allBrowsers.filter(browser => browser.dataset !== undefined);
            if (browsersWithMaps.length > 0) {


                config["synchState"] = browsersWithMaps[0].getSyncState();
            }
            await browser.loadHicFile(config);
            if (!isControl) {
                hic.syncBrowsers(hic.allBrowsers);
            }

            $('#hic-control-map-dropdown').removeClass('disabled');
        }
    } catch (e) {
        Alert.presentAlert(`Error loading ${url}: ${e}`);
    }
};

async function getEmbeddableSnippet($container, config) {
    const base = (config.embedTarget || getEmbedTarget())
    const embedUrl = await hic.shortJuiceboxURL(base);
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

function checkBDropdown() {
    updateBDropdown(hic.HICBrowser.getCurrentBrowser());
}

function updateBDropdown(browser) {
    if (browser) {
        if (browser.dataset) {
            $('#hic-control-map-dropdown').removeClass('disabled');
        } else {
      //      $('#hic-control-map-dropdown').addClass('disabled');
        }
    }
}

export {appendAndConfigureLoadURLModal, createAnnotationDatalistModals, loadHicFile, currentGenomeId }

export default initializationHelper
