var assert = require('assert');
var express = require('express');
var mongoose = require('mongoose');
var routerPlugin = require('..');

mongoose.connect('mongodb://localhost:27017/mongoose-express-router-test');

describe('module', function () {
  it('exports mongoose plugin', function () {
    var schema = new mongoose.Schema();
    assert.equal('function', typeof routerPlugin);
    schema.plugin(routerPlugin);
  });
});

describe('plugin', function () {
  it('creates router static method', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('Plugin', schema);
    assert.equal('function', typeof Model.router);
  });
});

describe('Model.router()', function () {
  it('returns express router if called with no arguments', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter1', schema);
    var router = Model.router();
    assert.equal('function', typeof router);
    assert.equal('router', router.name);
    assert.ok(Array.isArray(router.stack));
    assert.equal('function', typeof router.create);
    assert.equal('function', typeof router.findOne);
    assert.equal('function', typeof router.find);
    assert.equal('function', typeof router.update);
    assert.equal('function', typeof router.delete);
  });

  it('returns create middleware if called with "create"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter2', schema);
    var router = Model.router();
    var middleware = Model.router('create');
    assert.equal(middleware, router.create);
  });

  it('returns find middleware if called with "find"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter3', schema);
    var router = Model.router();
    var middleware = Model.router('find');
    assert.equal(middleware, router.find);
  });

  it('returns find middleware if called with "findOne"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter4', schema);
    var router = Model.router();
    var middleware = Model.router('findOne');
    assert.equal(middleware, router.findOne);
  });

  it('returns update middleware if called with "update"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter5', schema);
    var router = Model.router();
    var middleware = Model.router('update');
    assert.equal(middleware, router.update);
  });

  it('returns delete middleware if called with "delete"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter6', schema);
    var router = Model.router();
    var middleware = Model.router('delete');
    assert.equal(middleware, router.delete);
  });
});

describe('Model.count()', function () {
  it('sets session on query', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    schema.pre('count', function () {
      assert.equal(this.session, 'foobar');
      done();
    });
    mongoose.model('Count1', schema)
      .count()
      .setOptions({ session: 'foobar' })
      .exec();
  });
});

describe('Model.find()', function () {
  it('sets session on query', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    schema.pre('find', function () {
      assert.equal(this.session, 'foobar');
      done();
    });
    mongoose.model('Find1', schema)
      .find()
      .setOptions({ session: 'foobar' })
      .exec();
  });

  it('sets session on query results', function (done) {
    var _find = mongoose.Query.prototype._find;
    var schema = new mongoose.Schema({}, { collection: 'test' });
    schema.plugin(routerPlugin);
    mongoose.Query.prototype._find = function (cb) {
      mongoose.Query.prototype._find = _find;
      assert.equal('foobar', this.session);
      cb(null, [{ session: this.session }]);
    };
    mongoose.model('Find2', schema)
      .find()
      .setOptions({ session: 'foobar' })
      .exec(function (err, models) {
        if (err) return done(err);
        assert.equal('object', typeof models[0]);
        assert.equal('foobar', models[0].session);
        done();
      });
  });
});

describe('Model.findOne()', function () {
  it('sets session on query', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    schema.pre('findOne', function () {
      assert.equal(this.session, 'foobar');
      done();
    });
    mongoose.model('FindOne1', schema)
      .findOne()
      .setOptions({ session: 'foobar' })
      .exec();
  });

  it('sets session on query results', function (done) {
    var _findOne = mongoose.Query.prototype._findOne;
    var schema = new mongoose.Schema({}, { collection: 'test' });
    schema.plugin(routerPlugin);
    mongoose.Query.prototype._findOne = function (cb) {
      mongoose.Query.prototype._findOne = _findOne;
      assert.equal('foobar', this.session);
      cb(null, { session: this.session });
    };
    mongoose.model('FindOne2', schema)
      .findOne()
      .setOptions({ session: 'foobar' })
      .exec(function (err, model) {
        if (err) return done(err);
        assert.equal('object', typeof model);
        assert.equal('foobar', model.session);
        done();
      });
  });
});

describe('Model.findOneAndUpdate()', function () {
  it('sets session on query', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    schema.pre('findOneAndUpdate', function () {
      assert.equal(this.session, 'foobar');
      done();
    });
    mongoose.model('FindOneAndUpdate1', schema)
      .findOneAndUpdate()
      .setOptions({ session: 'foobar' })
      .exec();
  });

  it('sets session on query results', function (done) {
    var _findOneAndUpdate = mongoose.Query.prototype._findOneAndUpdate;
    var schema = new mongoose.Schema({}, { collection: 'test' });
    schema.plugin(routerPlugin);
    mongoose.Query.prototype._findOneAndUpdate = function (cb) {
      mongoose.Query.prototype._findOneAndUpdate = _findOneAndUpdate;
      assert.equal('foobar', this.session);
      cb(null, { session: this.session });
    };
    mongoose.model('FindOneAndUpdate2', schema)
      .findOneAndUpdate()
      .setOptions({ session: 'foobar' })
      .exec(function (err, model) {
        if (err) return done(err);
        assert.equal('object', typeof model);
        assert.equal('foobar', model.session);
        done();
      });
  });
});

describe('Model.findOneAndRemove()', function () {
  it('sets session on query', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    schema.pre('findOneAndRemove', function () {
      assert.equal(this.session, 'foobar');
      done();
    });
    mongoose.model('FindOneAndRemove1', schema)
      .findOneAndRemove()
      .setOptions({ session: 'foobar' })
      .exec();
  });

  it('sets session on query results', function (done) {
    var _findOneAndRemove = mongoose.Query.prototype._findOneAndRemove;
    var schema = new mongoose.Schema({}, { collection: 'test' });
    schema.plugin(routerPlugin);
    mongoose.Query.prototype._findOneAndRemove = function (cb) {
      mongoose.Query.prototype._findOneAndRemove = _findOneAndRemove;
      assert.equal('foobar', this.session);
      cb(null, { session: this.session });
    };
    mongoose.model('FindOneAndRemove2', schema)
      .findOneAndRemove()
      .setOptions({ session: 'foobar' })
      .exec(function (err, model) {
        if (err) return done(err);
        assert.equal('object', typeof model);
        assert.equal('foobar', model.session);
        done();
      });
  });
});
