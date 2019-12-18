'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Domains:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Domains:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

module.exports = new Class({
  Extends: App,

  // changes_buffer: [],
  // changes_buffer_expire: undefined,
  domains: [],

  FROM: 'periodical',
  RANGES: {
    'periodical': 10000,
    'historical': 60000,

  },
  options: {

		requests : {
      once: [
        {
					search_domains: function(req, next, app){
						debug_internals('search_domains', req.id);

            // app.distinct({
            //   _extras: {type: 'domains', id: req.id},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'domain'}
            // })
            let from = req.from || app.FROM
            from = (from === 'minute' || from === 'hour') ? 'historical' : from
            /**
            * reducing last minute of domains should be enough, and is way faster than "distinct" from all docs
            **/
            app.reduce({
              _extras: {from: from, type: 'domains', id: req.id},
              uri: app.options.db+'/'+from,
              args: function(left, right) {
                  return left.merge(right)
              },

              query: app.r.db(app.options.db).
                      table(from).
                      // between(
                      //   Date.now() - app.RANGES[from], //60000
                      //   Date.now(),
                      //   {index: 'timestamp'}
                      // ).
                      map(function(doc) {
                        return app.r.object(doc("metadata")("domain"), true) // return { <country>: true}
                      }.bind(app))
            })

            // app.distinct({
            //   _extras: {type: 'domains', id: undefined},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'domain'}
            // })



					}
				},

      ],

      /**
      * periodical data always comes from 'periodical' table
      **/
      periodical: [
        {
					search_domains: function(req, next, app){
						debug_internals('search_domains');

            /**
            * reducing last minute of domains should be enough, and is way faster than "distinct" from all docs
            **/
            app.reduce({
              _extras: {from: 'periodical', type: 'domains', id: undefined},
              uri: app.options.db+'/periodical',
              args: function(left, right) {
                  return left.merge(right)
              },

              query: app.r.db(app.options.db).table('periodical').between(Date.now() - app.RANGES['periodical'], Date.now(), {index: 'timestamp'}).map(function(doc) {
                return app.r.object(doc("metadata")("domain"), true) // return { <country>: true}
              }.bind(app))
            })

            // app.distinct({
            //   _extras: {type: 'domains', id: undefined},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'domain'}
            // })

					}
				},

      ],

		},

		routes: {

      // distinct: [{
      //   path: ':database/:table',
      //   callbacks: ['distinct']
      // }],
      reduce: [{
        path: ':database/:table',
        callbacks: ['domains']
      }],
      // changes: [{
      //   // path: ':database/:table',
      //   path: '',
      //   callbacks: ['changes']
      // }],

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


    // this.addEvent('onConnect', this.register_on_changes.bind(this))
    // this.register_on_changes.bind(this)

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Domains:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Domains:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Domains:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Domains:Input started');
  },

  domains: function(err, resp, params){
    debug_internals('domains', err, resp)
    let extras = params.options._extras

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


      let arr = (resp) ? Object.keys(resp) : null

      // resp.toArray(function(err, arr){
      debug_internals('distinct count', arr)
      extras[extras.type] = arr

      // this.fireEvent(this.ON_DOC_ERROR, [{message: 'some error'}, extras]);
      if(arr.length == 0 ){
        let err = {}
        err['status'] = 404
        err['message'] = 'not found'
        this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
      }
      else{
        this.fireEvent(this.ON_DOC, [extras, Object.merge({input_type: this, app: null})]);
      }

        // if(arr.length == 0){
				// 	debug_internals('No domains yet');
				// }
				// else{
        //   let equal = false
        //
				// 	if(extras.id == undefined && this.domains.length > 0 && this.domains.length == arr.length){
        //     debug_internals('check equality %s', extras.id)
        //     equal = arr.every(function(item, index){
        //       return this.domains.contains(item)
        //     }.bind(this))
        //   }
        //
        //   // if(equal == false){
        //     debug_internals('HOSTs %o', arr)
        //     this.domains = arr
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
  //       if(!this.changes_buffer.contains(row.new_val.metadata.domain))
  //         this.changes_buffer.push(row.new_val.metadata.domain)
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
  //      _extras: {type: 'domains', id: undefined},
  //      // uri: this.options.db+'/periodical',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('periodical').distinct({index: 'domain'})
  //      query: this.r.db(this.options.db).
  //       table('periodical').
  //       pluck({'metadata': 'domain'})
  //
  //
  //   })
  //   // app.between({
  //   //   _extras: 'domain',
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
