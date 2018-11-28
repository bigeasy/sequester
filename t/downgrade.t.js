require('proof')(1, prove)

function prove (okay) {
    var sequester = require('..')

    var lock = sequester.createLock()
    var order = []

    lock.share(function () {})
    lock.exclude(function () {
        lock.downgrade(function () {
            order.push('downgraded')
            lock.unlock()
        })
        order.push('exclusive')
    })
    lock.share(function () {
        order.push('shared')
        lock.unlock()
    })
    lock.exclude(function () {
        order.push('exclusive again')
        okay(order, [ 'exclusive', 'shared', 'downgraded', 'exclusive again' ], 'downgrade')
        lock.unlock()
    })
    lock.unlock()
    lock.unlock()
}
