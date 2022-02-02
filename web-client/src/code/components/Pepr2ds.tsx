import { Button, Card, Input, Radio, Select, Space, Statistic, Table, Tooltip } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row, Button as BButton, Accordion, Card as BCard } from "react-bootstrap";
import { BarChartOutlined, CheckCircleTwoTone, DownloadOutlined, PieChartOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, RES_COLORS, COLORS20 } from "./Utils";
import Papa from "papaparse";
import { validCathId, validPdbID } from "../helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

import * as Statistics from "../../datasets/statistics.json";
import { ExportToCsv } from "export-to-csv";

// configurable options
const DOMAINS = (Statistics.domainsList as Array<string>).sort();
const defaultDomain = DOMAINS[1]; // suggest to choose a smallest size domain as default

const RESIDUES = (Statistics.residueList as Array<string>).sort();

// const DATA_SOURCES = ['CATH', 'AlphaFold'];
// const ExperimentalMethod = Statistics.experimentalMethod;

// import all csv files under datasets/
function importAllDatasets(r: __WebpackModuleApi.RequireContext) {
    let datasets: any = {};
    r.keys().map((fileName: string) => { datasets[fileName] = r(fileName).default; });
    return datasets;
}

const DATASET_IMPORTS = importAllDatasets(require.context('../../datasets/', true, /\.csv$/));
const csvUrl = (domain: string) => DATASET_IMPORTS[`./domain_${domain.toUpperCase()}.csv`];


const loadCsvTable = async (domain: string) => {
    const csvData = await fetch(csvUrl(domain)).then(res => res.text());
    const table = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`loaded ${table.data.length} rows data`);
    return table.data.map((data: any, i) => {
        return { ...data, key: `${domain}-${i}` }  // add an extra key column
    });
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    fill,
    value,
    name
}: any) => {
    //   console.log(cx, cy, midAngle, innerRadius, percent, value, name);
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill={fill}
            textAnchor={x > cx ? "start" : "end"}
        >
            {`${name}: ${(percent * 100).toFixed(1)}%`}
        </text>
    );
};

function Chart(props: { chartData: Array<{ name: string, value: number }>, chartType: string }) {
    const pieChart = (
        <PieChart width={450} height={400}>
            <Pie
                dataKey="value"
                isAnimationActive={true}
                data={props.chartData}
                cx={220}
                cy={200}
                outerRadius={120}
                fill="#8884d8"
                label={renderCustomizedLabel}
            >
                {props.chartData.map((data, index: number) => (
                    <Cell key={`cell-${index}`} fill={RES_COLORS.get(data.name)} />
                ))}
            </Pie>
            <RTooltip />
        </PieChart>
    );

    const barChart = (
        <BarChart width={450} height={400} data={props.chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <RTooltip />
            <Bar dataKey="value" fill="#8884d8" barSize={20} >
                {props.chartData.map((_, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS20[index]} />
                ))}
            </Bar>
        </BarChart>
    );
    if (props.chartType == 'pie') { return pieChart }
    else { return barChart }
}


export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

    const [tableData, setTableData] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState({});
    const [currentTableData, setCurrentTableData] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [resCompData, setResCompData] = useState<any[]>([]);
    const [neighborResCompData, setNeighborResCompData] = useState<any[]>([]);
    const [resCompChartType, setResCompChartType] = useState('pie');
    const [neighborResCompChartType, setNeighborResCompChartType] = useState('pie');


    const filterTableData = (data: any[]) => {
        // filter the given data with the user defined filters
        const columnFilters = Object.entries(currentFilters).filter(f => f[1] != null);

        return columnFilters.length == 0
            ? data
            : data.filter(row => {
                let flag = true;
                for (const [colName, filterKeywords] of columnFilters) {
                    for (const keyword of filterKeywords as Array<string>) {
                        flag &&= (row[colName]!).includes(keyword)
                    }
                }
                return flag
            });
    }


    const addDomainTableData = async (domain: string) => {
        setLoading(true);
        setSelectedDomains(ds => new Set(ds.add(domain)));
        const newData = await loadCsvTable(domain);
        setTableData([...tableData, ...newData]);

        setCurrentTableData([...currentTableData, ...filterTableData(newData)]);

        setLoading(false);
    };


    const deleteDomainTableData = (domain: string) => {
        if (selectedDomains.has(domain))
            setSelectedDomains(ds => {
                const s = ds.delete(domain);
                return new Set(ds)
            })

        setTableData(tableData.filter(d => d.dm != domain));

        setCurrentTableData(currentTableData.filter(d => d.dm != domain));
    }


    useEffect(() => {
        addDomainTableData(defaultDomain); // load default dataset
        // console.log(selectedDomains);
    }, []);


    useEffect(() => {
        // update ResCompData
        let resComp = new Map<string, number>(RESIDUES.map(r => [r, 0]));
        for (let record of currentTableData) {
            resComp.set(record.rna, (resComp.get(record.rna) || 0) + 1)
        }
        setResCompData(Array.from(resComp, ([k, v]) => ({ name: k, value: v })).filter((e: any) => e.value != 0));

        // update neighborResCompData
        let neighborResComp = new Map<string, number>(RESIDUES.map(r => [r, 0]));
        for (let record of currentTableData) {
            if (record.nbl) {
                const neighbors = record.nbl.split(';');
                const neighborResNames = neighbors.map((n: string) => n.split('-')[0]);
                for (let resName of neighborResNames) {
                    neighborResComp.set(resName, (neighborResComp.get(resName) || 0) + 1);
                }
            }
        }
        setNeighborResCompData(Array.from(neighborResComp, ([k, v]) => ({ name: k, value: v })).filter((e: any) => e.value != 0));

    }, [currentTableData])


    const trueFalseRender = (b: any) => (b && b.toLowerCase() == 'true')
        ? <CheckCircleTwoTone twoToneColor="#52c41a" />
        : <> - </>

    const trueFalseFilter = [{ text: 'True', value: 'true' }, { text: 'False', value: 'false' }];

    const getColumnSearchProps = (dataIndex: string, columnTitle: string) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
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

        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,

        onFilter: (value: any, record: any) =>
            record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                : '',
    });


    const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters: any) => {
        clearFilters();
        setSearchText('');
    };

    const defaultColumns = [
        // NOTE: dataIndex must be the same as the headers in CSV table
        // { title: '#', dataIndex: 'key', width: 70, },
        {
            title: 'Domain', dataIndex: 'dm', width: 70,
            sorter: (a: any, b: any) => DOMAINS.indexOf(a.dm) - DOMAINS.indexOf(b.dm),
            // sortDirections: ['descend'],
            // filters: DOMAINS.map(domain => { return { text: domain, value: domain.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.domain.toLowerCase().includes(value)
        },
        {
            title: 'PDB ID', dataIndex: 'pdb', width: 55,
            render: (pdbid: any) => validPdbID(pdbid) ? <Link to={"/pepr2vis/" + pdbid}> {pdbid} </Link> : <>{pdbid}</>,
            ...getColumnSearchProps('pdb', 'PDB ID')
        },
        {
            title: 'CATH ID', dataIndex: 'cath', width: 65, render: (cathId: any) =>
                validCathId(cathId) ? <Link to={"/pepr2vis/" + cathId}> {cathId} </Link> : <>{cathId}</>,
            ...getColumnSearchProps('cath', 'CATH ID')
        },
        { title: 'Chain', dataIndex: 'chain', width: 60, ...getColumnSearchProps('chain', 'Chain') },
        {
            title: 'Residue info',
            children: [
                {
                    title: 'name', dataIndex: 'rna', width: 65,
                    filters: RESIDUES.map(r => { return { text: r, value: r } }),
                    onFilter: (value: any, record: any) => record.rna.includes(value)
                },
                { title: 'id', dataIndex: 'rnu', width: 45, 
                    sorter: (a: any, b: any) => a.rnu - b.rnu,
                },
            ]
        },
        {
            title: <Tooltip title={<><b className="text-primary">I</b>nterfacial <b className="text-primary">B</b>inding <b className="text-primary">S</b>ite</>}>IBS</Tooltip>, dataIndex: 'ibs', width: 50, render: trueFalseRender, filters: trueFalseFilter,
            onFilter: (value: any, record: any) => record.ibs && record.ibs.toLowerCase().includes(value)
        },

        {
            title: 'Protrusion info',
            children: [
                {
                    title: <Tooltip title={<span>convex hull <b className="text-primary">V</b>ertex</span>}>V</Tooltip>,
                    dataIndex: 'cv', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.cv && record.cv.toLowerCase().includes(value)
                },

                {
                    title: <Tooltip title={<span><b className="text-primary">P</b>rotrusion</span>}>P</Tooltip>,
                    dataIndex: 'pro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.pro && record.pro.toLowerCase().includes(value)
                },

                {
                    title: <Tooltip title={<span><b className="text-primary">H</b>ydrophobic protrusion</span>}>H</Tooltip>,
                    dataIndex: 'hypro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.hypro && record.hypro.toLowerCase().includes(value)
                },

                {
                    title: <Tooltip title={<span><b className="text-primary">C</b>o-insertable</span>}>C</Tooltip>,
                    dataIndex: 'coin', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.coin && record.coin.toLowerCase().includes(value)
                },
                {
                    title: <Tooltip title={<span>whether residue is <b className="text-primary">E</b>xposed (RSA &gt; 20%) or not (RSA &lt;= 20%)</span>}>E</Tooltip>,
                    dataIndex: 'expo', width: 40,
                    render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.expo && record.expo.toLowerCase().includes(value)
                },
                { title: <Tooltip title={<span>protein <b className="text-primary">D</b>ensity</span>}>D</Tooltip>, dataIndex: 'den', width: 40, render: (v: string) => v && parseInt(v) > 0 ? v : <>-</> },
                {
                    title: 'neighbor residue list', dataIndex: 'nbl', width: 120,
                    ellipsis: { showTitle: false, },
                    render: (nbl: string) => ( // customize the tooltip
                        <Tooltip placement="topLeft" title={nbl.replace(/;/g, ' ')}> {nbl} </Tooltip>
                    ),
                }
            ]
        },

    ];

    const optionalColumns = [
        { title: 'Bfactor', dataIndex: 'bf', width: 80 },

        {
            title: 'CATH cluster id', children: [
                { title: <small> S35 </small>, dataIndex: 's35', width: 40, },
                { title: <small> S60 </small>, dataIndex: 's60', width: 40, },
                { title: <small> S95 </small>, dataIndex: 's95', width: 60, },
                { title: <small> S100 </small>, dataIndex: 's100', width: 70, },]
        },

        {
            title: 'Data source', dataIndex: 'dt', width: 110,
            // filters: ['CathPDB', 'AlphaFold'].map(ds => { return { text: ds, value: ds.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.dt.includes(value.toLowerCase())
        },

        { title: 'Experimental method', dataIndex: 'em', width: 110, ellipsis: true },
        { title: 'NMR resolution', dataIndex: 'rsl', width: 90 },

        {
            title: 'Secondary structure', dataIndex: 'ss', width: 70,
            filters: ['H', 'E', 'C'].map(ss => { return { text: ss, value: ss } }),
            onFilter: (value: any, record: any) => record.ss.includes(value)
        },

        {
            title: 'Uniprot accession', dataIndex: 'uacc', width: 100, render: (uacc: any) =>
                uacc ? <a href={"https://www.uniprot.org/uniprot/" + uacc}> {uacc} </a> : <>{uacc}</>
        },
        { title: 'Uniprot ID', dataIndex: 'uid', width: 120 },

        {
            title: 'Uniprot cluster id', children: [
                { title: <small> uref50 </small>, dataIndex: 'u50', width: 80, },
                { title: <small> uref90 </small>, dataIndex: 'u90', width: 80, },
                { title: <small> uref100 </small>, dataIndex: 'u100', width: 80, }
            ]
        },
        { title: 'RSA total freesasa tien', dataIndex: 'rsa', width: 80, ellipsis: true, },
        { title: 'Protein Block', dataIndex: 'pb', width: 70 },
        { title: 'Origin', dataIndex: 'origin', width: 80 },
        { title: 'Location', dataIndex: 'loc', width: 100, ellipsis: true },
        { title: 'Taxon', dataIndex: 'taxon', width: 100, ellipsis: true }
    ];


    const [columns, setColumns] = useState<any[]>(defaultColumns);


    const { Option } = Select;

    const domainSelectOptions = DOMAINS.map(domain =>
        <Option value={domain} key={domain}> {domain} </Option>)

    const optionalColumnSelections = optionalColumns.map((oc, i) =>
        <Option value={oc.title} key={i}> {oc.title} </Option>)


    function changeTable(pagination: any, filters: any, sorter: any, extra: any) {
        // console.log('change table...', pagination, filters, sorter, extra);
        setCurrentTableData(extra.currentDataSource);
        setCurrentFilters(filters);
    }

    const changeDomainSelections = (domains: string[]) => {
        if (domains.length >= selectedDomains.size) {
            // console.log('adding...', domains.filter(d => !selectedDomains.has(d)))
            domains.filter(d => !selectedDomains.has(d)).map(addDomainTableData)
        } else {
            selectedDomains.forEach(d => {
                if (!domains.includes(d)) deleteDomainTableData(d);
            })
        }

    }

    const changeColumnSelections = (selectedColumns: string[]) => {
        const selectedOptionalColumns = selectedColumns.map((sc: string) => optionalColumns.find(oc => oc.title == sc));
        setColumns([...defaultColumns, ...selectedOptionalColumns]);
    }


    const tableHeaderTooltipMap = (dataIndex: string) => {
        // for table headers with a customized Tooltip
        switch (dataIndex) {
            case "ibs": return "IBS"
            case "cv": return "V"
            case "pro": return "P"
            case "hypro": return "H"
            case "coin": return "C"
            case "expo": return "E"
            case "den": return "D"
            default: return dataIndex
        }
    }


    const onDownloadTableData = () => {
        // download the user selected (not the complete) table data 
        let selectedColumns: { title: string, dataIndex: string }[] = [];
        for (let col of columns) {
            if (col.children) {
                selectedColumns = [...selectedColumns, ...col.children.map((child: { title: any; dataIndex: any; }) =>
                    typeof (child.title) == "string"
                        ? { title: child.title, dataIndex: child.dataIndex }
                        : { title: tableHeaderTooltipMap(child.dataIndex), dataIndex: child.dataIndex }
                )];
            } else {
                typeof (col.title) == "string"
                    ? selectedColumns.push({ title: col.title, dataIndex: col.dataIndex })
                    : selectedColumns.push({ title: tableHeaderTooltipMap(col.dataIndex), dataIndex: col.dataIndex })
            }
        }

        const downloadData = currentTableData.map(row =>
            Object.assign({}, selectedColumns.map(col => row[col.dataIndex]))
        )

        const options = {
            filename: 'Dataset_PePr2DS',
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true,
            showTitle: false,
            useTextFile: false,
            useBom: true,
            // useKeysAsHeaders: true,
            headers: selectedColumns.map(col => col.title) // <-- Won't work with useKeysAsHeaders present!
        };

        const csvExporter = new ExportToCsv(options);
        csvExporter.generateCsv(downloadData);
    }

    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={"Peripheral Protein Protrusion DataSet"}
            />
            <Row className="mb-5">
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein structures" value={Statistics.structures} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein domains" value={Statistics.domainsList.length} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" >
                    <Statistic title="Complete dataset" value="25.9 MB" />
                    <small><a className="text-muted" href={Statistics.downloadLink}>
                        <DownloadOutlined /> download</a> </small></Col>
            </Row>

            <Accordion defaultActiveKey="0">
                <BCard className="border border-primary bg-light rounded-0">
                    <BCard.Header className="bg-secondary border-0">
                        <Accordion.Toggle as="h4" eventKey="0"> Dataset </Accordion.Toggle>
                    </BCard.Header>
                    <Accordion.Collapse eventKey="0">
                        <BCard.Body>
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
                                <Col md={7}>
                                    Optional columns: &nbsp;
                                    <Select defaultValue={[]} style={{ width: 400 }}
                                        allowClear
                                        mode="multiple"
                                        placeholder="Select columns to display"
                                        onChange={changeColumnSelections}>
                                        {optionalColumnSelections}
                                    </Select>
                                </Col>
                            </Row>

                            <Table bordered
                                tableLayout="fixed"
                                loading={loading}
                                // title={tableTitle}
                                columns={columns}
                                dataSource={tableData}
                                onChange={changeTable}
                                scroll={{ y: 450 }}
                                size="small"
                                pagination={{
                                    defaultPageSize: 50,
                                    position: ['topCenter'],
                                    showTotal: (total) => <span> Total <b>{total}</b> items, </span>,
                                    showQuickJumper: true
                                }}
                                footer={() => <> For details of each column, please <a className="text-primary"
                                    href="https://github.com/reuter-group/peprmint-web/blob/main/web-client/src/datasets/README.md">
                                    check here</a>. </>}
                            />
                            <br />
                            <Row className="justify-content-end">
                                <BButton type="primary" className="mr-3" onClick={onDownloadTableData}> Download (.csv) </BButton>
                            </Row>
                        </BCard.Body>
                    </Accordion.Collapse>
                </BCard>
            </Accordion>

            <br /> <br />

            <Accordion defaultActiveKey="1">
                <BCard className="border border-primary bg-light rounded-0">
                    <BCard.Header className="bg-secondary border-0">
                        <Accordion.Toggle as="h4" eventKey="1">
                            Dataset Analyses
                        </Accordion.Toggle>
                    </BCard.Header>
                    <Accordion.Collapse eventKey="1">
                        <BCard.Body>
                            <Row className="mx-4"> For your selected dataset above, there are in total: </Row>
                            <Row className="mx-4"> 
                                <ul> 
                                    <li> <b>{new Set(currentTableData.map(d=>d.pdb)).size}</b> unique PDB IDs, <b>{new Set(currentTableData.map(d=>d.cath)).size}</b> unique CATH IDs </li>
                                    <li> <b>{currentTableData.length}</b> residues </li>
                                    <li> <b>{currentTableData.filter(d => d.hypro && d.hypro.toLowerCase() == 'true' && d.ibs && d.ibs.toLowerCase() == 'true').length}</b> residues
                                        which are both <b className="text-primary">H</b>ydrophobic protrusions and at <b className="text-primary">IBS</b> </li>
                                </ul>
                            </Row>
                            <Row className="my-4 mx-2">
                                <Col md={6} className="px-2 ">
                                    <Card title={<h5 > Residue Composition </h5>}
                                        extra={
                                            <Radio.Group size="small" onChange={e => setResCompChartType(e.target.value)} defaultValue="pie">
                                                <Radio.Button value="pie"> <PieChartOutlined className="align-middle" /> </Radio.Button>
                                                <Radio.Button value="bar"> <BarChartOutlined className="align-middle" /> </Radio.Button>
                                            </Radio.Group>
                                        }
                                        bordered={false}>
                                        <Chart chartData={resCompData} chartType={resCompChartType} />
                                        <p className="text-center"> Total: <b>{currentTableData.length}</b> residues </p>
                                    </Card>
                                </Col>

                                <Col md={6} className="px-2 ">
                                    <Card title={<h5>Protrusion Neighbor Residue Composition</h5>}
                                        extra={
                                            <Radio.Group size="small" onChange={e => setNeighborResCompChartType(e.target.value)} defaultValue="pie">
                                                <Radio.Button value="pie"> <PieChartOutlined className="align-middle" /> </Radio.Button>
                                                <Radio.Button value="bar"> <BarChartOutlined className="align-middle" /> </Radio.Button>
                                            </Radio.Group>
                                        }
                                        bordered={false}>
                                        <Chart chartData={neighborResCompData} chartType={neighborResCompChartType} />
                                        <p className="text-center"> Total: <b>{neighborResCompData.reduce((acc, data) => acc + data.value, 0)}</b> residues </p>

                                    </Card>
                                </Col>
                            </Row>
                        </BCard.Body>
                    </Accordion.Collapse>
                </BCard>
            </Accordion>
            <br/>

        </Container >
    )
}
