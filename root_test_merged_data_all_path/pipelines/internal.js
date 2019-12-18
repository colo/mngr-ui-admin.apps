'use strict'

let debug = require('debug')('mngr-ui-admin:apps:root:Pipeline:internal'),
    debug_internals = require('debug')('mngr-ui-admin:apps:root:Pipeline:internal:Internals');

const	path = require('path')


const InputPollerRethinkDBTables = require('./input/rethinkdb.tables')

let cron = require('node-cron')

module.exports = function(payload){
	// //console.log('IO', io)
  // let {conn, domain, cache, ui} = payload
  let {conn} = payload

  debug_internals('require %o', payload)

  let conf = {
  	input: [
      {
  			poll: {
  				suspended: true,//start suspended
  				id: "input.tables",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                // path_key: 'os',
                module: InputPollerRethinkDBTables,
                // type: 'all'
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
  						// //////////console.log('domain periodical running')
      				return cron.schedule('*/10 * * * * *', dispatch);//every 5 sec
      			}
      		},
  			},
  		},

  	],
    // filters: [
    //   function(doc, one, two, pipeline){
    //     doc = [doc]
    //     debug_internals('filter', doc)
    //     pipeline.output(doc)
    //   }
  	// ],
  	// output: [
    //   function(doc){
    //     debug_internals('output', doc)
    //   }
  	// ]
  }


  return conf
}
