
dataset='../../../local/PePr2DS.csv'
domains=('ANNEXIN' 'C1' 'C2' 'C2DIS' 'PH' 'PLA' 'PLD' 'PX' 'START')

# raw header: 
# domain,cathpdb,pdb,uniprot_acc,uniprot_id,residue_name,IBS,chain_id,residue_number,b_factor,sec_struc,sec_struc_full,
# prot_block,data_type,Experimental Method, resolution, RSA_total_freesasa_tien, convhull_vertex,protrusion,
# is_hydrophobic_protrusion,is_co_insertable,neighboursList, density,exposition,S35,S60,S95,S100,
# uniref50,uniref90,uniref100, origin,location,taxon

new_header='dm,cath,pdb,uacc,uid,rna,ibs,chain,rnu,bf,ss,ssf,pb,dt,em,rsl,rsa,cv,pro,hypro,coin,nbl,den,expo,s35,s60,s95,s100,u50,u90,u100,origin,loc,taxon'


# replace typos: 
sed s/alfafold/alphafold/g $dataset > ${dataset}_new
sed -i '' s/exposed/True/g ${dataset}_new
sed -i '' s/buried/False/g ${dataset}_new

# split dataset by domains
for domain in "${domains[@]}"; do
    echo "${new_header}" > domain_${domain}.csv
    grep "^${domain}," ${dataset}_new >> domain_${domain}.csv
done