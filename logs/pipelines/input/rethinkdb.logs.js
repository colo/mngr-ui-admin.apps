'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

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

  // changes_buffer: [],
  // changes_buffer_expire: undefined,
  logs: [],

  FROM: 'periodical',
  RANGES: {
    'periodical': 10000,
    'historical': 60000,

  },
  options: {

		requests : {
      once: [
        {
					distinct_index: function(req, next, app){
						debug_internals('property', req.id);
            let distinct_indexes = req.prop || app.distinct_indexes
            if(!Array.isArray(distinct_indexes))
              distinct_indexes = [distinct_indexes]


            // app.distinct({
            //   _extras: {type: 'logs', id: req.id},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'log'}
            // })
            let from = req.from || app.FROM
            from = (from === 'minute' || from === 'hour') ? 'historical' : from
            /**
            * reducing last minute of logs should be enough, and is way faster than "distinct" from all docs
            **/
            // app.reduce({
            //   _extras: {from: from, type: 'logs', id: req.id},
            //   uri: app.options.db+'/'+from,
            //   args: function(left, right) {
            //       return left.merge(right)
            //   },
            //
            //   query: app.r.db(app.options.db).
            //           table(from).
            //           // between(
            //           //   Date.now() - app.RANGES[from], //60000
            //           //   Date.now(),
            //           //   {index: 'timestamp'}
            //           // ).
            //           map(function(doc) {
            //             return app.r.object(doc("metadata")("tag"), true) // return { <country>: true}
            //           }.bind(app))
            // })

            Array.each(distinct_indexes, function(index){
              app.distinct({
                _extras: {
                  from: from,
                  type: (req.prop) ? req.prop : 'logs',
                  id: req.id,
                  prop: pluralize(index)},
                uri: app.options.db+'/periodical',
                args: {index: index}
              })
            }.bind(app))




					}
				},


      ],

      /**
      * periodical data always comes from 'periodical' table
      **/
      periodical: [
      //   {
			// 		tags: function(req, next, app){
			// 			debug_internals('tags');
      //
      //       /**
      //       * reducing last minute of tags should be enough, and is way faster than "distinct" from all docs
      //       **/
      //       // app.reduce({
      //       //   _extras: {from: 'periodical', type: 'tags', id: undefined},
      //       //   uri: app.options.db+'/periodical',
      //       //   args: function(left, right) {
      //       //       return left.merge(right)
      //       //   },
      //       //
      //       //   query: app.r.db(app.options.db).table('periodical').between(Date.now() - app.RANGES['periodical'], Date.now(), {index: 'timestamp'}).map(function(doc) {
      //       //     return app.r.object(doc("metadata")("tag"), true) // return { <country>: true}
      //       //   }.bind(app))
      //       // })
      //
      //       app.distinct({
      //         _extras: {from: from, type: 'logs', id: undefined},
      //         uri: app.options.db+'/periodical',
      //         args: {index: 'tags'}
      //       })
      //
			// 		}
			// 	},

      ],

		},

		routes: {

      // distinct: [{
      //   path: ':database/:table',
      //   callbacks: ['distinct']
      // }],
      distinct: [{
        path: ':database/:table',
        callbacks: ['distinct']
      }],
      // changes: [{
      //   // path: ':database/:table',
      //   path: '',
      //   callbacks: ['changes']
      // }],

		},


  },

  distinct_indexes: ['tag', 'type', 'host', 'domain',],
  logs_props: {},

  initialize: function(options){
    // let paths = []
    // Array.each(options.paths, function(path){
    //   if(this.paths.test(path) == true)
    //     paths.push(path)
    // }.bind(this))
    //
    // options.paths = paths

  	this.parent(options);//override default options


    // this.addEvent('onConnect', this.register_on_changes.bind(this))
    // this.register_on_changes.bind(this)

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Logs:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Logs:Input started');
  },

  distinct: function(err, resp, params){
    debug_internals('distinct', err, resp)


    let extras = params.options._extras
    let domain = extras.domain
    let prop = extras.prop
    let type = extras.type
    let id = extras.id

    extras.type = (id === undefined) ? 'prop' : 'logs'

    // extras[extras.type] = this.logs_props

    // if(!this.domains[domain] || type == 'prop') this.domains[domain] = {}

    // this.domains[domain][prop] = (resp) ? Object.keys(resp) : null



    if(err){
      debug_internals('distinct err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			this.fireEvent(this.ON_DOC_ERROR, [err, extras]);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				[err, extras]
			);
    }
    else{
      // let type = params.options._extras.type


      // let arr = (resp) ? Object.keys(resp) : null
      resp.toArray(function(err, arr){
        // resp.toArray(function(err, arr){

        debug_internals('distinct count', arr)
        this.logs_props[extras.prop] = arr
        extras[extras.type] = this.logs_props

        if(extras.type === 'logs')
          delete extras.prop

        let properties = this.distinct_indexes
        if(type == 'prop' || (Object.keys(this.logs_props).length == properties.length)){
          let found = false
          Object.each(this.logs_props, function(data, property){//if at least a property has data, domain exist
            if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
              found = true
          })

          if(err){
            // let err = {}
            // err['status'] = 404
            // err['message'] = 'not found'
            this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
          }
          else if(!found){
            let err = {}
            err['status'] = 404
            err['message'] = 'not found'
            this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
          }
          else{

            this.fireEvent(this.ON_DOC, [extras, Object.merge({input_type: this, app: null})]);
          }

          // this.fireEvent('onDoc', [(found) ? this.domains[domain] : null, Object.merge(
          //   {input_type: this, app: null},
          //   extras,
          //   // {type: 'domain'}
          //   {type: (id === undefined) ? 'paths' : 'domain'}
          //   // {domain: domain, type: 'domain', prop: prop, id: id}
          // )])
          this.logs_props = {}
        }



      // }

        // if(err){
        //   // let err = {}
        //   // err['status'] = 404
        //   // err['message'] = 'not found'
        //   this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
        // }
        // else if(arr.length == 0){
        //   let err = {}
        //   err['status'] = 404
        //   err['message'] = 'not found'
        //   this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
        // }
        // else{
        //   this.fireEvent(this.ON_DOC, [extras, Object.merge({input_type: this, app: null})]);
        // }
      }.bind(this))


        // if(arr.length == 0){
				// 	debug_internals('No tags yet');
				// }
				// else{
        //   let equal = false
        //
				// 	if(extras.id == undefined && this.tags.length > 0 && this.tags.length == arr.length){
        //     debug_internals('check equality %s', extras.id)
        //     equal = arr.every(function(item, index){
        //       return this.tags.contains(item)
        //     }.bind(this))
        //   }
        //
        //   // if(equal == false){
        //     debug_internals('HOSTs %o', arr)
        //     this.tags = arr
        //     this.fireEvent('onDoc', [Array.clone(arr), Object.merge({input_type: this, app: null}, Object.clone(extras))]);
        //   // }
        //
				// }
        // }

      // }.bind(this))


    }
  },
  // changes: function(err, resp, params){
  //   debug_internals('changes %o %o %o %s', err, resp, params, new Date())
  //
  //   let _close = function(){
  //     resp.close()
  //     this.removeEvent('onSuspend', _close)
  //   }.bind(this)
  //
  //   this.addEvent('onSuspend', _close)
  //
  //   if(!this.changes_buffer_expire)
  //     this.changes_buffer_expire = Date.now()
  //
  //   let extras = params.options._extras
  //
  //   resp.each(function(err, row){
  //
  //     debug_internals('changes %s', new Date(), row)
  //
  //     if(row.type == 'add'){
  //       // console.log(row.new_val)
  //       // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: 'periodical', input_type: this, app: null}]);
  //       if(!this.changes_buffer.contains(row.new_val.metadata.tag))
  //         this.changes_buffer.push(row.new_val.metadata.tag)
  //     }
  //
  //     if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
  //       // console.log('onPeriodicalDoc', this.changes_buffer.length)
  //       // this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: 'periodical', input_type: this, app: null}])
  //       this.fireEvent('onDoc', [Array.clone(this.changes_buffer), Object.merge({input_type: this, app: null}, Object.clone(extras))]);
  //       this.changes_buffer_expire = Date.now()
  //       this.changes_buffer = []
  //     }
  //
  //   }.bind(this));
  // },
  // register_on_changes: function(){
  //   debug_internals('register_on_changes')
  //   /**
  //   * @hardcoded: sqash: 1.1 => "sqash all changes between a 1100 ms"
  //   * should be "aligned" with dashboard refreshs?
  //   **/
  //   this.changes({
  //      _extras: {type: 'tags', id: undefined},
  //      // uri: this.options.db+'/periodical',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('periodical').distinct({index: 'tag'})
  //      query: this.r.db(this.options.db).
  //       table('periodical').
  //       pluck({'metadata': 'tag'})
  //
  //
  //   })
  //   // app.between({
  //   //   _extras: 'tag',
  //   //   uri: app.options.db+'/periodical',
  //   //   args: [
  //   //     roundMilliseconds(Date.now() - 1000),
  //   //     roundMilliseconds(Date.now()),
  //   //     {
  //   //       index: 'timestamp',
  //   //       leftBound: 'open',
  //   //       rightBound: 'open'
  //   //     }
  //   //   ]
  //   // })
  //
  // }



});
