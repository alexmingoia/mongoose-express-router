var assert = require('assert');
var express = require('express');
var mongoose = require('mongoose');
var ObjectId = require('mongoose/node_modules/mongodb').ObjectID;
var request = require('supertest');
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

  it('registers CRUD routes', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouterA', schema);
    var router = Model.router();
    assert.equal(router.stack.length, 2);
    assert.equal(router.stack[0].route.path, '/');
    assert.equal(router.stack[0].route.stack.length, 2);
    assert.equal(router.stack[1].route.path, '/:id');
    assert.equal(router.stack[1].route.stack.length, 3);
  });

  it('returns create middleware if called with "create"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter2', schema);
    var router = Model.router();
    var middleware = Model.router('create');
    assert.equal(middleware, router.create);
  });

  describe('"create" middleware', function () {
    it('sets session on created model', function (done) {
      var schema = new mongoose.Schema();
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterA2', schema);
      Model.prototype.save = function (cb) {
        cb(null, {});
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        res.json = function (statusCode, model) {
          try {
            assert.equal('object', typeof model);
            assert.equal('foobar', model.session);
            done();
          } catch(err) {
            done(err);
          }
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .post('/')
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('populates created model', function (done) {
      var schema = new mongoose.Schema();
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterB2', schema);
      Model.prototype.populate = function (query, cb) {
        this.populated = 'foobar';
        cb();
      };
      Model.prototype.save = function (cb) {
        cb(null, {});
      };
      var app = express();
      app.use(function (req, res, next) {
        res.json = function (statusCode, model) {
          try {
            assert.equal('object', typeof model);
            assert.equal('foobar', model.populated);
            done();
          } catch (err) {
            done(err);
          }
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .post('/?populate=true')
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes error to callback', function (done) {
      var schema = new mongoose.Schema();
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterK2', schema);
      Model.prototype.save = function (cb) {
        cb(new Error('test'));
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, req, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .post('/')
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });
  });

  it('returns find middleware if called with "find"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter3', schema);
    var router = Model.router();
    var middleware = Model.router('find');
    assert.equal(middleware, router.find);
  });

  describe('"find" middleware', function () {
    it('sets session', function (done) {
      var schema = new mongoose.Schema();
      var _find = mongoose.Query.prototype._find;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterC2', schema);
      mongoose.Query.prototype._find = function (cb) {
        mongoose.Query.prototype._find = _find;
        cb(null, [{}]);
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        res.json = function (models) {
          try {
            assert.ok(Array.isArray(models));
            assert.equal(models.length, 1);
            assert.equal('foobar', models[0].session);
            done();
          } catch (err) {
            done(err);
          }
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .get('/?limit=1&skip=0&select=name&match[name]=foobar&sort[name]=-1&populate=bazqux')
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _find = mongoose.Query.prototype._find;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterJ2', schema);
      mongoose.Query.prototype._find = function (cb) {
        mongoose.Query.prototype._find = _find;
        cb(new Error('test'));
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, req, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .get('/?limit=1&skip=0&select=name&match[name]=foobar&sort[name]=-1&populate=bazqux')
        .end(function (err) {
          if (err) return done(err);
        });
    });
  });

  it('returns find middleware if called with "findOne"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter4', schema);
    var router = Model.router();
    var middleware = Model.router('findOne');
    assert.equal(middleware, router.findOne);
  });

  describe('"findOne" middleware', function () {
    it('sets session', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterD2', schema);
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(null, {});
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        res.json = function (model) {
          assert.equal('object', typeof model);
          assert.equal('foobar', model.session);
          done();
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .get('/' + (new ObjectId()).toString())
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterL2', schema);
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(new Error('test'));
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, req, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .get('/' + (new ObjectId()).toString())
        .end(function (err) {
          if (err) return done(err);
        });
    });
  });

  it('returns update middleware if called with "update"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter5', schema);
    var router = Model.router();
    var middleware = Model.router('update');
    assert.equal(middleware, router.update);
  });

  describe('"update" middleware', function () {
    it('sets session', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterE2', schema);
      Model.prototype.save = function (cb) {
        cb();
      };
      Model.prototype.set = function () {
        return this;
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(null, new Model());
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        res.json = function (model) {
          assert.equal('object', typeof model);
          assert.equal('foobar', model.session);
          done();
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .patch('/' + (new ObjectId()).toString())
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes findOne() error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterP2', schema);
      Model.prototype.save = function (cb) {
        cb();
      };
      Model.prototype.set = function () {
        return this;
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(new Error('test'));
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, req, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .patch('/' + (new ObjectId()).toString())
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes save() error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterX2', schema);
      Model.prototype.save = function (cb) {
        cb(new Error('test'));
      };
      Model.prototype.set = function () {
        return this;
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(null, new Model());
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, req, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .patch('/' + (new ObjectId()).toString())
        .send({ foobar: 'bazqux' })
        .end(function (err) {
          if (err) return done(err);
        });
    });
  });

  it('returns delete middleware if called with "delete"', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin);
    var Model = mongoose.model('ModelRouter6', schema);
    var router = Model.router();
    var middleware = Model.router('delete');
    assert.equal(middleware, router.delete);
  });

  describe('"delete" middleware', function () {
    it('sets session', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterF2', schema);
      Model.prototype.remove = function (cb) {
        cb();
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(null, new Model());
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        res.json = function (model) {
          assert.equal('object', typeof model);
          assert.equal('foobar', model.session);
          done();
        };
        next();
      });
      app.use(Model.router());
      request(app)
        .del('/' + (new ObjectId()).toString())
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes findOne() error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterH2', schema);
      Model.prototype.remove = function (cb) {
        cb();
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(new Error('test'));
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, res, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .del('/' + (new ObjectId()).toString())
        .end(function (err) {
          if (err) return done(err);
        });
    });

    it('passes remove() error to callback', function (done) {
      var schema = new mongoose.Schema();
      var _findOne = mongoose.Query.prototype._findOne;
      schema.plugin(routerPlugin);
      var Model = mongoose.model('ModelRouterO2', schema);
      Model.prototype.remove = function (cb) {
        cb(new Error('test'));
      };
      mongoose.Query.prototype._findOne = function (cb) {
        mongoose.Query.prototype._findOne = _findOne;
        cb(null, new Model());
      };
      var app = express();
      app.use(function (req, res, next) {
        req.session = 'foobar';
        next();
      });
      app.use(Model.router());
      app.use(function (err, res, res, next) {
        assert.ok(err instanceof Error);
        assert.equal('test', err.message);
        done();
      });
      request(app)
        .del('/' + (new ObjectId()).toString())
        .end(function (err) {
          if (err) return done(err);
        });
    });
  });

  it('returns custom middleware', function (done) {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin, {
      middleware: {
        custom: function (req, res, next) {
          assert.equal(req.Model, Model);
          done();
        }
      }
    });
    var Model = mongoose.model('ModelRouter7', schema);
    var router = Model.router();
    var middleware = Model.router('custom');
    assert.equal(middleware, router.custom);
    var app = express();
    app.use(Model.router('custom'));
    request(app).get('/').end(function (err) {
      if (err) return done(err);
    });
  });

  it('throws error if custom middleware already exists', function () {
    var schema = new mongoose.Schema();
    schema.plugin(routerPlugin, {
      middleware: {
        create: function (req, res, next) {}
      }
    });
    var Model = mongoose.model('ModelRouter9', schema);
    assert.throws(function () {
      Model.router();
    }, Error);
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
