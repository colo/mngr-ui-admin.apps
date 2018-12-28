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
                app.between({
                  _extras: {id: req.id, type: 'once'},
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
                // app.view({
                //   _extras: {id: req.id, type: 'once'},
    						// 	uri: app.options.db,
                //   args: [
                //     'sort',
                //     'by_path',
                //     {
      					// 			// startkey: [start_key, app.options.stat_host, "periodical", range.start],
      					// 			// endkey: [end_key, app.options.stat_host, "periodical",range.end],
                //       // startkey: [path, app.options.stat_host, "periodical", range.start],
                //       startkey: [path, app.options.stat_host, "periodical", roundMilliseconds(Date.now() + 0)],
      					// 			endkey: [path, app.options.stat_host, "periodical",roundMilliseconds(Date.now() - 1000)],
                //       descending: true,
      					// 			inclusive_end: true,
      					// 			include_docs: true
      					// 		}
                //   ]
    						// })
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
                // app.view({
                //   _extras: {id: req.id, type: 'once'},
    						// 	uri: app.options.db,
                //   args: [
                //     'sort',
                //     'by_host',
                //     {
      					// 			startkey: [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
      					// 			endkey: [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
                //       // limit: 1,
                //       // stale: "ok",
      					// 			descending: true,
      					// 			inclusive_end: true,
      					// 			include_docs: true
      					// 		}
                //
                //   ]
    						// })
              }



            }

					}
				}
      ],
      range: [

        /**
        * @test, to get results cached on redis
        **/
				// {
				// 	sort_by_path: function(req, next, app){
        //     //console.log('SORT_BY_PATH RANGE', app.options.stat_host, req)
        //     let path = req.path
        //     let range = req.opt.range
        //
        //     if(app.options.stat_host){
        //       // let start_key = (app.options.path_start_key != null) ? app.options.path_start_key: app.options.path_key
        //       // let end_key = (app.options.path_end_key != null ) ? app.options.path_end_key : app.options.path_key
        //
        //
        //       // let CHUNK = 60000
        //       let range_end = (range.end != null) ?  range.end : Date.now()
        //       // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
        //       let range_start = range.start
        //
        //
        //
        //       // do {
        //
        //         // Array.each(app.options.paths, function(path){
        //           // if(!app.options.paths_blacklist || app.options.paths_blacklist.test( path ) == false){
        //
        //             // ////console.log('rethinkdb.os range', path)
        //
        //               // next(
        //             let end = range_start + 1000
        //             let start = range_start
        //
        //             while(end < range_end){
        //               console.log('SORT_BY_PATH RANGE', start, end)
        //               app.view({
        //   							uri: app.options.db,
        //                 args: [
        //                   'sort',
        //                   'by_path',
        //                   {
        //     								// startkey: [start_key, app.options.stat_host, "periodical", range.start],
        //     								// endkey: [end_key, app.options.stat_host, "periodical",range.end],
        //                     // startkey: [path, app.options.stat_host, "periodical", range.start],
        //                     startkey: [path, app.options.stat_host, "periodical", start],
        //     								endkey: [path, app.options.stat_host, "periodical",end],
        //
        //     								inclusive_end: true,
        //     								include_docs: true
        //     							}
        //                 ]
        //   						})
        //               end +=1000
        //               start +=1000
        //             }
        //           // }
        //
        //         // }.bind(app))
        //       //
        //       //   start -= CHUNK
        //       //   end -= CHUNK
        //       // }
        //       // while(start > range.start)
        //
        //     }
        //
        //
        //
				// 	}
				// },

        /**
        * was in use
        **/
        // {
				// 	sort_by_path: function(req, next, app){
        //     console.log('SORT_BY_PATH RANGE', app.options.stat_host, req)
        //     let path = req.path
        //     let range = req.opt.range
        //
        //     if(app.options.stat_host){
        //       // let start_key = (app.options.path_start_key != null) ? app.options.path_start_key: app.options.path_key
        //       // let end_key = (app.options.path_end_key != null ) ? app.options.path_end_key : app.options.path_key
        //
        //
        //       // let CHUNK = 60000
        //       let end = (range.end != null) ?  range.end : Date.now()
        //       // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
        //       let start = range.start
        //
        //
        //
        //       // do {
        //
        //         // Array.each(app.options.paths, function(path){
        //           // if(!app.options.paths_blacklist || app.options.paths_blacklist.test( path ) == false){
        //
        //             // ////console.log('rethinkdb.os range', path)
        //
        //               // next(
        //             // let end = range_start + 1000
        //             // let start = range_start
        //
        //             // while(end < range_end){
        //       // console.log('SORT_BY_PATH RANGE', start, end)
        //       app.view({
  			// 				uri: app.options.db,
        //         args: [
        //           'sort',
        //           'by_path',
        //           {
    		// 						// startkey: [start_key, app.options.stat_host, "periodical", range.start],
    		// 						// endkey: [end_key, app.options.stat_host, "periodical",range.end],
        //             // startkey: [path, app.options.stat_host, "periodical", range.start],
        //             startkey: [path, app.options.stat_host, "periodical", roundMilliseconds(start)],
    		// 						endkey: [path, app.options.stat_host, "periodical",roundMilliseconds(end)],
        //
    		// 						inclusive_end: true,
    		// 						include_docs: true
    		// 					}
        //         ]
  			// 			})
        //               // end +=1000
        //               // start +=1000
        //             // }
        //           // }
        //
        //         // }.bind(app))
        //       //
        //       //   start -= CHUNK
        //       //   end -= CHUNK
        //       // }
        //       // while(start > range.start)
        //
        //     }
        //
        //
        //
				// 	}
				// },
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
                app.between({
                  _extras: {id: req.id, type: 'range'},
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

                // app.view({
                //   _extras: {id: req.id, type: 'range'},
    						// 	uri: app.options.db,
                //   args: [
                //     'sort',
                //     'by_path',
                //     {
      					// 			// startkey: [start_key, app.options.stat_host, "periodical", range.start],
      					// 			// endkey: [end_key, app.options.stat_host, "periodical",range.end],
                //       // startkey: [path, app.options.stat_host, "periodical", range.start],
                //       startkey: [path, app.options.stat_host, "periodical", roundMilliseconds(start)],
      					// 			endkey: [path, app.options.stat_host, "periodical",roundMilliseconds(end)],
                //       // descending: true,
      					// 			inclusive_end: true,
      					// 			include_docs: true
      					// 		}
                //   ]
    						// })
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
                // app.view({
                //   _extras: {id: req.id, type: 'range'},
                //   uri: app.options.db,
                //   args: [
                //     'sort',
                //     'by_host',
                //     {
                //       startkey: [app.options.stat_host, "periodical",roundMilliseconds(start)],
                //       endkey: [app.options.stat_host, "periodical", roundMilliseconds(end)],
                //       // limit: 1,
                //       // stale: "ok",
                //       // descending: true,
                //       inclusive_end: true,
                //       include_docs: true
                //     }
                //
                //   ]
                // })
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

        this.fireEvent('on'+event+'Doc', [Array.clone(arr), {id: id, type: type, input_type: this, app: null}]);


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
    debug_internals('changes %o %o %o', err, resp, params)

    let _close = function(){
      resp.close()
      this.removeEvent('onSuspend', _close)
    }.bind(this)

    this.addEvent('onSuspend', _close)

    if(!this.changes_buffer_expire)
      this.changes_buffer_expire = Date.now()

    resp.each(function(err, row){
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
    // this.r.db(this.options.db).table('periodical').changes({includeTypes: true}).run(this.conn, function(err, cursor){
    //   debug_internals('changes %o', err, cursor)
    //    cursor.each(console.log);
    // })
    this.changes({
       _extras: {type: 'periodical'},
       uri: this.options.db+'/periodical',
       args: {includeTypes: true},
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
