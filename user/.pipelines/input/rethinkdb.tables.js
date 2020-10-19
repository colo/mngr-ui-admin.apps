'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables'),
    debug_internals = require('debug')('mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables:Internals');


// const roundMilliseconds = function(timestamp){
//   let d = new Date(timestamp)
//   d.setMilliseconds(0)
//
//   // console.log('roundMilliseconds', d.getTime())
//   return d.getTime()
// }
//
// const pluralize = require('pluralize')
//
// const uuidv5 = require('uuid/v5')

module.exports = new Class({
  Extends: App,

  // ID: 'b1f06da2-82bd-4c95-8e4e-a5a25075e39b',
  // registered: {},
  // registered_ids: {},
  // feeds: {},
  // close_feeds: {},
  // changes_buffer: {},
  // changes_buffer_expire: {},
  // periodicals: {},
  //
  // // FROM: 'periodical',
  // RANGES: {
  //   'periodical': 10000,
  //   'historical': 60000,
  //
  // },
  options: {
    db: undefined,
    table: undefined,
    type: undefined,

		requests : {
      once: [
        {
          tables:function(req, next, app){
            debug_internals('once tables %o')//resp

            app.r.db(app.options.db).tableList().run(app.conn, {arrayLimit: 1000000}, function(err, resp){
              debug_internals('run', err, resp)//resp
              // process.exit(1)
              app.process_default(
                err,
                resp,
                {
                  _extras: {
                    // from: from,
                    // type: (req.params && req.params.path) ? req.params.path : app.options.type,
                    id: 'tables',
                    // transformation: (req.query.transformation) ? req.query.transformation : undefined,
                    // aggregation: (req.query.aggregation) ? req.query.aggregation : undefined,
                    // filter: (req.query.filter) ? req.query.filter : undefined
                    // prop: pluralize(index)
                  }
                }
              )
            })
          }
        }
      ],

      /**
      * periodical data always comes from 'periodical' table
      **/
      periodical: [
        {
          tables:function(req, next, app){
            debug_internals('periodical tables %o')//resp

            app.r.db(app.options.db).tableList().run(app.conn, {arrayLimit: 1000000}, function(err, resp){
              debug_internals('run', err, resp)//resp
              // process.exit(1)
              app.process_default(
                err,
                resp,
                {
                  _extras: {
                    // from: from,
                    // type: (req.params && req.params.path) ? req.params.path : app.options.type,
                    id: 'tables',
                    // transformation: (req.query.transformation) ? req.query.transformation : undefined,
                    // aggregation: (req.query.aggregation) ? req.query.aggregation : undefined,
                    // filter: (req.query.filter) ? req.query.filter : undefined
                    // prop: pluralize(index)
                  }
                }
              )
            })
          }
        }
      ],

      range: [


      ]

		},

		routes: {



		},


  },



  initialize: function(options){


  	this.parent(options);//override default options


    // this.addEvent('onConnect', this.register_on_changes.bind(this))
    // this.register_on_changes.bind(this)

		this.profile('mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables_init');//start profiling


		this.profile('mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables_init');//end profiling

		this.log('mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables', 'info', 'mngr-ui-admin:apps:root:Pipeline:Input:RethinkdbTables started');
  },





  process_default: function(err, resp, params){
    params = (params) ? Object.clone(params) : {}
    debug_internals('process_default', err, params)

    let metadata = params._extras
    metadata.timestamp = Date.now()
    // let type = metadata.type
    let id = metadata.id
    // let transformation = metadata.transformation
    // let aggregation = metadata.aggregation

    delete metadata.type
    delete metadata.id

    if(err){
      debug_internals('process_default err', err)
				this.fireEvent('onGetError', err);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				[err, {id: id, metadata : metadata}]
			);
    }

    if(!err && Array.isArray(resp) && resp.length === 0)
      err = {
        status: 404,
        message: 'Not Found'
      }

    if(Array.isArray(resp))
      debug_internals('ARRAY RESP', resp)

    // extras[type] = (Array.isArray(resp)) ? resp[0] : resp
    // let data = (Array.isArray(resp) && metadata.changes !== true) ? resp[0] : resp
    let data = resp

    delete metadata.prop
    delete metadata.type


    if(err){
      this.fireEvent(this.ON_DOC_ERROR, [err, {id: id, metadata : metadata}]);
    }
    else{

      this.fireEvent(this.ON_DOC, [{id: id,data: data, metadata : metadata}, Object.merge({input_type: this, app: null})]);
    }



  },



});
