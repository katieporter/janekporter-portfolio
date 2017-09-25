var express = require('gulp-express');
var gulp    = require('gulp');

gulp.task('express', function () {
  express.run({
    "file" : 'app.js'
  });
});