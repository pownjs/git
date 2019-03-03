exports.yargs = {
    command: 'leaks <repo>',
    describe: 'Search for leaks in repository',

    builder: {
        ref: {
            describe: 'GIT ref',
            type: 'string',
            default: 'master'
        }
    },

    handler: async(argv) => {
        const { ref, repo } = argv

        const fs = require('fs')

        const { fetch } = require('../../contents')
        const { maybeFetch } = require('../../helpers')
        const { enumCommitFiles } = require('../../history')

        const dir = await maybeFetch(repo)

        for await (const commitFile of enumCommitFiles({ fs, dir, ref })) {
            const { commit, file } = commitFile

            const data = await fetch({ fs, dir, oid: file.oid })

            // TODO: search data with worker
        }
    }
}
