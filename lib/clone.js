const git = require('isomorphic-git')

const { getOptions } = require('./options')

const clone = (options) => {
    options = getOptions(options)

    return git.clone(options)
}

module.exports = { clone }
