require('proof')(2, prove)

function prove (okay) {
    var sequester = require('..')

    var order = []
    library(function (value) {
        order.push('second')
        okay(order, [ 'first', 'second' ], 'latch')
        okay(value, 1, 'value')
    })

    function library (callback) {
        var lock = sequester.createLock()
        lock.exclude(function () {})
        order.push('first')
        lock.share(function (value) { callback(value) })
        lock.unlock(1)
    }
}
