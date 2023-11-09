var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var cors = require("cors");

// route
var indexRouter = require("./routes/routes");

var app = express();

/**
 * Session
 *
 */

app.use(
  session({
    secret: "45678()(*&*&",
    resave: false,
    saveUninitialized: true,
    cookie: { basket: [] },
  })
);
/**
 * --------------------------
 */

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// route
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(async (req, res, next) => {
  // next(createError(404));
  res.render("404");
});

// error handler
app.use(async (err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
