'use strict'

const	path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let debug = require('debug')('mngr-ui-admin:apps:user'),
    debug_internals = require('debug')('mngr-ui-admin:apps:user:Internals');

// let eachOf = require( 'async' ).eachOf
//
// const Pipeline = require('js-pipeline')

module.exports = new Class({
  Extends: App,



  options: {

    id: 'user',
    // path: '/',

    routes: {
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
					callbacks: ['404'],
					version: '',
				},
			]
		},

    api: {
      path: '',
			routes: {
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
            callbacks: ['404'],
            version: '',
          },
				],

			},
		},

		io: {
			// middlewares: [], //namespace.use(fn)
			// rooms: ['root'], //atomatically join connected sockets to this rooms
			routes: {
        '/': [{
					callbacks: ['get'],
				}],
			}
		},

    // expire: 1000,//ms
	},
  initialize: function(options){

    this.parent(options)

  },
  get: function(){
    let {req, resp, socket, next, opts} = this._arguments(arguments)

    let session = (socket && socket.handshake) ? socket.handshake.session : req.session
    // debug('GET', session)
    // process.exit(1)

    let response

    if(session.user){
      response = session.user
    }
    else{
      response = {
        status: 403,
        error: 'No user data on session'
      }
    }

    if(socket){
      socket.emit('user', response)
    }
    else{
      resp.status(response.status || 200).json(response)
    }

		// debug_internals('get %o', session)
    // process.exit(1)

    // if(opts.query && opts.query.register && socket){
    //   next()
    // }
    // else{
    //   debug_internals('root: %o %o %o', opts.params, opts.query, opts.body)
    //   // debug_internals('root: %o %o %o', arguments)
    //   if(opts.body && opts.query)
    //     opts.query = Object.merge(opts.query, opts.body)
    //
    //   if(opts.body && opts.body.params && opts.params)
    //     opts.params = Object.merge(opts.params, opts.body.params)
    //
    //   if(opts.query && opts.query.params && opts.params){
    //     opts.params = Object.merge(opts.params, opts.query.params)
    //     delete opts.query.params
    //   }
    //
    //
    //   let params = opts.params
    //   let range = (req) ? req.header('range') : (opts.headers) ?  opts.headers.range : opts.range
    //   let query = opts.query
    //
    //   let data_formater_full = false
    //   if(opts.query && opts.query.format){//for stat || tabular || merged
    //     if(!opts.query.q || typeof opts.query.q === 'string') opts.query.q = []
    //     let metadata = ['timestamp', 'path']
    //
    //     if(opts.query.q.contains('metadata') || opts.query.q.some(function(item){ return item.metadata })) data_formater_full = true
    //
    //     if(!opts.query.q.contains('metadata') && !opts.query.q.some(function(item){ return item.metadata }))
    //       opts.query.q.push({metadata: metadata})
    //
    //     Object.each(opts.query.q, function(item){
    //       if(item.metadata){
    //         item.metadata.combine(metadata)
    //       }
    //     })
    //
    //     if(!opts.query.q.contains('data') && !opts.query.q.some(function(item){ return item.data }))
    //       opts.query.q.push('data')
    //   }
    //
    //   let responses = {}
    //   let from = (opts.query && opts.query.from) ? opts.query.from : this.options.tables
    //   from = (Array.isArray(from)) ? from : [from]
    //
    //
    //   eachOf(from, function (from, key, callback) {
    //
    //
    //
    //     this.get_from_input({
    //       response: this.create_response_id((req) ? req : socket, opts),
    //       from: from,
    //       // input: (params.prop) ? 'log' : 'logs',
    //       // input: (params.path) ? params.path : 'all',
    //       input: 'all',
    //       // from: 'periodical',
    //       // params,
    //       range,
    //       // query,
    //       opts,
    //       next: function(id, err, result){
    //         debug('NEXT', id, err, result)
    //         // responses.push(result)
    //         responses[from] = result
    //         callback()
    //       }.bind(this)
    //
    //     })
    //
    //   }.bind(this), function (err) {
    //     // debug('eachOf CALLBACK', err)
    //     // process.exit(1)
    //     let format = (opts && opts.query) ? opts.query.format : undefined
    //     if(format){
    //       // debug('RESPONSES %s %o', responses)
    //
    //       eachOf(responses, function (value, key, to_output) {
    //         // debug('RESPONSES %s %o', key, value)
    //         // process.exit(1)
    //         debug('DATA FORMATER FULL', data_formater_full)
    //         // process.exit(1)
    //         if(opts.query.index !== false){//data get grouped onto arrays
    //           eachOf(value.data, function (grouped_value, grouped_key, to_grouped_output) {
    //             this.data_formater(grouped_value, format, data_formater_full, function(data){
    //
    //               value.data[grouped_key] = data
    //               debug('data_formater', data, responses[key])
    //               to_grouped_output()
    //             }.bind(this))
    //
    //           }.bind(this), function (err) {
    //             debug('PRE OUTPUT %o', responses)
    //             // process.exit(1)
    //             to_output()
    //           }.bind(this));
    //         }
    //         else{
    //           this.data_formater(value.data, format, data_formater_full, function(data){
    //
    //             value.data = data
    //             debug('data_formater', data, responses[key])
    //             to_output()
    //           }.bind(this))
    //         }
    //
    //       }.bind(this), function (err) {
    //         debug('OUTPUT %o', responses)
    //         // process.exit(1)
    //         let result = {id: [], data: {}, metadata: undefined}
    //         // result.metadata.from = []
    //         Object.each(responses, function(resp, key){
    //           result.id.push(resp.id)
    //           if(resp.data){
    //             result.data[key] = resp.data
    //             // result.data.combine(resp.data)
    //           }
    //           if(!result.metadata){
    //             result.metadata = Object.clone(resp.metadata)
    //             result.metadata.from = []
    //           }
    //
    //           result.metadata.from.push(resp.metadata.from)
    //         }.bind(this))
    //
    //         debug('RESULT %o', result)
    //         this.generic_response({err, result, resp, socket, input: 'all', opts})
    //
    //       }.bind(this));
    //     }
    //     else{
    //       let result = {id: [], data: {}, metadata: undefined}
    //       // result.metadata.from = []
    //       // let counter = 0
    //       Object.each(responses, function(value, key){
    //         result.id.push(value.id)
    //         if(value.data)
    //           result.data[key] = value.data
    //
    //         if(!result.metadata){
    //           result.metadata = Object.clone(value.metadata)
    //           result.metadata.from = []
    //         }
    //
    //         result.metadata.from.push(value.metadata.from)
    //
    //         // if(counter >= Object.getLength(responses) - 1){
    //         //
    //         // }
    //         //
    //         // counter++
    //       }.bind(this))
    //
    //       debug('RESULT %o', result)
    //       this.generic_response({err, result, resp, socket, input: 'all', opts})
    //
    //     }
    //
    //   }.bind(this))
    //
    //
    //
    // }

  },

});
