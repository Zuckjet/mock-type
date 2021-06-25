import * as ts from "typescript";
import faker from 'faker';

import { Options, Output } from './type';
import { statSync } from "fs";

export function processFile(sourceFile: ts.SourceFile, options: Options, output: Output, traverseProperty?: string) {
  const processNode = (node: ts.Node) => {
    switch(node.kind) {
      
      case ts.SyntaxKind.InterfaceDeclaration:

        const p = (node as ts.InterfaceDeclaration).name.text;


        if (!isSpecificInterface(p, options) && !traverseProperty) {
          return;
        }

        if (traverseProperty) {
          if (p === traverseProperty) {
            traverseInterface(node, sourceFile, options, output, traverseProperty)
          }
        } else {
          traverseInterface(node, sourceFile, options, output)
        }
        break;

      case ts.SyntaxKind.SourceFile:
        traverseInterface(node, sourceFile, options, output)
        break;

      default:
        break;
    }

    ts.forEachChild(node, processNode)
  }

  processNode(sourceFile)
}

function traverseInterface(node: ts.Node, sourceFile: ts.SourceFile, options: Options, output: Output, traverseProperty?: string) {

  node.forEachChild(
    child => traverseInterfaceMembers(child, sourceFile, options, output)
  )
}

function traverseInterfaceMembers(node: ts.Node, sourceFile: ts.SourceFile, options: Options, output: Output) {

  if (node.kind !== ts.SyntaxKind.PropertySignature) {
    console.log(333333333)
    return;
  }

  const processPropertySignature = (node: ts.PropertySignature) => {
    let kind;
    let typeName = '';

    const property = node.name.getText();


    if (node.type) {
      kind = node.type.kind
      typeName = node.type.getText();
      console.log(typeName, 'typenamessssssss');
    }

    switch (kind) {
      case ts.SyntaxKind.TypeReference:
        processPropertyTypeReference(node, property, sourceFile, output, options, typeName, kind as ts.SyntaxKind);
        break;
      case ts.SyntaxKind.TypeLiteral:
        processTypeLiteral(node, property, sourceFile, output, options);
        break;
      default:
        processGenericPropertyType(node, options, property, kind as ts.SyntaxKind, output);
    }
  }

  processPropertySignature(node as ts.PropertySignature);

}


function processTypeLiteral(node: ts.PropertySignature, property: string, sourceFile: ts.SourceFile, output: Output, options: Options) {
  output[property] = {};

  const propertyNode = node.type as ts.Node;

  propertyNode.forEachChild(
    child => traverseInterfaceMembers(child, sourceFile, options, output[property])
  );
}




function processGenericPropertyType(node: ts.Node, options: Options, property: string, kind: ts.SyntaxKind, output: Output) {

  const value = generatePrimitive(property, kind)
  output[property] = value
}

function processPropertyTypeReference(node: ts.PropertySignature, property: string, sourceFile: ts.SourceFile, output: Output, options: Options, typeName: string, kind: ts.SyntaxKind) {

  let isArray = false;
  let normalizedTypeName: string = '';

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

function processArrayPropertyType(node: ts.PropertySignature, sourceFile: ts.SourceFile, output: Output, property: string, typeName: string, kind: ts.SyntaxKind, options: Options) {
  output[property] = resolveArrayType(sourceFile, node, property, typeName, kind, options)
}


function resolveArrayType(sourceFile: ts.SourceFile, node: ts.PropertySignature | ts.TypeNode, property: string, typeName: string, kind:ts.SyntaxKind, options: Options) {
  const result = [];

  // const isPrimitiveType = typeName === "string" || typeName === "number" || typeName === "boolean";

  if (ts.isTypeNode(node)) {
    kind = node.kind;
  } else if ((node.type as ts.TypeReferenceNode).typeArguments) {
    kind =(node.type as ts.TypeReferenceNode).typeArguments![0].kind
  }


  const isPrimitiveType = kind === ts.SyntaxKind.StringKeyword ||
      kind === ts.SyntaxKind.BooleanKeyword ||
      kind === ts.SyntaxKind.NumberKeyword;

      
  const round = Math.round(Math.random() * 10);

  for (let index = 0; index < round; index++) {
    if (isPrimitiveType) {
      result.push(generatePrimitive(property, kind))
    } else {
      const temp = {};
      processFile(sourceFile, options, temp, typeName);
      result.push(temp);
    }
  }

  return result;
}


function generatePrimitive(property: string, kind: ts.SyntaxKind): string | number {

  let result;

  console.log(kind)
  console.log('666')

  switch(kind) {
    case ts.SyntaxKind.StringKeyword:
      result = faker.fake('{{lorem.text}}');
      break;
    case ts.SyntaxKind.NumberKeyword:
      result = parseInt(faker.fake('{{datatype.number}}'), 10)
      break;
    default:
      result = ''
  }

  return result;
}

function isSpecificInterface(name: string, options: Options): boolean {
  if (options.interfaces.indexOf(name) === -1) {
    return false;
  }

  return true;
}

