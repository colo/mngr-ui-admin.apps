'use strict'

// const App = require ( '../../node_modules/node-app-rethinkdb-client/index' )
const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('apps:os:pipelines:input:rethink.os'),
    debug_internals = require('debug')('apps:os:pipelines:input:rethink.os:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

module.exports = new Class({
  Extends: App,

  paths: /^os.*/,
  changes_buffer: [],
  changes_buffer_expire: undefined,
  _multi_response: {},

  options: {
    // rethinkdb: {
    //   request: require('cachemachine')({redis: true, hostname: 'elk'})
    // },

    paths: [],
    stat_host: null,
    range_path: undefined,

    path_key: null,
    path_start_key: null,
    path_end_key: null,

    // paths_blacklist: /^os\.procs.*/,
    paths_blacklist: undefined,

    range: [
      Date.now() - 300000,
      Date.now()
    ],

		requests : {
      once: [
        {
          /**
          * used to get stats on "init", process'em and process charts
          **/
					sort_by_host_or_path: function(req, next, app){
            console.log('sort_by_host_or_path ONCE %o %s', req, app.options.stat_host)
            let path = req.path
            if(app.options.stat_host){

              if(path){
                let _get_by_path = function(path, extras){
                  app.between({
                    _extras: extras,
                    uri: app.options.db+'/periodical',
                    args: [
                      [path, app.options.stat_host, "periodical",roundMilliseconds(Date.now() - 1000)],
                      [path, app.options.stat_host, "periodical", roundMilliseconds(Date.now() + 0)],
                      {
                        index: 'sort_by_path',
                        leftBound: 'open',
                        rightBound: 'open'
                      }
                    ],
                    // orderBy: {index: 'sort_by_path'}
                  })
                }

                if(Array.isArray(path)){
                  Array.each(path, function(_path, index){
                    _get_by_path(_path, {id: req.id, type: 'once', multipath: {index: index, length: path.length}})
                  })
                }
                else{
                  _get_by_path(path, {id: req.id, type: 'once'})
                }



              }
              else{
                app.between({
                  _extras: {id: req.id, type: 'once'},
                  uri: app.options.db+'/periodical',
                  args: [
                    [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
                    [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
                    {
                      index: 'sort_by_host',
                      leftBound: 'open',
                      rightBound: 'open'
                    }
                  ],
                  // orderBy: {index: 'sort_by_host'}
                })

              }



            }

					}
				}
      ],
      range: [

        {
          /**
          * used to get stats on "init", process'em and process charts
          **/
					sort_by_host_or_path: function(req, next, app){
            // console.log('sort_by_host_or_path RANGE', app.options.stat_host, req)

             let path = req.path
             let range = req.opt.range


            if(app.options.stat_host){
              // let CHUNK = 60000
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start



              if(path){
                let _get_by_path = function(path, extras){
                  app.between({
                    _extras: extras,
                    uri: app.options.db+'/periodical',
                    args: [
                      [path, app.options.stat_host, "periodical", roundMilliseconds(start)],
                      [path, app.options.stat_host, "periodical",roundMilliseconds(end)],
                      {
                        index: 'sort_by_path',
                        leftBound: 'open',
                        rightBound: 'open'
                      }
                    ],
                    orderBy: {index: 'sort_by_path'}
                  })
                }

                if(Array.isArray(path)){
                  Array.each(path, function(_path, index){
                    _get_by_path(_path, {id: req.id, type: 'range', multipath: {index: index, length: path.length}})
                  })
                }
                else{
                  _get_by_path(path, {id: req.id, type: 'range'})
                }

              }
              else{
                app.between({
                  _extras: {id: req.id, type: 'range'},
                  uri: app.options.db+'/periodical',
                  args: [
                    [app.options.stat_host, "periodical",roundMilliseconds(start)],
                    [app.options.stat_host, "periodical", roundMilliseconds(end)],
                    {
                      index: 'sort_by_host',
                      leftBound: 'open',
                      rightBound: 'open'
                    }
                  ],
                  orderBy: {index: 'sort_by_host'}
                })

              }


            }

					}
				}

			],
			// periodical: [
      //   {
      //     sort_by_host: function(req, next, app){
      //     }
      //   }
      //   // {
			// 	// 	sort_by_host: function(req, next, app){
      //   //
      //   //     if(app.options.stat_host){
      //   //       // let start_key = (app.options.path_start_key != null) ? app.options.path_start_key: app.options.path_key
      //   //       // let end_key = (app.options.path_end_key != null ) ? app.options.path_end_key : app.options.path_key
      //   //
      //   //       /**
      //   //       * limit for 'os',
      //   //       * unlimit for 'munin'
      //   //       */
      //   //
      //   //       // Array.each(app.options.paths, function(path){
      //   //
      //   //         // if(!app.options.paths_blacklist || app.options.paths_blacklist.test( path ) == false){
      //   //         //   ////console.log('rethinkdb.os path', path)
      //   //
      //   //         app.between({
      //   //           _extras: {type: 'periodical'},
      //   //           uri: app.options.db+'/periodical',
      //   //           args: [
      //   //             [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
      //   //             [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
      //   //             {
      //   //               index: 'sort_by_host',
      //   //               leftBound: 'open',
      //   //               rightBound: 'open'
      //   //             }
      //   //           ]
      //   //         })
      //   //     }
      //   //
			// 	// 	}
			// 	// }
      //
			// ],

		},

		routes: {
      between: [{
        path: ':database/:table',
        callbacks: ['between']
      }],
      changes: [{
        path: ':database/:table',
        callbacks: ['changes']
      }],
			// request: [
			// 	{
			// 		path: '',
			// 		callbacks: ['request'],
			// 	}
			// ],
			// view: [
			// 	{
			// 		path: ':database',
			// 		callbacks: ['view'],
			// 		//version: '',
			// 	},
			// ]
		},


  },
  between: function(err, resp, params){
    // debug_internals('between', arguments)
    // resp.each(function(err, row) {
    //     if (err) throw err;
    //     debug_internals('between', row)
    // });
    if(err){
    }
    else{
      resp.toArray(function(err, arr){
        // debug_internals('between toArray', arr)


        let type = params.options._extras.type
        let id = params.options._extras.id
        let event = type.charAt(0).toUpperCase() + type.slice(1)

        if(params.options._extras.multipath){
          let id = params.options._extras.id
          let index = params.options._extras.multipath.index
          if(!this._multi_response[id]) this._multi_response[id] = []

          debug_internals('between toArray %o', params.options._extras.id, params.options._extras.multipath, this._multi_response[id].length)

          // if(params.options._extras.multipath.index == 0){
          //   this._multi_response = arr
          // }
          // else{


          this._multi_response[id].push( arr )

          if(this._multi_response[id].length == params.options._extras.multipath.length){
            let result = []
            Array.each(this._multi_response[id], function(resp){
              result.append(resp)
            })
            this.fireEvent('on'+event+'Doc', [result, {id: id, type: type, input_type: this, app: null}]);

            delete this._multi_response[id]
          }
          // }

        }
        else{
          this.fireEvent('on'+event+'Doc', [Array.clone(arr), {id: id, type: type, input_type: this, app: null}]);
        }


        // if(params.options._extras == 'count'){
        //   this.fireEvent('onPeriodicalDoc', [{type: params.options._extras, value: arr.length }, {type: 'periodical', input_type: this, app: null}]);
        // }
        // else{
        //   let result = []
        //
        //   Array.each(arr, function(row, index){
        //     if(!result.contains(row.metadata[params.options._extras]))
        //       result.push(row.metadata[params.options._extras])
        //
        //     // debug_internals('between '+params.options._extras, result)
        //     //   row.metadata[params.options._extras]
        //     if(index == arr.length -1 ){
        //       debug_internals('between '+params.options._extras, result)
        //       this.fireEvent('onPeriodicalDoc', [{type: params.options._extras+'s', value: result }, {type: 'periodical', input_type: this, app: null}]);
        //     }
        //   }.bind(this))
        //
        //
        //
        // }

      }.bind(this))
    }



    // debug_internals('count', this.r.count(resp))

  },
  // view: function(err, resp, view){
  //   if(view.options._extras.type == 'range')
	// 	  console.log('this.view ', err, resp.rows.length, view.options);
  //   // console.log('this.view ', err, view.options);
  //
	// 	if(err){
	// 		//console.log('this.sort_by_path error %o', err);
  //
	// 	}
	// 	else{
  //     let type = view.options._extras.type
  //     let id = view.options._extras.id
  //     let event = type.charAt(0).toUpperCase() + type.slice(1)
  //
  //     this.fireEvent('on'+event+'Doc', [Array.clone(resp.rows), {id: id, type: type, input_type: this, app: null}]);
  //
	// 	}
  // },
  initialize: function(options){
    let paths = []
    Array.each(options.paths, function(path){
      if(this.paths.test(path) == true)
        paths.push(path)
    }.bind(this))

    options.paths = paths

    //////////console.log('input.poller.rethinkdb.os', options)
		this.parent(options);//override default options

    // let _register = function(){
    //   debug_internals('_register')
    //   // this.removeEvent('onResume', _register)
    //   this.register_on_changes()
    // }.bind(this)

    this.addEvent('onResume', this.register_on_changes.bind(this))
    // this.addEvent('onResume', _register)
    // this.addEvent('onSuspend', () => this.removeEvent('onResume', this.register_on_changes.bind(this)))
    // this.addEvent('onConnect', this.register_on_changes.bind(this))

    // this.addEvent('onExit', function(){
    //   console.log('EXITING...')
    //
    //   this.fireEvent('onSuspend')
    // })

		this.profile('root_init');//start profiling


		this.profile('root_init');//end profiling

		this.log('root', 'info', 'root started');
  },
  changes: function(err, resp, params){
    debug_internals('changes %o %o %o %s', err, resp, params, new Date())

    let _close = function(){
      resp.close()
      this.removeEvent('onSuspend', _close)
    }.bind(this)

    this.addEvent('onSuspend', _close)

    if(!this.changes_buffer_expire)
      this.changes_buffer_expire = Date.now()

    resp.each(function(err, row){
      // debug_internals('changes %s', new Date())

      if(row.type == 'add'){
        // console.log(row.new_val)
        // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: 'periodical', input_type: this, app: null}]);
        this.changes_buffer.push(row.new_val)
      }

      if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
        // console.log('onPeriodicalDoc', this.changes_buffer.length)
        this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: 'periodical', input_type: this, app: null}])
        this.changes_buffer_expire = Date.now()
        this.changes_buffer = []
      }

        // let type = params.options._extras.type
        // let id = params.options._extras.id
        // let event = type.charAt(0).toUpperCase() + type.slice(1)
        //
        // this.fireEvent('on'+event+'Doc', [Array.clone(arr), {id: id, type: type, input_type: this, app: null}]);

    }.bind(this));
  },
  register_on_changes: function(){
    debug_internals('register_on_changes')
    /**
    * @hardcoded: sqash: 1.1 => "sqash all changes between a 1100 ms"
    * should be "aligned" with dashboard refreshs?
    **/
    this.changes({
       _extras: {type: 'periodical'},
       uri: this.options.db+'/periodical',
       args: {includeTypes: true, squash: 1.1},
       query: this.r.db(this.options.db).table('periodical').getAll(this.options.stat_host, {index:'host'})

       // query: this.r.db(this.options.db).table('periodical').between(
       //   [this.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
       //   [this.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
       //   {
       //     index: 'sort_by_host',
       //     leftBound: 'open',
       //     rightBound: 'open'
       //   }
       // )
    })
    // app.between({
    //           _extras: {type: 'periodical'},
    //           uri: app.options.db+'/periodical',
    //           args: [
    //             [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
    //             [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
    //             {
    //               index: 'sort_by_host',
    //               leftBound: 'open',
    //               rightBound: 'open'
    //             }
    //           ]
    //         })
  }
  // connect: function(){
  //
	// },


});
