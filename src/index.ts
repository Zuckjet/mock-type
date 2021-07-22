import { readFileSync, writeFile } from 'fs';
import * as ts from 'typescript';
import commandLineArgs from 'command-line-args';

import { processFile } from './core';
import { optionDefinitions } from './option';

import { Options, Output } from './type';
import {
  isWelcomeMessageNeeded,
  showWelcomeMessage,
  writeToFile,
} from './util';

let output: Output = {};
const outputs: Output[] = [];

function main() {
  const options: Options = commandLineArgs(optionDefinitions) as Options;

  if (isWelcomeMessageNeeded(options)) {
    showWelcomeMessage();
    return;
  }

  const sourceFile = ts.createSourceFile(
    options.file,
    readFileSync(options.file).toString(),
    ts.ScriptTarget.ES2015,
    true
  );

  if (options.repeat) {
    for (let i = 0; i < options.repeat; i++) {
      processFile(sourceFile, options, output);
      outputs.push(output);
      output = {};
    }
  } else {
    processFile(sourceFile, options, output);
  }

  if (!options.silence) {
    if (options.repeat) {
      console.log(JSON.stringify(outputs));
    } else {
      console.log(JSON.stringify(output));
    }
  }

  if (options.outFile) {
    writeToFile(options, options.repeat ? outputs : output);
  }
}

main();
