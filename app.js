var fs = require("fs");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var dbFile = require("./node_simple.js");
var sanitizer  = require ("sanitizer");
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');

var routes = require('./routes/index');
var app = express();

// Templating engine, we are using handlebars
// This will allow us to create html pages dynamically before serving them.
app.engine('.hbs', hbs({extname: '.hbs', defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/', // Set directory for base layout
    partialsDir: __dirname + '/views/partials'})); // Set directory for partials

app.set('views', path.join(__dirname, 'views')); // Our view path
app.set('view engine', 'hbs');

// Middleware initialization, make sure everything is initialized in proper order
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(cookieParser());
// session is stored in memory, change to storage in mongo later
app.use(session({secret: 'pickBetterLater', resave: false, saveUninitialized: false}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport'); // simply need to load it

/*LOADS ALL STATIC FILES FROM THE DIRECTORY __dirname*/
app.use(express.static(__dirname));

// Allows us to customize express routing
// in a separate file.
app.use('/', routes);

module.exports = app;