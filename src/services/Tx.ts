/* eslint-disable no-console */
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import BN from 'bn.js'

import recreateExtrinsicsOrder from '../utils/recreateExtrinsicsOrder'
import memoryDatabase from '../utils/MemoryDatabase'
import Query from './Query'
import { getTxNonce } from '../utils/nonce.tracker'

import { TxOptions } from '../types/TxOptions'
import { MangataGenericEvent } from '../types/MangataGenericEvent'
import { MangataEventData } from '../types/MangataEventData'

export const signTx = async (
  api: ApiPromise,
  tx: SubmittableExtrinsic<'promise'>,
  account: string | KeyringPair,
  txOptions?: TxOptions
): Promise<MangataGenericEvent[]> => {
  return new Promise<MangataGenericEvent[]>(async (resolve, reject) => {
    let output: MangataGenericEvent[] = []
    const extractedAccount = typeof account === 'string' ? account : account.address

    const nonce = await getTxNonce(api, extractedAccount, txOptions)
    let retries = 0
    try {
      const unsub = await tx.signAndSend(
        account,
        { nonce, signer: txOptions && txOptions.signer ? txOptions.signer : undefined },
        async (result) => {
          txOptions && txOptions.statusCallback && txOptions.statusCallback(result)
          if (result.status.isFinalized) {
            const unsubscribeNewHeads = await api.rpc.chain.subscribeNewHeads(
              async (lastHeader) => {
                if (lastHeader.parentHash.toString() === result.status.asFinalized.toString()) {
                  unsubscribeNewHeads()
                  const currentBlock = await api.rpc.chain.getBlock(lastHeader.hash)
                  const currentBlockExtrinsics = currentBlock.block.extrinsics
                  const currentBlockEvents = await api.query.system.events.at(lastHeader.hash)
                  const headerJsonResponse = JSON.parse(lastHeader.toString())

                  const buffer: Buffer = Buffer.from(
                    headerJsonResponse['seed']['seed'].substring(2),
                    'hex'
                  )
                  const countOfExtrinsicsFromThisBlock = headerJsonResponse['count']
                  const currentBlockInherents = currentBlockExtrinsics
                    .slice(0, countOfExtrinsicsFromThisBlock)
                    .filter((tx) => {
                      return !tx.isSigned
                    })
                  const previousBlockExtrinsics = currentBlockExtrinsics.slice(
                    countOfExtrinsicsFromThisBlock,
                    currentBlockExtrinsics.length
                  )
                  const bothBlocksExtrinsics = currentBlockInherents.concat(previousBlockExtrinsics)
                  const shuffledExtrinsics = recreateExtrinsicsOrder(
                    bothBlocksExtrinsics.map((tx) => {
                      const who = tx.isSigned ? tx.signer.toString() : '0000'
                      return [who, tx]
                    }),
                    Uint8Array.from(buffer)
                  )
                  const index = shuffledExtrinsics.findIndex((shuffledExtrinsic) => {
                    return (
                      shuffledExtrinsic?.isSigned &&
                      shuffledExtrinsic?.signer.toString() === extractedAccount &&
                      shuffledExtrinsic?.nonce.toString() === nonce.toString()
                    )
                  })
                  if (index < 0) {
                    return
                  }
                  const reqEvents: MangataGenericEvent[] = currentBlockEvents
                    .filter((currentBlockEvent) => {
                      return (
                        currentBlockEvent.phase.isApplyExtrinsic &&
                        currentBlockEvent.phase.asApplyExtrinsic.toNumber() === index
                      )
                    })
                    .map((eventRecord) => {
                      const { event, phase } = eventRecord
                      const types = event.typeDef
                      const eventData: MangataEventData[] = event.data.map((d, i) => {
                        return {
                          lookupName: types[i].lookupName!,
                          data: d,
                        }
                      })

                      return {
                        event,
                        phase,
                        section: event.section,
                        method: event.method,
                        metaDocumentation: event.meta.docs.toString(),
                        eventData,
                        error: getError(api, event.method, eventData),
                      } as MangataGenericEvent
                    })

                  output = output.concat(reqEvents)
                  txOptions && txOptions.extrinsicStatus && txOptions.extrinsicStatus(output)
                  resolve(output)
                  unsub()
                } else if (retries++ > 2) {
                  //Lets retry this for 3 times until we reject the promise.
                  unsubscribeNewHeads()
                  reject(
                    `Transaction was not finalized: Last Header Parent hash: ${lastHeader.parentHash.toString()} and Status finalized: ${result.status.asFinalized.toString()}`
                  )
                  unsub()
                }
              }
            )
          } else if (result.isError) {
            reject(`${tx.hash} ` + 'Transaction error')
            const currentNonce: BN = await Query.getNonce(api, extractedAccount)
            memoryDatabase.setNonce(extractedAccount, currentNonce)
          }
        }
      )
    } catch (error: any) {
      const currentNonce: BN = await Query.getNonce(api, extractedAccount)
      memoryDatabase.setNonce(extractedAccount, currentNonce)
      reject({
        data: error.message || error.description || error.data?.toString() || error.toString(),
      })
    }
  })
}

type TErrorData = {
  Module?: {
    index?: string
    error?: string
  }
}

const getError = (
  api: ApiPromise,
  method: string,
  eventData: MangataEventData[]
): {
  documentation: string[]
  name: string
} | null => {
  const failedEvent = method === 'ExtrinsicFailed'

  if (failedEvent) {
    const error = eventData.find((item) => item.lookupName.includes('DispatchError'))
    const errorData = error?.data?.toHuman?.() as TErrorData | undefined
    const errorIdx = errorData?.Module?.error
    const moduleIdx = errorData?.Module?.index

    if (errorIdx && moduleIdx) {
      try {
        const decode = api.registry.findMetaError({
          error: new BN(errorIdx),
          index: new BN(moduleIdx),
        })
        return {
          documentation: decode.docs,
          name: decode.name,
        }
      } catch (error) {
        return {
          documentation: ['Unknown error'],
          name: 'UnknownError',
        }
      }
    } else {
      return {
        documentation: ['Unknown error'],
        name: 'UnknownError',
      }
    }
  }

  return null
}

class Tx {
  static async sendTokensFromParachainToRely(
    api: ApiPromise,
    fromAccount: KeyringPair,
    toAccount: string,
    amount: BN,
    assetId: string,
    txOptions?: TxOptions
  ) {
    return await signTx(
      api,
      api?.tx.polkadotXcm.reserveTransferAssets(
        {
          V1: {
            parents: 1,
            interior: 'Here',
          },
        },
        {
          V1: {
            parents: 1,
            interior: {
              X1: {
                AccountId32: {
                  network: 'Any',
                  id: toAccount,
                },
              },
            },
          },
        },
        {
          V1: [
            {
              id: {
                Concrete: {
                  parents: 1,
                  interior: 'Here',
                },
              },
              fun: {
                Fungible: amount,
              },
            },
          ],
        },
        assetId
      ),
      fromAccount,
      txOptions
    )
  }

  static async sendTokensFromMGAtoParachain(
    api: ApiPromise,
    fromAccount: KeyringPair,
    toAccount: string,
    amount: BN,
    assetId: string,
    parachainId: number,
    txOptions?: TxOptions
  ) {
    return await signTx(
      api,
      api.tx.xTokens.transfer(
        assetId,
        amount,
        {
          V1: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: parachainId,
                },
                {
                  AccountId32: {
                    network: 'Any',
                    id: toAccount,
                  },
                },
              ],
            },
          },
        },
        new BN('6000000000')
      ),
      fromAccount,
      txOptions
    )
  }

  static async createPool(
    api: ApiPromise,
    account: string | KeyringPair,
    firstTokenId: string,
    firstTokenAmount: BN,
    secondTokenId: string,
    secondTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.xyk.createPool(firstTokenId, firstTokenAmount, secondTokenId, secondTokenAmount),
      account,
      txOptions
    )
  }

  static async sellAsset(
    api: ApiPromise,
    account: string | KeyringPair,
    soldTokenId: string,
    boughtTokenId: string,
    amount: BN,
    minAmountOut: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.xyk.sellAsset(soldTokenId, boughtTokenId, amount, minAmountOut),
      account,
      txOptions
    )
  }

  static async buyAsset(
    api: ApiPromise,
    account: string | KeyringPair,
    soldTokenId: string,
    boughtTokenId: string,
    amount: BN,
    maxAmountIn: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.xyk.buyAsset(soldTokenId, boughtTokenId, amount, maxAmountIn),
      account,
      txOptions
    )
  }

  static async mintLiquidity(
    api: ApiPromise,
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    firstTokenAmount: BN,
    expectedSecondTokenAmount: BN = new BN(Number.MAX_SAFE_INTEGER),
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.xyk.mintLiquidity(
        firstTokenId,
        secondTokenId,
        firstTokenAmount,
        expectedSecondTokenAmount
      ),
      account,
      txOptions
    )
  }

  static async burnLiquidity(
    api: ApiPromise,
    account: string | KeyringPair,
    firstTokenId: string,
    secondTokenId: string,
    liquidityTokenAmount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.xyk.burnLiquidity(firstTokenId, secondTokenId, liquidityTokenAmount),
      account,
      txOptions
    )
  }

  static async transferToken(
    api: ApiPromise,
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(api, api.tx.tokens.transfer(address, tokenId, amount), account, txOptions)
  }

  static async transferAllToken(
    api: ApiPromise,
    account: string | KeyringPair,
    tokenId: string,
    address: string,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(api, api.tx.tokens.transferAll(address, tokenId, true), account, txOptions)
  }

  static async createToken(
    api: ApiPromise,
    address: string,
    sudoAccount: string | KeyringPair,
    tokenValue: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.sudo.sudo(api.tx.tokens.create(address, tokenValue)),
      sudoAccount,
      txOptions
    )
  }

  static async mintAsset(
    api: ApiPromise,
    sudoAccount: string | KeyringPair,
    tokenId: string,
    address: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.sudo.sudo(api.tx.tokens.mint(tokenId, address, amount)),
      sudoAccount,
      txOptions
    )
  }

  static async bridgeERC20ToEthereum(
    api: ApiPromise,
    account: string | KeyringPair,
    tokenAddress: string,
    ethereumAddress: string,
    amount: BN,
    txOptions?: TxOptions
  ): Promise<MangataGenericEvent[]> {
    return await signTx(
      api,
      api.tx.erc20.burn(tokenAddress, ethereumAddress, amount),
      account,
      txOptions
    )
  }

  static async bridgeEthToEthereum(
    api: ApiPromise,
    account: string | KeyringPair,
    ethereumAddress: string,
    amount: BN,
    txOptions?: TxOptions
  ) {
    return await signTx(api, api.tx.eth.burn(ethereumAddress, amount), account, txOptions)
  }
}

export default Tx
