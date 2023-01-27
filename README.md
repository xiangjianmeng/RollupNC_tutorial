> 本文档中的所有操作，初始的 working directory 都是本文档所在目录。

# 安装依赖库
1. 安装 [circom](https://docs.circom.io/getting-started/installation/)
2. 安装 [nodejs 和 npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
3. 安装 demo 代码依赖库：`npm install`


# 重新生成 zk 数据
> 也可以省略这一步，直接进入下一步「部署」。

1. 全局安装 snarkjs:
```sh
npm i -g snarkjs
```

2. 运行以下命令:
```sh
cd circom
./single_tx_prepare.sh
```


# 部署

## 1. 运行 okc 私链
在 okchain 代码目录中执行命令：
```sh
cd dev
./start.sh
```

## 2. 部署合约
在运行的 okc 私链上部署 [contract](./contract) 目录下的合约，部署顺序为：
1. single_tx_verifier.sol
2. mimc.sol
3. 使用 single_tx_verifier 和 mimc 的地址，部署 bridge.sol

## 3. 更新配置数据
1. 使用新部署的 bridge 合约地址，更新 [./data/config.json](./data/config.json) 中的 `bridgeAddress` 字段 和 `depositEventTopic` 字段（`depositEventTopic`为 bridge 合约是 `DepositEvent` 事件的 topic）
2. 合用新部署的 bridge 合约的 abi 信息，更新整个 [./data/bridge.abi.json](./data/bridge.abi.json) 文件内容。


# 运行

## 1. 运行 L2 demo
```sh
node ./index.js -v
```

## 2. deposit
demo 只支持两个用户，且只有两个用户都完成 deposit 时，所有功能才能正常运行，所以首先要确保两个用户都完成 deposit 。

两个用户的名称和私钥放在 [./data/demo.key](./data/demo.key) 文件中，你可以随意修改这个文件中的名称和对应的 private key；也可以不修改直接使用默认值（后面假设使用默认值）。

1. 获取用户的 pub key:
```sh
# 获取 Bob 的 pub key
node ./tools/query.js keys -n Bob

# 获取 Alice 的 pub key
node ./tools/query.js keys -n Alice
```

2. 使用 Bob 和 Alice 的 public key ，分别调用 bridge 合约的 `deposit` 方法。

3. 使用以下命令查询是否已在 L2 上 mint 正确的用户：
```sh
# 查询 Bob 的用户信息
node ./tools/query.js account -n Bob

# 查询 Alice 的用户信息
node ./tools/query.js account -n Alice
```
如果输出类似下面的信息，说明 deposit 成功：
```
{
  pub: [
    '0xe6451a205f2ea085734b9710eb4def13f0ec113c7b507e06d04f3e0d9bffa01d',
    '0x3694e1f233b3b69dd2d0fdb511536c540ab5b1e37bc3c6a50490a6cdfb286b18'
  ],
  balance: 9800,
  nonce: 2,
  status: 'accountValid'
}
```

## 3. L2 转账并提交 zk proof
使用以下命令查询一下 Bob 账户的 nonce 值：
```sh
node ./tools/query.js account -n Bob
```

然后使用以下命令让 Bob 向 Alice 转账：
```sh
# --nonce 是 --from 账户的 nonce 值
# --amount 为要转账的币的数量
node tools/l2_transfer.js --from Bob --to Alice --nonce 0 --amount 100
```

如果转账成功，会返回 merkle root 信息，如：
```
merkle root: 0x1fa811617ec95ecb519d5564a2ab207e74f0e60d8761a49d51a4fa2b5a240a26
```
返回其它错误信息说明转账失败。

**注意：每进行一次转账，就会向 L1 提交一次 zk proof；不转账不会提交**

## 4. withdraw

1. 在 L2 程序中 withdraw:
```sh
node tools/l2_withdraw.js --name Bob --nonce 1   
```
如果运行此命令，则会返回类似下面的数据：
```
["0xe6451a205f2ea085734b9710eb4def13f0ec113c7b507e06d04f3e0d9bffa01d", "0x3694e1f233b3b69dd2d0fdb511536c540ab5b1e37bc3c6a50490a6cdfb286b18"], ["15961055259505622175736064719020930912499584694935836904149996815427968374789", "692066556497499215128662341939836139035738635275460761304685147775666960751"], 9900, ["1538865222422334576548091194700102887139497593368236885396721203983774417186"], [1]
```
这是下一步中调用 bridge 合约、在 L1 上真正 withdraw 所需要参数。

2. 在 L1 链上 withdraw

上一步的 withdraw 只是在 L2 网络中将账户信息链定，并将 withdraw 信息提交到 bridge 合约中；真正要在 L1 中取回相应的币，需要用户再手动调用一下 bridge 合约的 `withdraw` 方法，所需的参数就是上一步中程序返回的数据。

调用成功后，就能看到账户余额相应的变此。


# TODO
- [ ] 签名、计算 merkle root 时， nonce 没有参与
- [ ] deposit 的值比较大(如 1okt, 1000000000000000000)，circom 验证失败
- [ ] log 不起作用