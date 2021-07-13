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
var ts = __importStar(require("typescript"));
var faker_1 = __importDefault(require("faker"));
var path_1 = __importDefault(require("path"));
var fs_1 = require("fs");
var util_1 = require("./util");
var importedInterfaces = new Map();
var allReferencedFiles = new Map();
function processFile(sourceFile, options, output, traverseProperty) {
    var processNode = function (node) {
        switch (node.kind) {
            case ts.SyntaxKind.InterfaceDeclaration:
                var p = node.name.text;
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
    node.forEachChild(function (child) { return traverseInterfaceMembers(child, sourceFile, options, output); });
}
function traverseInterfaceMembers(node, sourceFile, options, output) {
    if (node.kind !== ts.SyntaxKind.PropertySignature) {
        return;
    }
    var processPropertySignature = function (node) {
        var kind;
        var typeName = '';
        var property = node.name.getText();
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
            default:
                processGenericPropertyType(node, options, property, kind, output);
        }
    };
    processPropertySignature(node);
}
function processTypeLiteral(node, property, sourceFile, output, options) {
    output[property] = {};
    var propertyNode = node.type;
    propertyNode.forEachChild(function (child) { return traverseInterfaceMembers(child, sourceFile, options, output[property]); });
}
function processGenericPropertyType(node, options, property, kind, output) {
    var value = generatePrimitive(property, kind);
    output[property] = value;
}
function processPropertyTypeReference(node, property, sourceFile, output, options, typeName, kind) {
    var isArray = false;
    var normalizedTypeName = '';
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
        var options_1 = {
            file: importedInterfaces.get(typeName),
            interfaces: typeName.split(' ')
        };
        processFile(allReferencedFiles.get(importedInterfaces.get(typeName)), options_1, output[property], typeName);
    }
    processFile(sourceFile, options, output[property], typeName);
}
function processArrayPropertyType(node, sourceFile, output, property, typeName, kind, options) {
    output[property] = resolveArrayType(sourceFile, node, property, typeName, kind, options);
}
function resolveArrayType(sourceFile, node, property, typeName, kind, options) {
    var result = [];
    // const isPrimitiveType = typeName === "string" || typeName === "number" || typeName === "boolean";
    if (ts.isTypeNode(node)) {
        kind = node.kind;
    }
    else if (node.type.typeArguments) {
        kind = node.type.typeArguments[0].kind;
    }
    var isPrimitiveType = kind === ts.SyntaxKind.StringKeyword ||
        kind === ts.SyntaxKind.BooleanKeyword ||
        kind === ts.SyntaxKind.NumberKeyword;
    var round = Math.round(Math.random() * 10);
    for (var index = 0; index < round; index++) {
        if (isPrimitiveType) {
            result.push(generatePrimitive(property, kind));
        }
        else {
            var temp = {};
            processFile(sourceFile, options, temp, typeName);
            result.push(temp);
        }
    }
    return result;
}
function generatePrimitive(property, kind) {
    var result;
    switch (kind) {
        case ts.SyntaxKind.StringKeyword:
            result = faker_1.default.fake('{{lorem.text}}');
            break;
        case ts.SyntaxKind.NumberKeyword:
            result = parseInt(faker_1.default.fake('{{datatype.number}}'), 10);
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
    var _a;
    var originalFile = util_1.getSourceFileOfNode(node);
    var moduleReference = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '';
    var filePath = path_1.default.resolve(originalFile.fileName.substring(0, originalFile.fileName.lastIndexOf('/')), moduleReference + '.ts');
    var namedBindings = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
    if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
        for (var _i = 0, _b = namedBindings.elements; _i < _b.length; _i++) {
            var element = _b[_i];
            var name_1 = element.name.escapedText;
            importedInterfaces.set(name_1, filePath);
        }
    }
    if (!allReferencedFiles.get(filePath)) {
        var sourceFile = ts.createSourceFile(filePath, fs_1.readFileSync(filePath).toString(), ts.ScriptTarget.ES2015, true);
        allReferencedFiles.set(filePath, sourceFile);
    }
}