import * as ts from "typescript";

export function getSourceFileOfNode(node: ts.Node): ts.SourceFile {
  while (node && node.kind !== ts.SyntaxKind.SourceFile /* SourceFile */) {
    node = node.parent;
  }
  return <ts.SourceFile>node;
}

