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
            {file: 'dist/js/site-bundle.esm.js', format: 'es'},
            {file: 'dist/js/site-bundle.esm.min.js', format: 'es', sourcemap: true},
        ],
        plugins: [
            strip({
                debugger: true,
                functions: ['console.log', 'assert.*', 'debug']
            }),
            terser({
                include: [/^.+\.min\.js$/],
                sourcemap: {
                    filename: "juicebox.esm.min.js",
                    url: "juicebox.esm.min.js.map"
                }}),
            copy({
                targets:
                    [
                        {src: 'node_modules/juicebox.js/dist/css/juicebox.css', dest: 'dist/css/'},
                        {src: 'node_modules/juicebox.js/dist/css/img', dest: 'dist/css/'}
                    ]
            })
        ]
    }
    // ,
    // {
    //     input: 'js/site.js',
    //     output: [
    //         {file: 'dist/js/site-bundle.js', format: 'umd', name: "hicSite"},
    //     ],
    //     plugins: [
    //         strip({
    //             debugger: true,
    //             functions: ['console.log', 'assert.*', 'debug']
    //         }),
    //         commonjs(),
    //         resolve(),
    //         babel(),
    //         // terser({
    //         //     include: [/^.+\.min\.js$/],
    //         //     sourcemap: {
    //         //         filename: "juicebox.min.js",
    //         //         url: "juicebox.min.js.map"
    //         //     }}),
    //         copy({
    //             targets:
    //                 [
    //                     {src: 'node_modules/juicebox.js/dist/css/juicebox.css', dest: 'dist/css/'},
    //                     {src: 'node_modules/juicebox.js/dist/css/img', dest: 'dist/css/'}
    //                 ]
    //         })
    //     ]
    // }
];
