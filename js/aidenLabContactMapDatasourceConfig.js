
const configuration =
    {
    isJSON: true,
    columns:
        [
            'url',
            'NVI',
            'name',
            'author',
            'journal',
            'year',
            'organism',
            'reference genome',
            'cell type',
            'experiment type',
            'protocol'
        ],
    filter
    }

const aidenLabContactMapDatasourceConfigurator = url => {
    return { url, ...configuration }
}

function filter( url, obj ) {

    const cooked = {}

    Object.assign(cooked, obj)

    for (let key of configuration.columns) {
        cooked[ key ] = cooked[ key ] || '-'
    }

    const output = {}
    Object.assign(output, cooked)

    output[ 'url' ] = '-' === cooked[ 'NVI' ] ? `${ url }` : `${ url }?nvi=${ cooked[ 'NVI' ] }`

    return output

}

const DEPRICATED_parser = (record, columnDictionary, addIndexColumn) => {

    return Object.entries(record).map(([ path, record ], i) => {

        const cooked = {};
        Object.assign(cooked, record);

        for (let key of Object.keys(columnDictionary)) {
            cooked[ key ] = cooked[ key ] || '-';
        }

        const output = {};
        Object.assign(output, cooked);

        output['url'] = '-' === cooked[ 'NVI' ] ? `${ path }` : `${ path }?nvi=${ cooked[ 'NVI' ] }`;

        if (true === addIndexColumn) {
            output['index'] = i;
        }

        return output;
    });

};

export { aidenLabContactMapDatasourceConfigurator }
