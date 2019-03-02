require('proof')(1, prove)

function prove (okay) {
    var sequester = require('..')

    var order = []
    library(function () {
        order.push('second')
        okay(order, [ 'first', 'second' ], 'countdown')
    })

    function library (callback) {
        var lock = sequester.createLock()
        var count = 10
        for (var i = 0; i < count; i++) {
            lock.share(function () {})
        }
        lock.exclude(function () { lock.unlock() })
        order.push('first')
        lock.share(function () {
            callback()
        })
        for (var i = 0; i < count; i++) {
            lock.unlock()
        }
    }
}
