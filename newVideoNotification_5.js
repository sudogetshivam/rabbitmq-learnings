const amqp =  require('amqplib')

const newVideo = async(headers,message)=>{
try {
    const connection = await amqp.connect("amqp://localhost")
    const channel = await connection.createChannel()

    const exchange = "header_exchange"
    const exchangeType = "headers"

    await channel.assertExchange(exchange, exchangeType, {durable:true})
    const q = await channel.assertQueue("",{exclusive: true})
    console.log("Waiting for new video notification")

     await channel.bindQueue(q.queue, exchange, "",{
        

        "x-match": "all", "notification-type": "new_video", "content-type": "video"
     })

     await channel.consume(q.queue,(msg)=>{
        if(msg){
        const message = msg.content.toString();
        console.log("Send new Video notification", message);
        channel.ack(msg)
        }
     })

} catch (error) {
    console.error("Error: ",error)
}
}

newVideo();

// Example usage
