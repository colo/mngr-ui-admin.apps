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

module.exports = new Class({
  Extends: App,

  HostOSPipeline: undefined,
  pipelines: {},
  stats: undefined,
  __charts: {
    uptime: { name: 'os.uptime', chart: uptime_chart },
    loadavg: { name: 'os.loadavg', chart: loadavg_chart},
    cpus_times: { name: 'os.cpus', chart: cpus_times_chart},
    cpus_percentage : { name: 'os.cpus', chart: cpus_percentage_chart},
    // freemem : { name: 'os.freemem', chart: freemem_chart},
    // networkInterfaces : { name: 'os.networkInterfaces.%d', chart: networkInterfaces_chart},
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
    path: '/',

    authorization: undefined,

		io: {
			// middlewares: [], //namespace.use(fn)
			// rooms: ['root'], //atomatically join connected sockets to this rooms
			routes: {
        charts: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['charts'],
					// middlewares: [], //socket.use(fn)
				}],
				host: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['host'],
					// middlewares: [], //socket.use(fn)
				}],
        range: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['range'],
					// middlewares: [], //socket.use(fn)
				}],
        periodical: [{
					// path: ':param',
					// once: true, //socket.once
					callbacks: ['periodical'],
					// middlewares: [], //socket.use(fn)
				}],
			// 	// '*': [{// catch all
			// 	// 	path: '',
			// 	// 	callbacks: ['not_found_message'],
			// 	// 	middlewares: [], //socket.use(fn)
			// 	// }]
			}
		}
	},

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

  /**
  *
  **/
  charts: function(socket, next){
    let {host} = arguments[2]

    socket.emit('charts', {
      host: host,
      charts: this.__charts
    })

	},
  range: function(socket, next){
    let {host, path, range} = arguments[2]

		// //console.log('range...', host, range, path)
		let pipeline = this.__get_pipeline(host)
    // pipelines.input[0].options.range_path = path
    // //console.log(pipeline.inputs[0])
    pipeline.fireEvent('onRange',{ Range: range.type+' '+ range.start +'-'+ range.end +'/*', path: path })

	},
  periodical: function(socket, next){
    let {host} = arguments[2]

		let pipeline = this.__get_pipeline(host, socket.id)

    if(pipeline.inputs[0].options.suspended == true){
      pipeline.fireEvent('onResume')
      // pipeline.fireEvent('onSuspend')
    }

    // //console.log('periodical', pipeline.inputs[0])
    // pipeline.fireEvent('onResume')

	},

	host: function(socket, next){
    let host = arguments[2]
		//console.log('host...', arguments[2])
		let pipeline = this.__get_pipeline(host, socket.id)

    if(this.stats){//stats processed already
      socket.emit('host', {host: host, status: 'ok', charts: this.__charts})
    }
    else{
      let send_charts = function(){
        //console.log('statsProcessed')
        socket.emit('host', {host: host, status: 'ok', charts: this.__charts})
        this.removeEvent('statsProcessed', send_charts)
      }
      this.addEvent('statsProcessed', send_charts.bind(this))
    }

	},
  __get_pipeline(host, id){
    //console.log('__get_pipeline', id)

    if(!this.pipelines[host]){
      let template = Object.clone(this.HostOSPipeline)
      template.input[0].poll.conn[0].stat_host = host
      template.input[0].poll.id += '-'+host
      template.input[0].poll.conn[0].id = template.input[0].poll.id
      this.pipelines[host] = {
        pipeline: new Pipeline(template),
        ids: []
      }


      if(!this.stats){
        // //console.log('save_stats')
        // //console.log('CHARTS', this.__charts['uptime'].name)
        let save_stats = function (payload){
          // //console.log('save_stats', payload)
          if(payload.type == 'periodical'){
            // //console.log('save_stats', payload.doc)


            this.__process_os_doc(payload.doc, function(stats){
              this.stats = stats



              Object.each(this.__charts, function(data, key){

                  // if(stats.os && stats.os.networkInterfaces)
                    //console.log('MATCHED', stats.os.networkInterfaces[0].value.lo)

                  let {name, chart} = data
                  let matched = this.__match_stats_name(stats, name)

                  // //console.log('MATCHED', matched)
                  // if(Array.isArray(matched)){
                  //   Array.each(matched, function(data){
                  //     this.__process_stat(chart, data.name, data.stat)
                  //   }.bind(this))
                  // }
                  // else{
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
            this.pipelines[host].pipeline.removeEvent('onSaveDoc', save_stats)
          }
        }.bind(this)
        /**
        * onSaveDoc is exec when the input fires 'onPeriodicalDoc'
        * so capture the output once (and for one host, as all stats are the same)
        */
        this.pipelines[host].pipeline.addEvent('onSaveDoc', save_stats)
        this.pipelines[host].pipeline.fireEvent('onOnce')
      }

    }

    if(!this.pipelines[host].ids.contains(id))
      this.pipelines[host].ids.push(id)

    if(this.pipelines[host].pipeline.inputs[0].options.suspended == true){
      this.pipelines[host].pipeline.fireEvent('onResume')
      // pipeline.fireEvent('onSuspend')
    }

    return this.pipelines[host].pipeline
  },
  __match_stats_name(stats, name){
    let stat = {}
    if(stats){
      if(name.indexOf('.') > -1){
        let key = name.split('.')[0]
        let rest = name.substring(name.indexOf('.')+1)
        // //console.log('__match_stats_name', stats, name)
        let matched = this.__match_stats_name(stats[key], rest)
    		// let result = undefined
        if(matched){
      		if(Array.isArray(matched)){
      			Array.each(matched, function(data, index){
      				stat[key+'_'+index] = data
      			})
      		}
      		else{
      			// result = {}
      			Object.each(matched, function(data, name){
      				stat[key+'_'+name] = data
      			})
      		}

      		return stat
        }
        else{
          return undefined
        }
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
          // name = name.replace('.%s')
          // //console.log()
          Object.each(stats, function(data, key){
            stat[key] = data
          })
        }
        else{
          stat[name] = stats[name]
        }

        return stat
      }

    }
    else{
      return undefined
    }


  },


	// get: function(req, resp){
		// resp.send(
		// 	'<!doctype html><html><head><title>socket.io client test</title></head>'
		// 	+'<body><script src="/socket.io/socket.io.js"></script>'
		// 	+'<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>'
		// 	+'<script>'
		// 	+'var chat = io.connect("http://localhost:8080/");'
		//   +'chat.on("connect", function () {'
		//   +'  chat.emit("message", "hi!");'
		// 	+'	chat.on("response", function(message){ '
		// 	+'		$("body").append(message);'
		// 	+'	});'
		// 	+'  chat.emit("message");'//test
		//   +'});'
		// 	+'</script>'
		// 	+'</body></html>'
		// )
	// },

  initialize: function(options){
    this.parent(options)

		this.profile('os_init');//start profiling

    this.profile('os_init');//end profiling

		this.log('os', 'info', 'os started');
  },
  socket: function(socket){
		this.parent(socket)

    if(!this.HostOSPipeline)
      this.HostOSPipeline = require('./pipelines/host.os')(require(ETC+'default.conn.js'), this.io, this.__charts)

		// //console.log('suspended', this.io.connected)
		// if(!this.io.connected || Object.keys(this.io.connected).length == 0)
			// this.pipeline.fireEvent('onResume')

    //
		// //console.log('this.io.namespace.connected', Object.keys(this.io.connected))
    //
		socket.on('disconnect', function () {

      console.log('disconnect this.io.namespace.connected', this.io.connected)


      Object.each(this.pipelines, function(pipe){
        if(pipe.ids.contains(socket.id)){
          pipe.ids.erase(socket.id)
          pipe.ids.clean()
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

});
