const discard = 'ID Assembly Biosample AssayType Target BioRep TechRep OutputType Format Lab HREF Accession Experiment'

const encodeHostedTrackDatasourceConfigurator = genomeId => {

    const config =
        {
            columns: [
                'ID',
                'Assembly',
                'Biosample',
                'AssayType',
                'Target',
                'BioRep',
                'TechRep',
                'OutputType',
                'Format',
                'Lab',
                'HREF',
                'Accession',
                'Experiment'
                ]
        }
}

export { encodeHostedTrackDatasourceConfigurator }
