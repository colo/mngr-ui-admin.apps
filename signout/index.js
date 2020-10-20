'use strict'

let path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let debug = require('debug')('mngr-ui-admin:apps:signout'),
    debug_internals = require('debug')('mngr-ui-admin:apps:signout:Internals');


// const App =  process.env.NODE_ENV === 'production'
//       ? require('./config/prod.conf')
//       : require('./config/dev.conf');


module.exports = new Class({
  Extends: App,

	options: {

		id: 'signout',
		// path: 'signout',

		logs: {
			path: './logs'
		},


		params: {
		},

    content_type: /text\/plain|application\/x-www-form-urlencoded/,

		routes: {

			post: [
				{
				path: '',
				callbacks: ['signout'],
				version: '',
				},
			],
			get: [
				{
				path: '',
				callbacks: ['get'],
				version: '',
				},
			],
			all: [
				{
				path: '',
				callbacks: ['403'],
				version: '',
				},
			]
			// all: [
			// 	{
			// 		path: '',
			// 		callbacks: ['404'],
			// 		version: '',
			// 	},
			// ]
		},

		// api: {
    //   // content_type: /^application\/(?:x-.*\+json|json)(?:[\s;]|$)/,
    //
		// 	version: '1.0.0',
    //
		// 	routes: {
		// 		post: [
		// 			{
		// 			path: '',
		// 			callbacks: ['signout'],
		// 			version: '',
		// 			},
		// 		],
		// 		get: [
		// 			{
		// 			path: '',
		// 			callbacks: ['get'],
		// 			version: '',
		// 			},
		// 		],
		// 		all: [
		// 			{
		// 			path: '',
		// 			callbacks: ['501'],
		// 			version: '',
		// 			},
		// 		]
		// 	},
    //
		// },
  },

  signout: function(req, res, next){

    // if (req.isAuthenticated()) {
    //console.log('logout-authenticated');

		this.profile('logout');//start profiling
		this.log('logout', 'info', 'logout' + JSON.stringify( req.user ));

		// req.logout()

    /**
    * https://stackoverflow.com/questions/33112299/how-to-delete-cookie-on-logout-in-express-passport-js
    **/
    req.logOut();
    // res.status(200).clearCookie('SID', {
    res.status(200).clearCookie('connect.sid', {//using default name
      path: '/',
      secure: false,
      httpOnly: false,
      domain: 'localhost',
      sameSite: true,
    });
    req.session.destroy(function (err) {
      // res.redirect('/');
      res.send({'status': 'success'});
    });
    // req.session.destroy(function (err) {
    //   if (err) { return next(err); }
    //   req.user = null
    //   // The response should indicate that the user is no longer authenticated.
    //   // return res.send({ authenticated: req.isAuthenticated() });
    //   this.profile('logout');//stop profiling
  	// 	// }
    //
    //   res.json({'message': 'success'})
    //   debug('Logout Request', req.body, req.get('Content-Type'));
    // }.bind(this))

    // res.json({'message': 'success'})

		// if(req.is('application/json') || req.path.indexOf('/api') == 0){
		// 	res.json({'message': 'success'});
		// }
		// else{
		// 	// res.redirect(302, 'http://localhost:8083/')
    //   res.send({'status': 'success'});
		// }

    // process.exit(1)

		//debug(req.headers.authorization);

		// this.authenticate(req, res, next,  function(err, user, info) {
		// 	// debug(err);
		// 	// debug(user);
		// 	// debug(info);
    //
		// 	this.profile('signout_authenticate');
    //
		// 	if (err) {
		// 		//debug('--err--');
		// 		//debug(err);
    //
		// 		// res.status(403).json({'error': err});
    //     res.redirect(302, 'http://localhost:8083/signout')
		// 	}
		// 	else if (!user) {
    //
		// 		this.log('signout', 'warn', 'signout authenticate ' + info);
    //
		// 		// res.cookie('signout', false, { maxAge: 99999999, httpOnly: false });
    //
		// 		//req.flash('error', info);
		// 		// res.status(403).json({'error': info.message});
    //     res.redirect(302, 'http://localhost:8083/signout')
    //
		// 	}
		// 	else{
		// 		req.logIn(user, function(err) {
		// 			if (err) {
		// 				//debug('--err--');
		// 				//debug(err);
    //
		// 				this.log('signout', 'error', err);
		// 				// return next(err);
    //         // res.json(JSON.parse(JSON.stringify(err)));
    //         res.redirect(302, 'http://localhost:8083/signout')
		// 			}
    //
		// 			this.log('signout', 'info', 'signout authenticate ' + JSON.stringify(user));
    //
		// 			// res.cookie('user', JSON.stringify(user), { maxAge: 99999999, httpOnly: false });
    //
		// 			// res.send({'status': 'ok'});
    //       debug('login', user)
    //       req.session.user = user
    //       res.redirect(302, 'http://localhost:8083')
    //       // next()
    //
		// 		}.bind(this));
		// 	}
		// }.bind(this));


  },
  get: function(req, res, next){
    debug('get', req.body);


		res.status(200);

		res.format({
			'text/plain': function(){
				res.send('signout app');
			},

			'text/html': function(){
				res.send('<h1>signout app</h1');
			},

			'application/json': function(){
				res.send({info: 'signout app'});
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable');
			}
		});

  },
  initialize: function(options){
		this.profile('signout_init');//start profiling

    /**
		 * add 'check_authentication' & 'check_authorization' to each route
		 * */
    //  if(this.options.api && this.options.api.routes)
  	// 	Object.each(this.options.api.routes, function(routes, verb){
    //
  	// 		if(verb != 'all'){
  	// 			Array.each(routes, function(route){
  	// 				//debug('route: ' + verb);
  	// 				route.callbacks.erase('check_authorization');
  	// 				// route.callbacks.erase('check_authentication');
    //
  	// 				// if(verb == 'get')//users can "read" info
  	// 					route.roles = ['anonymous']
  	// 			});
  	// 		}
    //
  	// 	});
    //
		// if(this.options.io && this.options.io.routes)
    //   Object.each(this.options.io.routes, function(routes, verb){
    //
  	// 		if(verb != 'all'){
		// 			Array.each(routes, function(route){
		// 				//debug('route: ' + verb);
		// 				route.callbacks.erase('check_authorization');
		// 				// route.callbacks.erase('check_authentication');
    //
		// 				// if(verb == 'get')//users can "read" info
		// 					route.roles = ['anonymous']
		// 			});
  	// 		}
    //
  	// 	});

		this.parent(options);//override default options

		this.profile('signout_init');//end profiling

		this.log('signout', 'info', 'signout started');
  },

});
