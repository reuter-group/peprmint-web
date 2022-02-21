import { Button, Card, Input, message, Popconfirm, Popover, Radio, Select, Space, Statistic, Table, Tooltip, Upload } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row, Button as BButton, Accordion, Card as BCard } from "react-bootstrap";
import { BarChartOutlined, CheckCircleTwoTone, DownloadOutlined, PieChartOutlined, QuestionCircleOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { PageHeader, PageHeaders, RES_COLORS, COLORS20 } from "./Utils";
import Papa from "papaparse";
import { validCathId, validPdbID } from "../helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { LOW_DENSITY_THRESHOLD } from "../molstar";
import * as Statistics from "../../datasets/statistics.json";
import { ExportToCsv } from "export-to-csv";

// configurable options
const DOMAINS = (Statistics.domainsList as Array<string>).sort();
const defaultDomain = DOMAINS[1]; // suggest to choose a smallest size domain as default

const RESIDUES = (Statistics.residueList as Array<string>).sort();

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
        return { ...data, key: `${domain}-${i}` }  // add an extra key for identity
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
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
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

function Chart(props: { chartData: Array<{ name: string, value: number }>, chartType: string, chartSize?: string }) {
    const chartWidth = props.chartSize && props.chartSize == 'small' ? 300 : 450;
    const chartHeight = props.chartSize && props.chartSize == 'small' ? 280 : 400;

    const pieChart = (
        <PieChart width={chartWidth} height={chartHeight}>
            <Pie
                dataKey="value"
                isAnimationActive={true}
                data={props.chartData}
                cx={chartWidth * 0.45}
                cy={chartHeight * 0.5}
                outerRadius={chartWidth * 0.22}
                fill="#8884d8"
                label={renderCustomizedLabel}
            >
                {props.chartData.map((data, index: number) => (
                    <Cell key={`cell-${index}`}
                        // primarily use RES_COLOR for residue category data
                        // use COLORS20 for other type of data
                        fill={RES_COLORS.get(data.name) || COLORS20[index]} />
                ))}
            </Pie>
            <RTooltip />
        </PieChart>
    );

    const barChart = (
        <BarChart width={chartWidth} height={chartHeight} data={props.chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <RTooltip />
            <Bar dataKey="value" fill="#8884d8" barSize={chartWidth / props.chartData.length * 0.9} >
                {props.chartData.map((data, index: number) => (
                    <Cell key={`cell-${index}`} fill={RES_COLORS.get(data.name) || COLORS20[index]} />
                ))}
            </Bar>
        </BarChart>
    );
    if (props.chartType == 'pie') { return pieChart }
    else { return barChart }
}


function ChartCard(props: { cardTitle: string, chartData: Array<{ name: string, value: number }>, chartNote?: JSX.Element, chartType?: 'pie' | 'bar', chartSize?: 'small' | 'large' }) {
    const [chartType, setChartType] = useState(props.chartType ? props.chartType : 'pie');
    const col = props.chartSize && props.chartSize == 'small' ? 4 : 6;

    return (
        <Col md={col} className="px-2 my-2">
            <Card title={props.cardTitle}
                extra={
                    <Radio.Group size="small" onChange={e => setChartType(e.target.value)} defaultValue={props.chartType ? props.chartType : 'pie'}>
                        <Radio.Button value="pie"> <PieChartOutlined className="align-middle" /> </Radio.Button>
                        <Radio.Button value="bar"> <BarChartOutlined className="align-middle" /> </Radio.Button>
                    </Radio.Group>
                }
                bordered={false}>
                <Chart chartData={props.chartData} chartType={chartType} chartSize={props.chartSize || 'large'} />
                <p className="text-center"> {props.chartNote} </p>
            </Card>
        </Col>
    )
}

export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [selectedDomains, setSelectedDomains] = useState<any[]>([]);

    const [tableData, setTableData] = useState<any[]>([]);
    const [currentFilters, setCurrentFilters] = useState({});
    const [currentTableData, setCurrentTableData] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const [downloadLongHeaders, setDownloadLongHeaders] = useState(1);

    // for data visusalisation
    const [resCompData, setResCompData] = useState<any[]>([]);
    const [neighborResCompData, setNeighborResCompData] = useState<any[]>([]);

    // For optional data visualization:
    // each data column needs two pairs of variables to control the visualization:
    // take Secondary Structure Visualization as example:
    const [ssVis, setSsVis] = useState(false); 
    // boolean variable `ssVis` controls to show/hide the chart 
    // function `setSsVis` must be used when you want to modify `ssVis`
    const [ssCompData, setSsCompData] = useState<any[]>([]); 
    // Array/list `ssCompData` stores the data (Python dictionary-like) for visualization: [{name: 'C', value:128}, {name:'H', value:52}...]
    // function `setSsCompData` must be used to assign/update `ssCompData`

    const [proDenVis, setProDenVis] = useState(false);
    const [proDenCompData, setProDenCompData] = useState<any[]>([]);

    const [proBloVis, setProBloVis] = useState(false);
    const [proBloCompData, setProBloCompData] = useState<any[]>([]);


    const filterTableData = (data: any[]) => {
        // filter the given data with the user defined filters
        const columnFilters = Object.entries(currentFilters).filter(f => f[1] != null);
        return columnFilters.length == 0
            ? data
            : data.filter(row => {
                let flag = true;
                for (const [colName, filterKeywords] of columnFilters) {
                    flag = flag && row[colName] && (
                        (filterKeywords as string[]).includes(row[colName].toLowerCase()) ||
                        (filterKeywords as string[]).includes(row[colName])
                    );
                }
                return flag
            });
    }


    const addDomainTableData = async (domain: string) => {
        setLoading(true);
        setSelectedDomains(ds => [...ds, domain]);
        const newData = await loadCsvTable(domain);
        setTableData([...tableData, ...newData]);
        setCurrentTableData([...currentTableData, ...filterTableData(newData)]);
        setLoading(false);
    };

    const addAllDomainTableData = async () => {

        setLoading(true);
        setSelectedDomains(DOMAINS);
        const allData = await Promise.all(DOMAINS.map(loadCsvTable))
        const allDataFlatted = allData.flat()
        setTableData(allDataFlatted)
        setCurrentTableData(filterTableData(allDataFlatted))
        setLoading(false);
    }

    const deleteDomainTableData = (domain: string) => {
        if (selectedDomains.includes(domain)) {
            setSelectedDomains(ds => ds.filter(d => d != domain))
            setTableData(tableData.filter(d => d.dm != domain));
            setCurrentTableData(currentTableData.filter(d => d.dm != domain));
        }
    }


    const calculateCompData = (colDataIndex: string, tableData: any) => {
        let compData = new Map<string, number>();
        for (let record of tableData) {
            record[colDataIndex] && compData.set(record[colDataIndex], (compData.get(record[colDataIndex]) || 0) + 1)
        }
        return Array.from(compData, ([k, v]) => ({ name: k, value: v }))
    }

    const groupData = (colDataIndex: string, dataType: 'int' | 'float', tableData: any[], groupCount: number, groupLowBound?: number, groupUpBound?: number) => {
        // scatter a column NUMBERs of the table into `groupCount` groups for data visualization
        // NOTE: `groupCount` no more than 20
        const parseNumber = dataType == 'int' ? parseInt : parseFloat;
        let selectedData = tableData.map(record => record[colDataIndex] && parseNumber(record[colDataIndex]))
            .filter(n => groupLowBound ? n > groupLowBound : n)
            .filter(n => groupUpBound ? n < groupUpBound : n);

        const dataMax = Math.max(...selectedData);
        const dataMin = Math.min(...selectedData);
        const step = Math.ceil((dataMax - dataMin + 1) / groupCount);

        let dataGroups: number[][] = Array.from(Array(groupCount), _ => []);
        for (let n of selectedData) {
            let groupIndex = Math.floor((n - dataMin) / step);
            dataGroups[groupIndex].push(n);
        }

        return dataGroups.map((g, i) => {
            return { name: `${dataMin + i * step}-${dataMin + (i + 1) * step}`, value: g.length }
        })
    }



    useEffect(() => {
        addDomainTableData(defaultDomain); // load default dataset
        // console.log(selectedDomains);
    }, []);


    useEffect(() => {
        // update ResCompData
        setResCompData(calculateCompData('rna', currentTableData));

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

        // for optional data visualtion
        ssVis && setSsCompData(calculateCompData('ss', currentTableData));
        proBloVis && setProBloCompData(calculateCompData('pb', currentTableData));
        proDenVis && setProDenCompData(groupData('den', 'int', currentTableData, 5, LOW_DENSITY_THRESHOLD));

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
            // sorter: (a: any, b: any) => DOMAINS.indexOf(a.dm) - DOMAINS.indexOf(b.dm),
            ...getColumnSearchProps('dm', 'Domain')           
        },
        {
            title: 'PDB ID', dataIndex: 'pdb', width: 55,
            render: (pdbid: any) => validPdbID(pdbid) ? <a href={"https://www.ebi.ac.uk/pdbe/entry/pdb/" + pdbid}> {pdbid} </a> : <>{pdbid}</>,
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
                {
                    title: 'id', dataIndex: 'rnu', width: 45,
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
        <Option value={domain} key={domain}> {domain} </Option>).concat(
            [<Option value='all' key="all">All Domains </Option>]
        )

    const optionalColumnSelections = optionalColumns.map((oc, i) =>
        <Option value={oc.title} key={i}> {oc.title} </Option>)


    function changeTable(pagination: any, filters: any, sorter: any, extra: any) {
        // console.log('change table...', pagination, filters, sorter, extra);
        setCurrentTableData(extra.currentDataSource);
        setCurrentFilters(filters);
    }

    const onSelectDomainSelection = (domain: string) => {
        if (domain == 'all') {
            if (selectedDomains.length < DOMAINS.length) {
                addAllDomainTableData();
            }
        } else {
            addDomainTableData(domain)
        }
    }

    const onDeselectDomainSelection = (domain: string) => {
        deleteDomainTableData(domain)
    }

    const onClearDomainSelection = () => {
        setSelectedDomains([]);
        setTableData([]);
        setCurrentTableData([]);
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
        if (currentTableData.length == 0) {
            message.error('Your selected dataset is empty.');
            return
        }

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
            headers: selectedColumns.map(col => downloadLongHeaders == 1 ? col.title : col.dataIndex) // <-- Won't work with useKeysAsHeaders present!
        };

        const csvExporter = new ExportToCsv(options);
        csvExporter.generateCsv(downloadData);
    }

    const onSelectColumnDataVis = (colName: string) => {
        if (colName == 'ss') {
            setSsCompData(calculateCompData('ss', currentTableData));
            setSsVis(true);
        } else if (colName == 'pb') {
            setProBloCompData(calculateCompData('pb', currentTableData));
            setProBloVis(true);
        } else if (colName = 'den') {
            setProDenCompData(groupData('den', 'int', currentTableData, 5, LOW_DENSITY_THRESHOLD));
            setProDenVis(true);
        }
    }

    const onDeselectColumnDataVis = (colName: string) => {
        if (colName == 'ss') setSsVis(false);
        else if (colName == 'pb') setProBloVis(false);
        else if (colName == 'den') setProDenVis(false);
    }


    const onClearColumnDataVis = () => {
        setSsVis(false);
        setProBloVis(false);
        setProDenVis(false);
    }


    const beforeUpload = (file: File) => {
        const sizeLimit = file.size / 1024 / 1024 < 50; // size limit: 50MB
        if (!sizeLimit) {
            message.error('Dataset file must be smaller than 50MB.');
            return Upload.LIST_IGNORE
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                const tableHeaders = Statistics.tableHeaders as string[];
                const validDataHeaders = Object.keys(results.data[0] as Object).filter(h => tableHeaders.includes(h));
                if (validDataHeaders.length == 0) {
                    message.error(<>No valid data parsed from {file.name} <br /> Please check the format requirement for the data file <a
                        href="https://github.com/reuter-group/peprmint-web/blob/main/web-client/src/datasets/README.md">defined here</a>.</>,
                        4);
                    return
                }

                const dataTemplate = Object.fromEntries(tableHeaders.map(h => [h, ""]))
                let newData = results.data;

                newData.forEach(data => {
                    let tempData = { ...dataTemplate, data } as Object
                    return Object.fromEntries(Object.entries(tempData).filter(([k, v]) => validDataHeaders.includes(k)))
                })
                newData = results.data.map((data: any, i) => {
                    return { ...data, key: `upload-${i}` }  // use a special key to identify the uploaded dataset
                })

                setTableData(td => {
                    const filteredTable = td.filter(d => d.key.slice(0, 7) != 'upload-');
                    return [...filteredTable, ...newData]
                });

                setCurrentTableData(ctd => {
                    const filteredTable = ctd.filter(d => d.key.slice(0, 7) != 'upload-');
                    return [...filteredTable, ...filterTableData(newData)]
                });

                // finish loading dataset
                message.success(`Successfully loaded ${newData.length} rows data from ${file.name}`, 3);
            },
            error: function (error, file) {
                message.error(<>This file {file.name} can not be parsed correctly. Please check if its format is valid as
                    <a href="https://github.com/reuter-group/peprmint-web/blob/main/web-client/src/datasets/README.md">defined here</a>.</>);
            }
        });

        return false; // stop sending HTTP request
    }

    const onRemoveUpload = (file: any) => {
        setTableData(tableData.filter(d => d.key.slice(0, 7) != 'upload-'));
        setCurrentTableData(currentTableData.filter(d => d.key.slice(0, 7) != 'upload-'));
        message.success(`Data from ${file.name} is removed`, 3);
    };


    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={""} //{"Peripheral Protein Protrusion DataSet"}
            />
            <Container className="mb-4 p-3 ">
                <Row className="mb-3 mx-3 justify-content-center">
                    <h5> PePr<sup>2</sup>DS is a dataset of <b> interfacial binding sites</b>(IBS) collected from {Statistics.domainsList.length} protein domains.</h5>
                    <p className="font-weight-light"> (add short description here) The IBS are analyzed using the model for hydrophobic protrusions ...
                        Interfacial binding sites collected: explain how. CATH domains, ….
                    </p>
                </Row>

                <Row className="mb-2 justify-content-center">
                    <Col md={2} className="bg-light mx-4 py-2 border"> <Statistic
                        title={<>Protein structures <Popover placement="topLeft" content={(<> description here... <a className="text-primary" href="https://www.ebi.ac.uk/pdbe/">link example</a> </>)}>
                            <QuestionCircleOutlined className="align-middle" /> </Popover></>}
                        value={Statistics.structures} />
                    </Col>

                    <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic
                        title={<>Protein domains <Popover placement="topLeft" content={Statistics.domainsList.toString()}>
                            <QuestionCircleOutlined className="align-middle" /> </Popover></>}
                        value={Statistics.domainsList.length} />
                    </Col>

                    <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic
                        title="Whole dataset" value="25.9 MB" />
                        <small><a className="text-muted" href={Statistics.downloadLink}>
                            <DownloadOutlined /> download</a> </small></Col>
                </Row>
            </Container>

            <Accordion defaultActiveKey="0">
                <BCard className="border border-primary bg-light rounded-0">
                    <BCard.Header className="bg-secondary border-0">
                        <Accordion.Toggle as="h4" eventKey="0"> Dataset </Accordion.Toggle>
                    </BCard.Header>
                    <Accordion.Collapse eventKey="0">
                        <BCard.Body>
                            <Row className="my-4">
                                <Col md={7}>
                                    1. Select domains: &nbsp;
                                    <Select defaultValue={[defaultDomain]}
                                        value={Array.from(selectedDomains)}
                                        mode="multiple"
                                        allowClear
                                        placeholder="Pre-defined domain dataset"
                                        onSelect={onSelectDomainSelection}
                                        onDeselect={onDeselectDomainSelection}
                                        onClear={onClearDomainSelection}
                                        style={{ width: 450 }}>
                                        {domainSelectOptions}
                                    </Select>
                                </Col>

                                <Col md={4}>
                                    <Upload name="dsFile" accept=".csv" maxCount={1}
                                        beforeUpload={beforeUpload}
                                        onRemove={onRemoveUpload}
                                    >
                                        <Button icon={<UploadOutlined />} className="border-primary" >Load my own dataset (.csv)</Button> &nbsp;
                                        <Popover placement="topLeft" content={<>Optional, <b>one .csv</b> file that meets PePr<sup>2</sup>DS' <a
                                            className="text-primary"
                                            onClick={e => e.stopPropagation()}
                                            href="https://github.com/reuter-group/peprmint-web/blob/main/web-client/src/datasets/README.md">format requirements</a> 
                                            </>}>                                            
                                            <QuestionCircleOutlined className="align-middle" /> </Popover>
                                    </Upload>
                                </Col>                            
                            </Row>

                            <Row className="my-4">
                                <Col md="auto">
                                    2. Select optional data columns: &nbsp;
                                    <Select defaultValue={[]} style={{ width: 630 }}
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
                                    showTotal: (total) => <span> Total <b>{total}</b> rows in the table, </span>,
                                    showQuickJumper: true
                                }}
                                footer={() => <> For details of each column, please <a className="text-primary"
                                    href="https://github.com/reuter-group/peprmint-web/blob/main/web-client/src/datasets/README.md">
                                    check here</a>. </>}
                            />
                            <br />
                            <Row className="justify-content-end">
                                <Popconfirm placement="topRight"                                   
                                    title={<> 
                                        <p><span className="text-muted">Note 1:</span> unselected optional columns will NOT be downloaded.</p>
                                        <p><span className="text-muted">Note 2:</span> choose which <b>table headers</b> to use: </p>
                                        <Radio.Group onChange={e => setDownloadLongHeaders(e.target.value)} value={downloadLongHeaders}>
                                            <Space direction="vertical">
                                                <Radio value={1}>same headers as they are displayed on the table above</Radio>
                                                <Radio value={2}>short headers so that the .csv file can be re-loaded by PePr<sup>2</sup>DS</Radio>
                                            </Space>
                                        </Radio.Group> </>}
                                    onConfirm={onDownloadTableData}
                                    okText="Download"
                                    cancelText="Cancel"
                                >
                                    <BButton type="primary" className="mr-3" >
                                        <DownloadOutlined /> Selected dataset (.csv) </BButton>
                                </Popconfirm>
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
                            Dataset Analyses for Your Selection
                        </Accordion.Toggle>
                    </BCard.Header>
                    <Accordion.Collapse eventKey="1">
                        <BCard.Body>
                            <Row >
                                <ul>
                                    <li> <b>{new Set(currentTableData.map(d => d.pdb)).size}</b> unique PDB IDs, <b>{new Set(currentTableData.map(d => d.cath)).size}</b> unique CATH IDs </li>
                                    <li> <b>{currentTableData.length}</b> residues, including <b>{currentTableData.filter(d => d.hypro && d.hypro.toLowerCase() == 'true' && d.ibs && d.ibs.toLowerCase() == 'true').length}</b> residues
                                        which are both <b>H</b>ydrophobic protrusions and at <b>IBS</b> </li>
                                </ul>
                            </Row>
                            <Row className="my-4 mx-2">
                                {/* two large charts */}

                                {resCompData.length > 0 &&
                                    <ChartCard cardTitle="Residue Composition"
                                        chartData={resCompData}
                                        chartNote={<>Total: <b>{currentTableData.length}</b> residues </>}
                                    />}

                                {neighborResCompData.length > 0 &&
                                    <ChartCard cardTitle="Protrusion Neighbor Residue Composition"
                                        chartData={neighborResCompData}
                                        chartNote={<>Total: <b>{neighborResCompData.reduce((acc, data) => acc + data.value, 0)}</b> neighbor residues</>}
                                    />}
                            </Row>

                            <Row className="mt-5">
                                <ul> <li> Analyses of more columns: &nbsp;
                                    <Select defaultValue={[]} style={{ width: 400 }}
                                        allowClear
                                        mode="multiple"
                                        placeholder="Select columns to visualise"
                                        onSelect={onSelectColumnDataVis}
                                        onDeselect={onDeselectColumnDataVis}
                                        onClear={onClearColumnDataVis}
                                    >
                                        {[ // here you can add more columns to visualize
                                            { name: 'Protein Block', dataIndex: 'pb' },
                                            { name: 'Protein Density', dataIndex: 'den' },
                                            { name: 'Secondary structure', dataIndex: 'ss' },
                                        ].map((col, i) => <Option value={col.dataIndex} key={i}> {col.name} </Option>)
                                        }
                                    </Select>
                                </li>
                                </ul>
                            </Row>
                            <Row className="my-4 mx-2">
                                {proBloVis && currentTableData.length > 0 && <ChartCard cardTitle="Protein Block"
                                    chartData={proBloCompData}
                                    chartSize="small"
                                    chartType="bar"
                                    chartNote={<>Total: <b>{proBloCompData.reduce((acc, data) => acc + data.value, 0)}</b> protein blocks </>}
                                />}

                                {proDenVis && currentTableData.length > 0 && <ChartCard cardTitle="Protein Density"
                                    chartData={proDenCompData}
                                    chartSize="small"
                                    chartType="bar"
                                    chartNote={<>Total: <b>{proDenCompData.reduce((acc, data) => acc + data.value, 0)}</b> residues
                                        (with density &gt; <b>{LOW_DENSITY_THRESHOLD}</b>)
                                    </>}
                                />}

                                {ssVis && currentTableData.length > 0 && <ChartCard cardTitle="Secondary Structure"
                                    chartData={ssCompData}
                                    chartSize="small"
                                    chartNote={<>Total: <b>{ssCompData.reduce((acc, data) => acc + data.value, 0)}</b> secondary structures </>}
                                />}
                            </Row>
                        </BCard.Body>
                    </Accordion.Collapse>
                </BCard>
            </Accordion>
            <br />

        </Container >
    )
}
