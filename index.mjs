import{isHex as t,hexToBn as e,BN as n,BN_ZERO as a,hexToU8a as i}from"@polkadot/util";export{BN}from"@polkadot/util";import{ApiPromise as r,Keyring as s}from"@polkadot/api";import{WsProvider as o}from"@polkadot/rpc-provider/ws";import{options as c}from"@mangata-finance/types";import{encodeAddress as u}from"@polkadot/util-crypto";import g from"big.js";import{v4 as d}from"uuid";import{XoShiRo256Plus as w}from"mangata-prng-xoshiro";class l{static async getChain(t){return(await t.rpc.system.chain()).toHuman()}static async getNodeName(t){return(await t.rpc.system.name()).toHuman()}static async getNodeVersion(t){return(await t.rpc.system.version()).toHuman()}static async calculateRewardsAmount(a,i,r){const s=await a.rpc.xyk.calculate_rewards_amount(i,r);return t(s.price.toString())?e(s.price.toString()):new n(s.price)}static async calculateBuyPrice(t,e,a,i){const r=await t.rpc.xyk.calculate_buy_price(e,a,i);return new n(r.price)}static async calculateSellPrice(t,e,a,i){const r=await t.rpc.xyk.calculate_sell_price(e,a,i);return new n(r.price)}static async getBurnAmount(t,e,n,a){const i=await t.rpc.xyk.get_burn_amount(e,n,a);return JSON.parse(i.toString())}static async calculateSellPriceId(t,e,a,i){const r=await t.rpc.xyk.calculate_sell_price_id(e,a,i);return new n(r.price)}static async calculateBuyPriceId(t,e,a,i){const r=await t.rpc.xyk.calculate_buy_price_id(e,a,i);return new n(r.price)}}class y{static instance;db={};constructor(){}static getInstance(){return y.instance||(y.instance=new y),y.instance}hasAddressNonce=t=>!!this.db[t];setNonce=(t,e)=>{this.db[t]=e};getNonce=t=>this.db[t]}const m=y.getInstance(),p=async t=>(await t.query.assetsInfo.assetsInfo.entries()).reduce(((t,[e,n])=>{const a=n.toHuman(),i=e.toHuman()[0].replace(/[, ]/g,""),r={id:i,chainId:0,symbol:a.symbol,address:"MGA"===a.symbol?"0xc7e3bda797d2ceb740308ec40142ae235e08144a":"ETH"===a.symbol?"0x0000000000000000000000000000000000000000":a.description,name:a.symbol.includes("TKN")?"Liquidity Pool Token":a.name,decimals:Number(a.decimals)};return t[i]=r,t}),{}),k=async t=>(await t.query.xyk.liquidityAssets.entries()).reduce(((t,[e,n])=>{const a=e.args.map((t=>t.toHuman()))[0],i=n.toString().replace(/[, ]/g,"");return t[a]=i,t}),{}),h=async(a,i)=>(await a.query.tokens.accounts.entries(i)).reduce(((a,[i,r])=>{const s=JSON.parse(JSON.stringify(r)).free.toString(),o=JSON.parse(JSON.stringify(r)).frozen.toString(),c=JSON.parse(JSON.stringify(r)).reserved.toString(),u={free:t(s)?e(s):new n(s),frozen:t(o)?e(o):new n(o),reserved:t(c)?e(c):new n(c)};return a[i.toHuman()[1].replace(/[, ]/g,"")]=u,a}),{}),T=async t=>{const n=await p(t);return Object.values(n).filter((t=>"1"!==t.id&&"3"!==t.id)).reduce(((t,n)=>{const a={...n,symbol:n.symbol.includes("TKN")?n.symbol.split("-").reduce(((t,n)=>{const a=n.replace("TKN",""),i=a.startsWith("0x")?e(a).toString():a;return t.push(i),t}),[]).join("-"):n.symbol};return t[a.id]=a,t}),{})},I=new n("0"),A=new n("1"),f=new n("10"),S=new n("100"),x=new n("1000"),B=new n("10000"),b=new n("100000"),q=new n("1000000"),P=new n("10000000"),F=new n("100000000"),N=new n("1000000000"),v=new n("10000000000"),L=new n("100000000000"),R=new n("1000000000000"),O=18,M=new n("10").pow(new n(18)),C=async(t,e,a)=>{if(a.isZero())return I;const i=await t.query.tokens.totalIssuance(e),r=new n(i.toString());return a.mul(M).div(r)},H=(t,e)=>e.gt(I)?H(e,t.mod(e)):t,$=(t,e)=>{const n=((t,e)=>{const n=H(t,e);return n.isZero()?[I,I]:[t.div(n),e.div(n)]})(t,e);return n[1].mul(M).div(n[0])},E=async t=>{try{return(await t.query.issuance.promotedPoolsRewards.entries()).map((([t])=>t.args.map((t=>t.toHuman()))[0]))}catch(t){return[]}};class K{static async getNonce(t,e){return(await t.rpc.system.accountNextIndex(e)).toBn()}static async getAmountOfTokenIdInPool(a,i,r){const s=await a.query.xyk.pools([i,r]),o=s[0].toString(),c=s[1].toString();return[t(o)?e(o):new n(o),t(c)?e(c):new n(c)]}static async getLiquidityTokenId(t,e,i){const r=await t.query.xyk.liquidityAssets([e,i]);return r.isSome?new n(r.toString()):a}static async getLiquidityPool(t,e){const a=await t.query.xyk.liquidityPools(e);return a.isSome?a.unwrap().map((t=>new n(t))):[new n(-1),new n(-1)]}static async getTotalIssuance(t,e){const a=await t.query.tokens.totalIssuance(e);return new n(a)}static async getTokenBalance(a,i,r){const{free:s,reserved:o,frozen:c}=await a.query.tokens.accounts(i,r);return{free:t(s.toString())?e(s.toString()):new n(s.toString()),reserved:t(o.toString())?e(o.toString()):new n(o.toString()),frozen:t(c.toString())?e(c.toString()):new n(c.toString())}}static async getNextTokenId(t){const e=await t.query.tokens.nextCurrencyId();return new n(e)}static async getTokenInfo(t,e){return(await this.getAssetsInfo(t))[e]}static async getLiquidityTokenIds(t){return(await t.query.xyk.liquidityAssets.entries()).map((t=>t[1].toString()))}static async getLiquidityTokens(t){const e=await this.getAssetsInfo(t);return Object.values(e).reduce(((t,e)=>(e.name.includes("Liquidity Pool Token")&&(t[e.id]=e),t)),{})}static async getAssetsInfo(t){const n=await p(t);return Object.values(n).filter((t=>"1"!==t.id&&"3"!==t.id)).reduce(((t,a)=>{const i={...a,symbol:a.symbol.includes("TKN")?a.symbol.split("-").reduce(((t,a)=>{const i=a.replace("TKN",""),r=i.startsWith("0x")?e(i).toString():i,s=n[r].symbol;return t.push(s),t}),[]).join("-"):a.symbol};return t[i.id]=i,t}),{})}static async getBlockNumber(t){return(await t.rpc.chain.getBlock()).block.header.number.toString()}static async getOwnedTokens(t,e){if(!e)return null;const[n,a]=await Promise.all([this.getAssetsInfo(t),h(t,e)]);return Object.values(n).reduce(((t,e)=>(Object.keys(a).includes(e.id)&&(t[e.id]={...e,balance:a[e.id]}),t)),{})}static async getBalances(t){return(await t.query.tokens.totalIssuance.entries()).reduce(((t,[e,a])=>{const i=e.toHuman()[0].replace(/[, ]/g,""),r=new n(a.toString());return t[i]=r,t}),{})}static async getInvestedPools(t,e){const[n,a,i]=await Promise.all([T(t),h(t,e),E(t)]),r=Object.values(n).reduce(((t,e)=>(Object.keys(a).includes(e.id)&&e.name.includes("Liquidity Pool Token")&&t.push(e),t)),[]).map((async e=>{const n=a[e.id],r=e.symbol.split("-")[0],s=e.symbol.split("-")[1],[o,c]=await this.getAmountOfTokenIdInPool(t,r.toString(),s.toString());return{firstTokenId:r,secondTokenId:s,firstTokenAmount:o,secondTokenAmount:c,liquidityTokenId:e.id,isPromoted:i.includes(e.id),share:await C(t,e.id,n.free.add(n.reserved)),firstTokenRatio:$(o,c),secondTokenRatio:$(c,o),activatedLPTokens:n.reserved,nonActivatedLPTokens:n.free}}));return Promise.all(r)}static async getPool(t,e){const[n,a]=await Promise.all([this.getLiquidityPool(t,e),t.query.issuance.promotedPoolsRewards(e)]),[i,r]=n,[s,o]=await this.getAmountOfTokenIdInPool(t,i.toString(),r.toString());return{firstTokenId:i.toString(),secondTokenId:r.toString(),firstTokenAmount:s,secondTokenAmount:o,liquidityTokenId:e,isPromoted:a.gtn(0),firstTokenRatio:$(s,o),secondTokenRatio:$(o,s)}}static async getPools(a){const[i,r]=await Promise.all([T(a),k(a)]),s=await(async(a,i)=>(await a.query.xyk.pools.entries()).reduce(((a,[r,s])=>{const o=r.args.map((t=>t.toHuman()))[0],c=JSON.parse(JSON.stringify(s)).map((a=>t(a)?e(a):new n(a)));return a[i[o]]=c,a}),{}))(a,r),o=await E(a);return Object.values(i).reduce(((t,e)=>Object.values(r).includes(e.id)?t.concat(e):t),[]).map((t=>{const[e,n]=s[t.id];return{firstTokenId:t.symbol.split("-")[0],secondTokenId:t.symbol.split("-")[1],firstTokenAmount:e,secondTokenAmount:n,liquidityTokenId:t.id,firstTokenRatio:$(e,n),secondTokenRatio:$(n,e),isPromoted:o.includes(t.id)}}))}}const _=t=>{if(!t)return"";const e=t.length;return t.substring(0,7)+"..."+t.substring(e-5,e)};const V=async(t,e,n,a)=>new Promise((async(i,r)=>{let s=[];const o="string"==typeof n?n:n.address,c=await(async(t,e,n)=>{let a;if(n&&n.nonce)a=n.nonce;else{const n=await K.getNonce(t,e);a=m.hasAddressNonce(e)?m.getNonce(e):n,n&&n.gt(a)&&(a=n);const i=a.addn(1);m.setNonce(e,i)}return a})(t,o,a);let u=0;try{const g=await e.signAndSend(n,{nonce:c,signer:a?.signer},(async n=>{if(console.info(`Tx[${_(e.hash.toString())}] => ${n.status.type}(${n.status.value.toString()})${function(t,e){if(!process.env.TX_VERBOSE)return"";const n=JSON.parse(e.method.toString()),a=JSON.stringify(n.args),i=t.registry.findMetaCall(e.method.callIndex);if("sudo"==i.method&&"sudo"==i.method){const a=e.method.args[0].callIndex,i=JSON.stringify(n.args.call.args),r=t.registry.findMetaCall(a);return` (sudo::${r.section}::${r.method}(${i})`}return` (${i.section}::${i.method}(${a}))`}(t,e)}`),a?.statusCallback?.(n),n.status.isFinalized){const c=n.status.asFinalized.toString(),d=(await t.rpc.chain.getHeader(c)).number.toBn(),w=d.addn(1),l=await t.rpc.chain.subscribeFinalizedHeads((async n=>{if(n.number.toBn().gt(d)){const n=await t.rpc.chain.getBlockHash(w),o=await t.rpc.chain.getHeader(n);l();const u=(await t.rpc.chain.getBlock(o.hash)).block.extrinsics,d=await t.query.system.events.at(o.hash),y=u.findIndex((t=>t.hash.toString()===e.hash.toString()));y<0&&r(`Tx ([${e.hash.toString()}])\n                      could not be find in the block\n                      $([${_(c)}])`);const m=d.filter((t=>t.phase.isApplyExtrinsic&&t.phase.asApplyExtrinsic.toNumber()===y)).map((e=>{const{event:n,phase:a}=e,i=n.typeDef,r=n.data.map(((t,e)=>({lookupName:i[e].lookupName,data:t})));return{event:n,phase:a,section:n.section,method:n.method,metaDocumentation:n.meta.docs.toString(),eventData:r,error:J(t,n.method,r)}}));s=s.concat(m),a?.extrinsicStatus?.(s),i(s),g()}else if(u++<10)console.info(`Retry [${u}] Tx: [${_(e.hash.toString())}] current: #${n.number} [${_(n.hash.toString())}] finalized in: #${d} [${_(c)}] `);else{l(),r(`Transaction was not finalized: Tx ([${_(e.hash.toString())}]): parent hash: ([${_(n.parentHash.toString())}]): Status finalized: ([${_(c)}])`);const a=await K.getNonce(t,o);m.setNonce(o,a),g()}}))}else if(n.isError){console.info("Transaction Error Result",JSON.stringify(n,null,2)),r(`Tx ([${_(e.hash.toString())}]) Transaction error`);const a=await K.getNonce(t,o);m.setNonce(o,a)}}))}catch(e){const n=await K.getNonce(t,o);m.setNonce(o,n),r({data:e.message||e.description||e.data?.toString()||e.toString()})}})),J=(e,a,r)=>{if("ExtrinsicFailed"===a){const a=r.find((t=>t.lookupName.includes("DispatchError")))?.data?.toHuman?.(),s=a?.Module?.error,o=a?.Module?.index;if(!s||!o)return{documentation:["Unknown error"],name:"UnknownError"};try{const a=e.registry.findMetaError({error:t(s)?i(s):new n(s),index:new n(o)});return{documentation:a.docs,name:a.name}}catch(t){return{documentation:["Unknown error"],name:"UnknownError"}}}return null};class X{static async sendKusamaTokenFromRelayToParachain(t,e,n,a,i,s){const c=new o(t),u=await new r({provider:c}).isReady,g={V1:{interior:{X1:{ParaChain:i}},parents:0}},d={V1:{interior:{X1:{AccountId32:{id:u.createType("AccountId32",n).toHex(),network:"Any"}}},parents:0}},w={V1:[{fun:{Fungible:a},id:{Concrete:{interior:"Here",parents:0}}}]};await u.tx.xcmPallet.reserveTransferAssets(g,d,w,0).signAndSend(e,{signer:s?.signer,nonce:s?.nonce})}static async sendKusamaTokenFromParachainToRelay(t,e,a,i,r){const s={V1:{parents:1,interior:{X1:{AccountId32:{network:"Any",id:t.createType("AccountId32",a).toHex()}}}}};await t.tx.xTokens.transfer("4",i,s,new n("6000000000")).signAndSend(e,{signer:r?.signer,nonce:r?.nonce})}static async sendTurTokenFromTuringToMangata(t,e,a,i,s,c){const g=new o(e),d=await new r({provider:g}).isReady,w=u(i,42),l={V1:{id:{Concrete:{parents:1,interior:{X1:{Parachain:2114}}}},fun:{Fungible:s}}},y={V1:{parents:1,interior:{X2:[{Parachain:2110},{AccountId32:{network:"Any",id:t.createType("AccountId32",w).toHex()}}]}}};await d.tx.xTokens.transferMultiasset(l,y,new n("4000000000")).signAndSend(a,{signer:c?.signer,nonce:c?.nonce})}static async sendTurTokenFromMangataToTuring(t,e,a,i,r){const s=u(a,42),o={V1:{parents:1,interior:{X2:[{Parachain:2114},{AccountId32:{network:"Any",id:t.createType("AccountId32",s).toHex()}}]}}};await V(t,t.tx.xTokens.transfer("7",i,o,new n("6000000000")),e,r)}static async activateLiquidity(t,e,n,a,i){return await V(t,t.tx.xyk.activateLiquidity(n,a,null),e,i)}static async deactivateLiquidity(t,e,n,a,i){return await V(t,t.tx.xyk.deactivateLiquidity(n,a),e,i)}static async claimRewards(t,e,n,a,i){return await V(t,t.tx.xyk.claimRewards(n,a),e,i)}static async createPool(t,e,n,a,i,r,s){return await V(t,t.tx.xyk.createPool(n,a,i,r),e,s)}static async sellAsset(t,e,n,a,i,r,s){return await V(t,t.tx.xyk.sellAsset(n,a,i,r),e,s)}static async buyAsset(t,e,n,a,i,r,s){return await V(t,t.tx.xyk.buyAsset(n,a,i,r),e,s)}static async mintLiquidity(t,e,n,a,i,r,s){return await V(t,t.tx.xyk.mintLiquidity(n,a,i,r),e,s)}static async burnLiquidity(t,e,n,a,i,r){return await V(t,t.tx.xyk.burnLiquidity(n,a,i),e,r)}static async transferToken(t,e,n,a,i,r){return await V(t,t.tx.tokens.transfer(a,n,i),e,r)}static async transferAllToken(t,e,n,a,i){return await V(t,t.tx.tokens.transferAll(a,n,!0),e,i)}}const j=g("0"),U=g("1"),z=g("10"),D=g("100"),W=g("1000"),Z=g("10000"),G=g("100000"),Q=g("1000000"),Y=g("10000000"),tt=g("100000000"),et=g("1000000000"),nt=g("10000000000"),at=g("100000000000"),it=g("1000000000000");g.PE=256,g.NE=-256,g.DP=40,g.RM=g.roundUp;const rt=z.pow(18),st=(t,e)=>{if(!t)return I;try{const a=g(t),i=e&&18!==e?z.pow(e):rt,r=a.mul(i).toString();return/\D/gm.test(r)?I:new n(r)}catch(t){return I}},ot=(t,e)=>{if(!t)return"0";try{const n=g(t.toString()),a=e&&18!==e?z.pow(e):rt,i=n.div(a);return i.toString()}catch(t){return"0"}};class ct{static async sendTurTokenFromTuringToMangataFee(t,e,a,i,s){const c=new o(e),g=await new r({provider:c}).isReady,d=u(i,42),w={V1:{id:{Concrete:{parents:1,interior:{X1:{Parachain:2114}}}},fun:{Fungible:s}}},l={V1:{parents:1,interior:{X2:[{Parachain:2110},{AccountId32:{network:"Any",id:t.createType("AccountId32",d).toHex()}}]}}},y=await g.tx.xTokens.transferMultiasset(w,l,new n("4000000000")).paymentInfo(a);return ot(new n(y.partialFee.toString()),10)}static async sendTurTokenFromMangataToTuringFee(t,e,a,i){const r=u(a,42),s={V1:{parents:1,interior:{X2:[{Parachain:2114},{AccountId32:{network:"Any",id:t.createType("AccountId32",r).toHex()}}]}}},o=await t.tx.xTokens.transfer("7",i,s,new n("6000000000")).paymentInfo(e);return ot(new n(o.partialFee.toString()))}static async sendKusamaTokenFromRelayToParachainFee(t,e,a,i,s){const c=new o(t),g=await new r({provider:c}).isReady,d={V1:{interior:{X1:{ParaChain:s}},parents:0}},w={V1:{interior:{X1:{AccountId32:{id:g.createType("AccountId32",u(a,42)).toHex(),network:"Any"}}},parents:0}},l={V1:[{fun:{Fungible:i},id:{Concrete:{interior:"Here",parents:0}}}]},y=await g.tx.xcmPallet.reserveTransferAssets(d,w,l,0).paymentInfo(e);return ot(new n(y.partialFee.toString()),12)}static async sendKusamaTokenFromParachainToRelayFee(t,e,a,i){const r={V1:{parents:1,interior:{X1:{AccountId32:{network:"Any",id:t.createType("AccountId32",u(a,2)).toHex()}}}}},s=await t.tx.xTokens.transfer("4",i,r,new n("6000000000")).paymentInfo(e);return ot(new n(s.partialFee.toString()))}static async activateLiquidity(t,e,a,i){const r=await t.tx.xyk.activateLiquidity(a,i,null).paymentInfo(e);return ot(new n(r.partialFee.toString()))}static async deactivateLiquidity(t,e,a,i){const r=await t.tx.xyk.deactivateLiquidity(a,i).paymentInfo(e);return ot(new n(r.partialFee.toString()))}static async claimRewardsFee(t,e,a,i){const r=await t.tx.xyk.claimRewards(a,i).paymentInfo(e);return ot(new n(r.partialFee.toString()))}static async createPoolFee(t,e,a,i,r,s){const o=await t.tx.xyk.createPool(a,i,r,s).paymentInfo(e);return ot(new n(o.partialFee.toString()))}static async sellAssetFee(t,e,a,i,r,s){const o=await t.tx.xyk.sellAsset(a,i,r,s).paymentInfo(e);return ot(new n(o.partialFee.toString()))}static async buyAssetFee(t,e,a,i,r,s){const o=await t.tx.xyk.buyAsset(a,i,r,s).paymentInfo(e);return ot(new n(o.partialFee.toString()))}static async mintLiquidityFee(t,e,a,i,r,s=new n(Number.MAX_SAFE_INTEGER)){const o=await t.tx.xyk.mintLiquidity(a,i,r,s).paymentInfo(e);return ot(new n(o.partialFee.toString()))}static async burnLiquidityFee(t,e,a,i,r){const s=await t.tx.xyk.burnLiquidity(a,i,r).paymentInfo(e);return ot(new n(s.partialFee.toString()))}static async transferTokenFee(t,e,a,i,r){const s=await t.tx.tokens.transfer(i,a,r).paymentInfo(e);return ot(new n(s.partialFee.toString()))}static async transferAllTokenFee(t,e,a,i){const r=await t.tx.tokens.transferAll(i,a,!0).paymentInfo(e);return ot(new n(r.partialFee.toString()))}}const ut=(t,e,a,i,r)=>{const s=e.sub(a),o=new n(t).mul(s),c=new n(r).mul(new n(106)).div(new n(6)),u=g(1e4),d=g(1.06).pow(s.toNumber()).mul(u).round(0,0),w=(""+d.toString()).replace(/(-?)(\d*)\.?(\d+)e([+-]\d+)/,(function(t,e,n,a,i){return i<0?e+"0."+Array(1-i-n.length).join("0")+n+a:e+n+a+Array(i-a.length+1).join("0")}));const l=new n(c).sub(new n(c).mul(new n(u.toString())).div(new n(w))),y=new n(o).sub(l);return new n(i).add(y)},gt=async(t,e,a,i,r)=>{const{lastCheckpoint:s,cummulativeWorkInLastCheckpoint:o,missingAtLastCheckpoint:c}=await(async(t,e,a,i)=>{const[r,s,o]=await i.query.xyk.liquidityMiningUser([t,e]);return new n(r.toString()).eq(new n(0))&&new n(s.toString()).eq(new n(0))&&new n(o.toString()).eq(new n(0))?{lastCheckpoint:a,cummulativeWorkInLastCheckpoint:g(0),missingAtLastCheckpoint:g(0)}:{lastCheckpoint:g(r.toString()),cummulativeWorkInLastCheckpoint:g(s.toString()),missingAtLastCheckpoint:g(o.toString())}})(t,a,i,r);return ut(e,i,new n(s.toString()),new n(o.toString()),new n(c.toString()))},dt=async(t,e,a,i)=>{const{lastCheckpoint:r,cummulativeWorkInLastCheckpoint:s,missingAtLastCheckpoint:o}=await(async(t,e,a)=>{const[i,r,s]=await a.query.xyk.liquidityMiningPool(t);return new n(i.toString()).eq(new n(0))&&new n(r.toString()).eq(new n(0))&&new n(s.toString()).eq(new n(0))?{lastCheckpoint:e,cummulativeWorkInLastCheckpoint:new n(0),missingAtLastCheckpoint:new n(0)}:{lastCheckpoint:new n(i.toString()),cummulativeWorkInLastCheckpoint:new n(r.toString()),missingAtLastCheckpoint:new n(s.toString())}})(e,a,i);return ut(t,a,new n(r.toString()),new n(s.toString()),new n(o.toString()))},wt=async(t,e,a,i)=>{const r=await t.rpc.chain.getBlock(),s=new n(r.block.header.number.toString()),o=s.add(new n(i)).div(new n(1e4)),c=s.div(new n(1e4)),u=await t.query.xyk.liquidityMiningActivePool(new n(e)),g=await(async(t,e,a,i)=>{const r=e,s=new n(0),o=t;return ut(t,a,new n(r.toString()),new n(s.toString()),new n(o.toString()))})(a,c,o),d=await dt(new n(u.toString()).add(a),e,o,t),w=await t.query.issuance.promotedPoolsRewards(e),l=new n(w.toString()),y=new n("136986000000000000000000"),m=i.div(new n(1200)),p=await t.query.issuance.promotedPoolsRewards.entries(),k=y.mul(m).div(new n(p.length)).add(l);let h=new n(0);return g.gt(new n(0))&&d.gt(new n(0))&&(h=k.mul(g).div(d)),h};class lt{api;urls;static instanceMap=new Map;constructor(t){this.urls=t,this.api=(async()=>await this.connectToNode(t))()}async connectToNode(t){const e=new o(t,5e3);return await r.create(c({provider:e,throwOnConnect:!0,throwOnUnknown:!0}))}static getInstance(t){return lt.instanceMap.has(JSON.stringify(t))||lt.instanceMap.set(JSON.stringify(t),new lt(t)),lt.instanceMap.get(JSON.stringify(t))}async getApi(){return this.api||(this.api=this.connectToNode(this.urls)),this.api}getUrls(){return this.urls}async waitForNewBlock(t){let e=0;const n=await this.getApi(),a=t||2;return new Promise((async t=>{const i=await n.rpc.chain.subscribeNewHeads((()=>{++e===a&&(i(),t(!0))}))}))}async getChain(){const t=await this.getApi();return l.getChain(t)}async getNodeName(){const t=await this.getApi();return l.getNodeName(t)}async getNodeVersion(){const t=await this.getApi();return l.getNodeVersion(t)}async getNonce(t){const e=await this.getApi();return K.getNonce(e,t)}async disconnect(){const t=await this.getApi();await t.disconnect()}async sendKusamaTokenFromRelayToParachain(t,e,n,a,i=2110,r){return await X.sendKusamaTokenFromRelayToParachain(t,e,n,a,i,r)}async sendKusamaTokenFromRelayToParachainFee(t,e,n,a,i=2110){return await ct.sendKusamaTokenFromRelayToParachainFee(t,e,n,a,i)}async sendKusamaTokenFromParachainToRelay(t,e,n,a){const i=await this.getApi();return await X.sendKusamaTokenFromParachainToRelay(i,t,e,n,a)}async sendKusamaTokenFromParachainToRelayFee(t,e,n){const a=await this.getApi();return await ct.sendKusamaTokenFromParachainToRelayFee(a,t,e,n)}async sendTurTokenFromTuringToMangata(t,e,n,a,i){const r=await this.getApi();return await X.sendTurTokenFromTuringToMangata(r,t,e,n,a,i)}async sendTurTokenFromMangataToTuring(t,e,n,a){const i=await this.getApi();return await X.sendTurTokenFromMangataToTuring(i,t,e,n,a)}async sendTurTokenFromTuringToMangataFee(t,e,n,a){const i=await this.getApi();return await ct.sendTurTokenFromTuringToMangataFee(i,t,e,n,a)}async sendTurTokenFromMangataToTuringFee(t,e,n){const a=await this.getApi();return await ct.sendTurTokenFromMangataToTuringFee(a,t,e,n)}async activateLiquidity(t,e,n,a){const i=await this.getApi();return await X.activateLiquidity(i,t,e,n,a)}async deactivateLiquidity(t,e,n,a){const i=await this.getApi();return await X.deactivateLiquidity(i,t,e,n,a)}async calculateFutureRewardsAmount(t,e,a){const i=await this.getApi();return await(async(t,e,a,i)=>{const r=await t.rpc.chain.getBlock(),s=new n(r.block.header.number.toString()).add(new n(i)).div(new n(1e4)),o=await t.query.xyk.liquidityMiningActiveUser([e,new n(a)]),c=await t.query.xyk.liquidityMiningActivePool(new n(a)),u=await gt(e,new n(o.toString()),a,s,t),g=await dt(new n(c.toString()),a,s,t),d=await t.query.xyk.liquidityMiningUserToBeClaimed([e,a]),w=await t.query.xyk.liquidityMiningUserClaimed([e,a]),l=await t.query.issuance.promotedPoolsRewards(a),y=new n(l.toString()),m=new n("136986000000000000000000"),p=i.div(new n(1200)),k=await t.query.issuance.promotedPoolsRewards.entries(),h=y.add(m.mul(p).div(new n(k.length)));let T=new n(0);return u.gt(new n(0))&&g.gt(new n(0))&&(T=h.mul(u).div(g)),T.add(new n(d.toString())).sub(new n(w.toString()))})(i,t,e,a)}async calculateFutureRewardsAmountForMinting(t,e,n){const a=await this.getApi();return await wt(a,t,e,n)}async calculateRewardsAmount(t,e){const n=await this.getApi();return await l.calculateRewardsAmount(n,t,e)}async claimRewardsFee(t,e,n){const a=await this.getApi();return await ct.claimRewardsFee(a,t,e,n)}async claimRewards(t,e,n,a){const i=await this.getApi();return await X.claimRewards(i,t,e,n,a)}async createPoolFee(t,e,n,a,i){const r=await this.getApi();return await ct.createPoolFee(r,t,e,n,a,i)}async createPool(t,e,n,a,i,r){const s=await this.getApi();return await X.createPool(s,t,e,n,a,i,r)}async sellAssetFee(t,e,n,a,i){const r=await this.getApi();return await ct.sellAssetFee(r,t,e,n,a,i)}async sellAsset(t,e,n,a,i,r){const s=await this.getApi();return await X.sellAsset(s,t,e,n,a,i,r)}async mintLiquidityFee(t,e,n,a,i){const r=await this.getApi();return await ct.mintLiquidityFee(r,t,e,n,a,i)}async mintLiquidity(t,e,n,a,i,r){const s=await this.getApi();return await X.mintLiquidity(s,t,e,n,a,i,r)}async burnLiquidityFee(t,e,n,a){const i=await this.getApi();return await ct.burnLiquidityFee(i,t,e,n,a)}async burnLiquidity(t,e,n,a,i){const r=await this.getApi();return await X.burnLiquidity(r,t,e,n,a,i)}async buyAssetFee(t,e,n,a,i){const r=await this.getApi();return await ct.buyAssetFee(r,t,e,n,a,i)}async buyAsset(t,e,n,a,i,r){const s=await this.getApi();return await X.buyAsset(s,t,e,n,a,i,r)}async calculateBuyPrice(t,e,n){const a=await this.getApi();return await l.calculateBuyPrice(a,t,e,n)}async calculateSellPrice(t,e,n){const a=await this.getApi();return await l.calculateSellPrice(a,t,e,n)}async getBurnAmount(t,e,n){const a=await this.getApi();return await l.getBurnAmount(a,t,e,n)}async calculateSellPriceId(t,e,n){const a=await this.getApi();return await l.calculateSellPriceId(a,t,e,n)}async calculateBuyPriceId(t,e,n){const a=await this.getApi();return await l.calculateBuyPriceId(a,t,e,n)}async getAmountOfTokenIdInPool(t,e){const n=await this.getApi();return await K.getAmountOfTokenIdInPool(n,t,e)}async getLiquidityTokenId(t,e){const n=await this.getApi();return await K.getLiquidityTokenId(n,t,e)}async getLiquidityPool(t){const e=await this.getApi();return await K.getLiquidityPool(e,t)}async transferTokenFee(t,e,n,a){const i=await this.getApi();return await ct.transferTokenFee(i,t,e,n,a)}async transferToken(t,e,n,a,i){const r=await this.getApi();return await X.transferToken(r,t,e,n,a,i)}async transferTokenAllFee(t,e,n){const a=await this.getApi();return await ct.transferAllTokenFee(a,t,e,n)}async transferTokenAll(t,e,n,a){const i=await this.getApi();return await X.transferAllToken(i,t,e,n,a)}async getTotalIssuance(t){const e=await this.getApi();return await K.getTotalIssuance(e,t)}async getTokenBalance(t,e){const n=await this.getApi();return await K.getTokenBalance(n,e,t)}async getNextTokenId(){const t=await this.getApi();return await K.getNextTokenId(t)}async getTokenInfo(t){const e=await this.getApi();return await K.getTokenInfo(e,t)}async getBlockNumber(){const t=await this.getApi();return await K.getBlockNumber(t)}async getOwnedTokens(t){const e=await this.getApi();return await K.getOwnedTokens(e,t)}async getLiquidityTokenIds(){const t=await this.getApi();return await K.getLiquidityTokenIds(t)}async getAssetsInfo(){const t=await this.getApi();return await K.getAssetsInfo(t)}async getBalances(){const t=await this.getApi();return await K.getBalances(t)}async getLiquidityTokens(){const t=await this.getApi();return await K.getLiquidityTokens(t)}async getPool(t){const e=await this.getApi();return await K.getPool(e,t)}async getInvestedPools(t){const e=await this.getApi();return await K.getInvestedPools(e,t)}async getPools(){const t=await this.getApi();return await K.getPools(t)}}const yt=(t,e)=>{const n=new RegExp(`^-?\\d+(?:\\.\\d{0,${e}})?`,"gm");return(t.match(n)?.[0]||t).match(/^-?0*(\d+(?:\.(?:(?!0+$)\d)+)?)/gm)?.[0]??t},mt=t=>{const e=+t;return!(!t||isNaN(Number(t))||isNaN(e)||e<0)};function pt(t){const{s0:e,s1:n,s2:a,s3:i}=function(t){return{s0:BigInt(t[0])<<BigInt(0)|BigInt(t[1])<<BigInt(8)|BigInt(t[2])<<BigInt(16)|BigInt(t[3])<<BigInt(24)|BigInt(t[4])<<BigInt(32)|BigInt(t[5])<<BigInt(40)|BigInt(t[6])<<BigInt(48)|BigInt(t[7])<<BigInt(56),s1:BigInt(t[8])<<BigInt(0)|BigInt(t[9])<<BigInt(8)|BigInt(t[10])<<BigInt(16)|BigInt(t[11])<<BigInt(24)|BigInt(t[12])<<BigInt(32)|BigInt(t[13])<<BigInt(40)|BigInt(t[14])<<BigInt(48)|BigInt(t[15])<<BigInt(56),s2:BigInt(t[16])<<BigInt(0)|BigInt(t[17])<<BigInt(8)|BigInt(t[18])<<BigInt(16)|BigInt(t[19])<<BigInt(24)|BigInt(t[20])<<BigInt(32)|BigInt(t[21])<<BigInt(40)|BigInt(t[22])<<BigInt(48)|BigInt(t[23])<<BigInt(56),s3:BigInt(t[24])<<BigInt(0)|BigInt(t[25])<<BigInt(8)|BigInt(t[26])<<BigInt(16)|BigInt(t[27])<<BigInt(24)|BigInt(t[28])<<BigInt(32)|BigInt(t[29])<<BigInt(40)|BigInt(t[30])<<BigInt(48)|BigInt(t[31])<<BigInt(56)}}(t);return new w(e,n,a,i)}class kt{static createKeyring(t){return new s({type:t})}static createKeyPairFromName(t,e=""){const n=e||"//testUser_"+d(),a=t.createFromUri(n);return t.addPair(a),a}static getXoshiro(t){return pt(t)}static getPriceImpact(t,e,n,a){if(!(t&&e&&mt(n)&&mt(a)))return;const i=t.firstTokenBalance,r=t.secondTokenBalance,s=st(n,e.firstTokenDecimals),o=st(a,e.secondTokenDecimals);if(o.gte(r))return"";const c=i.add(s).mul(B).mul(r),u=r.sub(o).mul(i),d=c.div(u).sub(B).toString(),w=g(d);return yt(w.div(D).toString(),2)}}export{et as BIG_BILLION,D as BIG_HUNDRED,at as BIG_HUNDRED_BILLIONS,tt as BIG_HUNDRED_MILLIONS,G as BIG_HUNDRED_THOUSAND,Q as BIG_MILLION,U as BIG_ONE,z as BIG_TEN,nt as BIG_TEN_BILLIONS,Y as BIG_TEN_MILLIONS,Z as BIG_TEN_THOUSAND,W as BIG_THOUSAND,it as BIG_TRILLION,j as BIG_ZERO,N as BN_BILLION,M as BN_DIV_NUMERATOR_MULTIPLIER,O as BN_DIV_NUMERATOR_MULTIPLIER_DECIMALS,S as BN_HUNDRED,L as BN_HUNDRED_BILLIONS,F as BN_HUNDRED_MILLIONS,b as BN_HUNDRED_THOUSAND,q as BN_MILLION,A as BN_ONE,f as BN_TEN,v as BN_TEN_BILLIONS,P as BN_TEN_MILLIONS,B as BN_TEN_THOUSAND,x as BN_THOUSAND,R as BN_TRILLION,I as BN_ZERO,lt as Mangata,kt as MangataHelpers,ot as fromBN,V as signTx,st as toBN,yt as toFixed};
