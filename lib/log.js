const git = require('isomorphic-git')

const getLog = (options) => {
    return git.log(options)
}

const enumCommits = async function*(options) {
    const log = await getLog(options)

    for await (const { commit } of log) {
        yield commit
    }
}

const enumFiles = async function*(options = {}, root = '') {
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

const enumCommitFiles = async function*(options = {}) {
    const { fs, dir } = options

    const previousOids = {}

    for await (const commit of enumCommits(options)) {
        for await (const file of enumFiles({ fs, dir, oid: commit.tree })) {
            // TODO: replace with faster hash lookup

            if (!previousOids.hasOwnProperty(file.oid)) {
                previousOids[file.oid] = 1

                yield { commit, file }
            }
        }
    }
}

module.exports = { getLog, enumCommits, enumFiles, enumCommitFiles }
