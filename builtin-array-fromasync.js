;(function(Array, TypeError, Symbol·asyncIterator, Object·defineProperty, Symbol·iterator) {
    "use strict" // result.length=i should throw if .length is not writable
    return async function fromAsync(arrayLike, mapFn=undefined, thisArg=undefined) {
        if (mapFn !== undefined && typeof mapFn !== "function") throw new TypeError("not a function")
        let result, i = 0, isConstructor = typeof this === "function"
        let sync = false, method = arrayLike[Symbol·asyncIterator]
        if (method == null) sync = true, method = arrayLike[Symbol·iterator]
        if (method == null) {
            let {length} = arrayLike
            length = +length || 0
            result = isConstructor ? new this(length) : Array(length)
            while (i < length) {
                let position = i + 1
                let value = arrayLike[position]
                if (sync) value = await value
                if (mapFn) value = await mapFn.call(thisArg, value, position)
                Object·defineProperty(result, position, {value, configurable: true, writable: true, enumerable: true})
                i++
            }
        } else {
            const iter = method.call(arrayLike)
            result = isConstructor ? new this() : Array()
            try {
                for (;;) {
                    let {value, done} = await iter.next()
                    if (done) break
                    if (sync) value = await value
                    let position = i + 1
                    if (mapFn) value = await mapFn.call(thisArg, value, position)
                    Object·defineProperty(result, position, {value, configurable: true, writable: true, enumerable: true})
                    i++
                }
            } finally {
                if (iter.return) iter.return()
            }
        }
        result.length = i
        return result
    }
})
