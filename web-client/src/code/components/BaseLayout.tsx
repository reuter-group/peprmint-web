import React, { Component } from "react";
import * as ReactDOM from "react-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav';
import Image from 'react-bootstrap/Image';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Button from 'react-bootstrap/Button';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"

import { Breadcrumb, Card, PageHeader, Typography } from "antd";
import { EyeOutlined, HomeOutlined } from "@ant-design/icons";

import GithubLogo from '../../image/GitHub-64px.png';
import PeprmintSmallLogo from '../../image/peprmint-headerlogo-color1.svg';
import PeprmintLogo from '../../image/peprmint_logo.svg';

import CbuLogo from '../../image/cbu-logo.svg';
import UibLogo from '../../image/uib-logo.svg';
import { Pepr2vis } from "./Pepr2vis";


const { Title } = Typography;

const headerTheme1 =   // single mint color style 
    <h5 className="font-weight-normal"> Resources for 
        <span className="text-primary font-weight-bold"> Pe</span>ripheral
        <span className="text-primary font-weight-bold"> Pr</span>otein-
        <span className="text-primary font-weight-bold">M</span>embrane 
        <span className="text-primary font-weight-bold"> Int</span>eractions 
    </h5>     
    

const headerTheme2 = // multiple colors 
    <h5 className="font-weight-normal"> Resources for 
        <span className="font-weight-bold" style={{ color: "#1C75BB" }}> Pe</span>ripheral
        <span className="text-primary font-weight-bold"> Pr</span>otein-
        <span className="font-weight-bold" style={{ color:"orange" }}>M</span>embrane 
        <span className="font-weight-bold" style={{ color:"gray" }}> Int</span>eractions 
    </h5>     
    
    

class Header extends Component {
    render() {
        return (
            <Container id="peprmint-header" fluid className="mb-2 mx-0 px-0 ">
                <Navbar className="navbar-expand-md mx-0 pb-1 border-bottom shadow-sm" >
                    <Col className="col-auto ml-5"> 
                        <Link to="/"><img alt="" src={PeprmintSmallLogo} height="40" /> </Link>
                    </Col>
                    <Col className="col-auto ml-1">
                        <Navbar.Brand href="" className="py-0 my-0">
                            { headerTheme1 }
                        </Navbar.Brand>
                    </Col>
                    {/* <Col className="col-auto">
                        <Nav className="mr-auto">
                            <Nav.Link href="#home">Home</Nav.Link>
                            <Nav.Link href="#about">About</Nav.Link>
                        </Nav>
                    </Col> */}
                 </Navbar>
             </Container>
        )
    }
}


class Descrption extends Component {
    // get xx() {
    //     return "xx";
    // };

    render() {
        return (
            <Jumbotron fluid className="pt-3 pb-1 mb-2 bg-light">
                <Container>
                    <h4>
                        Web server for  calculating and visualising 
                        <a className="text-primary" href="xxx"> hydrophobic protrusions </a>
                    </h4>
                    <p className="mt-4">
                        <Button variant="outline-primary">Learn more</Button>
                    </p>
                </Container>
            </Jumbotron>
        )
    }
}



class Footer extends Component {

    render() {
        return (
            <Container className="footer border-top bg-light" fluid>
                <Navbar >
                    <Col className="col-3" >
                        <Nav className="flex-column">
                            <Nav.Item> PePrMInt website</Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="https://github.com/reuter-group/peprmint-web"> Version 1.1 </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="http://www.cbu.uib.no/reuter/"> &copy; 2021 Reuter Lab </Nav.Link> 
                        </Nav>
                    </Col>
                    <Col className="col-3">
                        <Nav className="flex-column" >
                            <Nav.Item> Contacts </Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="mailto:dandan.xue@uib.no" title="Send an email to this contact"> Dandan Xue, engineer  </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="mailto:Nathalie.Reuter@uib.no" title="Send an email to this contact">Nathalie Reuter, Prof./Group leader  </Nav.Link> 
                        </Nav>
                    </Col>

                    <Col className="col-3 text-center"> <a href="http://www.cbu.uib.no/">
                        <Image src={CbuLogo} width={110} /> </a> </Col>
                    <Col className="col-3 text-center"> <a href="https://www.uib.no/en"> <Image src={UibLogo} width={80} /> </a> </Col>                    
                </Navbar>
                <br />
            </Container>


        )
    }
}


function Home(){
    return (
    <Container>
        <Row className="justify-content-md-center"> 
            <Col className="col-5">
                <Card title="PePr2Vis"  hoverable 
                cover = {<Link to="/pepr2vis"><img src={PeprmintLogo} width={"300"}/> </Link>}>
                <p>Card content</p>
                </Card>
            </Col>
            
            <Col className="col-5">
                <Card title="PePr2Vis"  hoverable 
                cover = {<Link to="/pepr2vis"><img src={PeprmintLogo} width={"300"}/> </Link>}>
                <p>Card content</p>
                </Card>
            </Col>
        </Row>
    </Container>
    )
}



export default function App(){
    return (
        <Router>
            <Container fluid className="px-0 py-0">
                <Header /> 

                {/* body */}
                <Container fluid className="px-0 py-0">                      
                    <Switch>
                        <Route exact path="/pepr2vis"> <Pepr2vis /> </Route>                   
                        <Route exact path="/"> <Home /> </Route>
                    </Switch>      
                </Container>

                <Footer />
            </Container>
        </Router>
      );
}

export function layoutInit(id:string){
    ReactDOM.render(<App />, document.getElementById(id));
}
// # export default BaseLayout;