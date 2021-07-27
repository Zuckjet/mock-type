import 'mocha'
import {expect} from 'chai';
import * as ts from 'typescript';
import { readFileSync } from 'fs';

import { Options, Output } from '../src/type'

import { processFile } from '../src/core';

import { User } from './user';
import {Record} from './example-interface';

describe('mock-type', function() {

  const output: Output = {};

    const options:Options = {
      file: 'test/example-interface.ts',
      interfaces: ['Admin']
    }

    const sourceFile = ts.createSourceFile(
      options.file,
      readFileSync(options.file).toString(),
      ts.ScriptTarget.ES2015,
      true
    );

    processFile(sourceFile, options, output);


    console.log(output)


  it('should support basic string:', function() {
    expect(typeof(output.basicString)).to.equal('string');
  });

  it('should support basic number:', function() {
    expect(typeof(output.basicNumber)).to.equal('number');
  });

  it('should support type reference:', function() {
    expect(typeof(output.typeReference.title)).to.equal('string');
  });

  it('should support imported type reference:', function() {
    expect(typeof(output.importedTypeReference.age)).to.equal('number');
  });

  it('should support array consist of basic type:', function() {
    expect(Array.isArray(output.basicArray)).to.equal(true);
    expect(typeof(output.basicArray[0])).to.equal('number');
  });

  it('should support array consist of reference type:', function() {
    expect(Array.isArray(output.referenceArray)).to.equal(true);
    expect(typeof(output.referenceArray[0].age)).to.equal('number');
  });

  it('should support keyword array consist of basic type:', function() {
    expect(Array.isArray(output.basicArrayKeyword)).to.equal(true);
    expect(typeof(output.basicArrayKeyword[0])).to.equal('number');
  });

  it('should support keyword array consist of reference type:', function() {
    expect(Array.isArray(output.referenceArrayKeyword)).to.equal(true);
    expect(typeof(output.referenceArrayKeyword[0].age)).to.equal('number');
  });

  it('should support basic union type:', function() {
    expect(typeof(output.basicUnion)).to.be.oneOf(['string', 'number']);
  });

  it('should support reference union type:', function() {
    expect(typeof(output.referenceUnion)).to.equal('object');
    expect(output.referenceUnion).to.satisfy(function(value: User | Record) {
      if ('age' in value) {
        return typeof(value.age) === 'number';
      } else {
        return typeof(value.title) === 'string';
      }
    })
  });

  it('should support object literal:', function() {
    expect(typeof(output.objectLiteral)).to.equal('object');
    expect(typeof(output.objectLiteral.type)).to.equal('string');
  });

  it('should support string literal type:', function() {
    expect(typeof(output.stringLiteral)).to.equal('string');
    expect(output.stringLiteral).to.be.oneOf(['a', 'b']);
  });

  it('should support basic type alias:', function() {
    expect(typeof(output.basicTypeAlias)).to.equal('string');
  });

  it('should support object type alias:', function() {
    expect(typeof(output.objectTypeAlias)).to.equal('object');
    expect(typeof(output.objectTypeAlias.average)).to.equal('number');
  });

  it('should support object type alias:', function() {
    expect(typeof(output.objectTypeAlias)).to.equal('object');
    expect(typeof(output.objectTypeAlias.average)).to.equal('number');
  });

  it('should support enum:', function() {
    expect(typeof(output.enum)).to.equal('number');
  });

  it('should support intersection type:', function() {
    expect(typeof(output.intersectionType)).to.equal('object');
    expect(typeof(output.intersectionType.age)).to.equal('number');
    expect(typeof(output.intersectionType.title)).to.equal('string');
  });
});