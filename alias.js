import {
    Client,
    AccountId,
    PrivateKey,
    AccountInfoQuery,
    PublicKey
  } from "@hashgraph/sdk";
  import { keccak_256 } from "@noble/hashes/sha3";
  import { Buffer } from "buffer";
  
  // Thay thông tin operator của bạn
  const operatorId = AccountId.fromString("0.0.9305962");
  const operatorKey = PrivateKey.fromString("0xab020c01f94f661994cccc0c77278b794ab5e070e23f0ce427b3f9a1b3f066af");
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  
  async function getAliasEvmAddress(accountIdStr) {
    const accountId = AccountId.fromString(accountIdStr);
  
    const info = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(client);
  
    const publicKey = info.key instanceof PublicKey
      ? info.key
      : PublicKey.fromString(info.key.toString());
  
    const publicKeyBytes = publicKey.toBytesRaw();
    const hash = keccak_256(publicKeyBytes);
  
    return "0x" + Buffer.from(hash.slice(-20)).toString("hex");
  }
  
  (async () => {
    const aliasAddress = await getAliasEvmAddress("0.0.9305962");
    console.log("Alias EVM Address (HashScan style):", aliasAddress);
  })();
  