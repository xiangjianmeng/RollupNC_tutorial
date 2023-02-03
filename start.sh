#!/bin/sh

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null 2>&1 && pwd)"
CIRCOM_DIR=$DIR/circom
SETUP_DIR=$DIR/setup
DEPLOY_LOG=""

LIGHTWEIGHT=0
PROTOCOL_FLAG="--groth16"
POWER=15
while getopts "p:gkl" opt; do
  case $opt in
  p)
    echo "POWER=$OPTARG"
    POWER=$OPTARG
    ;;
  g)
    PROTOCOL_FLAG="--groth16"
    ;;
  k)
    PROTOCOL_FLAG="--plonk"
    ;;
  l)
    LIGHTWEIGHT=1
    ;;
  \?)
    echo "Invalid option: -$OPTARG"
    ;;
  esac
done

program_exist() {
    local ret='0'
    command -v $1 > /dev/null 2>&1 || { local ret='1'; }
    if [ "$ret" -ne 0 ]; then
        return 1
    fi
    return 0
}

try_setup_rust() {
    if program_exist 'cargo' ; then
        echo "rust has been exist"
        return
    fi

    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

    if ! program_exist 'cargo' ; then
        echo "rust setup failed"
        exit 1
    fi
    echo "rust setup success"
}

try_setup_circom() {
    if program_exist 'circom' ; then
        echo "circom has been exist"
        return
    fi

    try_setup_rust

    circom_dir=$SETUP_DIR/circom
    git clone https://github.com/iden3/circom.git $circom_dir
    curdir=`pwd`
    cd $circom_dir
    cargo build --release
    cargo install --path circom
    cd $curdir

    if ! program_exist 'circom' ; then
        echo "circom setup failed"
        exit 1
    fi
    echo "circom setup success"
}

try_setup_nvm() {
    if program_exist "nvm" ; then
        echo "nvm has been exist"
        return
    fi

    NVM_INSTALL_SH=$DIR/setup/nvm_install.sh
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh > $NVM_INSTALL_SH
    curlecode=$?
    if [ $curlecode -ne 0 ]; then 
        NVM_INSTALL_SH=$DIR/scripts/nvm_install_v0.39.3.sh
    fi
    sh $NVM_INSTALL_SH

    # load nvm
    [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"

    if ! program_exist 'nvm' ; then
        echo "nvm setup failed"
        exit 1
    fi
}

try_setup_node() {
    if program_exist "node" ; then
        echo "node has been exist"
        return
    fi

    try_setup_nvm
    nvm install stable

    if ! program_exist 'node' ; then
        echo "node setup failed"
        exit 1
    fi
    if ! program_exist 'npm' ; then
        echo "npm setup failed"
        exit 1
    fi

    echo "node & npm setup success"
}

try_setup_exchaind() {
    if program_exist "exchaind" ; then
        echo "exchaind has been exist"
        return
    fi

    exchain_dir = $SETUP_DIR/exchain
    git clone https://github.com/okx/exchain.git $SETUP_DIR/exchain
    curdir=`pwd`
    cd $exchain_dir
    make install
    cd $curdir

    if ! program_exist "exchaind" ; then
        echo "exchaind setup failed"
        exit 1
    fi
    echo "exchaind setup success"
}

run_exchain() {
    try_setup_exchaind

    curdir=`pwd`
    cd $SETUP_DIR
    ../scripts/start_exchain.sh
    cd $curdir

}

setup_deps() {
    try_setup_circom
    try_setup_node

    # install depend libs
    npm install --silent

    # setup snarkjs global
    npm i -g snarkjs
}

zk_prepare() {
    curdir=`pwd`
    cd $CIRCOM_DIR
    ./single_tx_prepare.sh -p $POWER $PPROTOCOL_SHELL_FLAG
    cd $curdir
}

run() {
    if [ $LIGHTWEIGHT -eq 0 ]; then
        setup_deps
        zk_prepare
    fi

    run_exchain

    # deploy contract
    sleep 2 # wait exchain for a while
    DEPLOY_LOG=$(node tools/deploy_contract.js)
    ecode=$?
    if [ $ecode -ne 0 ]; then
        exit 1
    fi

    echo ""
    echo "========================================================================"
    echo "部署成功"
    echo "$DEPLOY_LOG"
    echo "你现在可以使用 node cli/deposit.js 命令向 bridge 合约质押 okt 。"
    echo "或者自己在 remix 在用上面提示的合约地址调用 bridge 合约的 deposit 方法完成质押"
    echo "质押完成后，就可使用 cli/l2_transfer.js 进行 layer2 用户的转账，"
    echo "或者使用 cli/withdraw.js 赎回 layer2 中的币（或使用 cli/l2_withdraw.js "
    echo "获取赎回证明后，自己调用 bridge 合约的 withdraw 方法）。"
    echo "run layer2 program......"
    echo ""
    rm -rf setup/demo.db
    node index.js $PROTOCOL_FLAG -v
}

run