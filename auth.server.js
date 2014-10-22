var express = require('express');
var bodyParser = require('body-parser');

var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt

var consts = {
  secret: 'this is the secret secret secret 12356',
  token_expire_period: 60 * 5,  // minutes
  user_credentials: {
    // username: password
    'admin': 'admin',
    'john.doe': 'foobar'
  },
  user_profiles: {
    'admin': {
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@x.com',
      id: 1
    },
    'john.doe': {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      id: 123
    }
  }
};

var utils = utils || {};

utils.authenticate = function (username, password) {
  return consts.user_credentials[username] === password;
};

utils.getProfile = function (username) {
  return consts.user_profiles[username];
};

var app = express();

/*
 MIDDLEWARE
 */

// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: consts.secret}));

// parse application/json
app.use(bodyParser.json());

// serve static content (in dir 'public')
app.use('/', express.static(__dirname + '/public'));

// error handler (after all the `app.use` calls)
app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.status(401).send('Unauthorized');
  }
});

/*
 ROUTING
 */

app.post('/authenticate', function (req, res) {
  //TODO validate req.body.username and req.body.password
  //if is invalid, return 401
  if (!utils.authenticate(req.body.username, req.body.password)) {
    res.status(401).send('Wrong user or password');
    return;
  }

  var profile = utils.getProfile(req.body.username);

  // We are sending the profile inside the token
  var token = jwt.sign(profile, consts.secret, { expiresInMinutes: consts.token_expire_period });

  res.json({ token: token });
});

app.get('/api/restricted', function (req, res) {
  console.log('user ' + req.user.email + ' is calling /api/restricted');
  res.json({
    name: 'foo'
  });
});

/*
 SERVER
 */

app.listen(8080, function () {
  console.log('listening on http://localhost:8080');
});
