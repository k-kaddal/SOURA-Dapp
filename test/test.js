const { assert } = require('chai')
const Web3 = require("web3")
const provider = new Web3.providers.HttpProvider('http://localhost:7545')
const web3 = new Web3(provider)
const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  let decentragram

  before(async () => {
    decentragram = await Decentragram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decentragram.name()
      assert.equal(name, 'Decentragram')
    })
  })

  describe('images', async()=>{
    let result, imageCount
    let hash = 'abc123'

    before(async () => {
      result = await decentragram.uploadImage(hash, 'Image description', {from:author})
      imageCount = await decentragram.imageCount()
    })

    it('create images', async()=>{
      
      //SUCCESS
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct' )
      assert.equal(event.hash, hash, 'hash is correct' )
      assert.equal(event.description, 'Image description', 'Description is correct' )
      assert.equal(event.tipAmount, '0', 'Tip amount is correct' )
      assert.equal(event.author, author, 'Author is correct' )

      //Failure: 
      await decentragram.uploadImage('', 'Image description', {from:author}).should.be.rejected;
      await decentragram.uploadImage(hash, '', {from:author}).should.be.rejected;

    })

    it('lists images', async()=>{
      const image = await decentragram.images(imageCount)

      // SUCCESS
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct' )
      assert.equal(image.hash, hash, 'hash is correct' )
      assert.equal(image.description, 'Image description', 'Description is correct' )
      assert.equal(image.tipAmount, '0', 'Tip amount is correct' )
      assert.equal(image.author, author, 'Author is correct' )
    })

    it('allows users to tip images', async()=>{
      // Track the author balance before purchase
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)
    
      result = await decentragram.tipImageOwner(imageCount, {from:tipper, value: web3.utils.toWei('1', "Ether")})

      // SUCCESS
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'Description is correct' )
      assert.equal(event.tipAmount, '1000000000000000000', 'Tip amount is correct' )
      assert.equal(event.author, author, 'Author is correct' )
    
      // Check the author received funds
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)
      
      let tipImageOwner
      tipImageOwner = web3.utils.toWei('1', 'Ether')
      tipImageOwner = new web3.utils.BN(tipImageOwner)

      const expectedBalance = oldAuthorBalance.add(tipImageOwner)

      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      // FAILURE: tip image that doesn't exist
      await decentragram.tipImageOwner(99, {from:tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected

    })

  })

})