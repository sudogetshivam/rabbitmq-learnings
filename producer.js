//day1

const amqp = require("amqplib");

async function sendMail(){

    try {
        const  connection = await amqp.connect("amqp://localhost")
        const channel = await connection.createChannel();
        const exchange = "mail_exchange"
        const routingKey = "send_mail"

        const message = {
            to:"consumer@gmail.com",
            from:"producer@gmail.com",
            subject:"Greetings",
            body:"Hello World",
        }

        const whatValueWillIget = await channel.assertExchange(exchange, "direct" , {durable:false})
        const channelValue = await channel.assertQueue("mail_queue", {durable:false})

        const queueuValue = await channel.bindQueue("mail_queue",exchange,routingKey)
        channel.publish(exchange,routingKey,Buffer.from(JSON.stringify(message)));
        console.log("Message was send succesfully")
        console.log(whatValueWillIget,channelValue,queueuValue)

        setTimeout(()=>{
            connection.close();
        },500)

        
    } catch (error) {
        console.log(error)
        
    }

}

sendMail();