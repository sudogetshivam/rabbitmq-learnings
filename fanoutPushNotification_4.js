const ampq =require("amqplib")

const smsNotification = async()=>{
    try {
        const connection = await ampq.connect("amqp://localhost")
        const channel = await connection.createChannel()

        const exchange = "new_product_launch"
        const exchangeType = "fanout"

        await channel.assertExchange(exchange,exchangeType,{durable: true})
        const queue = await channel.assertQueue("",{exclusive:true})

        console.log("Waiting for messages ",queue)

        await channel.bindQueue(queue.queue, exchange,"")
        
        channel.consume(queue.queue,(message)=>{
            if(message){
                const product = JSON.parse(message.content.toString())
                console.log("Sending Push Notification for Product => ",product.name)
                channel.ack(message)
            }
        })
    } catch (error) {
        console.error("Error: ", error)
        
    }
}

smsNotification();