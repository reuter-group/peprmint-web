import React, { Component, useEffect, useRef, useState } from "react";
import Container from 'react-bootstrap/Container';
import { EyeOutlined, FileSearchOutlined, HomeOutlined } from "@ant-design/icons";
import { Breadcrumb, Card, Image, Table } from "antd";
import { VariableSizeGrid as Grid } from 'react-window';
import ResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';
import { message, Upload, Button as AntdButton } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { UploadFile } from "antd/lib/upload/interface";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";


//From http://acces.ens-lyon.fr/biotic/rastop/help/colour.htm#shapelycolours
export const RES_COLORS = new Map(Object.entries({
    LEU: '#33FF00',
    ILE: '#66FF00',
    CYS: "#FFFF00",
    MET: "#00FF00",
    TYR: "#00FFCC",
    TRP: "#00CCFF",
    PHE: "#00FF66",
    HIS: "#0066FF",
    LYS: "#6600FF",
    ARG: "#0000FF",
    ASP: "#FF0000",
    GLU: "#FF0066",
    VAL: "#99FF00",
    ALA: "#CCFF00",
    GLY: "#FF9900",
    PRO: "#FFCC00",
    SER: "#FF3300",
    ASN: "#CC00FF",
    GLN: "#FF00CC",
    THR: "#FF6600",
    UNK: "#000000"
}));

// another color theme for residue visualization
export const COLORS20 = ['#5B8FF9', '#CDDDFD', '#61DDAA', '#CDF3E4', '#65789B',
            '#CED4DE', '#F6BD16', '#FCEBB9', '#7262fd', '#D3CEFD', 
            '#78D3F8', '#D3EEF9', '#9661BC', '#DECFEA', '#F6903D',
            '#FFE0C7', '#008685', '#BBDEDE', '#F08BB4', '#FFE0ED'];

// class PeprmintUpload extends React.Component {
//     // fl: UploadFile<any> = {
//     //     uid: '-1',
//     //     name: 'xxx.png',
//     //     status: 'done',
//     //     size : 2000,
//     //     url: 'http://xxx.png',
//     //     type: "png",
//     // };

//     state = {
//         fileList:  [          
//         ],
//     };

//     handleChange = (info: { fileList: UploadFile<any>[]; }) => {
//         let fileList = [...info.fileList];

//         // 1. Limit the number of uploaded files
//         // Only to show two recent uploaded files, and old ones will be replaced by the new
//         fileList = fileList.slice(-1);

//         // 2. Read from response and show file link
//         fileList = fileList.map(file => {
//             if (file.response) {
//                 // Component will show file.url as link
//                 file.url = file.response.url;
//             }
//             return file;
//         });

//         this.setState({ fileList });
//     };

//     render() {
//         const props = {
//             // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',  // file link
//             onChange: this.handleChange,
//             multiple: false,
//             // beforeUpload: file => {
//             //     if (file.type !== 'image/png') {
//             //       message.error(`${file.name} is not a png file`);
//             //     }
//             //     return file.type === 'image/png' ? true : Upload.LIST_IGNORE;
//             //   },
//         };
//         return (
//             <Upload {...props} fileList={this.state.fileList} maxCount={1}>
//                 <AntdButton icon={<UploadOutlined />}>Upload</AntdButton>
//             </Upload>
//         );
//     }
// }

const { Meta } = Card;

export function ModuleCard(props: {title:React.ReactNode, link:string, imgSrc:string, 
     cardSubtitle?: React.ReactNode, cardContent?:React.ReactNode}){

    const cover = <span className="border-bottom border-primary"> 
      <Image src={props.imgSrc} preview={false}/> </span>;
                
    return (
        <Col className="col-5 my-3"> 
            <Link to={props.link}> 
                <Card hoverable cover = {cover} className="shadow" > 
                <Meta title={props.title} description={props.cardSubtitle} />
                {props.cardContent} 
                </Card>
            </Link>
        </Col>
    )
}

export const enum PageHeaders {
    Home, Pepr2vis, Pepr2ds
}

export function PageHeader( props: {headerList: PageHeaders[], title:React.ReactNode, subtitle:React.ReactNode} ){
    if(props.headerList.length == 0) return (<></>)

    const homeHeader = props.headerList[0] == PageHeaders.Home 
        ? <Breadcrumb.Item> <span> <Link className="text-primary" to="/">
            <HomeOutlined className="align-middle" /> PePrMInt </Link></span> 
          </Breadcrumb.Item>
        : <></>;

    const pepr2visHeader = <Breadcrumb.Item> <span> <EyeOutlined className="align-middle"/> PePr<sup>2</sup>Vis</span> </Breadcrumb.Item>;
    const pepr2dsHeader = <Breadcrumb.Item> <span> <FileSearchOutlined className="align-middle"/> PePr<sup>2</sup>DS<sup className="text-muted">BETA</sup></span> </Breadcrumb.Item>;

    const childHeader = props.headerList.length > 1 
        ? props.headerList[1] == PageHeaders.Pepr2vis ? pepr2visHeader : pepr2dsHeader
        : <> </> ;

    return(<>
        <Row className="mt-3 mb-4 px-3"> 
            <Breadcrumb>
                { homeHeader }
                { childHeader }
            </Breadcrumb>
        </Row>

        <Row className="mb-4 px-3"> 
            <h2> {props.title} <span className="text-muted font-weight-light"> {props.subtitle} </span> </h2>
        </Row> 
        </>
    )
}


export function VirtualTable(props: Parameters<typeof Table>[0]) {
    // this component code is provided by antd
    const { columns, scroll } = props;
    const [tableWidth, setTableWidth] = useState(0);
  
    const widthColumnCount = columns!.filter(({ width }) => !width).length;
    const mergedColumns = columns!.map(column => {
      if (column.width) {
        return column;
      }
  
      return {
        ...column,
        width: Math.floor(tableWidth / widthColumnCount),
      };
    });
  
    const gridRef = useRef<any>();
    const [connectObject] = useState<any>(() => {
      const obj = {};
      Object.defineProperty(obj, 'scrollLeft', {
        get: () => null,
        set: (scrollLeft: number) => {
          if (gridRef.current) {
            gridRef.current.scrollTo({ scrollLeft });
          }
        },
      });
  
      return obj;
    });
  
    const resetVirtualGrid = () => {
      gridRef.current.resetAfterIndices({
        columnIndex: 0,
        shouldForceUpdate: true,
      });
    };
  
    useEffect(() => resetVirtualGrid, [tableWidth]);
  
    const renderVirtualList = (rawData: readonly object[], { scrollbarSize, ref, onScroll }: any) => {
      ref.current = connectObject;
      const totalHeight = rawData.length * 54;
  
      return (
        <Grid
          ref={gridRef}
          className="virtual-grid"
          columnCount={mergedColumns.length}
          columnWidth={(index: number) => {
            const { width } = mergedColumns[index];
            return totalHeight > scroll!.y! && index === mergedColumns.length - 1
              ? (width as number) - scrollbarSize - 1
              : (width as number);
          }}
          height={scroll!.y as number}
          rowCount={rawData.length}
          rowHeight={() => 54}
          width={tableWidth}
          onScroll={({ scrollLeft }: { scrollLeft: number }) => {
            onScroll({ scrollLeft });
          }}
        >
          {({
            columnIndex,
            rowIndex,
            style,
          }: {
            columnIndex: number;
            rowIndex: number;
            style: React.CSSProperties;
          }) => (
            <div
              className={classNames('virtual-table-cell', {
                'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
              })}
              style={style}
            >
              {(rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex]}
            </div>
          )}
        </Grid>
      );
    };
  
    return (
      <ResizeObserver
        onResize={({ width }) => {
          setTableWidth(width);
        }}
      >
        <Table
          {...props}
          className="virtual-table"
          columns={mergedColumns}
          pagination={false}
          components={{
            body: renderVirtualList,
          }}
        />
      </ResizeObserver>
    );
  }
  

class References extends Component {
    render() {
        return (
            <Container className="my-3 p-3 bg-light">
                <h5> References: </h5>
                <ol>
                    <ReferenceItem authors={"Fuglebakk E, Reuter N (2018) "}
                        title="A model for hydrophobic protrusions on peripheral membrane proteins."
                        url="https://doi.org/10.1371/journal.pcbi.1006325"
                        journal="PLoS Comput Biol 14(7): e1006325."
                        />                   
                    <ReferenceItem 
                        description="The molecule viewer plugin used on this website is developed based on Mol* Viewer: "
                        authors="David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose"
                        title = " Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures" 
                        url="https://doi.org/10.1093/nar/gkab314"
                        journal= "Nucleic Acids Research, 2021"
                    /> 
                </ol>
            </Container>
        )
    }
}

function ReferenceItem(props: { authors: string, title: string, url?: string, journal?:string, description?:string}){
    return (<li> 
            {props.description} 
            <span className="font-weight-light">{props.authors} </span>
            <a className="text-primary" href={props.url}> {props.title} </a> 
            <span className="font-weight-light font-italic"> {props.journal} </span>
            </li>
    );
}

export { References }
