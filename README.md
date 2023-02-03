
# 说明
需要确保以下工具已安装：
- go
- curl
- git

运行自动部署脚本后，如果以下工具不存在，则会自动安装（已存在不会重复安装）：
- rust
- circom
- nvm
- node
- npm
- snarkjs
- exchaind


# 自动部署和运行

第一次部署和运行，使用以下命令：
```sh
./start.sh
```

由于生成 ptau 、zkey 文件比较慢，所以第一次运行后再次重新运行时，可使用 `-l` 参数略过这些步骤：
```sh
./start.sh -l
```

默认使用 groth16 协议；你也可以使用 `-k` 参数指定使用 plonk 协议：
```
./start.sh -k
```

运行成功后，会输出部署的 bridge 合约的地址，可以保存一下这个地址，便于使用 `exchaincli` 等查询信息。


# 部署成功后能做什么

## deposit

可以使用以下命令质押：
```sh
node cli/deposit.js
```

或者你也可以使用 `start.sh` 输出的 bridge 合约地址，把 `contract/bridge.sol` 放到 remix 上自己调用合约的 `deposit` 方法。

如果自己调用 bridge 合约的 `deposit` 方法，需要 pub key 信息。使用以下命令可以获得：
```sh
# NAME 可以是 Bob 或 Alice, 参看 data/demo.key 文件
node cli/query.js keys --name <NAME>
```

## query

deposit 成功后，会在 layer2 程序中自动生成账户。使用以下命令可以查询到：
```sh
# NAME 可以是 Bob 或 Alice
node cli/query.js account --name <NAME>
```

## transfer

使用以下命令在 layer2 账户间进行转账：
```sh
# NAME 可以是 Bob 或 Alice
# --amount 是想要转账的币的数量
# --nonce 是 from 账户的 nonce ，可以使用 cli/query.js account 查询到
node cli/l2_transfer.js --from <NAME> --to <NAME> --amount 100 --nonce 0
```

## withdraw

使用以下命令赎回：
```sh
node cli/withdraw.js --name <NAME> --nonce 0
```

你可以使用 `exchaincli query account` 命令查询赎回前后 bridge 合约的币的数量的变化。

你也可以自己做赎回操作。方法是：
1. 使用 `cli/l2_withdraw.js` 命令向 layer2 申请赎回；它会返回调用 bridge 合约的 `withdraw` 方法所需要的参数。
2. 拷贝返回的参数，在 remix 中手动调用 bridge 合约的 `withdraw` 方法。


# TODO
- [ ] 签名、计算 merkle root 时， nonce 没有参与
- [ ] deposit 的值比较大(如 1okt, 1000000000000000000)，circom 验证失败
- [ ] log 不起作用