'use strict'

const	path = require('path')

const App = require(path.join(process.cwd(), '/libs/App'))
// const App =  process.env.NODE_ENV === 'production'
//       ? require(path.join(process.cwd(), '/config/prod.conf'))
//       : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let debug = require('debug')('mngr-ui-admin:apps:root'),
    debug_internals = require('debug')('mngr-ui-admin:apps:root:Internals');

let eachOf = require( 'async' ).eachOf

const Pipeline = require('js-pipeline')

module.exports = new Class({
  Extends: App,


  // ON_HOSTS_UPDATED: 'onHostsUpdated',
  // ON_HOSTS_PERIODICAL_UPDATED: 'onHostsUpdated',
  //
  // ON_HOSTS_HISTORICAL_UPDATED: 'onHostsHistoricalUpdated',
  // ON_HOSTS_MINUTE_UPDATED: 'onHostsHistoricalUpdated',
  // ON_HOSTS_HOUR_UPDATED: 'onHostsHistoricalUpdated',
  //
  // ON_HOST_UPDATED: 'onHostUpdated',
  // ON_HOST_PERIODICAL_UPDATED: 'onHostUpdated',
  //
  // ON_HOST_HISTORICAL_UPDATED: 'onHostHistoricalUpdated',
  // ON_HOST_MINUTE_UPDATED: 'onHostHistoricalUpdated',
  // ON_HOST_HOUR_UPDATED: 'onHostHistoricalUpdated',
  //
  // ON_HOST_RANGE: 'onHostRange',
  // ON_HOST_RANGE_PERIODICAL: 'onHostRange',
  //
  // ON_HOST_RANGE_HISTORICAL: 'onHostRangeHistorical',
  // ON_HOST_RANGE_MINUTE: 'onHostRangeHistorical',
  // ON_HOST_RANGE_HOUR: 'onHostRangeHistorical',
  //
  // ON_HOST_INSTANCES_UPDATED: 'onHostInstancesUpdated',
  // ON_HOST_INSTANCES_PERIODICAL_UPDATED: 'onHostInstancesUpdated',
  //
  // ON_HOST_INSTANCES_HISTORICAL_UPDATED: 'onHostInstancesHistoricalUpdated',
  // ON_HOST_INSTANCES_MINUTE_UPDATED: 'onHostInstancesHistoricalUpdated',
  // ON_HOST_INSTANCES_HOUR_UPDATED: 'onHostInstancesHistoricalUpdated',
  //
  // ON_HOST_PATHS_UPDATED: 'onHostPathsUpdated',
  // ON_HOST_PATHS_PERIODICAL_UPDATED: 'onHostPathsUpdated',
  //
  // ON_HOST_PATHS_HISTORICAL_UPDATED: 'onHostPathsHistoricalUpdated',
  // ON_HOST_PATHS_MINUTE_UPDATED: 'onHostPathsHistoricalUpdated',
  // ON_HOST_PATHS_HOUR_UPDATED: 'onHostPathsHistoricalUpdated',
  //
  // ON_HOST_DATA_UPDATED: 'onHostDataUpdated',
  // ON_HOST_DATA_PERIODICAL_UPDATED: 'onHostDataUpdated',
  //
  // ON_HOST_DATA_HISTORICAL_UPDATED: 'onHostDataHistoricalUpdated',
  // ON_HOST_DATA_MINUTE_UPDATED: 'onHostDataHistoricalUpdated',
  // ON_HOST_DATA_HOUR_UPDATED: 'onHostDataHistoricalUpdated',
  //
  // ON_HOST_DATA_RANGE_UPDATED: 'onHostDataRangeUpdated',
  // ON_HOST_DATA_RANGE_PERIODICAL_UPDATED: 'onHostDataRangeUpdated',
  //
  // ON_HOST_DATA_RANGE_HISTORICAL_UPDATED: 'onHostDataRangeHistoricalUpdated',
  // ON_HOST_DATA_RANGE_MINUTE_UPDATED: 'onHostDataRangeHistoricalUpdated',
  // ON_HOST_DATA_RANGE_HOUR_UPDATED: 'onHostDataRangeHistoricalUpdated',

  // CHART_INSTANCE_TTL: 60000,
  // SESSIONS_TTL: 60000,
  // HOSTS_TTL: 60000,
  //
  // RANGE_SECONDS_LIMIT: 300,
  // RANGE_WORKERS_CONCURRENCY: 1,
  // RANGE_WORKERS_RATE: 5,
  //
  // cache: undefined,
  //
  // session_store: undefined,
  ALL_TTL: 60000,
  __internal_pipeline: undefined,
  __internal_pipeline_cfg: {},

  options: {
    table: 'os',
    tables: ['os', 'logs', 'munin'],
    pipeline: require('./pipelines/index')({
      conn: Object.merge(
        Object.clone(require(ETC+'ui.conn.js')()),
        {db: 'devel', table: 'os'}
      )
      // host: this.options.host,
      // cache: this.options.cache_store,
      // ui: (this.options.on_demand !== true) ? undefined : Object.merge(
      //   ui_rest_client_conf,
      //   {
      //     load: 'apps/hosts/clients'
      //   }
      // )
    }),

    internal_pipeline: require('./pipelines/internal')({
      conn: Object.merge(
        Object.clone(require(ETC+'ui.conn.js')()),
        {db: 'devel'}
      )

    }),

    // ui_rest_client: undefined,

    id: 'all',
    path: '/',

    // host: {
    //   properties: ['paths', 'data', 'data_range'],//to send to pipelines.input.*.host.js
    // },

    authorization: undefined,

    // params: {
		// 	host: /(.|\s)*\S(.|\s)*/,
    //   prop: /data|paths|instances|data_range/,
    //   events: /hosts|paths/,
    //   // stat:
		// },


    api: {
      path: '',
			routes: {
				get: [
					// {
          //   path: ':host/instances/:instances?',
          //   callbacks: ['host_instances'],
          //   version: '',
          // },
          // {
          //   path: 'minute/:host?/:prop?/:paths?',
          //   callbacks: ['hosts'],
          //   version: '',
          // },
          // {
          //   path: 'hour/:host?/:prop?/:paths?',
          //   callbacks: ['hosts'],
          //   version: '',
          // },
          // {
          //   // path: ':host?/:prop?/:paths?',
          //   path: 'domains/:domain',
          //   callbacks: ['domain'],
          //   version: '',
          // },
          // {
          //   // path: ':host?/:prop?/:paths?',
          //   path: ':path/:prop?',
          //   callbacks: ['all'],
          //   version: '',
          // },
          // {
          //   // path: ':host?/:prop?/:paths?',
          //   path: ':path?',
          //   callbacks: ['all'],
          //   version: '',
          // },
          {
            path: ':prop/:value?',
            callbacks: ['all'],
            version: '',
          },
          {
            // path: ':host?/:prop?/:paths?',
            path: ':prop?',
            callbacks: ['all'],
            version: '',
          },
				],

        // all: [{
        //   path: ':anything?',
        //   callbacks: [function(req, resp, next){
        //     resp.status(404).json({err: 'not found', status: 404})
        //   }],
        // }]
			},
		},

		io: {
			// middlewares: [], //namespace.use(fn)
			// rooms: ['root'], //atomatically join connected sockets to this rooms
			routes: {

        // 'instances': [{
				// 	// path: ':host/instances/:instances?',
				// 	// once: true, //socket.once
				// 	callbacks: ['host_instances'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
        '/': [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['all', 'register'],
					// middlewares: [], //socket.use(fn)
				}],
        'on': [
          {
            // path: ':events',
            // once: true, //socket.once
            callbacks: ['register'],
            // middlewares: [], //socket.use(fn)
          }
        ],
        // 'on': [
        //   {
  			// 		// path: ':events',
  			// 		// once: true, //socket.once
  			// 		callbacks: ['register'],
  			// 		// middlewares: [], //socket.use(fn)
  			// 	}
        // ],
        'off': [
          {
  					// path: ':events',
  					// once: true, //socket.once
  					callbacks: ['unregister'],
  					// middlewares: [], //socket.use(fn)
  				}
        ],
			}
		},

    // expire: 1000,//ms
	},
  initialize: function(options){

    this.__internal_pipeline = new Pipeline(this.options.internal_pipeline)

    this.__internal_pipeline.addEvent(this.__internal_pipeline.ON_SAVE_DOC, function(doc){
      let {id, type} = doc

      debug_internals('__internal_pipeline onSaveDoc %o', doc)
      // process.exit(1)
      if(id === 'tables' && doc.data.length > 0){
        this.options.tables = doc.data
      }
      //   this.fireEvent(id, [undefined, doc])
      //
      // if(type)
      //   this.fireEvent(type, [undefined, doc])
      //
      // // // this.__emit_stats(host, stats)
    }.bind(this))

    this.__internal_pipeline.addEvent(this.__internal_pipeline.ON_DOC_ERROR, function(err, resp){
      let {id, type} = resp

      debug_internals('__internal_pipeline onDocError %o', err, resp)
      // if(id)
      //   this.fireEvent(id, [err, resp])
      //
      // if(type)
      //   this.fireEvent(type, [err, resp])
      //
      // // // this.__emit_stats(host, stats)
    }.bind(this))

    this.__internal_pipeline_cfg = {
      ids: [],
      connected: [],
      suspended: this.__internal_pipeline.inputs.every(function(input){ return input.options.suspended }, this)
    }

    this.__after_connect_inputs(
      this.__internal_pipeline,
      this.__internal_pipeline_cfg,
      this.__resume_pipeline.pass([this.__internal_pipeline, this.__internal_pipeline_cfg, this.ID, function(){
        debug('__resume_pipeline CALLBACK')
        this.__internal_pipeline.fireEvent('onOnce')
        // this.__internal_pipeline.fireEvent('onResume')
      }.bind(this), false], this)
    )


    this.parent(options)
    debug('end INITIALIZE')
  },
  unregister: function(){
    let {req, resp, socket, next, opts} = this._arguments(arguments)
    // let id = this.__get_id_socket_or_req(socket)
    let id = this.create_response_id(socket, opts, true)
    debug_internals('UNregister: ', opts)
    // process.exit(1)

    if(Array.isArray(opts)){
      let _query = opts[0]
      opts = opts[1]
      opts.query = { 'unregister': _query }
    }
    else if (!opts.query.unregister){
      opts.query.unregister = true
    }

    /**
    * refactor: same as "logs" function
    **/
    if(opts.body && opts.query)
      opts.query = Object.merge(opts.query, opts.body)

    if(opts.body && opts.body.params && opts.params)
      opts.params = Object.merge(opts.params, opts.body.params)

    let params = opts.params
    let range = (req) ? req.header('range') : (opts.headers) ?  opts.headers.range : opts.range
    let query = opts.query
    // if(opts.body && opts.body.q && opts.query)
    //   opts.query.q = opts.body.q
    //
    // if(opts.body && opts.body.fields && opts.query)
    //   opts.query.fields = opts.body.fields
    //
    // if(opts.body && opts.body.transformation && opts.query)
    //   opts.query.transformation = opts.body.transformation
    //
    // if(opts.body && opts.body.aggregation && opts.query)
    //   opts.query.aggregation = opts.body.aggregation
    //
    // if(opts.body && opts.body.interval && opts.query)
    //   opts.query.interval = opts.body.interval
    //
    // if(opts.body && opts.body.filter && opts.query)
    //   opts.query.filter = opts.body.filter
    /**
    * "format" is for formating data and need at least metadata: [timestamp, path],
    * so add it if not found on query
    **/
    if(opts.query && opts.query.format && opts.query.format !== 'merged'){//for stat || tabular
      if(!opts.query.q || typeof opts.query.q === 'string') opts.query.q = []
      let metadata = ['timestamp', 'path']

      if(!opts.query.q.contains('metadata') && !opts.query.q.some(function(item){ return item.metadata }))
        opts.query.q.push({metadata: metadata})

      Object.each(opts.query.q, function(item){
        if(item.metadata){
          item.metadata.combine(metadata)
        }
      })

      if(!opts.query.q.contains('data') && !opts.query.q.some(function(item){ return item.data }))
        opts.query.q.push('data')
    }
    /**
    * refactor: same as "logs" function
    **/


    debug_internals('UN register: ', id, opts)
    // process.exit(1)

    let from = (opts.query && opts.query.from) ? opts.query.from : this.options.table //else -> default table

    let _params = {
      response: id,
      // input: (params.prop) ? 'log' : 'logs',
      input: 'all',
      from: from,
      // params,
      range,
      // query,
      opts,
      // next: function(id, err, result, opts){
      //   let format = (opts && opts.query) ? opts.query.format : undefined
      //
      //   this.data_formater(result.data, format, function(data){
      //
      //     result.data = data
      //     // debug('data_formater', data, responses[key])
      //     // to_output()
      //     this.generic_response({err, result, resp: undefined, socket, input: 'all', opts})
      //
      //   }.bind(this))
      //
      //
      // }.bind(this)

    }

    // if(opts.query.register === 'periodical'){
    //   delete opts.query.register
    //   let interval = opts.query.interval || this.DEFAULT_PERIODICAL_INTERVAL
    //
    //   this.register_interval(id, this.get_from_input.bind(this), interval, _params)
    //   // setInterval(this.get_from_input.bind(this), interval, _params)
    // }
    // else{
      this.get_from_input(_params)
    // }
  },
  register: function(){
    let {req, resp, socket, next, opts} = this._arguments(arguments)
    // let id = this.__get_id_socket_or_req(socket)
    let id = this.create_response_id(socket, opts, true)
    debug_internals('register: ', opts)

    if(Array.isArray(opts)){
      let _query = opts[0]
      opts = opts[1]
      opts.query = { 'register': _query }
    }

    /**
    * refactor: same as "logs" function
    **/
    if(opts.body && opts.query)
      opts.query = Object.merge(opts.query, opts.body)

    if(opts.body && opts.body.params && opts.params)
      opts.params = Object.merge(opts.params, opts.body.params)

    let params = opts.params
    let range = (req) ? req.header('range') : (opts.headers) ?  opts.headers.range : opts.range
    let query = opts.query
    // if(opts.body && opts.body.q && opts.query)
    //   opts.query.q = opts.body.q
    //
    // if(opts.body && opts.body.fields && opts.query)
    //   opts.query.fields = opts.body.fields
    //
    // if(opts.body && opts.body.transformation && opts.query)
    //   opts.query.transformation = opts.body.transformation
    //
    // if(opts.body && opts.body.aggregation && opts.query)
    //   opts.query.aggregation = opts.body.aggregation
    //
    // if(opts.body && opts.body.interval && opts.query)
    //   opts.query.interval = opts.body.interval
    //
    // if(opts.body && opts.body.filter && opts.query)
    //   opts.query.filter = opts.body.filter
    /**
    * "format" is for formating data and need at least metadata: [timestamp, path],
    * so add it if not found on query
    **/
    if(opts.query && opts.query.format && opts.query.format !== 'merged'){//for stat || tabular
      if(!opts.query.q || typeof opts.query.q === 'string') opts.query.q = []
      let metadata = ['timestamp', 'path']

      if(!opts.query.q.contains('metadata') && !opts.query.q.some(function(item){ return item.metadata }))
        opts.query.q.push({metadata: metadata})

      Object.each(opts.query.q, function(item){
        if(item.metadata){
          item.metadata.combine(metadata)
        }
      })

      if(!opts.query.q.contains('data') && !opts.query.q.some(function(item){ return item.data }))
        opts.query.q.push('data')
    }
    /**
    * refactor: same as "logs" function
    **/


    debug_internals('register: ', id, opts)
    let from = (opts.query && opts.query.from) ? opts.query.from : this.options.table //else -> default table

    let _params = {
      response: id,
      // input: (params.prop) ? 'log' : 'logs',
      input: 'all',
      from: from,
      // params,
      range,
      // query,
      opts,
      next: function(id, err, result, opts){
        let format = (opts && opts.query) ? opts.query.format : undefined

        if(format){
          this.data_formater(result.data, format, function(data){

            result.data = data
            // debug('data_formater', data, responses[key])
            // to_output()
            this.generic_response({err, result, resp: undefined, socket, input: 'all', opts})

          }.bind(this))
        }
        else{
          // debug('to reponse %o', result)
          // process.exit(1)
          this.generic_response({err, result, resp: undefined, socket, input: 'all', opts})
        }


      }.bind(this)

    }

    this.get_from_input(_params)



  },
  all: function(){
    let {req, resp, socket, next, opts} = this._arguments(arguments)
    if(opts.query && opts.query.register && socket){
      next()
      // this.register.attempt(arguments, this)
    }
    else{
      debug_internals('root: %o %o %o', opts.params, opts.query, opts.body)
      // debug_internals('root: %o %o %o', arguments)
      if(opts.body && opts.query)
        opts.query = Object.merge(opts.query, opts.body)

      if(opts.body && opts.body.params && opts.params)
        opts.params = Object.merge(opts.params, opts.body.params)

      if(opts.query && opts.query.params && opts.params){
        opts.params = Object.merge(opts.params, opts.query.params)
        delete opts.query.params
      }


      let params = opts.params
      let range = (req) ? req.header('range') : (opts.headers) ?  opts.headers.range : opts.range
      let query = opts.query


      // if(opts.body && opts.body.q && opts.query)
      //   opts.query.q = opts.body.q
      //
      // if(opts.body && opts.body.fields && opts.query)
      //   opts.query.fields = opts.body.fields
      //
      // if(opts.body && opts.body.transformation && opts.query)
      //   opts.query.transformation = opts.body.transformation
      //
      // if(opts.body && opts.body.aggregation && opts.query)
      //   opts.query.aggregation = opts.body.aggregation
      //
      // if(opts.body && opts.body.interval && opts.query)
      //   opts.query.interval = opts.body.interval
      //
      // if(opts.body && opts.body.filter && opts.query)
      //   opts.query.filter = opts.body.filter
      /**
      * "format" is for formating data and need at least metadata: [timestamp, path],
      * so add it if not found on query
      **/
      if(opts.query && opts.query.format && opts.query.format !== 'merged'){//for stat || tabular
        if(!opts.query.q || typeof opts.query.q === 'string') opts.query.q = []
        let metadata = ['timestamp', 'path']

        if(!opts.query.q.contains('metadata') && !opts.query.q.some(function(item){ return item.metadata }))
          opts.query.q.push({metadata: metadata})

        Object.each(opts.query.q, function(item){
          if(item.metadata){
            item.metadata.combine(metadata)
          }
        })

        if(!opts.query.q.contains('data') && !opts.query.q.some(function(item){ return item.data }))
          opts.query.q.push('data')
      }

      // let {id, chain} = this.register_response((req) ? req : socket, opts, function(err, result){
      //   debug_internals('all registered response', err, opts)
      //   // this.generic_response({err, result, resp, input: 'all', format: opts.query.format})
      //   // opts.response = id
      //   this.generic_response({err, result, resp, socket, input: 'all', opts})
      //
      //   // if(query.register && req){//should happend only on ENV != "production"
      //   //   query.unregister = query.register
      //   //   delete query.register
      //   //   this.get_from_input({
      //   //     response: id,
      //   //     // input: (params.prop) ? 'log' : 'logs',
      //   //     input: 'all',
      //   //     from: 'periodical',
      //   //     params,
      //   //     range,
      //   //     query,
      //   //     // next: (id, err, result) => this.response(id, err, result)
      //   //
      //   //   })
      //   // }
      //
      // }.bind(this))

      // let responses = []
      let responses = {}
      let from = (opts.query && opts.query.from) ? opts.query.from : this.options.tables
      from = (Array.isArray(from)) ? from : [from]


      eachOf(from, function (from, key, callback) {



        this.get_from_input({
          response: this.create_response_id((req) ? req : socket, opts),
          from: from,
          // input: (params.prop) ? 'log' : 'logs',
          // input: (params.path) ? params.path : 'all',
          input: 'all',
          // from: 'periodical',
          // params,
          range,
          // query,
          opts,
          next: function(id, err, result){
            debug('NEXT', id, err, result)
            // responses.push(result)
            responses[from] = result
            callback()
          }.bind(this)

        })

      }.bind(this), function (err) {
        // debug('eachOf CALLBACK', err)
        // process.exit(1)
        let format = (opts && opts.query) ? opts.query.format : undefined
        if(format){
          eachOf(responses, function (value, key, to_output) {
            debug('RESPONSES %s %o', key, value)
            this.data_formater(value.data, format, function(data){

              value.data = data
              debug('data_formater', data, responses[key])
              to_output()
            }.bind(this))

          }.bind(this), function (err) {
            debug('OUTPUT %o', responses)
            // process.exit(1)
            let result = {id: [], data: {}, metadata: undefined}
            // result.metadata.from = []
            Object.each(responses, function(resp, key){
              result.id.push(resp.id)
              if(resp.data){
                result.data[key] = resp.data
                // result.data.combine(resp.data)
              }
              if(!result.metadata){
                result.metadata = Object.clone(resp.metadata)
                result.metadata.from = []
              }

              result.metadata.from.push(resp.metadata.from)
            }.bind(this))

            debug('RESULT %o', result)
            this.generic_response({err, result, resp, socket, input: 'all', opts})

          }.bind(this));
        }
        else{
          let result = {id: [], data: {}, metadata: undefined}
          // result.metadata.from = []
          // let counter = 0
          Object.each(responses, function(value, key){
            result.id.push(value.id)
            if(value.data)
              result.data[key] = value.data

            if(!result.metadata){
              result.metadata = Object.clone(value.metadata)
              result.metadata.from = []
            }

            result.metadata.from.push(value.metadata.from)

            // if(counter >= Object.getLength(responses) - 1){
            //
            // }
            //
            // counter++
          }.bind(this))

          debug('RESULT %o', result)
          this.generic_response({err, result, resp, socket, input: 'all', opts})

        }

      }.bind(this))



    }

  },

});
