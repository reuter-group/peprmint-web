import React, { Component, useRef, useState } from "react";
import * as ReactDOM from "react-dom";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav';
import Image from 'react-bootstrap/Image';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Button from 'react-bootstrap/Button';
import { Typography } from 'antd';

import { InputArea, ControlArea } from "./PeprmintControl";
import { References } from './Utils';

import GithubLogo from '../../image/GitHub-64px.png';
import PeprmintLogo from '../../image/peprmint_logo.svg';

import CbuLogo from '../../image/cbu-logo.svg';
import UibLogo from '../../image/uib-logo.svg';
import { Breadcrumb } from "antd";
import { EyeOutlined, HomeOutlined } from "@ant-design/icons";


const { Title } = Typography;

function BaseLayout (){
    const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
    const [convexHullKey, setconvexHullKey] = useState<React.Key[]>([]);
    const [recalculateKey, setRecalculateKey] = useState<React.Key[]>([]);

    // TODO: set slider value also controlled
        return (
            <Container fluid className="px-0 py-0">
                <Header />
                <Container >
                    <Row className="mt-3 mb-4 px-3"> 
                        <Breadcrumb>
                            <Breadcrumb.Item href="#"> <span> <HomeOutlined className="align-middle" /> PePrMInt</span> </Breadcrumb.Item>
                            <Breadcrumb.Item>  <span> <EyeOutlined className="align-middle"/> PePr<sup>2</sup>Vis</span> </Breadcrumb.Item>
                        </Breadcrumb>
                    </Row>

                    <Row className="mb-4"> 
                        <Col className="col-auto"> 
                            <h3 className=""> PePr<sup>2</sup>Vis: calculate and visualise 
                                <span className="text-primary"> hydrophobic protrusions </span>
                            </h3> 
                        </Col>
                        {/* <Col className="col-1"> 
                            <a href="https://github.com/reuter-group/peprmint-web" 
                               title="Source code repository">
                            <Image src={GithubLogo} width={30}/> </a> </Col> */}
                    </Row>

                    <Row >
                        <Col className="col-4">
                            <InputArea setCheckedKeys={setCheckedKeys} setConvexHullKey={setconvexHullKey} setRecalculateKey={setRecalculateKey}/>   
                            <ControlArea checkedKeys ={checkedKeys} setCheckedKeys={setCheckedKeys} 
                                         convexHullKey={convexHullKey} setConvexHullKey={setconvexHullKey} 
                                         recalculateKey={recalculateKey} setRecalculateKey={setRecalculateKey} />                            
                        </Col>
                        <Col className="pt-4"> <div id="molstar-div" style={{ height: 650 }} /> </Col>
                    </Row>
                </Container>

                <References />

                <Footer />
            </Container>

        );
    
}

class Header extends Component {
    render() {
        return (
            <Container id="peprmint-header" fluid className="mb-2 mx-0 px-0 ">
                <Navbar className="navbar-expand-md mx-0 pb-1 border-bottom shadow-sm"                    
                    // variant="dark"
                    >
                    <Col className="col-auto ml-5"> 
                        <img alt="" src={PeprmintLogo} height="80" />
                    </Col>
                    <Col className="col-auto ">
                        <Navbar.Brand href="" className="py-0 my-0">
                            <h4 className="font-weight-lighter"> Resources for 
                                <span className="text-primary font-weight-normal"> Pe</span>ripheral
                                <span className="text-primary font-weight-normal"> Pr</span>otein-
                                <span className="text-primary font-weight-normal">M</span>embrane 
                                <span className="text-primary font-weight-normal"> Int</span>eractions 
                            </h4>                                                               
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
                        <Nav className="flex-column">
                            <Nav.Item> PePrMInt-web</Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="https://github.com/reuter-group/peprmint-web"> Version 1.1 </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="http://www.cbu.uib.no/reuter/"> &copy; 2021 Reuter Lab </Nav.Link> 
                        </Nav>
                    </Col>
                    <Col className="col-4">
                        <Nav className="flex-column" >
                            <Nav.Item> Contacts </Nav.Item>
                            <Nav.Link className="py-0 font-weight-light" href="mailto:dandan.xue@uib.no" title="Send an email to this contact"> Dandan Xue, engineer  </Nav.Link> 
                            <Nav.Link className="py-0 font-weight-light" href="mailto:Nathalie.Reuter@uib.no" title="Send an email to this contact">Nathalie Reuter, Prof./Group leader  </Nav.Link> 
                        </Nav>
                    </Col>

                    <Col className="col-3 text-center"> <a href="http://www.cbu.uib.no/">
                        <Image src={CbuLogo} width={110} /> </a> </Col>
                    <Col className="col-2"> <a href="https://www.uib.no/en"> <Image src={UibLogo} width={80} /> </a> </Col>                    
                </Navbar>
                <br />
            </Container>


        )
    }
}

export function layoutInit(id:string){
    ReactDOM.render(<BaseLayout />, document.getElementById(id));
}
// # export default BaseLayout;