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
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const ts = __importStar(require("typescript"));
const fs_1 = require("fs");
const core_1 = require("../src/core");
describe('mock-type', function () {
    const output = {};
    const options = {
        file: 'test/example-interface.ts',
        interfaces: ['Admin']
    };
    const sourceFile = ts.createSourceFile(options.file, fs_1.readFileSync(options.file).toString(), ts.ScriptTarget.ES2015, true);
    core_1.processFile(sourceFile, options, output);
    console.log(output);
    it('should support basic string:', function () {
        chai_1.expect(typeof (output.basicString)).to.equal('string');
    });
    it('should support basic number:', function () {
        chai_1.expect(typeof (output.basicNumber)).to.equal('number');
    });
    it('should support type reference:', function () {
        chai_1.expect(typeof (output.typeReference.title)).to.equal('string');
    });
    it('should support imported type reference:', function () {
        chai_1.expect(typeof (output.importedTypeReference.age)).to.equal('number');
    });
    it('should support array consist of basic type:', function () {
        chai_1.expect(Array.isArray(output.basicArray)).to.equal(true);
        chai_1.expect(typeof (output.basicArray[0])).to.equal('number');
    });
    it('should support array consist of reference type:', function () {
        chai_1.expect(Array.isArray(output.referenceArray)).to.equal(true);
        chai_1.expect(typeof (output.referenceArray[0].age)).to.equal('number');
    });
    it('should support keyword array consist of basic type:', function () {
        chai_1.expect(Array.isArray(output.basicArrayKeyword)).to.equal(true);
        chai_1.expect(typeof (output.basicArrayKeyword[0])).to.equal('number');
    });
    it('should support keyword array consist of reference type:', function () {
        chai_1.expect(Array.isArray(output.referenceArrayKeyword)).to.equal(true);
        chai_1.expect(typeof (output.referenceArrayKeyword[0].age)).to.equal('number');
    });
    it('should support basic union type:', function () {
        chai_1.expect(typeof (output.basicUnion)).to.be.oneOf(['string', 'number']);
    });
    it('should support reference union type:', function () {
        chai_1.expect(typeof (output.referenceUnion)).to.equal('object');
        chai_1.expect(output.referenceUnion).to.satisfy(function (value) {
            if ('age' in value) {
                return typeof (value.age) === 'number';
            }
            else {
                return typeof (value.title) === 'string';
            }
        });
    });
    it('should support object literal:', function () {
        chai_1.expect(typeof (output.objectLiteral)).to.equal('object');
        chai_1.expect(typeof (output.objectLiteral.type)).to.equal('string');
    });
    it('should support string literal type:', function () {
        chai_1.expect(typeof (output.stringLiteral)).to.equal('string');
        chai_1.expect(output.stringLiteral).to.be.oneOf(['a', 'b']);
    });
    it('should support basic type alias:', function () {
        chai_1.expect(typeof (output.basicTypeAlias)).to.equal('string');
    });
    it('should support object type alias:', function () {
        chai_1.expect(typeof (output.objectTypeAlias)).to.equal('object');
        chai_1.expect(typeof (output.objectTypeAlias.average)).to.equal('number');
    });
});
