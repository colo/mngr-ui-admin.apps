'use strict'

const	path = require('path')
// const App = require ( 'node-app-rethinkdb-client/index' )
const App = require(path.join(process.cwd(), '/libs/pipeline/inputs/rethinkdb'))

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

const pluralize = require('pluralize')

module.exports = new Class({
  Extends: App,

  options: {
    type: 'logs',

  },

  custom: ['range', 'data_range'],
  distinct_indexes: ['tag', 'type', 'host', 'domain'],

  initialize: function(options){
    // let paths = []
    // Array.each(options.paths, function(path){
    //   if(this.paths.test(path) == true)
    //     paths.push(path)
    // }.bind(this))
    //
    // options.paths = paths

  	this.parent(options);//override default options

    this.options.requests.once.push({data_range: this.data_range})

    // this.addEvent('onConnect', this.register_on_changes.bind(this))
    // this.register_on_changes.bind(this)

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Logs:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Logs:Input started');
  },
  data_range: function(req, next, app){

    if(!req.params || !req.params.prop || req.params.prop == 'data_range'){
      debug_internals('data_range', req);
      let from = req.from || app.FROM
      from = (from === 'minute' || from === 'hour') ? 'historical' : from

      //get last
      app.nth({
        _extras: {
          from: from,
          id: req.id,
          prop: 'data_range',
          range_select : 'end',
          // domain: req.params.domain,
          type: (req.params && req.params.prop) ? 'prop' : 'logs',
        },
        uri: app.options.db+'/'+from,
        args: -1,
        query: app.r.db(app.options.db).table(req.from)
        .orderBy({index: 'logs_by_data.timestamp'})
        .pluck({'data': ['timestamp']})
        // between(
        //   // [req.params.domain, 'periodical', app.r.now().toEpochTime().mul(1000).sub(5000)],//last 5 secs
        //   [req.params.domain, req.from, 0],//last 5 secs
        //   [req.params.domain, req.from, ''],
        //   {index: 'timestamp'}
        // )
      })

      //get first
      app.nth({
        _extras: {
          from: from,
          id: req.id,
          prop: 'data_range',
          range_select : 'start',
          // domain: req.params.domain,
          type: (req.params && req.params.prop) ? 'prop' : 'logs',
        },
        uri: app.options.db+'/'+req.from,
        args: 0,
        query: app.r.db(app.options.db).table(req.from)
        .orderBy({index: 'logs_by_data.timestamp'})
        .pluck({'data': ['timestamp']})
        // between(
        //   [req.params.domain, req.from, 0],
        //   [req.params.domain, req.from, ''],
        //   {index: 'sort_by_domain'}
        // )
      })

    }

  }





});
