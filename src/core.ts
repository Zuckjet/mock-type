import * as ts from 'typescript';
import faker from 'faker';
import path from 'path';
import { readFileSync } from 'fs';

import { Options, Output } from './type';
import {
  getSourceFileOfNode,
  generateAnyType,
  generateObject,
  getLiteralTypeValue,
} from './util';

const importedInterfaces = new Map();
const allReferencedFiles = new Map();
const supportedPrimitiveTypes: { [key: string]: boolean } = {
  [ts.SyntaxKind.NumberKeyword]: true,
  [ts.SyntaxKind.StringKeyword]: true,
  [ts.SyntaxKind.BooleanKeyword]: true,
  [ts.SyntaxKind.ObjectKeyword]: true,
  [ts.SyntaxKind.AnyKeyword]: true,
};

let basicReferenceValue: number | string | boolean = '';

export function processFile(
  sourceFile: ts.SourceFile,
  options: Options,
  output: Output,
  traverseProperty?: string
) {
  const processNode = (node: ts.Node) => {
    switch (node.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
        const p = (node as ts.InterfaceDeclaration).name.text;
        if (!isSpecificInterface(p, options) && !traverseProperty) {
          return;
        }

        if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
          node = (node as ts.TypeAliasDeclaration).type;
          if (p !== traverseProperty) {
            return;
          }
          if (node.kind === ts.SyntaxKind.NumberKeyword) {
            basicReferenceValue = parseInt(
              faker.fake('{{datatype.number}}'),
              10
            );
            return;
          } else if (node.kind === ts.SyntaxKind.StringKeyword) {
            basicReferenceValue = faker.fake('{{lorem.text}}').substring(0, 50);
            return;
          } else if (node.kind === ts.SyntaxKind.BooleanKeyword) {
            basicReferenceValue = JSON.parse(
              faker.fake('{{datatype.boolean}}')
            );
            return;
          }
        }
        if (traverseProperty) {
          if (p === traverseProperty) {
            traverseInterface(
              node,
              sourceFile,
              options,
              output,
              traverseProperty
            );
          }
        } else {
          traverseInterface(node, sourceFile, options, output);
        }
        break;

      case ts.SyntaxKind.SourceFile:
        // traverseInterface(node, sourceFile, options, output)
        break;

      case ts.SyntaxKind.ImportDeclaration:
        processImportDeclaration(node as ts.ImportDeclaration, output);
        break;

      case ts.SyntaxKind.EnumDeclaration:
        const property = (node as ts.EnumDeclaration).name.text;
        if (traverseProperty) {
          if (
            property === traverseProperty ||
            (traverseProperty.split('.').length > 1 &&
              traverseProperty.split('.')[0] === property)
          ) {
            processEnum(
              node as ts.EnumDeclaration,
              sourceFile,
              options,
              output,
              traverseProperty
            );
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

function processEnum(
  node: ts.EnumDeclaration,
  sourceFile: ts.SourceFile,
  options: Options,
  output: Output,
  traverseProperty: string
) {
  if (traverseProperty.split('.').length > 1) {
    const targetMember = node.members.find((element) => {
      return element.name.getText() === traverseProperty.split('.')[1];
    });
    if (
      targetMember?.initializer &&
      targetMember.initializer.kind === ts.SyntaxKind.StringLiteral
    ) {
      basicReferenceValue = faker.fake('{{lorem.text}}').substring(0, 50);
    } else {
      basicReferenceValue = parseInt(faker.fake('{{datatype.number}}'), 10);
    }
  } else {
    const values: Array<string | number> = [];
    node.members.find((element) => {
      if (
        element.initializer &&
        element.initializer.kind === ts.SyntaxKind.StringLiteral
      ) {
        values.push(faker.fake('{{lorem.text}}').substring(0, 50));
        return true;
      }
    });
    node.members.find((element) => {
      if (
        !element.initializer ||
        (element.initializer &&
          element.initializer.kind === ts.SyntaxKind.NumericLiteral)
      ) {
        values.push(parseInt(faker.fake('{{datatype.number}}'), 10));
        return true;
      }
    });
    basicReferenceValue = faker.random.arrayElement(values);
  }
}

function traverseInterface(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  options: Options,
  output: Output,
  traverseProperty?: string
) {
  node.forEachChild((child) =>
    traverseInterfaceMembers(child, sourceFile, options, output)
  );
}

function traverseInterfaceMembers(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  options: Options,
  output: Output
) {
  const processPropertySignature = (
    node: ts.PropertySignature | ts.IndexSignatureDeclaration
  ) => {
    let kind;
    let typeName = '';
    let property = '';

    if (node.kind === ts.SyntaxKind.PropertySignature) {
      property = node.name.getText();
    } else {
      const propertyType = node.parameters[0].getText().split(':')[1].trim();
      property =
        propertyType === 'string'
          ? faker.random.word()
          : faker.fake('{{datatype.number}}');
    }

    if (node.type) {
      kind = node.type.kind;
      typeName = node.type.getText();
      // if (typeName === 'Type.first') typeName = 'Type';
    }

    switch (kind) {
      case ts.SyntaxKind.TypeReference:
        processPropertyTypeReference(
          node as ts.PropertySignature,
          property,
          sourceFile,
          output,
          options,
          typeName,
          kind as ts.SyntaxKind
        );
        break;
      case ts.SyntaxKind.TypeLiteral:
        processTypeLiteral(
          node as ts.PropertySignature,
          property,
          sourceFile,
          output,
          options
        );
        break;
      case ts.SyntaxKind.UnionType:
        processUnionType(
          node as ts.PropertySignature,
          property,
          sourceFile,
          output,
          options
        );
        break;
      case ts.SyntaxKind.ArrayType:
        typeName = typeName.replace('[', '').replace(']', '');
        processArrayPropertyType(
          node as ts.PropertySignature,
          sourceFile,
          output,
          property,
          typeName,
          kind,
          options
        );
        break;
      default:
        processGenericPropertyType(
          node,
          options,
          property,
          kind as ts.SyntaxKind,
          output
        );
    }
  };

  if (node.kind === ts.SyntaxKind.PropertySignature) {
    processPropertySignature(node as ts.PropertySignature);
  } else if (node.kind === ts.SyntaxKind.IndexSignature) {
    processPropertySignature(node as ts.IndexSignatureDeclaration);
  } else {
    // don't support this type at right now
  }
}

function processUnionType(
  node: ts.PropertySignature,
  property: string,
  sourceFile: ts.SourceFile,
  output: Output,
  options: Options
) {
  const unionNodes =
    node && node.type
      ? ((node.type as ts.UnionTypeNode).types as ts.NodeArray<ts.TypeNode>)
      : [];
  const selectedType = faker.random.arrayElement(unionNodes);
  if (supportedPrimitiveTypes[selectedType.kind]) {
    output[property] = generatePrimitive(property, selectedType.kind);
  } else if (selectedType.kind === ts.SyntaxKind.TypeReference) {
    const typeName = selectedType.getText();
    processPropertyTypeReference(
      node,
      property,
      sourceFile,
      output,
      options,
      typeName,
      selectedType.kind as ts.SyntaxKind
    );
  } else if (selectedType.kind === ts.SyntaxKind.LiteralType) {
    output[property] = getLiteralTypeValue(selectedType as ts.LiteralTypeNode);
  } else {
    // ...
  }
}

function processTypeLiteral(
  node: ts.PropertySignature,
  property: string,
  sourceFile: ts.SourceFile,
  output: Output,
  options: Options
) {
  output[property] = {};

  const propertyNode = node.type as ts.Node;

  propertyNode.forEachChild((child) =>
    traverseInterfaceMembers(child, sourceFile, options, output[property])
  );
}

function processGenericPropertyType(
  node: ts.Node,
  options: Options,
  property: string,
  kind: ts.SyntaxKind,
  output: Output
) {
  const value = generatePrimitive(property, kind);
  output[property] = value;
}

function processPropertyTypeReference(
  node: ts.PropertySignature,
  property: string,
  sourceFile: ts.SourceFile,
  output: Output,
  options: Options,
  typeName: string,
  kind: ts.SyntaxKind
) {
  let isArray = false;
  let normalizedTypeName = '';

  if (typeName.startsWith('Array<')) {
    isArray = true;
    normalizedTypeName = typeName
      .replace(/(Array|IterableArray)\</, '')
      .replace('>', '');
  }

  if (isArray) {
    processArrayPropertyType(
      node,
      sourceFile,
      output,
      property,
      normalizedTypeName,
      kind,
      options
    );
    return;
  }

  output[property] = {};

  if (importedInterfaces.get(typeName)) {
    const options: Options = {
      file: importedInterfaces.get(typeName),
      interfaces: typeName.split(' '),
    };

    processFile(
      allReferencedFiles.get(importedInterfaces.get(typeName)),
      options,
      output[property],
      typeName
    );
  } else {
    processFile(sourceFile, options, output[property], typeName);
    if (basicReferenceValue) {
      output[property] = basicReferenceValue;
      basicReferenceValue = '';
    }
  }
}

function processArrayPropertyType(
  node: ts.PropertySignature,
  sourceFile: ts.SourceFile,
  output: Output,
  property: string,
  typeName: string,
  kind: ts.SyntaxKind,
  options: Options
) {
  output[property] = resolveArrayType(
    sourceFile,
    node,
    property,
    typeName,
    kind,
    options
  );
}

function resolveArrayType(
  sourceFile: ts.SourceFile,
  node: ts.PropertySignature | ts.TypeNode,
  property: string,
  typeName: string,
  kind: ts.SyntaxKind,
  options: Options
) {
  const result = [];

  // const isPrimitiveType = typeName === "string" || typeName === "number" || typeName === "boolean";

  if (ts.isTypeNode(node)) {
    kind = node.kind;
  } else if ((node.type as ts.TypeReferenceNode).typeArguments) {
    kind = (node.type as ts.TypeReferenceNode).typeArguments![0].kind;
  } else if ((node.type as ts.ArrayTypeNode).elementType) {
    kind = (node.type as ts.ArrayTypeNode).elementType.kind;
  } else {
    // ...
  }

  const isPrimitiveType =
    kind === ts.SyntaxKind.StringKeyword ||
    kind === ts.SyntaxKind.BooleanKeyword ||
    kind === ts.SyntaxKind.NumberKeyword;

  const round = Math.floor(Math.random() * 10) + 1; // 1 ~ 10

  for (let index = 0; index < round; index++) {
    if (isPrimitiveType) {
      result.push(generatePrimitive(property, kind));
    } else {
      const temp = {};

      if (importedInterfaces.get(typeName)) {
        const options: Options = {
          file: importedInterfaces.get(typeName),
          interfaces: typeName.split(' '),
        };

        processFile(
          allReferencedFiles.get(importedInterfaces.get(typeName)),
          options,
          temp,
          typeName
        );
      } else {
        processFile(sourceFile, options, temp, typeName);
      }

      // processFile(sourceFile, options, temp, typeName);
      result.push(temp);
    }
  }

  return result;
}

function generatePrimitive(
  property: string,
  kind: ts.SyntaxKind
): string | number {
  let result;

  switch (kind) {
    case ts.SyntaxKind.StringKeyword:
      result = faker.fake('{{lorem.text}}').substring(0, 50);
      break;
    case ts.SyntaxKind.NumberKeyword:
      result = parseInt(faker.fake('{{datatype.number}}'), 10);
      break;
    case ts.SyntaxKind.BooleanKeyword:
      result = JSON.parse(faker.fake('{{datatype.boolean}}'));
      break;
    case ts.SyntaxKind.ObjectKeyword:
      result = generateObject();
      break;
    case ts.SyntaxKind.AnyKeyword:
      result = generateAnyType();
      break;
    default:
      result = '';
  }

  return result;
}

function isSpecificInterface(name: string, options: Options): boolean {
  if (options.interfaces.indexOf(name) === -1) {
    return false;
  }

  return true;
}

function processImportDeclaration(node: ts.ImportDeclaration, output: Output) {
  const originalFile = getSourceFileOfNode(node);
  const moduleReference = ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : '';
  const filePath = path.resolve(
    originalFile.fileName.substring(0, originalFile.fileName.lastIndexOf('/')),
    moduleReference + '.ts'
  );

  const namedBindings = node.importClause?.namedBindings;
  if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
    for (const element of namedBindings.elements) {
      const name = element.name.escapedText;
      importedInterfaces.set(name, filePath);
    }
  }

  if (!allReferencedFiles.get(filePath)) {
    const sourceFile = ts.createSourceFile(
      filePath,
      readFileSync(filePath).toString(),
      ts.ScriptTarget.ES2015,
      true
    );

    allReferencedFiles.set(filePath, sourceFile);
  }
}
