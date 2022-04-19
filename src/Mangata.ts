/* eslint-disable no-console */
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { WsProvider } from '@polkadot/rpc-provider/ws'
import { options } from '@mangata-finance/types'
import { BN } from '@polkadot/util'

import { Rpc, Tx, Query, Fee } from './services'
import {
  MangataGenericEvent,
  TxOptions,
  TTokenAddress,
  TToken,
  TBalances,
  TMainTokens,
  TokenBalance,
  TTokenId,
  TBridgeAddresses,
  TPoolWithShare,
  TPoolWithRatio,
  Reward,
} from './types'
import { calculateFutureRewardsAmount } from './utils'

/**
 * @class Mangata
 * @author Mangata Finance
 * The Mangata class defines the `getInstance` method that lets clients access the unique singleton instance.
 */
export class Mangata {
  private api: Promise<ApiPromise> | null
  private uri: string
  private static instanceMap: Map<string, Mangata> = new Map<string, Mangata>()

  /**
   * The Mangata's constructor is private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor(uri: string) {
    this.api = null
    this.uri = uri
  }

  /**
   * Initialised via create method with proper types and rpc
   * for Mangata
   */
  private async connectToNode(uri: string) {
    const provider = new WsProvider(uri)
    const api = await new ApiPromise(
      options({ provider, throwOnConnect: true, throwOnUnknown: true })
    ).isReady
    return api
  }

  /**
   * The static method that controls the access to the Mangata instance.
   */
  public static getInstance(uri: string): Mangata {
    if (!Mangata.instanceMap.has(uri)) {
      this.instanceMap.set(uri, new Mangata(uri))
      return this.instanceMap.get(uri)!
    } else {
      return this.instanceMap.get(uri)!
    }
  }

  /**
   * Api instance of the connected node
   */
  public async getApi(): Promise<ApiPromise> {
    // Because we assign this.api synchronously, repeated calls to
    // method() are guaranteed to always reuse the same promise.
    if (!this.api) {
      this.api = this.connectToNode(this.uri)
    }

    return this.api
  }

  /**
   * Uri of the connected node
   */
  public getUri(): string {
    return this.uri
  }

  /**
   * Wait for the new block
   */
  public async waitForNewBlock(blockCount?: number): Promise<boolean> {
    let count = 0
    const api = await this.getApi()

    const numberOfBlocks = blockCount || 1

    return new Promise(async (resolve) => {
      const unsubscribe = await api.rpc.chain.subscribeNewHeads(() => {
        if (++count === numberOfBlocks) {
          unsubscribe()
          resolve(true)
        }
      })
    })
  }

  /**
   * Chain name of the connected node
   */
  public async getChain(): Promise<string> {
    const api = await this.getApi()
    return Rpc.getChain(api)
  }

  /**
   * Node name of the connected node
   */
  public async getNodeName(): Promise<string> {
    const api = await this.getApi()
    return Rpc.getNodeName(api)
  }

  /**
   * Node version of the connected node
   */
  public async getNodeVersion(): Promise<string> {
    const api = await this.getApi()
    return Rpc.getNodeVersion(api)
  }

  /**
   * Get the current nonce of the account
   */
  public async getNonce(address: TTokenAddress): Promise<BN> {
    const api = await this.getApi()
    return Query.getNonce(api, address)
  }

  /**
   * Disconnect from the node
   */
  public async disconnect(): Promise<void> {
    const api = await this.getApi()
    await api.disconnect()
  }

  public async calculateFutureRewardsAmount(
    address: string,
    liquidityTokenId: string,
    futureBlockNumber: BN
  ) {
    const api = await this.getApi()
    return await calculateFutureRewardsAmount(api, address, liquidityTokenId, futureBlockNumber)
  }

  public async calculateRewardsAmount(address: string, liquidityTokenId: string): Promise<Reward> {
    const api = await this.getApi()
    return await Rpc.calculateRewardsAmount(api, address, liquidityTokenId)
  }

  public async claimRewardsFee(
    account: string | KeyringPair,
    liquditityTokenId: string,
    amount: BN,
    txOptions?: TxOptions
  ) {
    const api = await this.getApi()
    return await Fee.claimRewardsFee(api, account, liquditityTokenId, amount, txOptions)
  }

  public async claimRewards(
    account: string | KeyringPair,
    liquditityTokenId: string,
    amount: BN,
    txOptions?: TxOptions
  ) {
    const api = await this.getApi()
    return await Tx.claimRewards(api, account, liquditityTokenId, amount, txOptions)
  }

  public async createPoolFee(
    account: string | KeyringPair,
    firstTokenId: string,
    firstTokenAmount: BN,
    secondTokenId: string,
    secondTokenAmount: BN,
    txOptions?: TxOptions
  ) {
    const api = await this.getApi()
    return await Fee.createPoolFee(
      api,
      account,
      firstTokenId,
      firstTokenAmount,
      secondTokenId,
      secondTokenAmount,
      txOptions
    )
  }

  /**
   * Extrinsic to create pool
   * @param {string | Keyringpair} account
   * @param {string} firstTokenId
   * @param {BN} firstTokenAmount
   * @param {string} secondTokenId
   * @param {BN} secondTokenAmount
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async createPool(
    account: string | KeyringPair,
    firstTokenId: string,
    firstTokenAmount: BN,
    secondTokenId: string,
    secondTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.createPool(
      api,
      account,
      firstTokenId,
      firstTokenAmount,
      secondTokenId,
      secondTokenAmount,
      txOptions
    )
  }

  public async sellAssetFee(
    account: string | KeyringPair,
    soldAssetId: string,
    boughtAssetId: string,
    amount: BN,
    minAmountOut: BN,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.sellAssetFee(
      api,
      account,
      soldAssetId,
      boughtAssetId,
      amount,
      minAmountOut,
      txOptions
    )
  }

  /**
   * Extrinsic to sell/swap sold token id in sold token amount for bought token id,
   * while specifying min amount out: minimal expected bought token amount
   *
   * @param {string | Keyringpair} account
   * @param {string} soldAssetId
   * @param {string} boughtAssetId
   * @param {BN} amount
   * @param {BN} minAmountOut
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async sellAsset(
    account: string | KeyringPair,
    soldAssetId: string,
    boughtAssetId: string,
    amount: BN,
    minAmountOut: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.sellAsset(
      api,
      account,
      soldAssetId,
      boughtAssetId,
      amount,
      minAmountOut,
      txOptions
    )
  }

  public async mintLiquidityFee(
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    firstTokenAmount: BN,
    expectedSecondTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.mintLiquidityFee(
      api,
      account,
      firstTokenId,
      secondTokenId,
      firstTokenAmount,
      expectedSecondTokenAmount,
      txOptions
    )
  }

  /**
   * Extrinsic to add liquidity to pool, while specifying first token id
   * and second token id and first token amount. Second token amount is calculated in block, * but cannot exceed expected second token amount
   *
   * @param {string | Keyringpair} account
   * @param {string} firstTokenId
   * @param {string} secondTokenId
   * @param {BN} firstTokenAmount
   * @param {BN} expectedSecondTokenAmount
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async mintLiquidity(
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    firstTokenAmount: BN,
    expectedSecondTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.mintLiquidity(
      api,
      account,
      firstTokenId,
      secondTokenId,
      firstTokenAmount,
      expectedSecondTokenAmount,
      txOptions
    )
  }

  public async burnLiquidityFee(
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    liquidityTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.burnLiquidityFee(
      api,
      account,
      firstTokenId,
      secondTokenId,
      liquidityTokenAmount,
      txOptions
    )
  }

  /**
   * Extrinsic to remove liquidity from liquidity pool, specifying first token id and
   * second token id of a pool and liquidity token amount you wish to burn
   *
   * @param {string | Keyringpair} account
   * @param {string} firstTokenId
   * @param {string} secondTokenId
   * @param {BN} liquidityTokenAmount
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async burnLiquidity(
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    liquidityTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.burnLiquidity(
      api,
      account,
      firstTokenId,
      secondTokenId,
      liquidityTokenAmount,
      txOptions
    )
  }

  public async buyAssetFee(
    account: string | KeyringPair,
    soldAssetId: string,
    boughtAssetId: string,
    amount: BN,
    maxAmountIn: BN,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.buyAssetFee(
      api,
      account,
      soldAssetId,
      boughtAssetId,
      amount,
      maxAmountIn,
      txOptions
    )
  }

  /**
   * Extrinsic to buy/swap bought token id in bought token amount for sold token id, while
   * specifying max amount in: maximal amount you are willing to pay in sold token id to
   * purchase bought token id in bought token amount.
   *
   * @param {string | Keyringpair} account
   * @param {string} soldAssetId
   * @param {string} boughtAssetId
   * @param {BN} amount
   * @param {BN} maxAmountIn
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async buyAsset(
    account: string | KeyringPair,
    soldAssetId: string,
    boughtAssetId: string,
    amount: BN,
    maxAmountIn: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.buyAsset(
      api,
      account,
      soldAssetId,
      boughtAssetId,
      amount,
      maxAmountIn,
      txOptions
    )
  }

  /**
   * Returns sell amount you need to pay in sold token id for bought token id in buy
   * amount, while specifying input reserve – reserve of sold token id, and output reserve
   * – reserve of bought token id
   *
   * @param {BN} inputReserve
   * @param {BN} outputReserve
   * @param {BN} buyAmount
   *
   * @returns {BN}
   */
  public async calculateBuyPrice(inputReserve: BN, outputReserve: BN, buyAmount: BN): Promise<BN> {
    const api = await this.getApi()
    return await Rpc.calculateBuyPrice(api, inputReserve, outputReserve, buyAmount)
  }

  /**
   * Returns bought token amount returned by selling sold token id for bought token id in
   * sell amount, while specifying input reserve – reserve of sold token id, and output
   * reserve – reserve of bought token id
   *
   * @param {BN} inputReserve
   * @param {BN} outputReserve
   * @param {BN} sellAmount
   *
   * @returns {BN}
   */
  public async calculateSellPrice(
    inputReserve: BN,
    outputReserve: BN,
    sellAmount: BN
  ): Promise<BN> {
    const api = await this.getApi()
    return await Rpc.calculateSellPrice(api, inputReserve, outputReserve, sellAmount)
  }

  /**
   * Create Token (SUDO)
   */
  public async createToken(
    targetAddress: string,
    sudoAccount: string | KeyringPair,
    currencyValue: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.createToken(api, targetAddress, sudoAccount, currencyValue, txOptions)
  }

  /**
   * Mint Asset (SUDO)
   */
  public async mintAsset(
    sudoAccount: string | KeyringPair,
    tokenId: string,
    address: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.mintAsset(api, sudoAccount, tokenId, address, amount, txOptions)
  }

  /**
   * Returns bought token amount returned by selling sold token id for bought token id in
   * sell amount, while specifying input reserve – reserve of sold token id, and output
   * reserve – reserve of bought token id
   *
   * @param {BN} inputReserve
   * @param {BN} outputReserve
   * @param {BN} sellAmount
   *
   * @returns {BN}
   */
  public async getBurnAmount(
    firstTokenId: string,
    secondTokenId: string,
    liquidityAssetAmount: BN
  ): Promise<any> {
    const api = await this.getApi()
    return await Rpc.getBurnAmount(api, firstTokenId, secondTokenId, liquidityAssetAmount)
  }

  /**
   * Returns bought asset amount returned by selling sold token id for bought token id in
   * sell amount
   *
   * @param {string} soldTokenId
   * @param {string} boughtTokenId
   * @param {BN} sellAmount
   *
   * @returns {BN}
   */

  public async calculateSellPriceId(
    soldTokenId: string,
    boughtTokenId: string,
    sellAmount: BN
  ): Promise<BN> {
    const api = await this.getApi()
    return await Rpc.calculateSellPriceId(api, soldTokenId, boughtTokenId, sellAmount)
  }

  /**
   * Returns sell amount you need to pay in sold token id for bought token id in buy amount
   *
   * @param {string} soldTokenId
   * @param {string} boughtTokenId
   * @param {BN} buyAmount
   *
   * @returns {BN}
   *
   */

  public async calculateBuyPriceId(
    soldTokenId: string,
    boughtTokenId: string,
    buyAmount: BN
  ): Promise<BN> {
    const api = await this.getApi()
    return await Rpc.calculateBuyPriceId(api, soldTokenId, boughtTokenId, buyAmount)
  }

  /**
   * Returns amount of token ids in pool.
   *
   * @param {string} firstTokenId
   * @param {string} secondTokenId
   *
   * @returns {BN | Array}
   */
  public async getAmountOfTokenIdInPool(
    firstTokenId: TTokenId,
    secondTokenId: TTokenId
  ): Promise<BN[]> {
    const api = await this.getApi()
    return await Query.getAmountOfTokenIdInPool(api, firstTokenId, secondTokenId)
  }

  /**
   * Returns liquidity asset id while specifying first and second Token Id.
   * Returns same liquidity asset id when specifying other way
   * around – second and first Token Id
   *
   * @param {string} firstTokenId
   * @param {string} secondTokenId
   *
   * @returns {BN}
   */
  public async getLiquidityTokenId(firstTokenId: TTokenId, secondTokenId: TTokenId): Promise<BN> {
    const api = await this.getApi()
    return await Query.getLiquidityTokenId(api, firstTokenId, secondTokenId)
  }

  /**
   * Returns pool corresponding to specified liquidity asset ID
   * @param {string} liquidityAssetId
   *
   * @returns {BN | Array}
   */
  public async getLiquidityPool(liquidityAssetId: string): Promise<BN[]> {
    const api = await this.getApi()
    return await Query.getLiquidityPool(api, liquidityAssetId)
  }

  /**
   * Returns amount of token Id in Treasury
   * @param {string} token Id
   *
   * @returns {AccountData}
   */
  public async getTreasury(tokenId: string) {
    const api = await this.getApi()
    return await Query.getTreasury(api, tokenId)
  }

  /**
   * Returns amount of token Id in Treasury Burn
   * @param {string} tokenId
   *
   * @returns {AccountData}
   */
  public async getTreasuryBurn(tokenId: string) {
    const api = await this.getApi()
    return await Query.getTreasuryBurn(api, tokenId)
  }

  public async transferTokenFee(
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.transferTokenFee(api, account, tokenId, address, amount, txOptions)
  }

  /**
   * Extrinsic that transfers Token Id in value amount from origin to destination
   * @param {string | Keyringpair} account
   * @param {string} tokenId
   * @param {string} address
   * @param {BN} amount
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async transferToken(
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    const result = await Tx.transferToken(api, account, tokenId, address, amount, txOptions)
    return result
  }

  public async transferTokenAllFee(
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    txOptions?: TxOptions
  ): Promise<string> {
    const api = await this.getApi()
    return await Fee.transferAllTokenFee(api, account, tokenId, address, txOptions)
  }

  /**
   * Extrinsic that transfers all token Id from origin to destination
   * @param {string | Keyringpair} account
   * @param {string} tokenId
   * @param {string} address
   * @param {TxOptions} [txOptions]
   *
   * @returns {(MangataGenericEvent|Array)}
   */
  public async transferTokenAll(
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    const api = await this.getApi()
    return await Tx.transferAllToken(api, account, tokenId, address, txOptions)
  }

  /**
   * Returns total issuance of Token Id
   * @param {string} tokenId
   *
   * @returns {BN}
   */
  public async getTotalIssuance(tokenId: string): Promise<BN> {
    const api = await this.getApi()
    return await Query.getTotalIssuance(api, tokenId)
  }

  /**
   * Returns vec of locked token Id of an specified address and tokenId
   * @param {string} address
   * @param {string} tokenId
   *
   */
  public async getLock(address: string, tokenId: string) {
    const api = await this.getApi()
    return await Query.getLock(api, address, tokenId)
  }

  /**
   * Returns token balance for address
   * @param {string} tokenId
   * @param {string} address
   *
   * @returns {AccountData}
   */
  public async getTokenBalance(tokenId: string, address: string): Promise<TokenBalance> {
    const api = await this.getApi()
    return await Query.getTokenBalance(api, address, tokenId)
  }

  /**
   * Returns next CurencyId, CurrencyId that will be used for next created token
   */
  public async getNextTokenId(): Promise<BN> {
    const api = await this.getApi()
    return await Query.getNextTokenId(api)
  }

  /*
   * Returns bridge tokens
   */

  public async getBridgeTokens() {
    const api = await this.getApi()
    return await Query.getBridgedTokens(api)
  }

  /**
   * Returns token info
   * @param {string} tokenId
   */
  public async getTokenInfo(tokenId: string) {
    const api = await this.getApi()
    return await Query.getTokenInfo(api, tokenId)
  }

  public async getBlockNumber(): Promise<string> {
    const api = await this.getApi()
    return await Query.getBlockNumber(api)
  }

  public async getOwnedTokens(address: string): Promise<Record<TTokenId, TToken> | null> {
    const api = await this.getApi()
    return await Query.getOwnedTokens(api, address)
  }

  /**
   * Returns liquditity token Ids
   * @returns {string | Array}
   */
  public async getLiquidityTokenIds(): Promise<string[]> {
    const api = await this.getApi()
    return await Query.getLiquidityTokenIds(api)
  }

  /**
   * Returns info about all assets
   */

  public async getAssetsInfo(): Promise<TMainTokens> {
    const api = await this.getApi()
    return await Query.getAssetsInfo(api)
  }

  public async getBalances(): Promise<TBalances> {
    const api = await this.getApi()
    return await Query.getBalances(api)
  }

  public async getBridgeAddresses(): Promise<TBridgeAddresses> {
    const api = await this.getApi()
    return await Query.getBridgeAddresses(api)
  }

  public async getBridgeIds() {
    const api = await this.getApi()
    return await Query.getBridgeIds(api)
  }

  public async getLiquidityTokens(): Promise<TMainTokens> {
    const api = await this.getApi()
    return await Query.getLiquidityTokens(api)
  }

  /**
   * @deprecated This method will be deprecated
   */
  public async bridgeERC20ToEthereum(
    account: string | KeyringPair,
    tokenAddress: string,
    ethereumAddress: string,
    amount: BN,
    txOptions?: TxOptions
  ) {
    const api = await this.getApi()
    return await Tx.bridgeERC20ToEthereum(
      api,
      account,
      tokenAddress,
      ethereumAddress,
      amount,
      txOptions
    )
  }

  /**
   * @deprecated This method will be deprecated
   */
  public async bridgeEthToEthereum(
    account: string | KeyringPair,
    ethereumAddress: string,
    amount: BN,
    txOptions?: TxOptions
  ) {
    const api = await this.getApi()
    return await Tx.bridgeEthToEthereum(api, account, ethereumAddress, amount, txOptions)
  }

  public async getPool(liquditityTokenId: TTokenId): Promise<TPoolWithRatio> {
    const api = await this.getApi()
    return await Query.getPool(api, liquditityTokenId)
  }

  public async getInvestedPools(address: string): Promise<TPoolWithShare[]> {
    const api = await this.getApi()
    const investedPools = await Query.getInvestedPools(api, address)

    const investedPoolsFormatted = []
    for (const pool of investedPools) {
      const awaitedPool = await pool
      investedPoolsFormatted.push(awaitedPool)
    }

    return investedPoolsFormatted as TPoolWithShare[]
  }

  public async getPools(): Promise<TPoolWithRatio[]> {
    const api = await this.getApi()
    return await Query.getPools(api)
  }
}
