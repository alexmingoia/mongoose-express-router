var express = require('express');

module.exports = function (Model, opts) {
  var router = express.Router();
  opts = opts || {};
  opts.sessionKey = opts.sessionKey || 'session';

  router.find = function (req, res, next) {
    var mQuery = mongoQuery(req, Model.find);
    mQuery.exec(function (err, models) {
      err ? next(err) : res.json(models);
    });
  };

  router.create = function (req, res, next) {
    var model = new Model(req.body);
    model[opts.sessionKey] = req[opts.sessionKey];
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
    var mQuery = mongoQuery(req, Model.findOne);
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
    var mQuery = mongoQuery(req, Model.findOne);
    mQuery.where('_id', req.params.id);
    mQuery.exec(function (err, model) {
      if (err || !model) {
        next(err);
      } else {
        model[opts.sessionKey] = req[opts.sessionKey];
        model.set(req.body);
        model.save(function (err) {
          err ? next(err) : res.json(model);
        });
      }
    });
  };

  router.delete = function (req, res, next) {
    var mQuery = mongoQuery(req, Model.findOne);
    mQuery.where('_id', req.params.id);
    mQuery.exec(function (err, model) {
      if (err || !model) {
        next(err);
      } else {
        model[opts.sessionKey] = req[opts.sessionKey];
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

  function mongoQuery(req, op) {
    var mQuery = op.call(Model);
    var query = req.query;

    if (query.skip || query.offset) {
      mQuery.skip(query.skip || query.offset);
    }

    if (query.populate) mQuery.populate(query.populate);
    if (query.limit) mQuery.limit(query.limit);
    if (query.sort) mQuery.sort(query.sort);
    if (query.select) mQuery.select(query.select);
    if (query.match) mQuery.where(query.match);

    mQuery[opts.sessionKey] = req[opts.sessionKey];

    return mQuery;
  }
};
