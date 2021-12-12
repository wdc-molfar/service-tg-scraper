const path = require("path")
const fs = require("fs")

const { Container } = require("@molfar/csc")
const { yaml2js } = require("@molfar/amqp-client")


const workerPath = path.resolve(__dirname, "../service.js")
const workerConfig = yaml2js(fs.readFileSync(path.resolve(__dirname, "./msapi/scraper.msapi.yaml")).toString())

const delay = interval => new Promise( resolve => {
	setTimeout( () => {
		resolve()
	}, interval )	
}) 


const run = async () => {

	const container = new Container()

	container.hold(workerPath, "--worker 1--")
	
	const worker1 = await container.startInstance(container.getService(s => s.name == "--worker 1--"))
	let res = await worker1.configure(workerConfig)
	console.log(res)
	

	res = await worker1.start()
	console.log(res)

	// await delay(10000)

	// res = await worker1.stop()
	
	// container.terminateAll()
	
}

run()