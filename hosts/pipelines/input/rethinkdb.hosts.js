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

  changes_buffer: [],
  changes_buffer_expire: undefined,

  options: {

		requests : {
      once: [
        {
					search_hosts: function(req, next, app){
						debug_internals('search_hosts');

            app.distinct({
              _extras: {type: 'hosts', id: req.id},
              uri: app.options.db+'/periodical',
              args: {index: 'host'}
            })

					}
				},

      ],

      periodical: [
        {
					search_hosts: function(req, next, app){
						debug_internals('search_hosts');

            app.distinct({
              _extras: {type: 'hosts'},
              uri: app.options.db+'/periodical',
              args: {index: 'host'}
            })

					}
				},

      ],

		},

		routes: {

      distinct: [{
        path: ':database/:table',
        callbacks: ['distinct']
      }],
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

		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input', 'info', 'mngr-ui-admin:apps:hosts:Pipeline:Hosts:Input started');
  },

  distinct: function(err, resp, params){
    debug_internals('distinct', params.options)

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
      resp.toArray(function(err, arr){
        debug_internals('distinct count', arr)


        // if(params.options._extras == 'path'){
        //   if(arr.length == 0){
  			// 		debug_internals('No paths yet');
  			// 	}
  			// 	else{
        //
        //     this.paths = []
        //
  			// 		Array.each(arr, function(row, index){
  			// 			// debug_internals('Path %s', row);
        //
        //       if(
        //         (
        //           !this.blacklist_path
        //           || (this.blacklist_path && this.blacklist_path.test(row) == false)
        //         )
        //         && !this.paths.contains(row)
        //       )
        //         this.paths.push(row)
        //
  			// 		}.bind(this));
        //
  			// 		debug_internals('PATHs %o', this.paths);
  			// 	}
  			// }
        // else
        // if(extras.type == 'hosts'){
          if(arr.length == 0){
  					debug_internals('No hosts yet');
  				}
  				else{

  					// Array.each(arr, function(row, index){
  					// 	let host = row
            //   if(this.hosts[host] == undefined) this.hosts[host] = {}
            //
  					// }.bind(this));

  					debug_internals('HOSTs %o', arr)
            this.fireEvent('onDoc', [Array.clone(arr), Object.merge({input_type: this, app: null}, Object.clone(extras))]);
            // this.fireEvent('onDoc', [Array.clone(arr)]);
  				}
        // }

      }.bind(this))


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
