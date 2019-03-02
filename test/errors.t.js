require('proof')(2, prove)

function prove (okay) {
    var sequester = require('..')

    var lock = sequester.createLock()
    try {
        lock.unlock()
    } catch (e) {
        okay(e.message, 'unlock called with no lock held', 'lock not held on unlock')
    }
    try {
        lock.increment()
    } catch (e) {
        okay(e.message, 'increment called with no lock held', 'lock not held on increment')
    }
}
