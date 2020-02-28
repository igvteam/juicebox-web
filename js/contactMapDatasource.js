import { Alert } from '../node_modules/igv-ui/src/index.js'

const columns =
    [
        '-0-',
        '-1-',
        '-2-'
    ];

class ContactMapDatasource {

    constructor(path) {
        this.path = path;
    }

    async tableColumns() {
        return columns;
    }

    async tableData() {
        return fetchData(this.path);
    }
}

const fetchData = async path => {

    let response = undefined;
    try {
        response = await fetch(path);
    } catch (e) {
        Alert.presentAlert(e.message);
        return undefined;
    }

    if (response) {
        const data = await response.text();
        return parseData(data);
    } else {
        return undefined;
    }
};

const parseData = data => {

    const regex = /[ \t]+/;

    const lines = data.split('\n').filter(line => "" !== line);
    for (let line of lines) {

        const list = line.split(regex);
        const path = list.shift();

        const string = list.join(' ');
        const parts = string.split('|').map(part => part.trim());
        switch (parts.length) {
            case 1:
                console.log('String0 n/a n/a');
                break;
            case 2:
                console.log('String0 String1 n/a');
                break;
            case 3:
                console.log('String0 String1 String2');
                break;
            default:
                console.error('something is borked');
        }
    }
    return '';
};

export default ContactMapDatasource
