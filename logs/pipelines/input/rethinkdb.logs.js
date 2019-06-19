'use strict'

const	path = require('path')
// const App = require ( 'node-app-rethinkdb-client/index' )
const App = require(path.join(process.cwd(), '/libs/pipeline/inputs/rethinkdb'))

let debug = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Input'),
    debug_internals = require('debug')('mngr-ui-admin:apps:logs:Pipeline:Logs:Input:Internals');


const roundMilliseconds = function(timestamp){
  let d = new Date(timestamp)
  d.setMilliseconds(0)

  // console.log('roundMilliseconds', d.getTime())
  return d.getTime()
}

const pluralize = require('pluralize')

module.exports = new Class({
  Extends: App,

  options: {
    type: 'logs',

  },

  // custom: ['range', 'data_range'],
  // distinct_indexes: ['tag', 'type', 'host', 'domain'],

  initialize: function(options){
    // let paths = []
    // Array.each(options.paths, function(path){
    //   if(this.paths.test(path) == true)
    //     paths.push(path)
    // }.bind(this))
    //
    // options.paths = paths

  	this.parent(options);//override default options

    // this.options.requests.once.push({data_range: this.data_range})

    // this.addEvent('onConnect', this.register_on_changes.bind(this))
    // this.register_on_changes.bind(this)

		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//start profiling


		this.profile('mngr-ui-admin:apps:logs:Pipeline:Logs:Input_init');//end profiling

		this.log('mngr-ui-admin:apps:logs:Pipeline:Logs:Input', 'info', 'mngr-ui-admin:apps:logs:Pipeline:Logs:Input started');
  },
  // build_default_result: function(doc){
  //   let self = this
  //
  //   let result = self.parent(doc)
  //
  //   result.domains = doc('reduction').filter(function (doc) {
  //     return doc('metadata').hasFields('domain');
  //   }).map(function(doc) {
  //     return self.r.object(doc('metadata')('domain'), true) // return { <country>: true}
  //   }).reduce(function(left, right) {
  //       return left.merge(right)
  //   }).default({}).keys()
  //
  //   result.data_range = [
  //     doc('reduction').min(
  //       function (set) {
  //           return set('data')('timestamp')
  //       }
  //     )('data')('timestamp'),
  //     doc('reduction').max(
  //       function (set) {
  //           return set('data')('timestamp')
  //       }
  //     )('data')('timestamp'),
  //   ]
  //   return result
  // },






});
