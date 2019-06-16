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
  ALL_TTL: 10000,

	options: {
    pipeline: require('./pipelines/index')({
      conn: Object.merge(
        require(ETC+'ui.conn.js')(),
        {db: 'logs'}
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
    //
		// io: {
		// 	// middlewares: [], //namespace.use(fn)
		// 	// rooms: ['root'], //atomatically join connected sockets to this rooms
		// 	routes: {
    //
    //     'instances': [{
		// 			// path: ':host/instances/:instances?',
		// 			// once: true, //socket.once
		// 			callbacks: ['host_instances'],
		// 			// middlewares: [], //socket.use(fn)
		// 		}],
    //     '/': [{
		// 			// path: ':param',
		// 			// once: true, //socket.once
		// 			callbacks: ['hosts'],
		// 			// middlewares: [], //socket.use(fn)
		// 		}],
    //     'on': [
    //       {
  	// 				// path: ':events',
  	// 				// once: true, //socket.once
  	// 				callbacks: ['register'],
  	// 				// middlewares: [], //socket.use(fn)
  	// 			}
    //     ],
    //     'off': [
    //       {
  	// 				// path: ':events',
  	// 				// once: true, //socket.once
  	// 				callbacks: ['unregister'],
  	// 				// middlewares: [], //socket.use(fn)
  	// 			}
    //     ],
		// 	}
		// },

    // expire: 1000,//ms
	},

  all: function(req, resp, next){
    debug_internals('all:', req.params)
    let params = req.params
    let range = req.header('range')

    let {id, chain} = this.register_response((req) ? req : socket, function(err, result){
      debug_internals('send_resp', err, result)
      let status = (err && err.status) ? err.status : ((err) ? 500 : 200)
      if(err)
        result = Object.merge(err, result)

      if(resp){
        resp.status(status).json(result)
      }
      else{
        socket.emit('all', result)
      }
    }.bind(this))

    this.get_from_input({
      response: id,
      // input: (params.prop) ? 'log' : 'logs',
      input: (params.path) ? params.path : 'all',
      from: 'periodical',
      params: params,
      range,
      next: (id, err, result) => this.response(id, err, result)

    })
    // // let _recive_pipe = function(pipeline){
    // //   debug_internals('logs pipeline', pipeline)
    // //   this.removeEvent(this.ON_PIPELINE_READY, _recive_pipe)
    // // }
    // // this.addEvent(this.ON_PIPELINE_READY, _recive_pipe)
    // // OR
    // this.get_pipeline(undefined, function(pipeline){
    //   debug_internals('logs get_pipeline', pipeline)
    //
    //   this.response(id, ['some', 'args'])
    // }.bind(this))
  },

});
