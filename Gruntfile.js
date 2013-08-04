/*!
 * async-csrf-forms
 * https://github.com/dherges/async-csrf-forms
 *
 * Copyright (c) 2013 David Herges
 * Licensed under the MIT, Apache-2.0 licenses.
 */

'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    // Metadata
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * <%= pkg.homepage %>\n' +
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
      ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
      ' */',

    // grunt concat
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      // grunt concat:dist
      dist: {
        src: ['lib/xcsrf.js'],
        dest: 'dist/xcsrf.js'
      }
    },

    // grunt connect
    connect: {
      options: {
        host: 'localhost',
        middleware: function(connect, options) {
          var poc = require('./demo/connect-poc.js');

          return [
            connect.static(options.base),
            connect.directory(options.base),
            connect.logger('dev'),
            connect.cookieParser(),
            connect.urlencoded(),
            connect.query(),
            poc(),
          ];
        }
      },
      // grunt connect:dev
      dev: {
        options: {
          port: 3003
        }
      },
      // grunt connect:test
      test: {
        options: {
          port: 3004
        }
      }
    },

    // grunt jshint
    jshint: {
      options: {
        force: true
      },
      // grunt jshint:gruntfile
      gruntfile: {
        options: {
          // .jshintrc from grunt-init-plugin-example
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      // grunt jshint:lib
      lib: {
        options: {
          // .jshintrc from grunt-init-plugin-example
          jshintrc: 'lib/.jshintrc'
        },
        src: ['lib/**/*.js']
      },
      // grunt jshint:specs
      specs: {
        options: {
          // .jshintrc from grunt-init-plugin-example
          jshintrc: 'specs/.jshintrc'
        },
        src: ['specs/**/*.js']
      }
    },

    // grunt uglify
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      // grunt uglify:dist
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/xcsrf.min.js'
      }
    },

    // grunt jasmine
    jasmine: {
      // grunt jasmine:ender
      ender: {
        src: ['lib/xcsrf.js', 'lib/bridge.js'],
        options: {
          vendor: 'demo/ender.js',
          outfile: 'SpecRunner-ender.html',
          junit: {
            path: 'build/jasmine-ender'
          },
          templateOptions: {
            coverage: 'build/jasmine-ender/coverage.json',
            report: [
              {type: 'text-summary'},
              {type: 'html', options: {dir: 'build/jasmine-ender/html'}}
            ]
          }
        }
      },
      // grunt jasmine:jquery
      jquery: {
        src: 'lib/xcsrf.js',
        options: {
          vendor: [
            'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.3.1/jquery.cookie.js'
          ],
          outfile: 'SpecRunner-jquery.html',
          junit: {
            path: 'build/jasmine-jquery'
          },
          templateOptions: {
            coverage: 'build/jasmine-jquery/coverage.json',
            report: [
              {type: 'text-summary'},
              {type: 'html', options: {dir: 'build/jasmine-jquery/html'}}
            ]
          }
        }
      },
      // shared jasmine options
      options: {
        specs: ['specs/xcsrf.spec.js'],
        host: 'http://<%= connect.options.host %>:<%= connect.test.options.port %>/',
        keepRunner: true,
        template: require('grunt-template-jasmine-istanbul')
      }
    },

    // grunt watch
    watch: {
      // grunt watch:gruntfile
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      // grunt watch:lib
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'test']
      },
      // grunt watch:specs
      specs: {
        files: '<%= jshint.specs.src %>',
        tasks: ['jshint:specs', 'test']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // grunt
  grunt.registerTask('default', ['lint', 'test', 'dist']);

  // grunt lint
  grunt.registerTask('lint', ['jshint']);

  // grunt test
  grunt.registerTask('test', ['connect:test', 'jasmine']);

  // grunt dist
  grunt.registerTask('dist', ['concat', 'uglify']);

};
