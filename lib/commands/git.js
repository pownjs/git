exports.yargs = {
    command: 'git <command>',
    describe: 'GIT security toolkit',

    builder: (yargs) => {
        yargs.command(require('./subcommands/people').yargs)
        yargs.command(require('./subcommands/leaks').yargs)
    }
}
