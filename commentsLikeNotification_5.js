const ampq =  require('amqplib')

const commentsLike = async(headers,message)=>{
try {
    const connection = await ampq.connect("amqp://localhost")
    const channel = await connection.createChannel()

    const exchange = "header_exchange"
    const exchangeType = "headers"

    await channel.assertExchange(exchange,exchangeType, {durable:true})
    const q = await channel.assertQueue("",{exclusive: true})
    console.log("Waiting for new Like or comment notification")

     await channel.bindQueue(q.queue, exchange, "",{
        "x-match":"any",
        "notification-type-comment":"comment",
        "notification-type-like":"like"
     })

     await channel.consume(q.queue,(msg)=>{
        if(msg){{
        const message = msg.content.toString();
        console.log("Send new comment or like notification", message);
        channel.ack(msg)
        }}
     })

} catch (error) {
    console.error("Error: ",error)
}
}

commentsLike();

