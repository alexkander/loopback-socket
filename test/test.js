'use strict';

const expect = require('chai').expect;
const LoopbackSocket = require('../index');

describe('#LoopbackSocket', () => {

  it('.get', () => {
    var instance1 = LoopbackSocket.get('name1');
    var instance2 = LoopbackSocket.get('name1');
    var instance3 = LoopbackSocket.get('name2');
    expect(instance1).to.equal(instance2);
    expect(instance1).to.not.equal(instance3);
  });

});