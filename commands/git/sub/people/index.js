exports.yargs = {
    command: 'people <repo>',
    describe: 'Extract all authors and committers in repository',
    aliases: ['p'],

    builder: {
        ref: {
            describe: 'GIT ref',
            type: 'string',
            default: 'master'
        },

        write: {
            alias: 'w',
            describe: 'Write results to file',
            type: 'string',
            default: ''
        }
    },

    handler: async(argv) => {
        const { ref, write, repo: dir } = argv

        const fs = require('fs')

        const { enumCommits } = require('../../../../lib/log')

        let outStream

        if (write) {
            outStream = fs.createWriteStream(write)
        }

        const refs = {}

        for await (const { commit } of enumCommits({ fs, dir, ref })) {
            const { author = {}, committer = {} } = commit

            const { name: authorName = '', email: authorEmail = '' } = author

            const authorRef = `${authorName} <${authorEmail}>`

            if (authorRef !== ' <>' && !refs.hasOwnProperty(authorRef)) {
                refs[authorRef] = 1

                console.log(authorRef)

                if (outStream) {
                    outStream.write(JSON.stringify({ author: authorRef }))
                }
            }

            const { name: committerName = '', email: committerEmail = '' } = committer

            const committerRef = `${committerName} <${committerEmail}>`

            if (committerRef !== ' <>' && !refs.hasOwnProperty(committerRef)) {
                refs[committerRef] = 1

                console.log(committerRef)

                if (outStream) {
                    outStream.write(JSON.stringify({ commiter: committerRef }))
                }
            }
        }

        if (outStream) {
            outStream.close()
        }
    }
}
