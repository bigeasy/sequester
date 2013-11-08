# Sequester Design Diary

## Different Lock Recipes

A latch is `exclude` and then `unlock`.

A count-down latch is `share` however many times, followed by `exclude, then
`unlock` however many times.

You might want to do reader preferred and writer preferred.

Reader preference means that new readers get tucked into the first queue, or the
queue after the first writer.

A writer preference moves all of the readers in front of the writer behind it
when the writer is not the second entry in the queue.

A mutext is just everyone called `exclude`. The get called back in order.

Oh, hey, can I have a priority queue? At least a jump the queue priority?

## Auditing

I appleciate the simplicity of Sequester as it stands now and for some use
cases, like countdown latches, Sequester is a good fit, but when building with
read and write locks, managing the transiction from shared to exclusive, I want
to have more auditing. Do I just happen to call `unlock` the proper number of
times to reach zero locks at the end of a test, but really I'm calling it twice
for one lock and zero for another so it all evens out?

In threaded langauges, a thread has an id, which is used to ensure that when we
request an exclusive lock from a thread that already holds an exclusive lock,
that instead of blocking until the current exclusive lock is called, and
deadlocking. These are called reentrant locks. They are nice if you have a
function that aqcuires and exclusive lock that you might want to call
recursively.

In the case of Strata, when you hold a lock on a branch of a tree and want a
function to take a trip down the tree from that branch, while holding the
current lock. The hand-over-hand locking of Strata is implemented by locking the
child, then releasing the parent, but we don't want the hand-over-hand locking
to release the parent the first time, because we hold that lock, just
subsequently. Currently, we increment the lock before taking the trip so that
the hand-over-hand locking does not completely release the lock, just decrements
the lock count.

```javascript
var lock = sequester.exclude(function () {
  this.increment(3)
})
lock.unlock()
lock.unlock()
lock.unlock()
lock.unlock(1) // paremeters for next call.
```

Ah, that's it. Okay. Leaves everything simple for latches, but allows for
accounting of locks. Except how annoying is it going to be to account for those
locks? My thought was that you'd have a model like this...

```javascript
var lock = sequester.createLock()
var locker = sequester.createLocker()

locker.exclude(lock, function () {
  this.increment(3)
})
```
