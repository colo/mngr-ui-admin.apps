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

// let HostsPipeline = require('./pipelines/index')(require(ETC+'default.conn.js')())


let debug = require('debug')('mngr-ui-admin:apps:hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Internals');

module.exports = new Class({
  Extends: App,

  cache: undefined,

	options: {
    id: 'hosts',
    path: 'hosts',

    host: {
      properties: ['paths', 'stats'],
    },

    cache_store: {
      suspended: false,
      ttl: 1999,
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
      prop: /stats|paths/
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
          // {
          //   path: ':host/stats/:key',
          //   callbacks: ['host_stats_key'],
          //   version: '',
          // },
          {
            path: ':host?/:prop?/:paths?',
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
  ON_HOST_RANGE: 'onHostRange',

  // host_stats_key: function(){
  //   debug_internals('host_stats_key %o', arguments)
  // },
  hosts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'prop', 'paths'])
    let {host, prop, paths} = params

    if(paths){

      try{
        let _parsed = JSON.parse(paths)
        debug_internals('stats: paths _parsed %o ', _parsed)

        paths = []
        if(Array.isArray(_parsed))
          Array.each(_parsed, function(_path){
            // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
            //avoid duplicates (with push, you may get duplicates)
            paths.combine([_path])
          }.bind(this))


      }
      catch(e){
        // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
      }

      if(!Array.isArray(paths))
        paths = [paths]

    }

    debug_internals('stats: paths %o ', paths)

    // if(paths && !Array.isArray(paths))
    //   paths = [paths]

    let query = (req) ? req.query : { format: params.format }

    let range = (req) ? req.header('range') : params.range
    let type = (range) ? 'range' : 'once'

    let id = (socket) ? socket.id : req.session.id
    let session = this.__process_session(req, socket)

    debug_internals('hosts params %s %s', host, prop)

    session.send_resp = session.send_resp+1 || 0
    let req_id = id +'.'+session.send_resp

    let send_resp = {}
    send_resp[req_id] = function(data){
      let {type} = data

      // session[type].value = data[type]
      // session[type].timestamp = Date.now()
      let result = data[type]

      debug_internals('send_resp %s', prop, result)

      if(prop && result){
        result = result[prop]

        if(prop == 'stats' && paths){
          let tmp_result = Object.clone(result)
          result = {}
          Array.each(paths, function(path){
            result[path] = tmp_result[path]
          })
        }
      }



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

    if(host === null || prop === null){//null means didn't pass the params filter, undefined is allright
      send_resp[req_id]({
        type: (prop === null) ? 'property' : 'host'
      })
    }
    else if(!host)
      this.__get_hosts(req_id, socket, send_resp[req_id])
    else if(!range)
      this.__get_host(host, prop, req_id, socket, send_resp[req_id])
    else
      this.__get_host_range({
        host: host,
        prop: prop,
        paths: paths,
        range: range,
        req_id: req_id,
        socket: socket,
        cb: send_resp[req_id]
      })

  },
  __get_host_range: function(payload){
    let {host, prop, paths, range, req_id, socket, cb} = payload

    this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
        // debug_internals('send_resp', pipe)

        let _get_resp = {}
        _get_resp[req_id] = function(resp){
          if(resp.id == req_id){
            debug_internals('_get_resp range %o %o', resp)

            cb(resp)

            this.removeEvent(this.ON_HOST_RANGE, _get_resp[req_id])
            delete _get_resp[req_id]
          }
        }.bind(this)

        this.addEvent(this.ON_HOST_RANGE, _get_resp[req_id])


        pipe.hosts.inputs[1].fireEvent('onRange', {
          host: host,
          prop: prop,
          paths: paths,
          id: req_id,
          Range: range
        })//fire only the 'hosts' input

      }.bind(this))

  },
  __get_host: function(host, prop, req_id, socket, cb){

    this.cache.get('host.'+host, function(err, result){
      debug_internals('get host %o %o', err, result)

      let _get_resp = {}
      _get_resp[req_id] = function(resp){
        if(resp.id == req_id){
          debug_internals('_get_resp %o %o', resp, result)

          if(result)//cache result
            resp['host'] = Object.merge(result, resp['host'])

          this.cache.set('host.'+host, resp['host'])
          // send_resp[req_id](resp)

          cb(resp)

          this.removeEvent(this.ON_HOST_UPDATED, _get_resp[req_id])
          delete _get_resp[req_id]
        }
      }.bind(this)

      if(
        !result //nothing on cache
        || (prop && !result[prop]) //or request a prop and doens't exist on cache
      ){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            // debug_internals('send_resp', pipe)

            this.addEvent(this.ON_HOST_UPDATED, _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            // pipe.hosts.fireEvent('onOnce')
            // pipe.hosts.inputs[0].conn_pollers[0].fireEvent('onOnce')
            pipe.hosts.inputs[1].fireEvent('onOnce', {host: host, prop: prop, id: req_id})//fire only the 'hosts' input

          }.bind(this))
      }
       //there is a cache, should return full host, but it doens't have all properties
      else if(result && (!prop && Object.getLength(result) != this.options.host.properties.length)){
        let props_result = {}
        let _merge_resp = {}
        Array.each(this.options.host.properties, function(prop, index){
          if(!result[prop]){//if prop not in cache

            this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){

              //merge props responses
              _merge_resp[prop] = function(resp){
                debug_internals('_merge_resp', resp, prop)
                props_result = Object.merge(props_result, resp)
                this.removeEvent(this.ON_HOST_UPDATED, _merge_resp[prop])

                //end of array props? send response
                if(index == this.options.host.properties.length -1)
                  _get_resp[req_id](props_result)

              }.bind(this)

              this.addEvent(this.ON_HOST_UPDATED, _merge_resp[prop])

              pipe.hosts.inputs[1].fireEvent('onOnce', {host: host, prop: prop, id: req_id})//fire only the 'hosts' input

            }.bind(this))
          }


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
              if(resp.id == req_id){
                debug_internals('_get_resp %o', resp.id)

                this.cache.set('hosts', resp['hosts'], 5000)
                // send_resp[req_id](resp)

                cb(resp)

                this.removeEvent(this.ON_HOSTS_UPDATED, _get_resp[req_id])
                delete _get_resp[req_id]
              }
            }.bind(this)

            this.addEvent(this.ON_HOSTS_UPDATED, _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            // pipe.hosts.fireEvent('onOnce')
            // pipe.hosts.inputs[0].conn_pollers[0].fireEvent('onOnce')
            pipe.hosts.inputs[0].fireEvent('onOnce', {id: req_id})//fire only the 'hosts' input

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

      const HostsPipeline = require('./pipelines/index')({
        conn: require(ETC+'default.conn.js')(),
        host: this.options.host
      })

      let hosts = new Pipeline(HostsPipeline)
      this.pipeline = {
        hosts: hosts,
        // ids: [],
        connected: [],
        suspended: hosts.inputs[0].options.suspended
      }

      this.pipeline.hosts.addEvent('onSaveDoc', function(doc){
        let {type, range} = doc
        // this[type] = {
        //   value: doc[type],
        //   timestamp: Date.now()
        // }

        // debug_internals('onSaveDoc %o', doc)

        if(!range)
          this.fireEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], doc)
        else
          this.fireEvent(this['ON_'+type.toUpperCase()+'_RANGE'], doc)

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
