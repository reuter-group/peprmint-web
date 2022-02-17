[![NodeJS with Webpack](https://github.com/reuter-group/peprmint-web/actions/workflows/webpack.yml/badge.svg)](https://github.com/reuter-group/peprmint-web/actions/workflows/webpack.yml)


[<img width="600" alt="image" src="https://user-images.githubusercontent.com/5687628/124143879-c5df7f00-da8b-11eb-9add-2c3f20337dfa.png">](https://reuter-group.github.io/peprmint)


## Build:
Assume you've [installed `node` and `npm`](https://nodejs.org/en/), and downloaded the source code:
```bash
$ cd web-client/ 

$ npm install  # install the dependencies, only needed for the first time

## run a development server on your local machine: 
$ npx webpack serve  # this will automatically reload the server after any file modifications

## then visit the webpage at: 
## http://localhost:8080
```

## Development plan:
### V1.0
- [x] display the information of each protrusion in a proper way/interactive design
- [x] auto-deploy script added

### V1.1
 - [x] visualize edges for convex hull (and thus co-insertables), related to [#3](/../../issues/3)
 - [x] re-calculate for user selected sequence/chains, related to [#2](/../../issues/2)
 - [x] support download of domains from CATH, [#1](/../../issues/1)
 
### V1.2
- [x] update logo, name (PePr^2Vis), and page layout
- [x] add neighborhood information

### V1.3
- [x] add PePr^2DS beta version

### V1.4
- [ ] more features/optmization for PePr^2DS: [issue #5](https://github.com/reuter-group/peprmint-web/issues/5)
- [ ] documentation  
- [ ] choose a license
- [ ] migrate website URL (to affiliated institute domain)


## Other notes:

- Environment set-up for running [python API](https://github.com/reuter-group/peprmint-web/blob/main/protrusion_for_dandan.py) (contributed by [Thibault Tubiana](https://github.com/tubiana))
```
$ conda env create -f peprmint-web_conda_env.txt  # on Mac
```

- the nice PePrMInt logo is credited to: [Emmanuel Moutoussamy](https://www.uib.no/en/persons/Emmanuel.Edouard.Moutoussamy)
