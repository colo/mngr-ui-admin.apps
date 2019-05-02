'use strict'

// const App = require ( 'js-caching' )
const App = require ( 'node-app' )

const jscaching = require('js-caching')

let debug = require('debug')('mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input:Internals');

//
// const roundMilliseconds = function(timestamp){
//   let d = new Date(timestamp)
//   d.setMilliseconds(0)
//
//   // console.log('roundMilliseconds', d.getTime())
//   return d.getTime()
// }
//
// const SECOND = 1000
// const MINUTE = SECOND * 60
// const HOUR = MINUTE * 60
// const DAY = HOUR * 24


module.exports = new Class({
  Extends: App,

  data_hosts: [],
  cache: undefined,

  ON_CONNECT: 'onConnect',
  ON_CONNECT_ERROR: 'onConnectError',

  options: {
    NS: 'a22cf722-6ea9-4396-b2b3-9440dd677dd0',
    id: 'ui.cache',

    requests : {
      periodical: [{
        get_instances: function(req, next, app){
          debug_internals('get_instances', app.data_hosts)

          Array.each(app.data_hosts, function(host){
            app.cache.get(host+'.instances', function(err, instances){
              if(instances){
                let result = {
                  host: host,
                  instances: {}
                }
                // result[host] = {instances: undefined}
                Array.each(instances, function(instance, index){

                  app.cache.get(host+'.tabular.'+instance, function(err, data){
                    // if(data) result['instances'][instance] = JSON.parse(data)
                    if(data) result['instances'][instance] = data

                    if(index == instances.length - 1){

                      debug_internals('get_instances instance', result)

                      app.fireEvent('onDoc', [result, Object.merge(
                        {input_type: app, app: null},
                        {type: 'instances', host: host}
                        // extras,
                        // {type: 'host', prop: 'instances'}
                        // {host: host, type: 'host', prop: prop, id: id}
                      )])
                      // cb(result)
                      // return result
                    }
                    // let result = {type: 'property'}
                    // result.property = { instances: instances }
                    // debug_internals('host %s prop %s %o', host, prop, result)


                  })

                }.bind(app))
              }

            }.bind(app))
          })

        }
      }]
    }
  },

  initialize: function(options){
    debug_internals('initialize', options)

    this.cache = new jscaching(options)

    let __on_connect = function(){
      this.fireEvent(this.ON_CONNECT)
      this.cache.removeEvent('onConnect', __on_connect)
    }.bind(this)

    this.cache.addEvent('onConnect', __on_connect)

  	this.parent(options);//override default options

		this.profile('mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input_init');//start profiling

		this.profile('mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input', 'info', 'mngr-ui-admin:apps:Hosts:Pipeline:JSCaching:Input started');
  },
})
