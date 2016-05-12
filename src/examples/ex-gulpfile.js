
// ---------- Dependencies ---------- //

const gulp            = require('gulp');
const browserSync     = require('browser-sync');
const pug             = require('gulp-pug');
const puglint         = require('gulp-pug-lint');
const prettyURL       = require('gulp-pretty-url');
const sass            = require('gulp-sass');
const autoprefixer    = require('gulp-autoprefixer');
const cleanCSS        = require('gulp-clean-css');
const uglify          = require('gulp-uglify');
const concat          = require('gulp-concat');
const sourcemaps      = require('gulp-sourcemaps');
const order           = require('gulp-order');
const ftp             = require('vinyl-ftp');
const ignore          = require('gulp-ignore');
const gutil           = require('gulp-util');
const rename          = require('gulp-rename');
const del             = require('del');
const critical        = require('critical').stream;


// ---------- Config ---------- //

const config = {
	// Pug
	pug: {
		input: './content/**/*.pug',
		output: './dist/',
		dontInclude: [
			'./src/pug/**/*.pug',
			'!src/pug/xml/template-rss-feed.pug'
		],
		pretty: false,
		xml: './src/pug/xml/template-rss-feed.pug'
	},

	// Sass
	sass: {
		input: './src/scss/**/*.scss',
		output: './dist/assets/styles/',
		prefix: 'last 2 versions'
	},

	// JavaScript
	js: {
		input: './src/js/**/*.js',
		utilInput: '/src/js/util/**/*.js',
		coreInput: '/src/js/core/**/*.js',
		vendorInput: '/src/js/vendor/**/*.js',
		output: './dist/assets/scripts',
		sourceMap: false
	},

	// BrowserSync
	browsersync: {
		baseDir: './dist/',
		doNotify: false
	},

	// FTP
	ftp: {
		input: ['./dist/**/*'],
		host: '',
		user: '',
		password: '',
		remoteDir: '',
		port: 21,
		numStreams: 3
	},

	// Other
	otherSettings: {
		serverPort: 3000	
	},

	// Delete dist folder
	delDist: [
		'./dist/**',
		'!./dist',
		'!./dist/assets/**',
		'!./dist/.htaccess',
		'!./dist/**/*.txt'	
	],

	// Error handling
	handleErrors: function( error ) {
		console.log( error );
		this.emit( 'end' );
	}
};


// ---------- Pug tasks ---------- //

gulp.task( 'pug', function() {
	gulp.src( config.pug.input )
		.pipe( puglint() )
		.pipe( pug({
			pretty: config.pug.pretty
		}) )
		.pipe( prettyURL() )
		.pipe( gulp.dest( config.pug.output ) )
		.pipe( browserSync.reload({ stream:true }) );
} );


// ---------- Sass tasks ---------- //

gulp.task( 'styles', function() {
	return gulp.src( config.sass.input )
		.pipe( sass() ).on( 'error', config.handleErrors )
		.pipe( autoprefixer({
			browsers: [ config.sass.prefix ]
		}) )
		.pipe( cleanCSS() )
		.pipe( gulp.dest( config.sass.output ) )
		.pipe( browserSync.reload({ stream:true }) );
} );


// ---------- JavaScript tasks ---------- //

gulp.task( 'scripts', function() {
	return gulp.src( config.js.input )
		.pipe( order([
			config.js.vendorInput,
			config.js.utilInput
		], { base:'./'}) )
		.on( 'error', config.handleErrors )
		.pipe( concat( 'script.js' ) )
		.pipe( uglify() )
		.pipe( gulp.dest( config.js.output ) )
		.pipe( browserSync.reload({ stream:true }) );
} );

// ---------- XML feed task ---------- //

gulp.task( 'xml', function() {
	gulp.src( config.pug.xml )
		.pipe( pug({
			pretty: true
		}) ).on( 'error', config.handleErrors )
		.pipe( rename( 'feed.xml' ) )
		.pipe( gulp.dest( config.pug.output ) )
} );

// ---------- Critical CSS task ---------- //

gulp.task( 'c', function() {
	gulp.src( config.pug.output + '**/*.html' )
		.pipe( critical({
			base: config.pug.output,
			css: [ config.pug.output + 'assets/styles/style.css' ],
			width: 1024,
			height: 768,
			extract: true,
			inline: true,
			minify: true
		}) )
		.pipe( gulp.dest( config.pug.output ) );
});


// ---------- FTP task ---------- //

gulp.task( 'd', function() {
	var conn = ftp.create({
		host: config.ftp.host,
		user: config.ftp.user,
		password: config.ftp.password,
		port: config.ftp.port,
		parallel: config.ftp.numStreams,
		log: gutil.log
	});

	return gulp.src( config.ftp.input, { base: './dist/', buffer: false } )
		.on( 'error', config.handleErrors )
		.pipe( conn.differentSize( config.ftp.remoteDir ) ).on( 'error', config.handleErrors )
		.pipe( conn.newer( config.ftp.remoteDir ) ).on( 'error', config.handleErrors )
		.pipe( conn.dest( config.ftp.remoteDir ) ).on( 'error', config.handleErrors );
} );


// ---------- Delete dist files ---------- //

gulp.task( 'del', function() {
	del( config.deldist );
} );


// ---------- Watch task ---------- //

gulp.task( 'w', ['pug','styles', 'scripts', 'xml'], function() {
	browserSync.init({
		server: {
			baseDir: config.browsersync.baseDir
		},
		notify: config.browsersync.doNotify
	});

	gulp.watch( [ config.pug.xml ], ['xml'] );
	gulp.watch( [ config.pug.input, config.pug.dontInclude ], ['pug'] );
	gulp.watch( config.sass.input, ['styles'] );
	gulp.watch( config.js.input, ['scripts'] );
} );


// ---------- Main Task ---------- //

gulp.task( 'default', ['pug', 'styles', 'scripts', 'xml'] );
