'use strict'

// const App = require ( 'node-app-rethinkdb-client/index' )
const App = require('node-app')

let redis = require('redis')


let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Input'),
    debug_events = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Input:Events'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24


module.exports = new Class({
  Extends: App,

  ON_CONNECT: 'onConnect',
  ON_CONNECT_ERROR: 'onConnectError',


  // FOLD_BASE: 300,
  MAX_RANGE_DATA_POINTS: 300,

  feeds: undefined,
  close_feed: undefined,
  changes_buffer: {},
  changes_buffer_expire: {},

  // changes_buffer: [],
  // changes_buffer_expire: undefined,

  events: {},
  // feed: undefined,
  // close_feed: false,

  registered: {},
  hosts_ranges: {},

  scan_cursor: {},
  scan_hosts: {},

  options: {
    host: '127.0.0.1',
    port: undefined,
    db: undefined,
    // table: undefined,
    redis: {},

    scan_count: 1000,
    scan_host_expire: SECOND * 10,

		requests : {
      periodical: [
        // {
        //   scan: function(req, next, app){
        //     app.__scan(undefined, undefined, app)
        //   //   // Object.each(app.scan_hosts, function(data, host){
        //   //   //   if(data.timestamp + app.options.scan_host_expire < Date.now())
        //   //   //     delete app.scan_hosts[host]
        //   //   // })
        //   //   //
        //   //   // if(app.data_hosts && app.data_hosts.length > 0){
        //   //   //   Array.each(app.data_hosts, function(host){
        //   //   //     if(!app.scan_cursor[host]) app.scan_cursor[host] = 0
        //   //   //
        //   //   //     app.conn.scan(app.scan_cursor[host], 'MATCH', host+"\.*", 'COUNT', app.options.scan_count, function(err, result) {
        //   //   //       // debug_internals('scan', err, result)
        //   //   //       if(!err){
        //   //   //         if(!app.scan_hosts[host]) app.scan_hosts[host] = {keys: [], timestamp: Date.now()}
        //   //   //
        //   //   //         app.scan_hosts[host].keys.combine(result[1])
        //   //   //
        //   //   //         app.scan_cursor[host] = result[0]
        //   //   //       }
        //   //   //       // this.fireEvent(this.ON_DOC_SAVED, [err, result])
        //   //   //     }.bind(this))
        //   //   //
        //   //   //
        //   //   //   })
        //   //   // }
        //   }
        // },
        // {
				// 	get_data_range: function(req, next, app){
        //     debug_internals('get_data_range', app.data_hosts);
				// 		if(app.data_hosts && app.data_hosts.length > 0){
        //
        //       Array.each(app.data_hosts, function(host){
        //
        //         // app.__scan(host, function(){
        //         let timestamps = app.__get_timestamps(app.scan_hosts[host].keys)
        //         debug_internals('get_data_range', host, timestamps)
        //
        //         if(timestamps.length > 0){
        //           app.data_range(
        //             undefined,
        //             { metadata: { timestamp: timestamps[0] }},
        //             {
        //               options:{
        //                 _extras: {
        //                   id: undefined,
        //                   prop: 'data_range',
        //                   range_select : 'start',
        //                   host: host,
        //                   type: 'prop'
        //                 }
        //               }
        //             }
        //           )
        //
        //           app.data_range(
        //             undefined,
        //             { metadata: { timestamp: timestamps[timestamps.length - 1] }},
        //             {
        //               options: {
        //                 _extras: {
        //                   id: undefined,
        //                   prop: 'data_range',
        //                   range_select : 'end',
        //                   host: host,
        //                   type: 'prop'
        //                 }
        //               }
        //             }
        //           )
        //         }
        //         // }, app)
        //
        //
        //
        //
        //       })
        //
        //     }
        //
				// 	}
				// },
        // {
				// 	search_paths: function(req, next, app){
				// 		// if(req.host && !req.type && (req.prop == 'paths' || !req.prop)){
        //     if(app.data_hosts && app.data_hosts.length > 0){
        //
        //       Array.each(app.data_hosts, function(host){
        //
        //         // app.__scan(host, function(){
        //         let paths = app.__get_paths(app.scan_hosts[host].keys, host)
        //         debug_internals('search_paths', host, paths);
        //
        //         if(Object.getLength(paths) > 0)
        //           app.paths(
        //             undefined,
        //             paths,
        //             {
        //               options: {
        //                 _extras: {id: undefined, prop: 'paths', host: host, type: 'prop'},
        //               }
        //             }
        //           )
        //
        //         // }, app)
        //
        //
        //
        //
        //       })
        //     }
        //
				// 	}
				// },
        // {
				// 	get_changes: function(req, next, app){
        //     if(app.registered){
        //       let hosts = []
        //       Object.each(app.registered, function(registered_data, id){
        //         // debug_internals('get_changes', registered_data)
        //         Object.each(registered_data, function(props, host){
        //
        //           if(props.contains('data'))//if registered for "data"
        //             hosts = hosts.combine([host])
        //
        //         })
        //       })
  			// 			//debug_internals('_get_last_stat %o', next);
        //       // let start = Date.now() - 3999
        //       // let end = Date.now()
        //
  			// 			debug_internals('get_changes %s', new Date(), app.hosts_ranges, hosts);
        //
  			// 			// let views = [];
  			// 			// Object.each(app.hosts, function(value, host){
  			// 				// debug_internals('_get_last_stat %s', host);
        //
        //         Array.each(hosts, function(host){
        //           // debug_internals('_get_last_stat %s %s', host, path);
        //           // let _func = function(){
        //
        //           // app.__scan(host, function(){
        //           if(app.hosts_ranges[host] && app.hosts_ranges[host].end){
        //             let paths = app.__get_paths(app.scan_hosts[host].keys, host)
        //
        //             app.__get_data(
        //               host,
        //               paths,
        //               roundMilliseconds(app.hosts_ranges[host].end) - SECOND * 2,
        //               roundMilliseconds(app.hosts_ranges[host].end),
        //               function(err, data){
        //                 app.data(
        //                   err,
        //                   data,
        //                   {
        //                     options: {
        //                       _extras: {
        //                         id: undefined,
        //                         prop: 'changes',
        //                         host: host,
        //                       },
        //                     }
        //                   }
        //                 )
        //               }
        //             )
        //
        //           }
        //           // }, app)
        //
        //
        //
        //         }.bind(app))
        //
        //     }
				// 	}
				// },


      ],
      once: [
        // {
        //   scan: function(req, next, app){
        //     app.__scan()
        //     // Object.each(app.scan_hosts, function(data, host){
        //     //   if(data.timestamp + app.options.scan_host_expire < Date.now())
        //     //     delete app.scan_hosts[host]
        //     // })
        //     //
        //     // if(app.data_hosts && app.data_hosts.length > 0){
        //     //   Array.each(app.data_hosts, function(host){
        //     //     if(!app.scan_cursor[host]) app.scan_cursor[host] = 0
        //     //
        //     //     app.conn.scan(app.scan_cursor[host], 'MATCH', host+"\.*", 'COUNT', app.options.scan_count, function(err, result) {
        //     //       // debug_internals('scan', err, result)
        //     //       if(!err){
        //     //         if(!app.scan_hosts[host]) app.scan_hosts[host] = {keys: [], timestamp: Date.now()}
        //     //
        //     //         app.scan_hosts[host].keys.combine(result[1])
        //     //
        //     //         app.scan_cursor[host] = result[0]
        //     //       }
        //     //       // this.fireEvent(this.ON_DOC_SAVED, [err, result])
        //     //     }.bind(this))
        //     //
        //     //
        //     //   })
        //     // }
        //   }
        // },
        {
					get_data_range: function(req, next, app){
            debug_internals('get_data_range', req.host, req.prop);
						if(req.host && !req.type && (req.prop == 'data_range' || !req.prop)){
              let host = req.host

              app.__scan(host, function(){

                let timestamps = app.__get_timestamps(app.scan_hosts[host].keys)

                debug_internals('get_data_range', host, timestamps)

                if(timestamps.length > 0){
                  app.data_range(
                    undefined,
                    { metadata: { timestamp: timestamps[0] }},
                    {
                      options:{
                        _extras: {
                          id: req.id,
                          prop: 'data_range',
                          range_select : 'start',
                          host: host,
                          type: (!req.prop) ? 'host' : 'prop'
                        }
                      }
                    }
                  )

                  app.data_range(
                    undefined,
                    { metadata: { timestamp: timestamps[timestamps.length - 1] }},
                    {
                      options: {
                        _extras: {
                          id: req.id,
                          prop: 'data_range',
                          range_select : 'end',
                          host: host,
                          type: (!req.prop) ? 'host' : 'prop'
                        }
                      }
                    }
                  )
                }

              }, app)





            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'paths' || !req.prop)){
              debug_internals('search_paths', req.host, req.prop);
              let host = req.host

              app.__scan(host, function(){
                let paths = app.__get_paths(app.scan_hosts[host].keys, host)
                debug_internals('search_paths', host, paths);

                if(Object.getLength(paths) > 0)
                  app.paths(
                    undefined,
                    paths,
                    {
                      options: {
                        _extras: {id: req.id, prop: 'paths', host: host, type: (!req.prop) ? 'host' : 'prop'},
                      }
                    }
                  )

              }, app)



            }

					}
				},
        {
					search_data: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'data' || !req.prop)){
              let host = req.host

              app.__scan(host, function(){
                debug_internals('search_data', host, app.hosts_ranges)

                if(app.hosts_ranges[host] && app.hosts_ranges[host].end){
                  let paths = app.__get_paths(app.scan_hosts[host].keys, host)

                  app.__get_data(
                    host,
                    paths,
                    roundMilliseconds(app.hosts_ranges[host].end - 1000),
                    roundMilliseconds(app.hosts_ranges[host].end),
                    function(err, data){
                      debug_internals('search_data', host, data)

                      app.data(
                        err,
                        data,
                        {
                          options: {
                            _extras: {id: req.id, prop: 'data', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
                          }
                        }
                      )
                    }
                  )

                }
              }, app)

            }

					}
				},

        {
					register: function(req, next, app){
						if(req.host && req.type == 'register' && req.prop == 'data' && req.id){
              debug_internals('register', req.host, req.prop, req.id);
              let {host, prop, id} = req

              app.register(host, prop, id)

              // if(!app.registered[id]) app.registered[id] = {}
              // if(!app.registered[id][host]) app.registered[id][host] = []
              //
              // app.registered[id][host] = app.registered[id][host].combine([prop])

            }

					}
				},
        {
					unregister: function(req, next, app){

						if(req.type == 'unregister'){
              let {host, prop, id} = req
              app.unregister(host, prop, id)

              // debug_internals('unregister', req)
              // process.exit(1)


              // if(app.registered[id]){
              //   if(host && prop && app.registered[id][host])
              //     app.registered[id][host] = app.registered[id][host].erase(prop)
              //
              //   if((host && app.registered[id][host].length == 0) || (host && !prop))
              //     delete app.registered[id][host]
              //
              //
              //   if(Object.getLength(app.registered[id]) == 0 || !host)
              //     delete app.registered[id]
              // }
              //
              // debug_internals('unregister', req.type, req.host, req.prop, req.id, app.registered);

            }

					}
				},
        {
					catch_all: function(req, next, app){
						if(req.prop && !app.options.properties.contains(req.prop)){
              debug_internals('catch_all', req)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }

					}
				},
      ],

      range: [
        {
					get_data_range: function(req, next, app){
            // process.exit(1)

						if(req.host && (req.prop == 'data_range' || !req.prop)){
              debug_internals('range get_data_range', req.host, req.prop);

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start
              let host = req.host

              app.__scan(host, function(){

                let timestamps = app.__get_timestamps(app.scan_hosts[host].keys, start, end)

                debug_internals('get_data_range', host, app.scan_hosts[host].keys, timestamps)

                if(timestamps.length > 0){
                  // let start_ts = end_ts = undefined
                  // Array.each(timestamps, function(ts){
                  //   if(!start_ts || (ts < start_ts && ts >= start))
                  //     start_ts = ts
                  //
                  //   if(!end_ts || (ts > end_ts && ts <= end))
                  //     end_ts = ts
                  // })

                  app.data_range(
                    undefined,
                    { metadata: { timestamp: timestamps[0] }},
                    {
                      options:{
                        _extras: {
                          id: req.id,
                          prop: 'data_range',
                          range_select : 'start',
                          host: req.host,
                          type: (!req.prop) ? 'host' : 'prop',
                          range: req.opt.range,
                          full_range: req.full_range,
                          range_counter: req.range_counter
                        }
                      }
                    }
                  )

                  app.data_range(
                    undefined,
                    { metadata: { timestamp: timestamps[timestamps.length - 1] }},
                    {
                      options: {
                        _extras: {
                          id: req.id,
                          prop: 'data_range',
                          range_select : 'end',
                          host: req.host,
                          type: (!req.prop) ? 'host' : 'prop',
                          range: req.opt.range,
                          full_range: req.full_range,
                          range_counter: req.range_counter
                        }
                      }
                    }
                  )
                }

              }, app)


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && (req.prop == 'paths' || !req.prop)){
              // debug_internals('search_paths range', req.host, req.prop, req.opt.range)

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start
              let host = req.host

              app.__scan(host, function(){
                let paths = app.__get_paths(app.scan_hosts[host].keys, host, start, end)
                debug_internals('search_paths', host, paths);

                if(Object.getLength(paths) > 0)
                  app.paths(
                    undefined,
                    paths,
                    {
                      options: {
                        _extras: {id: req.id, prop: 'paths', host: host, type: (!req.prop) ? 'host' : 'prop'},
                      }
                    }
                  )

              }, app)


            }

					}
				},
        {
					search_data: function(req, next, app){
						if(req.host && (req.prop == 'data' || !req.prop)){
              let host = req.host
              let paths = req.paths
              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              let range_length = Math.ceil((end - start) / SECOND)
              let fold = Math.ceil((range_length / app.FOLD_BASE))

              debug_internals('search_data range %o', host);

              app.__scan(host, function(){
                if(!paths){
                  // paths = app.__get_paths(app.scan_hosts[host].keys, host, start, end)
                  paths = app.__get_paths(app.scan_hosts[host].keys, host)
                }

                debug_internals('search_data range %s', host, paths);

                app.__get_data(
                  host,
                  paths,
                  roundMilliseconds(start),
                  roundMilliseconds(end),
                  function(err, data){
                    app.data(
                      err,
                      data,
                      {
                        options: {
                          _extras: {
                            id: req.id,
                            prop: 'data',
                            host: req.host,
                            type: (!req.prop) ? 'host' : 'prop',
                            range: req.opt.range,
                            full_range: req.full_range,
                            range_counter: req.range_counter,
                            // multipath: {index: index, length: paths.length}
                          },
                        }
                      }
                    )
                  }
                )
              }, app)



                // app.map({
                //   _extras: {
                //     id: req.id,
                //     prop: 'data',
                //     host: req.host,
                //     type: (!req.prop) ? 'host' : 'prop',
                //     range: req.opt.range,
                //     full_range: req.full_range,
                //     range_counter: req.range_counter
                //   },
                //   uri: app.options.db+'/ui',
                //   args: function(x){ return [x('group'),x('reduction')] },
                //
                //   query: app.r.db(app.options.db).
                //   table('ui').
                //   between(
                //     [req.host, 'periodical', roundMilliseconds(start)],
                //     [req.host, 'periodical', roundMilliseconds(end)],
                //     {index: 'sort_by_host'}
                //   ).
                //   // fold(0, function(acc, row) {
                //   //   return acc.add(1);
                //   // }, {emit:
                //   //   function (acc, row, new_acc) {
                //   //     return app.r.branch(new_acc.eq(0), [row], new_acc.mod(fold).eq(0), [row], []);
                //   //   }
                //   // }).
                //   group(app.r.row('metadata')('path')).
                //   ungroup()
                // })
              // }
            }

					}
				},
        {
					catch_all: function(req, next, app){
						if(req.prop && !app.options.properties.contains(req.prop)){
              // debug_internals('catch_all', req.host, req.prop)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }


					}
				},
      ],

		},

		routes: {
      reduce: [{
        path: ':database/:table',
        callbacks: ['paths']
      }],
      // map: [{
      //   path: ':database/:table',
      //   callbacks: ['data']
      // }],
      between: [{
        path: ':database/:table',
        callbacks: ['data']
      }],
      // nth: [{
      //   path: ':database/:table',
      //   callbacks: ['data_range']
      // }],
      // distinct: [{
      //   path: ':database/:table',
      //   callbacks: ['distinct']
      // }],
      // changes: [{
      //   path: ':database/:table',
      //   callbacks: ['changes']
      // }],

		},


  },

  properties: ['paths', 'data', 'data_range'],
  // properties: [],

  hosts: {},
  _multi_response: {},

  connect: function(err, conn, params){
		debug_events('connect %o', err, conn)
		if(err){
			this.fireEvent(this.ON_CONNECT_ERROR, { error: err, params: params });
			// throw err
		}
		else if(conn){
			// this.conn = conn
			this.fireEvent(this.ON_CONNECT, { conn: conn,  params: params});

      // let index = params.index
      // this.options.conn[index].accept = true

		}
	},
  initialize: function(options, connect_cb){


    // this.fireEvent(this.ON_CLIENT_CONNECT, undefined, 2000)

    this.addEvent('onSuspend', function(){
      this.registered = {}
    }.bind(this))

    this.setOptions(options);//override default options

    let opts = Object.merge(
      this.options.redis,
      {
        host: this.options.host,
        port: this.options.port,
        db: this.options.db
      }
    )

    let _cb = function(err, conn){
      this.conn = conn
      connect_cb = (typeOf(connect_cb) ==  "function") ? connect_cb.bind(this) : this.connect.bind(this)
      connect_cb(err, conn, opts)
    }.bind(this)

    let client = redis.createClient(opts)


    client.on('connect', function(){ _cb(undefined, client) }.bind(this))
    client.on('error', function(err){ _cb(err, undefined) }.bind(this))


    // this.addEvent('onResume', this.register_on_changes.bind(this))

		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:hosts:Pipeline:Host:Input', 'info', 'mngr-ui-admin:apps:hosts:Pipeline:Host:Input started');

    debug_internals('initialize', this.options)

  },
  __scan: function(hosts, cb, self){
    hosts = hosts || self.data_hosts
    if(!Array.isArray(hosts)) hosts = [hosts]

    debug_internals('__scan', hosts, self.scan_hosts, self.scan_cursor)

    Object.each(self.scan_hosts, function(data, host){
      if(data.timestamp + self.options.scan_host_expire < Date.now())
        delete self.scan_hosts[host]
    })

    if(hosts && hosts.length > 0){

      Array.each(hosts, function(host){

        if(!self.scan_cursor[host]) self.scan_cursor[host] = 0

        debug_internals('scan', host)

        self.conn.scan(self.scan_cursor[host], 'MATCH', host+"\.*", 'COUNT', self.options.scan_count, function(err, result) {

          // debug_internals('scan result', result)

          if(!err){
            if(!self.scan_hosts[host]) self.scan_hosts[host] = {keys: [], paths: [], timestamp: Date.now()}

            /**
            * remove host && timestamp
            **/
            let _paths = []
            Array.each(result[1], function(row, index){
              _paths.push(row.substring(row.indexOf('.')+1, row.indexOf('@')))
            })

            debug_internals('scan result', result)

            self.scan_hosts[host].keys.combine(result[1])
            self.scan_hosts[host].paths.combine(_paths)

            self.scan_cursor[host] = result[0]
          }

          if(cb && typeof cb == 'function')
            cb(err, result)

          // self.fireEvent(self.ON_DOC_SAVED, [err, result])
        }.bind(self))


      }.bind(self))
    }
  },
  __get_timestamps: function(keys, start, end){
    let timestamps = []
    Array.each(keys, function(key){
      let ts = key.substring(key.indexOf('@') + 1) * 1

      // debug_internals('__get_timestamps ts', ts, start, end, ((!start || ts >= start) && (!end || ts <= end)))

      if((!start || ts >= start) && (!end || ts <= end)){
        timestamps.push(ts)
      }
    })

    timestamps = timestamps.sort(function(a, b){ return a - b})

    return timestamps
  },
  __get_paths: function(keys, host, start, end){

    let paths = {}
    Array.each(keys, function(key){
      let ts = key.substring(key.indexOf('@') + 1) * 1
      let path = key.substring(0, key.indexOf('@'))
      path = path.replace(host+'.', '')
      // debug_internals('__get_timestamps ts', ts)

      if((!start || ts >= start) && (!end || ts <= end))
        paths[path] = true
    })
    // paths = paths.filter(function(value, index, self) {
    //   return self.indexOf(value) === index;
    // })


    return paths
  },
  __get_data: function(host, paths, start, end, cb){
    let _paths = (Array.isArray(paths)) ? Array.clone(paths) : Object.keys(paths)
    debug_internals('__get_data', host, paths, start, end)
    let _keys = []
    // start = roundMilliseconds(start)
    // end = roundMilliseconds(end)
    let ts = start

    Array.each(_paths, function(path){
      do{
        _keys.push(host+'.'+path+'@'+ts)
        ts = ts + SECOND
      } while (ts <= end)

      ts = start
    })

    debug_internals('MGET', _paths, _keys, start, end)
    // let data = []

    // //remove (set undefined) keys not in range (start - end)
    // Array.each(_keys, function(key, index){
    //   let ts = key.substring(key.indexOf('@') + 1) * 1
    //
    //   debug_internals('TS', ts, (ts > start && ts < end))
    //
    //   if(!(ts > start && ts < end))
    //     _keys[index] = undefined
    //
    // })
    //
    // _keys = _keys.clean()
    //
    // debug_internals('MGET', _keys)
    //
    if(_keys.length > 0)
      this.conn.mget(_keys, function(err, result){
        if(!err){
          // debug_internals('MGET', result)

          Array.each(result, function(doc, index){
            if(doc && doc != null)
              result[index] = JSON.parse(doc)
          })
          result = result.clean()

          debug_internals('MGET', result)

          cb(undefined, result)
        }
        else{
          cb(err, undefined)
        }


      })
    //
    // // paths = paths.filter(function(value, index, self) {
    // //   return self.indexOf(value) === index;
    // // })
    //
    //
    // // return data
  },
  data_range: function(err, resp, params){
    debug_internals('data_range', err, resp, params.options)

    if(err){
      // debug_internals('reduce err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			this.fireEvent(this.ON_DOC_ERROR, err);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    else{
      let extras = params.options._extras
      let host = extras.host
      let prop = extras.prop
      let range_select = extras.range_select //start | end
      let type = extras.type
      let id = extras.id

      if(!this.hosts[host]) this.hosts[host] = {}
      if(!this.hosts[host][prop]) this.hosts[host][prop] = {start: '', end: ''}



      // if(extras.range == 'end')
      //   process.exit(1)

      // // if(resp) debug_internals('paths', Object.keys(resp))
      //
      // // let result = {}
      // // this.hosts[host][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null
      this.hosts[host][prop][range_select] = (resp && resp.metadata && resp.metadata.timestamp) ? resp.metadata.timestamp : null

      // debug_internals('data_range', this.hosts)

      if(this.hosts[host][prop]['start'] != '' && this.hosts[host][prop]['end'] != ''){
        this.hosts_ranges[host] = Object.clone(this.hosts[host]['data_range'])

        debug_internals('data_range firing host...', this.hosts_ranges[host])

        if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
          let found = false
          Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
            if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
              found = true
          })




          // if(id === undefined){
          //   this.fireEvent('onDoc', [(found) ? this.hosts[host]['data_range'] : null, Object.merge(
          //     {input_type: this, app: null},
          //     extras,
          //     {type: (id === undefined) ? 'data_range' : 'host'}
          //     // {host: host, type: 'host', prop: prop, id: id}
          //   )])
          // }
          // else{
            this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
              {input_type: this, app: null},
              extras,
              {type: (id === undefined) ? 'data_range' : 'host'}
              // {host: host, type: 'host', prop: prop, id: id}
            )])
          // }

          delete this.hosts[host]
        }
      }



    }
  },
  unknown_property: function(params){
    // debug_internals('unknown_property', params.options)
    let extras = params.options._extras
    let host = extras.host
    let prop = extras.prop
    let type = extras.type
    let id = extras.id

    this.fireEvent('onDoc', [null, Object.merge(
      {input_type: this, app: null},
      // {host: host, type: 'host', prop: prop, id: id}
      extras,
      {type: 'host'}
    )])
  },
  data: function(err, resp, params){
    debug_internals('data', err, params.options)

    if(err){
      // debug_internals('reduce err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			this.fireEvent(this.ON_DOC_ERROR, err);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    // else{
    let extras = params.options._extras
    let host = extras.host
    let prop = extras.prop
    let type = extras.type
    let id = extras.id
    let multipath = extras.multipath



    if(resp && prop == 'changes'){
      let result = resp
      // let results = resp
      // resp.toArray(function(err, results) {
        if (err) throw err;

        debug_internals('changes', result.length)

        if(result.length > 0)
          this.__process_changes(result)

      // }.bind(this));
    }
    else{
      let result = {}

      /**
      * this replace the coerceTo('object') from rethinkdb
      **/
      Array.each(resp, function(value, index){
        if(value && value.metadata && value.metadata.path){
          if(!result[value.metadata.path]) result[value.metadata.path] = []

          result[value.metadata.path].push(value)
          // debug_internals('resp', value)
          // process.exit(1)
        }
      })

      if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

      // if(resp) debug_internals('data', resp)

      let data = {}
      // resp.toArray(function(err, arr){

        // debug_internals('data length ', arr.length)

        // this.hosts[host][prop] = arr
        // this.r.expr(arr).coerceTo('object').run(this.conn, function(err, result){


          // if(multipath){
          //   let index = multipath.index
          //   if(!this._multi_response[id]) this._multi_response[id] = []
          //
          //   // debug_internals('multipath %o', id, multipath, this._multi_response[id].length)
          //
          //   this._multi_response[id].push( result )
          //
          //   if(this._multi_response[id].length == multipath.length){
          //     let final_result = {data: {}, step: undefined}
          //     Array.each(this._multi_response[id], function(resp){
          //       final_result.data = Object.merge(final_result.data,resp)
          //     })
          //
          //     debug_internals('multipath final %o', final_result)
          //     if(extras.range){
          //       final_result = this.__step_on_max_data_points(final_result.data)
          //     }
          //     // this.fireEvent('on'+event+'Doc', [final_result, {id: id, type: type, input_type: this, app: null}]);
          //     this.fireEvent('onDoc', [
          //       (Object.getLength(final_result.data) > 0) ? final_result : null,
          //       Object.merge(
          //         {input_type: this, app: null},
          //         // {host: host, type: 'host', prop: prop, id: id}
          //         extras,
          //         {type: 'host', step: final_result.step}
          //       )
          //     ])
          //     // delete this.hosts[host]
          //
          //     delete this._multi_response[id]
          //   }
          //   // }
          //
          // }
          // else{



            if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

            // debug_internals('data firing host...', this.hosts, host)

            this.hosts[host][prop] = result

            debug_internals('data length ', result, this.hosts[host])

            if(Object.getLength(result) == 0 || type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
              let found = false
              Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
                if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
                  found = true
              })

              // debug_internals('data firing host...', this.hosts[host].data)
              debug_internals('data firing host...', host)

              if(extras.range && this.hosts[host].data){
                this.hosts[host] = Object.merge(this.hosts[host], this.__step_on_max_data_points(this.hosts[host].data))
              }

              this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
                {input_type: this, app: null},
                // {host: host, type: 'host', prop: prop, id: id}
                extras,
                {type: 'host', step: this.hosts[host].step}
              )])
              delete this.hosts[host]
            }
          // }



        // }.bind(this))



      // }.bind(this))

    }


  },
  __step_on_max_data_points: function(data){
    let step = 1
    Object.each(data, function(result_data, result_path){
      if(Array.isArray(result_data)){
        result_data.sort(function(a,b) {
          return (a.metadata.timestamp > b.metadata.timestamp) ? 1 : ((b.metadata.timestamp > a.metadata.timestamp) ? -1 : 0)
        })

        step = Math.ceil(result_data.length / this.MAX_RANGE_DATA_POINTS)
        if(step > 1){
          Array.each(result_data, function(result_data_values, result_data_index){
            // if(result_data_index != 0 && (result_data_index % step) != 0)
            if(result_data_index % step != 0)
              result_data[result_data_index] = undefined
          })

          result_data = result_data.clean()
        }
      }
    }.bind(this))

    return {data: data, step: step}
  },
  paths: function(err, resp, params){
    debug_internals('paths', err, params.options)

    if(err){
      // debug_internals('reduce err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			this.fireEvent(this.ON_DOC_ERROR, err);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    // else{
    let extras = params.options._extras
    let host = extras.host
    let prop = extras.prop
    let type = extras.type
    let id = extras.id


    if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

    // if(resp) debug_internals('paths', Object.keys(resp))

    // let result = {}
    // this.hosts[host][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null
    this.hosts[host][prop] = (resp) ? Object.keys(resp) : null

    if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
      let found = false
      Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
        if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
          found = true
      })

      // debug_internals('paths firing host...', this.hosts[host])

      // debug_internals('paths firing host...', this.hosts[host], Object.merge(
      //   extras,
      //   {type: 'host'}
      //   // {host: host, type: 'host', prop: prop, id: id}
      // ))

      // if(id === undefined){
      //   this.fireEvent('onDoc', [(found) ? this.hosts[host]['paths'] : null, Object.merge(
      //     {input_type: this, app: null},
      //     extras,
      //     // {type: 'host'}
      //     {type: (id === undefined) ? 'paths' : 'host'}
      //     // {host: host, type: 'host', prop: prop, id: id}
      //   )])
      // }
      // else{
        this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
          {input_type: this, app: null},
          extras,
          // {type: 'host'}
          {type: (id === undefined) ? 'paths' : 'host'}
          // {host: host, type: 'host', prop: prop, id: id}
        )])
      // }

      delete this.hosts[host]
    }



    // }
  },
  unregister: function(hosts, props, id){
    debug_internals('unregister', hosts, props, id)
    if(!hosts){
      hosts = Object.keys(this.events)
    }
    else if(!Array.isArray(hosts)){
      hosts = [hosts]
    }

    Array.each(hosts, function(host){
      if(!props){
        props = Object.keys(this.events[host])
      }
      else if(!Array.isArray(props)){
        props = [props]
      }

      Array.each(props, function(prop){
        if(this.events[host][prop] && this.events[host][prop].contains(id)){
          this.events[host][prop].erase(id)
          this.events[host][prop] = this.events[host][prop].clean()

          if(this.events[host][prop].length == 0){
            delete this.events[host][prop]
          }
        }
      }.bind(this))



      if(this.events[host] && Object.getLength(this.events[host]) == 0)
        delete this.events[host]
    }.bind(this))

    debug_internals('unregister', this.events, id)
    // process.exit(1)

    if(Object.getLength(this.events) == 0 && this.feed){
      debug_internals('unregister closing')
      this.__close_changes()

      // this.feeds[host].close(function (err) {
      //   this.close_feed = true
      //   if (err){
      //     debug_internals('err closing cursor', err)
      //   }
      // }.bind(this))
      // this.feed = undefined
    }

    debug_internals('unregister', this.events)

  },
  __close_changes: function(){
    // debug_internals('__close_changes', this.feed)
    // process.exit(1)
    if(this.feed){
      this.feed.unsubscribe(this.options.channel,function(){

        // this.feed.end(true)
        this.feed.quit(function(){
          debug_internals('__close_changes', this.feed)
          // process.exit(1)

          this.close_feed = true

          // if (err){
          //   debug_internals('err closing cursor onSuspend', err)
          // }
          this.feed = undefined
        }.bind(this))



      }.bind(this))


      // this.feed.quit()
      // this.close_feed = true

    }

    // this.removeEvent('onSuspend', this.__close_changes)
  },
  register: function(host, prop, id){
    // debug_internals('register', host, prop, id)

    if(!this.events[host]) this.events[host] = {}
    if(!this.events[host][prop]) this.events[host][prop] = []
    this.events[host][prop].combine([id])//avoid duplicates ids

    if(!this.changes_buffer[host]) this.changes_buffer[host] = []
    if(!this.changes_buffer_expire[host]) this.changes_buffer_expire[host] = Date.now()

    if(!this.feed){

      this.addEvent('onSuspend', this.__close_changes.pass(undefined, this))

      let opts = Object.merge(
        this.options.redis,
        {
          host: this.options.host,
          port: this.options.port,
          db: this.options.db
        }
      )

      // let _cb = function(err, conn){
      //   if(!err){
      //     // this.feed = conn
      //
      //     this.feed.on("message", function(channel, message) {
      //       // console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
      //
      //       // debug_internals('message', channel, message)
      //       // if(this.close_feed === true){
      //       //   this.close_feed = false
      //       //   if(this.feed)
      //       //     this.feed.quit()
      //       //
      //       //   this.feed = undefined
      //       // }
      //
      //       if(channel == this.options.channel){
      //         let _message_host = message.substring(0, message.indexOf('.'))
      //
      //         // debug_internals('changes %s', new Date(), _message_host, this.changes_buffer)
      //         // throw new Error()
      //
      //         if(this.changes_buffer[_message_host])
      //           this.changes_buffer[_message_host].push(message)
      //
      //         if(
      //           this.changes_buffer_expire[_message_host]
      //           && this.changes_buffer_expire[_message_host] < Date.now() - 900
      //           && this.changes_buffer[_message_host].length > 0
      //         ){
      //           // console.log('onPeriodicalDoc', this.changes_buffer.length)
      //
      //           // this.__process_changes(this.changes_buffer[host])
      //
      //           // debug_internals('changes %s', new Date(), _message_host, this.changes_buffer[_message_host])
      //           // throw new Error()
      //           this.__get_data_range(this.changes_buffer[host], host)
      //           this.__search_paths(this.changes_buffer[host], host)
      //           this.__get_changes(this.changes_buffer[host], host)
      //
      //           this.changes_buffer_expire[_message_host] = Date.now()
      //           this.changes_buffer[_message_host] = []
      //
      //         }
      //
      //       }
      //     }.bind(this));
      //
      //     this.feed.subscribe(this.options.channel)
      //   }
      //   // connect_cb = (typeOf(connect_cb) ==  "function") ? connect_cb.bind(this) : this.connect.bind(this)
      //   // connect_cb(err, conn, opts)
      // }.bind(this)

      this.feed = redis.createClient(opts)

      this.feed.on("message", function(channel, messages) {
        debug('feed message', messages)

        if(channel == this.options.channel){
          messages = messages.split(',')
          Array.each(messages, function(message, index){
            let _message_host = message.substring(0, message.indexOf('.'))

            // debug_internals('changes %s', new Date(), _message_host, this.changes_buffer)
            // throw new Error()

            if(this.changes_buffer[_message_host])
              this.changes_buffer[_message_host].push(message)

            // if(
            //   this.changes_buffer_expire[_message_host]
            //   && this.changes_buffer_expire[_message_host] < Date.now() - 999
            //   && this.changes_buffer[_message_host].length > 0
            // ){
            //   // console.log('onPeriodicalDoc', this.changes_buffer.length)
            //
            //   // this.__process_changes(this.changes_buffer[host])
            //
            //   // debug_internals('changes %s', new Date(), _message_host, this.changes_buffer[_message_host])
            //   // throw new Error()
            //   this.__get_data_range(this.changes_buffer[_message_host], _message_host)
            //   this.__search_paths(this.changes_buffer[_message_host], _message_host)
            //   this.__get_changes(this.changes_buffer[_message_host], _message_host)
            //
            //   this.changes_buffer_expire[_message_host] = Date.now()
            //   this.changes_buffer[_message_host] = []
            //
            // }
            if(index === messages.length -1){
              Object.each(this.changes_buffer, function(host_buffer, host){
                this.__get_data_range(host_buffer, host)
                this.__search_paths(host_buffer, host)
                this.__get_changes(host_buffer, host)

                this.changes_buffer_expire[host] = Date.now()
                this.changes_buffer[host] = []
              }.bind(this))
            }
          }.bind(this))



        }
      }.bind(this));

      this.feed.subscribe(this.options.channel)

      // this.feed.on('connect', function(){ _cb(undefined, this.feed) }.bind(this))
      // this.feed.on('error', function(err){ this.feed = undefined }.bind(this))

      // this.r.db(this.options.db).
      //   table('ui').
      //   getAll(host, {index: 'host'}).
      //   changes({includeTypes: true, squash: 1}).
      //   run(this.conn, {maxBatchSeconds: 1}, function(err, cursor) {
      //
      //   this.feeds[host] = cursor
      //
      //   this.feeds[host].each(function(err, row){
      //
      //     /**
      //     * https://www.rethinkdb.com/api/javascript/each/
      //     * Iteration can be stopped prematurely by returning false from the callback.
      //     */
      //     if(this.close_feeds[host] === true){ this.close_feeds[host] = false; this.feeds[host] = undefined; return false }
      //
      //     // debug_internals('changes %s', new Date())
      //     if(row && row !== null ){
      //       if(row.type == 'add'){
      //         // debug_internals('changes add %s %o', new Date(), row.new_val)
      //         // debug_internals("changes add now: %s \n timstamp: %s \n expire: %s \n host: %s \n path: %s",
      //         //   new Date(roundMilliseconds(Date.now())),
      //         //   new Date(roundMilliseconds(row.new_val.metadata.timestamp)),
      //         //   new Date(roundMilliseconds(this.changes_buffer_expire[host])),
      //         //   row.new_val.metadata.host,
      //         //   row.new_val.metadata.path
      //         // )
      //
      //         this.changes_buffer[host].push(row.new_val)
      //       }
      //
      //       if(this.changes_buffer_expire[host] < Date.now() - 900 && this.changes_buffer[host].length > 0){
      //         // console.log('onPeriodicalDoc', this.changes_buffer.length)
      //
      //         this.__process_changes(this.changes_buffer[host])
      //
      //         // debug_internals('changes %s', new Date(), data)
      //
      //         this.changes_buffer_expire[host] = Date.now()
      //         this.changes_buffer[host] = []
      //
      //       }
      //
      //     }
      //
      //
      //   }.bind(this))
      //
      // }.bind(this))

    }


  },

  __search_paths: function(keys, host){

    let paths = this.__get_paths(keys, host)
    debug_internals('search_paths', host, paths);

    if(Object.getLength(paths) > 0)
      this.paths(
        undefined,
        paths,
        {
          options: {
            _extras: {id: undefined, prop: 'paths', host: host, type: 'prop'},
          }
        }
      )

	},

	__get_data_range: function(keys, host){

    let timestamps = this.__get_timestamps(keys)
    debug_internals('__get_data_range', host, timestamps)

    if(timestamps.length > 0){
      this.data_range(
        undefined,
        { metadata: { timestamp: timestamps[0] }},
        {
          options:{
            _extras: {
              id: undefined,
              prop: 'data_range',
              range_select : 'start',
              host: host,
              type: 'prop'
            }
          }
        }
      )

      this.data_range(
        undefined,
        { metadata: { timestamp: timestamps[timestamps.length - 1] }},
        {
          options: {
            _extras: {
              id: undefined,
              prop: 'data_range',
              range_select : 'end',
              host: host,
              type: 'prop'
            }
          }
        }
      )
    }
    // }, app)



  },
  __get_changes: function(keys, host){

		debug_internals('get_changes %s', new Date(), host);

    let paths = this.__get_paths(keys, host)
    let timestamps = this.__get_timestamps(keys)
    let start = timestamps[0]
    let end = timestamps[timestamps.length - 1]
    this.__get_data(
      host,
      paths,
      start,
      end,
      function(err, data){
        this.data(
          err,
          data,
          {
            options: {
              _extras: {
                id: undefined,
                prop: 'changes',
                host: host,
              },
            }
          }
        )
      }.bind(this)
    )

	},
  __process_changes: function(buffer){
    let data = {}
    Array.each(buffer, function(doc){
      let path = doc.metadata.path
      let host = doc.metadata.host

      if(!data[host]) data[host] = {}
      if(!data[host][path]) data[host][path] = []
      data[host][path].push(doc)

    }.bind(this))

    Object.each(data, function(host_data, host){
      // debug_internals('changes emiting %o', host, host_data)
      this.fireEvent('onDoc', [{ data : host_data }, Object.merge(
        {input_type: this, app: null},
        // {host: host, type: 'host', prop: prop, id: id}
        {type: 'data', host: host}
      )])

    }.bind(this))
  },




});
