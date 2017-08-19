'use strict'
// Put directory contents of JSON files to all.json file
const fs = require('fs-extra')
const dir = require('node-dir')
const glob = require('glob-all')

function getDirs(path) {
	return new Promise((resolve, reject) => {
		dir.subdirs(path, (err, dirs) => {
			if (err) return reject(err)
			dirs.unshift(path)
			resolve(dirs)
		})
	})
}

function getFiles(paths) {
	const promises = []
	paths.forEach(path => {
		promises.push(new Promise((resolve, reject) => {
			glob([`${path}/**/*.json`, `!${path}/**/all.json`], (err, files) => {
				if (err) return reject(err)
				resolve(files)
			})
		}))
	})
	return Promise.all(promises)
		.then(fileSets => {
			const obj = {}
			fileSets.forEach((files, i) => {
				obj[paths[i]] = files
			})
			return obj
		})
}

function createAllJson(obj) {
	const promises = []
	for (let i in obj) {
		promises.push(createSingleJson(i, obj[i]))
	}
	return Promise.all(promises)
}
function createSingleJson(dest, paths) {
	const promises = paths.map(path => fs.readJson(path))
	return Promise.all(promises)
		.then(contents => {
			return fs.outputJson(`${dest}/all.json`, contents)
		})
}

module.exports = dir => {
	getDirs(dir)
		.then(getFiles)
		.then(createAllJson)
		.catch(err => {
			throw new Error(err)
		})
}