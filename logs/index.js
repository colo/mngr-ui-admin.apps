'use strict'

var	path = require('path')

const App = require(path.join(process.cwd(), '/libs/App'))
// const App =  process.env.NODE_ENV === 'production'
//       ? require(path.join(process.cwd(), '/config/prod.conf'))
//       : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let debug = require('debug')('mngr-ui-admin:apps:logs'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Internals');

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

    id: 'logs',
    path: 'logs',

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
          {
            // path: ':host?/:prop?/:paths?',
            path: ':prop?',
            callbacks: ['logs'],
            version: '',
          },
          // {
          //   // path: ':host?/:prop?/:paths?',
          //   path: 'domains/:domain?',
          //   callbacks: ['domains'],
          //   version: '',
          // }
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

  // pipeline: {
  //   hosts: undefined,
  //   ids: [],
  //   connected: false,
  //   suspended: undefined
  // },

  // __emit: function(doc){
  //   /**
  //   * emited docs are always periodical data (at least for now)
  //   **/
  //   doc.from = 'periodical'
  //
  //   // debug_internals('__emit', this.events, this.hosts_events)
  //   if(!doc.id && this.session_store){//if doc.id, then this event was fired by a client request...ommit!
  //     let {type, host, prop} = doc
  //     if(type && doc[type]){
  //
  //       this.cache.get(this.ID+'.sessions', function(err, sessions){
  //
  //         if(sessions && sessions['socket'] && sessions['socket'].length > 0){
  //
  //           Array.each(sessions['socket'], function(id){
  //             this.__get_session_by_id(id, function(err, session){
  //               if(session && session.sockets && session.sockets.length > 0)
  //                 Array.each(session.sockets, function(socketId){
  //                   if(this.io.connected[socketId] && this.io.connected[socketId].connected){
  //                     this.__update_sessions({id: id, type: 'socket'})
  //                     this.__emit_registered_events(socketId, session, doc)
  //                   }
  //
  //                 }.bind(this))
  //             }.bind(this))
  //
  //
  //           }.bind(this))
  //
  //
  //         }
  //
  //       }.bind(this))//cache.get
  //
  //
  //       // debug_internals('__emit', type, host, prop)
  //     }
  //
  //
  //     // this.io.emit('stats', {host: host, status: 'ok', type: type, stats: output, tabular: true})
  //
  //
  //   }
  // },
  // __emit_registered_events: function(socketId, session, doc){
  //   // debug_internals('__emit_registered_events', this.io.connected[socketId].connected)
  //   if(this.io.connected[socketId] && this.io.connected[socketId].connected){
  //     let {type, host, prop} = doc
  //
  //     // debug_internals('__emit_registered_events', type, session.events, doc)
  //
  //     if(session && session.events.contains(type))
  //       this.io.to(`${socketId}`).emit(type, doc)
  //
  //
  //     if(session && session.hosts_events[host]){
  //       Array.each(session.hosts_events[host], function(event){
  //
  //         // if(type == 'data')
  //         debug_internals('__emit_registered_events', type, event)
  //
  //         let result = Object.clone(doc)
  //
  //         if(event && event !== null && event.prop == type){
  //           let {format} = event
  //
  //           // if(type == 'paths')
  //           //   debug_internals('TYPE PATHS', result)
  //
  //           if(result[type] && result[type][type] || result[type][type] == null)// @bug: ex -> data_range.data_range
  //             result[type] = result[type][type]
  //
  //           if(type == 'paths' && ( format == 'stat' || format == 'tabular') && result['paths']){
  //             Array.each(result['paths'], function(path, index){
  //               result['paths'][index] = path.replace(/\./g, '_')
  //             })
  //
  //             this.io.to(`${socketId}`).emit(type, result)
  //           }
  //           else if(type == 'data' && format == 'stat' || format == 'tabular'){
  //             // if(result.step)
  //
  //
  //             // result.data = result.data.data // @bug: doc.data.data ??
  //             debug_internals('__emit data', result)
  //
  //             this.__transform_data('stat', result.data, host, function(value){
  //               // result = stat
  //               result.stat = value.stat
  //               // delete result.data
  //
  //               if( format == 'tabular' ){
  //                 this.__transform_data('tabular', Object.merge(result.stat, result.data), host, function(value){
  //                   // result = tabular
  //                   result.tabular = value.tabular
  //                   delete result.stat
  //                   delete result.data
  //                   this.io.to(`${socketId}`).emit(format, result)
  //
  //                 }.bind(this))
  //
  //               }
  //               else{
  //                 delete result.data
  //                 this.io.to(`${socketId}`).emit(format, result)
  //               }
  //
  //             }.bind(this))
  //           }
  //           else{
  //
  //             debug_internals('emiting...', prop, type)
  //
  //             if(type != 'instances' && result[type] && (result[type][type] || result[type][type] == null))// @bug: ex -> data_range.data_range
  //               result[type] = result[type][type]
  //
  //
  //
  //             if(result[type]){
  //               let resp = {
  //                 host: host,
  //                 type: type,
  //               }
  //
  //               resp[type] = result[type]
  //               this.io.to(`${socketId}`).emit(type, resp)
  //             }
  //
  //           }
  //
  //         }
  //
  //       }.bind(this))
  //     }
  //   }
  //
  // },
  // __process_register_unregister: function(payload, cb){
  //   let {type, id, events, session} = payload
  //
  //   if(events && events !== null){
  //
  //     if(!Array.isArray(events))
  //       events = [events]
  //
  //     Array.each(events, function(event){
  //       if(typeof event === 'string'){
  //         // if(!this.events[event]) this.events[event] = []
  //         // if(!this.events[event].contains(id)) this.events[event].push(id)
  //         if(type == 'register') session.events.include(event)
  //         else session.events = session.events.erase(event)
  //       }
  //       else{
  //         let {host, prop, format} = event
  //         debug_internals(type+' Object', host, prop, format)
  //         if(host){
  //           // if(!this.hosts_events[host]) this.hosts_events[host] = {}
  //           // if(!this.hosts_events[host][prop]) this.hosts_events[host][prop] = []
  //           // this.hosts_events[host][prop].push({id: id, format: format})
  //
  //           if(!session.hosts_events[host]) session.hosts_events[host] = []
  //
  //           if(type == 'register' && session.hosts_events[host].some(function(item){
  //             return item.prop == event.prop && item.format == event.format
  //           }) !== true)
  //             session.hosts_events[host].push(event)
  //
  //           if(type == 'unregister'){
  //             Array.each(session.hosts_events[host], function(item, index){
  //               if(item.prop == event.prop && item.format == event.format)
  //                 session.hosts_events[host][index] = undefined
  //             })
  //             session.hosts_events[host] = session.hosts_events[host].clean()
  //           }
  //
  //           if(this.options.on_demand && type == 'unregister'){
  //             this.ui_rest_client.api.get({
  //               uri: "events/once",
  //               qs: {
  //                 type: type,
  //                 id: id,
  //                 hosts: [host],
  //                 pipeline_id: 'ui',
  //               }
  //             })
  //
  //             let rest_event = (type == 'register') ? 'resume' : 'suspend'
  //             this.ui_rest_client.api.get({
  //               uri: 'events/'+rest_event,
  //               qs: {
  //                 pipeline_id: 'ui',
  //               },
  //             })
  //           }
  //
  //           // if(prop == 'data'){
  //           /**
  //           * @todo: pipelines should protect you from firing events before being connected
  //           **/
  //           if(prop == 'data' && this.pipeline.connected[1] == true){
  //             if(this.options.on_demand && type == 'register'){
  //               this.ui_rest_client.api.get({
  //                 uri: "events/once",
  //                 qs: {
  //                   type: type,
  //                   id: id,
  //                   hosts: [host],
  //                   pipeline_id: 'ui',
  //                 }
  //               })
  //
  //               let rest_event = (type == 'register') ? 'resume' : 'suspend'
  //               this.ui_rest_client.api.get({
  //                 uri: 'events/'+rest_event,
  //                 qs: {
  //                   pipeline_id: 'ui',
  //                 },
  //               })
  //             }
  //
  //             this.pipeline.hosts.inputs[1].fireEvent('onOnce', {
  //               host: host,
  //               type: type,
  //               prop: 'data',
  //               query: {format: format},
  //               // paths: paths,
  //               id: id,
  //             })//fire only the 'host' input
  //           }
  //         }
  //       }
  //
  //
  //
  //
  //     }.bind(this))
  //
  //     cb(undefined, {code: 200, status: type+' for '+events.join(',')+' events'})
  //   }
  //   else{
  //     cb({code: 500, status: type+'no event specified'}, undefined)
  //   }
  // },
  // unregister: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['events'])
  //   let {events} = params
  //   let id = (socket) ? socket.id : req.session.id
  //   let session = this.__process_session(req, socket)
  //   session.send_register_resp = session.send_register_resp+1 || 0
  //   let req_id = id +'.'+session.send_register_resp
  //
  //   debug_internals('unregister %o', events)
  //
  //   let send_resp = {}
  //   send_resp[req_id] = function(err, result){
  //     // debug_internals('register.send_resp %o', err, result)
  //     if(err){
  //       if(resp){
  //         resp.status(err.code).json(err)
  //       }
  //       else{
  //         socket.emit('off', err)
  //       }
  //     }
  //     else{
  //       if(resp){
  //         resp.json(result)
  //       }
  //       else{
  //         socket.emit('off', result)
  //       }
  //     }
  //
  //     delete send_resp[req_id]
  //   }
  //
  //   this.__process_register_unregister(
  //     {
  //       type: 'unregister',
  //       id: id,
  //       events: events,
  //       session: session,
  //     },
  //     send_resp[req_id]
  //   )
  // },
  // register: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['events'])
  //   let {events} = params
  //   let id = (socket) ? socket.id : req.session.id
  //   let session = this.__process_session(req, socket)
  //   session.send_register_resp = session.send_register_resp+1 || 0
  //   let req_id = id +'.'+session.send_register_resp
  //
  //   debug_internals('register %o', events)
  //
  //   let send_resp = {}
  //   send_resp[req_id] = function(err, result){
  //     // debug_internals('register.send_resp %o', err, result)
  //     if(err){
  //       if(resp){
  //         resp.status(err.code).json(err)
  //       }
  //       else{
  //         socket.emit('on', err)
  //       }
  //     }
  //     else{
  //       if(resp){
  //         resp.json(result)
  //       }
  //       else{
  //         socket.emit('on', result)
  //       }
  //     }
  //
  //     delete send_resp[req_id]
  //   }
  //
  //   this.__process_register_unregister(
  //     {
  //       type: 'register',
  //       id: id,
  //       events: events,
  //       session: session,
  //     },
  //     send_resp[req_id]
  //   )
  //
  // },
  // host_instances: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'prop', 'instances'])
  //   let {host, prop, instances} = params
  //   // let query = (req) ? req.query : { format: params.format }
  //   // let range = (req) ? req.header('range') : params.range
  //   // let type = (range) ? 'range' : 'once'
  //   let id = (socket) ? socket.id : req.session.id
  //   let session = this.__process_session(req, socket)
  //
  //   session.send_instances_resp = session.send_instances_resp+1 || 0
  //   let req_id = id +'.'+session.send_instances_resp
  //
  //   let send_resp = {}
  //   send_resp[req_id] = function(data){
  //     // if(prop) type = prop
  //
  //     let result = {
  //       type: 'instances',
  //       // range: range,
  //       host: host
  //     }
  //
  //     // if(query.format) type = query.format
  //
  //     // result['instances'] = data
  //     result = Object.merge(result, data)
  //
  //     if(result && (result.length > 0 || Object.getLength(result) > 0)){
  //
  //       if(resp){
  //         resp.json(result)
  //       }
  //       else{
  //         /**
  //         * @bug: result.instances.instances
  //         **/
  //         // result.instances = result.instances.instances
  //
  //         socket.emit('instances', result)
  //       }
  //     }
  //     else{
  //       if(resp){
  //         resp.status(404).json({status: 'no instances'})
  //       }
  //       else{
  //         socket.emit('instances', {status: 'no instances'})
  //       }
  //
  //     }
  //
  //     delete send_resp[req_id]
  //   }
  //
  //   if(instances){
  //
  //     try{
  //       let _parsed = JSON.parse(instances)
  //       // debug_internals('data: paths _parsed %o ', _parsed)
  //
  //       instances = []
  //       if(Array.isArray(_parsed))
  //         Array.each(_parsed, function(_path){
  //           // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
  //           //avoid duplicates (with push, you may get duplicates)
  //           instances.combine([_path])
  //         }.bind(this))
  //
  //
  //     }
  //     catch(e){
  //       // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
  //     }
  //
  //     if(!Array.isArray(instances))
  //       instances = [instances]
  //
  //
  //     this.__get_instances(instances, host, send_resp[req_id])
  //   }
  //   else{
  //
  //     this.cache.get(host+'.instances', function(err, instances){
  //       if(instances){
  //         // result.instances = instances
  //         this.__get_instances(instances, host, send_resp[req_id])
  //       }
  //       else{
  //         send_resp[req_id](null)
  //       }
  //       // if(instances)
  //       //   result.instances = instances
  //       //
  //       // send_result(result)
  //     }.bind(this))
  //
  //   }
  //
  //   debug_internals('host_instances %o', instances)
  //
  //
  // },
  // __get_instances: function(instances, host, cb){
  //   let result = { instances: {} }
  //   Array.each(instances, function(instance, index){
  //
  //     this.cache.get(host+'.tabular.'+instance, function(err, data){
  //       // if(data) result[instance] = JSON.parse(data)
  //       if(data) result['instances'][instance] = data
  //
  //       if(index == instances.length - 1){
  //         cb(result)
  //         return result
  //       }
  //       // let result = {type: 'property'}
  //       // result.property = { instances: instances }
  //       // debug_internals('host %s prop %s %o', host, prop, result)
  //
  //
  //     })
  //
  //   }.bind(this))
  //
  // },



  /**
  * --------------
  **/
  __no_host: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    if(resp){
      resp.status(500).json({error: 'no host param', status: 500})
    }
    else{
      socket.emit('host', {error: 'no host param', status: 500})
    }
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
    transformed[type] = {}

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

      // debug_internals('DATA', d, type)

      if(d && d !== null){
        if (d[0] && d[0].metadata && d[0].metadata.format && d[0].metadata.format == type){

          // if(!d[0].metadata.format[type]){
          let formated_data = []
          Array.each(d, function(_d){ formated_data.push(_d.data) })
          transformed[type] = this.__merge_transformed(this.__transform_name(path), formated_data, transformed[type])
          // }

          if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
            cb(transformed)

        }
        else if (
          (d[0] && d[0].metadata && !d[0].metadata.format && type == 'stat')
          || (d[0] && !d[0].metadata && type == 'tabular')
        ){
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

                  this.cache.get(cache_key+'.'+type+'.'+this.__transform_name(path+'.'+path_key), function(err, chart_instance){
                    // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart
                    chart_instance = (chart_instance) ? chart_instance : chart

                    chart_instance = Object.merge(chart, chart_instance)

                    // chart_instance = _transform(chart_instance)

                    convert(d[sub_key], chart_instance, path+'.'+path_key, function(name, stat){
                      transformed[type] = this.__merge_transformed(name, stat, transformed[type])
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

                      /**
                      * race condition between this app && ui?
                      **/
                      // this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path+'.'+path_key), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

                      if(
                        transform_result_counter == transform_result_length - 1
                        && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                      ){
                        /**
                        * race condition between this app && ui?
                        **/
                        // this.__save_instances(cache_key, instances, cb.pass(transformed[type]))
                        cb(transformed[type])
                      }

                      transform_result_counter++
                    }.bind(this))



                  }.bind(this))
                }
                else{
                  convert(d[sub_key], chart, path+'.'+path_key, function(name, stat){
                    transformed[type] = this.__merge_transformed(name, stat, transformed[type])
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
                this.cache.get(cache_key+'.'+type+'.'+this.__transform_name(path), function(err, chart_instance){
                  // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : transform
                  chart_instance = (chart_instance) ? chart_instance : transform

                  chart_instance = Object.merge(chart_instance, transform)
                  // debug_internals('chart_instance NOT FUNC %o', chart_instance)

                  // debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path)

                  // throw new Error()
                  convert(d, chart_instance, path, function(name, stat){
                    transformed[type] = this.__merge_transformed(name, stat, transformed[type])
                    // name = name.replace(/\./g, '_')
                    // let to_merge = {}
                    // to_merge[name] = stat
                    //
                    // debug_internals('transformed custom CACHE', cache_key+'.'+type+'.'+path, transformed)

                    // transformed = Object.merge(transformed, to_merge)

                    // chart_instance = this.cache.clean(chart_instance)

                    // instances.push(this.__transform_name(path))


                    instances[this.__transform_name(path)] = chart_instance
                    /**
                    * race condition between this app && ui?
                    **/
                    // this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

                    if(
                      transform_result_counter == transform_result_length - 1
                      && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                    ){
                      /**
                      * race condition between this app && ui?
                      **/
                      // this.__save_instances(cache_key, instances, cb.pass(transformed[type]))
                      cb(transformed[type])
                    }

                    transform_result_counter++

                  }.bind(this))



                }.bind(this))
              }
              else{
                convert(d, transform, path, function(name, stat){
                  transformed[type] = this.__merge_transformed(name, stat, transformed[type])

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

              this.cache.get(cache_key+'.'+type+'.'+this.__transform_name(path), function(err, chart_instance){
                // chart_instance = (chart_instance) ? JSON.parse(chart_instance) : chart
                chart_instance = (chart_instance) ? chart_instance : chart

                chart_instance = Object.merge(chart, chart_instance)

                // debug_internals('transform default', d, path)

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
                    transformed[type] = this.__merge_transformed(name, stat, transformed[type])

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

                  /**
                  * race condition between this app && ui?
                  **/
                  // this.cache.set(cache_key+'.'+type+'.'+this.__transform_name(path), JSON.stringify(chart_instance), this.CHART_INSTANCE_TTL)

                  if(
                    transform_result_counter == transform_result_length - 1
                    && (counter >= Object.getLength(data) - 1 && typeof cb == 'function')
                  ){
                    /**
                    * race condition between this app && ui?
                    **/
                    // this.__save_instances(cache_key, instances, cb.pass(transformed[type]))
                    cb(transformed[type])
                  }

                  transform_result_counter++
                }.bind(this))



              }.bind(this))
            }
            else{//default trasnform for "stat"
              require('./libs/'+type)(d, path, function(name, stat){
                transformed[type] = this.__merge_transformed(name, stat, transformed[type])
                // name = name.replace(/\./g, '_')
                // let to_merge = {}
                // to_merge[name] = stat
                // debug_internals('transformed default', type, to_merge)
                // transformed = Object.merge(transformed, to_merge)
                debug_internals('transform default', d, path)

                if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
                  cb(transformed)

              }.bind(this))
            }


          }

          // if(counter == Object.getLength(data) - 1 && typeof cb == 'function')
          //   cb(transformed)

        }
        else if(counter == Object.getLength(data) - 1 && typeof cb == 'function'){
            cb(transformed)
        }

      }//end if(d && d !== null)
      else if(counter == Object.getLength(data) - 1 && typeof cb == 'function'){
          cb(transformed)
      }

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

  },
  __get_host_range: function(payload){
    let {from, host, prop, paths, query, range, req_id, socket, cb} = payload
    from = from || 'periodical'

    debug_internals('__get_host_range', payload)

    this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
      debug_internals('RANGE', parse_range(range), range)

      let parsed_range = parse_range(range)
      let new_range = Object.clone(parsed_range)
      let range_seconds_length = (parsed_range.end - parsed_range.start) / 1000
      let range_counter = 0
      let range_total = 0

      let _get_resp = {}
      _get_resp[req_id] = function(resp){
        if(resp.id == req_id){
          debug_internals('_get_resp RANGE %d %d', resp.range_counter, range_total)

          cb(resp)

          // if(socket && range_total == resp.range_counter){
            this.removeEvent(this['ON_HOST_RANGE_'+from.toUpperCase()], _get_resp[req_id])
            delete _get_resp[req_id]
          // }
          // else if(!socket) {//http request
          //   throw new Error('TODO: add a Limit header')
          //   this.removeEvent(this.ON_HOST_RANGE, _get_resp[req_id])
          //   delete _get_resp[req_id]
          // }
        }
      }.bind(this)

      this.addEvent(this['ON_HOST_RANGE_'+from.toUpperCase()], _get_resp[req_id])

      // let __event_worker = function(payload, done){
      //   pipe.hosts.inputs[1].fireEvent('onRange', payload)//fire only the 'host' input
      //
      //   if(typeof done == 'function')
      //     done()
      // }.bind(this)
      //
      // if(range_seconds_length > this.RANGE_SECONDS_LIMIT){
      //   // pipe.hosts.fireEvent('onSuspend')//for debuging only (to not get "flooded" by live data)
      //
      //   range_total = (range_seconds_length / this.RANGE_SECONDS_LIMIT) - 1
      //
      //   let q = qrate(__event_worker, this.RANGE_WORKERS_CONCURRENCY, this.RANGE_WORKERS_RATE);
      //
      //
      //   do {
      //     new_range.end = new_range.start + (this.RANGE_SECONDS_LIMIT * 1000)
      //
      //     debug_internals('firing RANGE', new_range)
      //
      //     q.push({
      //       host: host,
      //       prop: prop,
      //       paths: paths,
      //       query: query,
      //       id: req_id,
      //       full_range: range,
      //       range_counter: range_counter++,
      //       Range: build_range(new_range)
      //     })
      //
      //     new_range.start += (this.RANGE_SECONDS_LIMIT * 1000)
      //   } while(new_range.end < parsed_range.end);
      // }
      // else{
      //   __event_worker({
      //     host: host,
      //     prop: prop,
      //     paths: paths,
      //     query: query,
      //     id: req_id,
      //     Range: range
      //   })
      // }

      /**
      * if it's "on_demand", fireEvent once range has been processed byt "ui" server
      **/

      if(this.options.on_demand && query.format == 'tabular'){//last one ain't right..check is only to prevent multiple calls for stat|tabular
        debug_internals('RANGE', prop, query)
        this.ui_rest_client.api.get({
          uri: "events/range",
          qs: {
            hosts: host,
            // prop: prop,
            // paths: paths,
            // query: query,
            id: req_id,
            range: range,
            pipeline_id: 'ui',
          },
          headers: {
            'Range': range
          }
        })
      }
      // else{}

      if(from === 'periodical'){
        pipe.hosts.inputs[1].fireEvent('onRange', {
          host: host,
          prop: prop,
          paths: paths,
          query: query,
          id: req_id,
          Range: range
        })//fire only the 'host' input
      }
      else{
        pipe.hosts.inputs[3].fireEvent('onRange', {
          host: host,
          prop: prop,
          paths: paths,
          query: query,
          id: req_id,
          Range: range
        })//fire only the 'host.historical' input
      }


    }.bind(this))

  },
  // __get_host: function(host, prop, req_id, socket, cb){
  __get_host: function(payload){
    let {from, host, prop, query, req_id, socket, cb} = payload
    from = from || 'periodical'

    this.cache.get('host.'+host+'.'+from, function(err, result){
      // debug_internals('get host %o %o', err, result)

      let _get_resp = {}
      _get_resp[req_id] = function(resp){
        if(resp.id == req_id){
          // debug_internals('_get_resp %o %o', resp, result)

          if(result)//cache result
            resp['host'] = Object.merge(result, resp['host'])

          this.cache.set('host.'+host+'.'+from, resp['host'])
          // send_resp[req_id](resp)

          cb(resp)

          this.removeEvent(this['ON_HOST_'+from.toUpperCase()+'_UPDATED'], _get_resp[req_id])
          delete _get_resp[req_id]
        }
      }.bind(this)

      if(
        !result //nothing on cache
        || (prop && !result[prop]) //or request a prop and doens't exist on cache
      ){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            // // debug_internals('send_resp', pipe)

            this.addEvent(this['ON_HOST_'+from.toUpperCase()+'_UPDATED'], _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            if(from === 'periodical'){
              pipe.hosts.inputs[1].fireEvent('onOnce', {host, prop, query, id: req_id})//fire only the 'host' input
            }
            else{
              pipe.hosts.inputs[3].fireEvent('onOnce', {from, host, prop, query, id: req_id})//fire only the 'host.historical' input
            }

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
                this.removeEvent(this['ON_HOST_'+from.toUpperCase()+'_UPDATED'], _merge_resp[prop])

                //end of array props? send response
                if(index == this.options.host.properties.length -1)
                  _get_resp[req_id](props_result)

              }.bind(this)

              this.addEvent(this['ON_HOST_'+from.toUpperCase()+'_UPDATED'], _merge_resp[prop])

              if(from === 'periodical'){
                pipe.hosts.inputs[1].fireEvent('onOnce', {host, prop, query, id: req_id})//fire only the 'host' input
              }
              else{
                pipe.hosts.inputs[3].fireEvent('onOnce', {from, host, prop, query, id: req_id})//fire only the 'host.historical' input
              }

            }.bind(this))
          }


        }.bind(this))
      }
      else{
        // send_resp[req_id]({type: 'hosts', hosts: result})
        cb({from: from, type: 'host', host: result})
      }

    }.bind(this))
  },
  __get_hosts: function(payload){
    let {from, req_id, socket, cb} = payload
    debug_internals('__get_hosts', payload)
    from = from || 'periodical'

    this.cache.get('hosts.'+from, function(err, result){
      debug_internals('get hosts cache %o %o %s', err, result, req_id)
      if(!result){
        this.__get_pipeline((socket) ? socket.id : undefined, function(pipe){
            debug_internals('send_resp', pipe)

            let _get_resp = {}
            _get_resp[req_id] = function(resp){
              debug_internals('_get_resp %s %s', resp.id, req_id)

              if(resp.id == req_id){

                this.cache.set('hosts.'+from, resp['hosts'], this.HOSTS_TTL)
                // send_resp[req_id](resp)

                cb(resp)

                this.removeEvent(this['ON_HOSTS_'+from.toUpperCase()+'_UPDATED'], _get_resp[req_id])
                delete _get_resp[req_id]
              }
            }.bind(this)

            this.addEvent(this['ON_HOSTS_'+from.toUpperCase()+'_UPDATED'], _get_resp[req_id])

            // this.addEvent(this.ON_HOSTS_UPDATED, send_resp[req_id])

            // pipe.hosts.fireEvent('onOnce')
            // pipe.hosts.inputs[0].conn_pollers[0].fireEvent('onOnce')
            pipe.hosts.inputs[0].fireEvent('onOnce', {from: from, id: req_id})//fire only the 'hosts' input

          }.bind(this))
      }
      else{
        // send_resp[req_id]({type: 'hosts', hosts: result})
        cb({from: from, type: 'hosts', hosts: result})
      }

    }.bind(this))
  },
  /**
  * -----------------
  **/
  domains: function(req, resp, next){
    debug_internals('domains:', req.params)
    let params = req.params
    // let {req, resp, socket, params} = payload
    // payload.next(undefined, ['something'])
    //
    // // let {host, prop, paths} = params
    //
    // // let query = (req) ? req.query : { format: params.format }
    // // let range = (req) ? req.header('range') : params.range
    // // let type = (range) ? 'range' : 'once'
    //
    // let id = (socket) ? socket.id : req.session.id
    // let session = this.__process_session(req, socket)
    //
    // // let from = 'periodical'
    // //
    // // if(req && req.path.indexOf('minute') > -1)
    // //   from = 'minute'
    // //
    // // if(req && req.path.indexOf('hour') > -1)
    // //   from = 'hour'
    // //
    // // let __query_paths = undefined
    //
    // // if(paths){
    // //   __query_paths = []
    // //
    // //   try{
    // //     let _parsed = JSON.parse(paths)
    // //     // debug_internals('data: paths _parsed %o ', _parsed)
    // //
    // //     paths = []
    // //     if(Array.isArray(_parsed))
    // //       Array.each(_parsed, function(_path){
    // //         let __query_path = (query.format && _path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')) : _path
    // //         // let arr_path = [(_path.indexOf('.') > -1) ? _path.substring(0, _path.indexOf('.')).replace(/_/g, '.') : _path.replace(/_/g, '.')]
    // //         //avoid duplicates (with push, you may get duplicates)
    // //         __query_paths.combine([__query_path])
    // //         paths.combine([_path])
    // //       }.bind(this))
    // //
    // //
    // //   }
    // //   catch(e){
    // //     // path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
    // //   }
    // //
    // //   if(!Array.isArray(paths)){
    // //     __query_paths = (query.format && paths.indexOf('.') > -1) ? [paths.substring(0, paths.indexOf('.'))]: [paths]
    // //     paths = [paths]
    // //   }
    // //
    // // }
    //
    //
    // session.send_resp = session.send_resp+1 || 0
    //
    // let req_id = id +'.'+session.send_resp
    //
    // let send_resp = {}
    // send_resp[req_id] = function(data){
    //
    //   debug_internals('send_resp', data)
    //
    //
    //   delete send_resp[req_id]
    //
    // }.bind(this)
    //

    let {id, chain} = this.register_response((req) ? req : socket, function(err, result){
      debug_internals('send_resp', err, result)
      let status = (err && err.status) ? err.status : ((err) ? 500 : 200)
      if(err)
        result = Object.merge(err, result)

      if(resp){
        resp.status(status).json(result)
      }
      else{
        socket.emit('host', result)
      }
    }.bind(this))

    this.get_from_input({
      response: id,
      input: (params.domain) ? 'domain' : 'domains',
      from: 'periodical',
      params: params,
      next: (id, err, result) => this.response(id, err, result)

    })
    // // let _recive_pipe = function(pipeline){
    // //   debug_internals('domains pipeline', pipeline)
    // //   this.removeEvent(this.ON_PIPELINE_READY, _recive_pipe)
    // // }
    // // this.addEvent(this.ON_PIPELINE_READY, _recive_pipe)
    // // OR
    // this.get_pipeline(undefined, function(pipeline){
    //   debug_internals('domains get_pipeline', pipeline)
    //
    //   this.response(id, ['some', 'args'])
    // }.bind(this))
  },
  logs: function(req, resp, next){
    debug_internals('logs:', req.params)
    let params = req.params


    let {id, chain} = this.register_response((req) ? req : socket, function(err, result){
      debug_internals('send_resp', err, result)
      let status = (err && err.status) ? err.status : ((err) ? 500 : 200)
      if(err)
        result = Object.merge(err, result)

      if(resp){
        resp.status(status).json(result)
      }
      else{
        socket.emit('host', result)
      }
    }.bind(this))

    this.get_from_input({
      response: id,
      input: (params.log) ? 'log' : 'logs',
      from: 'periodical',
      params: params,
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
