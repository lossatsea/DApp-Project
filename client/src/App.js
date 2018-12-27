import React, { Component } from "react";
import ProjectContract from "./contracts/Project.json";
import getWeb3 from "./utils/getWeb3";

import Button from 'react-bootstrap/lib/Button';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import Panel from 'react-bootstrap/lib/Panel';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';

import "./App.css";
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable';
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn';

import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';


class App extends Component {
  constructor(props){
    super(props);
    this.state = { 
      info: "",
      publishedInfo: "",
      web3: null, 
      account: null, 
      contract: null,
      projectName: "",
      userName: "",
      memberNum: -1,
      members: [],
      links: [],
      display: {display:"none"},
      display2: {display:"none"},
      display3: {display:"none"},
      display4: {display:"none"},
      voteState: "",
      voteName: null,
      voteNode: null,
      voteType: null,
      voteResult: "",
      myVote: "[you did not vote]",
      okNum: 0,
      removeMemberID: "",
      removeFine: "",
      updateInfo: "",
      updatePublishInfo: "",
      updateLink: "",
      updateWhere: "",
      balance: 0
    };
    this.initalProject = this.initalProject.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.loadMembers =  this.loadMembers.bind(this);
    this.loadLinks = this.loadLinks.bind(this);
    this.updateInformation = this.updateInformation.bind(this);
    this.addMember = this.addMember.bind(this);
    this.loadVote = this.loadVote.bind(this);
    this.startLoadVote = this.startLoadVote.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.payDebtFromOut = this.payDebtFromOut.bind(this);
    this.checkVoteFromOut = this.checkVoteFromOut.bind(this);
    this.voteEnd = this.voteEnd.bind(this);
    this.addLink = this.addLink.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const instance = new web3.eth.Contract(ProjectContract.abi, ProjectContract.address);
      /*
      const networkId = await web3.eth.net.getId();
      const deployedNetwwork = ProjectContract.networks[networkId];
      const instance = new web3.eth.Contract(ProjectContract.abi, deployedNetwwork && deployedNetwwork.address,);
      */

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({inf0: "", web3, account: accounts[0], contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    try{
      this.state.memberNum = await this.state.contract.methods.getMemberNum().call();
      console.log(this.state.memberNum);
      if(this.state.memberNum > 0){
        const userWeight = await this.state.contract.methods.getMemberWeightByAddr(this.state.account).call();
        const projectName = await this.state.contract.methods.getName().call();
        var publishedInfo = await this.state.contract.methods.getPublishInfoOfString().call();
        const tempPublishedInfo = publishedInfo.split('/');
        publishedInfo = "";
        for(var i = 0; i < tempPublishedInfo.length; i++){
          if(i === tempPublishedInfo.length - 1) publishedInfo += tempPublishedInfo[i];
          else publishedInfo = publishedInfo + tempPublishedInfo[i] + '</p><p>';
        }
        if(userWeight > 0){
          var info = await this.state.contract.methods.getInfoOfString().call();
          const tempInfo = info.split('/');
          info = "";
          for(i = 0; i < tempInfo.length; i++){
            if(i === tempInfo.length - 1) info += tempInfo[i];
            else info = info + tempInfo[i] + '</p><p>';
          }
          const balance = await this.state.contract.methods.getSaving().call();
          this.setState({projectName, info, publishedInfo, balance, display:{display:"none"}, display2:{display:"inline"}, display3:{display:"none"}}, this.loadMembers);
          this.startLoadVote();
          this.loadLinks();
        }else{
          this.setState({projectName, publishedInfo, display:{display:"none"}, display2:{display:"none"}, display3:{display:"inline"}});
        }
      }else{
        this.setState({display:{display:"inline"}, display2:{display:"none"}, display3:{display:"none"}});
      }
    }catch(error){
      console.log(error);
    }
  };

  loadMembers = async() =>{
    try{
      const members = new Array();
      var userName = "";
      const memberNum = await this.state.contract.methods.getMemberNum().call();
      console.log(memberNum);
      var currentNumOfMember = 0;
      for(var i = 0; currentNumOfMember < memberNum; i++){
        var member = {
          weight: 0,
          index: -1,
          name: "",
          address: 0
        };
        await this.state.contract.methods.getMemberById(i).call(null, function(error, result){
          member.weight = result["weight"];
          member.index = result["index"];
          member.name = result["_name"];
          member.address = result["addr"];
        });
        if(member.weight === "0") continue;
        if(member.address === this.state.account) userName = member.name;
        members.push(member);
        currentNumOfMember++;
      }
      this.setState({memberNum, members, userName});
    }catch(error){
      console.log(error);
    }
  }

  loadLinks = async() =>{
    const links = new Array();
    const linkNum = await this.state.contract.methods.getLinkNum().call();
    console.log("linknum:" + linkNum);
    for(var i = 0; i < linkNum; i++){
      var link = {
        where: "",
        link: ""
      };
      try{
          await this.state.contract.methods.getLinkById(i).call(null, function(error, result){
            link.where = result["where"];
            link.link = result["link"];
          });
          links.push(link);
      }catch(error){
        console.log(error);
      }
    }
    this.setState({links});
  }

  initalProject(event){
    if (typeof this.state.contract !== 'undefined') {
      event.preventDefault();
      try{
        this.state.contract.methods.initProject( this.state.projectName, this.state.userName).send({from:this.state.account}).then(function(){
          window.location.reload()
        });
      }catch(error){
        alert("Invalid input!");
        console.log(error);
      }
    }
  }

  updateInformation = async(event) => {
    if (typeof this.state.contract !== 'undefined') {
      event.preventDefault();
      var i;
      try{
        if(typeof this.state.updateInfo !== 'undefined' && this.state.updateInfo.length > 0){
          await this.state.contract.methods.updateInfo(this.state.updateInfo).send({from:this.state.account});
          var info = await this.state.contract.methods.getInfoOfString().call();
          const tempInfo = info.split('/');
          info = "";
          for(i = 0; i < tempInfo.length; i++){
            if(i === tempInfo.length - 1) info += tempInfo[i];
            else info = info + tempInfo[i] + '</p><p>';
          }
          this.setState({updateInfo: "", info});
        }
        if(typeof this.state.updatePublishInfo !== 'undefined' && this.state.updatePublishInfo.length > 0){
          await this.state.contract.methods.updatePublishInfo(this.state.updatePublishInfo).send({from:this.state.account});
          var publishedInfo = await this.state.contract.methods.getPublishInfoOfString().call();
          const tempPublishedInfo = publishedInfo.split('/');
          publishedInfo = "";
          for(i = 0; i < tempPublishedInfo.length; i++){
            if(i === tempPublishedInfo.length - 1) publishedInfo += tempPublishedInfo[i];
            else publishedInfo = publishedInfo + tempPublishedInfo[i] + '</p><p>';
          }
          this.setState({updatePublishInfo: "", publishedInfo});
        }
      }catch(error){
        alert("Invalid input!");
        console.log(error);
      }
    }
  }

  addLink = async(event) =>{
    if (typeof this.state.contract !== 'undefined') {
      event.preventDefault();
      try{
        if(typeof this.state.updateLink !== 'undefined' && typeof this.state.updateWhere !== 'undefined' 
          && this.state.updateLink.length > 0 && this.state.updateWhere.length > 0){
            
          await this.state.contract.methods.addLink(this.state.updateLink, this.state.updateWhere).send({from:this.state.account});
          this.setState({updateLink: "", updateWhere: ""});
          this.loadLinks();
        }
      }catch(error){
        alert("Invalid input!");
        console.log(error);
      }
    }
  }

  addMember= async(event)=>{
    if (typeof this.state.contract !== 'undefined') {
      event.preventDefault();
      if(this.state.userName === "") {
        alert("Invalid input!");return;
      }
      const voteState = await this.state.contract.methods.getVoteState().call();
      if(voteState === "0"){
        alert("The vote has begun, please wait until the vote ends.");return;
      }
      try{
        this.state.contract.methods.addMember(this.state.userName).send({from: this.state.account}).then(function(){
          alert("The vote begins.");
        });
      }catch(error){
        console.log(error);
      }
    }
  }

  startLoadVote = async() =>{
    var voteState = "";
    var tag = 2;
    await this.state.contract.methods.getVoteState().call().then(function(result){
      switch(result){
        case "0" :
          voteState = "The Vote is on...";
          tag = 0;
          break;
        case "1":
          voteState = "The vote has end";
          tag = 1;
          break;
        case "2":
          voteState = "No vote";
          break;
        default:break;
      }
    });
    this.setState({voteState});
    this.loadVote(tag);
  }

  loadVote = async(tag) =>{
    if(tag === 2) return;
    this.setState({display4:{display:"inline"}});
    var type, okNum, voteNode, voteName, voteType;
    await this.state.contract.methods.checkVote().call().then(function(result){
      console.log(result);
      type = result["votetype"];
      okNum = result["okNum"];
      voteNode = result["theNode"];
      voteName = result["theName"];
      voteType = "";
      console.log(typeof type);
      if(type === "1") voteType = "Remove from project";
      else voteType = "Add into project";
    });
    this.setState({voteType, voteNode, voteName, okNum});

    const res = await this.state.contract.methods.isVotedByAddr(this.state.account).call();
    if(res && this.state.account !== voteNode){
      if(await this.state.contract.methods.getVoteByAddr(this.state.account)){
        this.setState({myVote:"YES"});
      }else{
        this.setState({myVote:"NO"});
      }
    }else{
      this.setState({myVote:"[You are the one voted]"});
    }
    if(tag > 0){
      if(await this.state.contract.methods.checkVoteResult().call()){
        this.setState({voteResult: "Successful"});
      }else{
        this.setState({voteResult: "Failure"});
      }
    }else{
      this.setState({voteResult:""});
      if(!res && this.state.account !== voteNode){
        const voteInfo = "There is a vote is on......" + "\nType: " + voteType + "\nAddress: " + voteNode + "\nName: " + voteName + "\n确定: YES \n取消: NO";
        if(window.confirm(voteInfo)){
          await this.state.contract.methods.vote(true).send({from: this.state.account});
          this.voteEnd();
          this.setState({myVote:"YES"});
        }else{
          await this.state.contract.methods.vote(false).send({from: this.state.account});
          this.voteEnd();
          this.setState({myVote:"NO"});
        }
      }
    }
  }

  voteEnd = async() =>{
    this.startLoadVote();
    const memberNum = await this.state.contract.methods.getMemberNum().call();
    this.setState({memberNum});
    this.loadMembers();
  }

  checkVoteFromOut = async() =>{
    if (typeof this.state.contract !== 'undefined') {
      const theNodeVoted = await this.state.contract.methods.getVoteNode().call();
      const memberNum = this.state.memberNum;
      if(theNodeVoted === this.state.account){
        this.state.contract.methods.checkVote().call().then(function(result){
          const okNum = result["okNum"];
          alert("The ok percent of this vote is: " + okNum + "/" + memberNum);
        });
      }else{
        alert("You have no right to check vote result.")
      }
    }
  }

  payDebtFromOut = async(event) =>{
    if (typeof this.state.contract !== 'undefined') {
      event.preventDefault();
      const debt = await this.state.contract.methods.getDebtByAddr(this.state.account).call();
      if(debt === "0"){
        alert("You have no debt in project.");
      }else{
        if(window.confirm("You need to pay " + debt + " for this peoject.")){
          console.log(this.state.web3);
          this.state.contract.methods.pay().send({from:this.state.account,  value: debt});
        }
      }
    }
  }

  removeMember = async(event) =>{
    if (typeof this.state.contract !== 'undefined' && this.state.voteState !== "The Vote is on...") {
      event.preventDefault();
      var flag = 0;
      var removeAddr = 0;
      this.state.members.forEach(member => {
        if(member.index === this.state.removeMemberID){
          if(member.address === this.state.account){
            alert("You can not enter yourself.");flag = 2;return;
          }
          else{
            removeAddr = member.address;flag = 1;
          }
        }
      });
      if(flag === 0){
        alert("The id is not the member of project.");return;
      }else if(flag === 1){
        try{
          await this.state.contract.methods.removeMember(removeAddr, this.state.removeFine).send({from: this.state.account}).then(function(){
            alert("The vote begins.");
            window.location.reload();
          });
          this.setState({myVote:"YES"});
          this.voteEnd();
        }catch(error){
          console.log(error);
          alert("The argument must be both integer.");
        }
      }
    }else{
      alert("There is a vote is on, please wait until the vote ends.");
    }
  }

  handleChange(event){
    switch (event.target.name){
      case "projectName":
        this.setState({projectName: event.target.value});
        break;
      case "userName":
        this.setState({userName: event.target.value});
        break;
      case "updateInfo":
        this.setState({updateInfo: event.target.value});
        break;
      case "updatePublishInfo":
        this.setState({updatePublishInfo: event.target.value});
        break;
      case "removeMemID":
        this.setState({removeMemberID: event.target.value});
        break;
      case "removeFine":
        this.setState({removeFine: event.target.value});
        break;
      case "updateLink":
        this.setState({updateLink: event.target.value});
        break;
      case "updateWhere":
        this.setState({updateWhere: event.target.value});
        break;
      default: break;
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div className="if_notInital" style = {this.state.display}>
          <h1>No Project</h1>
        </div>
        <div className="if_inital" style = {this.state.display2}>
          <p>Project Name</p>
          <h1>{this.state.projectName}</h1>
          <hr style={{border: "2px solid gray"}}></hr>
        </div>
        <div className="if_inital_notMember" style = {this.state.display3}>
          <p>Project Name</p>
          <h1>{this.state.projectName}</h1>
          <hr style={{border: "2px solid gray"}}></hr>
        </div>
        <p>Your address: {this.state.account}</p>
        <div className="if_initial_notMember" style = {this.state.display3}>
        <Grid>
          <Panel>
            <Panel.Heading style={{fontSize:"15pt"}}>Published Information</Panel.Heading>
            <br/>
            <p>{this.state.publishedInfo}</p>
          </Panel>
          <br/>
          <Form>
                <FormControl
                  type="text"
                  name="userName"
                  value={this.state.userName}
                  placeholder="Enter the your name in project"
                  onChange={this.handleChange}
                /><br/>
                <Button onClick = {this.addMember}>Be Member</Button>
                <Button style={{marginLeft:"50px", marginRight:"50px"}} onClick = {this.checkVoteFromOut}>Check Vote Result</Button>
                <Button style={{marginRight:"50px"}} onClick = {this.payDebtFromOut}>Pay Debt</Button>
          </Form>
        </Grid>
        </div>
        <div className="if_notInital" style = {this.state.display} >
          <hr></hr>
          <Grid>
            <Row>
              <Panel>
                <Panel.Heading style={{fontSize:"15pt"}}>Create Project</Panel.Heading>
                <Form style={{padding:"8px"}}>
                    <FormGroup
                      controlId="formCreateProject"
                    ><br/>
                      <FormControl
                        type="text"
                        name="projectName"
                        value={this.state.projectName}
                        placeholder="Enter the project name"
                        onChange={this.handleChange}
                      /><br/>

                      <FormControl
                        type="text"
                        name="userName"
                        value={this.state.userName}
                        placeholder="Enter your name in project"
                        onChange={this.handleChange}
                      /><br/>
                      <Button onClick = {this.initalProject}>Create Project</Button>
                    </FormGroup>
                </Form>
              </Panel>
            </Row>
          </Grid>
        </div>
        <div className="if_initial" style={this.state.display2}>
          <p>Your Name: {this.state.userName}</p>
          <Grid>
            <Row>
              <Panel>
                <Panel.Heading  style={{fontSize:"15pt"}}>Current Information</Panel.Heading>
                <p>MemberNum: {this.state.memberNum}</p>
                <h4>Info:</h4>
                <p dangerouslySetInnerHTML={{__html:this.state.info}}></p>
                <h4>Published Info:</h4>
                <p dangerouslySetInnerHTML={{__html:this.state.publishedInfo}}></p>
                <h4>About Links:</h4>
                <div style={{paddingLeft:"200px", paddingRight:"200px", marginBottom:"10px"}}>
                  <BootstrapTable data={this.state.links} className="text-center">
                    <TableHeaderColumn dataField='where'></TableHeaderColumn>
                    <TableHeaderColumn isKey dataField='link'></TableHeaderColumn>
                  </BootstrapTable>
                </div>
                <p style={{marginBottom:"10px"}}>Balance: {this.state.balance}</p>
              </Panel>
            </Row>
            <br/>
            <Row>
              <Form style={{border: "2px solid lightgray", padding: "8px"}}>
                <FormGroup
                  controlId="formUpdateInfo"
                >
                  <FormControl
                    type="text"
                    name="updateInfo"
                    value={this.state.updateInfo}
                    placeholder="Enter the additional infomation"
                    onChange={this.handleChange}
                  /><br/>

                  <FormControl
                    type="text"
                    name="updatePublishInfo"
                    value={this.state.updatePublishInfo}
                    placeholder="Enter the additional information to publish"
                    onChange={this.handleChange}
                  /><br/>
                  <Button onClick = {this.updateInformation} style={{marginBottom:"30px"}}>Update infomation</Button>

                  <FormControl
                    type="text"
                    name="updateWhere"
                    value={this.state.updateWhere}
                    placeholder="Enter where the link to"
                    onChange={this.handleChange}
                  /><br/>

                  <FormControl
                    type="text"
                    name="updateLink"
                    value={this.state.updateLink}
                    placeholder="Enter link"
                    onChange={this.handleChange}
                  /><br/>
                  <Button onClick = {this.addLink}>Add Link</Button>
                </FormGroup>
              </Form>
            </Row>
            <br/>
            <Row>
              <Panel>
                <Panel.Heading  style={{fontSize:"15pt"}}>The Vote</Panel.Heading>
                <p>({this.state.voteState})<span style={this.state.display4}>you voted "{this.state.myVote}"</span></p>
                <div style={this.state.display4}>
                  <div style={{fontSize:"12pt", marginTop:"5px", marginRight:"200px", marginBottom:"5px", marginLeft:"200px", border:"1px solid lightgray"}}>
                    <div style={{marginLeft:"10px", marginRight:"10px"}}><div style={{float:"left"}}>The vote type:</div><div style={{float:"right"}}>{this.state.voteType}</div><div style={{clear:"both"}}></div></div>
                    <hr style={{border:".5px solid lightgray", margin:"10px"}}/>
                    <div style={{marginLeft:"10px", marginRight:"10px"}}><div style={{float:"left"}}>The object's name:</div><div style={{float:"right"}}>{this.state.voteName}</div><div style={{clear:"both"}}></div></div>
                    <hr style={{border:".5px solid lightgray", margin:"10px"}}/>
                    <div style={{marginLeft:"10px", marginRight:"10px"}}><div style={{float:"left"}}>The object's address:</div><div style={{float:"right"}}>{this.state.voteNode}</div><div style={{clear:"both"}}></div></div>
                    <hr style={{border:".5px solid lightgray", margin:"10px"}}/>
                    <div style={{marginLeft:"10px", marginRight:"10px"}}><div style={{float:"left"}}>The ok number:</div><div style={{float:"right"}}>{this.state.okNum}</div><div style={{clear:"both"}}></div></div>
                    <hr style={{border:".5px solid lightgray", margin:"10px"}}/>
                    <div style={{marginLeft:"10px", marginRight:"10px", marginBottom:"10px"}}><div style={{float:"left"}}>The result of vote:</div><div style={{float:"right"}}>{this.state.voteResult}</div><div style={{clear:"both"}}></div></div>
                  </div>
                </div>
              </Panel>
            </Row>
            <br/>
            <Row>
              <Form style={{border: "2px solid lightgray", padding: "8px"}}>
                <FormControl
                    type="text"
                    name="removeMemID"
                    value={this.state.removeMemberID}
                    placeholder="Enter ID of member"
                    onChange={this.handleChange}
                  /><br/>
                <FormControl
                    type="text"
                    name="removeFine"
                    value={this.state.removeFine}
                    placeholder="Enter the fine num of removed member, it will be his/her debt."
                    onChange={this.handleChange}
                  /><br/>
                  <Button onClick = {this.removeMember}>Remove Member</Button>
              </Form>
            </Row>
            <br/>
            <Row>
              <Panel>
              <Panel.Heading  style={{fontSize:"15pt"}}>Member List</Panel.Heading>
                <BootstrapTable data={this.state.members} striped hover>
                  <TableHeaderColumn isKey dataField='index'>ID</TableHeaderColumn>
                  <TableHeaderColumn dataField='name'>NAME</TableHeaderColumn>
                  <TableHeaderColumn dataField='address'>ADRESS</TableHeaderColumn>
                </BootstrapTable>
              </Panel>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}

export default App;
