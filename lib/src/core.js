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
let basicReferenceValue = '';
function processFile(sourceFile, options, output, traverseProperty) {
    const processNode = (node) => {
        switch (node.kind) {
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
                const p = node.name.text;
                if (!isSpecificInterface(p, options) && !traverseProperty) {
                    return;
                }
                if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
                    node = node.type;
                    if (traverseProperty) {
                        if (p !== traverseProperty) {
                            return;
                        }
                    }
                    else {
                        traverseInterface(node, sourceFile, options, output);
                    }
                    if (node.kind === ts.SyntaxKind.NumberKeyword) {
                        basicReferenceValue = parseInt(faker_1.default.fake('{{datatype.number}}'), 10);
                        return;
                    }
                    else if (node.kind === ts.SyntaxKind.StringKeyword) {
                        basicReferenceValue = faker_1.default.fake('{{lorem.text}}').substring(0, 50);
                        return;
                    }
                    else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
                        basicReferenceValue = JSON.parse(faker_1.default.fake('{{datatype.boolean}}'));
                        return;
                    }
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
            case ts.SyntaxKind.EnumDeclaration:
                const property = node.name.text;
                if (traverseProperty) {
                    if (property === traverseProperty ||
                        (traverseProperty.split('.').length > 1 &&
                            traverseProperty.split('.')[0] === property)) {
                        processEnum(node, sourceFile, options, output, traverseProperty);
                    }
                }
                break;
            default:
                break;
        }
        ts.forEachChild(node, processNode);
    };
    processNode(sourceFile);
    return output;
}
exports.processFile = processFile;
function processEnum(node, sourceFile, options, output, traverseProperty) {
    if (traverseProperty.split('.').length > 1) {
        const targetMember = node.members.find((element) => {
            return element.name.getText() === traverseProperty.split('.')[1];
        });
        if (targetMember?.initializer &&
            targetMember.initializer.kind === ts.SyntaxKind.StringLiteral) {
            basicReferenceValue = faker_1.default.fake('{{lorem.text}}').substring(0, 50);
        }
        else {
            basicReferenceValue = parseInt(faker_1.default.fake('{{datatype.number}}'), 10);
        }
    }
    else {
        const values = [];
        node.members.find((element) => {
            if (element.initializer &&
                element.initializer.kind === ts.SyntaxKind.StringLiteral) {
                values.push(faker_1.default.fake('{{lorem.text}}').substring(0, 50));
                return true;
            }
        });
        node.members.find((element) => {
            if (!element.initializer ||
                (element.initializer &&
                    element.initializer.kind === ts.SyntaxKind.NumericLiteral)) {
                values.push(parseInt(faker_1.default.fake('{{datatype.number}}'), 10));
                return true;
            }
        });
        basicReferenceValue = faker_1.default.random.arrayElement(values);
    }
}
function traverseInterface(node, sourceFile, options, output, traverseProperty) {
    node.forEachChild((child) => traverseInterfaceMembers(child, sourceFile, options, output));
}
function traverseInterfaceMembers(node, sourceFile, options, output) {
    const processPropertySignature = (node) => {
        let kind = '';
        let typeName = '';
        let property = '';
        if (node.kind === ts.SyntaxKind.PropertySignature) {
            property = node.name.getText();
        }
        else {
            const propertyType = node.parameters[0].getText().split(':')[1].trim();
            property =
                propertyType === 'string'
                    ? faker_1.default.random.word()
                    : faker_1.default.fake('{{datatype.number}}');
        }
        if (node.type) {
            kind = node.type.kind;
            typeName = node.type.getText();
            // if (typeName === 'Type.first') typeName = 'Type';
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
            case ts.SyntaxKind.ArrayType:
                typeName = typeName.replace('[', '').replace(']', '');
                processArrayPropertyType(node, sourceFile, output, property, typeName, kind, options);
                break;
            case ts.SyntaxKind.IntersectionType:
                const types = typeName.split('&');
                types.forEach(type => {
                    processPropertyTypeReference(node, property, sourceFile, output, options, type.trim(), kind);
                });
                break;
            default:
                processGenericPropertyType(node, options, property, kind, output);
        }
    };
    if (node.kind === ts.SyntaxKind.PropertySignature) {
        processPropertySignature(node);
    }
    else if (node.kind === ts.SyntaxKind.IndexSignature) {
        processPropertySignature(node);
    }
    else {
        // don't support this type at right now
    }
}
function processUnionType(node, property, sourceFile, output, options) {
    const unionNodes = node && node.type
        ? node.type.types
        : [];
    const selectedType = faker_1.default.random.arrayElement(unionNodes);
    if (supportedPrimitiveTypes[selectedType.kind]) {
        output[property] = generatePrimitive(property, selectedType.kind);
    }
    else if (selectedType.kind === ts.SyntaxKind.TypeReference) {
        const typeName = selectedType.getText();
        processPropertyTypeReference(node, property, sourceFile, output, options, typeName, selectedType.kind);
    }
    else if (selectedType.kind === ts.SyntaxKind.LiteralType) {
        output[property] = util_1.getLiteralTypeValue(selectedType);
    }
    else {
        // ...
    }
}
function processTypeLiteral(node, property, sourceFile, output, options) {
    output[property] = {};
    const propertyNode = node.type;
    propertyNode.forEachChild((child) => traverseInterfaceMembers(child, sourceFile, options, output[property]));
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
        normalizedTypeName = typeName
            .replace(/(Array|IterableArray)\</, '')
            .replace('>', '');
    }
    if (isArray) {
        processArrayPropertyType(node, sourceFile, output, property, normalizedTypeName, kind, options);
        return;
    }
    output[property] = output[property] ? output[property] : {};
    if (importedInterfaces.get(typeName)) {
        const options = {
            file: importedInterfaces.get(typeName),
            interfaces: typeName.split(' '),
        };
        processFile(allReferencedFiles.get(importedInterfaces.get(typeName)), options, output[property], typeName);
    }
    else {
        processFile(sourceFile, options, output[property], typeName);
        if (basicReferenceValue) {
            output[property] = basicReferenceValue;
            basicReferenceValue = '';
        }
    }
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
    else if (node.type.elementType) {
        kind = node.type.elementType.kind;
    }
    else {
        // ...
    }
    const isPrimitiveType = kind === ts.SyntaxKind.StringKeyword ||
        kind === ts.SyntaxKind.BooleanKeyword ||
        kind === ts.SyntaxKind.NumberKeyword;
    const round = Math.floor(Math.random() * 10) + 1; // 1 ~ 10
    for (let index = 0; index < round; index++) {
        if (isPrimitiveType) {
            result.push(generatePrimitive(property, kind));
        }
        else {
            const temp = {};
            if (importedInterfaces.get(typeName)) {
                const options = {
                    file: importedInterfaces.get(typeName),
                    interfaces: typeName.split(' '),
                };
                processFile(allReferencedFiles.get(importedInterfaces.get(typeName)), options, temp, typeName);
            }
            else {
                processFile(sourceFile, options, temp, typeName);
            }
            // processFile(sourceFile, options, temp, typeName);
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
    const moduleReference = ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : '';
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
