const git = require('isomorphic-git')

const fetch = async(options) => {
    const { type, object } = await git.readObject(options)

    if (type !== 'blob') {
        throw new Error(`Fetching non file object`)
    }

    return object
}

module.exports = { fetch }
