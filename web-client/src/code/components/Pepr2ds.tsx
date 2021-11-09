import { Select, Statistic, Table } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, VirtualTable } from "./Utils";
import Papa from "papaparse";

import csvPath from '../../data/CB.csv';  // set and use this to pack CSV file (?)
const CSVFILE = 'asset/CB.csv';

export function Pepr2ds() {
    
    const title = <span> PePr<sup>2</sup>DS </span>;

    const [tableData, setTableData] = useState<any[]>([])
    const [tableLength, setTableLength] = useState(0);

    useEffect(() => {                    
        const loadData =  async() => {
            console.log(`loading ${csvPath}`);
            const csvData = await fetch(CSVFILE).then(res => res.text() );
            const table = Papa.parse(csvData, { header: true});
            console.log(`loaded ${table.data.length} rows `);

            const shortTableData =  table.data.map((data:any, i) => { return {
                rowId: i,
                domain: data.domain ,
                cathpdb: data.cathpdb,
                pdb: data.pdb,
                uniprot_acc: data.uniprot_acc,
                uniprot_id: data.uniprot_id,
                atom_number: data.atom_number,
            }}); 
          
            setTableData(shortTableData);
            setTableLength(shortTableData.length);
        } ;           
        
        loadData();

    }, []);   
  

    const columns = [
        { title: '#', dataIndex: 'rowId', key: 'rowId' },
        { title: 'Domain', dataIndex: 'domain', key: 'name'},
        { title: 'Cath ID', dataIndex: 'cathpdb', key: 'cathpdb'},        
        { title: 'PDB ID', dataIndex: 'pdb', key: 'pdb'},
        { title: 'Uniprot_acc', dataIndex: 'uniprot_acc', key: 'uni1'},
        { title: 'Uniprot ID', dataIndex: 'uniprot_id', key: 'uni2'},
        { title: 'Atom number', dataIndex: 'atom_number', key: 'an', 
            sorter: (a:any, b:any) => a.atom_number - b.atom_number,
        },             
    ];
    // Usage
//   const columns = [
//     { title: 'A', dataIndex: 'key', width: 150,
//       filters: [{
//             text: '% 10000 == 0',
//             value: 'notUsed',
//         },     
//         ],
//     onFilter: (_:any, record:any) => record.key % 10000 == 0, 
//     },
//     {
//         title: 'B',
//         dataIndex: 'key',
//         width: 150,
//         // defaultSortOrder: 'descend',
//         sorter: (a:any, b:any) => a.key - b.key,
//       },

//     { title: 'C', dataIndex: 'key' },
//     { title: 'D', dataIndex: 'key' },
//     { title: 'E', dataIndex: 'key', width: 200 },
//     { title: 'F', dataIndex: 'key', width: 100 },
//   ];
  
    const { Option } = Select;

    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={"Peripheral Protein Protrusion DataSet"}
            />
            <Row>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Protein structures" value={6084} /> </Col>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Protein domains" value={10} /> </Col>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Download dataset" value={"156 MB"} /> </Col>
            </Row>

            <Row className="my-4">              
                <Col md={2}>
                    Domain: &nbsp;
                    <Select defaultValue="PH" style={{ width: 80 }} >
                        <Option value="C1">C1</Option>
                        <Option value="C2">C2</Option>
                        <Option value="C2DIS" > C2DIS</Option>
                        <Option value="ENTH">ENTH</Option>
                    </Select>
                </Col>
                <Col md={3}>
                    Data source: &nbsp;
                    <Select defaultValue="CATH" style={{ width: 90 }} >
                        <Option value="alphafold">AlphaFold</Option>
                    </Select>
                </Col>               
            </Row>
            
            
            <Row className="my-4">
                <Col>
                    <VirtualTable title={() => `${tableLength} Rows`} columns={columns} dataSource={tableData} scroll={{ y: 400, x: '100vw' }} />
                </Col>
            </Row>

        </Container>
    )
}