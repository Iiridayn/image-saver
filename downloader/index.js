const readline = require('readline');
const util = require('util');
const urlLib = require('url');
const path = require('path');
const fsPromises = require('fs').promises;

const phin = require('phin');
const htmlSoup = require('html-soup');

const imagePageParser = require('../extension/image_page_parser.js')

const cacheDir = './cache';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36';

async function getFile(url, { cacheFile, cookie }) {
	if (cacheFile) {
		const data = await fsPromises.readFile(cacheFile, 'utf8').catch(e => {
			if (e.code == 'ENOENT')
				return null;
			return Promise.reject(e);
		});
		if (data !== null)
			return { body: data || null };
	}

	const headers = { 'user-agent': userAgent };
	if (cookie) {
		headers.cookie = cookie;
	}

	const res = await phin({
		url, followRedirects: true, headers,
	});
	console.log(`got ${res.statusCode} for ${url}`);

	if (res.statusCode < 200 || res.statusCode >= 300) {
		if (cacheFile)
			fsPromises.writeFile(cacheFile, ''); // XXX
		return { body: null };
	}

	if (cacheFile)
		await fsPromises.writeFile(cacheFile, res.body); // await - might need to unlink it

	return res;
}

function buildQsFunc(dom) {
	return function(query) {
		const res = htmlSoup.select(dom, query);
		//console.log('qs', arguments[0], [...res][0]);
		return res.size ? [...res][0] : null;
	};
}
function buildQsaFunc(dom) {
	return function(query) {
		const res = htmlSoup.select(dom, query);
		//console.log('qsa', arguments[0], [...res]);
		return [...res];
	};
}

// doesn't handle table rows or cells, or apply css - should be adequate though
function getInnerText(node) {
	if (node.type === 'br')
		return '\n';

	let text = '';
	node.children.forEach(child => {
		if (child.constructor.name === 'HtmlTag') {
			text += getInnerText(child);
		} else if (child.constructor.name === 'TextNode') {
			text += child.text;
		} else {
			console.warn('Unhandled type', child.constructor.name);
		}
	});

	if (node.type === 'p')
		return '\n' + text + '\n';
	else
		return text;
}

function proxifyNode(node) {
	if (util.types.isProxy(node))
		return node;

	let wrappedChildren = false;
	return new Proxy(node, {
		get: function(target, property, receiver) {
			if (property === 'childNodes')
				property = 'children';
			// children must be wrapped!
			if (property === 'children' && !wrappedChildren) {
				wrappedChildren = true;
				target.children = target.children.map(child => {
					if (child.constructor.name === 'HtmlTag') {
						return proxifyNode(child);
					} else if (child.constructor.name === 'TextNode') {
						child.textContent = child.text;
						return child;
					}
					console.warn('Unknown node type:', child.constructor.name);
					return child;
				});
			}

			// prefer normal properties first
			if (property in target)
				return target[property];

			// parent also must be wrapped if not already
			if (property === 'parentElement') {
				return proxifyNode(target.parent);
			}

			if (property === 'innerText')
				return getInnerText(target).trim();

			if (property === 'dataset') {
				const dataset = new Proxy(target, {
					get: function(target, property, receiver) {
						if (typeof property === 'symbol')
							return;
						return target.attributes['data-' + property.replace(/([A-Z])/g, (match, p1) => '-' + p1.toLowerCase())];
					}
				});
				// set as property so I only build the dataset Proxy once
				target[property] = dataset;
				return dataset;
			}

			// check for attributes after the special properties
			if (property in target.attributes)
				return target.attributes[property];
		},
	});
}

function normalizeUrl(parts, url) {
	if (url[0] !== '/')
		return url;
	// single slash - relative path
	if (url[1] !== '/')
		return parts.protocol + '//' + parts.host + url;
	// double slashes - just needs the protocol
	return parts.protocol + url;
}

async function processLine(line, cookie) {
	// skip commented lines
	if (line[0] == '#')
		return;

	const url = line; // TODO: check for spaces, etc?

    const urlParts = urlLib.parse(url);
	const urlFile = path.basename(urlParts.pathname);
	if (urlFile.match(/\.(?:png|jpe?g|gif)$/))
		return {
			download: url,
			sources: [ url ],
			title: path.basename(urlFile, path.extname(urlFile)),
		};

	// TODO: check for cache iff dev mode
	const cacheFile = cacheDir + '/' + encodeURIComponent(url);
	const res = await getFile(url, { cacheFile, cookie });
	if (res.body === null) {
		console.log(`missing ${url}`);
		return;
	}
	console.log(`got ${res.body.length} bytes for ${url}`);
	const dom = htmlSoup.parse(res.body);
	const proxified = Array.isArray(dom) ? dom.map(proxifyNode) : proxifyNode(dom);

	const data = imagePageParser.parse(url, buildQsFunc(proxified), buildQsaFunc(proxified));

	if (data === 'login') {
		console.error('Need to login to get the file');
		return;
	}

	data.download = normalizeUrl(urlParts, data.download);
	data.sources = data.sources.map(s => normalizeUrl(urlParts, s));

	data.sources.unshift(url);

	return data;
}

async function start() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.on('line', line => processLine(line).then(data => data ? console.log(data) : ''));
}

async function setup() {
	// TODO: if dev mode
	await fsPromises.mkdir(cacheDir).catch(e => {
		if (e.code == 'EEXIST')
			return;
		return Promise.reject(e);
	});
}

setup().then(start);
