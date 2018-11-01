'use strict'

// const App = require ( '../../node_modules/node-app-couchdb-client/index' )
const App = require ( 'node-app-couchdb-client/index' )

const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

module.exports = new Class({
  Extends: App,

  paths: /^os.*/,


  options: {
    // couchdb: {
    //   request: require('cachemachine')({redis: true, hostname: 'elk'})
    // },

    paths: [],
    stat_host: null,
    range_path: undefined,

    path_key: null,
    path_start_key: null,
    path_end_key: null,

    paths_blacklist: /^os\.procs.*/,
    // paths_blacklist: undefined,

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
            console.log('sort_by_host_or_path ONCE', req)
            let path = req.path
            if(app.options.stat_host){

              if(path){
                app.view({
                  _extras: {id: req.id, type: 'once'},
    							uri: app.options.db,
                  args: [
                    'sort',
                    'by_path',
                    {
      								// startkey: [start_key, app.options.stat_host, "periodical", range.start],
      								// endkey: [end_key, app.options.stat_host, "periodical",range.end],
                      // startkey: [path, app.options.stat_host, "periodical", range.start],
                      startkey: [path, app.options.stat_host, "periodical", roundMilliseconds(Date.now() + 0)],
      								endkey: [path, app.options.stat_host, "periodical",roundMilliseconds(Date.now() - 1000)],
                      descending: true,
      								inclusive_end: true,
      								include_docs: true
      							}
                  ]
    						})
              }
              else{
                app.view({
                  _extras: {id: req.id, type: 'once'},
    							uri: app.options.db,
                  args: [
                    'sort',
                    'by_host',
                    {
      								startkey: [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
      								endkey: [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
                      // limit: 1,
                      // stale: "ok",
      								descending: true,
      								inclusive_end: true,
      								include_docs: true
      							}

                  ]
    						})
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
        //             // ////console.log('couchdb.os range', path)
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
        //             // ////console.log('couchdb.os range', path)
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
                app.view({
                  _extras: {id: req.id, type: 'range'},
    							uri: app.options.db,
                  args: [
                    'sort',
                    'by_path',
                    {
      								// startkey: [start_key, app.options.stat_host, "periodical", range.start],
      								// endkey: [end_key, app.options.stat_host, "periodical",range.end],
                      // startkey: [path, app.options.stat_host, "periodical", range.start],
                      startkey: [path, app.options.stat_host, "periodical", roundMilliseconds(start)],
      								endkey: [path, app.options.stat_host, "periodical",roundMilliseconds(end)],
                      // descending: true,
      								inclusive_end: true,
      								include_docs: true
      							}
                  ]
    						})
              }
              else{
                app.view({
                  _extras: {id: req.id, type: 'range'},
                  uri: app.options.db,
                  args: [
                    'sort',
                    'by_host',
                    {
                      startkey: [app.options.stat_host, "periodical",roundMilliseconds(start)],
                      endkey: [app.options.stat_host, "periodical", roundMilliseconds(end)],
                      // limit: 1,
                      // stale: "ok",
                      // descending: true,
                      inclusive_end: true,
                      include_docs: true
                    }

                  ]
                })
              }


            }

					}
				}

			],
			periodical: [
        /**
        * peridically exec this view to keep it warm on couchdb
        **/
        // {
				// 	sort_by_path: function(req, next, app){
        //     // console.log('WARM SORT_BY_PATH RANGE', app.options.stat_host)
        //     let path = 'os'
        //     // let range = req.opt.range
        //
        //     if(app.options.stat_host){
        //       let end = Date.now()
        //       let start = end - 1000
        //
        //               // next(
        //       app.view({
  			// 				uri: app.options.db,
        //         args: [
        //           'sort',
        //           'by_path',
        //           {
        //             startkey: [path, app.options.stat_host, "periodical", start],
    		// 						endkey: [path, app.options.stat_host, "periodical", end],
        //             stale: "update_after",
        //             limit:1,
    		// 						inclusive_end: true,
    		// 						include_docs: false
    		// 					}
        //         ]
  			// 			})
        //
        //
        //     }
        //
        //
        //
				// 	}
				// },

        {
					sort_by_host: function(req, next, app){

            if(app.options.stat_host){
              // let start_key = (app.options.path_start_key != null) ? app.options.path_start_key: app.options.path_key
              // let end_key = (app.options.path_end_key != null ) ? app.options.path_end_key : app.options.path_key

              /**
              * limit for 'os',
              * unlimit for 'munin'
              */

              // Array.each(app.options.paths, function(path){

                // if(!app.options.paths_blacklist || app.options.paths_blacklist.test( path ) == false){
                //   ////console.log('couchdb.os path', path)

                  app.view({
                    _extras: {type: 'periodical'},
      							uri: app.options.db,
                    args: [
                      'sort',
                      'by_host',
                      {
        								// startkey: [app.options.stat_host, "periodical",Date.now() + 0],
        								// endkey: [app.options.stat_host, "periodical", Date.now() - 1000],
                        startkey: [app.options.stat_host, "periodical",roundMilliseconds(Date.now() + 0)],
        								endkey: [app.options.stat_host, "periodical", roundMilliseconds(Date.now() - 1000)],
                        // limit: 1,
        								descending: true,
        								inclusive_end: true,
        								include_docs: true
        							}

                    ]
      						})
                // }
              // })
            }

					}
				}

			],

		},

		routes: {
			/**
      exists: [
				{
					path: ':database',
					callbacks: ['exists'],
				}
			],
      **/
			request: [
				{
					path: '',
					callbacks: ['request'],
				}
			],
			view: [
				{
					path: ':database',
					callbacks: ['view'],
					//version: '',
				},
			]
		},


  },

  view: function(err, resp, view){
    if(view.options._extras.type == 'range')
		  console.log('this.view ', err, resp.rows.length, view.options);
    // console.log('this.view ', err, view.options);

		if(err){
			//console.log('this.sort_by_path error %o', err);

		}
		else{
      let type = view.options._extras.type
      let id = view.options._extras.id
      let event = type.charAt(0).toUpperCase() + type.slice(1)
        // if(view.options.args[0] == 'sort' && view.options.args[1] == 'by_host' && resp.rows.length > 0){
        // if(view.options.args[0] == 'sort' && view.options.args[1] == 'by_host'){

      this.fireEvent('on'+event+'Doc', [Array.clone(resp.rows), {id: id, type: type, input_type: this, app: null}]);

        // }
        // else if(resp.rows.length > 0 && view.options.args[2].include_docs != false){
        //   // console.log('this.view ', resp.rows, view.options.args);
        //
        //    this.fireEvent('onRangeDoc', [resp.rows, {type: 'range', input_type: this, app: null}]);
        // }
        // else if(resp.rows.length > 1){//range docs
        //   //////////console.log('range docs', resp)
        //   this.fireEvent('onRangeDoc', [resp.rows, {type: 'range', input_type: this, app: null}]);
        //
        //
        // }
        // else if(view.options.args[2].limit == 1 && resp.rows[0]){
  			// 	this.fireEvent('onPeriodicalDoc', [resp.rows[0].doc, {type: 'periodical', input_type: this, app: null}]);
  			// }
        // else if(resp.rows.length > 0){//range docs
        //   //////////console.log('range docs', resp)
        //   this.fireEvent('onRangeDoc', [resp.rows, {type: 'range', input_type: this, app: null}]);
        //
        //
        // }
      // }
		}
  },
  request: function(err, resp){

		if(err){

		}
	},
  initialize: function(options){
    let paths = []
    Array.each(options.paths, function(path){
      if(this.paths.test(path) == true)
        paths.push(path)
    }.bind(this))

    options.paths = paths

    //////////console.log('input.poller.couchdb.os', options)
		this.parent(options);//override default options

    // this.addEvent('onExit', function(){
    //   console.log('EXITING...')
    //
    //   this.fireEvent('onSuspend')
    // })

		this.profile('root_init');//start profiling


		this.profile('root_init');//end profiling

		this.log('root', 'info', 'root started');
  },
  connect: function(){

	},


});
