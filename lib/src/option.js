"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instructions = exports.optionDefinitions = void 0;
exports.optionDefinitions = [
    { name: 'file', alias: 'f', type: String },
    { name: 'interfaces', alias: 'i', type: String, multiple: true },
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'fixed', alias: 'x', type: Boolean },
    { name: 'outFile', alias: 'o', type: String },
    { name: 'format', alias: 'm', type: Boolean },
    { name: 'silence', alias: 's', type: Boolean },
    { name: 'repeat', alias: 'r', type: Number },
];
exports.instructions = [
    {
        content: 'mock-type',
        raw: true,
    },
    {
        header: '',
        content: 'Generates fake data from TypeScript interfaces via Faker',
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'interfaces',
                typeLabel: 'example: --interfaces "Person" "User"',
                description: 'Optional list of interfaces to mock, right now only support one interface',
            },
            {
                name: 'file',
                typeLabel: 'example: ./model.ts',
                description: 'Interface file to generate fake data from',
            },
            {
                name: 'outdir',
                typeLabel: 'example ./mock',
                description: 'Default directory will be mock under current path',
            },
            {
                name: 'help',
                description: 'Print this usage guide.',
            },
            {
                name: 'format',
                description: 'Format generated file',
            },
            {
                name: 'silence',
                description: `Don't print mock data to terminal`,
            },
            {
                name: 'repeat',
                description: 'Repeat result as array',
            },
        ],
    },
];
