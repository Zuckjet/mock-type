import { readFileSync } from "fs";

import * as ts from "typescript";
import commandLineArgs from 'command-line-args';

import { processFile } from './lib'

import { Options, Output } from './type'

const output: Output = {};

const optionDefinitions = [
  {
    name: 'file',
    alias: 'f',
    type: String,
  },
  {name: 'interfaces', alias: 'i', type: String, multiple: true},
  {name: 'help', alias: 'h', type: Boolean},
  {name: 'fixed', alias: 'x', type: Boolean},
  {name: 'outputFormat', alias: 'o', type: String},
];


// ---------- begin --------------

function main() {
  const options: Options = commandLineArgs(optionDefinitions) as Options
  console.log(options)
  const sourceFile = ts.createSourceFile(
    options.file,
    readFileSync(options.file).toString(),
    ts.ScriptTarget.ES2015,
    true
  );

  // console.log(sourceFile)

  processFile(sourceFile, options, output)


  console.log(output)
}

main();
