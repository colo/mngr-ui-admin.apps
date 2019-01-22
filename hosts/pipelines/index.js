'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Internals');

const InputPollerRethinkDBHosts = require ( './input/rethinkdb.hosts.js' )
const InputPollerRethinkDBHost = require ( './input/rethinkdb.host.js' )

let cron = require('node-cron')


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

let __process_stat_doc = function(doc, cb){
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
  // else if(doc.metadata.host == this.host){
  else{
    let {keys, path, host} = extract_data_os(doc)
    if(!paths[path])
      paths[path] = {}

    paths[path] = keys
  }

  cb(paths)


}

let extract_data_os = require( 'node-mngr-docs' ).extract_data_os

module.exports = function(conn){
	// //console.log('IO', io)

  let conf = {
  	input: [
  		{
  			poll: {
  				suspended: true,//start suspended
  				id: "input.hosts",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                // path_key: 'os',
                module: InputPollerRethinkDBHosts,
              }
            )
  				],
  				connect_retry_count: -1,
  				connect_retry_periodical: 1000,
  				// requests: {
  				// 	periodical: 1000,
  				// },
  				requests: {
      			periodical: function(dispatch){
  						// //////////console.log('host periodical running')
      				return cron.schedule('*/5 * * * * *', dispatch);//every second
      			}
      		},
  			},
  		},
      {
  			poll: {
  				suspended: true,//start suspended
  				id: "input.host",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                // path_key: 'os',
                module: InputPollerRethinkDBHost,
              }
            )
  				],
  				connect_retry_count: -1,
  				connect_retry_periodical: 1000,
  				// requests: {
  				// 	periodical: 1000,
  				// },
  				requests: {
      			periodical: function(dispatch){
  						// //////////console.log('host periodical running')
      				return cron.schedule('*/5 * * * * *', dispatch);//every second
      			}
      		},
  			},
  		}
  	],
    filters: [
  		// decompress,
  		function(docs, opts, next, pipeline){
        // debug_internals(arguments)
        let { id, type, input, input_type, app } = opts
        let out = {type: type}
        out[type] = docs

        // let stats = {}
        if(type == 'host' && docs.stats){
          Array.each(docs.stats, function(row, index){
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

              }

              // stats[row.metadata.path] = {value: row.data, timestamp: row.metadata.timestamp}

              if(index == docs.stats.length -1 ){
                // docs.stats = docs.stats.clean()
                // out[type].stats = stats
                pipeline.output(out)
                // __process_stat_doc(docs.stats, function(stats){
                //   out[type].stats = stats
                //   pipeline.output(out)
                // })
              }
          })


        }
        else{
          pipeline.output(out)
        }
      }
  	],
  	// output: [
    //
  	// ]
  }

  return conf
}
