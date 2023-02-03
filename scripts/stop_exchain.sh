#!/bin/sh

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null 2>&1 && pwd)"
HOME_SERVER=$DIR/"../setup/_cache_evm"
LOG_FILE=$DIR/"../setup/okc.txt"

killbyname() {
  NAME=$1
  ps -ef|grep "$NAME"|grep -v grep |awk '{print "kill -9 "$2", "$8}'
  ps -ef|grep "$NAME"|grep -v grep |awk '{print "kill -9 "$2}' | sh
  echo "All <$NAME> killed!"
}

killbyname exchaind
killbyname exchaincli

rm -rf ~/.exchain*
rm -rf $HOME_SERVER
rm -rf $LOG_FILE