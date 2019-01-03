'use strict'

var	path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let Pipeline = require('js-pipeline')

let extract_data_os = require( 'node-mngr-docs' ).extract_data_os
let data_to_tabular  = require( 'node-tabular-data' ).data_to_tabular

let uptime_chart = require('mngr-ui-admin-charts/os/uptime')
let loadavg_chart = require('mngr-ui-admin-charts/os/loadavg')
let cpus_times_chart = require('mngr-ui-admin-charts/os/cpus_times')
let cpus_percentage_chart = require('mngr-ui-admin-charts/os/cpus_percentage')
let freemem_chart = require('mngr-ui-admin-charts/os/freemem')
let mounts_percentage_chart = require('mngr-ui-admin-charts/os/mounts_percentage')
let blockdevices_stats_chart = require('mngr-ui-admin-charts/os/blockdevices_stats')
let networkInterfaces_chart = require('mngr-ui-admin-charts/os/networkInterfaces')
let networkInterfaces_stats_chart = require('mngr-ui-admin-charts/os/networkInterfaces_stats')
// let procs_count_chart = require('mngr-ui-admin-charts/os/procs_count')
let procs_top_chart = require('mngr-ui-admin-charts/os/procs_top')
let munin = require('mngr-ui-admin-charts/munin/default')

let debug = require('debug')('apps:os'),
    debug_internals = require('debug')('apps:os:Internals');

module.exports = new Class({
  Extends: App,

  HostOSPipeline: undefined,
  pipelines: {},
  __stats: {},
  __stats_tabular: {},

  charts:{},

  __charts_instances:{},



  __charts: {
    'os.uptime': {chart: uptime_chart},
    'os.loadavg': {chart: loadavg_chart},
    'os.cpus': {
      times: { chart: cpus_times_chart },
      percentage : { chart: cpus_percentage_chart }
    },
    'os_procs_uid_stats':{
      top: {'matched_name': true, match: '%s', chart: procs_top_chart },
    },
    'os_procs_cmd_stats':{
      top: {'matched_name': true, match: '%s', chart: procs_top_chart },
    },
    'os_procs_stats':{
      top: {'matched_name': true, match: '%s', chart: procs_top_chart },
    },
    // 'os_procs': {
    //   count: {'matched_name': true, match: '%s', chart: procs_count_chart },
    // },
    /**
    * matched_name: true; will use that name as the key, else if will use the chart key
    * ex matched_name = true: os_networkInterfaces_stats{ lo_bytes: {}}
    * ex matched_name != true: os.cpus{ cpus_percentage: {}}
    **/
    'os_networkInterfaces_stats': {
      properties: {'matched_name': true, match: '%s', chart: networkInterfaces_stats_chart},
    },
    'os_mounts':{
      percentage : { 'matched_name': true, match: '%s', chart: mounts_percentage_chart},
    },
    'os_blockdevices': {
      stats : { 'matched_name': true, match: '%s', chart: blockdevices_stats_chart},
    },
    'new RegExp("^munin")': { 'matched_name': true, chart: munin }


  },



	options: {
    id: 'os',
    path: 'os',

    authorization: undefined,

    params: {
			host: /(.|\s)*\S(.|\s)*/,
      // stat:
		},


    api: {
      // path: '/',
			routes: {
				get: [
					{
						path: 'charts/:host?/:chart?',
						callbacks: ['charts'],
						version: '',
					},
          {
						path: 'instances/:host?/:path?',
						callbacks: ['instances'],
						version: '',
					},
          {
						path: 'stats/:host?/:stat?',
						callbacks: ['stats'],
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
        // charts: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['charts'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
				charts: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['charts'],
					// middlewares: [], //socket.use(fn)
				}],
        instances: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['instances'],
					// middlewares: [], //socket.use(fn)
				}],
        stats: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['stats'],
					// middlewares: [], //socket.use(fn)
				}],

			}
		}
	},

  stats: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'stat'])
    let {host, stat} = params
    let query = (req) ? req.query : { format: params.format }
    let range = (req) ? req.header('range') : params.range
    let type = (range) ? 'range' : 'once'
    let id = (socket) ? socket.id : req.session.id
    let session = (socket) ? socket.handshake.session : req.session
    // //console.log('SESSION', session)
    session.send_stats = session.send_stats+1 || 0
    let req_id = id +'.'+session.send_stats
    // session.save()
    // //console.log('ARGUMENTS', arguments)
    //console.log('PARAMS', params)
    //console.log('QUERY', query)
    //console.log('REQ', range)
    //console.log('SESSION', session)



    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{
      // let send_stats = function(stats){
      //   //console.log('PARAMS', params)
      //   //console.log('QUERY', query)
      //   //console.log('REQ', range)
      //   //console.log('found_stats', stats)
      //
      // }

      let send_stats = function(stats){
        // let stats = this.__stats[host].data

        // //console.log('PARAMS', params)
        // //console.log('QUERY', query)
        // //console.log('REQ', range)
        // //console.log('found_stats', stats)

        let found_stats = {}
        if(stat){//one stat only
          found_stats = this.__find_stat(stat, Object.clone(stats))
          // //console.log('STAT', stats, stat)
          // Object.each(stats, function(data, name){
          //   if(name != stat)
          //     delete stats[name]
          // })
        }
        else{
          found_stats = Object.clone(stats)
        }



        if(found_stats && Object.getLength(found_stats) == 0){
          if(resp){
            resp.status(404).json({host: host, type: type, err: 'not found'})
          }
          else{
            socket.binary(false).emit('stats', {host: host, type: type, err: 'not found'})
          }
        }
        else{
          if(query && query.format == 'tabular'){

            let send_tabular = function(tabular){

              if(resp){
                resp.json({host: host, status: 'ok', type: type, stats: tabular, tabular: true})
              }
              else{
                // if(stats.length == 0){
                // //console.log('PARAMS', params)
                // //console.log('QUERY', query)
                // //console.log('REQ', range)
                // }
                //
                socket.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: tabular, tabular: true})
              }
            }.bind(this)


            let expire_time = Date.now() - 1000 //last second expire

            if(!range && ( this.__stats_tabular[host] && this.__stats_tabular[host].lastupdate > expire_time )){
              //console.log('TABULAR NOT EXPIRED')
              // this.__process_tabular(host, this.__stats[host].data, send_tabular, true)//cache = true
              send_tabular(this.__stats_tabular[host].data)
            }
            else{
              // //console.log('send_stats', found_stats.os_networkInterfaces_stats)

              this.__process_tabular(host, found_stats, function(output){
                // //console.log('send_stats', output)
                this.__stats_tabular[host] = {data: output, lastupdate: Date.now()}
                // //console.log('TABULAR RANGE', output)
                send_tabular(this.__stats_tabular[host].data)
              }.bind(this))
            }

          }
          else{
            if(resp){
              resp.json({host: host, status: 'ok', type: type, stats: found_stats})
            }
            else{
              socket.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: found_stats})
            }
          }

          // if(this.options.redis){
            // delete this.__stats[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('statsProcessed.'+req_id, send_stats)
      }.bind(this)

      let expire_time = Date.now() - 1000 //last second expire


      // if(this.__stats[host] && this.__stats[host].lastupdate)
      //   //console.log('expire', (this.__stats[host].lastupdate > expire_time), this.__stats[host].lastupdate, expire_time)

      // if no range, lest find out if there are stats that are newer than expire time
      if(!range && ( this.__stats[host] && this.__stats[host].lastupdate > expire_time )){
        //console.log('NOT EXPIRED', new Date(expire_time))
        send_stats(this.__stats[host].data)
      }
      else{
        let update_stats = function(stats){
          this.__stats[host] = { data: stats, lastupdate: Date.now() }
          this.removeEvent('statsProcessed.'+req_id, update_stats)
        }.bind(this)

        this.addEvent('statsProcessed.'+req_id, update_stats)
        this.addEvent('statsProcessed.'+req_id, send_stats)



        let path = undefined
        if(stat){
          path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
        }

        this.__get_pipeline(host, (socket) ? socket.id : undefined, function(pipe){
          // if(pipe.connected == true)
            this.__get_stats({
              host: host,
              pipeline: pipe.pipeline,
              path: path,
              range: range,
              req_id: req_id//use and "id" for the event
            })
        }.bind(this))

      }

    }
  },
  charts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'chart'])
    let {host, chart} = params
    let id = (socket) ? socket.id : req.session.id
    let session = (socket) ? socket.handshake.session : req.session
    session.send_charts = session.send_charts+1 || 0
    let req_id = id +'.'+session.send_charts

    // ////console.log('host...', params, host, this.__stats[host])
    // let host = arguments[2]
    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_charts = function(){
        let charts = {}

        if(chart && this.charts[host][chart]){
          charts[chart] = this.charts[host][chart]
        }
        else if(this.charts[host]){
          charts = this.charts[host]
        }

        if(charts && Object.getLength(charts) == 0){
          if(resp){
            resp.status(404).json({host: host, err: 'not found'})
          }
          else{
            socket.binary(false).emit('charts', {host: host, err: 'not found'})
          }
        }
        else{

          if(resp){
            resp.json({host: host, status: 'ok', charts: charts})
          }
          else{
            socket.binary(false).emit('charts', {host: host, status: 'ok', charts: charts})
          }

          // if(this.options.redis){
            // delete this.__stats[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('chartsProcessed.'+req_id, send_charts)
      }.bind(this)

      if(this.charts[host] && Object.getLength(this.charts[host]) > 0){//stats processed already
        // ////console.log('this.__stats[host]', this.__stats[host])
        send_charts()
      }
      else{
        this.addEvent('chartsProcessed.'+req_id, send_charts)
        this.__get_pipeline(host, (socket) ? socket.id : undefined, function(pipe){
          // if(pipe.connected)
            this.__get_stats({
              host:host,
              pipeline: pipe.pipeline,
              req_id: req_id
            })
        }.bind(this))

      }


    }


	},
  instances: function(){
    debug_internals('instances')
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'path'])
    let {host, path} = params
    let id = (socket) ? socket.id : req.session.id
    let session = (socket) ? socket.handshake.session : req.session
    session.send_instances = session.send_instances+1 || 0
    let req_id = id +'.'+session.send_instances

    // ////console.log('host...', params, host, this.__stats[host])
    // let host = arguments[2]
    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_instances = function(){
        debug_internals('send_instances')

        let instances = {}

        debug_internals('send_instances %o', this.__charts_instances[host])

        if(path && this.__charts_instances[host][path]){
          instances[path] = this.__charts_instances[host][path]
        }
        else if(this.__charts_instances[host]){
          instances = this.__charts_instances[host]
        }

        if(instances && Object.getLength(instances) == 0){
          if(resp){
            resp.status(404).json({host: host, err: 'not found'})
          }
          else{
            socket.binary(false).emit('instances', {host: host, err: 'not found'})
          }
        }
        else{

          if(resp){
            resp.json({host: host, status: 'ok', instances: instances})
          }
          else{
            socket.binary(false).emit('instances', {host: host, status: 'ok', instances: instances})
          }

          // if(this.options.redis){
            // delete this.__stats[host]
            // delete this.charts[host]
          // }
        }

        // this.removeEvent('instancesProcessed.'+req_id, send_instances)
      }.bind(this)

      let expire_time = Date.now() - 1000 //last second expire

      if(
        ( this.__stats[host] && this.__stats[host].lastupdate > expire_time )
        && (this.__charts_instances[host] && Object.getLength(this.__charts_instances[host]) > 0)
      ){//stats processed already
        // ////console.log('this.__stats[host]', this.__stats[host])
        send_instances()
      }
      else{
        // this.addEvent('instancesProcessed.'+req_id, send_instances)

        this.__get_pipeline(host, (socket) ? socket.id : undefined, function(pipe){
          // if(pipe.connected)
            this.__get_stats({
              host:host,
              pipeline: pipe.pipeline,
              req_id: req_id
            }, function(payload){
              debug_internals('cb', payload)
              if(payload.doc)
                this.__process_os_doc(payload.doc, function(stats){
                  // this.__process_stats_charts(host, stats, req_id)

                  this.__process_tabular(host, stats, function(output){
                    // // //console.log('send_stats', output)
                    // this.__stats_tabular[host] = {data: output, lastupdate: Date.now()}
                    // // //console.log('TABULAR RANGE', output)
                    send_instances()
                  }.bind(this))

                }.bind(this))

            }.bind(this))
        }.bind(this))

      }


    }


	},
	initialize: function(options){
    this.parent(options)

		this.profile('os_init');//start profiling

    this.profile('os_init');//end profiling

		this.log('os', 'info', 'os started');
  },
  socket: function(socket){
		this.parent(socket)

		socket.on('disconnect', function () {

      ////console.log('disconnect this.io.namespace.connected', this.io.connected)


      Object.each(this.pipelines, function(pipe){
        if(pipe.ids.contains(socket.id)){
          pipe.ids.erase(socket.id)
          pipe.ids = pipe.ids.clean()
        }

        ////console.log('suspending...', pipe.ids, pipe.ids.length)

        if(pipe.ids.length == 0 && pipe.suspended == false){
          ////console.log('suspending...', pipe.ids)
          pipe.suspended = true
          pipe.pipeline.fireEvent('onSuspend')
        }

      }.bind(this))
			// if(Object.keys(this.io.connected).length == 0)
				// this.pipeline.fireEvent('onSuspend')


		}.bind(this));
	},
  __emit_stats: function(host, payload){
		//console.log('broadcast stats...', host, payload.type)
    let {type, doc} = payload

    if(type == 'periodical' && doc.length > 0){

      this.__process_os_doc(doc, function(stats){
        // this.__stats[host] = {data: stats, lastupdate: Date.now()}
        // this.__process_stats_charts(host, stats)

        // //console.log('broadcast stats...', this.__stats[host])
        // this.io.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: this.__stats[host].data, tabular: false})
        this.io.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: stats, tabular: false})

        this.__process_tabular(host, stats, function(output){
          // this.__stats_tabular[host] = {data: output, lastupdate: Date.now()}

          // //console.log('broadcast stats...', output)
          this.io.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: output, tabular: true})


        }.bind(this), false)
      }.bind(this))

    }


	},
  _arguments: function(args, defined_params){
		let req, resp, next, socket = undefined
    // ////console.log(typeof args[0])
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
  __process_tabular: function(host, stats, cb, cache){
    // let charts = this.charts[host]
    // if(Object.clone(stats).os_networkInterfaces_stats && Object.clone(stats).os_networkInterfaces_stats.lo_bytes)
    // //console.log('PRE-MATCHED', Object.clone(stats).os_networkInterfaces_stats.lo_bytes)

    if(!this.__charts_instances[host])
      this.__charts_instances[host] = {}

    let matched = undefined
    Object.each(this.charts[host], function(data, path){
      let charts = {}
      if(data.chart){
        charts[path] = data
      }
      else{
        charts = data
      }

      // let {name, chart} = data

      if(!matched)
        matched = {}

      /**
      * we will create an instance for each one, as charts like "blockdevices"
      * hace static properties like "prev", and you may have multiple devices overriding it
      **/
      // if(!data['_instances']) data['_instances'] = {}
      if(!this.__charts_instances[host][path])
        this.__charts_instances[host][path] = {}

      Object.each(charts, function(chart_data, chart_name){
        let {match, chart} = chart_data
        // if(!match){
        //   match = path
        // }
        // else{
        //   match = path+'.'+match
        // }

        // if(!this.__charts_instances[host][path][chart_name])
        //   this.__charts_instances[host][path][chart_name] = {}
        try{
          let rg = eval(path)
          let obj = this.__match_stats_name(Object.clone(stats), path, match)
          // // matched = Object.merge(matched, obj)
          debug_internals('PRE TO MATCHED OBJ %o',obj)
          Object.each(obj, function(obj_data, new_path){
            let start_path = new_path.substring(0, new_path.indexOf('_'))
            let end_path = new_path.substring(new_path.indexOf('_')+1)
            if(!matched[start_path+'/'+end_path]) matched[start_path+'/'+end_path] = {}

            if(!this.__charts_instances[host][start_path])
              this.__charts_instances[host][start_path] = {}

            matched[start_path+'/'+end_path]= obj_data
            // Object.each(obj_data, function(value, chart_name){
            //   if(!matched[start_path+'/'+end_path]) matched[start_path+'/'+end_path] = {}
            //
            //
            //   matched[start_path+'/'+end_path][chart_name] = value
            // }.bind(this))
          //   // matched[start_path+'/'+end_path] = obj_data
        }.bind(this))


          debug_internals('PRE TO MATCHED %o',matched)

        }
        catch(e){
          matched[path+'/'+chart_name] = this.__match_stats_name(Object.clone(stats), path, match)

        }


      }.bind(this))


    }.bind(this))

    // //console.log('MATCHED', matched)
    debug_internals('TO MATCHED %o',matched)

    if(!matched || Object.getLength(matched) == 0){
      cb({})
    }
    else{
      let buffer_output = {}
      let count_matched = Object.keys(matched)
      debug_internals('COUNT_MATCHED %o', count_matched)


      Object.each(matched, function(data, path_name){
        let matched_chart_path = path_name.split('/')[0]
        let matched_chart_name = path_name.split('/')[1]

        // debug_internals('buffer_output %s %s',matched_chart_path, matched_chart_name)

        if(!data || Object.getLength(data) == 0){
          count_matched.erase(path_name)
          if(count_matched.length == 0)
            cb(buffer_output)
        }
        // else if(this.charts[host][matched_chart_path]){
        else if(this.charts[host]){
          let matched_chart_path_data = undefined
          if(this.charts[host][matched_chart_path]){
            matched_chart_path_data = this.charts[host][matched_chart_path]
          }
          else{
            Object.each(this.charts[host], function(host_chart_data, host_chart_path){
              try{
                let rg = eval(host_chart_path)
                if(rg.test(matched_chart_path)){
                  if(!matched_chart_path_data) matched_chart_path_data = {}
                  matched_chart_path_data[matched_chart_name] = Object.clone(host_chart_data)
                  this.charts[host][matched_chart_path] = Object.clone(host_chart_data)
                }
              }
              catch(e){}
            })
          }




          let chart_data = undefined
          if(matched_chart_path_data[matched_chart_name]){
            chart_data = matched_chart_path_data[matched_chart_name]
          }
          else{
            matched_chart_name = undefined
            chart_data = matched_chart_path_data
          }

          // debug_internals('matched_chart %s %s %o',matched_chart_path, matched_chart_name, chart_data)

          let no_stat_matched_name = false
          if(chart_data.matched_name !== true)
            no_stat_matched_name = true

          if(no_stat_matched_name == false && !this.__charts_instances[host][matched_chart_path][matched_chart_name])
            this.__charts_instances[host][matched_chart_path][matched_chart_name] = {}

          let count_data = Object.keys(data)
          debug_internals('COUNT_DATA %o', count_data)

          Object.each(data, function(stat, stat_matched_name){
            // count_data.erase(stat_matched_name)

            // //console.log('MATCHED', path_name, stat_matched_name, stat)
            // debug_internals('stat_matched_name %s %s %s',matched_chart_path, matched_chart_name, stat_matched_name)

            if(!buffer_output[matched_chart_path]) buffer_output[matched_chart_path] = {}

            /**
            * create an instance for each stat, ex: blockdevices_sda....blockdevices_sdX
            **/
            let instance = undefined
            if(!matched_chart_name){

              if(no_stat_matched_name && !this.__charts_instances[host][matched_chart_path]){
                this.__charts_instances[host][matched_chart_path] = Object.clone(chart_data.chart)
                this.__charts_instances[host][matched_chart_path].name = matched_chart_path
                this.__charts_instances[host][matched_chart_path].path = matched_chart_path
              }
              else if(!this.__charts_instances[host][matched_chart_path][stat_matched_name]){
                this.__charts_instances[host][matched_chart_path][stat_matched_name] = Object.clone(chart_data.chart)
                this.__charts_instances[host][matched_chart_path][stat_matched_name].name = stat_matched_name
                this.__charts_instances[host][matched_chart_path][stat_matched_name].path = matched_chart_path
              }

              // if(!buffer_output[matched_chart_path][stat_matched_name])
              //   buffer_output[matched_chart_path][stat_matched_name] = {}
              if(no_stat_matched_name){
                instance = this.__charts_instances[host][matched_chart_path]
              }
              else{
                instance = this.__charts_instances[host][matched_chart_path][stat_matched_name]
              }


            }
            else{

              if(no_stat_matched_name == true && !this.__charts_instances[host][matched_chart_path][matched_chart_name]){

                this.__charts_instances[host][matched_chart_path][matched_chart_name] = Object.clone(chart_data.chart)
                this.__charts_instances[host][matched_chart_path][matched_chart_name].name = matched_chart_name
                this.__charts_instances[host][matched_chart_path][matched_chart_name].path = matched_chart_path
              }
              else if(!this.__charts_instances[host][matched_chart_path][matched_chart_name][stat_matched_name]){

                this.__charts_instances[host][matched_chart_path][matched_chart_name][stat_matched_name] = Object.clone(chart_data.chart)
                this.__charts_instances[host][matched_chart_path][matched_chart_name][stat_matched_name].name = stat_matched_name
                this.__charts_instances[host][matched_chart_path][matched_chart_name][stat_matched_name].path = matched_chart_path+'.'+matched_chart_name
              }



              if(!buffer_output[matched_chart_path][matched_chart_name])
                buffer_output[matched_chart_path][matched_chart_name] = {}

              // if(!buffer_output[matched_chart_path][matched_chart_name])
              //   buffer_output[matched_chart_path][matched_chart_name] = {}

              if(no_stat_matched_name == true){
                instance = this.__charts_instances[host][matched_chart_path][matched_chart_name]
              }
              else{
                instance = this.__charts_instances[host][matched_chart_path][matched_chart_name][stat_matched_name]
              }


            }


            // this.__process_stat(chart, name, stat)
            if(stat){

              // let __name = (matched_name == true ) ? stat_matched_name : key


              // data_to_tabular(stat, chart, name, function(name, data){
             // //console.log('BEFORE data_to_tabular',__name, key, name, chart_name, stat_matched_name)
              if(cache == true && this.__stats_tabular[host]){
                // //console.log(this.__stats_tabular[host])
                if(!matched_chart_name){
                  buffer_output[matched_chart_path] = this.__stats_tabular[host].data[matched_chart_path]
                }
                else{
                  buffer_output[matched_chart_path][matched_chart_name] = this.__stats_tabular[host].data[matched_chart_path][matched_chart_name]
                }
                count_data.erase(stat_matched_name)
                if(count_data.length == 0){
                  count_matched.erase(path_name)
                  if(count_matched.length == 0)
                    cb(buffer_output)
                }
              }
              else{


                data_to_tabular(
                  stat,
                  instance,
                  (no_stat_matched_name) ? matched_chart_name : stat_matched_name,
                  function(name, to_buffer){
                    if(!matched_chart_name && no_stat_matched_name){
                      buffer_output[matched_chart_path] = to_buffer
                    }
                    else if(!matched_chart_name){
                      buffer_output[matched_chart_path][name] = to_buffer
                    }
                    else if(matched_chart_name && no_stat_matched_name) {
                      buffer_output[matched_chart_path][matched_chart_name] = to_buffer
                    }
                    else if(matched_chart_name) {
                      buffer_output[matched_chart_path][matched_chart_name][name] = to_buffer
                    }


                    count_data.erase(stat_matched_name)

                    debug_internals('stat_matched_name %s %s %d %d %s', matched_chart_name, stat_matched_name, count_data.length, count_matched.length, path_name)

                    if(count_data.length == 0){
                      count_matched.erase(path_name)
                      if(count_matched.length == 0){
                        debug_internals('buffer_output %o',buffer_output)
                        cb(buffer_output)
                      }
                    }

                  }
                )
              }


            }
            else{

              delete buffer_output[matched_chart_path]//remove if no stats, so we don't get empty keys
              count_data.erase(stat_matched_name)

              debug_internals('stat_matched_name %s %s %d %d %s', matched_chart_name, stat_matched_name, count_data.length, count_matched.length, path_name)

              if(count_data.length == 0){
                count_matched.erase(path_name)
                if(count_matched.length == 0){
                  debug_internals('buffer_output %o',buffer_output)
                  cb(buffer_output)
                }
              }

            }




            // counter++
          }.bind(this))
          // //console.log('INSTANCES', this.__charts_instances)


        }
        // else{
        //   cb({})
        // }

        // count_matched.erase(path_name)

      }.bind(this))
    }
  },
  __get_stats: function(payload, cb){
    debug_internals('__get_stats %o', payload)

    let {host, pipeline, path, range, req_id} = payload
    let chartsProcessedEventName = (req_id) ? 'chartsProcessed.'+req_id : 'chartsProcessed'
    let statsProcessedEventName = (req_id) ? 'statsProcessed.'+req_id : 'statsProcessed'

    //console.log('__get_stats', req_id)

    let save_stats = function (payload){
      let {id, type, doc} = payload
      if(!id || id == undefined || id == req_id){
        // //console.log('2 __get_stats', id)
        // let { type, input, input_type, app } = opts
        debug_internals('__get_stats->save_stats %o', payload)

        if(type == 'once' || type == 'range'){
          //console.log('2 __get_stats', id)
          // if(type == 'range')

          if(doc.length == 0){
            ////console.log('save_stats', payload)

            // this.__stats[host] = {data: {}, lastupdate: 0}
            // this.__stats_tabular[host] = {data: {}, lastupdate: 0}
            this.charts[host] = {}
            pipeline.removeEvent('onSaveDoc', save_stats)
            // this.fireEvent('chartsProcessed')

            this.fireEvent(statsProcessedEventName, {})
            this.fireEvent(chartsProcessedEventName)

          }
          else{
            this.__process_os_doc(payload.doc, function(stats){
              this.__process_stats_charts(host, stats, id)
            }.bind(this))

            /**
            * once we get the desire stats, remove event
            **/
            // if(matched){
            //   this.pipelines[host].pipeline.removeEvent('onSaveDoc', save_stats)
            //   // this.pipelines[host].pipeline.removeEvent('onSaveMultipleDocs', save_stats)
            // }
            pipeline.removeEvent('onSaveDoc', save_stats)
            // pipeline.removeEvent('onSaveMultipleDocs', save_stats)
          }

        }

        if(typeof cb == 'function')
          cb(payload)

      }
    }.bind(this)

    /**
    * onSaveDoc is exec when the input fires 'onPeriodicalDoc'
    * so capture the output once (and for one host, as all stats are the same)
    */
    pipeline.addEvent('onSaveDoc', save_stats)
    // this.pipelines[host].pipeline.addEvent('onSaveMultipleDocs', save_stats)
    if(range){
      pipeline.fireEvent('onRange', { id: req_id, Range: range, path: path })
    }
    else{
      pipeline.fireEvent('onOnce', { id: req_id, path: path})
    }

  },
  __process_stats_charts: function(host, stats, id){
    // this.__stats[host] = {data: stats, lastupdate: Date.now()}
    let chartsProcessedEventName = (id) ? 'chartsProcessed.'+id : 'chartsProcessed'
    let statsProcessedEventName = (id) ? 'statsProcessed.'+id : 'statsProcessed'

    if(!this.charts[host] || Object.getLength(this.charts[host]) == 0)
      this.charts[host] = Object.clone(this.__charts)

    let count_paths = Object.keys(this.charts[host])
    let matched = undefined

    Object.each(this.charts[host], function(data, path){
        let charts = {}
        if(data.chart){
          charts[path] = data
        }
        else{
          charts = data
        }

        // let count_charts = Object.keys(charts)
        if(Object.getLength(charts) > 0){
          Object.each(charts, function(chart_data, chart_name){
            let {match, chart} = chart_data
            // if(!match){
            //   match = path
            // }
            // else{
            //   match = path+'.'+match
            // }

            matched = this.__match_stats_name(stats, path, match)
            debug_internals('MATCHED %o', matched)

            if(matched){
              let count_matched = Object.keys(matched)
              Object.each(matched, function(stat, match){
                this.__process_stat(chart, match, stat)

                count_matched.erase(match)

                if(count_matched.length == 0){
                  count_paths.erase(path)
                  if(count_paths.length == 0)
                    this.fireEvent(chartsProcessedEventName)
                }



              }.bind(this))
            }
            else{
              count_paths.erase(path)
              if(count_paths.length == 0)
                this.fireEvent(chartsProcessedEventName)
            }
            // count_charts.erase(chart_name)
            // if(count_paths.length == 0 && count_charts.length == 0)
            //   this.fireEvent('chartsProcessed')


            // //console.log(path, chart_name)

          }.bind(this))
        }
        else{
          count_paths.erase(path)
          if(count_paths.length == 0)
            this.fireEvent(chartsProcessedEventName)
        }




    }.bind(this))


    this.fireEvent(statsProcessedEventName, stats)


  },
  __get_pipeline: function(host, id, cb){
    //console.log('__get_pipeline', host)
    // let _resume = undefined
    // let _connect = undefined

    if(!this.pipelines[host]){
      // let template = Object.clone(this.HostOSPipeline)
      if(!this.charts[host])
        this.charts[host] = {}

      let template = require('./pipelines/host.os')(
        // require(ETC+'default.conn.js')(this.options.redis),//couchdb
  			require(ETC+'default.conn.js')(),//rethinkdb
        this.io,
        this.charts[host]
      )
      template.input[0].poll.conn[0].stat_host = host
      template.input[0].poll.id += '-'+host
      template.input[0].poll.conn[0].id = template.input[0].poll.id
      let pipeline = new Pipeline(template)
      this.pipelines[host] = {
        pipeline: pipeline,
        ids: [],
        connected: false,
        suspended: pipeline.inputs[0].options.suspended
      }

      this.pipelines[host].pipeline.addEvent('onSaveDoc', function(stats){
        this.__emit_stats(host, stats)
      }.bind(this))

      // let _connect = function(){
      //   this.pipelines[host].pipeline.inputs[0].options.conn[0].module.removeEvent('onConnect', _connect)
      //   debug_internals('CONECTING....')
      //
      //   this.pipelines[host].connected = true
      //
      //   cb(this.pipelines[host])
      //   _resume()
      // }.bind(this)

      if(this.pipelines[host].connected == false){
        this.pipelines[host].pipeline.inputs[0].options.conn[0].module.addEvent('onConnect', () => this.__after_connect_pipeline(
          this.pipelines[host],
          id,
          cb
        ))
      }
      else{
        // if(id)
        this.__resume_pipeline(this.pipelines[host], id)

        cb(this.pipelines[host])
      }


    }
    // else{
    //   cb(this.pipelines[host])
    //
    //   if(this.pipelines[host].connected == true){
    //     _resume()
    //   }
    //
    //
    // }
    else{
      if(this.pipelines[host].connected == false){
        this.pipelines[host].pipeline.inputs[0].options.conn[0].module.addEvent('onConnect', () => this.__after_connect_pipeline(
          this.pipelines[host],
          id,
          cb
        ))
      }
      else{
        // if(id)

        cb(this.pipelines[host])

        this.__resume_pipeline(this.pipelines[host], id)
      }
    }















    // if(id){
    //   if(!this.pipelines[host].ids.contains(id))
    //     this.pipelines[host].ids.push(id)
    //
    //   if(this.pipelines[host].pipeline.inputs[0].options.suspended == true){
    //     // //console.log('RESUMING....')
    //     this.pipelines[host].pipeline.inputs[0].conn.addEvent('onConnect', function(){
    //       // this.pipelines[host].pipeline.fireEvent('onResume')
    //       debug_internals('RESUMING....')
    //       console.log('RESUMING....')
    //     })
    //     // this.pipelines[host].pipeline.fireEvent('onResume')
    //
    //   }
    // }

    // return this.pipelines[host]
  },
  __after_connect_pipeline: function(pipeline, id, cb){
    pipeline.pipeline.inputs[0].options.conn[0].module.removeEvents('onConnect')
    debug_internals('CONECTING....')

    pipeline.connected = true

    cb(pipeline)

    this.__resume_pipeline(pipeline, id)



  },
  __resume_pipeline: function(pipeline, id){
    if(id){
      if(!pipeline.ids.contains(id))
        pipeline.ids.push(id)

      if(pipeline.suspended == true){
        debug_internals('RESUMING....')
        pipeline.suspended = false
        pipeline.pipeline.fireEvent('onResume')

      }
    }
  },
  __match_stats_name: function(stats, path, match){
    // //console.log('__match_stats_name', name, stats)
    let stat = undefined
    if(stats){
      try{
        let rg = eval(path)
        // if(name instanceof RegExp)
        //   debug_internals('__match_stats_name regexp %o', eval(name))
        if(rg instanceof RegExp){
          stat = {}
          // debug_internals('__match_stats_name regexp %o %o', name, stats)
          let counter = Object.getLength(stats) - 1
          Object.each(stats, function(data, key){
            if(rg.test(key)){
              // debug_internals('__match_stats_name regexp %s', key)
              // stat[key] = this.__match_stats_name(stats, key, match)
              stat = Object.merge(stat, this.__match_stats_name(stats, key, match))
            }

            // if(counter == 0){
            //   debug_internals('__match_stats_name regexp stat %o', stat)
            //   return stat
            // }

            counter--
          }.bind(this))



        }
        // else{
          debug_internals('__match_stats_name regexp stat %o', stat)
        return stat
        // }

      }
      catch(e){
        let name = path

        if(match)
         name += '.'+match

        debug_internals('__match_stats_name error %s', name)
        if(name.indexOf('.') > -1){
          let key = name.split('.')[0]
          let rest = name.substring(name.indexOf('.')+1)
          // //////console.log('__match_stats_name', stats, name)

          let parse_data = function(stat_data, stat_name){
            let matched = this.__match_stats_name(stat_data, rest)


            // if(name == '%s.%s.%s' ){
            //   ////console.log('__match_stats_name', name, stat_data, matched)
            // }
            // if(rest.indexOf('%s') > -1)
            //   ////console.log('__match_stats_name', name, stats, matched)

            stat = {}
            if(matched){
              if(Array.isArray(matched)){
                Array.each(matched, function(data, index){
                  stat[stat_name+'_'+index] = data
                })
              }
              else{

                // result = {}
                // if(key == '%s'){
                //   Object.each(matched, function(data, name){
                // 		stat[key+'_'+name] = data
                // 	})
                // }
                // else{
                  Object.each(matched, function(data, name){
                    stat[name] = data
                  })
                // }
              }

              // if(name == 'os.networkInterfaces.0.value.%s.%s.%s' ){
              //   ////console.log('__match_stats_name', name)
              //   // ////console.log(stat_data)
              //   ////console.log(stat)
              // }

              return stat
            }
            else{
              return undefined
            }
          }.bind(this)

          if(key.indexOf('%') > -1){
            stat = {}
            Object.each(stats, function(stat_data, stat_name){
              stat[stat_name] = parse_data(stat_data, stat_name)
              // ////console.log('parsing....',stat)

            })

            return stat
          }
          else{
            // ////console.log('parsing....',parse_data(stats[key], key))
            return parse_data(stats[key], key)
          }

          // let matched = this.__match_stats_name(stats[key], rest)
          //
          // if(name == '%s.%s.%s' ){
          //   ////console.log('__match_stats_name', name, stats, matched)
          // }
          // // if(rest.indexOf('%s') > -1)
          // //   ////console.log('__match_stats_name', name, stats, matched)
          //
          // if(matched){
          // 	if(Array.isArray(matched)){
          // 		Array.each(matched, function(data, index){
          // 			stat[key+'_'+index] = data
          // 		})
          // 	}
          // 	else{
          //
          // 		// result = {}
          //     // if(key == '%s'){
          //     //   Object.each(matched, function(data, name){
          // 		// 		stat[key+'_'+name] = data
          // 		// 	})
          //     // }
          //     // else{
          // 			Object.each(matched, function(data, name){
          // 				stat[key+'_'+name] = data
          // 			})
          //     // }
          // 	}
          //
          // 	return stat
          // }
          // else{
          //   return undefined
          // }
        }
        else{
          if(name == '%d'){//we want one stat per index
            // name = name.replace('%d')
            stat = []
            Array.each(stats, function(data, index){
              stat[index] = data
            })
          }
          else if(name == '%s'){//we want one stat per key
            stat = {}
            // name = name.replace('.%s')
            // //////console.log()
            // if(name == '%s')
            //   ////console.log('stats', stats)

            Object.each(stats, function(data, key){
              stat[key] = data
            })
          }
          else{
            stat = {}
            stat[name] = stats[name]
          }

          return stat
        }
      }


    }
    else{
      return undefined
    }


  },
  // __match_stats_name: function(stats, name){
  // 	let stat = {}
  // 	if(stats){
  // 		if(name.indexOf('.') > -1){
  // 			let key = name.split('.')[0]
  // 			let rest = name.substring(name.indexOf('.')+1)
  // 			// //////console.log('__match_stats_name', stats, name)
  // 			let matched = this.__match_stats_name(stats[key], rest)
  // 			// let result = undefined
  // 			if(matched){
  // 				if(Array.isArray(matched)){
  // 					Array.each(matched, function(data, index){
  // 						stat[key+'_'+index] = data
  // 					})
  // 				}
  // 				else{
  // 					// result = {}
  // 					Object.each(matched, function(data, name){
  // 						stat[key+'_'+name] = data
  // 					})
  // 				}
  //
  // 				return stat
  // 			}
  // 			else{
  // 				return undefined
  // 			}
  // 		}
  // 		else{
  // 			if(name == '%d'){//we want one stat per index
  // 				// name = name.replace('%d')
  // 				stat = []
  // 				Array.each(stats, function(data, index){
  // 					stat[index] = data
  // 				})
  // 			}
  // 			else if(name == '%s'){//we want one stat per key
  // 				// name = name.replace('.%s')
  // 				// //////console.log()
  // 				Object.each(stats, function(data, key){
  // 					stat[key] = data
  // 				})
  // 			}
  // 			else{
  // 				stat[name] = stats[name]
  // 			}
  //
  // 			return stat
  // 		}
  //
  // 	}
  // 	else{
  // 		return undefined
  // 	}
  //
  //
  // },
  /**
  * from mngr-ui-admin-lte/chart.vue
  **/
  __process_chart (chart, name, stat){
    //////console.log('data_to_tabular', name, stat)

    if(chart.init && typeOf(chart.init) == 'function')
      chart.init(this, chart, name, stat, 'chart')

    /**
    * first update
    **/
    // if(this.stat.data.length > 0){
    //
    //   data_to_tabular(stat, chart, name, function (name, data){
    //     //////console.log('data_to_tabular result', name, data)
    //   })
    // }
    //
    // this.__create_watcher(name, chart)

  },
  /**
  * from mngr-ui-admin-lte/chart.vue
  **/
  __process_stat: function(chart, name, stat){
    // console.log('__process_stat', chart, name, stat)
    if(!Array.isArray(stat))
      stat = [stat]


    // if(Array.isArray(stat[0].value)){//like 'cpus'
    //
    //   this.__process_chart(
    //     chart.pre_process(chart, name, stat),
    //     name,
    //     stat
    //   )
    //
    // }
    // else
    if(isNaN(stat[0].value)){
      //sdX.stats.

      let filtered = false
      if(chart.watch && chart.watch.filters){
        Array.each(chart.watch.filters, function(filter){
          let prop_to_filter = Object.keys(filter)[0]
          let value_to_filter = filter[prop_to_filter]

          // //////console.log('stat[0].value[prop_to_filter]', name, stat)
          if(
            stat[0].value[prop_to_filter]
            && value_to_filter.test(stat[0].value[prop_to_filter]) == true
          ){
            filtered = true
          }

        })
      }
      else{
        filtered = true
      }

      if(filtered == true){

        chart = chart.pre_process(chart, name, stat)

        // chart.label = this.__process_chart_label(chart, name, stat) || name
        // let chart_name = this.__process_chart_name(chart, stat) || name

        this.__process_chart(chart, name, stat)
      }

    }
    else{

      // chart.label = this.__process_chart_label(chart, name, stat) || name
      // let chart_name = this.__process_chart_name(chart, stat) || name
      chart = chart.pre_process(chart, name, stat)

      this.__process_chart(
        chart,
        name,
        stat
      )
    }

    return chart
  },
  /**
  * from mngr-ui-admin-lte/host.vue
  **/
  __process_os_doc: function(doc, cb){
    //console.log('__process_os_doc', doc)

    let paths = {}

    if(Array.isArray(doc)){
      Array.each(doc, function(row){

        // if(row != null && row.metadata.host == this.host){
        if(row != null){
          let {keys, path, host} = extract_data_os(row)

          // //////console.log('ROW', keys, path)

          if(!paths[path])
            paths[path] = {}


          Object.each(keys, function(data, key){
            // ////////console.log('ROW', key, data)
            if(!paths[path][key])
              paths[path][key] = []

            paths[path][key].push(data)
          })
        }
      })
    }
    else if(doc.metadata.host == this.host){
      let {keys, path, host} = extract_data_os(doc)
      if(!paths[path])
        paths[path] = {}

      paths[path] = keys
    }

    cb(paths)


  },

});
