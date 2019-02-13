'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:libs:tabular:munin.memory'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:libs:tabular:munin.memory:Internals');

let chart = require('mngr-ui-admin-charts/defaults/dygraph.line')
chart.style = "width:100%; height:220px;"


module.exports = function(path){
  debug_internals('munin.memory', path)

  return chart
  // if(!match || match.test(path)){
  //   return return_charts
  // }
  // else{
  //   return undefined
  // }
}
