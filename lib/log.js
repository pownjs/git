const git = require('isomorphic-git')

const { getOptions } = require('./options')

const getLog = (options) => {
    options = getOptions(options)

    return git.log(options)
}

const enumCommits = async function*(options) {
    options = getOptions(options)

    const log = await getLog(options)

    for await (const { commit } of log) {
        yield commit
    }
}

const enumFiles = async function*(options, root = '') {
    options = getOptions(options)

    const { object } = await git.readObject(options)

    for await (const entry of object) {
        const { type, oid, path: _path } = entry

        const path = `${root}/${_path}`

        if (type === 'blob') {
            yield { ...entry, path }
        }
        else
        if (type === 'tree') {
            yield* enumFiles({ ...options, oid }, path)
        }
    }
}

const enumCommitFiles = async function*(options) {
    options = getOptions(options)

    const previousOids = {}

    for await (const commit of enumCommits(options)) {
        for await (const file of enumFiles({ ...options, oid: commit.tree })) {
            if (!previousOids.hasOwnProperty(file.oid)) {
                previousOids[file.oid] = 1

                yield { commit, file }
            }
        }
    }
}

module.exports = { getLog, enumCommits, enumFiles, enumCommitFiles }
