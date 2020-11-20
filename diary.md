## Thu Nov 19 19:48:17 CST 2020

Tried to make an upgradable shared mutex but it got complicated. A basic
implementation would mark a shared entry as upgradable. If upgrade is called you
assign a `Promise` `resolve` method to `upgrade` and return the promise. When
you unlock and reach zero you check to see if there is a resolve and unshift an
exclusive lock onto the queue, reassign the Promise of the first shared.

You also unset the upgradable flag if you hit zero.

However, if you do not reach zero, if the same come path comes back it's going
to extend the queue. This is going to reduce throughput somewhat. If you have
more than one upgradable queued, then you've pretty much got the same perfrmance
as exclusive unless you want scan backwards through the queue to see if the
shared mutexes are before the last are upgradable and select the one furthest
from the end.

Ah, no. You starve the one waiting for upgradable.

Anyway, I'll have to write something with Sequester first and see if there are
any glaring opportunities for an upgradable lock. Seems like I'm always going to
know when something requires and exclusive write since I generally set things up
synchronously.

## Thu Nov 19 19:48:06 CST 2020

Older.

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

*update*: I am suspect. It is the same pattern as in Magazine, but I don't like
the lock object, or the memento that is returned. Instead, why not make the
queue central to a Queue object and the Sequester object is an instance of a
lock?

```javascript
var queue = sequester.createQueue()
var lock = queue.createLock()

lock.exclude(lock, function () {
  lock.increment(3)
})


lock.unlock()
ok(lock.count == 0)
lock.dispose() // <- assert check that no locks are held, reuse internals.
```

Same API, but each instance of lock tracks it's own locks and releases so that a
failed lock and release is slightly more isolated. Get to keep our single API.

```javascript
var lock = sequester.createLock()

lock.exclude(lock, function () {
  lock.increment(3)
})


lock.unlock()
ok(lock.count == 0)
lock.dispose() // <- assert check that no locks are held, reuse internals.
```

Note that we do not use reentrancy in either case, still use increment. If we
call exclude while holding an exclusive lock we "deadlock".


## Error-First Callbacks

Brainstorm: Instead of `unlock()` you can just give out `callback` and
everything is an error first callback!!

Brainstorm! Krissh-kiabow!

Okay, but...

You're using this orthognially. You don't want to start from a new queue, you
just want to wait your **cadence**. This is perfect citizen of the Cadence
universe and designed very well without knowing what was coming.

We don't want our waiting to get in the way of what we want to return to the
caller. Sequester throws mutex waits into an asynchronous stack.
