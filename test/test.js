'use strict';

var expect = require('chai').expect;
var Module = require('../index');

describe('#Module', function() {
    it('should be null', function() {
        var result = Module();
        expect(result).to.equal(null);
    });

});