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
                traverseInterface(node, sourceFile, options, output);
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
        console.log(333333333);
        return;
    }
    var processPropertySignature = function (node) {
        var kind;
        var typeName = '';
        var property = node.name.getText();
        if (node.type) {
            kind = node.type.kind;
            typeName = node.type.getText();
            console.log(typeName, 'typenamessssssss');
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
    console.log(kind);
    console.log('666');
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
