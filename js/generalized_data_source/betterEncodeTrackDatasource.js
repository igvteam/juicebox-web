import GenericMapDatasource from "./genericDataSource.js";
import getDataWrapper from './dataWrapper.js'

class BetterEncodeTrackDatasource extends GenericMapDatasource {

    constructor(config) {

        super(config)

        if (config.filter) {
            this.filter = config.filter
        }

        this.suffix = config.suffix || '.txt'
    }

    async tableData() {

        let response = undefined;

        try {
            const url = `${ this.urlPrefix }${ canonicalId(this.genomeId) }${ this.suffix }`
            response = await fetch(url);
        } catch (e) {
            console.error(e)
            return undefined;
        }

        if (response) {
            const str = await response.text();
            const records = parseTabData(str, this.filter, this.columnDictionary);
            records.sort(encodeSort)
            return records
        }

    }
}

function parseTabData(str, filter, columnDictionary) {

    const dataWrapper = getDataWrapper(str);

    dataWrapper.nextLine();  // Skip header

    const records = [];
    let line;

    const keys = Object.keys(columnDictionary);

    while (line = dataWrapper.nextLine()) {

        const record = {};

        const tokens = line.split("\t");

        for (let key of keys) {
            record[ key ] = tokens[ keys.indexOf(key) ]
        }

        // additions and edits
        record[ 'ExperimentID' ] = record[ 'Experiment' ].substr(13).replace("/", "")
        record['HREF'] = `${ this.dataSetPathPrefix }${ record['HREF'] }`
        record[ 'name' ] = constructName(record)

        if (undefined === filter || filter(record)) {
            records.push(record);
        }

    } // while(line)

    return records;
}

function constructName(record) {

    let name = record["Cell Type"] || "";

    if (record["Target"]) {
        name += " " + record["Target"];
    }
    if (record["Assay Type"].toLowerCase() !== "chip-seq") {
        name += " " + record["Assay Type"];
    }
    if (record["Bio Rep"]) {
        name += " " + record["Bio Rep"];
    }
    if (record["Tech Rep"]) {
        name += (record["Bio Rep"] ? ":" : " 0:") + record["Tech Rep"];
    }

    name += " " + record["Output Type"];

    name += " " + record["Accession"];

    return name

}

function encodeSort(a, b) {
    var aa1,
        aa2,
        cc1,
        cc2,
        tt1,
        tt2;

    aa1 = a['Assay Type'];
    aa2 = b['Assay Type'];
    cc1 = a['Biosample'];
    cc2 = b['Biosample'];
    tt1 = a['Target'];
    tt2 = b['Target'];

    if (aa1 === aa2) {
        if (cc1 === cc2) {
            if (tt1 === tt2) {
                return 0;
            } else if (tt1 < tt2) {
                return -1;
            } else {
                return 1;
            }
        } else if (cc1 < cc2) {
            return -1;
        } else {
            return 1;
        }
    } else {
        if (aa1 < aa2) {
            return -1;
        } else {
            return 1;
        }
    }
}

function canonicalId(genomeId) {

    switch(genomeId) {
        case "hg38":
            return "GRCh38"
        case "CRCh37":
            return "hg19"
        case "GRCm38":
            return "mm10"
        case "NCBI37":
            return "mm9"
        case "WBcel235":
            return "ce11"
        case "WS220":
            return "ce10"
        default:
            return genomeId
    }

}

export default BetterEncodeTrackDatasource
