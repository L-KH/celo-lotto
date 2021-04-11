// Lottery contract. Celo Hackathon
pragma solidity ^0.4.21;

contract Lottery {
 address public manager;
 address[] public players;
 
 // constructor : as soon as creating contract, it has been also called
 function Lottery() public {
 // msg is a global function
 manager = msg.sender; // Person who create Contract
 }
 
 // sending Eth to enter loggery: payable function type
 function enter() public payable{
 players.push(msg.sender);
 }
 
 function random() private view returns (uint) {
 // global function sha algorism: keccak256
 return uint(keccak256(block.difficulty, now, players));
 }
 
 function pickWinner() public restricted {
 require(msg.sender == manager); // only manager can pick a winner
 
 uint index = random() % players.length;
 players[index].transfer(address(this).balance);
 // reset the players array and (0) is initial size
 players = new address[](0);
 }
 
 // validation logic
 modifier restricted() {
 require(msg.sender == manager); // only manager can access
 _; // run all the rest of the code inside that function
 }
 
 function getPlayers() public view returns (address[]) {
 return players;
 }
}