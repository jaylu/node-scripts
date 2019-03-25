const {
    pexec,
    cwd
} = require('./lib/process-utils')
const {
    docker
} = require('./lib/docker-utils')
const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

function calculateNextVersion(versionString, mode = 'patch') {
    let digits = versionString.split('.')
    if (digits.length !== 3) {
        throw new Error('only support 3 digit version number')
    }
    let digitNumber = digits.map(string => parseInt(string))
    switch (mode) {
        case 'patch':
            return `${digitNumber[0]}.${digitNumber[1]}.${++digitNumber[2]}`
        case 'minor':
            return `${digitNumber[0]}.${++digitNumber[1]}.0`
        case 'major':
            return `${++digitNumber[0]}.0.0`
    }
}

function getNextVersion(packageJsonPath, version = null, mode = 'patch') {
    if (version && (typeof version === 'string') && version.length > 0) {
        return version
    } else {
        let packageJson = require(packageJsonPath)
        return calculateNextVersion(packageJson.version, mode)
    }
}

async function updateJsonVersion(jsonPath, newVersion) {
    let newJsonFile = _.cloneDeep(require(jsonPath))
    newJsonFile.version = newVersion
    return new Promise((resolve) => {
        let resolveJsonPath = path.resolve(__dirname, jsonPath)
        fs.writeFile(resolveJsonPath, JSON.stringify(newJsonFile, null, 4), (err) => {
            if (err) return console.log(err);
            console.log(`writing to ${resolveJsonPath} with new version ${newVersion}`);
            resolve()
        });
    })
}

async function writeFile(filePath, content) {
    return new Promise((resolve) => {
        let resolveJsonPath = path.resolve(__dirname, filePath)
        fs.writeFile(resolveJsonPath, content, (err) => {
            if (err) return console.log(err);
            console.log(`writing to ${resolveJsonPath} with content [${content}]`);
            resolve()
        });
    })
}

async function updateVersion(nextVersion) {
    await updateJsonVersion('../package.json', nextVersion)
    await writeFile('../xxx/config/version.js', `export const version = '${nextVersion}'\n`)
}

async function main() {
    let {
        version = null, mode = 'patch'
    } = args
    let nextVersion = getNextVersion('../package.json', version, mode)
    await updateVersion(nextVersion)

    // await pexec(`git status`, cwd(''))
    // await pexec(`git add .`, cwd(''))
    // await pexec(`git commit -m "version bump to ${nextVersion}"`, cwd(''))
    // await pexec(`git tag -a "v${nextVersion}" -m "v${nextVersion} for release"`, cwd(''))
    // await pexec(`git push origin "v${nextVersion}"`, cwd(''))
}

main()
    .then(() => {
        console.log('==================')
        console.log('done!')
        console.log('==================')
    })
    .catch(error => {
        console.error('build with error:', error)
    })