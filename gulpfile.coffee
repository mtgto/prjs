gulp = require 'gulp'
ts = require 'gulp-typescript'
tslint = require 'gulp-tslint'

gulp.task 'typescript', ->
  result = gulp.src 'src/**/*.ts'
    .pipe ts {
        module: 'commonjs'
      }
  .js.pipe gulp.dest ''

gulp.task 'tslint', ->
  gulp.src 'src/**/*.ts'
    .pipe tslint()
    .pipe tslint.report 'verbose'

gulp.task 'watch', ['typescript'], ->
  gulp.watch 'src/**/*.ts', ['typescript']

gulp.task 'default', ['watch'], ->
