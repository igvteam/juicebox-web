import copy from 'rollup-plugin-copy'

export default [
    {
        //input: 'test/testBabel.js',
        input: 'js/app.js',
        output: [
            {file: 'dist/js/app-bundle.esm.js', format: 'es'},
        ],
        plugins: [
            copy({
                targets:
                    [
                        {src: 'node_modules/juicebox.js/dist/css/juicebox.css', dest: 'dist/css/'},
                        {src: 'node_modules/juicebox.js/dist/css/img', dest: 'dist/css/'},
                        {src: 'css/app.css', dest: 'dist/css/'}
                    ]
            })
        ]
    }
];
