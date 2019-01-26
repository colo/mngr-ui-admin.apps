'use strict'

let debug = require('debug')('mngr-ui-admin:apps:hosts:libs:tabular'),
    debug_internals = require('debug')('mngr-ui-admin:apps:hosts:libs:tabular:Internals');


let data_to_tabular = require( 'node-tabular-data' ).data_to_tabular

module.exports = function(doc, name, cb){
  data_to_tabular(doc, {}, name, function(name, tabular){
    Array.each(tabular, function(val, index){
      Array.each(val, function(row, i_row){
        if(isNaN(row))
          val[i_row] = undefined
      })
      tabular[index] = val.clean()
    })

    debug_internals(name, tabular)

    if(tabular.length == 0 || (tabular[0].length <= 1)){
      cb(name, undefined)
    }
    else{
      cb(name, tabular)
    }

  })
}
