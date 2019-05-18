const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const previousBlockHash = 'dfjaldfjadlfjiji33333'
const currentBlockData = [
	{
		amount: 10,
		sender: 'johndfljdfldkj',
		recipient: 'dfjadfklajfldjfldj'
	},
		{
		amount: 100,
		sender: 'johndfljdfldkj',
		recipient: 'dfjadfklajfldjfldj'
	},
		{
		amount: 50,
		sender: 'johndfljdfldkj',
		recipient: 'dfjadfklajfldjfldj'
	}

];


console.log(bitcoin.proofOfWork(previousBlockHash,currentBlockData));

