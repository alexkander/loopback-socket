'use strict';

const expect = require('chai').expect;
const Module = require('../index');

describe('#Module', () => {
  it('should be itself', () => {
    var result = new Module();
    expect(result).to.equal(result);
  });
});