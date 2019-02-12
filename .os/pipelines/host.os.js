'use strict'

const InputPollerRethinkDBOS = require ( './input/rethinkdb.os.js' )

let cron = require('node-cron')

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

// let os_filter = function(doc, opts, next, pipeline){
// 	Object.each(doc.data.networkInterfaces, function(value, item){
// 		delete doc.data.networkInterfaces[item].if
// 	})
//
// 	// next(doc, opts, next, pipeline)
// 	return doc
// }

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

			// if(row != null && row.metadata.host == this.host){
			if(row != null){
				let {keys, path, host} = extract_data_os(row)

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


}

// let __match_stats_name = function(stats, name){
// 	let stat = undefined
// 	if(stats){
// 		if(name.indexOf('.') > -1){
// 			let key = name.split('.')[0]
// 			let rest = name.substring(name.indexOf('.')+1)
// 			// //console.log('__match_stats_name', stats, name)
// 			return __match_stats_name(stats[key], rest)
// 			// stat = stats['os'][real_name]
// 		}
// 		else{
// 			return stats[name]
// 		}
// 	}
// 	return undefined
// }

let __match_stats_name = function(stats, name){
	let stat = {}
	if(stats){
		if(name.indexOf('.') > -1){
			let key = name.split('.')[0]
			let rest = name.substring(name.indexOf('.')+1)
			// //console.log('__match_stats_name', stats, name)
			let matched = __match_stats_name(stats[key], rest)
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


}

// module.exports = function(conn, io, charts){
module.exports = function(conn){
	// //console.log('IO', io)

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
                module: InputPollerRethinkDBOS,
              }
            )
  				],
  				connect_retry_count: 5,
  				connect_retry_periodical: 1000,
  				// requests: {
  				// 	periodical: 1000,
  				// },
  				requests: {
      			periodical: function(dispatch){
  						// //////////console.log('host periodical running')
      				return cron.schedule('* * * * * *', dispatch);//every second
      			}
      		},
  			},
  		}
  	],
  	filters: [
  		// decompress,
  		function(docs, opts, next, pipeline){
        let { id, type, input, input_type, app } = opts
  			// ////console.log('sizeof', sizeof(docs), docs)

  			// //////console.log('host.template.filter', docs)
        //
  			// let paths = /^os.*/

  			if(!Array.isArray(docs)){
  				docs = [docs]
  			}

  			// Array.each(docs, function(row){
  			// 	if(row && row.metadata && row.metadata.path)
  			// 		switch (row.metadata.path) {
  			// 			case 'os.mounts':
  			// 				mount_filter(
  			// 					row,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			case 'os.blockdevices':
  			// 				blockdevices_filter(
  			// 					row,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			case 'os.blockdevices':
  			// 				os_filter(
  			// 					row,
  			// 					opts,
  			// 					pipeline.output.bind(pipeline),
  			// 					pipeline
  			// 				)
  			// 				break;
        //
  			// 			default:
  			// 				pipeline.output(row)
        //
        //
  			// 		}
  			// })

				// console.log(docs)

				if(docs.length == 0 ){
					pipeline.output({id: id, type: type, doc: docs})
				}
				else{
	  			Array.each(docs, function(row, index){
	  				if(row && row.metadata && row.metadata.path)
	  					switch (row.metadata.path) {
	  						// case 'os.procs':
	  						// 	// row = mount_filter(row)
	  						// 	// delete docs[index]
								// 	break;

	  						case 'os.mounts':
	  							row = mount_filter(row)
	  							break;

	  						case 'os.blockdevices':
	  							row = blockdevices_filter(row)
	  							break;

	  						// case 'os':
	  						// 	row = os_filter(row)
	  						// 	break;

	  						// default:
	  						// 	pipeline.output(row)


	  					}

							// //console.log('ROW DOC', row)
							// data_to_tabular([{timestamp: row.metadata.timestamp, value: row.data}], {}, 'some_name', function(name, data){
							// 	//console.log('ROW TABULAR', data)
							// })

	  					// Array.clean(docs)

							if(index == docs.length -1 ){
								docs = docs.clean()
	  						pipeline.output({id: id, type: type, doc: docs})
							}
	  			})
				}
  		},

  	],
  	output: [
  		// function(payload){
			// 	// console.log('OUTPUT', payload)
      //
			// 	if(io)
			// 		io.binary(false).volatile.emit('os', payload)
      //
			// 	if(stats_init == true){
			// 		// console.log('charts', charts, payload)
      //
			// 		__process_os_doc(payload, function(stats){
			// 			let buffer_output = undefined
      //
			// 			// //console.log('OUTPUT', stats)
			// 			let counter = 0
			// 			Object.each(charts, function(data, key){
      //
			// 				let {name, chart} = data
			// 				/**
			// 				* we will create an instance for each one, as charts like "blockdevices"
			// 				* hace static properties like "prev", and you may have multiple devices overriding it
			// 				**/
			// 				if(!data['_instances']) data['_instances'] = {}
      //
			// 				let matched = __match_stats_name(stats, name)
      //
			// 				// if(Array.isArray(matched)){
			// 				// 	Array.each(matched, function(data){
			// 				// 		// this.__process_stat(chart, data.name, data.stat)
			// 				// 		if(stat)
			// 				// 			data_to_tabular(data.stat, chart, data.name, function(name, data){
			// 				// 				// //console.log('OUTPUT', name, data)
			// 				// 				buffer_output[name] = data
			// 				// 			})
			// 				// 	})
			// 				// }
			// 				// else{
			// 				if(matched){
      //
			// 					// console.log('MATCHED', matched)
      //
			// 					if(!buffer_output) buffer_output = {}
			// 					if(!buffer_output[key]) buffer_output[key] = {}
      //
			// 					Object.each(matched, function(stat, name){
			// 						/**
			// 						* create an instance for each stat, ex: blockdevices_sda....blockdevices_sdX
			// 						**/
			// 						if(!data['_instances'][name])
			// 							data['_instances'][name] = Object.clone(chart)
      //
			// 						// this.__process_stat(chart, name, stat)
			// 						if(stat){
			// 							// data_to_tabular(stat, chart, name, function(name, data){
			// 							data_to_tabular(stat, data['_instances'][name], name, function(name, to_buffer){
			// 								buffer_output[key][name] = to_buffer
			// 							})
			// 						}
      //
			// 					})
			// 				}
      //
      //
			// 				if(counter == Object.getLength(charts) -1){
			// 					console.log('OUTPUT data_to_tabular', {
			// 						type: payload.type,
			// 						doc: {
			// 							metadata: {
			// 								host: payload[0].metadata.host
			// 							},
			// 							data: buffer_output
			// 						},
			// 						tabular: true
			// 					})
      //
			// 					if(buffer_output && payload[0] && payload[0].metadata){
			// 						io.binary(false).emit('os', {
			// 							type: payload.type,
			// 							doc: {
			// 								metadata: {
			// 									host: payload[0].metadata.host
			// 								},
			// 								data: buffer_output
			// 							},
			// 							tabular: true
			// 						})
			// 					}
			// 				}
      //
			// 				counter++
			// 			}.bind(this))
      //
      //
			// 			// this.fireEvent('statsProcessed')
			// 		}.bind(this))
			// 	}
      //
			// 	if(stats_init == false)
			// 		stats_init = true
      //
      //
  		// }
  	]
  }

  return conf
}
