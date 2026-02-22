const ampq =require("amqplib")

const pushNotification = async()=>{
    try {
        const connection = await ampq.connect("amqp://localhost")
        const channel = await connection.createChannel()

        const exchange = "new_product_launch"
        const exchangeType = "fanout"

        await channel.assertExchange(exchange,exchangeType,{durable: true})

        const queue = await channel.assertQueue("",{exclusive:true})
        await channel.bindQueue(queue.queue, exchange,"")

        console.log("Waiting for messages ", queue)

        channel.consume(queue.queue,(message)=>{
            if(message){
                const product = JSON.parse(message.content.toString())
                console.log("Sending SMS Notification for Product => ",product.name)
                console.log(queue)
                channel.ack(message)
                
            }
        })
    } catch (error) {
        console.error("Error: ", error)
        
    }
}

pushNotification()