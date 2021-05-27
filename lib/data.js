const git = require('isomorphic-git')

const { getOptions } = require('./options')

const fetch = async(options) => {
    options = getOptions(options)

    const { type, object } = await git.readObject(options)

    if (type !== 'blob') {
        throw new Error(`Fetching non file object`)
    }

    return Buffer.from(object)
}

module.exports = { fetch }
