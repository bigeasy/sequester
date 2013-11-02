var __slice = [].slice

function Sequester () {
    this._queue = [[]]
    this._shared = __slice.call(arguments)
}

Sequester.prototype.share = function (callback) {
    var queue = this._queue
    queue[queue.length - 1].push(callback)
    if (queue.length == 1) callback.apply(null, this._shared)
}

Sequester.prototype.exclude = function (callback) {
    var queue = this._queue
    queue.push([ callback ])
    queue.push([])
    if (queue[0].length == 0) this.unlock()
}

Sequester.prototype.unlock = function () {
    var queue = this._queue
    if (!(queue.length % 2)) {
        this._shared = __slice.call(arguments)
    }
    queue[0].shift()
    while (queue[0].length == 0 && queue.length != 1) {
        queue.shift()
        queue[0].slice().forEach(function (callback) {
            callback.apply(null, this._shared)
        }, this)
    }
}

module.exports = Sequester
