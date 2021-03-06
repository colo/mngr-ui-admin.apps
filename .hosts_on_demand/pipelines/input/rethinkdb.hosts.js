'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input:Internals');


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
  hosts: [],

  options: {

		requests : {
      once: [
        {
					search_hosts: function(req, next, app){
						debug_internals('search_hosts', req.id);

            // app.distinct({
            //   _extras: {type: 'hosts', id: req.id},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'host'}
            // })

            /**
            * reducing last minute of hosts should be enough, and is way faster than "distinct" from all docs
            **/
            app.reduce({
              _extras: {type: 'hosts', id: req.id},
              uri: app.options.db+'/periodical',
              args: function(left, right) {
                  return left.merge(right)
              },

              query: app.r.db(app.options.db).
                      table('periodical').
                      between(
                        Date.now() - 10000, //60000
                        Date.now(),
                        {index: 'timestamp'}
                      ).
                      map(function(doc) {
                        return app.r.object(doc("metadata")("host"), true) // return { <country>: true}
                      }.bind(app))
            })



					}
				},

      ],

      periodical: [
        {
					search_hosts: function(req, next, app){
						debug_internals('search_hosts');

            /**
            * reducing last minute of hosts should be enough, and is way faster than "distinct" from all docs
            **/
            app.reduce({
              _extras: {type: 'hosts', id: undefined},
              uri: app.options.db+'/periodical',
              args: function(left, right) {
                  return left.merge(right)
              },

              query: app.r.db(app.options.db).table('periodical').between(Date.now() - 60000, Date.now(), {index: 'timestamp'}).map(function(doc) {
                return app.r.object(doc("metadata")("host"), true) // return { <country>: true}
              }.bind(app))
            })

            // app.distinct({
            //   _extras: {type: 'hosts', id: undefined},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'host'}
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
        callbacks: ['hosts']
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

		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input', 'info', 'mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input started');
  },

  hosts: function(err, resp, params){
    debug_internals('hosts', err, resp)

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
      // let type = params.options._extras.type
      let extras = params.options._extras

      let arr = (resp) ? Object.keys(resp) : null

      // resp.toArray(function(err, arr){
      debug_internals('distinct count', arr)
      this.fireEvent('onDoc', [arr, Object.merge({input_type: this, app: null}, extras)]);

        // if(arr.length == 0){
				// 	debug_internals('No hosts yet');
				// }
				// else{
        //   let equal = false
        //
				// 	if(extras.id == undefined && this.hosts.length > 0 && this.hosts.length == arr.length){
        //     debug_internals('check equality %s', extras.id)
        //     equal = arr.every(function(item, index){
        //       return this.hosts.contains(item)
        //     }.bind(this))
        //   }
        //
        //   // if(equal == false){
        //     debug_internals('HOSTs %o', arr)
        //     this.hosts = arr
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
  //       if(!this.changes_buffer.contains(row.new_val.metadata.host))
  //         this.changes_buffer.push(row.new_val.metadata.host)
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
  //      _extras: {type: 'hosts', id: undefined},
  //      // uri: this.options.db+'/periodical',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('periodical').distinct({index: 'host'})
  //      query: this.r.db(this.options.db).
  //       table('periodical').
  //       pluck({'metadata': 'host'})
  //
  //
  //   })
  //   // app.between({
  //   //   _extras: 'host',
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
