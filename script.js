window.addEventListener("load", () => {
    minesweeper.init();
});


const minesweeper = {

    logic: null,

    gameTypes : [
        {name: "small", size: 9, mines: 10},
        {name: "medium", size: 16, mines: 40},
        {name: "large", size: 24, mines: 150},
    ],

    size : 0,
    mines : 0,

    init(){
        this.logic = remoteLogic;
        this.bodyFunc(); 
        this.startGame("small");
    },


    bodyFunc(){
        const bodyElement = document.body;
        const contentElement = document.createElement("div");
        contentElement.classList.add("content");
        bodyElement.appendChild(contentElement);

        const header = this.headerFunc();
        contentElement.appendChild(header);

        const playfield = this.playfieldFunc();
        contentElement.appendChild(playfield);

        const buttonbar = this.buttonbarFunc();
        contentElement.appendChild(buttonbar);

        const footer = this.footerFunc();
        contentElement.appendChild(footer);
    },

    headerFunc(){
        const header = document.createElement("header");
        const headerDiv = document.createElement("div");
        header.appendChild(headerDiv);
        const heading1 = document.createElement("h1");
        headerDiv.appendChild(heading1);
        heading1.innerText = ("Minesweeper");
        const heading2 = document.createElement("h2");
        headerDiv.appendChild(heading2);
        heading2.innerText = ("Sude Elitok");
        return header;
    },

    footerFunc(){
        const footer = document.createElement("footer");
        const footerDiv = document.createElement("div");
        footer.appendChild(footerDiv);
        footer.innerHTML = ("&copy; 2025 by Sude Elitok");
        return footer;
    },

    playfieldFunc(){
        const playfieldDiv = document.createElement("div");
        playfieldDiv.id = "playfield";
        return playfieldDiv;
    },

    buttonbarFunc(){
        const buttonbarDiv = document.createElement("div");
        buttonbarDiv.id = "buttonbar";
        const smallButton = this.createButton("small", "Small");
        const mediumButton = this.createButton("medium", "Medium");
        const largeButton = this.createButton("large", "Large");

        buttonbarDiv.appendChild(smallButton);
        buttonbarDiv.appendChild(mediumButton);
        buttonbarDiv.appendChild(largeButton);

        smallButton.addEventListener("click", () => this.startGame("small"));
        mediumButton.addEventListener("click", () => this.startGame("medium"));
        largeButton.addEventListener("click", () => this.startGame("large"));
        return buttonbarDiv;
    },

    createButton(buttonId, label){
        const button = document.createElement("button");
        button.className = "button";
        button.id = buttonId;
        button.innerText = label;
        return button;
    },

    fillPlayground(size){
        const playfield = document.querySelector("#playfield");
        playfield.innerHTML = "";
        for(let row = 0; row < size; row++){
            for (let col = 0; col < size; col++){
                playfield.appendChild(this.generateCell(row, col));
            }
        }
    },

    generateCell(row, col){
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.classList.add("covered");
        cell.dataset.x = row;
        cell.dataset.y = col;
        cell.style.width = `calc((100% /  ${this.size}) - (2 * var(--shadowsize)))`;
        cell.style.height = `calc((100% /  ${this.size}) - (2 * var(--shadowsize)))`;
        
        cell.addEventListener("click", (event) => this.cellLeftClicked(event, cell));
        cell.addEventListener("contextmenu", (event) => this.cellRightClicked(event, cell));

        cell.addEventListener("touchstart", (event) => this.touchStart(event));
        cell.addEventListener("touchend", (event) => this.touchEnd(event, cell));
        return cell;
    },

    async startGame(gameType){
        for(const arg of this.gameTypes){
            if(arg.name === gameType){
                this.size = arg.size;
                this.mines = parseInt(arg.mines);
            }
        }

        this.fillPlayground(this.size);
        await this.logic.init(this.size, this.mines);
        
    },

    async cellLeftClicked(event, cell){
        event.preventDefault();
        x=cell.dataset.x;
        y=cell.dataset.y
        const clickedCell = await this.logic.sweep(x, y);
        if(clickedCell.minehit){
            clickedCell.mines.forEach((mine)=>{
                this.placeSymbol(mine.x, mine.y, 1, mine.minesAround);
            });
            const coloredCell = event.target;
            coloredCell.classList.add("mineHit");
            this.displayOverlay('You lose!');
        }
        else{
            if(clickedCell.minesAround === 0){
                this.placeSymbol(x, y, 0, 0);
                clickedCell.emptyCells.forEach((cell)=>{
                    this.placeSymbol(cell.x, cell.y, 0, cell.minesAround);
                });
            }
            else{
                this.placeSymbol(x, y, 0, clickedCell.minesAround);
            };
        }
        if(clickedCell.userwins){
            this.displayOverlay('Congrats! You win!');
        }
        console.log(clickedCell);
    },

    cellRightClicked(event, cell){
        event.preventDefault();
        const flagCell = event.target;
        flagCell.classList.toggle("f");
        console.dir(cell);
    },


    startMilliseconds: 0,
    endMilliseconds: 0,

    touchStart(event){
        this.startMilliseconds = new Date().getTime();
        event.preventDefault();
    },

    touchEnd(event, cell){
        this.endMilliseconds = new Date().getTime();
        const elapsedTime = this.endMilliseconds - this.startMilliseconds;
        if(elapsedTime < 500){
            this.cellLeftClicked(event, cell);
        }
        else{
            this.cellRightClicked(event, cell);
        }
    },

    displayOverlay(text){
        const overlay  = document.createElement("div");
        overlay.classList.add("overlay");
        const textHolder = document.createElement("div");
        textHolder.classList.add("textHolder");
        overlay.appendChild(textHolder);
        textHolder.innerText = text;
        const playfield = document.querySelector("#playfield");
        playfield.appendChild(overlay);
    },

    getCell(x, y){
        return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    },

   
    placeSymbol(x, y, mine, minesAround){
        const uncoveredCell = this.getCell(x, y);
        uncoveredCell.classList.remove("covered");
        uncoveredCell.classList.remove("f");

        if(mine){
            uncoveredCell.classList.add("m");
        }

        else {
            const emptyCells = undefined;
            console.dir(this.uncoveredCells);
            uncoveredCell.classList.add(`cellsymbol${minesAround}`);

        }
    }

};



const localLogic = {
    moveCounter: 0,
    gameSize: null,
    numOfMines: null,
    field: [],
    minehit: false,
    minesAround: 0,
    uncoveredCells: [],


    async init(size, mines){
        this.gameSize = size;
        this.numOfMines = mines;
        this.moveCounter = 0;
        this.uncoveredCells = [];

        alert(`New Game with ${this.gameSize}x${this.gameSize} and ${this.numOfMines} mines`);
        
        for(let i = 0; i < this.gameSize; i++){
            this.field[i] = [];
            for(let j = 0; j < this.gameSize; j++){
                this.field[i][j] = false;
            }
        }
    
    },

    async sweep(x, y){
        x = parseInt(x);
        y = parseInt(y);
        if(this.moveCounter === 0){
            this.placeMines(x, y);
        }
        this.moveCounter++;
        
        this.minehit = false;
        if(this.field[x][y] === true){
            this.minehit = true;
        }

        if(this.minehit === true){
            this.placeSymbol(x, y);
            return 1; //1 means this.minehit === true
        }
        else{
            const emptyCells = this.getEmptyCells(x, y, this.countMinesAround(x, y));
            console.dir(emptyCells);
            for (let cell of emptyCells) {
                this.placeSymbol(cell.x, cell.y); 
            }
            console.dir(this.placeSymbol(x, y));            
        }

        if (this.checkWin()) {
            return 2; //2 means user won the game
        }

        return 0;  //game goes on
    },


    placeMines(excludeX, excludeY){
        let minesPlaced = 0;
        while (minesPlaced < this.numOfMines) {
            const x = Math.floor(Math.random() * this.gameSize);
            const y = Math.floor(Math.random() * this.gameSize);
            if ((x !== excludeX || y !== excludeY) && this.field[x][y] === false && this.isSafeToPlaceMine(x, y, excludeX, excludeY)) {
                this.field[x][y] = true;
                minesPlaced++;
            }
        }
        console.dir(this.field);
    },

    isSafeToPlaceMine(x, y, excludeX, excludeY) {
        for (let i = excludeX - 1; i <= excludeX + 1; i++) {
            for (let j = excludeY - 1; j <= excludeY + 1; j++) {
                if (x === i && y === j) {
                    return false;
                }
            }
        }
        return true;
    },

    placeSymbol(x, y){
        const uncoveredCell = this.getCell(x, y);
        uncoveredCell.classList.remove("covered");
        uncoveredCell.classList.remove("f");

        if(this.minehit){
            uncoveredCell.classList.add("m");
        }

        else {
            this.minesAround = this.countMinesAround(x, y);

            if (!this.uncoveredCells.some(cell => cell.x === x && cell.y === y)) {
                this.uncoveredCells.push({ x: x, y: y });
            }

            if (this.minesAround) {
                const emptyCells = undefined;
                console.dir(this.uncoveredCells);
                uncoveredCell.classList.add(`cellsymbol${this.minesAround}`);
            } 
        }

        return uncoveredCell;
    },

    countMinesAround(x, y){
        let minesCount = 0;
        for(let i = x - 1; i <= x + 1; i++){
            for(let j = y - 1; j <= y + 1; j++){
                if(this.safeSize(i, j) && this.field[i][j] === true)
                    minesCount++;
            }
        }
        return minesCount;
    },

    getCell(x, y){
        return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    },

    getEmptyCells(x, y, minesAround0){
        let toDo = [{x: x, y: y, minesAround: minesAround0}];
        let done = [];

        if(minesAround0 !== 0){
            toDo.pop();
        }
        while(toDo.length){
            let current = toDo.pop();
            done.push(current);
            let neighbors = this.getNeighbors(current.x, current.y, current.minesAround);
            for(const n of neighbors){
                if(this.inlist(done, n)) continue;
                if(this.inlist(toDo, n)) continue;
                console.dir(n); ///
                if(n.minesAround){
                    done.push(n);
                }
                else{
                    toDo.push({x: n.x, y: n.y, minesAround: n.minesAround});
                }
            }    
        }
        return done;
    },

    getNeighbors(x, y) {
        let neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx !== 0 || dy !== 0){
                    let nX = x + dx;
                    let nY = y + dy;
                    if (this.safeSize(nX, nY) && this.field[nX][nY] === false) {
                        let nMinesAround = this.countMinesAround(nX, nY);
                        neighbors.push({ x: nX, y: nY, minesAround: nMinesAround });
                    }
                };
            }
        }
        console.dir(neighbors);
        return neighbors;
    },

    inlist(list, element){
        return list.some(e => e.x === element.x && e.y === element.y &&  e.minesAround === element.minesAround);
    },

    safeSize(i, j){
        return i >= 0 && i < this.gameSize && j >= 0 && j < this.gameSize;
    },

    checkWin() {
        return this.uncoveredCells.length === (this.gameSize * this.gameSize - this.numOfMines);
    },

    uncoverMines(size){
        for(let i = 0; i < size; i++){
            for(let j = 0; j < size; j++){
                if(this.field[i][j] === true)
                    this.placeSymbol(i, j);
            }
        }
    }
};

const remoteLogic = {
    
    serverURL: 'https://www2.hs-esslingen.de/~melcher/it/minesweeper/',
    token: null,

    async init(size, mines){
        const request = `?request=init&userid=suelit00&size=${size}&mines=${mines}`
        const initResponse = await this.fetchAndDecode(request);
        console.dir(initResponse);
        this.token = initResponse.token;
        console.dir(this.token);
    },

    async fetchAndDecode(request){
        return fetch(this.serverURL + request)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching data:', error);
                throw error;
            });
    },

    async sweep(x, y){
        x = parseInt(x);
        y = parseInt(y);
         
        const request = `?request=sweep&token=${this.token}&x=${x}&y=${y}`
        return this.fetchAndDecode(request);
    },
};





