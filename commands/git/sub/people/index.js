exports.yargs = {
    command: 'people <repo>',
    describe: 'Extract all authors and committers in repository',
    aliases: ['p'],

    builder: {
        ref: {
            alias: 'r',
            describe: 'Which branch to scan. By default this is the designated "main branch" of the repository.',
            type: 'string'
        },

        depth: {
            alias: 'd',
            describe: 'Determines how much of the git repository\'s history to retrieve.',
            type: 'number',
            default: Infinity
        },

        write: {
            alias: 'w',
            describe: 'Write results to file.',
            type: 'string'
        }
    },

    handler: async(argv) => {
        const { ref, depth, write, repo: dir } = argv

        const fs = require('fs')

        const { enumCommits } = require('../../../../lib/log')

        let outStream

        if (write) {
            outStream = fs.createWriteStream(write)
        }

        const refs = {}

        for await (const commit of enumCommits({ dir, ref, depth })) {
            const { author = {}, committer = {} } = commit

            const { name: authorName = '', email: authorEmail = '' } = author

            const authorRef = `${authorName} <${authorEmail}>`

            if (authorRef !== ' <>' && !refs.hasOwnProperty(authorRef)) {
                refs[authorRef] = 1

                console.log(authorRef)

                if (outStream) {
                    outStream.write(JSON.stringify({ ref: authorRef, name: authorName, email: authorEmail }))
                }
            }

            const { name: committerName = '', email: committerEmail = '' } = committer

            const committerRef = `${committerName} <${committerEmail}>`

            if (committerRef !== ' <>' && !refs.hasOwnProperty(committerRef)) {
                refs[committerRef] = 1

                console.log(committerRef)

                if (outStream) {
                    outStream.write(JSON.stringify({ ref: committerRef, name: authorName, email: authorEmail }))
                }
            }
        }

        if (outStream) {
            outStream.close()
        }
    }
}
