require('proof')(1, prove)

function prove (okay) {
    var sequester = require('..')

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
        okay(order, [ 'first', 'second', 'third' ], 'mutex')
    })

    lock.unlock()
}
