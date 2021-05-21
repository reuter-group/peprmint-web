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

import { InputArea, ControlArea } from "./PeprmintControl";
// import MolstarPlugin from './Molstar';
import MolStarWrapper from './Molstar';
import { References } from './Utils';

import Logo from '../../image/logo.png';
import LogoLarge from '../../image/logo_large.png';
import CbuLogo from '../../image/cbu-logo.svg';
import UibLogo from '../../image/uib-logo.svg';

class BaseLayout extends Component {
    render() {
        return (
            <Container fluid className="px-0 py-0">
                {/* <Header /> */}

                <Container >
                    <Row className="justify-content-md-center mt-5"> 
                        <Col className="col-7"> <Image src={LogoLarge} fluid/>  </Col>
                    </Row>
                    <Row className="justify-content-md-center mb-3"> 
                        <p className="font-weight-lighter h4"> Web server for calculating and visualizing 
                        <span className="text-primary text-large"> hydrophobic protrusions </span>
                        </p> 
                    </Row>
                    <Row >
                        <Col className="col-4">
                            <InputArea />   
                            <ControlArea />                            
                        </Col>
                        <Col> <MolStarWrapper pdbId='2da0'/>  </Col>
                    </Row>
                </Container>

                <References />

                <Footer />
            </Container>

        );
    }
}

class Header extends Component {
    render() {
        return (
            <Container id="peprmint-header" fluid className="mb-2 mx-0 px-0 ">
                <Navbar className="navbar-expand-md mx-0 pb-1 " bg="primary" variant="dark">
                    <Col className="col-1"></Col>
                    <Col className="col-2 ml-5 ">
                        <Navbar.Brand href="" className="py-0 my-0">
                            <p className="fs-1 py-0 my-0"> <img
                                alt=""
                                src={Logo}
                                width="60"
                                height="60"
                                className="d-inline-block align-top"
                            />{' '}
                       PePrMInt</p>
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
            <Container className="footer border-top">
                <Navbar >
                    <Col className="col-3" >
                        <Nav defaultActiveKey="peprmint" className="flex-column">
                            <Nav.Link href="#" eventKey="peprmint" >PePrMInt</Nav.Link>
                            <Nav.Link href="http://www.cbu.uib.no/reuter/"> 2021 Reuter Lab</Nav.Link>
                            <Nav.Link disabled> Version 1.0</Nav.Link>
                        </Nav>
                    </Col>
                    <Col className="col-4">
                        <Nav defaultActiveKey="contacts" className="flex-column">
                            <Nav.Link eventKey="contacts">Contacts</Nav.Link>
                            <Nav.Link href="mailto:dandan.xue@uib.no" title="Send an email to this contact">Dandan Xue, engineer</Nav.Link>
                            <Nav.Link href="mailto:Nathalie.Reuter@uib.no" title="Send an email to this contact">Nathalie Reuter, Prof./Group leader </Nav.Link>
                        </Nav>
                    </Col>

                    <Col className="col-3 text-center"> <Image src={CbuLogo} width={110} />  </Col>
                    <Col className="col-2"> <Image src={UibLogo} width={80} /></Col>
                </Navbar>
            </Container>


        )
    }
}

export function layoutInit(id:string){
    ReactDOM.render(<BaseLayout />, document.getElementById(id));
}
// # export default BaseLayout;