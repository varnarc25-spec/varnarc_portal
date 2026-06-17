require("./lib/load-dotenv")();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');
var apiConfig = require('./api/config');
var serviceMenuPaths = require('./lib/service-menu-paths');

var indexRouter = require('./routes/index');
var non_authenticated = require('./routes/non-authenticated');
var authRouter = require('./routes/auth');
var publicApiRouter = require('./routes/public-api');
var rechargesRouter = require('./routes/recharges');
var paymentsRouter = require('./routes/payments');
var app = express();

const users = [];
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
  res.locals.serviceSectionUrl = function (sectionSlug) {
    return serviceMenuPaths.buildSectionUrl(sectionSlug);
  };
  res.locals.slugifyMenu = function (str) {
    return serviceMenuPaths.slugify(str);
  };
  res.locals.authConfig = {
    firebaseApiKey: process.env.FIREBASE_WEB_API_KEY || "AIzaSyCc41aLGKTA7OxKg3IO5zX4-ugQUUTOqF4",
    firebaseAuthDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || "marg-af127.firebaseapp.com",
    firebaseProjectId: process.env.FIREBASE_WEB_PROJECT_ID || "marg-af127",
    firebaseStorageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || "marg-af127.firebasestorage.app",
    firebaseAppId: process.env.FIREBASE_WEB_APP_ID || "1:548031081093:web:3d80bfb64892eb420417ec",
    firebaseMessagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "548031081093",
    firebaseMeasurementId: process.env.FIREBASE_WEB_MEASUREMENT_ID || "G-Z6KR8G0HTF",
    margApiBaseUrl: apiConfig.MARG_API_BASE_URL,
  };
  next();
});

app.use('/', indexRouter);
app.use('/', non_authenticated);
app.use('/', authRouter);
app.use('/', publicApiRouter);
app.use('/', rechargesRouter);
app.use('/', paymentsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  var status = err.status || 500;
  res.status(status);
  if (status === 404) {
    return res.render("error-404", { layout: false });
  }
  if (status >= 500) {
    return res.render("error-500", { layout: false, message: req.app.get("env") === "development" ? err.message : undefined });
  }
  return res.render("error-400", { layout: false, message: req.app.get("env") === "development" ? err.message : undefined });
});

module.exports = app;
