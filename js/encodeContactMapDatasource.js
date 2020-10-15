import { AlertSingleton } from '../node_modules/igv-widgets/dist/igv-widgets.js'

let columnDictionary = {};

const urlPrefix = 'https://www.encodeproject.org';

class EncodeContactMapDatasource {

    constructor($encodeHostedModalPresentationButton, genomeId) {

        this.$encodeHostedModalPresentationButton = $encodeHostedModalPresentationButton;

        this.$encodeHostedModalPresentationButton.removeClass('disabled');

        this.genomeId = genomeId;

        this.path = 'https://s3.amazonaws.com/igv.org.app/encode/hic/hic.txt';

    }

    async tableColumns() {
        return Object.keys(columnDictionary);
    }

    async tableData() {

        let response = undefined;

        try {
            response = await fetch(this.path);
        } catch (e) {
            this.$encodeHostedModalPresentationButton.addClass('disabled');
            AlertSingleton.present(`Unsupported assembly: ${this.genomeId}`);
            return undefined;
        }

        if (response) {

            const str = await response.text();

            const parsed = this.parseData(str);
            return parsed;
        }
    }

    parseData(str) {

        const lines = str.split('\n').filter(line => "" !== line);

        const columns = lines.shift().split('\t');
        columns.unshift('index');

        for (let string of columns) {
            columnDictionary[string] = string;
        }

        this.columnDefs =
            [
                {
                    targets: [Object.keys(columnDictionary).indexOf('index')], // Hide index
                    visible: false,
                    searchable: false
                },
                {
                    targets: [Object.keys(columnDictionary).indexOf('HREF')], // Hide HREF (URL)
                    visible: false,
                    searchable: false
                }

            ];

        const keys = Object.keys(columnDictionary);

        return lines.map((line, index) => {

            const values = line.split('\t');
            values.unshift(index)

            const obj = {};
            for (let key of keys) {
                obj[key] = values[keys.indexOf(key)]
                // obj[ key ] = '#%#'
            }

            return obj;
        });

    };

    tableSelectionHandler(selectionList) {
        const selection = selectionList[0];
        const url = `${urlPrefix}${selection["HREF"]}`;
        const name = selection["Description"]
        return {url, name};
    };

}

export default EncodeContactMapDatasource
