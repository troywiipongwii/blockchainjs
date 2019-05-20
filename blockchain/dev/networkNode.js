const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid().split('-').join('');

const blockchain1 = new blockchain();

 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended: false}))

app.get('/blockchain', function (req, res) {
	res.send(blockchain1)
  
});

// create a new transaction
app.post('/transaction', function(req, res) {
	const newTransaction = req.body;
	const blockIndex = blockchain1.addTransactionToPendingTransactions(newTransaction);
	res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

//transactions need to be broadcast to all nodes, refactor
 app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = blockchain1.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	blockchain1.addTransactionToPendingTransactions(newTransaction);

	const requestPromises = [];
	blockchain1.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'Transaction created and broadcast successfully.' });
	});
});

// mine a block
app.get('/mine', function(req, res) {
	const lastBlock = blockchain1.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: blockchain1.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const nonce = blockchain1.proofOfWork(previousBlockHash, currentBlockData);
	const blockHash = blockchain1.hashBlock(previousBlockHash, currentBlockData, nonce);
	const newBlock = blockchain1.createNewBlock(nonce, previousBlockHash, blockHash);

	const requestPromises = [];
	blockchain1.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receive-new-block',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: blockchain1.currentNodeUrl + '/transaction/broadcast',
			method: 'POST',
			body: {
				amount: 12.5,
				sender: "00",
				recipient: nodeAddress
			},
			json: true
		};

		return rp(requestOptions);
	})
	.then(data => {
		res.json({
			note: "New block mined & broadcast successfully",
			block: newBlock
		});
	});
});

// receive new block
app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = blockchain1.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash; 
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		blockchain1.chain.push(newBlock);
		blockchain1.pendingTransactions = [];
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
});




 app.post('/register-and-broadcast-node', function(req,res) {
 	const newNodeUrl = req.body.newNodeUrl;
 	if (blockchain1.networkNodes.indexOf(newNodeUrl) == -1) blockchain1.networkNodes.push(newNodeUrl);
 	
 	const regNodesPromises = []
 	blockchain1.networkNodes.forEach(networkNodeUrl => {
 		const requestOptions = {
 			uri: networkNodeUrl + '/register-node',
 			method: 'POST',
 			body: { newNodeUrl: newNodeUrl},
 			json: true

 		};

 		regNodesPromises.push(rp(requestOptions))
 	});

 	Promise.all(regNodesPromises)
 	.then(data => {
 		const bulkRegisterOptions = {
 			uri: newNodeUrl + '/register-nodes-bulk',
 			method: 'POST',
 			body: { allNetworkNodes: [...blockchain1.networkNodes, blockchain1.currentNodeUrl] },
 			json: true
 		};

 		return rp(bulkRegisterOptions)
 	})
 	.then(data => {
 		res.json({note: 'New node registered with network successfully'})

 	});

 });

//register a node with the network
 app.post('/resgister-node', function(req,res) {
 	const newNodeUrl = req.body.newNodeUrl;
 	const nodeNotAlreadyPresent = blockchain1.networkNodes.indexOf(newNodeUrl) == -1
 	const notCurrentNode = blockchain1.currentNodeUrl !== newNodeUrl;
 	if (nodeNotAlreadyPresent && notCurrentNode) blockchain1.networkNodes.push(newNodeUrl);
 	//send back a response
 	res.json({note: 'New node node registered successfully with node'})


 });

//register multiple nodes at once
 app.post('/register-nodes-bulk', function(req,res) {
 	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = blockchain1.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = blockchain1.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode) blockchain1.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });


 });


app.listen(port, function() {
	console.log(`Listening on port ${port} ...`);
});



//make port variable to make different ports open