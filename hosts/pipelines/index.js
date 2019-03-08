'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Internals');

const InputPollerRethinkDBHosts = require ( './input/rethinkdb.hosts.js' )
const InputPollerRethinkDBHost = require ( './input/rethinkdb.host.js' )
const InputCache = require ( './input/cache.js' )

let cron = require('node-cron')


let os = {
	mounts: {
		type: /^(ext.*|xfs)$/ //filter mounts
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

// let paths_whitelist = /^((?!os\.procs|os\.procs\.cmd|os\.procs\.uid).)*$/
let paths_whitelist = undefined
let paths_blacklist = /^os\.procs(\.|\.uid|\.cmd)*$/

let __white_black_lists_filter = function(whitelist, blacklist, str){
  let filtered = false
  if(!blacklist && !whitelist){
    filtered = true
  }
  else if(blacklist && !blacklist.test(str)){
    filtered = true
  }
  else if(blacklist && blacklist.test(str) && (whitelist && whitelist.test(str))){
    filtered = true
  }
  else if(!blacklist && (whitelist && whitelist.test(str))){
    filtered = true
  }

  return filtered
}

// let __process_stat_doc = function(doc, cb){
//   //console.log('__process_os_doc', doc)
//
//   let paths = {}
//
//   if(Array.isArray(doc)){
//     Array.each(doc, function(row){
//
//       // if(row != null && row.metadata.host == this.host){
//       if(row != null){
//         let {keys, path, host} = extract_data_os(row)
//
//         // //////console.log('ROW', keys, path)
//
//         if(!paths[path])
//           paths[path] = {}
//
//
//         Object.each(keys, function(data, key){
//           // ////////console.log('ROW', key, data)
//           if(!paths[path][key])
//             paths[path][key] = []
//
//           paths[path][key].push(data)
//         })
//       }
//     })
//   }
//   // else if(doc.metadata.host == this.host){
//   else{
//     let {keys, path, host} = extract_data_os(doc)
//     if(!paths[path])
//       paths[path] = {}
//
//     paths[path] = keys
//   }
//
//   cb(paths)
//
//
// }
//
// let extract_data_os = require( 'node-mngr-docs' ).extract_data_os

module.exports = function(payload){
	// //console.log('IO', io)
  let {conn, host, cache} = payload

  debug_internals('require %o', payload)

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
      				return cron.schedule('*/5 * * * * *', dispatch);//every 5 sec
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
              },
              host
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
  				id: "input.cache",
  				conn: [
            Object.merge(
              Object.clone(cache),
              {
                // path_key: 'os',
                module: InputCache,
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
      				return cron.schedule('* * * * * *', dispatch);//every second
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
        delete opts.input
        delete opts.input_type
        delete opts.app

        let out = Object.clone(opts)

        out[type] = docs

        debug_internals('docs', type, docs)

        if(out[type] && out[type].paths && out[type].paths.length > 0){
          debug_internals('out[type].paths', type, out[type])

          Array.each(out[type].paths, function(row, index){
            if(__white_black_lists_filter(paths_whitelist, paths_blacklist, row) !== true)
              out[type].paths= out[type].paths.erase(row)
          })
        }

        // if((type == 'host' || type == 'data') && docs && docs.data && Object.getLength(docs.data) > 0){
        if(out[type] && out[type].data && Object.getLength(out[type].data) > 0){

          let counter = 0
          Object.each(out[type].data, function(stat, name){
            if(!Array.isArray(stat))
              stat = [stat]

            //should be sorted on DB....
            stat.sort(function(a,b) {
              return (a.metadata.timestamp > b.metadata.timestamp) ? 1 : ((b.metadata.timestamp > a.metadata.timestamp) ? -1 : 0)
            })

            Array.each(stat, function(row, index){
              if(row && row.metadata && row.metadata.path){
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

                if(__white_black_lists_filter(paths_whitelist, paths_blacklist, row.metadata.path) !== true)
                  stat[index] = undefined


                // data[row.metadata.path] = {value: row.data, timestamp: row.metadata.timestamp}
              }

              if(index == stat.length -1){
                stat = stat.clean()

                // __process_stat_doc(stat, function(processed){
                //   out[type].data[name] = processed
                //   // pipeline.output(out)
                // })
              }
            })

            if(stat.length > 0){
              out[type].data[name] = stat
            }
            else{
              delete out[type].data[name]
            }

            // if(counter == Object.getLength(docs.data) -1 && Object.getLength(out[type].data)){
            //   // docs.data = docs.data.clean()
            //   // out[type].data = data
            //
            //     pipeline.output(out)
            //
            //   // __process_stat_doc(docs.data, function(data){
            //   //   out[type].data = data
            //   //   pipeline.output(out)
            //   // })
            // }

            counter++
          })


        }
        // else{
          pipeline.output(out)
        // }
      }
  	],
  	// output: [
    //
  	// ]
  }

  return conf
}
