const amqp = require('amqplib')

async function sendToDelayedQueue(
  batchId = `batch-${Date.now()}`,
  orders = [{"item1":"phone"},{"item2":"laptop"}],
  delay = 10000
){
const connection = await amqp.connect("amqp://localhost");
const channel = await connection.createChannel();

const exchange = 'delayed_exchange';
await channel.assertExchange(exchange,"x-delayed-message",{
    arguments : {"x-delayed-type":"direct"}
});

const queue = "delayed_order_updates_queue";
await channel.assertQueue(queue,{durable: true})
await channel.bindQueue(queue,exchange,"");

const message = JSON.stringify({batchId,orders})
 channel.publish(exchange, "",Buffer.from(message),{
    headers : {"x-delay":delay}
})

console.log(`Sent batch ${batchId} update task to delayed queue with ${delay}`)

await channel.close();
await connection.close();
}

sendToDelayedQueue();