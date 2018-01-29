'use strict';

const Promise        = require('bluebird');
const assert         = require('assert');
const util           = require('util');
const expect         = require('chai').expect;
const LoopbackSocket = require('../index');

function EventEmitter(){
  this._listeners = {};
}

EventEmitter.prototype.on = function (eventName, cb) {
  this._listeners[eventName] = this._listeners[eventName] || [];
  this._listeners[eventName].push(cb);
};

EventEmitter.prototype.emit = function (eventName, data, cb) {
  const events = this._listeners[eventName] || [];
  Promise.all(events)
  .mapSeries((handler) => {
    return new Promise((resolve, reject) => {
      if (handler.length===1) {
        resolve(handler(data));
      } else {
        handler(data, resolve);
      }
    })
  })
  .then((results) => {
    cb && cb(results[0]);
  });
};

function Server () {
  EventEmitter.apply(this, arguments);
};
util.inherits(Server, EventEmitter);

function Client (server) {
  EventEmitter.apply(this, arguments);
  this._server = server;
};
util.inherits(Client, EventEmitter);

Client.prototype.connect = function () {
  this._server.emit('connection', this);
  this.emit('connect');
};

const password = '1234';

describe('#LoopbackSocket', () => {

  let lbSocket;

  let iName = 1;
  function createServer() {
    const name = 'testing'+(iName++);
    const server = new Server();
    lbSocket = LoopbackSocket.get(name);
    lbSocket.auth((socket, credentials) => {
      if (credentials.token !== password) {
        throw 'unauthorized';
      }
      return { usuario: 1 }
    });
    lbSocket.start(server);
    return server;
  };
  function createServerCb() {
    const name = 'testing'+(iName++);
    const server = new Server();
    lbSocket = LoopbackSocket.get(name);
    lbSocket.auth((socket, credentials, cb) => {
      if (credentials.token !== password) {
        cb('unauthorized');
      }
      cb(null, { usuario: 1 });
    });
    lbSocket.start(server);
    return server;
  };

  function createClient (server, token) {
    const client = new Client(server);
    client.on('connect', () => {
      client.emit('authentication', {
        token: token || password
      });
    });
    return client;
  };
  
  it('.get', () => {
    expect(LoopbackSocket.get('one')).to.equal(LoopbackSocket.get('one'));
    expect(LoopbackSocket.get('one')).to.not.equal(LoopbackSocket.get('two'));
  });

  describe('authentication with cb', () => {
    it('success', (done) => {
      const server = createServerCb();
      const client = createClient(server);
      client.on('authenticated', () => {
        done();
      });
      client.connect();
    });

    it('fail', (done) => {
      const server = createServerCb();
      const client = createClient(server, '1111');
      client.on('unauthorized', () => {
        done();
      });
      client.connect();
    });
    
  })

  describe('onConnected', () => {
    
    it('direct', (done) => {
      const server = createServer();
      lbSocket.onConnected(function onConnected(socket, credentials) {
        done();
      });
      createClient(server).connect();
    });
    
    it('Model method', (done) => {
      const server = createServer();
      const Model = {};
      lbSocket.onConnected({ model: Model, method: 'onConnected' });
      Model.onConnected = (socket, credentials) => {
        done();
      };
      createClient(server).connect();
    });

  });

  describe('removeOnConnected', () => {
    
    it('existing', (done) => {
      const server = createServer();
      let sw = false;
      
      function onConnected(socket, credentials) {
        sw = true;
      }

      expect(lbSocket._connected.length).to.equal(0);
      lbSocket.onConnected(onConnected);
      expect(lbSocket._connected.length).to.equal(1);
      const client = createClient(server);
      
      client.on('authenticated', () => {
        expect(sw).to.equal(true);
        lbSocket.removeOnConnected(onConnected);
        expect(lbSocket._connected.length).to.equal(0);
        
        sw = false;
        const client2 = createClient(server);
        client2.on('authenticated', () => {
          expect(sw).to.equal(false);
          done();
        });
        client2.connect();
        
      });
      client.connect();
      
    });
    
    it('not existing method', () => {
      const server = createServer();
      function onConnected(){};
      lbSocket.onConnected(onConnected);
      lbSocket.removeOnConnected(()=>{});
      expect(lbSocket._connected.length).to.equal(1);
    });

  });

  describe('defineMethod', () => {
    
    it('direct', (done) => {
      const server = createServer();
      lbSocket.defineMethod('gettingDataMethod', (socket, credentials, args) => {
        return { value: args.value*2 };
      });
      const client = createClient(server)
      const args = { value: 2 };
      client.on('authenticated', () => {
        client.emit('gettingDataMethod', args, (response) => {
          expect(response.result.value).to.equal(args.value*2);
          done();
        });
      });
      client.connect();
    });

    it('Model method', (done) => {
      const server = createServer();

      const Model = {};
      lbSocket.defineMethod('gettingDataMethod', { model: Model, method: 'gettingDataMethod' });
      Model.gettingDataMethod = function (socket, credentials, args) {
        return { value: args.value*3 };
      };

      const client = createClient(server)
      const args = { value: 3 };
      client.on('authenticated', () => {
        client.emit('gettingDataMethod', args, (response) => {
          expect(response.result.value).to.equal(args.value*3);
          done();
        });
      });
      client.connect();
    });
    
    it('invalid method', (done) => {
      const server = createServer();
      lbSocket.defineMethod('gettingDataMethod', {});
      const client = createClient(server)
      client.on('authenticated', () => {
        const args = { value: 3 };
        client.emit('gettingDataMethod', args, (response) => {
          expect(response.error).to.be.a('Error');
          done();
        });
      });
      client.connect();
    });
    
    it('method with callback', (done) => {
      const server = createServer();
      lbSocket.defineMethod('gettingDataMethod', (socket, credentials, args, cb) => {
        if (args.value === true) {
          cb(null, { value: 4 });
        } else{
          cb(new Error());
        }
      });
      const client = createClient(server)
      client.on('authenticated', () => {
        client.emit('gettingDataMethod', { value: true }, (response) => {
          expect(response.result.value).to.equal(4);
          client.emit('gettingDataMethod', { }, (response) => {
            expect(response.error).to.be.a('Error');
            done();
          });
        });
      });
      client.connect();
    });

  });

  describe('removeMethod', () => {
    
    it('existing', () => {
      const server = createServer();
      
      function gettingDataMethod(socket, credentials) {}

      expect(Object.keys(lbSocket._methods).length).to.equal(0);
      lbSocket.defineMethod('gettingDataMethod', gettingDataMethod);
      expect(Object.keys(lbSocket._methods).length).to.equal(1);
      lbSocket.removeMethod('gettingDataMethod');
      expect(Object.keys(lbSocket._methods).length).to.equal(0);
      
    });
    
    it('not existing method', () => {
      const server = createServer();
      function gettingDataMethod(){};
      lbSocket.defineMethod('gettingDataMethod', gettingDataMethod);
      lbSocket.removeMethod('anotherMethod');
      expect(Object.keys(lbSocket._methods).length).to.equal(1);
    });

  });

});