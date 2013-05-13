#!/usr/bin/env coffee
root = this

# `setImmediate` for node and the browser.
if typeof process is 'undefined' or not (process.nextTick)
    if typeof setImmediate is 'function'
        _setImmediate = setImmediate
    else
        _setImmediate = (fn) -> setTimeout fn, 0
else
    if typeof setImmediate isnt 'undefined'
        _setImmediate = setImmediate
    else
        _setImmediate = process.nextTick

# Microsoft sucks... 
_each = (arr, iterator) ->
    return arr.forEach(iterator) if arr.forEach
    ( iterator(value, key, arr) for key, value of arr )

# Copy all of the properties in the source objects over to the destination object and return the destination object. 
_extend = (obj) ->
    _each Array::slice.call(arguments, 1), (source) ->
        if source
            for prop of source
                obj[prop] = source[prop]

    obj

# Generate a UID.
_uid = ->
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace /[xy]/g, (c) ->
        r = Math.random() * 16 | 0
        (if c is "x" then r else r & 0x3 | 0x8).toString 16

# # Ajax (XMLHttpRequest).
# _xhr = ({ url, method, headers, data, credentials }, cb = ->) ->
#     # Will return XMLHttpRequest with fallback to ActiveXObject.
#     req = do ->
#         return new XMLHttpRequest() if window.XMLHttpRequest
#         try
#             return new ActiveXObject 'msxml2.xmlhttp.6.0'
#         try
#             return new ActiveXObject 'msxml2.xmlhttp.3.0'
#         try
#             return new ActiveXObject 'msxml2.xmlhttp'


#     req.open method or 'GET', url, true
#     req.withCredentials = credentials or false
    
#     # Set headers.
#     _each headers or {}, (value, key) ->
#         req.setRequestHeader key, value

#     # Callback
#     req.onload = (e) ->
#         if req.status not in [ 200, 304 ]
#             cb "Server responded with a status of `#{req.status}"
#         else
#             cb null, e.target

#     # Fire!
#     req.send data