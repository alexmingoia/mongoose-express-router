var express = require('express');

module.exports = function mongooseRouterPlugin(schema, options) {
  var router;

  schema.pre('count', setQuerySession);
  schema.pre('find', setQuerySession);
  schema.pre('findOne', setQuerySession);
  schema.pre('findOneAndRemove', setQuerySession);
  schema.pre('findOneAndUpdate', setQuerySession);
  schema.pre('update', setQuerySession);

  schema.post('find', setResultsSession);
  schema.post('findOne', setResultsSession);
  schema.post('findOneAndRemove', setResultsSession);
  schema.post('findOneAndUpdate', setResultsSession);

  schema.statics.router = function (op) {
    if (!router) {
      router = routerGetter(this, {
        middleware: options && options.middleware,
        sessionKey: options && options.sessionKey || 'session'
      });
    }

    return op ? router[op] : router;
  };

  return schema;
};

function setQuerySession(next) {
  this.session = this.options.session;
  delete this.options.session;
  next();
}

function setResultsSession(result) {
  var session = this.session;

  if (session) {
    if (Array.isArray(result)) {
      result.forEach(function (item) {
        item.session = session;
      });
    } else if (result) {
      result.session = session;
    }
  }
}

function routerGetter(Model, options) {
  var sessionKey = options.sessionKey;
  var router = express.Router();

  router.find = function (req, res, next) {
    query(Model.find(), req, sessionKey).exec(function (err, models) {
      err ? next(err) : res.json(models);
    });
  };

  router.create = function (req, res, next) {
    var model = new Model(req.body);
    model.session = req[sessionKey];
    model.save(function (err) {
      if (err) {
        next(err);
      } else if (req.query.populate) {
        model.populate(req.query.populate, function (err) {
          err ? next(err) : res.json(201, model);
        });
      } else {
        res.json(201, model);
      }
    });
  };

  router.findOne = function (req, res, next) {
    query(Model.findOne(), req, sessionKey)
      .where('_id', req.params.id)
      .exec(function (err, model) {
        if (err || !model) {
          next(err);
        } else {
          res.json(model);
        }
      });
  };

  router.update = function (req, res, next) {
    query(Model.findOne(), req, sessionKey)
      .where('_id', req.params.id)
      .exec(function (err, model) {
        if (err || !model) {
          next(err);
        } else {
          model.set(req.body).save(function (err) {
            err ? next(err) : res.json(model);
          });
        }
      });
  };

  router.delete = function (req, res, next) {
    query(Model.findOne(), req, sessionKey)
      .where('_id', req.params.id)
      .exec(function (err, model) {
        if (err || !model) {
          next(err);
        } else {
          model.remove(function (err) {
            err ? next(err) : res.json(model);
          });
        }
      });
  };

  // custom middleware has model available via `req.Model`
  if (options.middleware) {
    Object.keys(options.middleware).forEach(function (key) {
      if (router[key]) {
        throw new Error('router.' + key + ' already exists');
      } else {
        router[key] = function (req, res, next) {
          req.Model = Model;
          options.middleware[key].apply(this, arguments);
        };
      }
    });
  }

  router.route('/')
    .get(router.find)
    .post(router.create)

  router.route('/:id')
    .get(router.findOne)
    .patch(router.update)
    .delete(router.delete);

  return router;
}

function query(mQuery, req, sessionKey) {
  var query = req.query;

  if (query.skip || query.offset) {
    mQuery.skip(query.skip || query.offset);
  }

  if (query.populate) mQuery.populate(query.populate);
  if (query.limit) mQuery.limit(query.limit);
  if (query.sort) mQuery.sort(query.sort);
  if (query.select) mQuery.select(query.select);
  if (query.match) mQuery.where(query.match);

  mQuery.setOptions({ session: req[sessionKey] });

  return mQuery;
}
