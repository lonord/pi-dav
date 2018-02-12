#!/usr/bin/env node

import { copyFileSync, existsSync } from 'fs'
import { createServer } from 'http'
import * as jsDAV_Locks_Backend_FS from 'jsDAV/lib/DAV/plugins/locks/fs'
import * as jsDAV from 'jsDAV/lib/jsdav'
import * as mkdirp from 'mkdirp'
import * as os from 'os'
import { join } from 'path'
import * as YAML from 'yamljs'

const configDir = join(os.homedir(), '.pi-dav')
const configFile = join(configDir, 'config.yml')
const locksDir = join(os.tmpdir(), 'pi-dav/locks')

mkdirp.sync(configDir)
mkdirp.sync(locksDir)
if (!existsSync(configFile)) {
	copyFileSync(join(__dirname, '../resource/default-config.yml'), configFile)
}

const config = YAML.load(configFile) || {}
const port = config.port || 8090
const host = config.host || '0.0.0.0'
const nodes: MountNode[] = config.nodes || []

const locksBackend = jsDAV_Locks_Backend_FS.new(locksDir)
const server = createServer((req, res) => {
	res.statusCode = 404
	res.end()
})
for (const n of nodes) {
	if (n.path && n.mount) {
		jsDAV.mount({
			node: n.path,
			mount: n.mount,
			server,
			locksBackend
		})
		console.log(`> Mounted ${n.path} to http path ${n.mount}`)
	}
}
server.listen(port, host, () => {
	console.log(`> jsDAV server running on http://${host}:${port}`)
})

interface MountNode {
	path: string
	mount: string
}
