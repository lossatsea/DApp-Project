pragma solidity ^0.5.0;

contract Project{
    
    struct Member{
        uint weight;
        uint index;
        string name;
        address addr;
        bool myVote;
    }
    
    struct Vote{
        uint okNum;
        uint voteNum;
        uint totalNum;
        uint pay;
        address theNode;
        string theName;
        VoteResult voteResult;
        VoteType voteType;
        mapping(address => bool) isVoted;
    }
    
    struct Link{
        string link;
        string where;
    }
    
    uint memberNum = 0;
    uint transactNum = 0;
    string info;
    string name;
    string publishInfo;
    enum VoteState {isVoting, notVoting, none}
    enum VoteResult {YES, NO, NONE}
    enum VoteType {ADD, REMOVE}
    VoteState voteState;
    Vote currentVote;
    
    mapping(address => Member) members;
    mapping(address => uint) debts;
    address[] memberAddr;
    Link[] links;
    
    constructor() public payable{
        require(memberNum == 0, "Project has been built.");
    }
    
    function initProject(string memory projectName, string memory myName) public{
        require(memberNum == 0, "Project has been inited.");
        members[msg.sender].weight = 1;
        name = projectName;
        memberNum = 1;
        info = "";
        publishInfo = "";
        voteState = VoteState.none;
        memberAddr.push(msg.sender);
        members[msg.sender].index = memberNum;
        members[msg.sender].name = myName;
        members[msg.sender].addr = msg.sender;
    }
    
    function addMember(string memory myName) public {
        voteState = VoteState.isVoting;
        currentVote = Vote({okNum:0,voteNum:0,totalNum:memberNum,pay:0,theNode:msg.sender,theName:myName,voteResult:VoteResult.NONE,voteType:VoteType.ADD});
        clearVoted();
    }
    
    function checkVoteResult() public view returns(bool res){
        if(currentVote.voteResult == VoteResult.YES){
            res = true;
        } 
        else {
            res = false;
        }
        return (res);
    }
    
    function checkVote() public view returns(VoteType votetype, uint okNum, address theNode, string memory theName){
        return (currentVote.voteType, currentVote.okNum, currentVote.theNode, currentVote.theName);
    }
    
    function vote(bool isOk) public {
        require(voteState == VoteState.isVoting, "There is no vote going.");
        require(currentVote.theNode != msg.sender, "You is the one be voted.");
        require(!currentVote.isVoted[msg.sender], "You have voted.");
        currentVote.isVoted[msg.sender] = true;
        if(isOk) {
            currentVote.okNum++;
            members[msg.sender].myVote = true;
        }
        currentVote.voteNum++;
        if(currentVote.okNum > currentVote.totalNum / 2){
            resultOfOK();
        }
        else if(currentVote.okNum + currentVote.totalNum / 2 <= currentVote.voteNum){
            resultOfNO(); 
        }
    }
    
    function removeMember(address node, uint payment) public {
        require(members[node].weight > 0, "This node is not the member of project");
        require(voteState == VoteState.notVoting, "There is a vote going.");
        voteState = VoteState.isVoting;
        currentVote = Vote({okNum:0,voteNum:0,totalNum:memberNum-1,pay:payment,theNode:node,theName:members[node].name,voteResult:VoteResult.NONE,voteType:VoteType.REMOVE});
        clearVoted();
        vote(true);
    }
    
    function resultOfOK() internal{
        voteState = VoteState.notVoting;
        if(currentVote.voteType == VoteType.ADD){
            members[currentVote.theNode].weight = 1;
            currentVote.voteResult = VoteResult.YES;
            memberNum++;
            memberAddr.push(currentVote.theNode);
            members[currentVote.theNode].index = memberNum;
            members[currentVote.theNode].addr = currentVote.theNode;
            members[currentVote.theNode].name = currentVote.theName;
        }else{
            members[currentVote.theNode].weight = 0;
            currentVote.voteResult = VoteResult.YES;
            memberNum--;
            delete memberAddr[members[currentVote.theNode].index - 1];
            members[currentVote.theNode].index = 0;
            debts[currentVote.theNode] = currentVote.pay;
        }
    }
    
    function resultOfNO() internal{
        voteState = VoteState.notVoting;
        currentVote.voteResult = VoteResult.NO;
    }
    
    function clearVoted() internal{
        for(uint i = 0; i < memberAddr.length; i++){
            currentVote.isVoted[memberAddr[i]] = false;
        }
    }
    
    function getSaving() public view returns(uint){
        return address(this).balance;
    }
    
    function pay() public payable {
        require(debts[msg.sender] > 0, "You have no debet in the project.");
        if(debts[msg.sender] < msg.value) debts[msg.sender] = 0;
        else debts[msg.sender] -= msg.value;
    }
    
    function getInfoOfString() public view returns(string memory){
        return info;
    }
    
    function updateInfo(string memory newInfo) public {
        bytes memory _info = bytes(info);
        bytes memory _newInfo = bytes(newInfo);
        bytes memory res = new bytes(_info.length + _newInfo.length);
        for(uint i = 0; i < res.length; i++){
            if(i < _info.length) res[i] = _info[i];
            else res[i] = _newInfo[i - _info.length];
        }
        info = string(res);
    } 
    
    function updatePublishInfo(string memory newInfo) public{
        bytes memory _info = bytes(publishInfo);
        bytes memory _newInfo = bytes(newInfo);
        bytes memory res = new bytes(_info.length + _newInfo.length);
        for(uint i = 0; i < res.length; i++){
            if(i < _info.length) res[i] = _info[i];
            else res[i] = _newInfo[i - _info.length];
        }
        publishInfo = string(res);
    } 
    
    function getDebtByAddr(address addr) public view returns(uint){
        return debts[addr];
    }
    
    function getMemberById(uint id) public view returns(
        uint weight,
        uint index,
        string memory _name,
        address addr
    ){
        Member memory m = members[memberAddr[id]];
        return (m.weight, m.index, m.name, memberAddr[id]);    
    }
    
    function getMemberNum() public view returns(uint){
        return memberNum;
    }
    
    function getPublishInfoOfString() public view returns(string memory){
        return publishInfo;
    }
    
    function getName() public view returns(string memory){
        return name;
    }
    
    function getMemberWeightByAddr(address addr) view public returns(uint){
        return members[addr].weight;
    }
    
    function getVoteNode() view public returns(address){
        return currentVote.theNode;
    }
    
    function getVoteState() view public returns(VoteState){
        return voteState;
    }
    
    function isVotedByAddr(address addr) view public returns(bool){
        return currentVote.isVoted[addr];
    }
    
    function getIndexByAddr(address addr) view public returns(uint){
        return members[addr].index;
    }
    
    function addLink(string memory _link, string memory _where) public{
        links.push(Link({link:_link, where:_where}));
    }
    
    function getLinkNum() view public returns(uint){
        return links.length;
    }
    
    function getLinkById(uint id) view public returns(string memory link, string memory where){
        return (links[id].link, links[id].where);
    }
    
    function getVoteByAddr(address addr) view public returns(bool){
        return members[addr].myVote;
    }
}