'use strict'
const App = require('node-app-http-client')

let debug = require('debug')('mngr-ui-admin:apps:hosts:clients:ui.rest'),
    debug_events = require('debug')('mngr-ui-admin:apps:hosts:clients:ui.rest:Events'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:clients:ui.rest:Internals');

module.exports = function(options){
  const _http = new Class({
    Extends: App,

    options: {
      api: {
        routes: {
          get: [
            {
    					path: '/events/:event',
    					callbacks: ['get_events'],
    					// version: '0.0.0',
  					},
          ]
        }
      },
    },
    initialize: function(options){
      this.parent(options)
      debug_internals('initialize', this.options)
    },
    get_events: function(req, res, data, opts){
      debug_internals('get_events', data, opts)
    }
  })

  return new _http(options)
}
