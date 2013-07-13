function Sequester () {
    this._queue = [[]]
}

Sequester.prototype.exclude = function (callback) {
    var queue = this._queue
    queue.push([ callback ])
    queue.push([])
    if (queue[0].length == 0) {
        this.unlock()
    }
}

Sequester.prototype.unlock = function (page) {
    var queue = this._queue
    queue[0].shift()
    while (queue[0].length == 0 && queue.length != 1) {
        queue.shift()
        queue[0].forEach(function (callback) { callback() })
    }
}

Sequester.prototype.share = function (callback) {
    var queue = this._queue
    queue[queue.length - 1].push(callback)
    if (queue.length == 1) callback()
}

module.exports = Sequester
