/*
npm install -g gulp-cli
npm install gulp --save-dev
npm install gulp-concat --save-dev
npm install gulp-uglify --save-dev
npm install gulp-uglifycss --save-dev
*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');

async function concatmainjs() {
  return gulp.src([
    './js/lib/html5-qrcode.js',
    './js/script.js'])
    .pipe(concat('qrsc.pkgd.min.js'))
    .pipe(uglify().on('error', function (e) { console.log(e); }))
    .pipe(gulp.dest('./build/'));
}

exports.concatmainjs = concatmainjs;