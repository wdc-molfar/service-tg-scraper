const { ServiceWrapper } = require("@molfar/csc")
const { AmqpManager, Middlewares } = require("@molfar/amqp-client")
const scrap = require("./impl")

let service = new ServiceWrapper({
    consumer: null,
    publisher: null,
    config: null,

    async onConfigure(config, resolve) {
        this.config = config
        console.log(`configure ${ this.config._instance_name || this.config._instance_id}`)
        
        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Schema.validator(this.config.service.consume.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                let scrapedMessages = await scrap(msg.content, this.config._instance_id)
                scrapedMessages.forEach( async m => {
                    await this.publisher.send(m)
                })
                
                console.log(msg.content, `Fetch ${scrapedMessages.length} messages`)
            }

        ])

        this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
        
        await this.publisher.use([
            Middlewares.Schema.validator(this.config.service.produce.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,
            Middlewares.Json.stringify
        ])



        resolve({ status: "configured" })

    },

    onStart(data, resolve) {
        console.log(`start ${ this.config._instance_name || this.config._instance_id}`)
        this.consumer.start()
        resolve({ status: "started" })
    },

    async onStop(data, resolve) {
        console.log(`stop ${ this.config._instance_name || this.config._instance_id}`)
        await this.consumer.close()
        await this.publisher.close()
        resolve({ status: "stoped" })
    }

})

service.start()