import React, { Component } from "react";
import * as ReactDOM from "react-dom";
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ModuleCard } from "./Utils";
import PeprmintLogo from '../../image/peprmint_logo.svg';
import Pepr2visPic from '../../image/Convexhull_membrane.png';
import { Button, Jumbotron } from "react-bootstrap";
import { Space } from "antd";
import GithubLogo from '../../image/GitHub-64px.png';
import ComingSoon from '../../image/coming-soon.png';


class Descrption extends Component {
    render() {
        return (
                <>
                <Row className="justify-content-md-center mt-4"> 
                    <Col className="col-6"> <Image src={PeprmintLogo} fluid/>  </Col>
                </Row>

                <Row className="justify-content-md-center mb-3"> 
                    <Col className="col-auto">                        
                        <h3 className="font-weight-lighter"> Resources for
                            <span className="text-primary font-weight-normal"> Pe</span>ripheral
                            <span className="text-primary font-weight-normal"> Pr</span>otein-
                            <span className="text-primary font-weight-normal">M</span>embrane 
                            <span className="text-primary font-weight-normal"> Int</span>eractions 
                        </h3>  
                    </Col>    
                </Row>

                <Row className="justify-content-md-center mb-3"> 
                    <Space size="large"> 
                        <Button className="text-white">Learn more</Button>
                        <span> 
                            <a href="https://github.com/reuter-group/peprmint-web" 
                                title="Source code repository">
                            <Image src={GithubLogo} width={30}/> </a> 
                        </span>
                    </Space>  
                </Row>
            </>                
        )
    }
}

export function Home(){
    return (
    <Container >  
        <Descrption />
        <Row className="justify-content-md-center"> 
            <ModuleCard title = { <span className="text-primary h5">PePr<sup>2</sup>Vis</span> }  link={"/pepr2vis"} imgSrc={Pepr2visPic} 
                cardSubtitle= { <span className="text-secondary"> Peripheral protein protrusion visualisation </span> } />
            
            <ModuleCard title = { <span className="text-primary h5">PePr<sup>2</sup>DB</span>}  link={"/"} imgSrc={ComingSoon} 
                cardSubtitle = { <span className="text-secondary"> Peripheral protein protrusion database </span>}/>                        
        </Row>
    </Container>
    )
}
