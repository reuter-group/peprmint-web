### Dataset Notes:
1. This folder contains the raw dataset for serving the website **PePr2DS**
- `PePr2DS.csv`([source data](https://github.com/reuter-group/pepr2ds/blob/main/Ressources/datasets/PePr2DS.csv)): the complete dataset 
    - `domain_<domain>.csv`: generated from the complete dataset by running `dataset_preprocess.sh`
- `4ekuA03.csv` and `CB.csv`: smaller ones for development test purpose

2. Information for each dataset column:

| Column | Shorter name* | Meaning | Data type | Required** | Additional info. |
|--------|--------|---------|-----------|-------------|--------|
| `domain` | `dm` | domain name | fixed strings | Y | -  |
| `cathpdb` | `cath` | CATH ID | 7 characters  | N | -  |
| `pdb`  | `pdb`  | PDB ID  | 4 characters | N | -  |
| `uniprot_acc` | `uacc` | Uniprot Accession number | ? | N | ? |
| `uniprot_id` | `uid` | Uniprot ID | ? | N | ? |
| `atom_number` | `anu` | atom number | integers | Y | |
| `atom_name` | `ana` | atom name | string: CA/CB | Y | |
| `residue_name` | `rna` | residue name | 3 characters, uppercase | Y | - |
| `IBS` | `ibs` | binding sites? | ? | N | ? |
| `chain_id` | `chain` | chain name | one character | ? | ? |
| `residue_number` | `rnu` | residue id/number | integers | Y | |
| `b_factor` | `bf` |  Bfactor of each atom | ? | N | |
| `sec_struc`| `ss` | secondary structure | one character: H/B/E/G/I/T/S/- (?) | Y | |
| `sec_struc_full`| `ssf` | ? | ? | ?| ? |
|`prot_block`| `pb` | ? | ? | ?| ? |
| `data_type`| `dt` | source database | fixed strings: cathpdb/alphafold (?) | Y | | 
|`Experimental Method` | `em` | experiment method for obtaining the structure? | strings | ? | |
| `resolution` | `rsl` | strcuture resolution | float numbers? | ? | |
| `convhull_vertex` | `cv` | convex hull flag  | bool: `True/False` | Y | |
| `protrusion` | `pro` | protrusion flag | bool: `True/False` | Y | |
| `is_hydrophobic_protrusion` | `hypro` | hydrophobic protrusion flag | bool: `True/False` | Y | |
| `is_co_insertable` | `coin` | co-insertable flag | bool: `True/False` | Y | |
|`neighboursList` | `nbl` | neighbour residue number list | string of numbers | N | |
| `density` | `den` | protein density | integer | N | |
| `exposition` | `expo` | exposition flag?  |  ? | ? | |
| `S35` | `s35` | Cath Cluster number at 35% of idendity  |  numbers | N | |
| `S60` | `s60` | Cath Cluster number at 60% of idendity  |  numbers | N | |
| `S95` | `s95` | Cath Cluster number at 95% of idendity  |  numbers | N | |
| `S100` | `s100` | Cath Cluster number at 100% of idendity  |  numbers | N | |
| `uniref50` | `u50` | Representative uniprot_acc for cluster with 50% of idendity |  string | N | |
| `uniref90` | `u90` | Representative uniprot_acc for cluster with 90% of idendity |  string | N | |
| `uniref100` | `u100` | Representative uniprot_acc for cluster with 100% of idendity |  string | N | |
| `residue_index` | `rin` | residue  index | number | Y | may be different from `residue_number` |   
| `origin` | `origin` | ? |  ? | ? | |
| `location` | `loc` | Location of the protein in the cell |  ? | ? | |
| `taxon` | `taxon` | ? |  ? | ? | |
```
* Shorter name: used in the website front-end source code for better readability/less memeory; all in lowercase
** Required: whether this value must be present 
```
