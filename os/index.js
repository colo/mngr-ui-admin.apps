'use strict'

var	path = require('path')

const App =  process.env.NODE_ENV === 'production'
      ? require(path.join(process.cwd(), '/config/prod.conf'))
      : require(path.join(process.cwd(), '/config/dev.conf'))

const ETC =  process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '/etc/')
      : path.join(process.cwd(), '/devel/etc/')

let Pipeline = require('js-pipeline')


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
			// 	// '*': [{// catch all
			// 	// 	path: '',
			// 	// 	callbacks: ['not_found_message'],
			// 	// 	middlewares: [], //socket.use(fn)
			// 	// }]
			}
		}
	},

  range: function(socket, next){
    let {host, path, range} = arguments[2]

		console.log('range...', host, range, path)
		let pipeline = this.__get_pipeline(host)
    // pipelines.input[0].options.range_path = path
    // console.log(pipeline.inputs[0])
    pipeline.fireEvent('onRange',{ Range: range.type+' '+ range.start +'-'+ range.end +'/*', path: path })

    // socket.emit('host', {host: host, status: this.pipelines[host].input[0].suspended})

		// this.io.to('root').emit('host', {host: host, status: 'ok'});
		// next(socket)
	},

	host: function(socket, next){
    let host = arguments[2]
		console.log('host...', arguments[2])
		let pipeline = this.__get_pipeline(host)


    socket.emit('host', {host: host, status: 'ok'})

	},
  __get_pipeline(host){

    if(!this.pipelines[host]){
      let template = Object.clone(this.HostOSPipeline)
      template.input[0].poll.conn[0].stat_host = host
      template.input[0].poll.id += '-'+host
      template.input[0].poll.conn[0].id = template.input[0].poll.id
      this.pipelines[host] = new Pipeline(template)
      // this.pipelines[host].fireEvent('onResume')
    }

    return this.pipelines[host]
  },
	// message: function(socket, next){
	// 	console.log('message')
	// 	socket.emit('response', 'some response')
  //
	// 	// console.log(this.authorization)
	// },
	// not_found_message(socket, next){
	// 	console.log('not_found_message')
	// 	socket.emit('response', 'not found')
	// },
	get: function(req, resp){
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
	},

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
			if(Object.keys(this.io.connected).length == 0)
				// this.pipeline.fireEvent('onSuspend')

			console.log('disconnect this.io.namespace.connected', this.io.connected)
		}.bind(this));
	},

});
