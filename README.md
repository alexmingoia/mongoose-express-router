# mongoose-express-router

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

The session object is set on the query and/or model when available. Set the
`sessionKey` option to specify the key to use for the session on the request
and the model. For example, because `sessionKey` defaults to "session"
`req.session` will be used to set `model.session` or `query.session`.

The session is meant to be accessed from middleware for validation:

```javascript
User.pre('save', function (next) {
  this.session.admin ? next() : next(new Error('not an admin'));
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
