'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Internals');

const InputPollerRethinkDBHost = require ( './input/rethinkdb.host.js' )

let cron = require('node-cron')

let extract_data_os = require( 'node-mngr-docs' ).extract_data_os
let data_to_tabular  = require( 'node-tabular-data' ).data_to_tabular


module.exports = function(conn){
	// //console.log('IO', io)

  let conf = {
  	input: [
  		{
  			poll: {
  				suspended: true,//start suspended
  				id: "input.host",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                path_key: 'host',
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

  		},

  	],
  	output: [

  	]
  }

  return conf
}
