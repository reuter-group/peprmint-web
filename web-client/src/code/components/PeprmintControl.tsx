import  React from "react";
import { Alert, Button, Col, Container, Form, InputGroup, Row, } from "react-bootstrap";
import { Upload, Button as AntdButton, message, Switch, Form as AntdForm, Space, Divider } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { PluginWrapper } from "../main"
import { Slider, Tree } from "antd";
import { Transparency } from "molstar/lib/mol-theme/transparency";
import { useRef } from "react";

import { ProtrusionVisualRef } from '../helpers'
import { Key } from "antd/lib/table/interface";

function validPdbID(pdbId:any) {
  const validPDB = /^[0-9][0-9|a-z|A-Z]{3}$/;
  return validPDB.test(pdbId) && (pdbId.length == 4)
}

function InputArea() {
  const colwidth = 3;
  const [selectedFile, setSelectedFile] = useState<File>();
  //** this React-bootstrap validation does not work well here **//
  // const [validated, setValidated] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');

  const beforeUpload = (file:File) => {
    if(file){
      setSelectedFile(file);
    }
    // const isLt20M = file.size / 1024 / 1024 < 20;
    // if (!isLt20M) {
    //   message.error('Structure file must be smaller than 20MB!');
    // }
    return false; // stop sending HTTP request
  }

  const onRemove = (file:any) => {
    setSelectedFile(undefined);
  };

  const handleSubmit = (event: any) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const pdbId = data.get('pdbId')! as string;

    setErrorMessage(''); 

    if(validPdbID(pdbId)){
        PluginWrapper.load({
          pdbId: pdbId,
        })
    } else if(selectedFile){
        PluginWrapper.loadFile(selectedFile);
        // message.success(`${selectedFile.name} was loaded successfully`); 
    } else {    
      console.log('no valid input')
      setErrorMessage('Please input either a valid PDB ID or a structure FILE');
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    
    <Form onSubmit={handleSubmit} 
          // validated={validated}
          className="bg-light border px-3 py-3">
      <div className="h5 mb-3 border-black border-bottom"> Input a protein structure </div> 

      <Form.Group controlId="formPdbId" as={Row}>
        <Form.Label className="pr-0" column sm={colwidth}> PDB ID</Form.Label>
        <Col sm={4} className="pl-0">
          <Form.Control type="text" name="pdbId" placeholder="e.g. 1rlw" maxLength={4} />
        </Col>
        <Col className="px-0"> <Form.Text muted> 4-letter PDB entry ID</Form.Text> </Col>
      </Form.Group>

      <Form.Group controlId="formInputPdb" as={Row}>
        <Form.Label column sm={colwidth} className="pt-0 pr-0 text-center">Or </Form.Label>
        <Col sm={9} className="pl-0">
        <Upload name="pdbFile" accept=".pdb, .ent, .cif, .mcif" maxCount={1} 
          //  onChange={onChange}
           beforeUpload={beforeUpload}
           onRemove={onRemove}
          >
          <AntdButton icon={<UploadOutlined />}>Select a structure file</AntdButton>
          <Form.Text muted > PDB or mmCIF format</Form.Text> 
        </Upload>
         </Col>
      </Form.Group>
      <Alert show={errorMessage !=''} variant="danger" onClick={() => setErrorMessage('')} dismissible>{ errorMessage }</Alert>
      <Button variant="primary mt-3" className="text-white" type="submit" block>
        Load
      </Button>
    </Form>
    
  );
};



function ControlArea() {
  
  // function onChange(checked: any) {
  //   console.log(`switch to ${checked}`);
  //   checked? PluginWrapper.showProtrusion():PluginWrapper.hideProtrusion()
  //   // if(checked){
  //   //   PluginWrapper.showProtrusion();
  //     //  PluginWrapper.updateStyle({ 
  //     //    sequence: { 
  //     //     // coloring: 'proteopedia-custom' 
  //     //     } 
  //     //   }, true);
  //   // }
  // }

  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const treeDataProtrusion = [
    {
      title: 'Show protrusions',
      key: '0-0',
      selectable: false,
      children: [{         
        title: <span> <span style={{ color: 'orange' }}> hydrophobic </span> protrusions </span>,
        key: '0-0-0',
        selectable: false,
      },
      { 
        title: <span> all <span style={{ color: 'gray' }}> C-α, C-β </span> atoms </span>,
        key: '0-0-1',
        selectable: false,
      },
      { 
        title: <span> <span style={{ color: 'orange' }}> hydrophobic </span> <span style={{ color: 'gray' }}> C-α, C-β </span> atoms </span>,
        key: '0-0-2',
        selectable: false,
      },
     ],
    },
  ]

  const [sliderWidth, setSliderWidth] = useState('20px')
  const parentRef = useRef(null)

  const onChangeOpacity = (value:number) => {
      PluginWrapper.changeOpacity(value/100)
  }

  const treeDataConvexHull = [
    {
      title: 'Show convex hull',
      key: '0-0',
      selectable: false,
      children: [{ 
        selectable: false, 
        title: <Space> opacity: 
                  <Slider style={{ width: sliderWidth }} 
                  defaultValue={70} 
                  tipFormatter={ v => `${v?v/100:0}`}
                  onChange={onChangeOpacity}
                  /> 
                </Space> ,
        key: '0-0-0',
        checkable: false,
      }],
    },
  ]


  const onCheckPortrusion = async (checkedKeys:any, info:any) => {
    const checkedKey = info.node.key
    const checked = info.checked 
    let checkedKeysValue = checkedKeys as { checked: Key[]; halfChecked: Key[]; }

    if(checkedKey === '0-0'){
       await PluginWrapper.toggleProtrusion(ProtrusionVisualRef.NormalProtrusion)

       if(checked){
         if(!checkedKeysValue.checked.includes('0-0-0')){
            PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroProtrusion)
            checkedKeysValue.checked.push('0-0-0')
         }
        setCheckedKeys(checkedKeysValue.checked)
       }else{
         if(checkedKeysValue.checked.includes('0-0-0')){
           PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroProtrusion)
         }
         setCheckedKeys(checkedKeysValue.checked.filter( (key:React.Key) => key != '0-0-0') )
       }       
    }else {
      if(checkedKey === '0-0-0'){
        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroProtrusion)
      }else if(checkedKey === '0-0-1'){
        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.NormalCaCb)
      }else if(checkedKey === '0-0-2'){
        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroCaCb)
      }
      setCheckedKeys(checkedKeysValue.checked)
    }
  };


  const onCheckConvexHull = (checkedKeys:any, info:any) => {
    const checkedKey = info.node.key
    const checked = info.checked 
    if(checkedKey === '0-0')
      PluginWrapper.toggleProtrusion(ProtrusionVisualRef.ConvexHull)
  };

//   useEffect ( () => {
//     if(parentRef.current){
//         let parentWidth = (parentRef.current! as HTMLDivElement).offsetWidth;
//         setSliderWidth(`${parentWidth/2}px`)
//         console.log('setSliderWidth', sliderWidth)
//     }
// }, [parentRef]);

  const onExpandConvexHull = (expandedKeys: React.Key[] , info: any) => {
    // console.log('onExpand', expandedKeys, info);
    if(info.expanded){
      if(parentRef.current){
        let parentWidth = (parentRef.current! as HTMLDivElement).offsetWidth;
        setSliderWidth(`${parentWidth/2}px`)
      }
    }
  };

  return (
    <Container className="my-3 p-3 bg-light border" > 
    <div className="h5 mb-3 border-black border-bottom" ref={parentRef}> Settings </div> 
    
    <Tree
      className="bg-light"
      checkable
      defaultCheckedKeys={[]}
      checkStrictly={true}
      onCheck = {onCheckPortrusion}
      treeData={treeDataProtrusion}
      checkedKeys={checkedKeys}
    />

    <Tree 
      className="bg-light"
      checkable
      defaultCheckedKeys={[]}
      onExpand={onExpandConvexHull}
      onCheck={onCheckConvexHull}
      treeData={treeDataConvexHull}      
    />

      <Divider />
      <Space size={10}> <Switch/>
      Recalculate for selected residues </Space>
      </Container>
  )
}


export { InputArea, ControlArea }