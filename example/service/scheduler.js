 const { ServiceWrapper } = require("@molfar/csc")
 const { AmqpManager, Middlewares, yaml2js} = require("@molfar/amqp-client")
 const fs = require("fs")
 const path = require("path")

 let service = new ServiceWrapper({
 	publisher: null,
 	config: null,
 	
 	async onConfigure(config,resolve){
 		
 		console.log("configure scheduler")
 		this.config = config
	 	this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
	 	
	 	await this.publisher.use([
		    Middlewares.Schema.validator(this.config.service.produce.message),
		    Middlewares.Error.BreakChain,
		    Middlewares.Json.stringify
		])
	 	
		resolve({status: "configured"})
	
 	},

	onStart(data,resolve){
 		
 		let channels = yaml2js(fs.readFileSync(path.resolve(__dirname, "./tg-channels.yaml")).toString()).url
 		channels.forEach( url => {
 			this.publisher.send({type:"telegram", url})
		})
 		
 		console.log(`initiate ${channels.length} tasks`)
 		
		resolve({status: "started"})	
 	},

 	async onStop(data,resolve){
		
		console.log("stop scheduler")
		await this.publisher.close()
		
		resolve({status: "stoped"})

	}

 })

 service.start()

