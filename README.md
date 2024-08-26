NFT MARKET NOTES

To start the application :-  E:\NFT MarketPlace\NFTFrontend\nftmarketplace> npm run dev
All the routing have been done in Discover which is present inside the component->Navbar->Discover


<!-- For Connecting to the smart contract  -->
we install hardhat , ether and web3modal

<!-- For hardhat -->
npx hardhat node

npx hardhat run scripts/deploy.js --network localhost

 <!-- intsall :- npm i ipfs-http-client, npm i axios -->

 <!-- how to redeploy  -->
 before that delete artifact, cache and abi
 step 1 :- npx hardhat node   ==> it will open local blockchain account
 step 2: In another terminal npx hardhat run scripts/deploy.js --network localhost   --> you will get the same address always