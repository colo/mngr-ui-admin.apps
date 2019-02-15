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

let data_to_stat = require('node-tabular-data').data_to_stat
let data_to_tabular = require('node-tabular-data').data_to_tabular

module.exports = new Class({
  Extends: App,

  cache: undefined,

	options: {
    id: 'hosts',
    path: 'hosts',

    host: {
      properties: ['paths', 'data', 'range'],//to send to pipelines.input.*.host.js
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
      prop: /data|paths|instances|range/,
      events: /hosts|paths/,
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
            path: ':host/instances/:instances?',
            callbacks: ['host_instances'],
            version: '',
          },
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

        'instances': [{
					// path: ':host/instances/:instances?',
					// once: true, //socket.once
					callbacks: ['host_instances'],
					// middlewares: [], //socket.use(fn)
				}],
        '/': [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['hosts'],
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
  ON_HOST_INSTANCES_UPDATED: 'onHostInstancesUpdated',
  ON_HOST_DATA_UPDATED: 'onHostDataUpdated',
  ON_HOST_RANGE_UPDATED: 'onHostRangeUpdated',

  CHART_INSTANCE_TTL: 60000,
  HOSTS_TTL: 60000,

  events: {},
  hosts_events: {},

  __emit: function(doc){
    // debug_internals('__emit', this.events, this.hosts_events, doc)
    if(!doc.id){//if doc.id, then this event was fired by a client request...ommit!
      // debug_internals('__emit', this.events, this.hosts_events, doc)

      let {type, host, prop} = doc

      if(type && doc[type]){
        if(this.events[type])
          Array.each(this.events[type], function(socketId){
            // sending to individual socketid (private message)
            this.io.binary(false).to(`${socketId}`).emit(type, doc)
          }.bind(this))

        if(this.hosts_events[host] && this.hosts_events[host][type])
          Array.each(this.hosts_events[host][type], function(event){
            let result = Object.clone(doc)

            if(event && event !== null){
              let {id, format} = event

              if(type == 'path' && ( format == 'stat' || format == 'tabular') && result['paths']){
                Array.each(result['paths'], function(path, index){
                  result['paths'][index] = path.replace(/\./g, '_')
                })

                this.io.binary(false).to(`${id}`).emit(type, result)
              }
              else if(type == 'data' && format == 'stat' || format == 'tabular'){
                // debug_internals('__emit data', result)
                result.data = result.data.data
                // if(prop) type = prop
                //
                // let result = {
                //   type: type,
                //   // range: range,
                //   host: host
                // }
                //
                // if(type == 'data' && format)
                type = format
                //
                // result[type] = doc



                this.__transform_data('stat', result.data, host, function(stat){
                  // result = stat
                  result.stat = stat
                  delete result.data

                  if( format == 'tabular' ){
                    this.__transform_data('tabular', result.stat, host, function(tabular){
                      // result = tabular
                      result.tabular = tabular
                      delete result.stat
                      this.io.binary(false).to(`${id}`).emit(type, result)

                    }.bind(this))

                  }
                  else{
                    this.io.binary(false).to(`${id}`).emit(type, result)
                  }

                }.bind(this))
              }
              else{
                this.io.binary(false).to(`${id}`).emit(type, result)
              }

            }

          }.bind(this))
      }
      // this.io.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: output, tabular: true})


    }
  },
  register: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['events'])
    let {events} = params
    let id = (socket) ? socket.id : req.session.id
    let session = this.__process_session(req, socket)
    session.send_register_resp = session.send_register_resp+1 || 0
    let req_id = id +'.'+session.send_register_resp

    debug_internals('register %o', events)

    let send_resp = {}
    send_resp[req_id] = function(err, result){
      // debug_internals('register.send_resp %o', err, result)
      if(err){
        if(resp){
          resp.status(err.code).json(err)
        }
        else{
          socket.binary(false).emit('on', err)
        }
      }
      else{
        if(resp){
          resp.json(result)
        }
        else{
          socket.binary(false).emit('on', result)
        }
      }

      delete send_resp[req_id]
    }

    if(events && events !== null){
      // try{
      //   let _parsed = JSON.parse(events)
      //   // debug_internals('data: paths _parsed %o ', _parsed)
      //
      //   events = []
      //   if(Array.isArray(_parsed))
      //     Array.each(_parsed, function(event){
      //       // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
      //       //avoid duplicates (with push, you may get duplicates)
      //       events.combine([event])
      //     }.bind(this))
      //
      //
      // }
      // catch(e){
      //   // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
      // }

      if(!Array.isArray(events))
        events = [events]

      Array.each(events, function(event){
        if(typeof event === 'string'){
          if(!this.events[event]) this.events[event] = []
          if(!this.events[event].contains(id)) this.events[event].push(id)

        }
        else{
          let {host, prop, format} = event
          debug_internals('register Object', host, prop, format)
          if(host){
            if(!this.hosts_events[host]) this.hosts_events[host] = {}
            if(!this.hosts_events[host][prop]) this.hosts_events[host][prop] = []
            this.hosts_events[host][prop].push({id: id, format: format})

            // if(prop == 'data'){
            /**
            * @todo: pipelines should protect you from firing events before being connected
            **/
            if(prop == 'data' && this.pipeline.connected[1] == true){
              this.pipeline.hosts.inputs[1].fireEvent('onOnce', {
                host: host,
                type: 'register',
                prop: 'data',
                query: {format: format},
                // paths: paths,
                id: id,
              })//fire only the 'host' input
            }
          }
        }




      }.bind(this))

      send_resp[req_id](undefined, {code: 200, status: 'registered for '+events.toString()+' events'})
    }
    else{
      send_resp[req_id]({code: 500, status: 'no event specified'}, undefined)
    }
  },
  host_instances: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'prop', 'instances'])
    let {host, prop, instances} = params
    // let query = (req) ? req.query : { format: params.format }
    // let range = (req) ? req.header('range') : params.range
    // let type = (range) ? 'range' : 'once'
    let id = (socket) ? socket.id : req.session.id
    let session = this.__process_session(req, socket)

    session.send_instances_resp = session.send_instances_resp+1 || 0
    let req_id = id +'.'+session.send_instances_resp

    let send_resp = {}
    send_resp[req_id] = function(data){
      // if(prop) type = prop

      let result = {
        type: 'instances',
        // range: range,
        host: host
      }

      // if(query.format) type = query.format

      // result['instances'] = data
      result = Object.merge(result, data)

      if(result && (result.length > 0 || Object.getLength(result) > 0)){

        if(resp){
          resp.json(result)
        }
        else{
          socket.binary(false).emit('instances', result)
        }
      }
      else{
        if(resp){
          resp.status(404).json({status: 'no instances'})
        }
        else{
          socket.binary(false).emit('instances', {status: 'no instances'})
        }

      }

      delete send_resp[req_id]
    }

    if(instances){

      try{
        let _parsed = JSON.parse(instances)
        // debug_internals('data: paths _parsed %o ', _parsed)

        instances = []
        if(Array.isArray(_parsed))
          Array.each(_parsed, function(_path){
            // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
            //avoid duplicates (with push, you may get duplicates)
            instances.combine([_path])
          }.bind(this))


      }
      catch(e){
        // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
      }

      if(!Array.isArray(instances))
        instances = [instances]


      this.__get_instances(instances, host, send_resp[req_id])
    }
    else{

      this.cache.get(host+'.instances', function(err, instances){
        if(instances){
          // result.instances = instances
          this.__get_instances(instances, host, send_resp[req_id])
        }
        else{
          send_resp[req_id](null)
        }
        // if(instances)
        //   result.instances = instances
        //
        // send_result(result)
      }.bind(this))

    }

    debug_internals('host_instances %o', instances)


    // let result = {}
    // Array.each(instances, function(instance, index){
    //
    //   this.cache.get(host+'.tabular.'+instance, function(err, data){
    //     if(data) result[instance] = JSON.parse(data)
    //
    //     if(index == instances.length - 1) send_resp[req_id](result)
    //     // let result = {type: 'property'}
    //     // result.property = { instances: instances }
    //     // debug_internals('host %s prop %s %o', host, prop, result)
    //
    //
    //   })
    //
    // }.bind(this))
    // this.__get_instances(instances, host, send_resp[req_id])



  },
  __get_instances: function(instances, host, cb){
    let result = {}
    Array.each(instances, function(instance, index){

      this.cache.get(host+'.tabular.'+instance, function(err, data){
        if(data) result[instance] = JSON.parse(data)

        if(index == instances.length - 1){
          cb(result)
          return result
        }
        // let result = {type: 'property'}
        // result.property = { instances: instances }
        // debug_internals('host %s prop %s %o', host, prop, result)


      })

    }.bind(this))

  },
  hosts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'prop', 'paths'])
    let {host, prop, paths} = params
    let query = (req) ? req.query : { format: params.format }
    let range = (req) ? req.header('range') : params.range
    let type = (range) ? 'range' : 'once'
    let id = (socket) ? socket.id : req.session.id
    let session = this.__process_session(req, socket)

    let __query_paths = undefined

    if(paths){
      __query_paths = []

      try{
        let _parsed = JSON.parse(paths)
        // debug_internals('data: paths _parsed %o ', _parsed)

        paths = []
        if(Array.isArray(_parsed))
          Array.each(_parsed, function(_path){
            let __query_path = (query.format && _path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')) : _path
            // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
            //avoid duplicates (with push, you may get duplicates)
            __query_paths.combine([__query_path])
            paths.combine([_path])
          }.bind(this))


      }
      catch(e){
        // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
      }

      if(!Array.isArray(paths)){
        __query_paths = (query.format && paths.indexOf('.') > -1) ? [paths.substring(0, paths.indexOf('.'))]: [paths]
        paths = [paths]
      }

    }


    // debug_internals('data: paths %o ', paths)

    // debug_internals('hosts params %s %s', host, prop)

    session.send_resp = session.send_resp+1 || 0
    let req_id = id +'.'+session.send_resp

    let send_resp = {}
    send_resp[req_id] = function(data){
      let {type} = data
      let result = data[type]

      let send_result = function(data){
        if(prop) type = prop

        let result = {
          type: type,
          range: range,
          host: host
        }

        if(prop == 'data' && query.format) type = query.format

        result[type] = data

        // if(prop) type = 'property'



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

      }.bind(this)

      debug_internals('send_result %s', prop, result, query)

      if(( query.format == 'stat' || query.format == 'tabular') && result && result.paths)
        Array.each(result.paths, function(path, index){
          result.paths[index] = path.replace(/\./g, '_')
        })



      if(prop && result){
        result = result[prop]

        if(prop == 'data' && paths){

          if( query.format == 'stat' || query.format == 'tabular'){
            this.__transform_data('stat', result, host, function(stat){
              let tmp_result = {}
              Array.each(paths, function(path){
                tmp_result = Object.merge(tmp_result, this.__find_stat(path, stat))

              }.bind(this))

              if( query.format == 'tabular'){
                debug_internals('to tabular', tmp_result)
                this.__transform_data('tabular', tmp_result, host, function(tabular){
                  // result.tabular = tabular
                  // delete result.stat
                  send_result(tabular)
                })

              }
              else{
                send_result(tmp_result)
              }

            }.bind(this))
          }
          else{
            let tmp_result = Object.clone(result)
            result = {}
            Array.each(paths, function(path){
              result[path] = tmp_result[path]
            })

            send_result(result)
          }



        }
        else if(prop == 'data' && ( query.format == 'stat' || query.format == 'tabular') ){
          this.__transform_data('stat', result, host, function(stat){
            result = stat
            // result.stat = stat
            // delete result.data

            if( query.format == 'tabular'){
              this.__transform_data('tabular', result, host, function(tabular){
                result = tabular
                // result.tabular = tabular
                // delete result.stat
                send_result(result)
              }.bind(this))

            }
            else{
              send_result(result)
            }

          }.bind(this))
        }
        else{
            send_result(result)
        }
      }
      else if(result && result.data && ( query.format == 'stat' || query.format == 'tabular') ){
        this.__transform_data('stat', result.data, host, function(stat){
          result.stat = stat
          result.paths = Object.keys(stat)
          delete result.data

          if( query.format == 'tabular'){
            // debug_internals('query.format == tabular', result.stat)

            this.__transform_data('tabular', result.stat, host, function(tabular){
              // debug_internals('query.format == tabular', tabular)
              result.tabular = tabular
              delete result.stat
              // send_result(result)
              this.cache.get(host+'.instances', function(err, instances){
                if(instances){
                  // result.instances = instances
                  this.__get_instances(instances, host, function(instances){
                    result.instances = instances
                    send_result(result)
                  })
                }
                else{
                  send_result(result)
                }
              }.bind(this))
            }.bind(this))

          }
          else{
            // send_result(result)
            this.cache.get(host+'.instances', function(err, instances){
              // if(instances)
              //   result.instances = instances
              //
              // send_result(result)
              if(instances){
                // result.instances = instances
                this.__get_instances(instances, host, function(instances){
                  result.instances = instances
                  send_result(result)
                })
              }
              else{
                send_result(result)
              }
            }.bind(this))
          }

        }.bind(this))


      }
      else{
        if(!result || result == null)
          result = { instances: null }

        this.cache.get(host+'.instances', function(err, instances){
          if(instances){
            // result.instances = instances
            this.__get_instances(instances, host, function(instances){
              result.instances = instances
              send_result(result)
            })
          }
          else{
            send_result(result)
          }
          // if(instances)
          //   result.instances = instances
          //
          // send_result(result)
        }.bind(this))

      }

      // if(result.stat && query.format == 'tabular'){
      //   // result.tabular = this.__transform_data(result.stat)
      //   delete result.stat
      // }

      delete send_resp[req_id]

    }.bind(this)

    if(host === null || prop === null){//null means didn't pass the params filter ( undefined is allright )
      send_resp[req_id]({
        type: (prop === null) ? 'property' : 'host'
      })
    }
    else if(!host)
      this.__get_hosts(req_id, socket, send_resp[req_id])

    // else if(prop === 'instances'){
    //   this.cache.get(host+'.instances', function(err, instances){
    //     let result = {type: 'property'}
    //     result.property = { instances: null }
    //     if(instances){
    //       // result.instances = instances
    //       this.__get_instances(instances, host, function(instances){
    //         result.instances = instances
    //         // send_result(result)
    //         send_resp[req_id](result)
    //       })
    //     }
    //     else{
    //       send_resp[req_id](result)
    //     }
    //
    //     // let result = {type: 'property'}
    //     // result.property = { instances: instances }
    //     // debug_internals('host %s prop %s %o', host, prop, result)
    //
    //     // send_resp[req_id](result)
    //   }.bind(this))
    //
    // }
    else if(!range){
      // this.__get_host(host, prop, req_id, socket, send_resp[req_id])
      this.__get_host({
        host: host,
        prop: prop,
        query: query,
        req_id: req_id,
        socket: socket,
        cb: send_resp[req_id]
      })
    }
    else
      this.__get_host_range({
        host: host,
        prop: prop,
        query: query,
        paths: __query_paths,
        range: range,
        req_id: req_id,
        socket: socket,
        cb: send_resp[req_id]
      })

  },
  __find_stat(stat, stats){
    let result = {}
    if(stat.indexOf('.') > -1){
      let key = stat.split('.')[0]
      let rest = stat.substring(stat.indexOf('.') + 1)
      // //console.log('REST', key, rest)
      result[key] = this.__find_stat(rest, stats[key])
    }
    else if(stats){
      result[stat] = stats[stat]
    }

    return result
  },
  __transform_data: function(type, data, cache_key, cb){
    // debug_internals('__transform_data', type)
    let convert = (type == 'stat') ? data_to_stat : data_to_tabular

    let transformed = {}
    let counter = 0 //counter for each path:stat in data
    // let instances = []
    let instances = {}

    if(!data || data == null && typeof cb == 'function')
      cb(transformed)

    /**
    * first count how many "transform" there are for this data set, so we can fire callback on last one
    **/
    let transform_result_length = 0
    Object.each(data, function(d, path){
      let transform = this.__traverse_path_require(type, path, d)

        if(transform && typeof transform == 'function'){
          transform_result_length += Object.getLength(transform(d))
        }
        else if(transform){
          transform_result_length++
        }
    }.bind(this))

    let transform_result_counter = 0

    Object.each(data, function(d, path){
      let transform = this.__traverse_path_require(type, path, d) //for each path find a trasnform or use "default"

      if(transform){

        if(typeof transform == 'function'){
          let transform_result = transform(d, path)


          Object.each(transform_result, function(chart, path_key){

            /**
            * key may use "." to create more than one chart (per key), ex: cpus.times | cpus.percentage
            **/
            let sub_key = (path_key.indexOf('.') > -1) ? path_key.substring(0, path_key.indexOf('.')) : path_key


            if(type == 'tabular'){
              // debug_internals('transform_result', transform_result)

              this.cache.get(cache_key+'.'+type+'.'+path+'.'+path_key, function(err, chart_instance){
                chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart

                chart_instance = Object.merge(chart, chart_instance)

                // chart_instance = _transform(chart_instance)

                convert(d[sub_key], chart_instance, path+'.'+path_key, function(name, stat){
                  transformed = this.__merge_transformed(name, stat, transformed)
                  // name = name.replace(/\./g, '_')
                  // let to_merge = {}
                  // to_merge[name] = stat
                  //
                  // transformed = Object.merge(transformed, to_merge)
                  //
                  // debug_internals('chart_instance CACHE %o', name, transform_result_counter, transform_result_length)


                  // chart_instance = this.cache.clean(chart_instance)
                  // // debug_internals('transformed func', name, JSON.stringify(chart_instance))
                  // instances.push(this.__transform_name(path+'.'+path_key))
                  instances[this.__transform_name(path+'.'+path_key)] = chart_instance

                  this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path+'.'+path_key), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

                  if(
                    transform_result_counter == transform_result_length - 1
                    && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                  ){
                    this.__save_instances(cache_key, instances, cb.pass(transformed))
                    // cb(transformed)
                  }

                  transform_result_counter++
                }.bind(this))



              }.bind(this))
            }
            else{
              convert(d[sub_key], chart, path+'.'+path_key, function(name, stat){
                transformed = this.__merge_transformed(name, stat, transformed)
                // name = name.replace(/\./g, '_')
                // let to_merge = {}
                // to_merge[name] = stat
                //
                // debug_internals('transformed func', name, stat)
                //
                // transformed = Object.merge(transformed, to_merge)

                if(
                  transform_result_counter == transform_result_length - 1
                  && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                ){
                  cb(transformed)
                }


                transform_result_counter++
              })

            }





          }.bind(this))
        }
        else{//not a function

          /**
          * @todo: 'tabular' not tested, also counter should consider this case (right now only considers functions type)
          **/
          if(type == 'tabular'){
            this.cache.get(cache_key+'.'+type+'.'+path, function(err, chart_instance){
              chart_instance = (chart_instance) ? JSON.parse(chart_instance) : transform

              chart_instance = Object.merge(chart_instance, transform)
              // debug_internals('chart_instance NOT FUNC %o', chart_instance)
              debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path)

              // throw new Error()
              convert(d, chart_instance, path, function(name, stat){
                transformed = this.__merge_transformed(name, stat, transformed)
                // name = name.replace(/\./g, '_')
                // let to_merge = {}
                // to_merge[name] = stat
                //
                debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path, transformed)

                // transformed = Object.merge(transformed, to_merge)

                // chart_instance = this.cache.clean(chart_instance)

                // instances.push(this.__transform_name(path))


                instances[this.__transform_name(path)] = chart_instance
                this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

                if(
                  transform_result_counter == transform_result_length - 1
                  && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                ){
                  this.__save_instances(cache_key, instances, cb.pass(transformed))
                  // cb(transformed)
                }

                transform_result_counter++

              }.bind(this))



            }.bind(this))
          }
          else{
            convert(d, transform, path, function(name, stat){
              transformed = this.__merge_transformed(name, stat, transformed)

              // name = name.replace(/\./g, '_')
              // let to_merge = {}
              // to_merge[name] = stat
              //
              // debug_internals('transformed custom', type, to_merge)
              //
              // transformed = Object.merge(transformed, to_merge)

              if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
                cb(transformed)

            }.bind(this))
          }

        }


      }
      else{//default
        if(type == 'tabular'){ //default trasnform for "tabular"

          // debug_internals('transform default', path)

          let chart = Object.clone(require('./libs/'+type)(d, path))

          this.cache.get(cache_key+'.'+type+'.'+path, function(err, chart_instance){
            chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart

            chart_instance = Object.merge(chart, chart_instance)

            convert(d, chart_instance, path, function(name, stat){
              /**
              * clean stats that couldn't be converted with "data_to_tabular"
              **/
              Array.each(stat, function(val, index){
                Array.each(val, function(row, i_row){
                  if(isNaN(row))
                    val[i_row] = undefined
                })
                stat[index] = val.clean()
                if(stat[index].length <= 1)
                  stat[index] = undefined
              })
              stat = stat.clean()

              if(stat.length > 0)
                transformed = this.__merge_transformed(name, stat, transformed)

              // name = name.replace(/\./g, '_')
              // let to_merge = {}
              // to_merge[name] = stat
              //
              // transformed = Object.merge(transformed, to_merge)
              // debug_internals('default chart_instance CACHE %o', name)

              // debug_internals('default chart_instance CACHE %o', name, transform_result_counter, transform_result_length)
              // chart_instance = this.cache.clean(chart_instance)
              // // debug_internals('transformed func', name, JSON.stringify(chart_instance))
              // instances.push(this.__transform_name(path))
              instances[this.__transform_name(path)] = chart_instance

              this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

              if(
                transform_result_counter == transform_result_length - 1
                && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
              ){
                this.__save_instances(cache_key, instances, cb.pass(transformed))
                // cb(transformed)
              }

              transform_result_counter++
            }.bind(this))



          }.bind(this))
        }
        else{//default trasnform for "stat"
          require('./libs/'+type)(d, path, function(name, stat){
            transformed = this.__merge_transformed(name, stat, transformed)
            // name = name.replace(/\./g, '_')
            // let to_merge = {}
            // to_merge[name] = stat
            // debug_internals('transformed default', type, to_merge)
            // transformed = Object.merge(transformed, to_merge)

            if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
              cb(transformed)

          }.bind(this))
        }


      }

      // if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
      //   cb(transformed)


      counter++
    }.bind(this))


  },
  __save_instances: function(cache_key, instances, cb){
    // debug_internals('__save_instances', instances)

    this.cache.get(cache_key+'.instances', function(err, result){
      if(result){
        // Array.each(instances, function(instance){
        Object.each(instances, function(data, instance){
          if(!result.contains(instance)) result.push(instance)
        })
      }
      else
        result = Object.keys(instances)

      this.cache.set(cache_key+'.instances', result, this.CHART_INSTANCE_TTL, function(err, result){
        debug_internals('__save_instances cache.set', err, result)

        if(!err || err === null)
          this.fireEvent(this.ON_HOST_INSTANCES_UPDATED, {type: 'instances', host: cache_key, instances: instances})

        if(typeof cb == 'function')
          cb()

      }.bind(this))
    }.bind(this))
  },
  __merge_transformed: function(name, stat, merge){
    name = this.__transform_name(name)

    let to_merge = {}
    to_merge[name] = stat
    return Object.merge(merge, to_merge)
  },
  __transform_name: function(name){
    name = name.replace(/\./g, '_')
    name = name.replace(/\%/g, 'percentage_')
    return name
  },
  __traverse_path_require: function(type, path, stat, original_path){
    original_path = original_path || path
    path = path.replace(/_/g, '.')
    original_path = original_path.replace(/_/g, '.')

    // debug_internals('__traverse_path_require %s', path, original_path)
    try{
      let chart = require('./libs/'+type+'/'+path)(stat, original_path)

      return chart
    }
    catch(e){
      if(path.indexOf('.') > -1){
        let pre_path = path.substring(0, path.lastIndexOf('.'))
        return this.__traverse_path_require(type, pre_path, stat, original_path)
      }

      return undefined
    }


    // let path = path.split('.')
    // if(!Array.isArray(path))
    //   path = [path]
    //
    // Array.each()
  },
  __get_host_range: function(payload){
    let {host, prop, paths, range, req_id, socket, cb} = payload

    this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
        // // debug_internals('send_resp', pipe)

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
        })//fire only the 'host' input

      }.bind(this))

  },
  // __get_host: function(host, prop, req_id, socket, cb){
  __get_host: function(payload){
    let {host, prop, query, req_id, socket, cb} = payload

    this.cache.get('host.'+host, function(err, result){
      // debug_internals('get host %o %o', err, result)

      let _get_resp = {}
      _get_resp[req_id] = function(resp){
        if(resp.id == req_id){
          // debug_internals('_get_resp %o %o', resp, result)

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
            // // debug_internals('send_resp', pipe)

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
                // debug_internals('_merge_resp', resp, prop)
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
      debug_internals('get hosts cache %o %o %s', err, result, req_id)
      if(!result){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            // // debug_internals('send_resp', pipe)

            let _get_resp = {}
            _get_resp[req_id] = function(resp){
              debug_internals('_get_resp %s %s', resp.id, req_id)
              if(resp.id == req_id){


                this.cache.set('hosts', resp['hosts'], this.HOSTS_TTL)
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
        ids: [],
        connected: [],
        suspended: hosts.inputs[0].options.suspended
      }

      this.pipeline.hosts.addEvent('onSaveDoc', function(doc){
        let {type, range} = doc
        // this[type] = {
        //   value: doc[type],
        //   timestamp: Date.now()
        // }

        // debug_internals('onSaveDoc %o', type, doc)

        if(!range){
          if(type == 'data' || type == 'range')
            this.fireEvent(this['ON_HOST_'+type.toUpperCase()+'_UPDATED'], doc)
            // this.fireEvent(this.ON_HOST_DATA_UPDATED, doc)
          else
            this.fireEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], doc)
        }
        else{
          this.fireEvent(this['ON_'+type.toUpperCase()+'_RANGE'], doc)
        }

        // this.fireEvent(this['ON_'+type.toUpperCase()+'_UPDATED'], [this[type].value])
        // this.__emit_stats(host, stats)
      }.bind(this))

      this.addEvent(this.ON_HOSTS_UPDATED, doc => this.__emit(doc))
      this.addEvent(this.ON_HOST_DATA_UPDATED, doc => this.__emit(doc))
      this.addEvent(this.ON_HOST_RANGE_UPDATED, doc => this.__emit(doc))
      this.addEvent(this.ON_HOST_INSTANCES_UPDATED, doc => this.__emit(doc))

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
      //   // debug_internals('__get_pipeline %o', index)
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
      // debug_internals('__get_pipeline %o', index, cb)

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
  //   // debug_internals('__after_connect_pipeline')
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
        // debug_internals('RESUMING....')
        pipeline.suspended = false

        pipeline.hosts.fireEvent('onResume')

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
    //   // debug_internals('connected')
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
      debug_internals('socket.io disconnect', socket.id, this.hosts_events)



      Object.each(this.events, function(event, name){
        if(event.contains(socket.id)){
          event.erase(socket.id)
          event = event.clean()
        }
      }.bind(this))

      Object.each(this.hosts_events, function(host, host_name){
        Object.each(host, function(prop, prop_name){
          Array.each(prop, function(event, event_index){
            if(event && event.id == socket.id){
              this.pipeline.hosts.inputs[1].fireEvent('onOnce', {
                host: host_name,
                type: 'unregister',
                prop: prop_name,
                id: socket.id,
              })//fire only the 'host' input

              prop[event_index] = undefined
            }
          }.bind(this))
          prop = prop.clean()
        }.bind(this))
      }.bind(this))



      if(this.pipeline.ids.contains(socket.id)){
        this.pipeline.ids.erase(socket.id)
        this.pipeline.ids = this.pipeline.ids.clean()
      }

      if(this.pipeline.ids.length == 0 && this.pipeline.hosts){ // && this.pipeline.suspended == false
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
