'use strict'

let cron = require ('node-cron')

const InputPollerCouchDBOS = require ( './input/couchdb.os.js' )

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

module.exports = function(conn, io){
	// console.log('IO', io)

  let conf = {
  	input: [
  		{
  			poll: {
  				// suspended: true,//start suspended
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

  					// Array.clean(docs)

  					if(index == docs.length -1 )
  						pipeline.output({type: type, doc: docs})
  			})

  		},

  	],
  	output: [
  		function(payload){
				io.emit('os', payload)

  			// console.log('OUTPUT', payload)
  			// //console.log('output sizeof', sizeof(doc, doc))

        // doc = JSON.decode(doc)
  			// store.commit('app/doc', {type: 'os', 'value': doc})

  			// ////////console.log('InputPollerCouchDBOS output', doc)

        // let type = doc.type
        // EventBus.$emit(type, doc)
  			// EventBus.$emit('os', payload)
  		}
  	]
  }

  return conf
}
