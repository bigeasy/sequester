require('proof')(1, prove)

function prove (assert) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    var order = []

    lock.exclude(function () {
        order.push('first')
    })
    lock.exclude(function () {
        order.push('second')
        lock.unlock()
    })
    lock.exclude(function () {
        order.push('third')
        lock.unlock()
    })
    lock.exclude(function () {
        assert(order, [ 'first', 'second', 'third' ], 'mutex')
    })

    lock.unlock()
}
