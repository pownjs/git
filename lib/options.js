const fs = require('fs')
const http = require('isomorphic-git/http/node')

const getOptions = (options) => {
    return { fs, http, ...options }
}

module.exports = {
    getOptions
}
