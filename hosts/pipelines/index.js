'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Internals');

const InputPollerRethinkDBHosts = require ( './input/rethinkdb.hosts.js' )
const InputPollerRethinkDBHost = require ( './input/rethinkdb.host.js' )

let cron = require('node-cron')



module.exports = function(conn){
	// //console.log('IO', io)

  let conf = {
  	input: {
  		hosts: {
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
  				connect_retry_count: 5,
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
      paths: {
  			poll: {
  				suspended: true,//start suspended
  				id: "input.paths",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                // path_key: 'os',
                module: InputPollerRethinkDBHost,
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
      				return cron.schedule('*/5 * * * * *', dispatch);//every second
      			}
      		},
  			},
  		}
  	},
    filters: [
  		// decompress,
  		function(docs, opts, next, pipeline){
        // debug_internals(arguments)
        let { id, type, input, input_type, app } = opts
        let out = opts
        out[type] = docs
        pipeline.output(out)
      }
  	],
  	// output: [
    //
  	// ]
  }

  return conf
}
