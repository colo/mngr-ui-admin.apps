'use strict'

var	path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let Pipeline = require('js-pipeline')

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

  charts: function(socket, next){
    let {host} = arguments[2]

    socket.emit('charts', {
      host: host,
      charts: {
        uptime: uptime_chart,
        loadavg: loadavg_chart,
        cpus_times: cpus_times_chart,
        cpus_percentage : cpus_percentage_chart,
        freemem : freemem_chart,
        mounts_percentage : mounts_percentage_chart,
        blockdevices_stats : blockdevices_stats_chart,
        networkInterfaces : networkInterfaces_chart,
      }
    })

	},
  range: function(socket, next){
    let {host, path, range} = arguments[2]

		// console.log('range...', host, range, path)
		let pipeline = this.__get_pipeline(host)
    // pipelines.input[0].options.range_path = path
    // console.log(pipeline.inputs[0])
    pipeline.fireEvent('onRange',{ Range: range.type+' '+ range.start +'-'+ range.end +'/*', path: path })

	},
  periodical: function(socket, next){
    let {host} = arguments[2]

		let pipeline = this.__get_pipeline(host, socket.id)

    if(pipeline.inputs[0].options.suspended == true){
      pipeline.fireEvent('onResume')
      // pipeline.fireEvent('onSuspend')
    }

    // console.log('periodical', pipeline.inputs[0])
    // pipeline.fireEvent('onResume')

	},

	host: function(socket, next){
    let host = arguments[2]
		console.log('host...', arguments[2])
		let pipeline = this.__get_pipeline(host, socket.id)


    socket.emit('host', {host: host, status: 'ok'})

	},
  __get_pipeline(host, id){
    console.log('__get_pipeline', id)

    if(!this.pipelines[host]){
      let template = Object.clone(this.HostOSPipeline)
      template.input[0].poll.conn[0].stat_host = host
      template.input[0].poll.id += '-'+host
      template.input[0].poll.conn[0].id = template.input[0].poll.id
      this.pipelines[host] = {
        pipeline: new Pipeline(template),
        ids: []
      }
      // this.pipelines[host].fireEvent('onResume')
    }

    if(!this.pipelines[host].ids.contains(id))
      this.pipelines[host].ids.push()

    return this.pipelines[host].pipeline
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
      this.HostOSPipeline = require('./pipelines/host.os')(require(ETC+'default.conn.js'), this.io)

		// console.log('suspended', this.io.connected)
		if(!this.io.connected || Object.keys(this.io.connected).length == 0)
			// this.pipeline.fireEvent('onResume')

    //
		// console.log('this.io.namespace.connected', Object.keys(this.io.connected))
    //
		socket.on('disconnect', function () {
      Object.each(this.pipelines, function(pipe){
        if(pipe.ids.contains(socket.id))
          pipe.ids.erase(socket.id)

        if(pipe.ids.empty()){
          console.log('suspending...')
          pipe.pipeline.fireEvent('onSuspend')
        }

      }.bind(this))
			// if(Object.keys(this.io.connected).length == 0)
				// this.pipeline.fireEvent('onSuspend')

			console.log('disconnect this.io.namespace.connected', this.io.connected)
		}.bind(this));
	},

});
