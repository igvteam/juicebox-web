
const configuration =
    {
    isJSON: true,
    columns:
        [
            // 'url',
            // 'NVI',
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
        parser: { parse: aidenLabParser}
    }

const aidenLabContactMapDatasourceConfigurator = url => {
    return { url, ...configuration }
}

function aidenLabParser( str ) {

    const results = Object.entries( JSON.parse(str) ).map(([ url, obj ]) => {

        const cooked = {}

        Object.assign(cooked, obj)

        for (let key of configuration.columns) {
            cooked[ key ] = cooked[ key ] || '-'
        }

        const output = {}
        Object.assign(output, cooked)

        output[ 'url' ] = '-' === cooked[ 'NVI' ] ? `${ url }` : `${ url }?nvi=${ cooked[ 'NVI' ] }`

        return output

    })

    return results

}

export { aidenLabContactMapDatasourceConfigurator }
