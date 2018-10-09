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
  stats: {},
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
		},


    api: {
      // path: '/',
			routes: {
				get: [
					{
						path: 'hosts/:host?',
						callbacks: ['hosts'],
						version: '',
					},
          {
						path: 'stats/:host?',
						callbacks: ['stats'],
						version: '',
					},
          {
						path: 'data/:host?',
						callbacks: ['data'],
						version: '',
					},
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
				hosts: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['hosts'],
					// middlewares: [], //socket.use(fn)
				}],
        range: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['range'],
					// middlewares: [], //socket.use(fn)
				}],
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

  range: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['range'])
    let {host, path, range} = params

		// //console.log('range...', host, range, path)
		let pipeline = this.__get_pipeline(host)
    // pipelines.input[0].options.range_path = path
    // //console.log(pipeline.inputs[0])
    pipeline.fireEvent('onRange',{ Range: range.type+' '+ range.start +'-'+ range.end +'/*', path: path })

	},
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
  //   // //console.log('periodical', pipeline.inputs[0])
  //   // pipeline.fireEvent('onResume')
  //
	// },
  __no_host: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    if(resp){
      resp.status(500).json({error: 'no host param', status: 500})
    }
    else{
      socket.emit('host', {error: 'no host param', status: 500})
    }
  },
  data: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    let {host} = params

    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_data = function(){
        if(this.data[host] && Object.getLength(this.data[host]) == 0){
          if(resp){
            resp.status(404).json({host: host, err: 'not found'})
          }
          else{
            socket.binary(false).emit('data', {host: host, err: 'not found'})
          }
        }
        else{
          if(resp){
            resp.json({host: host, status: 'ok', data: this.data[host]})
          }
          else{
            socket.binary(false).emit('data', {host: host, status: 'ok', data: this.data[host]})
          }

          // if(this.options.redis){
            // delete this.data[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('statsProcessed', send_data)
      }.bind(this)

      this.addEvent('statsProcessed', send_data)

      let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
      this.__process_stats(host, pipeline)
    }
  },
  stats: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    let {host} = params
    let query = (req) ? req.query : { tabular: params.tabular }

    console.log('QUERY', query)

    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_stats = function(){
        let stats = this.stats[host]
        if(stats && Object.getLength(stats) == 0){
          if(resp){
            resp.status(404).json({host: host, err: 'not found'})
          }
          else{
            socket.binary(false).emit('stats', {host: host, err: 'not found'})
          }
        }
        else{
          if(query && query.format == 'tabular'){
            let charts = this.charts[host]

            if(!this.__charts_instances[host])
              this.__charts_instances[host] = {}

            let counter = 0
            let buffer_output = undefined
						Object.each(charts, function(data, key){

							let {name, chart} = data
							/**
							* we will create an instance for each one, as charts like "blockdevices"
							* hace static properties like "prev", and you may have multiple devices overriding it
							**/
							// if(!data['_instances']) data['_instances'] = {}
              if(!this.__charts_instances[host][key])
                this.__charts_instances[host][key] = {}

							let matched = this.__match_stats_name(stats, name)

							if(matched){

								// console.log('MATCHED', matched)

								if(!buffer_output) buffer_output = {}
								if(!buffer_output[key]) buffer_output[key] = {}

								Object.each(matched, function(stat, matched_name){
									/**
									* create an instance for each stat, ex: blockdevices_sda....blockdevices_sdX
									**/
									// if(!data['_instances'][name])
									// 	data['_instances'][name] = Object.clone(chart)
                  if(!this.__charts_instances[host][key][matched_name])
                    this.__charts_instances[host][key][matched_name] = Object.clone(chart)

									// this.__process_stat(chart, name, stat)
									if(stat){
										// data_to_tabular(stat, chart, name, function(name, data){
										data_to_tabular(
                      stat,
                      this.__charts_instances[host][key][matched_name],
                      matched_name,
                      function(matched_name, to_buffer){
  											buffer_output[key][matched_name] = to_buffer
  										}
                    )
									}

								}.bind(this))
							}


							if(counter == Object.getLength(charts) -1){
                if(resp){
                  resp.json({host: host, status: 'ok', stats: buffer_output, tabular: true})
                }
                else{
                  socket.binary(false).emit('stats', {host: host, status: 'ok', stats: buffer_output, tabular: true})
                }
								// console.log('OUTPUT data_to_tabular', {
								// 	// type: payload.type,
								// 	doc: {
								// 		metadata: {
								// 			host: host
								// 		},
								// 		data: buffer_output
								// 	},
								// 	tabular: true
								// })


								// if(buffer_output && payload.doc[0].doc && payload.doc[0].doc.metadata){
								// 	io.binary(false).emit('os', {
								// 		type: payload.type,
								// 		doc: {
								// 			metadata: {
								// 				host: payload.doc[0].doc.metadata.host
								// 			},
								// 			data: buffer_output
								// 		},
								// 		tabular: true
								// 	})
								// }
							}

							counter++
						}.bind(this))

          }
          else{
            if(resp){
              resp.json({host: host, status: 'ok', stats: stats})
            }
            else{
              socket.binary(false).emit('stats', {host: host, status: 'ok', stats: stats})
            }
          }

          // if(this.options.redis){
            // delete this.stats[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('statsProcessed', send_stats)
      }.bind(this)

      this.addEvent('statsProcessed', send_stats)

      let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
      this.__process_stats(host, pipeline)
    }
  },
  hosts: function(){
    let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
    let {host} = params
    // console.log('host...', params, host, this.stats[host])
    // let host = arguments[2]
    if(host === null || host === undefined){
      this.__no_host(req, resp, socket, next, params)
    }
    else{

      let send_charts = function(){
        if(this.charts[host] && Object.getLength(this.charts[host]) == 0){
          if(resp){
            resp.status(404).json({host: host, err: 'not found'})
          }
          else{
            socket.binary(false).emit('hosts', {host: host, err: 'not found'})
          }
        }
        else{
          if(resp){
            resp.json({host: host, status: 'ok', charts: this.charts[host]})
          }
          else{
            socket.binary(false).emit('hosts', {host: host, status: 'ok', charts: this.charts[host]})
          }

          // if(this.options.redis){
            // delete this.stats[host]
            // delete this.charts[host]
          // }
        }

        this.removeEvent('statsProcessed', send_charts)
      }.bind(this)

      if(this.charts[host] && Object.getLength(this.charts[host]) > 0){//stats processed already
        // console.log('this.stats[host]', this.stats[host])
        send_charts()
      }
      else{
        this.addEvent('statsProcessed', send_charts)
        let pipeline = this.__get_pipeline(host, (socket) ? socket.id : undefined)
        this.__process_stats(host, pipeline)
      }


    }


	},
	// hosts: function(){
  //   let {req, resp, socket, next, params} = this._arguments(arguments, ['host'])
  //   let {host} = params
  //   // console.log('host...', params, host, this.stats[host])
  //   // let host = arguments[2]
  //   if(host === null || host === undefined){
  //     this.__no_host(req, resp, socket, next, params)
  //   }
  //   else{
  //
  //     let send_charts = function(){
  //       if(this.stats[host] && Object.getLength(this.stats[host]) == 0){
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
  //           // delete this.stats[host]
  //           // delete this.charts[host]
  //         // }
  //       }
  //
  //       this.removeEvent('statsProcessed', send_charts)
  //     }.bind(this)
  //
  //     if(this.stats[host] && Object.getLength(this.stats[host]) > 0){//stats processed already
  //       // console.log('this.stats[host]', this.stats[host])
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

    this.profile('os_init');//end profiling

		this.log('os', 'info', 'os started');
  },
  socket: function(socket){
		this.parent(socket)

		socket.on('disconnect', function () {

      console.log('disconnect this.io.namespace.connected', this.io.connected)


      Object.each(this.pipelines, function(pipe){
        if(pipe.ids.contains(socket.id)){
          pipe.ids.erase(socket.id)
          pipe.ids = pipe.ids.clean()
        }

        console.log('suspending...', pipe.ids, pipe.ids.length)

        if(pipe.ids.length == 0){
          console.log('suspending...', pipe.ids)
          pipe.pipeline.fireEvent('onSuspend')
        }

      }.bind(this))
			// if(Object.keys(this.io.connected).length == 0)
				// this.pipeline.fireEvent('onSuspend')


		}.bind(this));
	},
  _arguments: function(args, defined_params){
		let req, resp, next, socket = undefined
    // console.log(typeof args[0])
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
      // console.log('socket', args)
      if(defined_params){
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
  __process_stats(host, pipeline){

    let save_stats = function (payload){
      let {type, doc} = payload
      // let { type, input, input_type, app } = opts

      if(type == 'periodical'){
        let matched = undefined
        // console.log('save_stats', payload)

        if(doc.length == 0){
          console.log('save_stats', payload)

          this.stats[host] = {}
          this.charts[host] = {}
          pipeline.removeEvent('onSaveDoc', save_stats)
          this.fireEvent('statsProcessed')

        }
        else{
          this.__process_os_doc(payload.doc, function(stats){
            this.stats[host] = stats
            this.charts[host] = Object.clone(this.__charts)
            Object.each(this.charts[host], function(data, key){

                // if(stats.os && stats.os.networkInterfaces)
                  //console.log('MATCHED', stats.os.networkInterfaces[0].value.lo)

                let {name, chart} = data
                matched = this.__match_stats_name(stats, name)

                // console.log('MATCHED', name, matched)
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
        }

      }
    }.bind(this)
    /**
    * onSaveDoc is exec when the input fires 'onPeriodicalDoc'
    * so capture the output once (and for one host, as all stats are the same)
    */
    // console.log('firing...', host)
    pipeline.addEvent('onSaveDoc', save_stats)
    // this.pipelines[host].pipeline.addEvent('onSaveMultipleDocs', save_stats)
    pipeline.fireEvent('onOnce')

  },
  __get_pipeline(host, id){
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

    // console.log('this.stats[host]', this.stats[host])
    // if(!this.stats[host] || Object.getLength(this.stats[host]) == 0){
    //   // //console.log('save_stats')
    //   // //console.log('CHARTS', this.__charts['uptime'].name)
    //   let save_stats = function (payload){
    //     let {type, doc} = payload
    //     // let { type, input, input_type, app } = opts
    //
    //     if(type == 'periodical'){
    //       let matched = undefined
    //       // console.log('save_stats', payload)
    //
    //       if(doc.length == 0){
    //         console.log('save_stats', payload)
    //
    //         this.stats[host] = {}
    //         this.charts[host] = {}
    //         this.pipelines[host].pipeline.removeEvent('onSaveDoc', save_stats)
    //         this.fireEvent('statsProcessed')
    //
    //       }
    //       else{
    //         this.__process_os_doc(payload.doc, function(stats){
    //           this.stats[host] = stats
    //           this.charts[host] = Object.clone(this.__charts)
    //           Object.each(this.charts[host], function(data, key){
    //
    //               // if(stats.os && stats.os.networkInterfaces)
    //                 //console.log('MATCHED', stats.os.networkInterfaces[0].value.lo)
    //
    //               let {name, chart} = data
    //               matched = this.__match_stats_name(stats, name)
    //
    //               // console.log('MATCHED', name, matched)
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
    //   console.log('firing...', host)
    //   this.pipelines[host].pipeline.addEvent('onSaveDoc', save_stats)
    //   // this.pipelines[host].pipeline.addEvent('onSaveMultipleDocs', save_stats)
    //   this.pipelines[host].pipeline.fireEvent('onOnce')
    // }

    if(id){
      if(!this.pipelines[host].ids.contains(id))
        this.pipelines[host].ids.push(id)

      if(this.pipelines[host].pipeline.inputs[0].options.suspended == true){
        this.pipelines[host].pipeline.fireEvent('onResume')
        // pipeline.fireEvent('onSuspend')
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
        // //console.log('__match_stats_name', stats, name)

        let parse_data = function(stat_data, stat_name){
          let matched = this.__match_stats_name(stat_data, rest)


          // if(name == '%s.%s.%s' ){
          //   console.log('__match_stats_name', name, stat_data, matched)
          // }
          // if(rest.indexOf('%s') > -1)
          //   console.log('__match_stats_name', name, stats, matched)

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
            //   console.log('__match_stats_name', name)
            //   // console.log(stat_data)
            //   console.log(stat)
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
            // console.log('parsing....',stat)

          })

          return stat
        }
        else{
          // console.log('parsing....',parse_data(stats[key], key))
          return parse_data(stats[key], key)
        }

        // let matched = this.__match_stats_name(stats[key], rest)
        //
        // if(name == '%s.%s.%s' ){
        //   console.log('__match_stats_name', name, stats, matched)
        // }
        // // if(rest.indexOf('%s') > -1)
        // //   console.log('__match_stats_name', name, stats, matched)
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
          // //console.log()
          // if(name == '%s')
          //   console.log('stats', stats)

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
  // 			// //console.log('__match_stats_name', stats, name)
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
  // 				// //console.log()
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
    //console.log('data_to_tabular', name, stat)

    if(chart.init && typeOf(chart.init) == 'function')
      chart.init(this, chart, name, stat, 'chart')

    /**
    * first update
    **/
    // if(this.stat.data.length > 0){
    //
    //   data_to_tabular(stat, chart, name, function (name, data){
    //     //console.log('data_to_tabular result', name, data)
    //   })
    // }
    //
    // this.__create_watcher(name, chart)

  },
  /**
  * from mngr-ui-admin-lte/chart.vue
  **/
  __process_stat (chart, name, stat){
    //console.log('__process_stat', chart, name, stat)
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

          // //console.log('stat[0].value[prop_to_filter]', name, stat)
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

          // //console.log('ROW', keys, path)

          if(!paths[path])
            paths[path] = {}


          Object.each(keys, function(data, key){
            // ////console.log('ROW', key, data)
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
