'use strict'

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Internals');

const InputPollerRethinkDBLogs = require ( './input/rethinkdb.logs.js' )
// const InputPollerRethinkDBDomains = require ( './input/rethinkdb.domains.js' )
// const InputPollerRethinkDBLogsDomain = require ( './input/rethinkdb.logs.domain.js' )
// const InputPollerRethinkDBDomainHistorical = require ( './input/rethinkdb.domain.historical.js' )

// const InputPollerRedisDomain = require ( './input/redis.log.js' )

// const InputCache = require ( './input/cache.js' )
//
// let PollHttp = require('js-pipeline/input/poller/poll/http')
//
// let UIPollHttp = require('node-app-http-client/load')(PollHttp)


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
  				id: "logs",
  				conn: [
            Object.merge(
              Object.clone(conn),
              {
                // path_key: 'os',
                module: InputPollerRethinkDBLogs,
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
      				return cron.schedule('*/5 * * * * *', dispatch);//every 5 sec
      			}
      		},
  			},
  		},
  		// {
  		// 	poll: {
  		// 		suspended: true,//start suspended
  		// 		id: "domains",
  		// 		conn: [
      //       Object.merge(
      //         Object.clone(conn),
      //         {
      //           // path_key: 'os',
      //           module: InputPollerRethinkDBDomains,
      //         }
      //       )
  		// 		],
  		// 		connect_retry_count: -1,
  		// 		connect_retry_periodical: 1000,
  		// 		// requests: {
  		// 		// 	periodical: 1000,
  		// 		// },
  		// 		requests: {
      // 			periodical: function(dispatch){
  		// 				// //////////console.log('domain periodical running')
      // 				return cron.schedule('* * * * * *', dispatch);//every 5 sec
      // 			}
      // 		},
  		// 	},
  		// },
      // {
  		// 	poll: {
  		// 		suspended: true,//start suspended
  		// 		id: "logs.domain",
  		// 		conn: [
      //       Object.merge(
      //         Object.clone(conn),
      //         {
      //           // path_key: 'os',
      //           module: InputPollerRethinkDBLogsDomain,
      //         }
      //       )
  		// 		],
  		// 		connect_retry_count: -1,
  		// 		connect_retry_periodical: 1000,
  		// 		// requests: {
  		// 		// 	periodical: 1000,
  		// 		// },
  		// 		requests: {
      // 			periodical: function(dispatch){
  		// 				// //////////console.log('domain periodical running')
      // 				return cron.schedule('* * * * * *', dispatch);//every 5 sec
      // 			}
      // 		},
  		// 	},
  		// },

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
