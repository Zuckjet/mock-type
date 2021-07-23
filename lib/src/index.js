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
const fs_1 = require("fs");
const ts = __importStar(require("typescript"));
const command_line_args_1 = __importDefault(require("command-line-args"));
const core_1 = require("./core");
const option_1 = require("./option");
const util_1 = require("./util");
let output = {};
const outputs = [];
function main() {
    const options = command_line_args_1.default(option_1.optionDefinitions);
    if (util_1.isWelcomeMessageNeeded(options)) {
        util_1.showWelcomeMessage();
        return;
    }
    const sourceFile = ts.createSourceFile(options.file, fs_1.readFileSync(options.file).toString(), ts.ScriptTarget.ES2015, true);
    if (options.repeat) {
        for (let i = 0; i < options.repeat; i++) {
            core_1.processFile(sourceFile, options, output);
            outputs.push(output);
            output = {};
        }
    }
    else {
        core_1.processFile(sourceFile, options, output);
    }
    if (!options.silence) {
        if (options.repeat) {
            console.log(JSON.stringify(outputs));
        }
        else {
            console.log(JSON.stringify(output));
        }
    }
    if (options.outFile) {
        util_1.writeToFile(options, options.repeat ? outputs : output);
    }
}
main();
