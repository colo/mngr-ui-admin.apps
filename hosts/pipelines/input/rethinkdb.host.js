'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Host:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

module.exports = new Class({
  Extends: App,

  changes_buffer: [],
  changes_buffer_expire: undefined,

  options: {

		requests : {
      once: [

        {
					search_paths: function(req, next, app){
						debug_internals('search_paths');

            app.reduce({
              _extras: {prop: 'paths', host: 'colo'},
              uri: app.options.db+'/periodical',
              args: function(left, right) {
                  return left.merge(right)
              },

              query: app.r.db(app.options.db).table('periodical').getAll('colo', {index: 'host'}).map(function(doc) {
                return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
              }.bind(app))
            })

					}
				},
      ],

      // periodical: [
      //   {
			// 		search_paths: function(req, next, app){
			// 			debug_internals('search_paths');
      //
      //       app.reduce({
      //         _extras: {prop: 'paths', host: 'colo'},
      //         uri: app.options.db+'/periodical',
      //         args: function(left, right) {
      //             return left.merge(right)
      //         },
      //
      //         query: app.r.db(app.options.db).table('periodical').getAll('colo', {index: 'host'}).map(function(doc) {
      //           return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
      //         }.bind(app))
      //       })
      //
			// 		}
			// 	},
      //
      // ],

		},

		routes: {
      reduce: [{
        path: ':database/:table',
        callbacks: ['reduce']
      }],
      // distinct: [{
      //   path: ':database/:table',
      //   callbacks: ['distinct']
      // }],
      changes: [{
        path: ':database/:table',
        callbacks: ['changes']
      }],

		},


  },

  initialize: function(options){
    // let paths = []
    // Array.each(options.paths, function(path){
    //   if(this.paths.test(path) == true)
    //     paths.push(path)
    // }.bind(this))
    //
    // options.paths = paths

  	this.parent(options);//override default options


    // this.addEvent('onResume', this.register_on_changes.bind(this))

		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:hosts:Pipeline:Host:Input', 'info', 'mngr-ui-admin:apps:hosts:Pipeline:Host:Input started');
  },
  reduce: function(err, resp, params){
    debug_internals('reduce', params.options)

    if(err){
      debug_internals('distinct err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			this.fireEvent(this.ON_DOC_ERROR, err);

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    else{
      let extras = params.options._extras
      let host = extras.host
      let prop = extras.prop

      debug_internals('reduce', Object.keys(resp))

      let result = {}
      result[prop] = Object.keys(resp)
      this.fireEvent('onDoc', [result, Object.merge({input_type: this, app: null}, {host: host, type: 'host', prop: prop})])

      // resp.toArray(function(err, arr){
      //
      //   // debug_internals('getAll', this.r.map(arr, function(doc) {
      //   //   return this.r.object(doc("metadata")("path"), true) // return { metadata.path: true}
      //   // }.bind(this)).reduce(function(left, right) {
      //   //     return left.merge(right)
      //   // }.bind(this)).keys())
      //
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
  //   resp.each(function(err, row){
  //     // debug_internals('changes %s', new Date())
  //
  //     if(row.type == 'add'){
  //       // console.log(row.new_val)
  //       // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: 'periodical', input_type: this, app: null}]);
  //       this.changes_buffer.push(row.new_val)
  //     }
  //
  //     if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
  //       // console.log('onPeriodicalDoc', this.changes_buffer.length)
  //       this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: 'periodical', input_type: this, app: null}])
  //       this.changes_buffer_expire = Date.now()
  //       this.changes_buffer = []
  //     }
  //
  //       // let type = params.options._extras.type
  //       // let id = params.options._extras.id
  //       // let event = type.charAt(0).toUpperCase() + type.slice(1)
  //       //
  //       // this.fireEvent('on'+event+'Doc', [Array.clone(arr), {id: id, type: type, input_type: this, app: null}]);
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
  //      _extras: {type: 'periodical'},
  //      uri: this.options.db+'/periodical',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('periodical').getAll(this.options.stat_host, {index:'host'})
  //      query: this.r.db(this.options.db).table('periodical').distinct({index: 'host'})
  //
  //
  //   })
  //
  // }



});
