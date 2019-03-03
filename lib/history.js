const git = require('isomorphic-git')

const enumCommits = async function*(options) {
    const commits = await git.log(options)

    for (const commit of commits) {
        yield commit
    }
}

const enumCommitFiles = async function*(options) {
    const previousOids = {}

    for await (const commit of enumCommits(options)) {
        let { object: tree } = await git.readObject({ ...options, oid: commit.tree })

        for (const file of tree.entries) {
            const { oid } = file

            if (!previousOids.hasOwnProperty(oid)) {
                previousOids[oid] = 1

                yield { commit, file }
            }
        }
    }
}

module.exports = { enumCommits, enumCommitFiles }
