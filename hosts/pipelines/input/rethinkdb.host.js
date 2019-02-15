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

  events: {},
  feed: undefined,
  close_feed: false,

  options: {

		requests : {
      periodical: [
        {
					get_data_range: function(req, next, app){
            debug_internals('get_data_range', app.data_hosts);
						if(app.data_hosts && app.data_hosts.length > 0){

              Array.each(app.data_hosts, function(host){
                debug_internals('get_data_range', host)
                //get first
                app.nth({
                  _extras: {
                    id: undefined,
                    prop: 'data_range',
                    range_select : 'start',
                    host: host,
                    type: 'prop'
                  },
                  uri: app.options.db+'/periodical',
                  args: 0,
                  query: app.r.db(app.options.db).table('periodical').
                  between(
                    [host, 'periodical', 0],
                    [host, 'periodical', ''],
                    {index: 'sort_by_host'}
                  )
                })

                //get last
                app.nth({
                  _extras: {
                    id: undefined,
                    prop: 'data_range',
                    range_select : 'end',
                    host: host,
                    type: 'prop'
                  },
                  uri: app.options.db+'/periodical',
                  args: -1,
                  query: app.r.db(app.options.db).table('periodical').
                  between(
                    [host, 'periodical', app.r.now().toEpochTime().mul(1000).sub(1000)],
                    [host, 'periodical', ''],
                    {index: 'sort_by_host'}
                  )
                })

              })

            }

					}
				},

      ],
      once: [
        {
					get_data_range: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'data_range' || !req.prop)){
              debug_internals('get_data_range', req.host, req.prop);

              //get first
              app.nth({
                _extras: {
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'start',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/periodical',
                args: 0,
                query: app.r.db(app.options.db).table('periodical').
                between(
                  [req.host, 'periodical', 0],
                  [req.host, 'periodical', ''],
                  {index: 'sort_by_host'}
                )
              })

              //get last
              app.nth({
                _extras: {
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop'
                },
                uri: app.options.db+'/periodical',
                args: -1,
                query: app.r.db(app.options.db).table('periodical').
                between(
                  [req.host, 'periodical', app.r.now().toEpochTime().mul(1000).sub(1000)],
                  [req.host, 'periodical', ''],
                  {index: 'sort_by_host'}
                )
              })


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'paths' || !req.prop)){
              debug_internals('search_paths', req.host, req.prop);
              app.reduce({
                _extras: {id: req.id, prop: 'paths', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
                uri: app.options.db+'/periodical',
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db).table('periodical').
                // getAll(req.host, {index: 'host'}).
                between(
                  [req.host, 'periodical', Date.now() - 60000],
                  [req.host, 'periodical', Date.now()],
                  {index: 'sort_by_host'}
                ).
                map(function(doc) {
                  return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
                }.bind(app))
                // query: app.r.db(app.options.db).table('periodical').getAll(req.host, {index: 'host'}).map(function(doc) {
                //   return app.r.object(doc("metadata")("path"), true) // return { <country>: true}
                // }.bind(app))
              })
            }

					}
				},
        {
					search_data: function(req, next, app){
						if(req.host && !req.type && (req.prop == 'data' || !req.prop)){
              debug_internals('search_data', req.host, req.prop);
              app.map({
                _extras: {id: req.id, prop: 'data', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
                uri: app.options.db+'/periodical',
                args: function(x){ return [x('group'), x('reduction')] },

                query: app.r.db(app.options.db).
                table('periodical').
                // getAll(req.host, {index: 'host'}).
                between(
                  [req.host, 'periodical', Date.now() - 60000],
                  [req.host, 'periodical', Date.now()],
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
        //            uri: app.options.db+'/periodical',
        //            // args: {includeTypes: true, squash: 1.1},
        //            args: {includeTypes: true, squash: 1},
        //            query: app.r.db(app.options.db).table('periodical').getAll(host, {index:'host'})
        //         })
        //       }
        //
        //
        //     }
        //
				// 	}
        {
					register: function(req, next, app){
						if(req.host && req.type == 'register' && req.prop == 'data' && req.id){
              // debug_internals('register', req.host, req.prop);
              let {host, prop, id} = req
              app.register(host, prop, id)
              // if(!app.events[host]) app.events[host] = {}

              // if(prop == 'data' && !app.events[host]['data']){
              //   // app.events[host]['data'] = true
              //   app.changes({
              //      _extras: {id: req.id, prop: 'data', host: req.host, type: req.type},
              //      uri: app.options.db+'/periodical',
              //      // args: {includeTypes: true, squash: 1.1},
              //      args: {includeTypes: true, squash: 1},
              //      query: app.r.db(app.options.db).table('periodical')
              //   })
              // }


            }

					}
				},
        {
					unregister: function(req, next, app){
						if(req.host && req.type == 'unregister' && req.prop == 'data' && req.id){
              // debug_internals('unregister', req.host, req.prop);
              let {host, prop, id} = req
              app.unregister(host, prop, id)
              // if(app.events[host] && app.events[host][prop])

              // app.map({
              //   _extras: {id: req.id, prop: 'data', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
              //   uri: app.options.db+'/periodical',
              //   args: function(x){ return [x('group'), x('reduction')] },
              //
              //   query: app.r.db(app.options.db).
              //   table('periodical').
              //   getAll(req.host, {index: 'host'}).
              //   group(app.r.row('metadata')('path')).
              //   max(app.r.row('metadata')('timestamp')).
              //   ungroup()
              // })
            }

					}
				},
        {
					catch_all: function(req, next, app){
						if(req.prop && !app.options.properties.contains(req.prop)){
              debug_internals('catch_all', req)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }


              // app.reduce({
              //   _extras: {prop: 'paths', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
              //   uri: app.options.db+'/periodical',
              //   args: function(left, right) {
              //       return left.merge(right)
              //   },
              //
              //   query: app.r.db(app.options.db).table('periodical').getAll(req.host, {index: 'host'}).map(function(doc) {
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
              debug_internals('get_data_range', req.host, req.prop);

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
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range
                },
                uri: app.options.db+'/periodical',
                args: 0,
                query: app.r.db(app.options.db).table('periodical').
                between(
                  [req.host, 'periodical', start],
                  [req.host, 'periodical', end],
                  {index: 'sort_by_host'}
                )
              })

              //get last
              app.nth({
                _extras: {
                  id: req.id,
                  prop: 'data_range',
                  range_select : 'end',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range
                },
                uri: app.options.db+'/periodical',
                args: -1,
                query: app.r.db(app.options.db).table('periodical').
                between(
                  [req.host, 'periodical', start],
                  [req.host, 'periodical', end],
                  {index: 'sort_by_host'}
                )
              })


            }

					}
				},
        {
					search_paths: function(req, next, app){
						if(req.host && (req.prop == 'paths' || !req.prop)){
              debug_internals('search_paths range', req.host, req.prop, req.opt.range)

              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              app.reduce({
                _extras: {
                  id: req.id,
                  prop: 'paths',
                  host: req.host,
                  type: (!req.prop) ? 'host' : 'prop',
                  range: req.opt.range
                },
                uri: app.options.db+'/periodical',
                args: function(left, right) {
                    return left.merge(right)
                },

                query: app.r.db(app.options.db).
                table('periodical').
                between(
                  [req.host, 'periodical', roundMilliseconds(start)],
                  [req.host, 'periodical', roundMilliseconds(end)],
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
              debug_internals('search_data range %o', req);

              let paths = req.paths
              let range = req.opt.range
              let end = (range.end != null) ?  range.end : Date.now()
              // let start = ((end - CHUNK) < range.start) ? range.start : end - CHUNK
              let start = range.start

              if(paths){
                let _get_by_path = function(path, extras){

                  app.map({
                    _extras: extras,
                    uri: app.options.db+'/periodical',
                    args: function(x){ return [x('group'),x('reduction')] },

                    query: app.r.db(app.options.db).
                    table('periodical').
                    between(
                      [path, req.host, 'periodical', roundMilliseconds(start)],
                      [path, req.host, 'periodical', roundMilliseconds(end)],
                      {index: 'sort_by_path'}
                    ).
                    // orderBy(r.asc.row('metadata')('timestamp')).
                    group(app.r.row('metadata')('path')).
                    ungroup()
                  })
                  // app.between({
                  //   _extras: extras,
                  //   uri: app.options.db+'/periodical',
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
                    _path = _path.replace(/_/g, '.')//if path are format=stat, transform
                    _get_by_path(_path,{
                      id: req.id,
                      prop: 'data',
                      host: req.host,
                      type: (!req.prop) ? 'host' : 'prop',
                      range: req.opt.range,
                      multipath: {index: index, length: paths.length}
                    })
                  })
                }
                else{
                  _get_by_path(paths, {
                    id: req.id,
                    prop: 'data',
                    host: req.host,
                    type: (!req.prop) ? 'host' : 'prop',
                    range: req.opt.range
                  })
                }

              }
              else{
                app.map({
                  _extras: {
                    id: req.id,
                    prop: 'data',
                    host: req.host,
                    type: (!req.prop) ? 'host' : 'prop',
                    range: req.opt.range
                  },
                  uri: app.options.db+'/periodical',
                  args: function(x){ return [x('group'),x('reduction')] },

                  query: app.r.db(app.options.db).
                  table('periodical').
                  between(
                    [req.host, 'periodical', roundMilliseconds(start)],
                    [req.host, 'periodical', roundMilliseconds(end)],
                    {index: 'sort_by_host'}
                  ).
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
              debug_internals('catch_all', req.host, req.prop)
              app.unknown_property({options: {_extras: {id: req.id, prop: req.prop, host: req.host, type: 'prop'}}})
            }


              // app.reduce({
              //   _extras: {prop: 'paths', host: req.host, type: (!req.prop) ? 'host' : 'prop'},
              //   uri: app.options.db+'/periodical',
              //   args: function(left, right) {
              //       return left.merge(right)
              //   },
              //
              //   query: app.r.db(app.options.db).table('periodical').getAll(req.host, {index: 'host'}).map(function(doc) {
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


    // this.addEvent('onResume', this.register_on_changes.bind(this))

		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:hosts:Pipeline:Host:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:hosts:Pipeline:Host:Input', 'info', 'mngr-ui-admin:apps:hosts:Pipeline:Host:Input started');
  },
  data_range: function(err, resp, params){
    debug_internals('data_range', err, resp, params.options)

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
      if(!this.hosts[host][prop]) this.hosts[host][prop] = {start: undefined, end: undefined}



      // if(extras.range == 'end')
      //   process.exit(1)

      // // if(resp) debug_internals('paths', Object.keys(resp))
      //
      // // let result = {}
      // // this.hosts[host][prop] = (resp) ? Object.keys(resp).map(function(item){ return item.replace(/\./g, '_') }) : null
      this.hosts[host][prop][range_select] = (resp && resp.metadata && resp.metadata.timestamp) ? resp.metadata.timestamp : null

      debug_internals('data_range', this.hosts)

      if(this.hosts[host][prop]['start'] && this.hosts[host][prop]['end'])
        if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
          let found = false
          Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
            if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
              found = true
          })

          debug_internals('paths firing host...', this.hosts[host], found)

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
    debug_internals('unknown_property', params.options)
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

    if(!this.hosts[host] || type == 'prop') this.hosts[host] = {}

    // if(resp) debug_internals('data', resp)

    let data = {}
    resp.toArray(function(err, arr){

      // this.hosts[host][prop] = arr
      this.r.expr(arr).coerceTo('object').run(this.conn, function(err, result){

        if(multipath){
          let index = multipath.index
          if(!this._multi_response[id]) this._multi_response[id] = []

          // debug_internals('multipath %o', id, multipath, this._multi_response[id].length)

          this._multi_response[id].push( result )

          if(this._multi_response[id].length == multipath.length){
            let final_result = {}
            Array.each(this._multi_response[id], function(resp){
              final_result = Object.merge(final_result,resp)
            })

            // debug_internals('multipath final %o', final_result)

            // this.fireEvent('on'+event+'Doc', [final_result, {id: id, type: type, input_type: this, app: null}]);
            this.fireEvent('onDoc', [
              (Object.getLength(final_result) > 0) ? {data: final_result} : null,
              Object.merge(
                {input_type: this, app: null},
                // {host: host, type: 'host', prop: prop, id: id}
                extras,
                {type: 'host'}
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

          if(type == 'prop' || (Object.keys(this.hosts[host]).length == this.properties.length)){
            let found = false
            Object.each(this.hosts[host], function(data, property){//if at least a property has data, host exist
              if(data !== null && ((Array.isArray(data) || data.length > 0) || Object.getLength(data) > 0))
                found = true
            })

            // debug_internals('data firing host...', this.hosts[host])

            this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
              {input_type: this, app: null},
              // {host: host, type: 'host', prop: prop, id: id}
              extras,
              {type: 'host'}
            )])
            delete this.hosts[host]
          }
        }



      }.bind(this))



    }.bind(this))



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

      // debug_internals('paths firing host...', this.hosts[host], Object.merge(
      //   extras,
      //   {type: 'host'}
      //   // {host: host, type: 'host', prop: prop, id: id}
      // ))

      this.fireEvent('onDoc', [(found) ? this.hosts[host] : null, Object.merge(
        {input_type: this, app: null},
        extras,
        {type: 'host'}
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

    if(Object.getLength(this.events) == 0 && this.feed){
      debug_internals('unregister closing')
      this.feed.close(function (err) {
        this.close_feed = true
        if (err){
          debug_internals('err closing cursor', err)
        }
      }.bind(this))
      this.feed = undefined
    }

    debug_internals('unregister', this.events)

  },
  register: function(host, prop, id){
    // debug_internals('register', host, prop, id)

    if(!this.events[host]) this.events[host] = {}
    if(!this.events[host][prop]) this.events[host][prop] = []
    this.events[host][prop].push(id)

    if(!this.feed){

      let _close = function(){
        debug_internals('closing cursor onSuspend')
        if(this.feed){
          this.feed.close(function (err) {
            this.close_feed = true

            if (err){
              debug_internals('err closing cursor onSuspend', err)
            }
          }.bind(this))

          this.feed = undefined
        }

        this.removeEvent('onSuspend', _close)
      }.bind(this)

      this.addEvent('onSuspend', _close)


      if(!this.changes_buffer_expire)
        this.changes_buffer_expire = Date.now()

      this.r.db(this.options.db).table('periodical').changes({includeTypes: true, squash: 1}).run(this.conn, function(err, cursor) {

        this.feed = cursor

        this.feed.each(function(err, row){

          /**
          * https://www.rethinkdb.com/api/javascript/each/
          * Iteration can be stopped prematurely by returning false from the callback.
          */
          if(this.close_feed === true){ this.close_feed = false; return false }

          // debug_internals('changes %s', new Date())

          if(row.type == 'add'){
            // debug_internals('changes add %s %o', new Date(), row.new_val)
            // this.fireEvent('onPeriodicalDoc', [row.new_val, {type: 'periodical', input_type: this, app: null}]);
            this.changes_buffer.push(row.new_val)
          }

          if(this.changes_buffer_expire < Date.now() - 900 && this.changes_buffer.length > 0){
            // console.log('onPeriodicalDoc', this.changes_buffer.length)
            // this.fireEvent('onPeriodicalDoc', [Array.clone(this.changes_buffer), {type: 'periodical', input_type: this, app: null}])
            let data = {}
            Array.each(this.changes_buffer, function(doc){
              let path = doc.metadata.path
              let host = doc.metadata.host

              if(!data[host]) data[host] = {}
              if(!data[host][path]) data[host][path] = []
              data[host][path].push(doc)

            }.bind(this))

            Object.each(data, function(host_data, host){
              // debug_internals('changes emiting %o', host, host_data)
              this.fireEvent('onDoc', [{ data : host_data }, Object.merge(
                {input_type: this, app: null},
                // {host: host, type: 'host', prop: prop, id: id}
                {type: prop, host: host}
              )])


            }.bind(this))


            // debug_internals('changes %s', new Date(), data)

            this.changes_buffer_expire = Date.now()
            this.changes_buffer = []
          }


        }.bind(this))

      }.bind(this))

    }


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
