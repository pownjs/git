exports.yargs = {
    command: 'people <repo>',
    describe: 'Extract all authors and committers in repository',

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

        const { maybeFetch } = require('../../helpers')
        const { enumCommits } = require('../../history')

        const dir = await maybeFetch(repo)

        const refs = {}

        for await (const commit of enumCommits({ fs, dir, ref })) {
            const { author = {}, committer = {} } = commit

            const { name: authorName = '', email: authorEmail = '' } = author

            const authorRef = `${authorName} <${authorEmail}>`

            if (authorRef !== ' <>' && !refs.hasOwnProperty(authorRef)) {
                refs[authorRef] = 1

                console.log(authorRef)
            }

            const { name: committerName = '', email: committerEmail = '' } = committer

            const committerRef = `${committerName} <${committerEmail}>`

            if (committerRef !== ' <>' && !refs.hasOwnProperty(committerRef)) {
                refs[committerRef] = 1

                console.log(committerRef)
            }
        }
    }
}
