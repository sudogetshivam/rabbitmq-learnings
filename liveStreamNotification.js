const ampq =  require('amqplib')

const liveStream = async(headers,message)=>{
try {
    const connection = await ampq.connect("amqp://localhost")
    const channel = await connection.createChannel()

    const exchange = "header_exchange"
    const exchangeType = "headers"

    await channel.assertExchange(exchange,exchangeType, {durable:true})
    const q =  await channel.assertQueue("",{exclusive: true})
    console.log("Waiting for Live stream notification")

     await channel.bindQueue(q.queue, exchange, "",{
        "x-match": "all", "notification-type": "live_stream", "content-type": "gaming"
     })

     await channel.consume(q.queue,(msg)=>{
        if(msg){{
        const message = msg.content.toString();
        console.log("Send new Live Stream video notification", message);
        channel.ack(msg)
        }}
     })


} catch (error) {
    console.error("Error: ",error)
}
}

liveStream()
