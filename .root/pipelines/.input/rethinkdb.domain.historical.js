'use strict'

const App = require ( 'node-app-rethinkdb-client/index' )

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input:Internals');


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

  DEFAULT_HISTORICAL_TYPE: 'minute',


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
  hosts_ranges: {},

  options: {

		requests : {
      // periodical: [
      //   {
			// 		get_data_range: function(req, next, app){
      //       // debug_internals('get_data_range', app.data_hosts);
			// 			if(app.data_hosts && app.data_hosts.length > 0){
      //
      //         Array.each(app.data_hosts, function(host){
      //           // debug_internals('get_data_range', host)
      //           //get first
      //           app.nth({
      //             _extras: {
      //               id: undefined,
      //               prop: 'data_range',
      //               range_select : 'start',
      //               host: host,
      //               type: 'prop'
      //             },
      //             uri: app.options.db+'/historical',
      //             args: 0,
      //             query: app.r.db(app.options.db).table('historical').
      //             between(
      //               [host, from, 0],
      //               [host, from, ''],
      //               {index: 'sort_by_host'}
      //             )
      //           })
      //
      //           //get last
      //           app.nth({
      //             _extras: {
      //               id: undefined,
      //               prop: 'data_range',
      //               range_select : 'end',
      //               host: host,
      //               type: 'prop'
      //             },
      //             uri: app.options.db+'/historical',
      //             args: -1,
      //             query: app.r.db(app.options.db).table('historical').
      //             between(
      //               [host, from, app.r.now().toEpochTime().mul(1000).sub(60000)], //last 6 secs
      //               [host, from, ''],
      //               {index: 'sort_by_host'}
      //             )
      //           })
      //
      //         })
      //
      //       }
      //
			// 		}
			// 	},
      //   {
			// 		search_paths: function(req, next, app){
			// 			// if(req.host && !req.type && (req.prop == 'paths' || !req.prop)){
      //       if(app.data_hosts && app.data_hosts.length > 0){
      //         Array.each(app.data_hosts, function(host){
      //         // debug_internals('search_paths', req.host, req.prop);
      //           app.reduce({
      //             _extras: {id: undefined, prop: 'paths', host: host, type: 'prop'},
      //             uri: app.options.db+'/historical',
      //             args: function(left, right) {
      //                 return left.merge(right)
      //             },
      //
      //             query: app.r.db(app.options.db).table('historical').
      //             // getAll(req.host, {index: 'host'}).
      //             between(
      //               [host, from, Date.now() - 60000],
      //               [host, from, ''],
      //               {index: 'sort_by_host'}
      //             ).
      //             map(function(doc) {
      //               return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
      //             }.bind(app))
      //             // query: app.r.db(app.options.db).table('historical').getAll(req.host, {index: 'host'}).map(function(doc) {
      //             //   return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
      //             // }.bind(app))
      //           })
      //
      //         })
      //       }
      //
			// 		}
			// 	},
      //
      //
      //
      // ],
      once: [
        {
					get_data_range: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'data_range' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
              let sub = (from === 'hour') ? HOUR : MINUTE
              // debug_internals('get_data_range', req.host, req.prop);

              //get first
              app.nth({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'start',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/historical',
                args: 0,
                query: app.r.db(app.options.db).table('historical').
                between(
                  [req.host, from, 0],
                  [req.host, from, ''],
                  {index: 'sort_by_host'}
                )
              })

              //get last
              app.nth({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/historical',
                args: -1,
                query: app.r.db(app.options.db).table('historical').
                between(
                  [req.host, from, app.r.now().toEpochTime().mul(1000).sub(sub)],//last 5 secs
                  [req.host, from, ''],
                  {index: 'sort_by_host'}
                )
              })


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'paths' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
              let sub = (from === 'hour') ? HOUR : MINUTE
              // debug_internals('search_paths', req.host, req.prop);
              app.reduce({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'paths',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/historical',
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db).table('historical').
                // getAll(req.host, {index: 'host'}).
                between(
                  [req.host, from, Date.now() - sub], //60000
                  [req.host, from, Date.now()],
                  {index: 'sort_by_host'}
                ).
                map(function(doc) {
                  return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
                }.bind(app))
                // query: app.r.db(app.options.db).table('historical').getAll(req.host, {index: 'host'}).map(function(doc) {
                //   return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
                // }.bind(app))
              })
            }

					}
				},
        {
					search_data: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'data' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
              let sub = (from === 'hour') ? HOUR : MINUTE
              // debug_internals('search_data', req.host, req.prop);
              app.map({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'data',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/historical',
                args: function(x){ return [x('group'), x('reduction')] },

                query: app.r.db(app.options.db).
                table('historical').
                // getAll(req.host, {index: 'host'}).
                between(
                  [req.host, from, Date.now() - sub], //60000
                  [req.host, from, Date.now()],
                  {index: 'sort_by_host'}
                ).
                group(app.r.row('metadata')('path')).
                max(app.r.row('metadata')('timestamp')).
                ungroup()
              })
            }

					}
				},
        // {
				// 	register: function(req, next, app){
				// 		if(req.host && req.type == 'register' && req.prop){
        //       debug_internals('register', req.host, req.prop);
        //       let {host, prop} = req
        //       if(!app.events[host]) app.events[host] = {}
        //
        //       if(prop == 'data' && !app.events[host]['data']){
        //         // app.events[host]['data'] = true
        //         app.changes({
        //            _extras: {id: req.id, prop: 'data', host: req.host, type: req.type},
        //            uri: app.options.db+'/historical',
        //            // args: {includeTypes: true, squash: 1.1},
        //            args: {includeTypes: true, squash: 1},
        //            query: app.r.db(app.options.db).table('historical').getAll(host, {index:'host'})
        //         })
        //       }
        //
        //
        //     }
        //
				// 	}
        // },
        // {
				// 	register: function(req, next, app){
				// 		if(req.host && req.type == 'register' && req.prop == 'data' && req.id){
        //       debug_internals('register', req.host, req.prop, req.id);
        //       let {host, prop, id} = req
        //
        //       app.register(host, prop, id)
        //
        //       // if(!app.registered[id]) app.registered[id] = {}
        //       // if(!app.registered[id][host]) app.registered[id][host] = []
        //       //
        //       // app.registered[id][host] = app.registered[id][host].combine([prop])
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
        //       let {host, prop, id} = req
        //       app.unregister(host, prop, id)
        //
        //
        //       // if(app.registered[id]){
        //       //   if(host && prop && app.registered[id][host])
        //       //     app.registered[id][host] = app.registered[id][host].erase(prop)
        //       //
        //       //   if((host && app.registered[id][host].length == 0) || (host && !prop))
        //       //     delete app.registered[id][host]
        //       //
        //       //
        //       //   if(Object.getLength(app.registered[id]) == 0 || !host)
        //       //     delete app.registered[id]
        //       // }
        //       //
        //       // debug_internals('unregister', req.type, req.host, req.prop, req.id, app.registered);
        //
        //
        //     }
        //
				// 	}
				// },
        {
					catch_all: function(req, next, app){
						if(req.prop && !app.options.properties.contains(req.prop)){
              debug_internals('catch_all', req)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }


              // app.reduce({
              //   _extras: {prop: 'paths', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
              //   uri: app.options.db+'/historical',
              //   args: function(left, right) {
              //       return left.merge(right)
              //   },
              //
              //   query: app.r.db(app.options.db).table('historical').getAll(req.host, {index: 'host'}).map(function(doc) {
              //     return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
              //   }.bind(app))
              // })

					}
				},
      ],

      range: [
        {
					get_data_range: function(req, next, app){
						if(req.host && (req.prop == 'data_range' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
              // debug_internals('get_data_range', req.host, req.prop);

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start


              //get first
              app.nth({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'start',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/historical',
                args: 0,
                query: app.r.db(app.options.db).table('historical').
                between(
                  [req.host, from, start],
                  [req.host, from, end],
                  {index: 'sort_by_host'}
                )
              })

              //get last
              app.nth({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/historical',
                args: -1,
                query: app.r.db(app.options.db).table('historical').
                between(
                  [req.host, from, start],
                  [req.host, from, end],
                  {index: 'sort_by_host'}
                )
              })


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && (req.prop == 'paths' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
              // debug_internals('search_paths range', req.host, req.prop, req.opt.range)

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              app.reduce({
                _extras: {
                  from,
                  id: req.id,
                  prop: 'paths',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range,
                  full_range: req.full_range,
                  range_counter: req.range_counter
                },
                uri: app.options.db+'/historical',
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db).
                table('historical').
                between(
                  [req.host, from, roundMilliseconds(start)],
                  [req.host, from, roundMilliseconds(end)],
                  {index: 'sort_by_host'}
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
						if(req.host && (req.prop == 'data' || !req.prop)){
              let from = req.from || app.DEFAULT_HISTORICAL_TYPE
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
                    uri: app.options.db+'/historical',
                    args: function(x){ return [x('group'),x('reduction')] },

                    query: app.r.db(app.options.db).
                    table('historical').
                    between(
                      [path, req.host, from, roundMilliseconds(start)],
                      [path, req.host, from, roundMilliseconds(end)],
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
                  //   uri: app.options.db+'/historical',
                  //   args: [
                  //     [path, req.host, "periodical", roundMilliseconds(start)],
                  //     [path, req.host, "periodical",roundMilliseconds(end)],
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
                      from,
                      id: req.id,
                      prop: 'data',
                      host: req.host,
                      type: (!req.prop) ? 'host' : 'prop',
                      range: req.opt.range,
                      full_range: req.full_range,
                      range_counter: req.range_counter,
                      multipath: {index: index, length: paths.length}
                    })
                  })
                }
                else{
                  _get_by_path(paths, {
                    from,
                    id: req.id,
                    prop: 'data',
                    host: req.host,
                    type: (!req.prop) ? 'host' : 'prop',
                    range: req.opt.range,
                    full_range: req.full_range,
                    range_counter: req.range_counter
                  })
                }

              }
              else{
                app.map({
                  _extras: {
                    from,
                    id: req.id,
                    prop: 'data',
                    host: req.host,
                    type: (!req.prop) ? 'host' : 'prop',
                    range: req.opt.range,
                    full_range: req.full_range,
                    range_counter: req.range_counter
                  },
                  uri: app.options.db+'/historical',
                  args: function(x){ return [x('group'),x('reduction')] },

                  query: app.r.db(app.options.db).
                  table('historical').
                  between(
                    [req.host, from, roundMilliseconds(start)],
                    [req.host, from, roundMilliseconds(end)],
                    {index: 'sort_by_host'}
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
              // debug_internals('catch_all', req.host, req.prop)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }


              // app.reduce({
              //   _extras: {prop: 'paths', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
              //   uri: app.options.db+'/historical',
              //   args: function(left, right) {
              //       return left.merge(right)
              //   },
              //
              //   query: app.r.db(app.options.db).table('historical').getAll(req.host, {index: 'host'}).map(function(doc) {
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
        callbacks: ['paths']
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

  properties: ['paths', 'data', 'data_range'],
  // properties: [],

  hosts: {},
  _multi_response: {},

  initialize: function(options){

  	this.parent(options);//override default options

    this.addEvent('onSuspend', function(){
      this.registered = {}
    }.bind(this))

    // this.addEvent('onResume', this.register_on_changes.bind(this))

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Domain.Historical:Input started');
  },
  data_range: function(err, resp, params){
    // debug_internals('data_range', err, resp, params.options)

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
    else{
      let extras = params.options._extras
      let host = extras.host
      let prop = extras.prop
      let range_select = extras.range_select //start | end
      let type = extras.type
      let id = extras.id

      if(!this.hosts[host]) this.hosts[host] = {}
      if(!this.hosts[host][prop]) this.hosts[host][prop] = {start: '', end: ''}



      // if(extras.range == 'end')
      //   process.exit(1)

      // // if(resp) debug_internals('paths', Object.keys(resp))
      //
      // // let result = {}
      // // this.hosts[host][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null
      this.hosts[host][prop][range_select] = (resp && resp.metadata && resp.metadata.timestamp) ? resp.metadata.timestamp : null

      // debug_internals('data_range', this.hosts)

      if(this.hosts[host][prop]['start'] != '' && this.hosts[host][prop]['end'] != '')
        if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
          let found = false
          Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
            if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
              found = true
          })

          // debug_internals('paths firing host...', this.hosts[host], found)

          this.hosts_ranges[host] = this.hosts[host]['data_range']

          this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
            {input_type: this, app: null},
            extras,
            {type: (id === undefined) ? 'data_range' : 'host'}
            // {host: host, type: 'host', prop: prop, id: id}
          )])
          delete this.hosts[host]
        }



    }
  },
  unknown_property: function(params){
    // debug_internals('unknown_property', params.options)
    let extras = params.options._extras
    let host = extras.host
    let prop = extras.prop
    let type = extras.type
    let id = extras.id

    this.fireEvent('onDoc', [null, Object.merge(
      {input_type: this, app: null},
      // {host: host, type: 'host', prop: prop, id: id}
      extras,
      {type: 'host'}
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
    let host = extras.host
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

      if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

      // if(resp) debug_internals('data', resp)

      let data = {}
      resp.toArray(function(err, arr){

        // debug_internals('data length ', arr.length)

        // this.hosts[host][prop] = arr
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
                  // {host: host, type: 'host', prop: prop, id: id}
                  extras,
                  {type: 'host', step: final_result.step}
                )
              ])
              // delete this.hosts[host]

              delete this._multi_response[id]
            }
            // }

          }
          else{



            if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

            // debug_internals('data firing host...', this.hosts, host)

            this.hosts[host][prop] = result

            debug_internals('data length ', result, this.hosts[host])

            if(Object.getLength(result) == 0 || type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
              let found = false
              Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
                if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
                  found = true
              })

              // debug_internals('data firing host...', this.hosts[host].data)
              debug_internals('data firing host...', host)

              if(extras.range && this.hosts[host].data){
                this.hosts[host] = Object.merge(this.hosts[host], this.__step_on_max_data_points(this.hosts[host].data))
              }

              this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
                {input_type: this, app: null},
                // {host: host, type: 'host', prop: prop, id: id}
                extras,
                {type: 'host', step: this.hosts[host].step}
              )])
              delete this.hosts[host]
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
  paths: function(err, resp, params){
    debug_internals('paths', err, params.options)

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
    let host = extras.host
    let prop = extras.prop
    let type = extras.type
    let id = extras.id


    if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

    // if(resp) debug_internals('paths', Object.keys(resp))

    // let result = {}
    // this.hosts[host][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null
    this.hosts[host][prop] = (resp) ? Object.keys(resp) : null

    if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
      let found = false
      Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
        if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
          found = true
      })

      // debug_internals('paths firing host...', this.hosts[host])

      // debug_internals('paths firing host...', this.hosts[host], Object.merge(
      //   extras,
      //   {type: 'host'}
      //   // {host: host, type: 'host', prop: prop, id: id}
      // ))

      this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
        {input_type: this, app: null},
        extras,
        // {type: 'host'}
        {type: (id === undefined) ? 'paths' : 'host'}
        // {host: host, type: 'host', prop: prop, id: id}
      )])
      delete this.hosts[host]
    }



    // }
  },
  unregister: function(host, prop, id){
    debug_internals('unregister', host, prop, id)

    if(this.events[host] && this.events[host][prop] && this.events[host][prop].contains(id)){
      this.events[host][prop].erase(id)
      this.events[host][prop] = this.events[host][prop].clean()

      if(this.events[host][prop].length == 0){
        delete this.events[host][prop]
      }
    }

    if(this.events[host] && Object.getLength(this.events[host]) == 0)
      delete this.events[host]

    if(Object.getLength(this.events) == 0 && this.feeds[host]){
      debug_internals('unregister closing')
      this.__close_changes(host)
      // this.feeds[host].close(function (err) {
      //   this.close_feed = true
      //   if (err){
      //     debug_internals('err closing cursor', err)
      //   }
      // }.bind(this))
      // this.feed = undefined
    }

    debug_internals('unregister', this.events)

  },
  __close_changes: function(host){
    if(this.feeds[host]){
      this.feeds[host].close(function (err) {
        this.close_feeds[host] = true

        if (err){
          debug_internals('err closing cursor onSuspend', err)
        }
      }.bind(this))

      this.feeds[host] = undefined
    }

    // this.removeEvent('onSuspend', this.__close_changes)
  },
  register: function(host, prop, id){
    // debug_internals('register', host, prop, id)

    if(!this.events[host]) this.events[host] = {}
    if(!this.events[host][prop]) this.events[host][prop] = []
    this.events[host][prop].push(id)

    if(!this.feeds[host]){

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
      this.addEvent('onSuspend', this.__close_changes.pass(host, this))


      if(!this.changes_buffer[host]) this.changes_buffer[host] = []

      if(!this.changes_buffer_expire[host]) this.changes_buffer_expire[host] = Date.now()

      this.r.db(this.options.db).
        table('historical').
        getAll(host, {index: 'host'}).
        changes({includeTypes: true, squash: 1}).
        run(this.conn, {maxBatchSeconds: 1}, function(err, cursor) {

        this.feeds[host] = cursor

        this.feeds[host].each(function(err, row){

          /**
          * https://www.rethinkdb.com/api/javascript/each/
          * Iteration can be stopped prematurely by returning false from the callback.
          */
          if(this.close_feeds[host] === true){ this.close_feeds[host] = false; this.feeds[host] = undefined; return false }

          // debug_internals('changes %s', new Date())
          if(row && row !== null ){
            if(row.type == 'add'){
              // debug_internals('changes add %s %o', new Date(), row.new_val)
              // debug_internals("changes add now: %s \n timstamp: %s \n expire: %s \n host: %s \n path: %s",
              //   new Date(roundMilliseconds(Date.now())),
              //   new Date(roundMilliseconds(row.new_val.metadata.timestamp)),
              //   new Date(roundMilliseconds(this.changes_buffer_expire[host])),
              //   row.new_val.metadata.host,
              //   row.new_val.metadata.path
              // )

              this.changes_buffer[host].push(row.new_val)
            }

            if(this.changes_buffer_expire[host] < Date.now() - 900 && this.changes_buffer[host].length > 0){
              // console.log('onPeriodicalDoc', this.changes_buffer.length)

              this.__process_changes(this.changes_buffer[host])

              // debug_internals('changes %s', new Date(), data)

              this.changes_buffer_expire[host] = Date.now()
              this.changes_buffer[host] = []

              // let data = {}
              // Array.each(this.changes_buffer, function(doc){
              //   let path = doc.metadata.path
              //   let host = doc.metadata.host
              //
              //   if(!data[host]) data[host] = {}
              //   if(!data[host][path]) data[host][path] = []
              //   data[host][path].push(doc)
              //
              // }.bind(this))
              //
              // Object.each(data, function(host_data, host){
              //   // debug_internals('changes emiting %o', host, host_data)
              //   this.fireEvent('onDoc', [{ data : host_data }, Object.merge(
              //     {input_type: this, app: null},
              //     // {host: host, type: 'host', prop: prop, id: id}
              //     {type: prop, host: host}
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
      let host = doc.metadata.host

      if(!data[host]) data[host] = {}
      if(!data[host][path]) data[host][path] = []
      data[host][path].push(doc)

    }.bind(this))

    Object.each(data, function(host_data, host){
      // debug_internals('changes emiting %o', host, host_data)
      // let doc = {}
      // doc[host] = host_data
      // this.fireEvent('onDoc', [doc, Object.merge(
      //   {input_type: this, app: null},
      //   // {host: host, type: 'host', prop: prop, id: id}
      //   // {type: prop, host: host}
      // )])
      this.fireEvent('onDoc', [{ data : host_data }, Object.merge(
        {input_type: this, app: null},
        // {host: host, type: 'host', prop: prop, id: id}
        {type: 'data', host: host}
      )])

    }.bind(this))
  },
  // changes: function(err, resp, params){
  //   let extras = params.options._extras
  //   let {id, host, prop, type} = extras
  //
  //   if(!this.events[host][prop]) this.events[host][prop] = {ids: [], feed: resp}
  //
  //   if(!this.events[host][prop].ids.contains(id))
  //     this.events[host][prop].ids.push(id)
  //
  //   // this.events[host][prop] = resp
  //
  //   let _close = {}
  //   _close[host] = {}
  //   _close[host][prop] = function(){
  //     if(this.events && this.events[host] && this.events[host][prop] && this.events[host][prop].feed)
  //       this.events[host][prop].feed.close()
  //
  //     this.removeEvent('onSuspend', _close)
  //     delete this.events[host][prop]
  //   }.bind(this)
  //
  //   this.addEvent('onSuspend', _close[host][prop])
  //
  //   debug_internals('changes %o %o %o %s', err, resp, params, new Date())
  //
  //   if(!this.changes_buffer_expire)
  //     this.changes_buffer_expire = Date.now()
  //
  //   this.events[host][prop].feed.each(function(err, row){
  //     // debug_internals('changes %s', new Date(), host, prop, row)
  //
  //     if(row.type == 'add'){
  //       // console.log(row.new_val)
  //       // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: from, input_type: this, app: null}]);
  //       this.changes_buffer.push(row.new_val)
  //     }
  //
  //     if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
  //       // console.log('onPeriodicalDoc', this.changes_buffer.length)
  //       // this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: from, input_type: this, app: null}])
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
  //         // {host: host, type: 'host', prop: prop, id: id}
  //         {type: prop, host: host}
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
  //      _extras: {type: from},
  //      uri: this.options.db+'/historical',
  //      args: {includeTypes: true, squash: 1.1},
  //      // query: this.r.db(this.options.db).table('historical').getAll(this.options.stat_host, {index:'host'})
  //      query: this.r.db(this.options.db).table('historical').distinct({index: 'host'})
  //
  //
  //   })
  //
  // }



});
