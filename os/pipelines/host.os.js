'use strict'

let cron = require ('node-cron')

const InputPollerCouchDBOS = require ( './input/couchdb.os.js' )

// let data_to_tabular  = require( 'node-tabular-data' ).data_to_tabular

let os = {
	mounts: {
		type: /ext.*/ //filter mounts
	}
}

let mount_filter = function(doc, opts, next, pipeline){
	let data = Array.clone(doc.data)
	doc.data = data.filter(function(item, index){

		return os.mounts.type.test(item.type);
	});

	// next(doc, opts, next, pipeline)
	return doc
}

let blockdevices_filter = function(doc, opts, next, pipeline){
	Object.each(doc.data, function(value, item){
		delete doc.data[item].partitions
	})

	// next(doc, opts, next, pipeline)
	return doc
}

let os_filter = function(doc, opts, next, pipeline){
	Object.each(doc.data.networkInterfaces, function(value, item){
		delete doc.data.networkInterfaces[item].if
	})

	// next(doc, opts, next, pipeline)
	return doc
}

/**
* stats processing
**/
let stats_init = false//flag

let extract_data_os = require( 'node-mngr-docs' ).extract_data_os
let data_to_tabular  = require( 'node-tabular-data' ).data_to_tabular


/**
* from mngr-ui-admin-lte/host.vue
**/
let __process_os_doc = function(doc, cb){

	let paths = {}

	if(Array.isArray(doc)){
		Array.each(doc, function(row){

			// if(row.doc != null && row.doc.metadata.host == this.host){
			if(row.doc != null){
				let {keys, path, host} = extract_data_os(row.doc)

				// console.log('ROW', keys, path)

				if(!paths[path])
					paths[path] = {}


				Object.each(keys, function(data, key){
					// //console.log('ROW', key, data)
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


}

let __match_stats_name = function(stats, name){
	let stat = undefined
	if(stats){
		if(name.indexOf('.') > -1){
			let key = name.split('.')[0]
			let rest = name.substring(name.indexOf('.')+1)
			// console.log('__match_stats_name', stats, name)
			return __match_stats_name(stats[key], rest)
			// stat = stats['os'][real_name]
		}
		else{
			return stats[name]
		}
	}
	return undefined
}

module.exports = function(conn, io, charts){
	// console.log('IO', io)

  let conf = {
  	input: [
  		{
  			poll: {
  				suspended: true,//start suspended
  				id: "input.os",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                path_key: 'os',
                module: InputPollerCouchDBOS,
              }
            )
  				],
  				connect_retry_count: 5,
  				connect_retry_periodical: 1000,
  				requests: {
  					periodical: 1000,
  				},
  				// requests: {
      		// 	periodical: function(dispatch){
  				// 		// ////////console.log('host periodical running')
      		// 		return cron.schedule('* * * * * *', dispatch);//every second
      		// 	}
      		// },
  			},
  		}
  	],
  	filters: [
  		// decompress,
  		function(docs, opts, next, pipeline){
        let { type, input, input_type, app } = opts
  			// //console.log('sizeof', sizeof(docs), docs)

  			// ////console.log('host.template.filter', docs)
        //
  			// let paths = /^os.*/

  			if(!Array.isArray(docs)){
  				docs = [docs]
  			}

  			// Array.each(docs, function(row){
  			// 	if(row.doc && row.doc.metadata && row.doc.metadata.path)
  			// 		switch (row.doc.metadata.path) {
  			// 			case 'os.mounts':
  			// 				mount_filter(
  			// 					row.doc,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			case 'os.blockdevices':
  			// 				blockdevices_filter(
  			// 					row.doc,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			case 'os.blockdevices':
  			// 				os_filter(
  			// 					row.doc,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			default:
  			// 				pipeline.output(row.doc)
        //
        //
  			// 		}
  			// })

  			Array.each(docs, function(row, index){
  				if(row.doc && row.doc.metadata && row.doc.metadata.path)
  					switch (row.doc.metadata.path) {
  						// case 'os.procs':
  						// 	// row.doc = mount_filter(row.doc)
  						// 	delete docs[index]
  						// 	break;

  						case 'os.mounts':
  							row.doc = mount_filter(row.doc)
  							break;

  						case 'os.blockdevices':
  							row.doc = blockdevices_filter(row.doc)
  							break;

  						case 'os':
  							row.doc = os_filter(row.doc)
  							break;

  						// default:
  						// 	pipeline.output(row.doc)


  					}

						// console.log('ROW DOC', row.doc)
						// data_to_tabular([{timestamp: row.doc.metadata.timestamp, value: row.doc.data}], {}, 'some_name', function(name, data){
						// 	console.log('ROW TABULAR', data)
						// })

  					// Array.clean(docs)


  					if(index == docs.length -1 )
  						pipeline.output({type: type, doc: docs})
  			})

  		},

  	],
  	output: [
  		function(payload){
				io.volatile.emit('os', payload)

				if(stats_init == true){
					console.log('charts', charts['uptime'].name, payload.doc)

					__process_os_doc(payload.doc, function(stats){
						let buffer_output = {}

						Object.each(charts, function(data, key){

							if(Array.isArray(data)){
								Array.each(data, function(item){
									let {name, chart} = item
									let stat = __match_stats_name(stats, name)
									this.__process_stat(chart, name, stat)
								}.bind(this))
							}
							else{
								let {name, chart} = data
								let stat = __match_stats_name(stats, name)
								// this.__process_stat(chart, name, stat)

								if(stat)
									data_to_tabular(stat, chart, name, function(name, data){
										// console.log('OUTPUT', name, data)
										buffer_output[name] = data
									})


							}


						}.bind(this))
						console.log('OUTPUT', buffer_output)
						io.emit('os', {type: payload.type, doc: buffer_output, tabular: true})
						// this.fireEvent('statsProcessed')
					}.bind(this))
				}

				if(stats_init == false)
					stats_init = true


  		}
  	]
  }

  return conf
}
