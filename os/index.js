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

module.exports = new Class({
  Extends: App,

  HostOSPipeline: undefined,
  pipelines: {},
  __stats: {},
  charts:{},
  __charts_instances:{},

  __charts: {
    uptime: { name: 'os.uptime', chart: uptime_chart },
    loadavg: { name: 'os.loadavg', chart: loadavg_chart},
    cpus_times: { name: 'os.cpus', chart: cpus_times_chart},
    cpus_percentage : { name: 'os.cpus', chart: cpus_percentage_chart},
    // freemem : { name: 'os.freemem', chart: freemem_chart},
    // networkInterfaces : { name: 'os.networkInterfaces', chart: networkInterfaces_chart},
    networkInterfaces_stats : { name: 'os_networkInterfaces_stats.%s', chart: networkInterfaces_stats_chart},
    // mounts_percentage : [
    //   { name: 'os_mounts.0', chart: Object.clone(mounts_percentage_chart)},
    //   { name: 'os_mounts.1', chart: Object.clone(mounts_percentage_chart)},
    // ],
    mounts_percentage : { name: 'os_mounts.%s', chart: mounts_percentage_chart},
    // blockdevices_names : [
    //   { name: 'os_blockdevices.sda', chart: Object.clone(blockdevices_stats_chart)},
    // ]
    blockdevices_stats : { name: 'os_blockdevices.%s', chart: blockdevices_stats_chart},

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
        stats: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['stats'],
					// middlewares: [], //socket.use(fn)
				}],
        // range: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['range'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
        // periodical: [{
				// 	// path: ':param',
				// 	// once: true, //socket.once
				// 	callbacks: ['periodical'],
				// 	// middlewares: [], //socket.use(fn)
				// }],
			// 	// '*': [{// catch all
			// 	// 	path: '',
			// 	// 	callbacks: ['not_found_message'],
			// 	// 	middlewares: [], //socket.use(fn)
			// 	// }]
			}
		}
	},


  /**
  *
  **/
  // charts: function(socket, next){
  //   let {host} = arguments[2]
  //
  //   socket.emit('charts', {
  //     host: host,
  //     charts: this.__charts
  //   })
  //
	// },

  // range: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['range'])
  //   let {host, path, range} = params
  //
	// 	// ////console.log('range...', host, range, path)
	// 	let pipeline = this.__get_pipeline(host)
  //   // pipelines.input[0].options.range_path = path
  //   // ////console.log(pipeline.inputs[0])
  //   pipeline.fireEvent('onRange',{ Range: range.type+' '+ range.start +'-'+ range.end +'/*', path: path })
  //
	// },
  // periodical: function(socket, next){
  //   let {host} = arguments[2]
  //
	// 	let pipeline = this.__get_pipeline(host, socket.id)
  //
  //   if(pipeline.inputs[0].options.suspended == true){
  //     pipeline.fireEvent('onResume')
  //     // pipeline.fireEvent('onSuspend')
  //   }
  //
  //   // ////console.log('periodical', pipeline.inputs[0])
  //   // pipeline.fireEvent('onResume')
  //
	// },
  stats: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'stat'])
    let {host, stat} = params
    let query = (req) ? req.query : { format: params.format }
    let range = (req) ? req.header('range') : params.range
    let type = (range) ? 'range' : 'periodical'

    // console.log('ARGUMENTS', arguments)
    console.log('PARAMS', params)
    console.log('QUERY', query)
    console.log('REQ', range)

    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_stats = function(payload){
        // let {stats, doc} = payload
        let stats = this.__stats[host]

        if(stat){//one stat only
          stats = this.__find_stat(stat, stats)
        }

        // console.log('send_stats', stats)

        if(stats && Object.getLength(stats) == 0){
          if(resp){
            resp.status(404).json({host: host, type: type, err: 'not found'})
          }
          else{
            socket.binary(false).emit('stats', {host: host, type: type, err: 'not found'})
          }
        }
        else{
          if(query && query.format == 'tabular'){

            this.__process_tabular(host, stats, function(output){
              //console.log('send_tabular', output)
              if(resp){
                resp.json({host: host, status: 'ok', type: type, stats: output, tabular: true})
              }
              else{
                socket.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: output, tabular: true})
              }
            })



          }
          else{
            if(resp){
              resp.json({host: host, status: 'ok', type: type, stats: stats})
            }
            else{
              socket.binary(false).emit('stats', {host: host, status: 'ok', type: type, stats: stats})
            }
          }

          // if(this.options.redis){
            // delete this.__stats[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('statsProcessed', send_stats)
      }.bind(this)

      this.addEvent('statsProcessed', send_stats)


      let path = undefined
      if(stat){
        path = (stat.indexOf('.') > -1) ? stat.substring(0, stat.indexOf('.')).replace(/_/g, '.') : stat.replace(/_/g, '.')
      }

      let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
      this.__process_stats({
        host: host,
        pipeline: pipeline,
        path: path,
        range: range
      })
    }
  },
  charts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host', 'chart'])
    let {host, chart} = params
    // //console.log('host...', params, host, this.__stats[host])
    // let host = arguments[2]
    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_charts = function(){
        let charts = {}
        if(chart && this.charts[host]){
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

        this.removeEvent('chartsProcessed', send_charts)
      }.bind(this)

      if(this.charts[host] && Object.getLength(this.charts[host]) > 0){//stats processed already
        // //console.log('this.__stats[host]', this.__stats[host])
        send_charts()
      }
      else{
        this.addEvent('chartsProcessed', send_charts)
        let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
        this.__process_stats({
          host:host,
          pipeline:pipeline
        })
      }


    }


	},
	// hosts: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
  //   let {host} = params
  //   // //console.log('host...', params, host, this.__stats[host])
  //   // let host = arguments[2]
  //   if(host === null || host === undefined){
  //     this.__no_host(req, resp, socket, next, params)
  //   }
  //   else{
  //
  //     let send_charts = function(){
  //       if(this.__stats[host] && Object.getLength(this.__stats[host]) == 0){
  //         if(resp){
  //           resp.status(404).json({host: host, err: 'not found'})
  //         }
  //         else{
  //           socket.binary(false).emit('hosts', {host: host, err: 'not found'})
  //         }
  //       }
  //       else{
  //         if(resp){
  //           resp.json({host: host, status: 'ok', charts: this.charts[host]})
  //         }
  //         else{
  //           socket.binary(false).emit('hosts', {host: host, status: 'ok', charts: this.charts[host]})
  //         }
  //
  //         // if(this.options.redis){
  //           // delete this.__stats[host]
  //           // delete this.charts[host]
  //         // }
  //       }
  //
  //       this.removeEvent('statsProcessed', send_charts)
  //     }.bind(this)
  //
  //     if(this.__stats[host] && Object.getLength(this.__stats[host]) > 0){//stats processed already
  //       // //console.log('this.__stats[host]', this.__stats[host])
  //       send_charts()
  //     }
  //     else{
  //
  //
  //       this.addEvent('statsProcessed', send_charts)
  //     }
  //
  //     let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
  //   }
  //
  //
	// },

	initialize: function(options){
    this.parent(options)

		this.profile('os_init');//start profiling

    // this.addEvent('onSaveDoc', this._emit_stats)

    this.profile('os_init');//end profiling

		this.log('os', 'info', 'os started');
  },
  socket: function(socket){
		this.parent(socket)

		socket.on('disconnect', function () {

      //console.log('disconnect this.io.namespace.connected', this.io.connected)


      Object.each(this.pipelines, function(pipe){
        if(pipe.ids.contains(socket.id)){
          pipe.ids.erase(socket.id)
          pipe.ids = pipe.ids.clean()
        }

        //console.log('suspending...', pipe.ids, pipe.ids.length)

        if(pipe.ids.length == 0){
          //console.log('suspending...', pipe.ids)
          pipe.pipeline.fireEvent('onSuspend')
        }

      }.bind(this))
			// if(Object.keys(this.io.connected).length == 0)
				// this.pipeline.fireEvent('onSuspend')


		}.bind(this));
	},
  _emit_stats: function(stats){
		console.log('broadcast stats...', stats)
		// socket.emit('app.doc', Object.values(this.docs))
		this.io.binary(false).volatile.emit('stats', stats)
	},
  _arguments: function(args, defined_params){
		let req, resp, next, socket = undefined
    // //console.log(typeof args[0])
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
      // //console.log('socket', args)
      let isObject = (args[2] !== null && typeof args[2] === 'object' && isNaN(args[2]) && !Array.isArray(args[2])) ? true: false
      console.log('isObject',isObject)

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
      // console.log('REST', key, rest)
      result[key] = this.__find_stat(rest, stats[key])
    }
    else if(stats){
      result[stat] = stats[stat]
    }

    return result
  },
  __process_tabular(host, stats, cb){
    let charts = this.charts[host]

    if(!this.__charts_instances[host])
      this.__charts_instances[host] = {}

    let matched = undefined
    Object.each(charts, function(data, key){
      let {name, chart} = data

      if(!matched)
        matched = {}

      /**
      * we will create an instance for each one, as charts like "blockdevices"
      * hace static properties like "prev", and you may have multiple devices overriding it
      **/
      // if(!data['_instances']) data['_instances'] = {}
      if(!this.__charts_instances[host][key])
        this.__charts_instances[host][key] = {}

      matched[key+'/'+name] = this.__match_stats_name(stats, name)


    }.bind(this))

    if(!matched || Object.getLength(matched) == 0){
      cb({})
    }
    else{
      let buffer_output = {}
      let count_matched = Object.keys(matched)
      // Object.each(charts, function(data, key){
      Object.each(matched, function(data, key_name){
        let key = key_name.split('/')[0]
        let chart_name = key_name.split('/')[1]
        // Object.each(data, function(value, name){
        let {name, chart} = charts[key]

        // //console.log('MATCHED', key_name, data, key, chart_name, name, charts[key])



        if(!data || Object.getLength(data) == 0){
          count_matched.erase(key_name)
          if(count_matched.length == 0)
            cb(buffer_output)
        }
        else{

          let count_data = Object.keys(data)
          Object.each(data, function(stat, matched_name){
            // //console.log('MATCHED', key_name, matched_name, stat)
            /**
            * create an instance for each stat, ex: blockdevices_sda....blockdevices_sdX
            **/
            // if(!data['_instances'][name])
            // 	data['_instances'][name] = Object.clone(chart)
            if(!this.__charts_instances[host][key][matched_name])
              this.__charts_instances[host][key][matched_name] = Object.clone(chart)

            // this.__process_stat(chart, name, stat)
            if(stat){
              if(!buffer_output[key]) buffer_output[key] = {}

              // data_to_tabular(stat, chart, name, function(name, data){
              data_to_tabular(
                stat,
                this.__charts_instances[host][key][matched_name],
                matched_name,
                function(matched_name, to_buffer){
                  buffer_output[key][matched_name] = to_buffer
                  // //console.log('TO BUFFER',to_buffer)
                  count_data.erase(matched_name)
                  if(count_data.length == 0){
                    count_matched.erase(key_name)
                    if(count_matched.length == 0)
                      cb(buffer_output)
                  }

                }
              )
            }
            else{
              count_data.erase(matched_name)
              if(count_data.length == 0){
                count_matched.erase(key_name)
                if(count_matched.length == 0)
                  cb(buffer_output)
              }

            }




            // counter++
          }.bind(this))

        }



      }.bind(this))
    }
  },
  __process_stats: function(payload){
    let {host, pipeline, path, range} = payload
    console.log('__process_stats', payload)

    let save_stats = function (payload){
      let {type, doc} = payload
      // let { type, input, input_type, app } = opts

      if(type == 'periodical'){
        let matched = undefined


        if(doc.length == 0){
          //console.log('save_stats', payload)

          this.__stats[host] = {}
          this.charts[host] = {}
          pipeline.removeEvent('onSaveDoc', save_stats)
          this.fireEvent('statsProcessed')
          this.fireEvent('chartsProcessed')
        }
        else{
          this.__process_os_doc(payload.doc, function(stats){
            this.__stats[host] = stats
            this.charts[host] = Object.clone(this.__charts)
            let count_charts = Object.keys(this.charts[host])
            Object.each(this.charts[host], function(data, key){

                // if(stats.os && stats.os.networkInterfaces)
                  ////console.log('MATCHED', stats.os.networkInterfaces[0].value.lo)

                let {name, chart} = data
                matched = this.__match_stats_name(stats, name)

                // //console.log('MATCHED', name, matched)
                // if(Array.isArray(matched)){
                //   Array.each(matched, function(data){
                //     this.__process_stat(chart, data.name, data.stat)
                //   }.bind(this))
                // }
                // else{
                if(matched)
                  Object.each(matched, function(stat, name){
                    this.__process_stat(chart, name, stat)
                  }.bind(this))

                count_charts.erase(key)
                if(count_charts.length == 0)
                  this.fireEvent('chartsProcessed')


                // }
              // }



            }.bind(this))

            this.fireEvent('statsProcessed')
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
    }.bind(this)

    /**
    * onSaveDoc is exec when the input fires 'onPeriodicalDoc'
    * so capture the output once (and for one host, as all stats are the same)
    */
    pipeline.addEvent('onSaveDoc', save_stats)
    // this.pipelines[host].pipeline.addEvent('onSaveMultipleDocs', save_stats)
    if(range){
      pipeline.fireEvent('onRange', { Range: range, path: path })
    }
    else{
      pipeline.fireEvent('onOnce', {path: path})
    }

  },
  __get_pipeline: function(host, id){
    console.log('__get_pipeline', host)

    if(!this.pipelines[host]){
      // let template = Object.clone(this.HostOSPipeline)
      if(!this.charts[host])
        this.charts[host] = {}

      let template = require('./pipelines/host.os')(
        require(ETC+'default.conn.js')(this.options.redis),
        this.io,
        this.charts[host]
      )
      template.input[0].poll.conn[0].stat_host = host
      template.input[0].poll.id += '-'+host
      template.input[0].poll.conn[0].id = template.input[0].poll.id
      this.pipelines[host] = {
        pipeline: new Pipeline(template),
        ids: []
      }


    }

    // //console.log('this.__stats[host]', this.__stats[host])
    // if(!this.__stats[host] || Object.getLength(this.__stats[host]) == 0){
    //   // ////console.log('save_stats')
    //   // ////console.log('CHARTS', this.__charts['uptime'].name)
    //   let save_stats = function (payload){
    //     let {type, doc} = payload
    //     // let { type, input, input_type, app } = opts
    //
    //     if(type == 'periodical'){
    //       let matched = undefined
    //       // //console.log('save_stats', payload)
    //
    //       if(doc.length == 0){
    //         //console.log('save_stats', payload)
    //
    //         this.__stats[host] = {}
    //         this.charts[host] = {}
    //         this.pipelines[host].pipeline.removeEvent('onSaveDoc', save_stats)
    //         this.fireEvent('statsProcessed')
    //
    //       }
    //       else{
    //         this.__process_os_doc(payload.doc, function(stats){
    //           this.__stats[host] = stats
    //           this.charts[host] = Object.clone(this.__charts)
    //           Object.each(this.charts[host], function(data, key){
    //
    //               // if(stats.os && stats.os.networkInterfaces)
    //                 ////console.log('MATCHED', stats.os.networkInterfaces[0].value.lo)
    //
    //               let {name, chart} = data
    //               matched = this.__match_stats_name(stats, name)
    //
    //               // //console.log('MATCHED', name, matched)
    //               // if(Array.isArray(matched)){
    //               //   Array.each(matched, function(data){
    //               //     this.__process_stat(chart, data.name, data.stat)
    //               //   }.bind(this))
    //               // }
    //               // else{
    //               if(matched)
    //                 Object.each(matched, function(stat, name){
    //                   this.__process_stat(chart, name, stat)
    //                 }.bind(this))
    //
    //               // }
    //             // }
    //
    //
    //           }.bind(this))
    //
    //           this.fireEvent('statsProcessed')
    //         }.bind(this))
    //
    //
    //
    //         /**
    //         * once we get the desire stats, remove event
    //         **/
    //         // if(matched){
    //         //   this.pipelines[host].pipeline.removeEvent('onSaveDoc', save_stats)
    //         //   // this.pipelines[host].pipeline.removeEvent('onSaveMultipleDocs', save_stats)
    //         // }
    //       }
    //
    //     }
    //   }.bind(this)
    //   /**
    //   * onSaveDoc is exec when the input fires 'onPeriodicalDoc'
    //   * so capture the output once (and for one host, as all stats are the same)
    //   */
    //   //console.log('firing...', host)
    //   this.pipelines[host].pipeline.addEvent('onSaveDoc', save_stats)
    //   // this.pipelines[host].pipeline.addEvent('onSaveMultipleDocs', save_stats)
    //   this.pipelines[host].pipeline.fireEvent('onOnce')
    // }

    if(id){
      if(!this.pipelines[host].ids.contains(id))
        this.pipelines[host].ids.push(id)

      if(this.pipelines[host].pipeline.inputs[0].options.suspended == true){
        // console.log('RESUMING....')
        this.pipelines[host].pipeline.fireEvent('onResume')

      }
    }

    return this.pipelines[host].pipeline
  },
  __match_stats_name: function(stats, name){

    let stat = undefined
    if(stats){
      if(name.indexOf('.') > -1){
        let key = name.split('.')[0]
        let rest = name.substring(name.indexOf('.')+1)
        // ////console.log('__match_stats_name', stats, name)

        let parse_data = function(stat_data, stat_name){
          let matched = this.__match_stats_name(stat_data, rest)


          // if(name == '%s.%s.%s' ){
          //   //console.log('__match_stats_name', name, stat_data, matched)
          // }
          // if(rest.indexOf('%s') > -1)
          //   //console.log('__match_stats_name', name, stats, matched)

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
            //   //console.log('__match_stats_name', name)
            //   // //console.log(stat_data)
            //   //console.log(stat)
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
            // //console.log('parsing....',stat)

          })

          return stat
        }
        else{
          // //console.log('parsing....',parse_data(stats[key], key))
          return parse_data(stats[key], key)
        }

        // let matched = this.__match_stats_name(stats[key], rest)
        //
        // if(name == '%s.%s.%s' ){
        //   //console.log('__match_stats_name', name, stats, matched)
        // }
        // // if(rest.indexOf('%s') > -1)
        // //   //console.log('__match_stats_name', name, stats, matched)
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
          // ////console.log()
          // if(name == '%s')
          //   //console.log('stats', stats)

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
  // 			// ////console.log('__match_stats_name', stats, name)
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
  // 				// ////console.log()
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
    ////console.log('data_to_tabular', name, stat)

    if(chart.init && typeOf(chart.init) == 'function')
      chart.init(this, chart, name, stat, 'chart')

    /**
    * first update
    **/
    // if(this.stat.data.length > 0){
    //
    //   data_to_tabular(stat, chart, name, function (name, data){
    //     ////console.log('data_to_tabular result', name, data)
    //   })
    // }
    //
    // this.__create_watcher(name, chart)

  },
  /**
  * from mngr-ui-admin-lte/chart.vue
  **/
  __process_stat: function(chart, name, stat){
    ////console.log('__process_stat', chart, name, stat)
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

          // ////console.log('stat[0].value[prop_to_filter]', name, stat)
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

      this.__process_chart(
        chart.pre_process(chart, name, stat),
        name,
        stat
      )
    }

  },
  /**
  * from mngr-ui-admin-lte/host.vue
  **/
  __process_os_doc: function(doc, cb){

    let paths = {}

    if(Array.isArray(doc)){
      Array.each(doc, function(row){

        // if(row.doc != null && row.doc.metadata.host == this.host){
        if(row.doc != null){
          let {keys, path, host} = extract_data_os(row.doc)

          // ////console.log('ROW', keys, path)

          if(!paths[path])
            paths[path] = {}


          Object.each(keys, function(data, key){
            // //////console.log('ROW', key, data)
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
