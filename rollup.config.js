import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import strip from 'rollup-plugin-strip';
import copy from 'rollup-plugin-copy'
import {terser} from "rollup-plugin-terser"

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
                        {src: 'node_modules/juicebox.js/dist/js/juicebox.min.js', dest: 'dist/js/'},
                        {src: 'node_modules/juicebox.js/dist/css/img', dest: 'dist/css/'},
                        {src: 'node_modules/juicebox.js/dist/embed.html', dest: 'dist/'},
                        {src: 'css/app.css', dest: 'dist/css/'},
                        {src: 'img', dest: 'dist/'},
                        {src: 'juiceboxConfig.js', dest: 'dist/'}
                    ]
            })
        ]
    },
    {
        input: 'js/app.js',
        output: [
            {file: 'dist/js/hic-app.js', format: 'umd', name: "hic-app"},
            {file: 'dist/js/hic-app.min.js', format: 'umd', name: "hic-app", sourcemap: true}
        ],
        plugins: [
            strip({
                debugger: true,
                functions: ['console.log', 'assert.*', 'debug']
            }),
            commonjs(),
            resolve(),
            babel(),
            terser({
                include: [/^.+\.min\.js$/],
                sourcemap: {
                    filename: "hic-app.min.js",
                    url: "hic-app.min.js.map"
                }}),

        ]
    }
];
