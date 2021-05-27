[![Follow on Twitter](https://img.shields.io/twitter/follow/pownjs.svg?logo=twitter)](https://twitter.com/pownjs)
[![NPM](https://img.shields.io/npm/v/@pown/git.svg)](https://www.npmjs.com/package/@pown/git)
[![Fury](https://img.shields.io/badge/version-2x%20Fury-red.svg)](https://github.com/pownjs/lobby)
![default workflow](https://github.com/pownjs/git/actions/workflows/default.yaml/badge.svg)
[![SecApps](https://img.shields.io/badge/credits-SecApps-black.svg)](https://secapps.com)

# Pown Git

Pown Git is a comprehensive security scanning and testing solution for git repostories.

## Credits

Some signatures were borrowed or heavily inspired by the following projects:

* gitgit - https://github.com/zricethezav/gitgit
* shhgit - https://github.com/eth0izzle/shhgit

This tool is part of [secapps.com](https://secapps.com) open-source initiative.

```
  ___ ___ ___   _   ___ ___  ___
 / __| __/ __| /_\ | _ \ _ \/ __|
 \__ \ _| (__ / _ \|  _/  _/\__ \
 |___/___\___/_/ \_\_| |_|  |___/
  https://secapps.com
```

### Authors

* [@pdp](https://twitter.com/pdp) - https://pdparchitect.github.io/www/

## Quickstart

This tool is meant to be used as part of [Pown.js](https://github.com/pownjs/pown), but it can be invoked separately as an independent tool.

Install Pown first as usual:

```sh
$ npm install -g pown@latest
```

Install git:

```sh
$ pown modules install @pown/git
```

Invoke directly from Pown:

```sh
$ pown git
```

### Standalone Use

Install this module locally from the root of your project:

```sh
$ npm install @pown/git --save
```

Once done, invoke pown cli:

```sh
$ POWN_ROOT=. ./node_modules/.bin/pown-cli git
```

You can also use the global pown to invoke the tool locally:

```sh
$ POWN_ROOT=. pown git
```

## Usage

> **WARNING**: This pown command is currently under development and as a result will be subject to breaking changes.

```
pown-cli git <command>

Git security toolkit

Commands:
  pown-cli git clone <uri> [dir]  Clone git repository  [aliases: c]
  pown-cli git people <repo>      Extract all authors and committers in repository  [aliases: p]
  pown-cli git leaks <repo>       Search for leaks in git repository  [aliases: l, leak]

Options:
  --version  Show version number  [boolean]
  --help     Show help  [boolean]

pown-cli git clone <uri> [dir]

Clone git repository

Options:
  --version           Show version number  [boolean]
  --help              Show help  [boolean]
  --ref, -r           Which branch to checkout. By default this is the designated "main branch" of the repository.  [string]
  --depth, -d         Determines how much of the git repository's history to retrieve.  [number] [default: 10000]
  --singleBranch, -b  Instead of the default behavior of fetching all the branches, only fetch a single branch.  [boolean] [default: true]
  --githubKey         GitHub API Key. The key is either in the format username:password or username:token.  [string]
pown-cli git leaks <repo>

Search for leaks in git repository

Options:
  --version          Show version number  [boolean]
  --help             Show help  [boolean]
  --ref, -r          Which branch to scan. By default this is the designated "main branch" of the repository.  [string]
  --depth, -d        Determines how much of the git repository's history to retrieve.  [number] [default: Infinity]
  --concurrency, -c  Number of workers.  [number] [default: 10]
  --severity, -s     Miminum severity level.  [number] [default: 0]
  --write, -w        Write results to file.  [string]

pown-cli git people <repo>

Extract all authors and committers in repository

Options:
  --version    Show version number  [boolean]
  --help       Show help  [boolean]
  --ref, -r    Which branch to scan. By default this is the designated "main branch" of the repository.  [string]
  --depth, -d  Determines how much of the git repository's history to retrieve.  [number] [default: Infinity]
  --write, -w  Write results to file.  [string]
```

## How To Contribute

See [pown/leaks](https://github.com/pownjs/leaks/) for instructions to how extend the leaks database.
