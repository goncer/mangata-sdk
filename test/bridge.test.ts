import { mangataInstance } from './mangataInstanceCreation'

describe('Bridge', () => {
  it('should get bridge tokens', async () => {
    const api = await mangataInstance.getApi()
    if (api.isConnected) {
      const tokens = await mangataInstance.getBridgeTokens()

      console.log(tokens)
      expect(tokens[0].name).toEqual('Mangata')
      expect(tokens[1].name).toEqual('Ether')

      const tokenInfo = await mangataInstance.getTokenInfo(tokens[0].id)
      expect(tokenInfo.name).toEqual('Mangata')
    }
  })
})

afterAll(async () => {
  await mangataInstance.disconnect()
})
