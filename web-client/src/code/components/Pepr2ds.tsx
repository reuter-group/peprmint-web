import { Button, Input, Select, Space, Statistic, Table } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { CheckCircleTwoTone, DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, VirtualTable } from "./Utils";
import Papa from "papaparse";
import { validCathId, validPdbID } from "../helpers";

// configurable options
export const DOMAINS = ['ANNEXIN', 'C1', 'C2', 'C2DIS', 'PH', 'PLA', 'PLD', 'PX', 'START'];
const defaultDomain = DOMAINS[1] ; // C1

export const DATA_SOURCES = ['CATH', 'AlphaFold'];
export const ExperimentalMethod = ['X-ray diffraction', 'Solution NMR', 'AFmodel', 'unknown']
export const RESIDUES = ['ALA','ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL']; 

// import all csv files under datasets/
function importAllDatasets(r: __WebpackModuleApi.RequireContext) {
    let datasets: any = {};
    r.keys().map((fileName: string) => { datasets[fileName] = r(fileName).default; });
    return datasets;
}

const DATASET_IMPORTS = importAllDatasets(require.context('../../datasets/', true, /\.csv$/));
const csvUrl = (domain:string) => DATASET_IMPORTS[`./domain_${domain.toUpperCase()}.csv`];


const loadCsvTable = async (domain:string) => {
    const csvData = await fetch(csvUrl(domain)).then(res => res.text());
    const table = Papa.parse(csvData, { header: true, skipEmptyLines: true});
    console.log(`loaded ${table.data.length} row data`); 
    return table.data.map((data: any, i) => {
        return { ...data, key: `${domain}-${i}` }
    });
} 

let selectedDomains = new Set<string>();

export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const addDomainTableData = async (domain:string) => {        
        setLoading(true);   
        selectedDomains.add(domain);
        const newData = await loadCsvTable(domain);
        setTableData([...tableData, ...newData]);
        setLoading(false);
    };
    
    const deleteDomainTableData = (domain:string) => {
        console.log('deleting..',domain, tableData.filter(d => d.dm != domain ).length)
        if(selectedDomains.has(domain)) selectedDomains.delete(domain);
        setTableData(tableData.filter(d => d.dm != domain ));
    }

    useEffect(() => {         
        addDomainTableData(defaultDomain); // load default dataset     
        console.log(selectedDomains)  
    }, []);


    const trueFalseRender = (b: any) => (b && b.toLowerCase() == 'true')
        ? <CheckCircleTwoTone twoToneColor="#52c41a" />
        : <> - </>

    const trueFalseFilter = [{ text: 'True', value: 'true' }, { text: 'False', value: 'false' }];

    const getColumnSearchProps = (dataIndex:string, columnTitle:string) => ({        
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }:any) => (
            <div style={{ padding: 8 }}>
            <Input              
                placeholder={`Search ${columnTitle}`}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
                <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
                >
                Search
                </Button>
                <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                Reset
                </Button>                 
            </Space>
            </div>
        ),
        
        filterIcon: (filtered:boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            
        onFilter: (value:any, record:any) =>
            record[dataIndex]
            ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
            : '',      
     });


    const handleSearch = (selectedKeys:any, confirm:any, dataIndex:any) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
      };
    
    const handleReset = (clearFilters:any) => {
        clearFilters();
        setSearchText('');
      };

    const columns = [
        // NOTE: dataIndex must be the same as the headers in CSV table
        // { title: '#', dataIndex: 'key', width: 70, },
        {
            title: 'Domain', dataIndex: 'dm', width: 70,
            sorter: (a: any, b: any) => DOMAINS.indexOf(a.dm) - DOMAINS.indexOf(b.dm),
            // sortDirections: ['descend'],
            // filters: DOMAINS.map(domain => { return { text: domain, value: domain.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.domain.toLowerCase().includes(value)
        },
        { title: 'PDB ID', dataIndex: 'pdb', width: 60, 
            render: (pdbid:any) => validPdbID(pdbid)? <Link to= {"/pepr2vis/" + pdbid }> {pdbid} </Link> : <>{pdbid}</>,
            ... getColumnSearchProps('pdb', 'PDB ID')
        },
        { title: 'CATH ID', dataIndex: 'cath', width: 80, render: (cathId:any) => 
            validCathId(cathId)?<Link to= {"/pepr2vis/" + cathId }> {cathId} </Link> : <>{cathId}</>,
            ... getColumnSearchProps('cath', 'CATH ID')
        },     
        {
            title: 'Atom number', dataIndex: 'anu', width: 75,
            sorter: (a: any, b: any) => a.anu - b.anu,
        },
        { title: 'Chain', dataIndex: 'chain', width: 70, ... getColumnSearchProps('chain', 'Chain')},
        {
            title: 'Residue',
            children: [
                { title: <span className="font-weight-light"> name </span>, dataIndex: 'rna', width: 70, key: 'resname',
                    filters: RESIDUES.map(r => { return { text: r, value: r} }),
                    onFilter: (value: any, record: any) => record.rna.includes(value) 
                },
                { title: <span className="font-weight-light"> id </span>, dataIndex: 'rnu', width: 60, key: 'resnum' },
            ]
        },
        // { title: 'Atom name', dataIndex: 'atom_name', width:}, 
        {
            title: 'IBS', dataIndex: 'ibs', width: 50, render: trueFalseRender, filters: trueFalseFilter,
            onFilter: (value: any, record: any) => record.ibs && record.ibs.toLowerCase().includes(value)
        },

        {
            title: 'Protrusion information *',
            children: [
                {
                    title: 'V', dataIndex: 'cv', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.cv && record.cv.toLowerCase().includes(value)
                },

                {
                    title: 'P', dataIndex: 'pro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.pro && record.pro.toLowerCase().includes(value)
                },

                {
                    title: 'H', dataIndex: 'hypro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.hypro && record.hypro.toLowerCase().includes(value)
                },

                {
                    title: 'C', dataIndex: 'coin', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.coin && record.coin.toLowerCase().includes(value)
                },
                {
                    title: 'E', dataIndex: 'expo', width: 40, 
                    render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.expo && record.expo.toLowerCase().includes(value)
                },
                {
                    title: 'neighboursID', dataIndex: 'nbl', width: 120
                }
            ]
        },
        { title: 'SS*', dataIndex: 'ss', width: 55, 
            filters: ['H', 'E', 'C'].map(ss => { return { text: ss, value: ss } }),
            onFilter: (value: any, record: any) => record.ss.includes(value)
        },        
        { title: 'Uniprot_acc', dataIndex: 'uacc', width: 100, render: (uacc:any) => 
            uacc? <a href= {"https://www.uniprot.org/uniprot/" + uacc }> {uacc} </a> : <>{uacc}</>},
        // { title: 'Uniprot ID', dataIndex: 'uid', width: 110, },
        // { title: 'Data source', dataIndex: 'dt', width: 110,  
        //     filters: ['CathPDB', 'AlphaFold'].map(ds => { return { text: ds, value: ds.toLowerCase() } }),
        //     onFilter: (value: any, record: any) => record.dt.includes(value.toLowerCase())
        // },
      
        { title: 'CATH cluster id', children: [ 
            { title: <span className="font-weight-light"> S95 </span>,  dataIndex: 's95', width: 60,},
            { title: <span className="font-weight-light"> S100 </span> , dataIndex: 's100', width: 70,},]
        },

        { title: 'Uniprot cluster id', children: [ 
            { title: <span className="font-weight-light"> uref90 </span>, dataIndex: 'u90', width: 80,},
            { title: <span className="font-weight-light"> uref100 </span>, dataIndex: 'u100', width: 80,}
         ]
        },

        // { title: 'Experimental Method', dataIndex: 'em', width: 110},
    ];


    const { Option } = Select;

    const domainSelectOptions = DOMAINS.map(domain =>
        <Option value={domain} key={domain}> {domain} </Option>)

    // const dataSourceOptions = DATA_SOURCES.map(ds =>
    //     <Option value={ds} key={ds}> {ds} </Option>)

    // const experimentalMethodOptions = ExperimentalMethod.map(em =>
    //     <Option value={em} key={em}> {em} </Option>)


    function changeTable(pagination: any, filters: any, sorter: any, extra: any) {
        console.log('change table...', pagination, filters, sorter, extra);
      }

    const changeDomainSelections = (domains:string[]) => {
        console.log(`selected ${domains}`, selectedDomains);

        if(domains.length >= selectedDomains.size) {
            console.log('adding...', domains.filter(d => !selectedDomains.has(d)))
            domains.filter(d => !selectedDomains.has(d)).map(addDomainTableData) 
        }else{
            selectedDomains.forEach(d => {
                if(!domains.includes(d)) deleteDomainTableData(d);
            })
        } 
       
    }


    // const changeDataSourceSelections = (dataSource:string) => {        
    //     if(dataSource == 'AlphaFold') setTableData(tableData.filter(d => d.dt == 'alphafold' ));  
    //     if(dataSource == 'CATH') setTableData(tableData.filter(d => d.dt == 'cathpdb' ));              
    // }

    // const changeExperimentalMethodSelections = (em:string) => {       
    //     setTableData(tableData.filter(d => d.em == em ));                      
    // }

    // const tableTitle = () => { 
    //     let domainLengthRender = [];
    //     for (let d of DOMAINS) { 
    //         const domainLength = tableData.filter(r=>r.dm == d).length;
    //         if(domainLength >0 ) domainLengthRender.push(
    //             <span key={d} className="text-muted"> <b>{d} </b> {domainLength}; </span>)  
    //     }     
    //     const prefix = domainLengthRender.length > 0 ? <span>, including </span> : <> </>
    //     return <span>Loaded <b>{tableData.length} </b> rows {prefix} {domainLengthRender}</span>
    // } 
                    
    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={"Peripheral Protein Protrusion DataSet"}
            />
            <Row className="mb-5">
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein structures" value={6084} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein domains" value={DOMAINS.length} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" > 
                    <Statistic title="Complete dataset" value="156 MB" /> 
                        <small><a className="text-muted" href="https://github.com/reuter-group/pepr2ds/blob/main/Ressources/datasets/PePr2DS.csv">
                        <DownloadOutlined /> download</a> </small></Col>
            </Row>

            <Row className="my-4">
                <Col md={5}>
                    Domains: &nbsp;
                    <Select defaultValue={[defaultDomain]} 
                        mode="multiple"
                        allowClear
                        placeholder="Select domains"
                        onChange={changeDomainSelections}
                        style={{ width: 350 }}>
                        {domainSelectOptions}
                    </Select>
                </Col>
                {/* <Col md={3}>
                    Data source: &nbsp;
                    <Select defaultValue={DATA_SOURCES[0]} style={{ width: 120 }} 
                        allowClear
                        onChange={changeDataSourceSelections}>
                        {dataSourceOptions}
                        
                    </Select>
                </Col>  */}
                {/* <Col md={4}>
                    Experimental method: &nbsp;
                    <Select defaultValue={ExperimentalMethod[0]} style={{ width: 160 }} 
                        allowClear
                        // mode="multiple"
                        onChange={changeExperimentalMethodSelections}>
                        {experimentalMethodOptions}                        
                    </Select>
                </Col> */}
            </Row>


            <Row className="my-4">
                <Col>
                    <Table bordered
                        loading={loading}
                        // title={tableTitle}
                        columns={columns}
                        dataSource={tableData}
                        onChange={changeTable}
                        scroll={{ y: 600, x: '100vw' }}
                        size="small"
                        pagination={{ pageSize: 100, 
                                      position: ['topLeft'], 
                                      showTotal: (total)=> <span> Total <b>{total}</b> items, </span>, 
                                      showQuickJumper: true  }}
                        footer={() => <span> <b>V</b>: convex hull vertex; <b>P</b>: protrusion; <b>H</b>: hydrophobic protrusion; <b>C</b>: co-insertable H; <b>E</b>: {"if Residue is exposed (RSA > 20%) or not (RSA <= 20%)"}<br/> 
                                        <b>SS</b>: secondary structure </span> }
                    />
                </Col>
            </Row>

        </Container>
    )
}
