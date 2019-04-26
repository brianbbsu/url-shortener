var gulp = require('gulp');
var CleanCSS = require('gulp-clean-css');
var SASS = require('gulp-sass');
var sourceMap = require('gulp-sourcemaps');
var Clean = require('gulp-clean');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var gulpif = require('gulp-if');
var replace = require('gulp-replace');

var argv = require('yargs').argv;

function clean() {
    return gulp.src('public/', { read: false, allowEmpty: true })
        .pipe(Clean());
}

function css() {
    return gulp.src('scss/*.scss')
        .pipe(sourceMap.init())
        .pipe(SASS())
        .pipe(CleanCSS())
        .pipe(sourceMap.write('.'))
        .pipe(gulp.dest('public/css'))
        .pipe(connect.reload())
}

function static() {
    return gulp.src('static/**')
        .pipe(gulp.dest('public'))
}

function html() {
    return gulp.src('html/**')
        .pipe(gulp.dest('public'))
        .pipe(connect.reload())
}

function js() {
    return gulp.src('js/*.js')
        .pipe(gulpif(argv.local,
            replace(/^const backend_url.*$/m,
                "const backend_url = 'http://localhost:3000/';")))
        .pipe(sourceMap.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(sourceMap.write('.'))
        .pipe(gulp.dest('public/js'))
        .pipe(connect.reload())
}

function server() {
    connect.server({
        root: 'public',
        port: 8000,
        livereload: argv.reload ? true : false
    });
}


function watchFiles() {
    gulp.watch("html/**", html);
    gulp.watch("scss/**", css);
    gulp.watch("js/**", js);
    gulp.watch("static/**", static);
}

const build = gulp.series(clean,
    gulp.parallel(css, static, html, js));
const watch = gulp.series(build, watchFiles);


exports.clean = clean;
exports.build = build;
exports.server = server;
exports.default = gulp.parallel(watch, server);