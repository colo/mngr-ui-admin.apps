'use strict'

var	path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let Pipeline = require('js-pipeline')
let jscaching = require('js-caching')

let RethinkDBStoreIn = require('js-caching/libs/stores/rethinkdb').input
let RethinkDBStoreOut = require('js-caching/libs/stores/rethinkdb').output

// let cache = new jscaching({
//   suspended: false,
//   stores: [
//     {
//       id: 'rethinkdb',
//       conn: [
//         {
//           host: 'elk',
//           port: 28015,
//           db: 'servers',
//           table: 'cache',
//           module: RethinkDBStoreIn,
//         },
//       ],
//       module: RethinkDBStoreOut,
//     }
//   ],
// })


let HostsPipeline = require('./pipelines/index')(require(ETC+'default.conn.js')())

// let extract_data_os = require( 'node-mngr-docs' ).extract_data_os
// let data_to_tabular  = require( 'node-tabular-data' ).data_to_tabular
//
// let uptime_chart = require('mngr-ui-admin-charts/os/uptime')
// let loadavg_chart = require('mngr-ui-admin-charts/os/loadavg')
// let cpus_times_chart = require('mngr-ui-admin-charts/os/cpus_times')
// let cpus_percentage_chart = require('mngr-ui-admin-charts/os/cpus_percentage')
// let freemem_chart = require('mngr-ui-admin-charts/os/freemem')
// let mounts_percentage_chart = require('mngr-ui-admin-charts/os/mounts_percentage')
// let blockdevices_stats_chart = require('mngr-ui-admin-charts/os/blockdevices_stats')
// let networkInterfaces_chart = require('mngr-ui-admin-charts/os/networkInterfaces')
// let networkInterfaces_stats_chart = require('mngr-ui-admin-charts/os/networkInterfaces_stats')
// // let procs_count_chart = require('mngr-ui-admin-charts/os/procs_count')
// let procs_top_chart = require('mngr-ui-admin-charts/os/procs_top')
// let munin = require('mngr-ui-admin-charts/munin/default')

let debug = require('debug')('mngr-ui-admin:apps:hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Internals');

module.exports = new Class({
  Extends: App,

  // HostPipeline: undefined,
  // pipelines: {},
  // __stats: {},
  // __stats_tabular: {},
  //
  // charts:{},
  //
  // __charts_instances:{},



  // __charts: {
  //   'os.uptime': {chart: uptime_chart},
  //   'os.loadavg': {chart: loadavg_chart},
  //   'os.cpus': {
  //     times: { chart: cpus_times_chart },
  //     percentage : { chart: cpus_percentage_chart }
  //   },
  //   'os_procs_uid_stats':{
  //     top: {'matched_name': true, match: '%s', chart: procs_top_chart },
  //   },
  //   'os_procs_cmd_stats':{
  //     top: {'matched_name': true, match: '%s', chart: procs_top_chart },
  //   },
  //   'os_procs_stats':{
  //     top: {'matched_name': true, match: '%s', chart: procs_top_chart },
  //   },
  //   // 'os_procs': {
  //   //   count: {'matched_name': true, match: '%s', chart: procs_count_chart },
  //   // },
  //   /**
  //   * matched_name: true; will use that name as the key, else if will use the chart key
  //   * ex matched_name = true: os_networkInterfaces_stats{ lo_bytes: {}}
  //   * ex matched_name != true: os.cpus{ cpus_percentage: {}}
  //   **/
  //   'os_networkInterfaces_stats': {
  //     properties: {'matched_name': true, match: '%s', chart: networkInterfaces_stats_chart},
  //   },
  //   'os_mounts':{
  //     percentage : { 'matched_name': true, match: '%s', chart: mounts_percentage_chart},
  //   },
  //   'os_blockdevices': {
  //     stats : { 'matched_name': true, match: '%s', chart: blockdevices_stats_chart},
  //   },
  //   'new RegExp("^munin")': { 'matched_name': true, chart: munin }
  //
  //
  // },


  cache: undefined,

	options: {
    id: 'hosts',
    path: 'hosts',

    cache_store: {
      suspended: false,
      ttl: 5000,
      stores: [
        {
          id: 'rethinkdb',
          conn: [
            {
              host: 'elk',
              port: 28015,
              db: 'servers',
              table: 'cache',
              module: RethinkDBStoreIn,
            },
          ],
          module: RethinkDBStoreOut,
        }
      ],
    },

    authorization: undefined,

    params: {
			host: /(.|\s)*\S(.|\s)*/,
      // prop: /stats/
      // stat:
		},


    api: {
      // path: '/',
			routes: {
				get: [
					// {
					// 	path: 'charts/:host?/:chart?',
					// 	callbacks: ['charts'],
					// 	version: '',
					// },
          // {
					// 	path: 'instances/:host?/:path?',
					// 	callbacks: ['instances'],
					// 	version: '',
					// },
          // {
					// 	path: 'stats/:host?/:stat?',
					// 	callbacks: ['stats'],
					// 	version: '',
					// }
          {
            path: ':host?/:prop?',
            callbacks: ['hosts'],
            version: '',
          }
				],

        all: [{
          path: ':anything?',
          callbacks: [function(req, resp, next){
            resp.status(404).json({err: 'not found', status: 404})
          }],
        }]
			},
		},

		io: {
			// middlewares: [], //namespace.use(fn)
			// rooms: ['root'], //atomatically join connected sockets to this rooms
			routes: {

        '/': [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['hosts'],
					// middlewares: [], //socket.use(fn)
				}],
				// charts: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['charts'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
        // instances: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['instances'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
        // stats: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['stats'],
				// 	// middlewares: [], //socket.use(fn)
				// }],

			}
		},

    expire: 1000,//ms
	},

  pipeline: {
    hosts: undefined,
    ids: [],
    connected: false,
    suspended: undefined
  },

  // hosts: {
  //   value: undefined,
  //   timestamp: 0
  // },

  // hosts_props: {},

  ON_HOSTS_UPDATED: 'onHostsUpdated',
  ON_HOST_UPDATED: 'onHostUpdated',

  hosts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'prop'])
    let {host, prop} = params
    let query = (req) ? req.query : { format: params.format }
    let id = (socket) ? socket.id : req.session.id
    let session = this.__process_session(req, socket)

    debug_internals('hosts params %s %s', host, prop)

    session.send_resp = session.send_resp+1 || 0
    let req_id = id +'.'+session.send_resp

    let send_resp = {}
    send_resp[req_id] = function(data){
      let {type} = data

      debug_internals('send_resp %s', prop)
      // session[type].value = data[type]
      // session[type].timestamp = Date.now()
      if(prop && data[type])
        data[type] = data[type][prop]

      let result = data[type]

      if(prop) type = 'property'

      if(result && (result.length > 0 || Object.getLength(result) > 0)){

        if(resp){
          resp.json(result)
        }
        else{
          socket.binary(false).emit(type, result)
        }
      }
      else{
        if(resp){
          resp.status(404).json({status: 'no '+type})
        }
        else{
          socket.binary(false).emit(type, {status: 'no '+type})
        }

      }

      // this.removeEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], send_resp[req_id])
      delete send_resp[req_id]
    }.bind(this)

    if(!host)
      this.__get_hosts(req_id, socket, send_resp[req_id])

    else if (host)
      this.__get_host(host, prop, req_id, socket, send_resp[req_id])

  },
  __get_host: function(host, prop, req_id, socket, cb){
    this.cache.get('host.'+host, function(err, result){
      debug_internals('get host %o %o', err, result)
      if(!result){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            // debug_internals('send_resp', pipe)

            let _get_resp = {}
            _get_resp[req_id] = function(resp){
              debug_internals('_get_resp %o', resp)

              this.cache.set('host.'+host, resp['host'])
              // send_resp[req_id](resp)

              cb(resp)

              this.removeEvent(this.ON_HOST_UPDATED, _get_resp[req_id])
              delete _get_resp[req_id]
            }.bind(this)

            this.addEvent(this.ON_HOST_UPDATED, _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            // pipe.hosts.fireEvent('onOnce')
            // pipe.hosts.inputs[0].conn_pollers[0].fireEvent('onOnce')
            pipe.hosts.inputs[1].fireEvent('onOnce', {host: host, prop: prop})//fire only the 'hosts' input

          }.bind(this))
      }
      else{
        // send_resp[req_id]({type: 'hosts', hosts: result})
        cb({type: 'host', host: result})
      }

    }.bind(this))
  },
  __get_hosts: function(req_id, socket, cb){
    this.cache.get('hosts', function(err, result){
      debug_internals('get hosts %o %o', err, result)
      if(!result){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            // debug_internals('send_resp', pipe)

            let _get_resp = {}
            _get_resp[req_id] = function(resp){
              debug_internals('_get_resp %o', resp['hosts'])

              this.cache.set('hosts', resp['hosts'])
              // send_resp[req_id](resp)

              cb(resp)

              this.removeEvent(this.ON_HOSTS_UPDATED, _get_resp[req_id])
              delete _get_resp[req_id]
            }.bind(this)

            this.addEvent(this.ON_HOSTS_UPDATED, _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            // pipe.hosts.fireEvent('onOnce')
            // pipe.hosts.inputs[0].conn_pollers[0].fireEvent('onOnce')
            pipe.hosts.inputs[0].fireEvent('onOnce')//fire only the 'hosts' input

          }.bind(this))
      }
      else{
        // send_resp[req_id]({type: 'hosts', hosts: result})
        cb({type: 'hosts', hosts: result})
      }

    }.bind(this))
  },
  __process_session: function(req, socket, host){
    let session = (socket) ? socket.handshake.session : req.session

    // if(!session.hosts)
    //   session.hosts = {
    //     value: undefined,
    //     timestamp: 0
    //   }

    return session
  },
  __get_pipeline: function(id, cb){

    if(!this.pipeline.hosts){

      let hosts = new Pipeline(HostsPipeline)
      this.pipeline = {
        hosts: hosts,
        // ids: [],
        connected: [],
        suspended: hosts.inputs[0].options.suspended
      }

      this.pipeline.hosts.addEvent('onSaveDoc', function(doc){
        let {type} = doc
        // this[type] = {
        //   value: doc[type],
        //   timestamp: Date.now()
        // }

        // debug_internals('onSaveDoc %o', doc)

        this.fireEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], doc)
        // this.fireEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], [this[type].value])
        // this.__emit_stats(host, stats)
      }.bind(this))

      // this.pipelines[host].pipeline.addEvent('onSaveDoc', function(stats){
      //   this.__emit_stats(host, stats)
      // }.bind(this))

      this.__after_connect_inputs(
        this.__resume_pipeline.pass([this.pipeline, id, cb])
        // this.__after_connect_pipeline(
        //   this.pipeline,
        //   id,
        //   cb
        // )
      )

      // let _client_connect = function(index){
      //   debug_internals('__get_pipeline %o', index)
      //
      //   // this.pipeline.hosts.inputs[0].conn_pollers[0].addEvent('onConnect', () => this.__after_connect_pipeline(
      //   //   this.pipeline,
      //   //   id,
      //   //   cb
      //   // ))
      //   this.pipeline.connected.push(true)
      //   if(this.pipeline.hosts.inputs.length == this.pipeline.connected.length){
      //     this.__after_connect_pipeline(
      //       this.pipeline,
      //       id,
      //       cb
      //     )
      //   }
      //
      //
      //   this.pipeline.hosts.inputs[index].removeEvent('onClientConnect',_client_connect)
      // }.bind(this)

      // Array.each(this.pipeline.hosts.inputs, function(input, index){
      //   input.addEvent('onClientConnect', _client_connect.pass(index));
      // }.bind(this))
      // this.pipeline.hosts.inputs[0].addEvent('onClientConnect', _client_connect);



    }
    else{
        if(this.pipeline.hosts.inputs.length != this.pipeline.connected.length){
          this.__after_connect_inputs(
            this.__resume_pipeline.pass([this.pipeline, id, cb])
            // this.__after_connect_pipeline(
            //   this.pipeline,
            //   id,
            //   cb
            // )
          )
        // this.pipeline.hosts.inputs[0].conn_pollers[0].addEvent('onConnect', () => this.__after_connect_pipeline(
        //   this.pipeline,
        //   id,
        //   cb
        // ))
      }
      else{
        this.__resume_pipeline(this.pipeline, id, cb)
      }
    }

  },
  __after_connect_inputs: function(cb){

    let _client_connect = function(index){
      debug_internals('__get_pipeline %o', index, cb)

      // this.pipeline.hosts.inputs[0].conn_pollers[0].addEvent('onConnect', () => this.__after_connect_pipeline(
      //   this.pipeline,
      //   id,
      //   cb
      // ))
      this.pipeline.connected.push(true)
      if(this.pipeline.hosts.inputs.length == this.pipeline.connected.length){
        cb()
      }


      this.pipeline.hosts.inputs[index].removeEvent('onClientConnect',_client_connect)
    }.bind(this)

    Array.each(this.pipeline.hosts.inputs, function(input, index){
      input.addEvent('onClientConnect', _client_connect.pass(index));
    }.bind(this))
  },
  // __after_connect_pipeline: function(pipeline, id, cb){
  //   debug_internals('__after_connect_pipeline')
  //   pipeline.hosts.inputs[0].options.conn[0].module.removeEvents('onConnect')
  //   // pipeline.connected = true
  //
  //   this.__resume_pipeline(pipeline, id, cb)
  // },
  __resume_pipeline: function(pipeline, id, cb){
    if(id){
      if(!pipeline.ids.contains(id))
        pipeline.ids.push(id)

      if(pipeline.suspended == true){
        debug_internals('RESUMING....')
        pipeline.suspended = false
        pipeline.pipeline.fireEvent('onResume')

      }
    }

    if(cb && typeof cb == 'function')
      cb(pipeline)
  },
  initialize: function(options){
    this.parent(options)

		this.profile('hosts_init');//start profiling

    this.cache = new jscaching(this.options.cache_store)


    // this.pipeline.hosts.inputs[0].conn_pollers[0].addEvent('onConnect', function(){
    //   debug_internals('connected')
    //   // this.pipeline.hosts.suspended = false
    //   // this.pipeline.hosts.fireEvent('onResume')
    //   this.pipeline.hosts.fireEvent('onOnce')
    // }.bind(this))



    this.profile('hosts_init');//end profiling

		this.log('hosts', 'info', 'hosts started');
  },
  socket: function(socket){
		this.parent(socket)

		socket.on('disconnect', function () {

      if(this.pipeline.ids.contains(socket.id)){
        this.pipeline.ids.erase(socket.id)
        this.pipeline.ids = this.pipeline.ids.clean()
      }

      if(this.pipeline.ids.length == 0){ // && this.pipeline.suspended == false
        this.pipeline.suspended = true
        this.pipeline.hosts.fireEvent('onSuspend')
      }


		}.bind(this));
	},

  _arguments: function(args, defined_params){
		let req, resp, next, socket = undefined

		if(args[0]._readableState){//express
			req = args[0]
			resp = args[1]
			next = args[2]
		}
		else{//socket.io
			socket = args[0]
			next = args[1]
		}

		let params = {}
		if(typeof(req) != 'undefined'){
			params = req.params
		}
		else{
      // ////console.log('socket', args)
      let isObject = (args[2] !== null && typeof args[2] === 'object' && isNaN(args[2]) && !Array.isArray(args[2])) ? true: false
      //console.log('isObject',isObject)

      if(defined_params && isObject == false){
        Array.each(defined_params, function(name, index){
          params[name] = args[index + 2]
        })
      }
      else{
		     params = args[2]
      }
		}



		return {req:req, resp:resp, socket:socket, next:next, params: params}
	},
  __no_host: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    if(resp){
      resp.status(500).json({error: 'no host param', status: 500})
    }
    else{
      socket.emit('host', {error: 'no host param', status: 500})
    }
  },







});
