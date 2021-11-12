#### Dataset Nots:
1. This folder contains the raw dataset for serving the website **PePr2DS**
- `[PePr2DS.csv](https://github.com/reuter-group/pepr2ds/blob/main/Ressources/datasets/PePr2DS.csv)`: the complete dataset 
- `4ekuA03.csv` and `CB.csv`: smaller ones for development test purpose

2. The meaning of each dataset column and their re-names in the code (for performance concern) is as follows:

| Column | Rename | Meaning | Data type | Other info. |
|--------|--------|---------|-----------|-------------|
| `domain` | `dm` | domain name | fixed strings |  -  |
| `cathpdb` | `cath` | CATH ID | 7 characters  | -  |
| `pdb`  | `pdb`  | PDB ID  | 4 characters | -  |

```
1. `domain` -> `dm`: domain name
2. `cathpdb` -> `cath`: cath ID, 7 characters
3. `pdb`: pdb ID, 4 characters
4. `uniprot_acc` -> `uacc`: 
5. `uniprot_id` -> `uid`:
6. `residue_name` -> `rname`: residue name, 3 characters 
7. `IBS` -> `ibs`:
8. `chain_id` -> `chain`: chain ID, one character(?)
9. `residue_number` -> `rnum`: residue number 
10. `b_factor` -> `bf`: b-factor 
11. `sec_struc` -> `ss`: secondary structure, one character
12. `sec_struc_full` -> `ssf`: ?
13. `prot_block` -> `prot`: ?
14. `data_type`
Experimental Method
resolution
RSA_total_freesasa_tien
convhull_vertex
protrusion
is_hydrophobic_protrusion
is_co_insertable,
neighboursList
density
exposition
S35
S60
S95
S100
uniref50
uniref90
uniref100
origin
location
taxon
```