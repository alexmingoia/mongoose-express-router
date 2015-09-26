# mongoose-express-router

[![Build Status](https://img.shields.io/travis/alexmingoia/mongoose-express-router.svg?style=flat)](http://travis-ci.org/alexmingoia/mongoose-express-router) [![Code Coverage](https://img.shields.io/coveralls/alexmingoia/mongoose-express-router.svg?style=flat)](https://coveralls.io/alexmingoia/mongoose-express-router) [![NPM version](https://img.shields.io/npm/v/mongoose-express-router.svg?style=flat)](http://badge.fury.io/js/mongoose-express-router)

> Create Express 4 router and middleware from Mongoose 4 model.

## Usage

```javascript
var express = require('express');
var mongoose = require('mongoose');
var router = require('mongoose-express-router');

var db = mongoose.createConnection('mongodb://localhost/test');
var schema = mongoose.Schema({ name: 'string' }).plugin(router);
var User = mongoose.model('User', schema);

var app = express();
app.use('/users', User.router());

app.listen(3000);
```

You can also use router middleware individually:

```javascript
app
  .get('/users', User.router('find'))
  .post('/users', User.router('create'))
  .get('/users/:id', User.router('findOne'))
  .patch('/users/:id', User.router('update'))
  .delete('/users/:id', User.router('delete'));
```

### Queries

The following query parameters are recognized:

- `skip` or `offset`
- `limit`
- `sort`
- `select`
- `populate`
- `match`

### Session handling

It's often useful to have the session available in mongoose middleware to do
things like validation and authorization.

#### Accessing the session from query or model middleware

```javascript
User.pre('find', function (next) {
  console.log(this.session);
  next();
});
```

```javascript
User.pre('save', function (next) {
  console.log(this.session);
  next();
});
```

#### Setting the session

The session is set whenever the router middleware is used, otherwise set the
`session` query option.

```javascript
User.findOne()
  .setOptions({ session: req.session })
  .exec(function (err, user) {
    console.log(user.session === req.session);
    // => true
  });
```

### Body parsing

You must provide your own body parsing middleware. A `req.body` object must be
available for the post/create middleware to work.

### Custom middleware

Custom middleware can be accessed using `Model.router()` and has the model
exposed via `req.Model`:

```javascript
schema.plugin(router, {
  middleware: {
    myMiddleware: function (req, res, next) {
      console.log(req.Model);
      next();
    }
  }
});

// Returns middleware
User.router('myMiddleware');
```
