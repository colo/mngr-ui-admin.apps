'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24


module.exports = new Class({
  Extends: App,

  // FOLD_BASE: 300,
  MAX_RANGE_DATA_POINTS: 300,

  feeds: {},
  close_feeds: {},
  changes_buffer: {},
  changes_buffer_expire: {},

  // changes_buffer: [],
  // changes_buffer_expire: undefined,

  events: {},
  // feed: undefined,
  // close_feed: false,

  registered: {},
  domains_ranges: {},

  options: {

		requests : {
      periodical: [
        {
					get_data_range: function(req, next, app){
            // debug_internals('get_data_range', app.data_domains);
						if(req.params.domains){

              Array.each(app.domains, function(domain){
                debug_internals('get_data_range', domain)
                //get first
                app.nth({
                  _extras: {
                    id: undefined,
                    prop: 'data_range',
                    range_select : 'start',
                    domain: domain,
                    type: 'prop'
                  },
                  uri: app.options.db+'/periodical',
                  args: 0,
                  query: app.r.db(app.options.db).table('periodical').
                  between(
                    [domain, 'periodical', app.r.minvalue],
                    [domain, 'periodical', app.r.maxvalue],
                    {index: 'sort_by_domain'}
                  )
                })

                //get last
                app.nth({
                  _extras: {
                    id: undefined,
                    prop: 'data_range',
                    range_select : 'end',
                    domain: domain,
                    type: 'prop'
                  },
                  uri: app.options.db+'/periodical',
                  args: -1,
                  query: app.r.db(app.options.db).table('periodical').
                  between(
                    // [domain, 'periodical', app.r.now().toEpochTime().mul(1000).sub(6000)], //last 6 secs
                    [domain, 'periodical', app.r.minvalue],
                    [domain, 'periodical', app.r.maxvalue],
                    {index: 'sort_by_domain'}
                  )
                })

              })

            }

					}
				},
        // {
				// 	search_paths: function(req, next, app){
				// 		// if(req.params.domain && !req.type && (req.prop == 'paths' || !req.prop)){
        //     if(app.data_domains && app.data_domains.length > 0){
        //       Array.each(app.data_domains, function(domain){
        //       // debug_internals('search_paths', req.params.domain, req.prop);
        //         app.reduce({
        //           _extras: {id: undefined, prop: 'paths', domain: domain, type: 'prop'},
        //           uri: app.options.db+'/ui',
        //           args: function(left, right) {
        //               return left.merge(right)
        //           },
        //
        //           query: app.r.db(app.options.db).table('ui').
        //           // getAll(req.params.domain, {index: 'domain'}).
        //           between(
        //             [domain, 'periodical', Date.now() - 6000],
        //             [domain, 'periodical', ''],
        //             {index: 'sort_by_domain'}
        //           ).
        //           map(function(doc) {
        //             return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
        //           }.bind(app))
        //           // query: app.r.db(app.options.db).table('ui').getAll(req.params.domain, {index: 'domain'}).map(function(doc) {
        //           //   return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
        //           // }.bind(app))
        //         })
        //
        //       })
        //     }
        //
				// 	}
				// },
        // // {
				// // 	get_changes: function(req, next, app){
        // //     if(app.registered){
        // //       let domains = []
        // //       Object.each(app.registered, function(registered_data, id){
        // //         // debug_internals('get_changes', registered_data)
        // //         Object.each(registered_data, function(props, domain){
        // //
        // //           if(props.contains('data'))//if registered for "data"
        // //             domains = domains.combine([domain])
        // //
        // //         })
        // //       })
  			// // 			//debug_internals('_get_last_stat %o', next);
        // //       // let start = Date.now() - 3999
        // //       // let end = Date.now()
        // //
  			// // 			debug_internals('get_changes %s', new Date(), app.domains_ranges, domains);
        // //
  			// // 			// let views = [];
  			// // 			// Object.each(app.domains, function(value, domain){
  			// // 				// debug_internals('_get_last_stat %s', domain);
        // //
        // //         Array.each(domains, function(domain){
        // //           // debug_internals('_get_last_stat %s %s', domain, path);
        // //           // let _func = function(){
        // //           if(app.domains_ranges[domain] && app.domains_ranges[domain].end)
        // //             app.between({
        // //               _extras: {
        // //                 id: undefined,
        // //                 prop: 'changes',
        // //                 // range_select : 'start',
        // //                 domain: domain,
        // //                 // type: 'prop'
        // //               },
        // //               uri: app.options.db+'/ui',
        // //               args: [
        // //                 /**
        // //                 * 1001ms time lapse (previous second from "now")
        // //                 **/
        // //                 [domain, 'periodical', app.domains_ranges[domain].end - 1999],
        // //                 [domain, 'periodical', app.domains_ranges[domain].end],
        // //                 {
        // //                   // index: 'timestamp',
        // //                   index: 'sort_by_domain',
        // //                   leftBound: 'open',
        // //                   rightBound: 'open'
        // //                 }
        // //               ],
        // //               // chain: [{orderBy: { index: app.r.desc('sort_by_path') }}, {limit: 1}]
        // //               // orderBy: { index: app.r.desc('sort_by_path') }
        // //             })
        // //
        // //         }.bind(app))
        // //
        // //
    		// // 					// views.push(_func);
        // //
        // //         // })
        // //
  			// // 			// });
        // //
  			// // 			// Array.each(views, function(view){
  			// // 			// 	view();
  			// // 			// });
  			// // 			// next(views);
        // //     }
				// // 	}
				// // },


      ],
      once: [
        {
					get_data_range: function(req, next, app){
            // debug_internals('get_data_range', req);
						if(req.params.domain && !req.type && (req.prop == 'data_range' || !req.prop)){
              debug_internals('get_data_range', req.params.domain, req.prop);

              //get last
              app.nth({
                _extras: {
                  from: req.from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop'
                },
                uri: app.options.db+'/'+req.from,
                args: -1,
                query: app.r.db(app.options.db).table(req.from).
                between(
                  // [req.params.domain, 'periodical', app.r.now().toEpochTime().mul(1000).sub(5000)],//last 5 secs
                  [req.params.domain, req.from, 0],//last 5 secs
                  [req.params.domain, req.from, ''],
                  {index: 'sort_by_domain'}
                )
              })

              //get first
              app.nth({
                _extras: {
                  from: req.from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'start',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop'
                },
                uri: app.options.db+'/'+req.from,
                args: 0,
                query: app.r.db(app.options.db).table(req.from).
                between(
                  [req.params.domain, req.from, 0],
                  [req.params.domain, req.from, ''],
                  {index: 'sort_by_domain'}
                )
              })




            }

					}
				},
        {
					search_hosts: function(req, next, app){
						if(req.params.domain && !req.type && (req.prop == 'hosts' || !req.prop)){
              debug_internals('search_hosts', req);
              /**
              * reducing last minute of domains should be enough, and is way faster than "distinct" from all docs
              **/
              app.reduce({
                _extras: {
                  from: req.from,
                  id: req.id,
                  prop: 'hosts',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop'
                },
                uri: app.options.db+'/'+req.from,
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db)
                .table(req.from)
                .getAll(req.params.domain, {index: 'domain'}).map(function(doc) {
                  return app.r.object(doc("metadata")("host"), true) // return { <country>: true}
                }.bind(app))

                // query: app.r.db(app.options.db).table(req.from).between(Date.now() - app.RANGES[req.from], Date.now(), {index: 'timestamp'}).map(function(doc) {
                //   return app.r.object(doc("metadata")("host"), true) // return { <country>: true}
                // }.bind(app))
              })
            }
            // app.distinct({
            //   _extras: {type: 'domains', id: undefined},
            //   uri: app.options.db+'/periodical',
            //   args: {index: 'domain'}
            // })

					}
				},

        // {
				// 	search_paths: function(req, next, app){
				// 		if(req.params.domain && !req.type && (req.prop == 'paths' || !req.prop)){
        //       // debug_internals('search_paths', req.params.domain, req.prop);
        //       app.reduce({
        //         _extras: {id: req.id, prop: 'paths', domain: req.params.domain, type: (!req.prop) ? 'domain' : 'prop'},
        //         uri: app.options.db+'/ui',
        //         args: function(left, right) {
        //             return left.merge(right)
        //         },
        //
        //         query: app.r.db(app.options.db).table('ui').
        //         // getAll(req.params.domain, {index: 'domain'}).
        //         between(
        //           [req.params.domain, 'periodical', Date.now() - 10000], //60000
        //           [req.params.domain, 'periodical', Date.now()],
        //           {index: 'sort_by_domain'}
        //         ).
        //         map(function(doc) {
        //           return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
        //         }.bind(app))
        //         // query: app.r.db(app.options.db).table('ui').getAll(req.params.domain, {index: 'domain'}).map(function(doc) {
        //         //   return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
        //         // }.bind(app))
        //       })
        //     }
        //
				// 	}
				// },
        // {
				// 	search_data: function(req, next, app){
				// 		if(req.params.domain && !req.type && (req.prop == 'data' || !req.prop)){
        //       // debug_internals('search_data', req.params.domain, req.prop);
        //       app.map({
        //         _extras: {id: req.id, prop: 'data', domain: req.params.domain, type: (!req.prop) ? 'domain' : 'prop'},
        //         uri: app.options.db+'/ui',
        //         args: function(x){ return [x('group'), x('reduction')] },
        //
        //         query: app.r.db(app.options.db).
        //         table('ui').
        //         // getAll(req.params.domain, {index: 'domain'}).
        //         between(
        //           [req.params.domain, 'periodical', Date.now() - 10000], //60000
        //           [req.params.domain, 'periodical', Date.now()],
        //           {index: 'sort_by_domain'}
        //         ).
        //         group(app.r.row('metadata')('path')).
        //         max(app.r.row('metadata')('timestamp')).
        //         ungroup()
        //       })
        //     }
        //
				// 	}
				// },
        // // {
				// // 	register: function(req, next, app){
				// // 		if(req.params.domain && req.type == 'register' && req.prop){
        // //       debug_internals('register', req.params.domain, req.prop);
        // //       let {domain, prop} = req
        // //       if(!app.events[domain]) app.events[domain] = {}
        // //
        // //       if(prop == 'data' && !app.events[domain]['data']){
        // //         // app.events[domain]['data'] = true
        // //         app.changes({
        // //            _extras: {id: req.id, prop: 'data', domain: req.params.domain, type: req.type},
        // //            uri: app.options.db+'/ui',
        // //            // args: {includeTypes: true, squash: 1.1},
        // //            args: {includeTypes: true, squash: 1},
        // //            query: app.r.db(app.options.db).table('ui').getAll(domain, {index:'domain'})
        // //         })
        // //       }
        // //
        // //
        // //     }
        // //
				// // 	}
        // // },
        // {
				// 	register: function(req, next, app){
				// 		if(req.params.domain && req.type == 'register' && req.prop == 'data' && req.id){
        //       debug_internals('register', req.params.domain, req.prop, req.id);
        //       let {domain, prop, id} = req
        //
        //       app.register(domain, prop, id)
        //
        //       // if(!app.registered[id]) app.registered[id] = {}
        //       // if(!app.registered[id][domain]) app.registered[id][domain] = []
        //       //
        //       // app.registered[id][domain] = app.registered[id][domain].combine([prop])
        //
        //     }
        //
				// 	}
				// },
        // {
				// 	unregister: function(req, next, app){
        //
				// 		if(req.type == 'unregister'){
        //
        //       // throw new Error()
        //
        //       let {domain, prop, id} = req
        //       app.unregister(domain, prop, id)
        //
        //
        //       // if(app.registered[id]){
        //       //   if(domain && prop && app.registered[id][domain])
        //       //     app.registered[id][domain] = app.registered[id][domain].erase(prop)
        //       //
        //       //   if((domain && app.registered[id][domain].length == 0) || (domain && !prop))
        //       //     delete app.registered[id][domain]
        //       //
        //       //
        //       //   if(Object.getLength(app.registered[id]) == 0 || !domain)
        //       //     delete app.registered[id]
        //       // }
        //       //
        //       // debug_internals('unregister', req.type, req.params.domain, req.prop, req.id, app.registered);
        //
        //
        //     }
        //
				// 	}
				// },
        // {
				// 	catch_all: function(req, next, app){
				// 		if(req.prop && !app.options.properties.contains(req.prop)){
        //       debug_internals('catch_all', req)
        //       app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, domain: req.params.domain, type: 'prop'}}})
        //     }
        //
        //
        //       // app.reduce({
        //       //   _extras: {prop: 'paths', domain: req.params.domain, type: (!req.prop) ? 'domain' : 'prop'},
        //       //   uri: app.options.db+'/ui',
        //       //   args: function(left, right) {
        //       //       return left.merge(right)
        //       //   },
        //       //
        //       //   query: app.r.db(app.options.db).table('ui').getAll(req.params.domain, {index: 'domain'}).map(function(doc) {
        //       //     return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
        //       //   }.bind(app))
        //       // })
        //
				// 	}
				// },
      ],

      range: [
        {
					get_data_range: function(req, next, app){
						if(req.params.domain && (req.prop == 'data_range' || !req.prop)){
              // debug_internals('get_data_range', req.params.domain, req.prop);

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start


              //get first
              app.nth({
                _extras: {
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'start',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/ui',
                args: 0,
                query: app.r.db(app.options.db).table('ui').
                between(
                  [req.params.domain, 'periodical', start],
                  [req.params.domain, 'periodical', end],
                  {index: 'sort_by_domain'}
                )
              })

              //get last
              app.nth({
                _extras: {
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/ui',
                args: -1,
                query: app.r.db(app.options.db).table('ui').
                between(
                  [req.params.domain, 'periodical', start],
                  [req.params.domain, 'periodical', end],
                  {index: 'sort_by_domain'}
                )
              })


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.params.domain && (req.prop == 'paths' || !req.prop)){
              // debug_internals('search_paths range', req.params.domain, req.prop, req.opt.range)

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              app.reduce({
                _extras: {
                  id: req.id,
                  prop: 'paths',
                  domain: req.params.domain,
                  type: (!req.prop) ? 'domain' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/ui',
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db).
                table('ui').
                between(
                  [req.params.domain, 'periodical', roundMilliseconds(start)],
                  [req.params.domain, 'periodical', roundMilliseconds(end)],
                  {index: 'sort_by_domain'}
                ).
                map(function(doc) {
                  return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
                }.bind(app))
              })
            }

					}
				},
        {
					search_data: function(req, next, app){
						if(req.params.domain && (req.prop == 'data' || !req.prop)){
              // debug_internals('search_data range %o', req);

              let paths = req.paths
              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              let range_length = Math.ceil((end - start) / SECOND)
              let fold = Math.ceil((range_length / app.FOLD_BASE))

              // debug_internals('range FOLD', fold)

              if(paths){
                let _get_by_path = function(path, extras){

                  app.map({
                    _extras: extras,
                    uri: app.options.db+'/ui',
                    args: function(x){ return [x('group'),x('reduction')] },

                    query: app.r.db(app.options.db).
                    table('ui').
                    between(
                      [path, req.params.domain, 'periodical', roundMilliseconds(start)],
                      [path, req.params.domain, 'periodical', roundMilliseconds(end)],
                      {index: 'sort_by_path'}
                    ).
                    // fold(0, function(acc, row) {
                    //   return acc.add(1);
                    // }, {emit:
                    //   function (acc, row, new_acc) {
                    //     return app.r.branch(new_acc.eq(0), [row], new_acc.mod(fold).eq(0), [row], []);
                    //   }
                    // }).
                    // orderBy(r.asc.row('metadata')('timestamp')).
                    group(app.r.row('metadata')('path')).
                    ungroup()
                  })
                  // app.between({
                  //   _extras: extras,
                  //   uri: app.options.db+'/ui',
                  //   args: [
                  //     [path, req.params.domain, "periodical", roundMilliseconds(start)],
                  //     [path, req.params.domain, "periodical",roundMilliseconds(end)],
                  //     {
                  //       index: 'sort_by_path',
                  //       leftBound: 'open',
                  //       rightBound: 'open'
                  //     }
                  //   ],
                  //   orderBy: {index: 'sort_by_path'}
                  // })
                }

                if(Array.isArray(paths)){
                  Array.each(paths, function(_path, index){
                    if(!req.query || !req.query.format)
                      _path = _path.replace(/_/g, '.')//if path are format=stat, transform

                    _get_by_path(_path,{
                      id: req.id,
                      prop: 'data',
                      domain: req.params.domain,
                      type: (!req.prop) ? 'domain' : 'prop',
                      range: req.opt.range,
                      full_range: req.full_range,
                      range_counter: req.range_counter,
                      multipath: {index: index, length: paths.length}
                    })
                  })
                }
                else{
                  _get_by_path(paths, {
                    id: req.id,
                    prop: 'data',
                    domain: req.params.domain,
                    type: (!req.prop) ? 'domain' : 'prop',
                    range: req.opt.range,
                    full_range: req.full_range,
                    range_counter: req.range_counter
                  })
                }

              }
              else{
                app.map({
                  _extras: {
                    id: req.id,
                    prop: 'data',
                    domain: req.params.domain,
                    type: (!req.prop) ? 'domain' : 'prop',
                    range: req.opt.range,
                    full_range: req.full_range,
                    range_counter: req.range_counter
                  },
                  uri: app.options.db+'/ui',
                  args: function(x){ return [x('group'),x('reduction')] },

                  query: app.r.db(app.options.db).
                  table('ui').
                  between(
                    [req.params.domain, 'periodical', roundMilliseconds(start)],
                    [req.params.domain, 'periodical', roundMilliseconds(end)],
                    {index: 'sort_by_domain'}
                  ).
                  // fold(0, function(acc, row) {
                  //   return acc.add(1);
                  // }, {emit:
                  //   function (acc, row, new_acc) {
                  //     return app.r.branch(new_acc.eq(0), [row], new_acc.mod(fold).eq(0), [row], []);
                  //   }
                  // }).
                  group(app.r.row('metadata')('path')).
                  ungroup()
                })
              }
            }

					}
				},
        {
					catch_all: function(req, next, app){
						if(req.prop && !app.options.properties.contains(req.prop)){
              // debug_internals('catch_all', req.params.domain, req.prop)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, domain: req.params.domain, type: 'prop'}}})
            }


              // app.reduce({
              //   _extras: {prop: 'paths', domain: req.params.domain, type: (!req.prop) ? 'domain' : 'prop'},
              //   uri: app.options.db+'/ui',
              //   args: function(left, right) {
              //       return left.merge(right)
              //   },
              //
              //   query: app.r.db(app.options.db).table('ui').getAll(req.params.domain, {index: 'domain'}).map(function(doc) {
              //     return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
              //   }.bind(app))
              // })

					}
				},
      ],

		},

		routes: {
      reduce: [{
        path: ':database/:table',
        callbacks: ['hosts']
      }],
      map: [{
        path: ':database/:table',
        callbacks: ['data']
      }],
      between: [{
        path: ':database/:table',
        callbacks: ['data']
      }],
      nth: [{
        path: ':database/:table',
        callbacks: ['data_range']
      }],
      // distinct: [{
      //   path: ':database/:table',
      //   callbacks: ['distinct']
      // }],
      // changes: [{
      //   path: ':database/:table',
      //   callbacks: ['changes']
      // }],

		},


  },

  // properties: ['paths', 'data', 'data_range'],
  properties: ['hosts', 'data_range'],
  // properties: [],

  domains: {},
  _multi_response: {},

  initialize: function(options){

  	this.parent(options);//override default options

    this.addEvent('onSuspend', function(){
      this.registered = {}
    }.bind(this))

    // this.addEvent('onResume', this.register_on_changes.bind(this))

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Logs:Domain:Input started');
  },
  hosts: function(err, resp, params){


    let extras = params.options._extras
    let domain = extras.domain
    let prop = extras.prop
    let type = extras.type
    let id = extras.id

    extras.type = (id === undefined) ? 'hosts' : 'domain'
    if(extras.type === 'domain')
      delete extras.prop

    extras[extras.type] = this.domains[domain]

    if(!this.domains[domain] || type == 'prop') this.domains[domain] = {}

    this.domains[domain][prop] = (resp) ? Object.keys(resp) : null




    if(err){
      // debug_internals('reduce err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

      debug_internals('hosts', err, resp, params.options)

      this.fireEvent(this.ON_DOC_ERROR, [err, extras])

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    else{


    // if(resp) debug_internals('hosts', Object.keys(resp))

    // let result = {}
    // this.domains[domain][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null

      if(type == 'prop' || (Object.keys(this.domains[domain]).length == this.properties.length)){
        let found = false
        Object.each(this.domains[domain], function(data, property){//if at least a property has data, domain exist
          if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
            found = true
        })

        if(!found){
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
        delete this.domains[domain]
      }



    }
  },
  data_range: function(err, resp, params){
    debug_internals('data_range', err, resp, params.options)
    let extras = params.options._extras

    let domain = extras.domain
    let prop = extras.prop
    let range_select = extras.range_select //start | end
    let type = extras.type
    let id = extras.id

    if(!this.domains[domain]) this.domains[domain] = {}
    if(!this.domains[domain][prop]) this.domains[domain][prop] = {start: undefined, end: undefined}

    delete extras.range_select

    this.domains[domain][prop][range_select] = (resp && resp.metadata && resp.metadata.timestamp) ? resp.metadata.timestamp : null

    debug_internals('data_range', this.domains)

    extras.type = (id === undefined) ? 'data_range' : 'domain'
    if(extras.type === 'domain')
      delete extras.prop


    extras[extras.type] = this.domains[domain]

    if(err){
      // debug_internals('reduce err', err)

			if(params.uri != ''){
				this.fireEvent('on'+params.uri.charAt(0).toUpperCase() + params.uri.slice(1)+'Error', err);//capitalize first letter
			}
			else{
				this.fireEvent('onGetError', err);
			}

			if(this.domains[domain][prop]['start'] !== undefined && this.domains[domain][prop]['end'] !== undefined )
        this.fireEvent(this.ON_DOC_ERROR, [err, extras])

			this.fireEvent(
				this[
					'ON_'+this.options.requests.current.type.toUpperCase()+'_DOC_ERROR'
				],
				err
			);
    }
    else{


      if(this.domains[domain][prop]['start'] !== undefined && this.domains[domain][prop]['end'] !== undefined )
        if(type == 'prop' || (Object.keys(this.domains[domain]).length == this.properties.length)){
          let found = false
          Object.each(this.domains[domain], function(data, property){//if at least a property has data, domain exist
            if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
              found = true
          })

          // debug_internals('paths firing domain...', this.domains[domain], found)

          this.domains_ranges[domain] = this.domains[domain]['data_range']

          if(!found){
            let err = {}
            err['status'] = 404
            err['message'] = 'not found'
            this.fireEvent(this.ON_DOC_ERROR, [err, extras]);
          }
          else{

            this.fireEvent(this.ON_DOC, [extras, Object.merge({input_type: this, app: null})]);
          }


          delete this.domains[domain]
        }



    }
  },
  unknown_property: function(params){
    // debug_internals('unknown_property', params.options)
    let extras = params.options._extras
    let domain = extras.domain
    let prop = extras.prop
    let type = extras.type
    let id = extras.id

    this.fireEvent('onDoc', [null, Object.merge(
      {input_type: this, app: null},
      // {domain: domain, type: 'domain', prop: prop, id: id}
      extras,
      {type: 'domain'}
    )])
  },
  data: function(err, resp, params){
    debug_internals('data', err, params.options)

    if(err){
      // debug_internals('reduce err', err)

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
    // else{
    let extras = params.options._extras
    let domain = extras.domain
    let prop = extras.prop
    let type = extras.type
    let id = extras.id
    let multipath = extras.multipath

    if(resp && prop == 'changes'){
      resp.toArray(function(err, results) {
        if (err) throw err;

        debug_internals('changes', results.length)

        if(results.length > 0)
          this.__process_changes(results)

      }.bind(this));
    }
    else{

      if(!this.domains[domain] || type == 'prop') this.domains[domain] = {}

      // if(resp) debug_internals('data', resp)

      let data = {}
      resp.toArray(function(err, arr){

        // debug_internals('data length ', arr.length)

        // this.domains[domain][prop] = arr
        this.r.expr(arr).coerceTo('object').run(this.conn, function(err, result){


          if(multipath){
            let index = multipath.index
            if(!this._multi_response[id]) this._multi_response[id] = []

            // debug_internals('multipath %o', id, multipath, this._multi_response[id].length)

            this._multi_response[id].push( result )

            if(this._multi_response[id].length == multipath.length){
              let final_result = {data: {}, step: undefined}
              Array.each(this._multi_response[id], function(resp){
                final_result.data = Object.merge(final_result.data,resp)
              })

              debug_internals('multipath final %o', final_result)
              if(extras.range){
                final_result = this.__step_on_max_data_points(final_result.data)
              }
              // this.fireEvent('on'+event+'Doc', [final_result, {id: id, type: type, input_type: this, app: null}]);
              this.fireEvent('onDoc', [
                (Object.getLength(final_result.data) > 0) ? final_result : null,
                Object.merge(
                  {input_type: this, app: null},
                  // {domain: domain, type: 'domain', prop: prop, id: id}
                  extras,
                  {type: 'domain', step: final_result.step}
                )
              ])
              // delete this.domains[domain]

              delete this._multi_response[id]
            }
            // }

          }
          else{



            if(!this.domains[domain] || type == 'prop') this.domains[domain] = {}

            // debug_internals('data firing domain...', this.domains, domain)

            this.domains[domain][prop] = result

            debug_internals('data length ', result, this.domains[domain])

            if(Object.getLength(result) == 0 || type == 'prop' || (Object.keys(this.domains[domain]).length == this.properties.length)){
              let found = false
              Object.each(this.domains[domain], function(data, property){//if at least a property has data, domain exist
                if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
                  found = true
              })

              // debug_internals('data firing domain...', this.domains[domain].data)
              debug_internals('data firing domain...', domain)

              if(extras.range && this.domains[domain].data){
                this.domains[domain] = Object.merge(this.domains[domain], this.__step_on_max_data_points(this.domains[domain].data))
              }

              this.fireEvent('onDoc', [(found) ? this.domains[domain] : null, Object.merge(
                {input_type: this, app: null},
                // {domain: domain, type: 'domain', prop: prop, id: id}
                extras,
                {type: 'domain', step: this.domains[domain].step}
              )])
              delete this.domains[domain]
            }
          }



        }.bind(this))



      }.bind(this))

    }


  },
  __step_on_max_data_points: function(data){
    let step = 1
    Object.each(data, function(result_data, result_path){
      if(Array.isArray(result_data)){
        result_data.sort(function(a,b) {
          return (a.metadata.timestamp > b.metadata.timestamp) ? 1 : ((b.metadata.timestamp > a.metadata.timestamp) ? -1 : 0)
        })

        step = Math.ceil(result_data.length / this.MAX_RANGE_DATA_POINTS)
        if(step > 1){
          Array.each(result_data, function(result_data_values, result_data_index){
            // if(result_data_index != 0 && (result_data_index % step) != 0)
            if(result_data_index % step != 0)
              result_data[result_data_index] = undefined
          })

          result_data = result_data.clean()
        }
      }
    }.bind(this))

    return {data: data, step: step}
  },

  unregister: function(domain, prop, id){
    debug_internals('unregister', domain, prop, id)

    if(this.events[domain] && this.events[domain][prop] && this.events[domain][prop].contains(id)){
      this.events[domain][prop].erase(id)
      this.events[domain][prop] = this.events[domain][prop].clean()

      if(this.events[domain][prop].length == 0){
        delete this.events[domain][prop]
      }
    }

    if(this.events[domain] && Object.getLength(this.events[domain]) == 0)
      delete this.events[domain]

    if(Object.getLength(this.events) == 0 && this.feeds[domain]){
      debug_internals('unregister closing')
      this.__close_changes(domain)
      // this.feeds[domain].close(function (err) {
      //   this.close_feed = true
      //   if (err){
      //     debug_internals('err closing cursor', err)
      //   }
      // }.bind(this))
      // this.feed = undefined
    }

    debug_internals('unregister', this.events)

  },
  __close_changes: function(domain){
    if(this.feeds[domain]){
      this.feeds[domain].close(function (err) {
        this.close_feeds[domain] = true

        if (err){
          debug_internals('err closing cursor onSuspend', err)
        }
      }.bind(this))

      this.feeds[domain] = undefined
    }

    // this.removeEvent('onSuspend', this.__close_changes)
  },
  register: function(domain, prop, id){
    // debug_internals('register', domain, prop, id)

    if(!this.events[domain]) this.events[domain] = {}
    if(!this.events[domain][prop]) this.events[domain][prop] = []
    this.events[domain][prop].push(id)

    if(!this.feeds[domain]){

      // let _close = function(){
      //   debug_internals('closing cursor onSuspend')
      //   if(this.feed){
      //     this.feed.close(function (err) {
      //       this.close_feed = true
      //
      //       if (err){
      //         debug_internals('err closing cursor onSuspend', err)
      //       }
      //     }.bind(this))
      //
      //     this.feed = undefined
      //   }
      //
      //   this.removeEvent('onSuspend', _close)
      // }.bind(this)

      // this.addEvent('onSuspend', _close)
      this.addEvent('onSuspend', this.__close_changes.pass(domain, this))


      if(!this.changes_buffer[domain]) this.changes_buffer[domain] = []

      if(!this.changes_buffer_expire[domain]) this.changes_buffer_expire[domain] = Date.now()

      this.r.db(this.options.db).
        table('ui').
        getAll(domain, {index: 'domain'}).
        changes({includeTypes: true, squash: 1}).
        run(this.conn, {maxBatchSeconds: 1}, function(err, cursor) {

        this.feeds[domain] = cursor

        this.feeds[domain].each(function(err, row){

          /**
          * https://www.rethinkdb.com/api/javascript/each/
          * Iteration can be stopped prematurely by returning false from the callback.
          */
          if(this.close_feeds[domain] === true){ this.close_feeds[domain] = false; this.feeds[domain] = undefined; return false }

          // debug_internals('changes %s', new Date())
          if(row && row !== null ){
            if(row.type == 'add'){
              // debug_internals('changes add %s %o', new Date(), row.new_val)
              // debug_internals("changes add now: %s \n timstamp: %s \n expire: %s \n domain: %s \n path: %s",
              //   new Date(roundMilliseconds(Date.now())),
              //   new Date(roundMilliseconds(row.new_val.metadata.timestamp)),
              //   new Date(roundMilliseconds(this.changes_buffer_expire[domain])),
              //   row.new_val.metadata.domain,
              //   row.new_val.metadata.path
              // )

              this.changes_buffer[domain].push(row.new_val)
            }

            if(this.changes_buffer_expire[domain] < Date.now() - 900 && this.changes_buffer[domain].length > 0){
              // console.log('onPeriodicalDoc', this.changes_buffer.length)

              this.__process_changes(this.changes_buffer[domain])

              // debug_internals('changes %s', new Date(), data)

              this.changes_buffer_expire[domain] = Date.now()
              this.changes_buffer[domain] = []

              // let data = {}
              // Array.each(this.changes_buffer, function(doc){
              //   let path = doc.metadata.path
              //   let domain = doc.metadata.domain
              //
              //   if(!data[domain]) data[domain] = {}
              //   if(!data[domain][path]) data[domain][path] = []
              //   data[domain][path].push(doc)
              //
              // }.bind(this))
              //
              // Object.each(data, function(domain_data, domain){
              //   // debug_internals('changes emiting %o', domain, domain_data)
              //   this.fireEvent('onDoc', [{ data : domain_data }, Object.merge(
              //     {input_type: this, app: null},
              //     // {domain: domain, type: 'domain', prop: prop, id: id}
              //     {type: prop, domain: domain}
              //   )])
              //
              //
              // }.bind(this))
              //
              //
              // // debug_internals('changes %s', new Date(), data)
              //
              // this.changes_buffer_expire = Date.now()
              // this.changes_buffer = []
            }

          }


        }.bind(this))

      }.bind(this))

    }


  },
  __process_changes: function(buffer){
    let data = {}
    Array.each(buffer, function(doc){
      let path = doc.metadata.path
      let domain = doc.metadata.domain

      if(!data[domain]) data[domain] = {}
      if(!data[domain][path]) data[domain][path] = []
      data[domain][path].push(doc)

    }.bind(this))

    Object.each(data, function(domain_data, domain){
      // debug_internals('changes emiting %o', domain, domain_data)
      // let doc = {}
      // doc[domain] = domain_data
      // this.fireEvent('onDoc', [doc, Object.merge(
      //   {input_type: this, app: null},
      //   // {domain: domain, type: 'domain', prop: prop, id: id}
      //   // {type: prop, domain: domain}
      // )])
      this.fireEvent('onDoc', [{ data : domain_data }, Object.merge(
        {input_type: this, app: null},
        // {domain: domain, type: 'domain', prop: prop, id: id}
        {type: 'data', domain: domain}
      )])

    }.bind(this))
  },
  // changes: function(err, resp, params){
  //   let extras = params.options._extras
  //   let {id, domain, prop, type} = extras
  //
  //   if(!this.events[domain][prop]) this.events[domain][prop] = {ids: [], feed: resp}
  //
  //   if(!this.events[domain][prop].ids.contains(id))
  //     this.events[domain][prop].ids.push(id)
  //
  //   // this.events[domain][prop] = resp
  //
  //   let _close = {}
  //   _close[domain] = {}
  //   _close[domain][prop] = function(){
  //     if(this.events && this.events[domain] && this.events[domain][prop] && this.events[domain][prop].feed)
  //       this.events[domain][prop].feed.close()
  //
  //     this.removeEvent('onSuspend', _close)
  //     delete this.events[domain][prop]
  //   }.bind(this)
  //
  //   this.addEvent('onSuspend', _close[domain][prop])
  //
  //   debug_internals('changes %o %o %o %s', err, resp, params, new Date())
  //
  //   if(!this.changes_buffer_expire)
  //     this.changes_buffer_expire = Date.now()
  //
  //   this.events[domain][prop].feed.each(function(err, row){
  //     // debug_internals('changes %s', new Date(), domain, prop, row)
  //
  //     if(row.type == 'add'){
  //       // console.log(row.new_val)
  //       // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: 'periodical', input_type: this, app: null}]);
  //       this.changes_buffer.push(row.new_val)
  //     }
  //
  //     if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
  //       // console.log('onPeriodicalDoc', this.changes_buffer.length)
  //       // this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: 'periodical', input_type: this, app: null}])
  //       let data = {}
  //       Array.each(this.changes_buffer, function(doc){
  //         let path = doc.metadata.path
  //         if(!data[path]) data[path] = []
  //         data[path].push(doc)
  //
  //       }.bind(this))
  //
  //       this.fireEvent('onDoc', [{ data : data }, Object.merge(
  //         {input_type: this, app: null},
  //         // {domain: domain, type: 'domain', prop: prop, id: id}
  //         {type: prop, domain: domain}
  //       )])
  //
  //       // debug_internals('changes %s', new Date(), data)
  //
  //       this.changes_buffer_expire = Date.now()
  //       this.changes_buffer = []
  //     }
  //
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
  //      uri: this.options.db+'/ui',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('ui').getAll(this.options.stat_domain, {index:'domain'})
  //      query: this.r.db(this.options.db).table('ui').distinct({index: 'domain'})
  //
  //
  //   })
  //
  // }



});
