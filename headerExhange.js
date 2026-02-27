const ampq =  require('amqplib')

const sendNotification = async(headers,message)=>{
try {
    const connection = await ampq.connect("amqp://localhost")
    const channel = connection.createChannel()

    const exchange = "headers_exchange"
    const exchangeType = "headers"

    (await channel).assertExchange(exchange,exchangeType, {durable:true})

    (await channel).publish(exchange,"",Buffer.from(message),{
        presistent: true,
        headers
    })

    console.log(" Sent notification with headers ")

    setTimeout(()=>{
        connection.close();
    },500);
} catch (error) {
    console.error("Error: ",error)
}
}

// Example usage
sendNotification({ "x-match": "all", "notification-type": "new_video", "content-type": "video" }, "New music video uploaded");
sendNotification({ "x-match": "all", "notification-type": "live_stream", "content-type": "gaming" }, "Gaming live stream started");
sendNotification({ "x-match": "any", "notification-type-comment": "comment", "content-type": "vlog" }, "New comment on your vlog");
sendNotification({ "x-match": "any", "notification-type-like": "like", "content-type": "vlog" }, "New comment on your vlog");