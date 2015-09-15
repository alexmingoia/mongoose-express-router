var express = require('express');

module.exports = function (schema, options) {
  var router;

  schema.statics.router = function (op) {
    if (!router) {
      router = routerGetter(this, {
        sessionKey: options && options.sessionKey || 'session'
      });
    }

    return op ? router[op] : router;
  };

  return schema;
};

function routerGetter(Model, options) {
  var sessionKey = options.sessionKey;
  var router = express.Router();

  router.find = function (req, res, next) {
    var mQuery = query(Model.find(), req, sessionKey);
    mQuery.exec(function (err, models) {
      err ? next(err) : res.json(models);
    });
  };

  router.create = function (req, res, next) {
    var model = new Model(req.body);
    model[sessionKey] = req[sessionKey];
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
    var mQuery = query(Model.findOne(), req, sessionKey);
    mQuery.where('_id', req.params.id);
    mQuery.exec(function (err, model) {
      if (err || !model) {
        next(err);
      } else {
        res.json(model);
      }
    });
  };

  router.update = function (req, res, next) {
    var mQuery = query(Model.findOne(), req, sessionKey);
    mQuery.where('_id', req.params.id);
    mQuery.exec(function (err, model) {
      if (err || !model) {
        next(err);
      } else {
        model[sessionKey] = req[sessionKey];
        model.set(req.body);
        model.save(function (err) {
          err ? next(err) : res.json(model);
        });
      }
    });
  };

  router.delete = function (req, res, next) {
    var mQuery = query(Model.findOne(), req, sessionKey);
    mQuery.where('_id', req.params.id);
    mQuery.exec(function (err, model) {
      if (err || !model) {
        next(err);
      } else {
        model[sessionKey] = req[sessionKey];
        model.remove(function (err) {
          err ? next(err) : res.json(model);
        });
      }
    });
  };

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

  mQuery[sessionKey] = req[sessionKey];

  return mQuery;
}
