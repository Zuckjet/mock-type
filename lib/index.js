"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var ts = __importStar(require("typescript"));
var command_line_args_1 = __importDefault(require("command-line-args"));
var lib_1 = require("./lib");
var output = {};
var optionDefinitions = [
    {
        name: 'file',
        alias: 'f',
        type: String,
    },
    { name: 'interfaces', alias: 'i', type: String, multiple: true },
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'fixed', alias: 'x', type: Boolean },
    { name: 'outputFormat', alias: 'o', type: String },
];
function main() {
    var options = command_line_args_1.default(optionDefinitions);
    var sourceFile = ts.createSourceFile(options.file, fs_1.readFileSync(options.file).toString(), ts.ScriptTarget.ES2015, true);
    lib_1.processFile(sourceFile, options, output);
    console.log(output);
}
main();
