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
exports.getLiteralTypeValue = exports.generateObject = exports.generateAnyType = exports.writeToFile = exports.format = exports.getSourceFileOfNode = exports.showWelcomeMessage = exports.isWelcomeMessageNeeded = void 0;
const ts = __importStar(require("typescript"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const fs_1 = require("fs");
const faker_1 = __importDefault(require("faker"));
const option_1 = require("./option");
function isWelcomeMessageNeeded(options) {
    if (!options || !options.file || options.help) {
        return true;
    }
    return false;
}
exports.isWelcomeMessageNeeded = isWelcomeMessageNeeded;
function showWelcomeMessage() {
    const usage = command_line_usage_1.default(option_1.instructions);
    console.log(usage);
}
exports.showWelcomeMessage = showWelcomeMessage;
function getSourceFileOfNode(node) {
    while (node && node.kind !== ts.SyntaxKind.SourceFile) {
        node = node.parent;
    }
    return node;
}
exports.getSourceFileOfNode = getSourceFileOfNode;
function format(text) {
    return text.replace(/"([^"]+)":/g, '$1:').replace(/"/g, `'`);
}
exports.format = format;
function writeToFile(options, output) {
    const commentLine = `// THIS IS GENERATED BY TS-MOCK, DON'T EDIT IT \r\n`;
    const text = `${commentLine}export default ${JSON.stringify(output, null, 2)}`;
    fs_1.writeFile(options.outFile, options.format ? format(text) : text, (error) => {
        if (error) {
            console.log(error);
        }
    });
}
exports.writeToFile = writeToFile;
function generateAnyType() {
    const values = [...generateBasicValues(), generateObject()];
    return faker_1.default.random.arrayElement(values);
}
exports.generateAnyType = generateAnyType;
function generateObject() {
    const objectKey = faker_1.default.random.word();
    const object = {
        [objectKey]: faker_1.default.random.arrayElement(generateBasicValues()),
    };
    return object;
}
exports.generateObject = generateObject;
function getLiteralTypeValue(node) {
    const { literal } = node;
    // Boolean Literal
    if (literal.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    }
    else if (literal.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
        // String Literal
    }
    else if (literal.kind === ts.SyntaxKind.StringLiteral) {
        return literal.text ? literal.text : '';
        // Numeric Literal
    }
    else {
        // The text IS a string, but the output value has to be a numeric value
        return Number(literal.text);
    }
}
exports.getLiteralTypeValue = getLiteralTypeValue;
function generateBasicValues() {
    const booleanItem = JSON.parse(faker_1.default.fake('{{datatype.boolean}}'));
    const numberItem = parseInt(faker_1.default.fake('{{datatype.number}}'), 10);
    const stringItem = faker_1.default.fake('{{lorem.text}}').substring(0, 50);
    return [booleanItem, numberItem, stringItem];
}
