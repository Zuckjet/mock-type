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
exports.processFile = void 0;
const ts = __importStar(require("typescript"));
const faker_1 = __importDefault(require("faker"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const util_1 = require("./util");
const importedInterfaces = new Map();
const allReferencedFiles = new Map();
const supportedPrimitiveTypes = {
    [ts.SyntaxKind.NumberKeyword]: true,
    [ts.SyntaxKind.StringKeyword]: true,
    [ts.SyntaxKind.BooleanKeyword]: true,
    [ts.SyntaxKind.ObjectKeyword]: true,
    [ts.SyntaxKind.AnyKeyword]: true,
};
function processFile(sourceFile, options, output, traverseProperty) {
    const processNode = (node) => {
        switch (node.kind) {
            case ts.SyntaxKind.InterfaceDeclaration:
                const p = node.name.text;
                if (!isSpecificInterface(p, options) && !traverseProperty) {
                    return;
                }
                if (traverseProperty) {
                    if (p === traverseProperty) {
                        traverseInterface(node, sourceFile, options, output, traverseProperty);
                    }
                }
                else {
                    traverseInterface(node, sourceFile, options, output);
                }
                break;
            case ts.SyntaxKind.SourceFile:
                // traverseInterface(node, sourceFile, options, output)
                break;
            case ts.SyntaxKind.ImportDeclaration:
                processImportDeclaration(node, output);
                break;
            default:
                break;
        }
        ts.forEachChild(node, processNode);
    };
    processNode(sourceFile);
}
exports.processFile = processFile;
function traverseInterface(node, sourceFile, options, output, traverseProperty) {
    node.forEachChild(child => traverseInterfaceMembers(child, sourceFile, options, output));
}
function traverseInterfaceMembers(node, sourceFile, options, output) {
    if (node.kind !== ts.SyntaxKind.PropertySignature) {
        return;
    }
    const processPropertySignature = (node) => {
        let kind;
        let typeName = '';
        const property = node.name.getText();
        if (node.type) {
            kind = node.type.kind;
            typeName = node.type.getText();
        }
        switch (kind) {
            case ts.SyntaxKind.TypeReference:
                processPropertyTypeReference(node, property, sourceFile, output, options, typeName, kind);
                break;
            case ts.SyntaxKind.TypeLiteral:
                processTypeLiteral(node, property, sourceFile, output, options);
                break;
            case ts.SyntaxKind.UnionType:
                processUnionType(node, property, sourceFile, output, options);
                break;
            default:
                processGenericPropertyType(node, options, property, kind, output);
        }
    };
    processPropertySignature(node);
}
function processUnionType(node, property, sourceFile, output, options) {
    const unionNodes = node && node.type ? node.type.types : [];
    const selectedType = faker_1.default.random.arrayElement(unionNodes);
    if (supportedPrimitiveTypes[selectedType.kind]) {
        output[property] = generatePrimitive(property, selectedType.kind);
    }
    else {
        console.log('do not support');
        const typeName = selectedType.getText();
        processPropertyTypeReference(node, property, sourceFile, output, options, typeName, selectedType.kind);
    }
}
function processTypeLiteral(node, property, sourceFile, output, options) {
    output[property] = {};
    const propertyNode = node.type;
    propertyNode.forEachChild(child => traverseInterfaceMembers(child, sourceFile, options, output[property]));
}
function processGenericPropertyType(node, options, property, kind, output) {
    const value = generatePrimitive(property, kind);
    output[property] = value;
}
function processPropertyTypeReference(node, property, sourceFile, output, options, typeName, kind) {
    let isArray = false;
    let normalizedTypeName = '';
    if (typeName.startsWith('Array<')) {
        isArray = true;
        normalizedTypeName = typeName.replace(/(Array|IterableArray)\</, '').replace('>', '');
    }
    if (isArray) {
        processArrayPropertyType(node, sourceFile, output, property, normalizedTypeName, kind, options);
        return;
    }
    output[property] = {};
    if (importedInterfaces.get(typeName)) {
        const options = {
            file: importedInterfaces.get(typeName),
            interfaces: typeName.split(' ')
        };
        processFile(allReferencedFiles.get(importedInterfaces.get(typeName)), options, output[property], typeName);
    }
    processFile(sourceFile, options, output[property], typeName);
}
function processArrayPropertyType(node, sourceFile, output, property, typeName, kind, options) {
    output[property] = resolveArrayType(sourceFile, node, property, typeName, kind, options);
}
function resolveArrayType(sourceFile, node, property, typeName, kind, options) {
    const result = [];
    // const isPrimitiveType = typeName === "string" || typeName === "number" || typeName === "boolean";
    if (ts.isTypeNode(node)) {
        kind = node.kind;
    }
    else if (node.type.typeArguments) {
        kind = node.type.typeArguments[0].kind;
    }
    const isPrimitiveType = kind === ts.SyntaxKind.StringKeyword ||
        kind === ts.SyntaxKind.BooleanKeyword ||
        kind === ts.SyntaxKind.NumberKeyword;
    const round = Math.round(Math.random() * 10);
    for (let index = 0; index < round; index++) {
        if (isPrimitiveType) {
            result.push(generatePrimitive(property, kind));
        }
        else {
            const temp = {};
            processFile(sourceFile, options, temp, typeName);
            result.push(temp);
        }
    }
    return result;
}
function generatePrimitive(property, kind) {
    let result;
    switch (kind) {
        case ts.SyntaxKind.StringKeyword:
            result = faker_1.default.fake('{{lorem.text}}').substring(0, 50);
            break;
        case ts.SyntaxKind.NumberKeyword:
            result = parseInt(faker_1.default.fake('{{datatype.number}}'), 10);
            break;
        case ts.SyntaxKind.BooleanKeyword:
            result = JSON.parse(faker_1.default.fake('{{datatype.boolean}}'));
            break;
        case ts.SyntaxKind.ObjectKeyword:
            result = util_1.generateObject();
            break;
        case ts.SyntaxKind.AnyKeyword:
            result = util_1.generateAnyType();
            break;
        default:
            result = '';
    }
    return result;
}
function isSpecificInterface(name, options) {
    if (options.interfaces.indexOf(name) === -1) {
        return false;
    }
    return true;
}
function processImportDeclaration(node, output) {
    const originalFile = util_1.getSourceFileOfNode(node);
    const moduleReference = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '';
    const filePath = path_1.default.resolve(originalFile.fileName.substring(0, originalFile.fileName.lastIndexOf('/')), moduleReference + '.ts');
    const namedBindings = node.importClause?.namedBindings;
    if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
        for (const element of namedBindings.elements) {
            const name = element.name.escapedText;
            importedInterfaces.set(name, filePath);
        }
    }
    if (!allReferencedFiles.get(filePath)) {
        const sourceFile = ts.createSourceFile(filePath, fs_1.readFileSync(filePath).toString(), ts.ScriptTarget.ES2015, true);
        allReferencedFiles.set(filePath, sourceFile);
    }
}
