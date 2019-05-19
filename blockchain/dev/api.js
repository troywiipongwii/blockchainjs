const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const blockchain = require('./blockchain');
const uuid = require('uuid/v1');

const nodeAddress = uuid().split('-').join('');

const blockchain1 = new blockchain();

 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended: false}))

app.get('/blockchain', function (req, res) {
	res.send(blockchain1)
  
});

 app.post('/transaction', function (req, res) {
 	const blockIndex = blockchain1.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient)
  	res.json({note: "Transaction will be added in block ${blockIndex}."})
});

 app.get('/mine', function (req, res) {
 	const lastBlock = blockchain1.getLastBlock();
 	const previousBlockHash = lasBlock['hash'];
 	const currentBlockData = {
 		transactions: blockchain1.newTransactions,
 		index: lastBlock['index'] + 1
 	};
 	const blockHash = blockchain1.hashBlock(previousBlockHash,currentBlockData,nonce);
 	const nonce = blockchain1.proofOfWork(previousBlockHash, currentBlockData);
 	
 	blockchain1.createNewTransaction(12.5,"Mine00",)
 	
 	const newBlock = blockchain1.createNewBlock(nonce,previousBlockHash,blockHash)
  	
  	res.josn({
  		note: "New block mined successfully",
  		block: newBlock
  	});
});


app.listen(3000, function() {
	console.log('Listening on port 3000...');
});