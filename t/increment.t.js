require('proof')(4, prove)

function prove (okay) {
    var sequester = require('..')

    var order = 0
    var lock = sequester.createLock()
    lock.share(function () {
        okay(order++, 0, 'first shared')
        lock.exclude(function () {
            okay(order++, 2, 'exclusive')
            lock.share(function () {
                okay(order++, 4, 'second shared')
            })
            lock.increment(2)
        })
        lock.increment()
    })
    lock.unlock()
    okay(order++, 1, 'first unlock')
    lock.unlock()
    lock.unlock()
    lock.unlock()
    okay(order++, 3, 'fourth unlock')
}
