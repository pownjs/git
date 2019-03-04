const git = require('isomorphic-git')

const enumCommits = async function*(options) {
    const commits = await git.log(options)

    for await (const commit of commits) {
        yield commit
    }
}

const enumFiles = async function*(options) {
    const { object } = await git.readObject(options)

    const { entries } = object

    for await (const entry of entries) {
        const { type, oid } = entry

        if (type === 'blob') {
            yield entry
        }
        else
        if (type === 'tree') {
            yield* enumFiles({ ...options, oid })
        }
    }
}

const enumCommitFiles = async function*(options) {
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

module.exports = { enumCommits, enumCommitFiles }
