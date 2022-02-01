import React, { Component } from "react";
import * as ReactDOM from "react-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav';
import Image from 'react-bootstrap/Image';
import Button from 'react-bootstrap/Button';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"
import { Card, Space, Typography } from "antd";

import PeprmintSmallLogo from '../../image/peprmint-headerlogo-color1.svg';

import CbuLogo from '../../image/cbu-logo.svg';
import UibLogo from '../../image/uib-logo.svg';
import { Pepr2vis } from "./Pepr2vis";
import { Home } from "./Home";
import { Pepr2ds } from "./Pepr2ds";


const { Title } = Typography;

export function HeaderTheme1() {   // single mint color style 
    return(
    <h5 className="font-weight-normal"> Resources for 
        <span className="text-primary font-weight-bold"> Pe</span>ripheral
        <span className="text-primary font-weight-bold"> Pr</span>otein-
        <span className="text-primary font-weight-bold">M</span>embrane 
        <span className="text-primary font-weight-bold"> Int</span>eractions 
    </h5>  
    )   
}

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
                            <HeaderTheme1 />
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


class PeprmintFooter extends Component {
    render() {
        return (          
            <Container>    
                <br/>          
                <Navbar >
                    <Col className="col-3" >
                        <Nav className="flex-column">
                            <Nav.Item> PePrMInt website</Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="https://github.com/reuter-group/peprmint-web"> Version 1.3 </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="http://www.cbu.uib.no/reuter/"> &copy; 2021-2022 Reuter Lab </Nav.Link> 
                        </Nav>
                    </Col>
                    <Col className="col-4">
                        <Nav className="flex-column" >
                            <Nav.Item> Contacts </Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="mailto:Thibault.Tubiana@uib.no" title="Send an email to this contact"> Thibault Tubiana, researcher </Nav.Link>
                            <Nav.Link className="py-0 font-weight-light" href="mailto:dandan.xue@uib.no" title="Send an email to this contact"> Dandan Xue, engineer  </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="mailto:Nathalie.Reuter@uib.no" title="Send an email to this contact">Nathalie Reuter, Prof./Group leader  </Nav.Link> 
                        </Nav>
                    </Col>

                    <Col className="col-2 text-center"> <a href="http://www.cbu.uib.no/">
                        <Image src={CbuLogo} width={110} /> </a> </Col>
                    <Col className="col-3 text-center"> <a href="https://www.uib.no/en"> <Image src={UibLogo} width={80} /> </a> </Col>                    
                </Navbar>
                <br />
            </Container>       
        )
    }
}


export default function App(){
    return (
        <Router>
            <Container fluid className="px-0 py-0">
                <Switch>
                    <Route path="/pepr2vis/:pdbid"> <Header />  <Pepr2vis/> </Route> 
                    <Route exact path="/pepr2vis"> <Header />  <Pepr2vis/> </Route> 
                    <Route exact path="/pepr2ds">  <Header />  <Pepr2ds /> </Route>                  
                    <Route exact path="/"> <Home /> </Route>
                </Switch>      
            </Container>
        </Router>
      );
}

export function layoutInit(id:string, footerId:string){
    ReactDOM.render(<App />, document.getElementById(id));
    ReactDOM.render(<PeprmintFooter />, document.getElementById(footerId));
}