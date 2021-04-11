import React from "react";
import "./global";
import { web3, kit } from "./root";
import CountDown from 'react-native-countdown-component';
import moment from 'moment';
import {
  StyleSheet,
  Text,
  Image,
  Button,
  View,
  YellowBox,
  ScrollView,
} from "react-native";

import {
  requestTxSig,
  waitForSignedTxs,
  requestAccountAddress,
  waitForAccountAuth,
  FeeCurrency,
} from "@celo/dappkit";
import { toTxResult } from "@celo/connect";
import * as Linking from "expo-linking";
import Lottery from "./contracts/Lottery.json";

YellowBox.ignoreWarnings([
  "Warning: The provided value 'moz",
  "Warning: The provided value 'ms-stream",
]);

export default class App extends React.Component {
  state = {
    address: "address",
    manager: "manager",
    celoBalance: '...',
    cUSDBalance: "...",
    pool: "...",
    Lottery: {},
    Players: "0",
    totalDuration: '3600',
  };
  componentDidMount = async () => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = Lottery.networks[networkId];
    const instance = new web3.eth.Contract(
      Lottery.abi,
      deployedNetwork && deployedNetwork.address
    );
    this.setState({ Lottery: instance });
  };

  login = async () => {
    const requestId = "login";
    const dappName = "Celo Lottery";
    const callback = Linking.makeUrl("/my/path");
    requestAccountAddress({
      requestId,
      dappName,
      callback,
    });
    const dappkitResponse = await waitForAccountAuth(requestId);
    kit.defaultAccount = dappkitResponse.address;
    const stableToken = await kit.contracts.getStableToken();
    const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount);
    let balance = await kit.web3.eth.getBalance(dappkitResponse.address)
    let poolbalance = await kit.web3.eth.getBalance(this.state.Lottery.options.address)
    let cUSDBalance = cUSDBalanceBig.toString();
    let list = await this.state.Lottery.methods.getPlayers().call();
    let manag = await this.state.Lottery.methods.manager().call();
    this.setState({
      cUSDBalance: cUSDBalance,
      celoBalance: balance,
      pool: poolbalance,
      isLoadingBalance: false,
      address: dappkitResponse.address,
      Players: list,
      manager: manag
    });
  }

  
  joinlottery = async () => {
    const requestId = "login";
    const dappName = "Celo lottery";
    const callback = Linking.makeUrl("/my/path");
    const txObject = await this.state.Lottery.methods.enter()
    await kit.sendTransactionObject(txObject, {from: this.state.address})
    requestTxSig(kit,[
        {
          from: this.state.address,
          to: this.state.Lottery.options.address,
          tx: txObject,
          value: 1000000000000000000,
          feeCurrency: FeeCurrency.cUSD
        }],
      { requestId, dappName, callback }
    )
    const dappkitResponse = await waitForSignedTxs(requestId)
    const tx = dappkitResponse.rawTxs[0]
    let result = await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()
    console.log(`transaction receipt: `, result)
    let balance = await kit.web3.eth.getBalance(this.state.address)
    balance = balance/10**18
    let balancepool = await kit.web3.eth.getBalance(this.state.Lottery.options.address)
    pool = balancepool/10**18
    time = pool * 3600
    const stableToken = await kit.contracts.getStableToken()
    const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount)
    let cUSDBalance = cUSDBalanceBig.toString()/10**18
    this.setState({ cUSDBalance, celoBalance: balance, isLoadingBalance: false, pool: pool, totalDuration: time })
  };
  pickwinner = async () => {
    const requestId = "winner";
    const dappName = "Celo lottery";
    const callback = Linking.makeUrl("/my/path");
      const txObject = await this.state.Lottery.methods.pickwinner()
      await kit.sendTransactionObject(txObject, {from: this.state.address})
      requestTxSig(kit,[
          {
            from: this.state.address,
            to: this.state.Lottery.options.address,
            tx: txObject,
            estimatedGas: 300000,
            feeCurrency: FeeCurrency.cUSD
          }],
        { requestId, dappName, callback }
      )
      const dappkitResponse = await waitForSignedTxs(requestId)
      const tx = dappkitResponse.rawTxs[0]
      let result = await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()
      console.log(`transaction receipt: `, result)
      let balance = await kit.web3.eth.getBalance(this.state.address)
      balance = balance/10**18
      let pool = await kit.web3.eth.getBalance(this.state.Lottery.options.address)
      pool = pool/10**18
      const stableToken = await kit.contracts.getStableToken()
      const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount)
      let cUSDBalance = cUSDBalanceBig.toString()/10**18
      this.setState({ cUSDBalance, celoBalance: balance, pool: pool, isLoadingBalance: false })
   
  };


  render() {
    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button onPress={()=> this.login()} title="Connect to update state" />
        </View>
        <View style={styles.button}>
          <Text>player: {this.state.address}</Text>
          <Text>Balance: {this.state.cUSDBalance}</Text>
          <Text>Celo : {this.state.celoBalance}</Text>
          <Text>Pool to win: {this.state.pool} Celo</Text>
          <Text>Manager: {this.state.manager}</Text>
        </View>
        <ScrollView style={styles.scrollView}>
          <View style={styles.title}>
            <Text style={styles.title}>Celo Lottery </Text>
            <Text style={styles.baseText}>
              Join the lottery by depositing 1 Celo. the countdown will start if
              10 members joined the lottery.
            </Text>
            <Image style={{resizeMode: 'center',height: 100,width: 200,}} source={require("./assets/logo.png")}></Image>
            <Button title="Join" onPress={()=> this.joinlottery()} />
            <Text>countdown:</Text>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <CountDown
                until={this.state.totalDuration}
                timetoShow={('M', 'S')}
                
                size={20}
              />
            </View>
            <Text>Players: {this.state.Players}</Text>
            <Button title="pick the winner" onPress={()=> this.pickwinner()} />
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 20,
    borderRadius: 4,
    backgroundColor: "#841584",
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "oldlace",
    alignSelf: "flex-start",
    marginHorizontal: "1%",
    marginBottom: 6,
    minWidth: "48%",
    textAlign: "center",
  },
  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: "#1769aa",
    justifyContent: "center",
  },
  baseText: {
    margin: 5,
    textAlign: "center",
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#1769aa",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  logo: {
    width: 66,
    height: 58,
  },
});
