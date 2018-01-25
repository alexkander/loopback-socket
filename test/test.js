'use strict';

const expect = require('chai').expect;
const Module = require('../index');

describe('#Module', () => {
  it('should be null', () => {
    var result = Module();
    expect(result).to.equal(null);
  });
});