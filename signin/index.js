'use strict'

let path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let debug = require('debug')('mngr-ui-admin:apps:signin'),
    debug_internals = require('debug')('mngr-ui-admin:apps:signin:Internals');


// const App =  process.env.NODE_ENV === 'production'
//       ? require('./config/prod.conf')
//       : require('./config/dev.conf');


module.exports = new Class({
  Extends: App,

	options: {

		id: 'signin',
		// path: 'signin',

		logs: {
			path: './logs'
		},


		params: {
		},

    // content_type: /text\/plain|application\/x-www-form-urlencoded/,

		routes: {

			post: [
				{
				path: '',
				callbacks: ['signin'],
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

		api: {
      // content_type: /^application\/(?:x-.*\+json|json)(?:[\s;]|$)/,

			version: '1.0.0',

			routes: {
				post: [
					{
					path: '',
					callbacks: ['signin'],
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
					callbacks: ['501'],
					version: '',
					},
				]
			},

		},
  },

  signin: function(req, res, next){
		debug('Login Request', req.body, req.get('Content-Type'));
    // process.exit(1)

		//debug(req.headers.authorization);

		this.authenticate(req, res, next,  function(err, user, info) {
			// debug(err);
			// debug(user);
			// debug(info);

			this.profile('signin_authenticate');

			if (err) {
				//debug('--err--');
				//debug(err);

				res.status(403).json({'error': err});
        // res.redirect(302, 'http://localhost:8083/signin')
			}
			else if (!user) {

				this.log('signin', 'warn', 'signin authenticate ' + info);

				// res.cookie('signin', false, { maxAge: 99999999, httpOnly: false });

				//req.flash('error', info);
				res.status(403).json({'error': err.message});
        // res.redirect(302, 'http://localhost:8083/signin')

			}
			else{
				req.logIn(user, function(err) {
					if (err) {
						//debug('--err--');
						//debug(err);

						this.log('signin', 'error', err);
						// return next(err);
            // res.json(JSON.parse(JSON.stringify(err)));
            // res.redirect(302, 'http://localhost:8083/signin')
            res.status(403).json({'error': err.message});
					}

					this.log('signin', 'info', 'signin authenticate ' + JSON.stringify(user));

					// res.cookie('user', JSON.stringify(user), { maxAge: 99999999, httpOnly: false });

					// res.send({'status': 'ok'});
          debug('login', user)
          req.session.user = user
          res.status(200).json({'message': 'success'});
          // res.redirect(302, 'http://localhost:8083')
          // next()

				}.bind(this));
			}
		}.bind(this));


  },
  get: function(req, res, next){
    debug('get', req.body);


		res.status(200);

		res.format({
			'text/plain': function(){
				res.send('signin app');
			},

			'text/html': function(){
				res.send('<h1>signin app</h1');
			},

			'application/json': function(){
				res.send({info: 'signin app'});
			},

			'default': function() {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable');
			}
		});

  },
  initialize: function(options){
		this.profile('signin_init');//start profiling

    /**
		 * add 'check_authentication' & 'check_authorization' to each route
		 * */
     if(this.options.api && this.options.api.routes)
  		Object.each(this.options.api.routes, function(routes, verb){

  			// if(verb != 'all'){
  				Array.each(routes, function(route){
  					// debug('route: ' + verb);
  					// route.callbacks.erase('check_authorization');
  					// route.callbacks.erase('check_authentication');

  					// if(verb == 'get')//users can "read" info
  						route.roles = ['anonymous']
  				});
  			// }

  		});

		if(this.options.io && this.options.io.routes)
      Object.each(this.options.io.routes, function(routes, verb){

  			// if(verb != 'all'){
					Array.each(routes, function(route){
						//debug('route: ' + verb);
						// route.callbacks.erase('check_authorization');
						// route.callbacks.erase('check_authentication');

						// if(verb == 'get')//users can "read" info
							route.roles = ['anonymous']
					});
  			// }

  		});

		this.parent(options);//override default options

		this.profile('signin_init');//end profiling

		this.log('signin', 'info', 'signin started');
  },

});
