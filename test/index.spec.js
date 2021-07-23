"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
describe('isOdd', function () {
    it('should return true if the number is odd:', function () {
        console.log();
        chai_1.expect(add(1, 2)).to.eql(3);
    });
});
function add(a, b) {
    return a + b;
}
