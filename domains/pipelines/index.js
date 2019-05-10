'use strict'

let debug = require('debug')('mngr-ui-admin:apps:domains:Pipeline:Hosts'),
    debug_internals = require('debug')('mngr-ui-admin:apps:domains:Pipeline:Hosts:Internals');

const InputPollerRethinkDBHosts = require ( './input/rethinkdb.hosts.js' )
// const InputPollerRethinkDBHost = require ( './input/rethinkdb.host.js' )
const InputPollerRethinkDBHostHistorical = require ( './input/rethinkdb.host.historical.js' )

const InputPollerRedisHost = require ( './input/redis.host.js' )

const InputCache = require ( './input/cache.js' )

let PollHttp = require('js-pipeline/input/poller/poll/http')

let UIPollHttp = require('node-app-http-client/load')(PollHttp)


let cron = require('node-cron')

module.exports = function(payload){
	// //console.log('IO', io)
  let {conn, host, cache, ui} = payload

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
      				return cron.schedule('* * * * * *', dispatch);//every 5 sec
      			}
      		},
  			},
  		},


  	],
    filters: [

  	],
  	// output: [
    //
  	// ]
  }

  
  return conf
}
